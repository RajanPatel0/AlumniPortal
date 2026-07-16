import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  verifyAlumniRefreshToken,
  generateAlumniAccessToken,
  generateAlumniRefreshToken,
} from '@/lib/auth/alumni-jwt';
import { BASE_PATH } from '@/lib/api';

function parseExpiryToMs(expiry: string): number {
  const value = parseInt(expiry);
  const unit = expiry.slice(-1);
  if (unit === 'm') return value * 60 * 1000;
  if (unit === 'h') return value * 60 * 60 * 1000;
  if (unit === 'd') return value * 24 * 60 * 60 * 1000;
  return value * 1000;
}

export async function GET(req: NextRequest) {
  const callbackUrl = req.nextUrl.searchParams.get('callbackUrl') || '/alumni/feed';
  const loginUrl = new URL(`${BASE_PATH}/alumni/login`, req.url);
  loginUrl.searchParams.set('callbackUrl', callbackUrl);

  const refreshToken = req.cookies.get('alumniRefreshToken')?.value;

  if (!refreshToken) {
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Verify refresh token signature
    let payload;
    try {
      payload = verifyAlumniRefreshToken(refreshToken);
    } catch {
      return NextResponse.redirect(loginUrl);
    }

    // Fetch alumni and check token is still stored (rotation guard)
    const alumni = await prisma.alumni.findUnique({
      where: { id: payload.id },
    });

    const storedToken = await prisma.alumniRefreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!alumni || !storedToken || storedToken.alumniId !== alumni.id) {
      return NextResponse.redirect(loginUrl);
    }

    // Generate rotated tokens
    const newAccessToken = generateAlumniAccessToken({
      id: alumni.id,
      email: alumni.email,
      name: alumni.name,
      campusId: alumni.campusId || undefined,
    });
    const newRefreshToken = generateAlumniRefreshToken({ id: alumni.id });

    // Replace old refresh token with new one
    await prisma.alumniRefreshToken.update({
      where: { token: refreshToken },
      data: { token: newRefreshToken },
    });

    const isProd = process.env.NODE_ENV === 'production';
    const accessMaxAge = parseExpiryToMs(process.env.ACCESS_TOKEN_EXPIRY || '15m');
    const refreshMaxAge = parseExpiryToMs(process.env.REFRESH_TOKEN_EXPIRY || '7d');

    // Redirect to original destination with new cookies set
    const redirectTarget = new URL(`${BASE_PATH}${callbackUrl}`, req.url);
    const response = NextResponse.redirect(redirectTarget);

    response.cookies.set('alumniAccessToken', newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: accessMaxAge / 1000,
      path: '/',
    });
    response.cookies.set('alumniRefreshToken', newRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: refreshMaxAge / 1000,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[ALUMNI_AUTH_REFRESH_ROUTE]', error);
    return NextResponse.redirect(loginUrl);
  }
}
