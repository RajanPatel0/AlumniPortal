import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'

//Add all protected admin page routes here
const protectedRoutes = [
  '/admin/dashboard',
  '/admin/alumni',
  '/admin/events',
  '/admin/import',
  '/admin/requests',
  '/admin/yearbook',
  '/admin/jobs',    
  '/admin/startups',
  '/admin/subadmins',
  '/admin/posts',
  '/admin/landing-page',
]

const authRoutes = ['/admin/auth/login', '/admin/auth/register']

export function adminMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname === route)

  const accessToken = request.cookies.get('accessToken')?.value
  const refreshToken = request.cookies.get('refreshToken')?.value

  const redirectToLogin = () => {
    const url = new URL('/admin/auth/login', request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  const redirectToRefresh = () => {
    const url = new URL('/api/admin/auth-refresh', request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  if (isProtected) {
    // If no tokens at all, redirect to login
    if (!accessToken && !refreshToken) {
      return redirectToLogin()
    }

    // If access token exists, verify it
    if (accessToken) {
      try {
        verifyAccessToken(accessToken)
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
      verifyAccessToken(accessToken)
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    } catch {
      // If access token invalid, but we have refresh token, send to refresh first
      if (refreshToken) {
        return NextResponse.redirect(
          new URL(
            `/api/admin/auth-refresh?callbackUrl=/admin/dashboard`,
            request.url
          )
        )
      }
      return NextResponse.next()
    }
  }

  return NextResponse.next()
}