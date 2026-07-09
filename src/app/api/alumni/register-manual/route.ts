import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAlumniAccessToken, generateAlumniRefreshToken } from '@/lib/auth/alumni-jwt';
import bcrypt from 'bcryptjs';

function parseExpiryToMs(expiry: string): number {
  const value = parseInt(expiry);
  const unit = expiry.slice(-1);
  if (unit === 'm') return value * 60 * 1000;
  if (unit === 'h') return value * 60 * 60 * 1000;
  if (unit === 'd') return value * 24 * 60 * 60 * 1000;
  return value * 1000;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, email, name, password, currentRole, currentCompany, city } = body;

    if (!token) {
      return NextResponse.json({ error: 'Invitation token is required' }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const alumni = await prisma.alumni.findFirst({
      where: {
        inviteToken: token,
        inviteStatus: { in: ['PENDING', 'INVITED'] },
        isRegistered: false,
      },
    });

    if (!alumni) {
      return NextResponse.json({ error: 'Invalid or expired invitation link' }, { status: 400 });
    }

    const normalizedEmail = (email || alumni.email).toLowerCase().trim();
    const finalName = (name || alumni.name).trim();

    if (!finalName) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const existing = await prisma.alumni.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing && existing.id !== alumni.id) {
      return NextResponse.json({ error: 'Email already registered by another alumni' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      name: finalName,
      email: normalizedEmail,
      currentRole: currentRole?.trim() || null,
      currentCompany: currentCompany?.trim() || null,
      city: city?.trim() || null,
      inviteStatus: 'REGISTERED',
      isRegistered: true,
      registeredAt: new Date(),
      lastLoginAt: new Date(),
      inviteToken: null, //Nullify token to invalidate it after manual registration
    };

    const passwordHash = await bcrypt.hash(password, 10);
    updateData.passwordHash = passwordHash;

    if (!alumni.originalInvitedEmail && alumni.email) {
      updateData.originalInvitedEmail = alumni.email;
    }

    const updated = await prisma.alumni.update({
      where: { id: alumni.id },
      data: updateData as any,
    });

    if (currentRole || currentCompany) {
      await prisma.workExperience.create({
        data: {
          alumniId: updated.id,
          company: currentCompany?.trim() || 'Not Specified',
          title: currentRole?.trim() || 'Not Specified',
          location: city?.trim() || null,
          startDate: new Date(),
          isCurrent: true,
        },
      });
    }

    const accessToken = generateAlumniAccessToken({
      id: updated.id,
      email: updated.email,
      name: updated.name,
    });
    const refreshToken = generateAlumniRefreshToken({ id: updated.id });

    await prisma.alumniRefreshToken.create({
      data: {
        token: refreshToken,
        alumniId: updated.id,
      },
    });

    const isProd = process.env.NODE_ENV === 'production';
    const accessMaxAge = parseExpiryToMs(process.env.ACCESS_TOKEN_EXPIRY || '15m');
    const refreshMaxAge = parseExpiryToMs(process.env.REFRESH_TOKEN_EXPIRY || '7d');

    const response = NextResponse.json({
      success: true,
      message: 'Registration successful',
      user: { id: updated.id, name: updated.name, email: updated.email, role: 'alumni' },
    });

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
    console.error('[MANUAL_REGISTER]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
