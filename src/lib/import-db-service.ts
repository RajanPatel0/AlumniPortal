import { prisma } from '@/lib/prisma';
import { AlumniImportRow, ImportResult } from '@/types/alumni-import';
import { validateEmail, validateBatchYear } from './import-utils';
import { checkAcademicNeedsReview, getAutoCorrectedBranch } from './academic-options';
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
  affiliatedCollegeId: string | null;
  needsReview: boolean;
};

export interface ImportBatchOptions {
  isAffiliated?: boolean;
  affiliatedCollegeId?: string | null;
  customCollegeName?: string | null;
}

export async function processImportBatch(
  rows: AlumniImportRow[],
  batchLabel: string,
  adminId: string,
  fileName: string,
  targetCampusId: string,
  options: ImportBatchOptions = {}
): Promise<ImportResult> {
  const result: ImportResult = {
    success: 0,
    failed: 0,
    errors: [],
    batchId: '',
  };

  // 1. Fetch campuses and affiliated colleges for resolution
  const allCampuses = await prisma.campus.findMany();
  const mainCampus = allCampuses.find((c) => c.code === 'main') || allCampuses[0];
  const targetCampus = allCampuses.find((c) => c.id === targetCampusId) || mainCampus;
  const allAffiliated = await prisma.affiliatedCollege.findMany();

  // 2. Create batch record
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

  // 3. Prepare valid records and collect errors
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

    if (!isValid) {
      result.failed++;
      result.errors.push({
        row: rowNum,
        email: row.email || '(missing)',
        reason: errorReason,
      });
      continue;
    }

    // Determine row campus, college, and affiliated college ID
    let rowCampusId = targetCampusId;
    let rowCollegeName = (row.college || '').trim();
    let rowAffiliatedCollegeId: string | null = null;
    let rowForceNeedsReview = false;

    if (options.isAffiliated) {
      rowCampusId = mainCampus.id;
      if (options.affiliatedCollegeId) {
        const aff = allAffiliated.find((a) => a.id === options.affiliatedCollegeId);
        if (aff) {
          rowCollegeName = aff.name;
          rowAffiliatedCollegeId = aff.id;
          if (!aff.isApproved) rowForceNeedsReview = true;
        }
      } else if (options.customCollegeName?.trim()) {
        const trimmedCustom = options.customCollegeName.trim();
        const campusMatch = allCampuses.find(
          (c) => c.name.toLowerCase() === trimmedCustom.toLowerCase() || c.code.toLowerCase() === trimmedCustom.toLowerCase()
        );
        if (campusMatch) {
          rowCampusId = campusMatch.id;
          rowCollegeName = campusMatch.name;
          rowAffiliatedCollegeId = null;
        } else {
          let aff = allAffiliated.find((a) => a.name.toLowerCase() === trimmedCustom.toLowerCase());
          if (!aff) {
            aff = await prisma.affiliatedCollege.create({
              data: {
                name: trimmedCustom,
                isApproved: false,
                requestedBy: `Import Batch: ${batchLabel}`,
              },
            });
            allAffiliated.push(aff);
          }
          rowCollegeName = aff.name;
          rowAffiliatedCollegeId = aff.id;
          if (!aff.isApproved) rowForceNeedsReview = true;
        }
      }
    } else {
      // Standard Constituent Campus Batch Import
      // Always enforce the batch's targetCampusId selected by admin!
      rowCampusId = targetCampusId;

      if (rowCollegeName) {
        // If CSV college text matches an existing Campus, use canonical Campus.name
        const campusMatch = allCampuses.find(
          (c) => c.name.toLowerCase() === rowCollegeName.toLowerCase() || c.code.toLowerCase() === rowCollegeName.toLowerCase()
        );
        if (campusMatch) {
          rowCampusId = campusMatch.id; // Auto-align if row explicitly names another campus
          rowCollegeName = campusMatch.name;
        } else {
          // Keep raw CSV college text string as provided, without auto-creating pending affiliated colleges by default
          rowCollegeName = row.college.trim();
        }
      } else {
        // If no college text in CSV, set to target campus name
        rowCollegeName = targetCampus.name;
      }
      rowAffiliatedCollegeId = null;
    }

    // Auto-correct branch to "Computer Applications" if course is BCA or MCA
    const finalBranch = getAutoCorrectedBranch(row.branch, row.course);
    const finalCourse = row.course?.trim() || null;

    const academicNeedsReview = await checkAcademicNeedsReview(finalBranch, finalCourse);
    const needsReview = academicNeedsReview || rowForceNeedsReview;

    if (needsReview) {
      result.reviewFlaggedCount = (result.reviewFlaggedCount || 0) + 1;
    }

    validRecords.push({
      name: row.name.trim(),
      email: normalizedEmail,
      originalInvitedEmail: normalizedEmail,
      batchYear: batchYear!,
      branch: finalBranch,
      college: rowCollegeName,
      course: finalCourse,
      enrollmentNo: row.enrollment_no?.trim() || null,
      phone: row.phone?.trim() || null,
      inviteToken: nanoid(32),
      inviteStatus: 'PENDING',
      isRegistered: false,
      importedById: adminId,
      batchId: batch.id,
      campusId: rowCampusId,
      affiliatedCollegeId: rowAffiliatedCollegeId,
      needsReview,
    });
    seenEmails.add(normalizedEmail);
  }

  // 4. Bulk upsert in chunks
  if (validRecords.length) {
    try {
      for (let i = 0; i < validRecords.length; i += UPSERT_CHUNK_SIZE) {
        const chunk = validRecords.slice(i, i + UPSERT_CHUNK_SIZE);

        for (const record of chunk) {
          const existing = await prisma.alumni.findUnique({
            where: { email: record.email },
            select: { id: true, campusId: true, email: true },
          });

          console.log(`[IMPORT_UPSERT] Email: ${record.email} | Operation: ${existing ? 'UPDATE' : 'CREATE'} | Old CampusId: ${existing?.campusId || 'N/A'} -> New CampusId: ${record.campusId} | College: ${record.college}`);

          await prisma.alumni.upsert({
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
              campusId: record.campusId,
              affiliatedCollegeId: record.affiliatedCollegeId,
              needsReview: record.needsReview,
            },
            create: {
              name: record.name,
              email: record.email,
              originalInvitedEmail: record.originalInvitedEmail,
              batchYear: record.batchYear,
              branch: record.branch,
              college: record.college,
              course: record.course,
              enrollmentNo: record.enrollmentNo,
              phone: record.phone,
              inviteToken: record.inviteToken,
              inviteStatus: record.inviteStatus,
              isRegistered: record.isRegistered,
              importedById: record.importedById,
              batchId: record.batchId,
              campusId: record.campusId,
              affiliatedCollegeId: record.affiliatedCollegeId,
              needsReview: record.needsReview,
            },
          });
        }
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

  // 5. Update batch status
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