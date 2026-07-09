import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt'
import { loginLimiter } from '@/lib/rate-limit'

// Helper to parse expiry like "15m" to milliseconds
function parseExpiryToMs(expiry: string): number {
  const value = parseInt(expiry)
  const unit = expiry.slice(-1)
  if (unit === 'm') return value * 60 * 1000
  if (unit === 'h') return value * 60 * 60 * 1000
  if (unit === 'd') return value * 24 * 60 * 60 * 1000
  return value * 1000 // assume seconds
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'
    const { success } = loginLimiter.check(ip)
    if (!success) {
      return NextResponse.json({ error: 'Too many login attempts. Please try again in a minute.' }, { status: 429 })
    }

    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const staff = await prisma.staff.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!staff) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!staff.isVerified) {
      return NextResponse.json({ error: 'Email not verified. Please complete registration.' }, { status: 403 })
    }

    const isValid = await bcrypt.compare(password, staff.passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Generate tokens
    const accessToken = generateAccessToken({ id: staff.id, email: staff.email, role: staff.role })
    const refreshToken = generateRefreshToken({ id: staff.id })

    // Store refresh token in DB (rotate)
    await prisma.staffRefreshToken.create({
      data: {
        token: refreshToken,
        staffId: staff.id,
      },
    })

    // Set cookies
    const isProd = process.env.NODE_ENV === 'production'
    const accessMaxAge = parseExpiryToMs(process.env.ACCESS_TOKEN_EXPIRY || '15m')
    const refreshMaxAge = parseExpiryToMs(process.env.REFRESH_TOKEN_EXPIRY || '7d')

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: { id: staff.id, name: staff.name, email: staff.email, role: staff.role },
    })

    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: accessMaxAge / 1000,
      path: '/',
    })
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: refreshMaxAge / 1000,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[LOGIN]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}