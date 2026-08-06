import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getAuthenticatedStaff,
  resolveCampusScope,
  batchCampusWhere,
  CampusScopeError,
} from '@/lib/auth/staff-auth';

type DisplayInviteStatus = 'PENDING' | 'INVITED' | 'REGISTERED';

// Derived purely from per-alumnus aggregate counts, never from the raw batch.status
// enum: a single-alumnus reminder only touches one row's inviteStatus, so basing
// this on batch.status would mislabel the whole batch after just one reminder.
function computeDisplayInviteStatus(
  totalCount: number,
  registeredCount: number,
  contactedCount: number // isRegistered || inviteStatus in INVITED/REGISTERED/BOUNCED
): DisplayInviteStatus {
  if (totalCount === 0) return 'PENDING';
  if (registeredCount === totalCount) return 'REGISTERED';
  if (contactedCount === totalCount) return 'INVITED';
  return 'PENDING';
}

export async function GET(req: NextRequest) {
  const staff = await getAuthenticatedStaff();
  if (!staff) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const modules = Array.isArray(staff.modules) ? (staff.modules as string[]) : [];
  if (staff.role !== 'ADMIN' && !modules.includes('import')) {
    return NextResponse.json({ error: 'Forbidden: Access denied to import module' }, { status: 403 });
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
        // Just one representative row for the campus name — batches target a single
        // campus, so no need to pull every alumnus to find one with a campus set.
        alumni: {
          where: scopedCampusId ? { campusId: scopedCampusId } : undefined,
          take: 1,
          select: {
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

  const batchIds = batches.map((b) => b.id);
  const statusGroups = batchIds.length
    ? await prisma.alumni.groupBy({
        by: ['batchId', 'inviteStatus', 'isRegistered'],
        where: {
          batchId: { in: batchIds },
          ...(scopedCampusId ? { campusId: scopedCampusId } : {}),
        },
        _count: { _all: true },
      })
    : [];

  const statsByBatch = new Map<
    string,
    { total: number; registered: number; contacted: number; invitedOrRegistered: number; sent: number; failed: number }
  >();
  for (const group of statusGroups) {
    if (!group.batchId) continue;
    const stats =
      statsByBatch.get(group.batchId) ??
      { total: 0, registered: 0, contacted: 0, invitedOrRegistered: 0, sent: 0, failed: 0 };
    stats.total += group._count._all;
    const isRegisteredState = group.isRegistered || group.inviteStatus === 'REGISTERED';
    if (isRegisteredState) stats.registered += group._count._all;
    if (isRegisteredState || group.inviteStatus === 'INVITED') {
      stats.invitedOrRegistered += group._count._all;
    }
    if (group.inviteStatus === 'INVITED' || isRegisteredState) {
      stats.sent += group._count._all;
    }
    if (group.inviteStatus === 'BOUNCED') {
      stats.failed += group._count._all;
    }
    if (isRegisteredState || group.inviteStatus === 'INVITED' || group.inviteStatus === 'BOUNCED') {
      stats.contacted += group._count._all;
    }
    statsByBatch.set(group.batchId, stats);
  }

  const data = batches.map((batch) => {
    const campusName = batch.alumni[0]?.campus?.name ?? null;
    const stats =
      statsByBatch.get(batch.id) ?? { total: 0, registered: 0, contacted: 0, invitedOrRegistered: 0, sent: 0, failed: 0 };

    return {
      invitedCount: stats.invitedOrRegistered,
      id: batch.id,
      label: batch.label,
      csvFilename: batch.csvFilename,
      totalCount: scopedCampusId ? batch._count.alumni : batch.totalCount,
      sentCount: stats.sent,
      failedCount: stats.failed,
      dbStatus: batch.status,
      inviteStatus: computeDisplayInviteStatus(stats.total, stats.registered, stats.contacted),
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

