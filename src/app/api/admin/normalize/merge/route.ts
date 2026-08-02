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
    const fieldName = type === 'BRANCH' ? 'branch' : 'course';

    // Ensure the target value is active in AcademicOption table
    await ensureAcademicOptionActive(type, canonicalTarget);

    // 1. Collect affected IDs before updating for audit logging
    const matchingAlumni = await prisma.alumni.findMany({
      where: { [fieldName]: { in: sourceValues } },
      select: { id: true },
    });
    const matchingRequests = await prisma.registrationRequest.findMany({
      where: { [fieldName]: { in: sourceValues } },
      select: { id: true },
    });

    const affectedIds = [
      ...matchingAlumni.map((a) => `alumni:${a.id}`),
      ...matchingRequests.map((r) => `req:${r.id}`),
    ];

    // 2. Perform updates and write merge log in a transaction
    const { alumniResult, requestResult } = await prisma.$transaction(
      async (tx) => {
        const alumniResult = await tx.alumni.updateMany({
          where: {
            [fieldName]: { in: sourceValues },
          },
          data: {
            [fieldName]: canonicalTarget,
            needsReview: false,
          },
        });

        const requestResult = await tx.registrationRequest.updateMany({
          where: {
            [fieldName]: { in: sourceValues },
          },
          data: {
            [fieldName]: canonicalTarget,
            needsReview: false,
          },
        });

        await tx.normalizationMergeLog.create({
          data: {
            field: fieldName,
            fromValues: JSON.stringify(sourceValues),
            toValue: canonicalTarget,
            affectedIds: JSON.stringify(affectedIds),
            performedBy: staff.email || staff.id,
          },
        });

        return { alumniResult, requestResult };
      },
      { timeout: 30000 }
    );

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
