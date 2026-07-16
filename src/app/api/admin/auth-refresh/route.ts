// src/app/api/admin/auth-refresh/route.ts
// Silent token refresh route used by the middleware.
// When the access token is expired but a valid refresh token cookie exists,
// the middleware redirects here instead of to login. This route:
//   1. Reads the refreshToken cookie
//   2. Verifies it and fetches the staff record
//   3. Rotates both tokens and sets new cookies
//   4. Redirects the user back to their originally-requested page (callbackUrl)
//   5. If refresh fails → redirects to login

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
} from '@/lib/auth/jwt'
import { BASE_PATH } from '@/lib/api'

function parseExpiryToMs(expiry: string): number {
  const value = parseInt(expiry)
  const unit = expiry.slice(-1)
  if (unit === 'm') return value * 60 * 1000
  if (unit === 'h') return value * 60 * 60 * 1000
  if (unit === 'd') return value * 24 * 60 * 60 * 1000
  return value * 1000
}

export async function GET(req: NextRequest) {
  const callbackUrl =
    req.nextUrl.searchParams.get('callbackUrl') || '/admin/dashboard'

  const loginUrl = new URL(`${BASE_PATH}/admin/auth/login`, req.url)
  loginUrl.searchParams.set('callbackUrl', callbackUrl)

  const refreshToken = req.cookies.get('refreshToken')?.value

  if (!refreshToken) {
    return NextResponse.redirect(loginUrl)
  }

  try {
    // Verify refresh token signature
    let payload
    try {
      payload = verifyRefreshToken(refreshToken)
    } catch {
      return NextResponse.redirect(loginUrl)
    }

    // Fetch staff and check token is still stored (rotation guard)
    const staff = await prisma.staff.findUnique({
      where: { id: payload.id },
    })

    const storedToken = await prisma.staffRefreshToken.findUnique({
      where: { token: refreshToken },
    })

    if (!staff || !storedToken || storedToken.staffId !== staff.id) {
      return NextResponse.redirect(loginUrl)
    }

    // Generate rotated tokens
    const newAccessToken = generateAccessToken({
      id: staff.id,
      email: staff.email,
      role: staff.role,
    })
    const newRefreshToken = generateRefreshToken({ id: staff.id })

    // Replace old refresh token with new one
    await prisma.staffRefreshToken.update({
      where: { token: refreshToken },
      data: { token: newRefreshToken },
    })

    const isProd = process.env.NODE_ENV === 'production'
    const accessMaxAge = parseExpiryToMs(
      process.env.ACCESS_TOKEN_EXPIRY || '15m'
    )
    const refreshMaxAge = parseExpiryToMs(
      process.env.REFRESH_TOKEN_EXPIRY || '7d'
    )

    // Redirect to the original destination with new cookies set
    const redirectTarget = new URL(`${BASE_PATH}${callbackUrl}`, req.url)
    const response = NextResponse.redirect(redirectTarget)

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
    console.error('[AUTH_REFRESH_ROUTE]', error)
    return NextResponse.redirect(loginUrl)
  }
}
