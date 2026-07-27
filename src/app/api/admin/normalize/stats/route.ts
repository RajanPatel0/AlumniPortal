import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedStaff } from '@/lib/auth/staff-auth';
import { StaffRole } from '@prisma/client';
import { isBcaOrMca } from '@/lib/academic-options';

export async function GET(req: NextRequest) {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (staff.role !== StaffRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // 1. Group by branch in Alumni
    const branchGroups = await prisma.alumni.groupBy({
      by: ['branch'],
      _count: { id: true },
      orderBy: { branch: 'asc' },
    });

    // 2. Group by course in Alumni
    const courseGroups = await prisma.alumni.groupBy({
      by: ['course'],
      _count: { id: true },
      orderBy: { course: 'asc' },
    });

    // 3. Find BCA/MCA rows where branch is not "Computer Applications"
    // Fetch candidates where course is present
    const candidateAlumni = await prisma.alumni.findMany({
      where: {
        course: { not: null },
      },
      select: {
        id: true,
        name: true,
        email: true,
        batchYear: true,
        branch: true,
        course: true,
        needsReview: true,
        campus: { select: { name: true } },
      },
      orderBy: [{ batchYear: 'asc' }, { name: 'asc' }],
    });

    const bcaMcaMismatchRows = candidateAlumni.filter((a) => {
      const courseIsBcaMca = isBcaOrMca(a.course);
      const branchIsComputerApps = (a.branch || '').trim().toLowerCase() === 'computer applications';
      return courseIsBcaMca && !branchIsComputerApps;
    });

    // 4. Fetch needsReview rows (Alumni and RegistrationRequest)
    const [needsReviewAlumni, needsReviewRequests] = await Promise.all([
      prisma.alumni.findMany({
        where: { needsReview: true },
        select: {
          id: true,
          name: true,
          email: true,
          batchYear: true,
          branch: true,
          course: true,
          currentCompany: true,
          campus: { select: { name: true } },
        },
        orderBy: [{ name: 'asc' }],
      }),
      prisma.registrationRequest.findMany({
        where: { needsReview: true, status: 'PENDING' },
        select: {
          id: true,
          name: true,
          email: true,
          batchYear: true,
          branch: true,
          course: true,
          currentCompany: true,
          campus: { select: { name: true } },
        },
        orderBy: [{ name: 'asc' }],
      }),
    ]);

    // 5. Active academic options
    const activeOptions = await prisma.academicOption.findMany({
      where: { isActive: true },
      orderBy: { value: 'asc' },
    });

    return NextResponse.json({
      branches: branchGroups.map((g) => ({ branch: g.branch || '(Blank)', count: g._count.id })),
      courses: courseGroups.map((g) => ({ course: g.course || '(Blank)', count: g._count.id })),
      bcaMcaMismatchCount: bcaMcaMismatchRows.length,
      bcaMcaMismatchRows,
      needsReviewAlumni,
      needsReviewRequests,
      activeOptions,
    });
  } catch (error) {
    console.error('[ADMIN_NORMALIZE_STATS]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
