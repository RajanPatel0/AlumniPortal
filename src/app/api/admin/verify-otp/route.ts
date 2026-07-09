import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { verifyOtpToken } from '@/lib/auth/jwt'
import { otpLimiter } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'
    const { success } = otpLimiter.check(ip)
    if (!success) {
      return NextResponse.json({ error: 'Too many verification attempts. Please try again later.' }, { status: 429 })
    }

    const { otp, otpToken } = await req.json()

    if (!otp || !otpToken) {
      return NextResponse.json({ error: 'OTP and OTP token are required' }, { status: 400 })
    }

    // Verify OTP token to get staff ID
    let payload
    try {
      payload = verifyOtpToken(otpToken)
    } catch {
      return NextResponse.json({ error: 'Invalid or expired OTP token' }, { status: 401 })
    }

    const staff = await prisma.staff.findUnique({
      where: { id: payload.id },
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Check if already verified
    if (staff.isVerified) {
      return NextResponse.json({ error: 'Already verified' }, { status: 400 })
    }

    // Check OTP expiry
    if (!staff.otpExpiresAt || staff.otpExpiresAt < new Date()) {
      return NextResponse.json({ error: 'OTP expired. Please register again.' }, { status: 400 })
    }

    // Verify OTP
    const isValid = await bcrypt.compare(otp, staff.otpHash!)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 })
    }

    // Mark as verified and clear OTP fields
    await prisma.staff.update({
      where: { id: staff.id },
      data: {
        isVerified: true,
        otpHash: null,
        otpExpiresAt: null,
      },
    })

    return NextResponse.json({ message: 'Email verified successfully. You can now login.' })
  } catch (error) {
    console.error('[VERIFY_OTP]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}