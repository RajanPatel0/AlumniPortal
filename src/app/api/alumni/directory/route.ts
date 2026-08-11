import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getCurrentAlumniOrStaff } from '@/lib/auth/getCurrentAlumni';
import { UNDISCLOSED_COMPANY_VARIANTS } from '@/lib/company-utils';

export async function GET(req: NextRequest) {
  const identity = await getCurrentAlumniOrStaff();
  if (!identity) {
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
      if (company === 'Not Specified') {
        const variantsList = Array.from(UNDISCLOSED_COMPANY_VARIANTS);
        where.OR = [
          { currentCompany: { in: variantsList } },
          { currentCompany: null },
          { currentCompany: '' },
        ];
      } else {
        where.currentCompany = company;
      }
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

    const viewerId = identity.isAdmin ? null : identity.alumni.id;

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
          followersCount: true,
          followingCount: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const alumniIds = alumni.map((person) => person.id);

    let followedIds = new Set<string>();
    if (viewerId && alumniIds.length > 0) {
      const follows = await prisma.alumniFollow.findMany({
        where: {
          followerId: viewerId,
          followingId: { in: alumniIds },
        },
        select: { followingId: true },
      });
      followedIds = new Set(follows.map((f) => f.followingId));
    }

    const formattedAlumni = alumni.map((person) => ({
      ...person,
      isFollowing: followedIds.has(person.id),
    }));

    return NextResponse.json({
      alumni: formattedAlumni,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[API_ALUMNI_DIRECTORY_ERROR]', error);
    return NextResponse.json({ error: 'Failed to load directory' }, { status: 500 });
  }
}
