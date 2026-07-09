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

  const where: Record<string, unknown> = {
    ...alumniCampusWhere(scopedCampusId),
  };

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { enrollmentNo: { contains: search } },
      { phone: { contains: search } },
    ];
  }
  if (batchYear) where.batchYear = parseInt(batchYear);
  if (branch) where.branch = { contains: branch };
  if (course) where.course = { contains: course };
  if (status) {
    if (status === 'REGISTERED') where.isRegistered = true;
    else if (status === 'PENDING') where.inviteStatus = 'PENDING';
    else if (status === 'INVITED') where.inviteStatus = 'INVITED';
  }

  const filterBaseWhere = alumniCampusWhere(scopedCampusId);

  const [alumni, total, branchRows, courseRows, yearRows] = await Promise.all([
    prisma.alumni.findMany({
      where,
      skip,
      take: limit,
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
        avatarUrl: true,
        campusId: true,
        campus: { select: { id: true, name: true } },
      },
    }),
    prisma.alumni.count({ where }),
    prisma.alumni.findMany({
      where: filterBaseWhere,
      select: { branch: true },
      distinct: ['branch'],
      orderBy: { branch: 'asc' },
    }),
    prisma.alumni.findMany({
      where: { ...filterBaseWhere, course: { not: null } },
      select: { course: true },
      distinct: ['course'],
      orderBy: { course: 'asc' },
    }),
    prisma.alumni.findMany({
      where: filterBaseWhere,
      select: { batchYear: true },
      distinct: ['batchYear'],
      orderBy: { batchYear: 'desc' },
    }),
  ]);

  const processedAlumni = alumni.map((alum) => ({
    ...alum,
    displayStatus: alum.isRegistered ? 'REGISTERED' : alum.inviteStatus,
  }));

  return NextResponse.json({
    data: processedAlumni,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    filterOptions: {
      branches: branchRows.map((r) => r.branch),
      courses: courseRows.map((r) => r.course).filter(Boolean),
      years: yearRows.map((r) => r.batchYear),
    },
    scope: {
      role: staff.role,
      campusId: scopedCampusId,
      campusName: staff.campus?.name ?? null,
    },
  });
}

