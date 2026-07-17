import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getAuthenticatedStaff,
  resolveCampusScope,
  batchCampusWhere,
  CampusScopeError,
} from '@/lib/auth/staff-auth';

type DisplayInviteStatus = 'PENDING' | 'INVITED' | 'REGISTERED';

function computeDisplayInviteStatus(
  batchStatus: string,
  alumni: Array<{ inviteStatus: string; isRegistered: boolean }>
): DisplayInviteStatus {
  if (
    alumni.length > 0 &&
    alumni.every((a) => a.isRegistered || a.inviteStatus === 'REGISTERED')
  ) {
    return 'REGISTERED';
  }
  return batchStatus === 'INVITED' ? 'INVITED' : 'PENDING';
}

export async function GET(req: NextRequest) {
  const staff = await getAuthenticatedStaff();
  if (!staff) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const label = searchParams.get('label')?.trim() || '';
  const status = (searchParams.get('status') || 'ALL').toUpperCase();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(50, Math.max(5, parseInt(searchParams.get('limit') || '10', 10)));
  const skip = (page - 1) * limit;

  let scopedCampusId: string | null;
  try {
    scopedCampusId = resolveCampusScope(staff, searchParams.get('campusId'));
  } catch (err) {
    if (err instanceof CampusScopeError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }

  const where: Record<string, unknown> = {
    ...batchCampusWhere(scopedCampusId),
  };
  if (label) {
    where.label = { contains: label };
  }
  if (status === 'PENDING') {
    where.status = { in: ['PROCESSING', 'UPLOADED'] };
  } else if (status === 'COMPLETED') {
    where.status = 'INVITED';
  }

  const [batches, total] = await Promise.all([
    prisma.invitationBatch.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            alumni: scopedCampusId
              ? { where: { campusId: scopedCampusId } }
              : true,
          },
        },
        alumni: {
          where: scopedCampusId ? { campusId: scopedCampusId } : undefined,
          select: {
            inviteStatus: true,
            isRegistered: true,
            campusId: true,
            campus: { select: { id: true, name: true } },
          },
        },
        createdBy: {
          select: { name: true, role: true },
        },
      },
    }),
    prisma.invitationBatch.count({ where }),
  ]);

  const data = batches.map((batch) => {
    const campusName =
      batch.alumni.find((a) => a.campus)?.campus?.name ?? null;

    return {
      invitedCount: batch.alumni.filter(
        (a) => a.inviteStatus === 'INVITED' || a.inviteStatus === 'REGISTERED'
      ).length,
      id: batch.id,
      label: batch.label,
      csvFilename: batch.csvFilename,
      totalCount: scopedCampusId ? batch._count.alumni : batch.totalCount,
      sentCount: batch.sentCount,
      failedCount: batch.failedCount,
      dbStatus: batch.status,
      inviteStatus: computeDisplayInviteStatus(batch.status, batch.alumni),
      alumniCount: batch._count.alumni,
      campusName,
      createdAt: batch.createdAt,
      completedAt: batch.completedAt,
    };
  });

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    scope: {
      role: staff.role,
      campusId: scopedCampusId,
      campusName: staff.campus?.name ?? null,
    },
  });
}

