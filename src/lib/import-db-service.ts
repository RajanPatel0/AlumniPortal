import { prisma } from '@/lib/prisma';
import { AlumniImportRow, ImportResult } from '@/types/alumni-import';
import { validateEmail, validateBatchYear } from './import-utils';
import { nanoid } from 'nanoid';

const UPSERT_CHUNK_SIZE = 100;

type NormalizedImportRecord = {
  name: string;
  email: string;
  originalInvitedEmail: string;
  batchYear: number;
  branch: string;
  college: string;
  course: string | null;
  enrollmentNo: string | null;
  phone: string | null;
  inviteToken: string;
  inviteStatus: 'PENDING';
  isRegistered: false;
  importedById: string;
  batchId: string;
  campusId: string;
};

export async function processImportBatch(
  rows: AlumniImportRow[],
  batchLabel: string,
  adminId: string,
  fileName: string,
  campusId: string
): Promise<ImportResult> {
  const result: ImportResult = {
    success: 0,
    failed: 0,
    errors: [],
    batchId: '',
  };

  // 1. Create batch record
  const batch = await prisma.invitationBatch.create({
    data: {
      label: batchLabel.trim(),
      csvFilename: fileName,
      totalCount: rows.length,
      status: 'PROCESSING',
      createdById: adminId,
    },
  });
  result.batchId = batch.id;

  // 2. Prepare valid records and collect errors
  const validRecords: NormalizedImportRecord[] = [];
  const seenEmails = new Set<string>();
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-indexed + header row
    let isValid = true;
    let errorReason = '';

    // Validate name
    if (!row.name?.trim()) {
      isValid = false;
      errorReason = 'Missing name';
    }
    // Validate email
    else if (!row.email?.trim()) {
      isValid = false;
      errorReason = 'Missing email';
    }
    else if (!validateEmail(row.email)) {
      isValid = false;
      errorReason = 'Invalid email format';
    }
    const normalizedEmail = (row.email || '').trim().toLowerCase();
    if (isValid && normalizedEmail && seenEmails.has(normalizedEmail)) {
      isValid = false;
      errorReason = 'Duplicate email in import file';
    }
    // Validate batch year
    const batchYear = validateBatchYear(row.batch_year);
    if (!batchYear) {
      isValid = false;
      errorReason = 'Invalid or missing batch year';
    }
    // Validate branch
    else if (!row.branch?.trim()) {
      isValid = false;
      errorReason = 'Missing branch';
    }
    // Validate college
    else if (!row.college?.trim()) {
      isValid = false;
      errorReason = 'Missing college';
    }

    if (!isValid) {
      result.failed++;
      result.errors.push({
        row: rowNum,
        email: row.email || '(missing)',
        reason: errorReason,
      });
      continue;
    }

    // Valid record – prepare for bulk insert
    validRecords.push({
      name: row.name.trim(),
      email: normalizedEmail,
      originalInvitedEmail: normalizedEmail,
      batchYear: batchYear!,
      branch: row.branch.trim(),
      college: row.college.trim(),
      course: row.course?.trim() || null,
      enrollmentNo: row.enrollment_no?.trim() || null,
      phone: row.phone?.trim() || null,
      inviteToken: nanoid(32),
      inviteStatus: 'PENDING',
      isRegistered: false,
      importedById: adminId,
      batchId: batch.id,
      campusId: campusId,
    });
    seenEmails.add(normalizedEmail);
  }

  // 3. Bulk upsert in chunks for scalability
  if (validRecords.length) {
    try {
      for (let i = 0; i < validRecords.length; i += UPSERT_CHUNK_SIZE) {
        const chunk = validRecords.slice(i, i + UPSERT_CHUNK_SIZE);
        await prisma.$transaction(
          chunk.map((record) =>
            prisma.alumni.upsert({
              where: { email: record.email },
              update: {
                name: record.name,
                batchYear: record.batchYear,
                branch: record.branch,
                college: record.college,
                course: record.course,
                enrollmentNo: record.enrollmentNo,
                phone: record.phone,
                batchId: batch.id,
                importedById: adminId,
              } as any,
              create: record as any,
            })
          )
        );
      }
      result.success = validRecords.length;
    } catch (err) {
      await prisma.invitationBatch.update({
        where: { id: batch.id },
        data: {
          status: 'FAILED' as any,
        },
      });
      throw err;
    }
  }

  // 4. Update batch status
  await prisma.invitationBatch.update({
    where: { id: batch.id },
    data: {
      sentCount: 0,
      failedCount: 0,
      status: 'UPLOADED' as any,
      completedAt: new Date(),
    },
  });

  return result;
}