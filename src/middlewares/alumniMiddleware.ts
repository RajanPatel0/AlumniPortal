import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAlumniAccessToken } from '@/lib/auth/alumni-jwt'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { BASE_PATH } from '@/lib/api'

const protectedRoutes = [
  '/alumni/feed',
  '/alumni/events',
  '/alumni/gallery',
  '/alumni/jobs',
  '/alumni/networking',
  '/alumni/newscorner',
  '/alumni/noticeboard',
  '/alumni/profile',
  '/alumni/startups',
  '/alumni/yearbook',
]

const authRoutes = ['/alumni/login', '/alumni/register']

export function alumniMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname === route)

  // Admin/staff passthrough — if a valid staff accessToken exists, allow into alumni portal
  const staffToken = request.cookies.get('accessToken')?.value
  if (staffToken) {
    try {
      verifyAccessToken(staffToken)
      return NextResponse.next()
    } catch {
      // staff token invalid/expired, fall through to alumni check
    }
  }

  const accessToken = request.cookies.get('alumniAccessToken')?.value
  const refreshToken = request.cookies.get('alumniRefreshToken')?.value

  const redirectToLogin = () => {
    const url = new URL(`${BASE_PATH}/alumni/login`, request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  const redirectToRefresh = () => {
    const url = new URL(`${BASE_PATH}/api/alumni/auth-refresh`, request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  if (isProtected) {
    // If no tokens at all, redirect to login
    if (!accessToken && !refreshToken) {
      return redirectToLogin()
    }

    // If alumni access token exists, verify it
    if (accessToken) {
      try {
        verifyAlumniAccessToken(accessToken)
        return NextResponse.next()
      } catch {
        // Access token is expired/invalid
      }
    }

    // Access token missing/expired, but refresh token exists → silently refresh
    if (refreshToken) {
      return redirectToRefresh()
    }

    // Fallback to login
    return redirectToLogin()
  }

  if (isAuthRoute && accessToken) {
    try {
      verifyAlumniAccessToken(accessToken)
      return NextResponse.redirect(new URL(`${BASE_PATH}/alumni/feed`, request.url))
    } catch {
      // If access token invalid, but we have refresh token, send to refresh first
      if (refreshToken) {
        return NextResponse.redirect(
          new URL(
            `${BASE_PATH}/api/alumni/auth-refresh?callbackUrl=${BASE_PATH}/alumni/feed`,
            request.url
          )
        )
      }
      return NextResponse.next()
    }
  }

  return NextResponse.next()
}
