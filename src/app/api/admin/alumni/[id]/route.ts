import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getAuthenticatedStaff,
  resolveCampusScope,
  CampusScopeError,
} from '@/lib/auth/staff-auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const staff = await getAuthenticatedStaff();
  if (!staff) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const modules = Array.isArray(staff.modules) ? (staff.modules as string[]) : [];
  if (staff.role !== 'ADMIN' && !modules.includes('alumni')) {
    return NextResponse.json({ error: 'Forbidden: Access denied to alumni module' }, { status: 403 });
  }

  const { id } = await params;

  // Find alumni first to verify existence and check campus scope
  const alumni = await prisma.alumni.findUnique({
    where: { id },
  });

  if (!alumni) {
    return NextResponse.json({ error: 'Alumni not found' }, { status: 404 });
  }

  // Campus scope enforcement
  try {
    const scopedCampusId = resolveCampusScope(staff, alumni.campusId);
    if (scopedCampusId && alumni.campusId !== scopedCampusId) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to delete alumni from this campus' }, { status: 403 });
    }
  } catch (err) {
    if (err instanceof CampusScopeError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }

  try {
    // Perform delete in a transaction to handle manual cascades if any
    await prisma.$transaction([
      // Delete RSVPs
      prisma.rsvp.deleteMany({
        where: { alumniId: id },
      }),
      // Set alumniId to null in EmailLogs (to preserve the log records)
      prisma.emailLog.updateMany({
        where: { alumniId: id },
        data: { alumniId: null },
      }),
      // Delete the alumni
      prisma.alumni.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json({ success: true, message: 'Alumni deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting alumni:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete alumni' },
      { status: 500 }
    );
  }
}
