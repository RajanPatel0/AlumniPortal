import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { adminMiddleware } from '@/middlewares/adminMiddleware'
import { alumniMiddleware } from '@/middlewares/alumniMiddleware'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin')) {
    return adminMiddleware(request)
  }

  if (pathname.startsWith('/alumni')) {
    return alumniMiddleware(request)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/dashboard/:path*',
    '/admin/alumni/:path*',
    '/admin/events/:path*',
    '/admin/import/:path*',
    '/admin/requests/:path*',
    '/admin/yearbook/:path*',
    '/admin/jobs/:path*',
    '/admin/startups/:path*',
    '/admin/subadmins/:path*',
    '/admin/posts/:path*',
    '/admin/landing-page/:path*',
    '/admin/auth/login',   
    '/admin/auth/register',
    
    '/alumni/feed/:path*',
    '/alumni/events/:path*',
    '/alumni/gallery/:path*',
    '/alumni/jobs/:path*',
    '/alumni/networking/:path*',
    '/alumni/newscorner/:path*',
    '/alumni/noticeboard/:path*',
    '/alumni/profile/:path*',
    '/alumni/startups/:path*',
    '/alumni/yearbook/:path*',
    '/alumni/login',
    '/alumni/register',
  ],
}
