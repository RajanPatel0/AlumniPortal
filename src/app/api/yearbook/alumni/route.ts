import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAlumniAccessToken } from '@/lib/auth/alumni-jwt';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const alumniToken = cookieStore.get('alumniAccessToken')?.value;
  const staffToken = cookieStore.get('accessToken')?.value;

  if (!alumniToken && !staffToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let authorized = false;
  if (alumniToken) {
    try { verifyAlumniAccessToken(alumniToken); authorized = true; } catch {}
  }
  if (!authorized && staffToken) {
    try { verifyAccessToken(staffToken); authorized = true; } catch {}
  }
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get('year');
  const branch = searchParams.get('branch');
  const search = searchParams.get('search') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(24, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));

  if (!yearParam || !branch) {
    return NextResponse.json({ error: 'year and branch query params required' }, { status: 400 });
  }

  const year = parseInt(yearParam, 10);
  if (isNaN(year)) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
  }

  try {
    const where = {
      batchYear: year,
      branch,
      ...(search.trim()
        ? {
            OR: [
              { name: { contains: search } },
              { currentRole: { contains: search } },
              { currentCompany: { contains: search } },
              { city: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, alumniList] = await Promise.all([
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
          isRegistered: true,
          college: true,
          course: true,
        },
        orderBy: [{ name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      year,
      branch,
      alumni: alumniList,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[yearbook/alumni]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

