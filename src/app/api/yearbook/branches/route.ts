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
  if (!yearParam) {
    return NextResponse.json({ error: 'year query param required' }, { status: 400 });
  }

  const year = parseInt(yearParam, 10);
  if (isNaN(year)) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
  }

  try {
    const grouped = await prisma.alumni.groupBy({
      by: ['branch'],
      where: { batchYear: year },
      _count: { id: true },
      orderBy: { branch: 'asc' },
    });

    const branches = grouped.map((g) => ({
      branch: g.branch,
      count: g._count.id,
    }));

    return NextResponse.json({ year, branches });
  } catch (error) {
    console.error('[yearbook/branches]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
