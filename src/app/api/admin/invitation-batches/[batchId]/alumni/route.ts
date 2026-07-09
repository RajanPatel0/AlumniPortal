import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getAuthenticatedStaff,
  resolveCampusScope,
  assertBatchCampusAccess,
  CampusScopeError,
} from '@/lib/auth/staff-auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const staff = await getAuthenticatedStaff();
  if (!staff) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { batchId } = await params;
  const { searchParams } = new URL(req.url);
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

  const hasAccess = await assertBatchCampusAccess(batchId, scopedCampusId);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  }

  const where: Record<string, unknown> = { batchId };
  if (scopedCampusId) {
    where.campusId = scopedCampusId;
  }
  if (status === 'PENDING') {
    where.inviteStatus = 'PENDING';
    where.isRegistered = false;
  } else if (status === 'INVITED') {
    where.inviteStatus = 'INVITED';
    where.isRegistered = false;
  } else if (status === 'REGISTERED') {
    where.isRegistered = true;
  }

  const [rows, total] = await Promise.all([
    prisma.alumni.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        batchYear: true,
        branch: true,
        college: true,
        course: true,
        enrollmentNo: true,
        phone: true,
        inviteStatus: true,
        isRegistered: true,
        invitedAt: true,
        registeredAt: true,
      },
    }),
    prisma.alumni.count({ where }),
  ]);

  const data = rows.map((row) => {
    let displayStatus: 'PENDING' | 'INVITED' | 'REGISTERED' = 'PENDING';
    if (row.isRegistered || row.inviteStatus === 'REGISTERED') {
      displayStatus = 'REGISTERED';
    } else if (row.inviteStatus === 'INVITED') {
      displayStatus = 'INVITED';
    }

    return {
      ...row,
      displayStatus,
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
  });
}
