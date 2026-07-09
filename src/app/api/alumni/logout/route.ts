import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('alumniRefreshToken')?.value;

  if (refreshToken) {
    // Remove only THIS device's token — preserve all other sessions
    await prisma.alumniRefreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete('alumniAccessToken');
  response.cookies.delete('alumniRefreshToken');
  return response;
}
