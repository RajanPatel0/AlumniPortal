import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAlumniAccessToken, generateAlumniRefreshToken } from '@/lib/auth/alumni-jwt';

function parseExpiryToMs(expiry: string): number {
  const value = parseInt(expiry);
  const unit = expiry.slice(-1);
  if (unit === 'm') return value * 60 * 1000;
  if (unit === 'h') return value * 60 * 60 * 1000;
  if (unit === 'd') return value * 24 * 60 * 60 * 1000;
  return value * 1000; // assume seconds
}

export async function POST(req: NextRequest) {
  try {
    const { alumniId } = await req.json();
    if (!alumniId) return NextResponse.json({ error: 'Missing alumniId' }, { status: 400 });

    const alumni = await prisma.alumni.findUnique({ where: { id: alumniId } });
    if (!alumni) return NextResponse.json({ error: 'Alumni not found' }, { status: 404 });

    const accessToken = generateAlumniAccessToken({ id: alumni.id, email: alumni.email, name: alumni.name, campusId: alumni.campusId});
    const refreshToken = generateAlumniRefreshToken({ id: alumni.id });

    // Store refresh token and update login time
    await prisma.$transaction([
      prisma.alumniRefreshToken.create({
        data: {
          token: refreshToken,
          alumniId: alumni.id,
        },
      }),
      prisma.alumni.update({
        where: { id: alumni.id },
        data: {
          lastLoginAt: new Date(),
        },
      }),
    ]);

    const isProd = process.env.NODE_ENV === 'production';
    const accessMaxAge = parseExpiryToMs(process.env.ACCESS_TOKEN_EXPIRY || '15m');
    const refreshMaxAge = parseExpiryToMs(process.env.REFRESH_TOKEN_EXPIRY || '7d');
    
    const response = NextResponse.json({ success: true });
    response.cookies.set('alumniAccessToken', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: accessMaxAge / 1000,
      path: '/',
    });
    response.cookies.set('alumniRefreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: refreshMaxAge / 1000,
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('[CREATE_SESSION]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
