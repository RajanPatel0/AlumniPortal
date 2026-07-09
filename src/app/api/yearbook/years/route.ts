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

  try {
    const grouped = await prisma.alumni.groupBy({
      by: ['batchYear'],
      _count: { id: true },
      orderBy: { batchYear: 'desc' },
    });

    const years = grouped.map((g) => ({
      year: g.batchYear,
      count: g._count.id,
    }));

    return NextResponse.json({ years });
  } catch (error) {
    console.error('[yearbook/years]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
