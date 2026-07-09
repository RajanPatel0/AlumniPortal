import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refreshToken')?.value

    if (refreshToken) {
      // Remove this specific refresh token from DB
      await prisma.staffRefreshToken.deleteMany({
        where: { token: refreshToken },
      })
    }

    const response = NextResponse.json({ success: true, message: 'Logged out' })
    response.cookies.delete('accessToken')
    response.cookies.delete('refreshToken')
    return response
  } catch (error) {
    console.error('[LOGOUT]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}