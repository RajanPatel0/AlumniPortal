import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedStaff } from '@/lib/auth/staff-auth';
import { StaffRole } from '@prisma/client';
import { ensureAcademicOptionActive } from '@/lib/academic-options';

export async function POST(req: NextRequest) {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (staff.role !== StaffRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { type, sourceValues, targetValue } = body;

    if (!type || !Array.isArray(sourceValues) || sourceValues.length === 0 || !targetValue?.trim()) {
      return NextResponse.json(
        { error: 'Invalid parameters. Require type, sourceValues array, and targetValue.' },
        { status: 400 }
      );
    }

    const canonicalTarget = targetValue.trim();
    const field = type === 'BRANCH' ? 'branch' : 'course';

    // Ensure the target value is active in AcademicOption table
    await ensureAcademicOptionActive(type, canonicalTarget);

    // Perform updates in transaction and clear needsReview flag
    const [alumniResult, requestResult] = await prisma.$transaction([
      prisma.alumni.updateMany({
        where: {
          [field]: { in: sourceValues },
        },
        data: {
          [field]: canonicalTarget,
          needsReview: false, // Target is now canonical
        },
      }),
      prisma.registrationRequest.updateMany({
        where: {
          [field]: { in: sourceValues },
        },
        data: {
          [field]: canonicalTarget,
          needsReview: false, // Target is now canonical
        },
      }),
    ]);

    return NextResponse.json({
      message: `Successfully merged ${alumniResult.count} alumni rows and ${requestResult.count} registration requests into "${canonicalTarget}".`,
      alumniUpdated: alumniResult.count,
      requestsUpdated: requestResult.count,
    });
  } catch (error) {
    console.error('[ADMIN_NORMALIZE_MERGE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
