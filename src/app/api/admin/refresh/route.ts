import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt'

function parseExpiryToMs(expiry: string): number {
  const value = parseInt(expiry)
  const unit = expiry.slice(-1)
  if (unit === 'm') return value * 60 * 1000
  if (unit === 'h') return value * 60 * 60 * 1000
  if (unit === 'd') return value * 24 * 60 * 60 * 1000
  return value * 1000
}

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refreshToken')?.value

    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token missing' }, { status: 401 })
    }

    // Verify refresh token
    let payload
    try {
      payload = verifyRefreshToken(refreshToken)
    } catch {
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 })
    }

    const staff = await prisma.staff.findUnique({
      where: { id: payload.id },
    })

    const storedToken = await prisma.staffRefreshToken.findUnique({
      where: { token: refreshToken },
    })

    if (!staff || !storedToken || storedToken.staffId !== staff.id) {
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 })
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({ id: staff.id, email: staff.email, role: staff.role })
    const newRefreshToken = generateRefreshToken({ id: staff.id })

    // Rotate refresh token: replace old with new
    await prisma.staffRefreshToken.update({
      where: { token: refreshToken },
      data: { token: newRefreshToken },
    })

    const isProd = process.env.NODE_ENV === 'production'
    const accessMaxAge = parseExpiryToMs(process.env.ACCESS_TOKEN_EXPIRY || '15m')
    const refreshMaxAge = parseExpiryToMs(process.env.REFRESH_TOKEN_EXPIRY || '7d')

    const response = NextResponse.json({ success: true, message: 'Token refreshed' })
    response.cookies.set('accessToken', newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: accessMaxAge / 1000,
      path: '/',
    })
    response.cookies.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: refreshMaxAge / 1000,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[REFRESH]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}