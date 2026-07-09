import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { generateOtpToken } from '@/lib/auth/jwt'
import { sendAdminOtpEmail } from '@/lib/admin-otp'
import { registerLimiter } from '@/lib/rate-limit'

// Simple email format validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/
  return emailRegex.test(email)
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'
    const { success } = registerLimiter.check(ip)
    if (!success) {
      return NextResponse.json({ error: 'Too many registration requests. Please try again in a minute.' }, { status: 429 })
    }

    const { name, email, password } = await req.json()

    // 1. Basic validation
    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: 'Name, email and password are required' },
        { status: 400 }
      )
    }

    // 2. Email format validation
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // 3. Password strength (minimum length 8)
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // 4. Check existing admin
    const existing = await prisma.staff.findUnique({
      where: { email: email.toLowerCase() },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Admin already exists with this email' },
        { status: 400 }
      )
    }

    // 5. Hash password and generate OTP
    const passwordHash = await bcrypt.hash(password, 10)
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpHash = await bcrypt.hash(otp, 10)
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // 6. Create staff record (unverified)
    const staff = await prisma.staff.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase(),
        passwordHash,
        otpHash,
        otpExpiresAt,
        isVerified: false,
        role: 'ADMIN',
      },
    })

    // 7. Send OTP email
    // 7. Send OTP email (or log in dev mode)
    let emailSent = false

    if (process.env.DEV_MODE === 'true') {
      console.log('\n===== OTP DEBUG =====')
      console.log(`Email: ${staff.email}`)
      console.log(`OTP: ${otp}`)
      console.log('=====================\n')

      emailSent = true // simulate success
    } else {
      emailSent = await sendAdminOtpEmail(staff.email, staff.name, otp)
    }
    if (!emailSent) {
      // Rollback: delete the unverified staff record
      await prisma.staff.delete({ where: { id: staff.id } })
      // Log the failure (error already logged inside sendEmail/brevo.ts)
      console.error(`[REGISTER] Failed to send OTP to ${staff.email}, rolled back user`)
      return NextResponse.json(
        { error: 'Failed to send OTP email. Please try again later.' },
        { status: 500 }
      )
    }

    // 8. Generate short-lived OTP token for verification
    const otpToken = generateOtpToken({ id: staff.id })

    return NextResponse.json({
      message: 'Registration initiated. OTP sent to email.',
      otpToken,
      staffId: staff.id,
    })
  } catch (error) {
    console.error('[REGISTER] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}