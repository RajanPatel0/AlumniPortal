import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';
import { parseFile } from '@/lib/parse-import-file';
import { processImportBatch } from '@/lib/import-db-service';
import { isValidFileType } from '@/lib/import-utils';

export async function POST(req: NextRequest) {
  // 1. Authenticate and get staff details
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let staff;
  try {
    const payload = verifyAccessToken(accessToken);
    staff = await prisma.staff.findUnique({
      where: { id: payload.id },
      include: { campus: true }, // get campus relation for sub-admin
    });
    if (!staff) throw new Error('Staff not found');

    const modules = Array.isArray(staff.modules) ? (staff.modules as string[]) : [];
    if (staff.role !== 'ADMIN' && !modules.includes('import')) {
      return NextResponse.json({ error: 'Forbidden: Access denied to import module' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  // 2. Parse multipart form
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const batchLabel = formData.get('batchLabel') as string | null;
  const campusId = formData.get('campusId') as string | null; // only sent by admin

  // Validate file and batch label
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  if (!batchLabel?.trim()) {
    return NextResponse.json({ error: 'Batch label is required' }, { status: 400 });
  }
  if (!isValidFileType(file.name)) {
    return NextResponse.json({ error: 'Only .csv, .xlsx, .xls files are allowed' }, { status: 400 });
  }

  // 3. Determine target campus ID
  let targetCampusId: string;
  if (staff.role === 'ADMIN') {
    if (!campusId) {
      return NextResponse.json({ error: 'Campus selection is required for admin' }, { status: 400 });
    }
    const campus = await prisma.campus.findUnique({ where: { id: campusId } });
    if (!campus) {
      return NextResponse.json({ error: 'Invalid campus selected' }, { status: 400 });
    }
    targetCampusId = campusId;
  } else {
    // SUB_ADMIN or COORDINATOR must have a campus assigned
    if (!staff.campusId) {
      return NextResponse.json({ error: 'Your account is not linked to any campus' }, { status: 403 });
    }
    targetCampusId = staff.campusId;
  }

  // 4. Parse file
  let rows;
  try {
    rows = await parseFile(file);
  } catch (err: any) {
    return NextResponse.json({ error: `File parsing failed: ${err.message}` }, { status: 400 });
  }

  if (!rows.length) {
    return NextResponse.json({ error: 'File contains no valid data rows' }, { status: 400 });
  }

  // 5. Process import – pass campusId to the batch processor
  try {
    const result = await processImportBatch(
      rows,
      batchLabel,
      staff.id,      // adminId
      file.name,
      targetCampusId // new parameter
    );
    return NextResponse.json({
      message: `Import completed. ${result.success} inserted, ${result.failed} failed.`,
      result,
    });
  } catch (err: any) {
    console.error('[IMPORT_ALUMNI]', err);
    return NextResponse.json({ error: 'Database error during import', details: err.message }, { status: 500 });
  }
}