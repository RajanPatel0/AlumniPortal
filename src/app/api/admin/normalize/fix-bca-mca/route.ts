import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedStaff } from '@/lib/auth/staff-auth';
import { StaffRole } from '@prisma/client';
import { isBcaOrMca, checkAcademicNeedsReview } from '@/lib/academic-options';

export async function POST(req: NextRequest) {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (staff.role !== StaffRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // 1. Fetch candidate Alumni rows
    const candidateAlumni = await prisma.alumni.findMany({
      where: {
        course: { not: null },
      },
      select: {
        id: true,
        branch: true,
        course: true,
      },
    });

    const targetAlumni = candidateAlumni.filter((a) => {
      const courseIsBcaMca = isBcaOrMca(a.course);
      const branchIsComputerApps = (a.branch || '').trim().toLowerCase() === 'computer applications';
      return courseIsBcaMca && !branchIsComputerApps;
    });

    // 2. Fetch candidate RegistrationRequest rows
    const candidateRequests = await prisma.registrationRequest.findMany({
      where: {
        course: { not: null },
        status: 'PENDING',
      },
      select: {
        id: true,
        branch: true,
        course: true,
      },
    });

    const targetRequests = candidateRequests.filter((r) => {
      const courseIsBcaMca = isBcaOrMca(r.course);
      const branchIsComputerApps = (r.branch || '').trim().toLowerCase() === 'computer applications';
      return courseIsBcaMca && !branchIsComputerApps;
    });

    const targetAlumniIds = targetAlumni.map((a) => a.id);
    const targetRequestIds = targetRequests.map((r) => r.id);

    let alumniUpdatedCount = 0;
    let requestUpdatedCount = 0;

    if (targetAlumniIds.length > 0) {
      const res = await prisma.alumni.updateMany({
        where: { id: { in: targetAlumniIds } },
        data: {
          branch: 'Computer Applications',
          needsReview: false,
        },
      });
      alumniUpdatedCount = res.count;
    }

    if (targetRequestIds.length > 0) {
      const res = await prisma.registrationRequest.updateMany({
        where: { id: { in: targetRequestIds } },
        data: {
          branch: 'Computer Applications',
          needsReview: false,
        },
      });
      requestUpdatedCount = res.count;
    }

    return NextResponse.json({
      message: `Successfully corrected ${alumniUpdatedCount} alumni rows and ${requestUpdatedCount} registration requests to branch "Computer Applications".`,
      alumniUpdated: alumniUpdatedCount,
      requestsUpdated: requestUpdatedCount,
    });
  } catch (error) {
    console.error('[ADMIN_NORMALIZE_FIX_BCA_MCA]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
