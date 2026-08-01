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

  const { searchParams } = new URL(req.url);

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '15', 10));
  const skip = (page - 1) * limit;
  const isExport = searchParams.get('export') === 'true';

  const search = searchParams.get('search') || '';
  const batchYear = searchParams.get('batchYear') || '';
  const branch = searchParams.get('branch') || '';
  const course = searchParams.get('course') || '';
  const status = searchParams.get('status') || '';

  let scopedCampusId: string | null;
  try {
    scopedCampusId = resolveCampusScope(staff, searchParams.get('campusId'));
  } catch (err) {
    if (err instanceof CampusScopeError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }

  const whereWithoutStatus: Record<string, any> = {
    ...alumniCampusWhere(scopedCampusId),
  };

  if (search) {
    whereWithoutStatus.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { enrollmentNo: { contains: search } },
      { phone: { contains: search } },
    ];
  }
  if (batchYear) whereWithoutStatus.batchYear = parseInt(batchYear);
  if (branch) whereWithoutStatus.branch = { contains: branch };
  if (course) whereWithoutStatus.course = { contains: course };

  const where = { ...whereWithoutStatus };
  if (status) {
    if (status === 'REGISTERED') where.isRegistered = true;
    else if (status === 'PENDING') where.inviteStatus = { in: ['PENDING', 'BOUNCED'] };
    else if (status === 'INVITED') where.inviteStatus = 'INVITED';
  }

  const filterBaseWhere = alumniCampusWhere(scopedCampusId);

  const [alumni, total, branchRows, courseRows, yearRows, statusGroups] = await Promise.all([
    prisma.alumni.findMany({
      where,
      ...(isExport ? {} : { skip, take: limit }),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        enrollmentNo: true,
        batchYear: true,
        branch: true,
        college: true,
        course: true,
        phone: true,
        inviteStatus: true,
        isRegistered: true,
        invitedAt: true,
        registeredAt: true,
        createdAt: true,
        originalInvitedEmail: true,
        googleId: true,
        linkedinId: true,
        currentRole: true,
        currentCompany: true,
        city: true,
        country: true,
        pincode: true,
        avatarUrl: true,
        campusId: true,
        campus: { select: { id: true, name: true } },
      },
    }),
    prisma.alumni.count({ where }),
    isExport ? Promise.resolve([]) : prisma.alumni.findMany({
      where: filterBaseWhere,
      select: { branch: true },
      distinct: ['branch'],
      orderBy: { branch: 'asc' },
    }),
    isExport ? Promise.resolve([]) : prisma.alumni.findMany({
      where: { ...filterBaseWhere, course: { not: null } },
      select: { course: true },
      distinct: ['course'],
      orderBy: { course: 'asc' },
    }),
    isExport ? Promise.resolve([]) : prisma.alumni.findMany({
      where: filterBaseWhere,
      select: { batchYear: true },
      distinct: ['batchYear'],
      orderBy: { batchYear: 'desc' },
    }),
    prisma.alumni.groupBy({
      by: ['isRegistered', 'inviteStatus'],
      where: whereWithoutStatus,
      _count: { _all: true },
    }),
  ]);

  let pendingCount = 0;
  let invitedCount = 0;
  let registeredCount = 0;

  for (const group of statusGroups) {
    if (group.isRegistered || group.inviteStatus === 'REGISTERED') {
      registeredCount += group._count._all;
    } else if (group.inviteStatus === 'INVITED') {
      invitedCount += group._count._all;
    } else {
      pendingCount += group._count._all;
    }
  }

  const overallCounts = {
    total: pendingCount + invitedCount + registeredCount,
    pending: pendingCount,
    invited: invitedCount,
    registered: registeredCount,
  };

  const processedAlumni = alumni.map((alum) => ({
    ...alum,
    displayStatus: alum.isRegistered ? 'REGISTERED' : alum.inviteStatus,
  }));

  return NextResponse.json({
    data: processedAlumni,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    filterOptions: isExport ? { branches: [], courses: [], years: [] } : {
      branches: branchRows.map((r) => r.branch),
      courses: courseRows.map((r) => r.course).filter(Boolean),
      years: yearRows.map((r) => r.batchYear),
    },
    overallCounts,
    scope: {
      role: staff.role,
      campusId: scopedCampusId,
      campusName: staff.campus?.name ?? null,
    },
  }, {
    headers: {
      'Cache-Control': 'private, max-age=10, stale-while-revalidate=20',
    }
  });
}

