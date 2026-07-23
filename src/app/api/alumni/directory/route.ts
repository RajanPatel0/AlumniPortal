import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAlumniAccessToken } from '@/lib/auth/alumni-jwt';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const alumniToken = cookieStore.get('alumniAccessToken')?.value;
  const staffToken = cookieStore.get('accessToken')?.value;

  if (!alumniToken && !staffToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let authorized = false;
  if (alumniToken) {
    try {
      verifyAlumniAccessToken(alumniToken);
      authorized = true;
    } catch {}
  }
  if (!authorized && staffToken) {
    try {
      verifyAccessToken(staffToken);
      authorized = true;
    } catch {}
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const branch = searchParams.get('branch') || '';
    const course = searchParams.get('course') || '';
    const company = searchParams.get('company') || '';
    const city = searchParams.get('city') || '';
    const batchYearStr = searchParams.get('batchYear') || '';
    const sort = searchParams.get('sort') || 'name_asc';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.AlumniWhereInput = {
      isRegistered: true,
    };

    if (branch && branch !== 'All') {
      where.branch = branch;
    }

    if (course && course !== 'All') {
      where.course = course;
    }

    if (company && company !== 'All') {
      where.currentCompany = company;
    }

    if (city && city !== 'All') {
      where.city = city;
    }

    if (batchYearStr && batchYearStr !== 'All') {
      const year = parseInt(batchYearStr, 10);
      if (!isNaN(year)) {
        where.batchYear = year;
      }
    }

    if (search.trim()) {
      const keyword = search.trim();
      where.OR = [
        { name: { contains: keyword } },
        { currentRole: { contains: keyword } },
        { currentCompany: { contains: keyword } },
        { city: { contains: keyword } },
        { branch: { contains: keyword } },
      ];
    }

    let orderBy: Prisma.AlumniOrderByWithRelationInput[] = [{ name: 'asc' }];
    if (sort === 'newest') {
      orderBy = [{ registeredAt: 'desc' }, { createdAt: 'desc' }];
    } else if (sort === 'batch_desc') {
      orderBy = [{ batchYear: 'desc' }, { name: 'asc' }];
    } else if (sort === 'batch_asc') {
      orderBy = [{ batchYear: 'asc' }, { name: 'asc' }];
    } else if (sort === 'company_asc') {
      orderBy = [{ currentCompany: 'asc' }, { name: 'asc' }];
    } else if (sort === 'name_asc') {
      orderBy = [{ name: 'asc' }];
    }

    const [total, alumni] = await Promise.all([
      prisma.alumni.count({ where }),
      prisma.alumni.findMany({
        where,
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          currentRole: true,
          currentCompany: true,
          city: true,
          branch: true,
          batchYear: true,
          college: true,
          course: true,
          linkedinUrl: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      alumni,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[API_ALUMNI_DIRECTORY_ERROR]', error);
    return NextResponse.json({ error: 'Failed to load directory' }, { status: 500 });
  }
}
