import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAlumniAccessToken, generateAlumniRefreshToken } from '@/lib/auth/alumni-jwt';
import bcrypt from 'bcryptjs';
import { loginLimiter } from '@/lib/rate-limit';

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
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const { success } = loginLimiter.check(ip);
    if (!success) {
      return NextResponse.json({ error: 'Too many login attempts. Please try again in a minute.' }, { status: 429 });
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Find alumni by email
    const alumni = await prisma.alumni.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!alumni) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // ─── NEW GUARD: WORKFLOW STATUS VERIFICATION ───────────────────────────
    // Protects against unapproved self-registrations or pending CSV records
    if (!alumni.isRegistered) {
      return NextResponse.json(
        {
          error:
            'Your account is not activated yet. If you submitted an open registration request, wait for admin approval then sign in with your email and password. If you received an invitation email, use the link in that email to set up your account.',
        },
        { status: 403 }
      );
    }
    // ───────────────────────────────────────────────────────────────────────

    // Check if alumni registered manually (has password hash)
    if (!alumni.passwordHash) {
      return NextResponse.json(
        {
          error:
            'This account has no password (OAuth registration). On the login page, use “Continue with Google” or “Continue with LinkedIn” with the same account you used to register.',
        },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, alumni.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Generate JWT tokens
    const accessToken = generateAlumniAccessToken({
      id: alumni.id,
      email: alumni.email,
      name: alumni.name,
    });
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

    // Set cookies
    const isProd = process.env.NODE_ENV === 'production';
    const accessMaxAge = parseExpiryToMs(process.env.ACCESS_TOKEN_EXPIRY || '15m');
    const refreshMaxAge = parseExpiryToMs(process.env.REFRESH_TOKEN_EXPIRY || '7d');

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: { id: alumni.id, name: alumni.name, email: alumni.email, role: 'alumni' },
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
    console.error('[ALUMNI_LOGIN]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}