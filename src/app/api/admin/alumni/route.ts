import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getAuthenticatedStaff,
  resolveCampusScope,
  alumniCampusWhere,
  CampusScopeError,
} from '@/lib/auth/staff-auth';

export async function GET(req: NextRequest) {
  const staff = await getAuthenticatedStaff();
  if (!staff) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const modules = Array.isArray(staff.modules) ? (staff.modules as string[]) : [];
  if (staff.role !== 'ADMIN' && !modules.includes('alumni')) {
    return NextResponse.json({ error: 'Forbidden: Access denied to alumni module' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const batchYear = searchParams.get('batchYear');
  const branch = searchParams.get('branch');
  const college = searchParams.get('college');
  const course = searchParams.get('course');
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
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
    ...alumniCampusWhere(scopedCampusId),
  };
  if (batchYear) where.batchYear = parseInt(batchYear);
  if (branch) where.branch = { contains: branch };
  if (college) where.college = { contains: college };
  if (course) where.course = { contains: course };
  if (status) {
    if (status === 'PENDING') {
      where.inviteStatus = { in: ['PENDING', 'BOUNCED'] };
    } else {
      where.inviteStatus = status;
    }
  }

  const [alumni, total] = await Promise.all([
    prisma.alumni.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        originalInvitedEmail: true,
        enrollmentNo: true,
        batchYear: true,
        branch: true,
        college: true,
        course: true,
        phone: true,
        inviteStatus: true,
        isRegistered: true,
        registeredAt: true,
        createdAt: true,
        campusId: true,
        campus: { select: { id: true, name: true } },
        batch: {
          select: { label: true },
        },
      },
    }),
    prisma.alumni.count({ where }),
  ]);

  return NextResponse.json({
    data: alumni,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

