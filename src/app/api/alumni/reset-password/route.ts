import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    let token = '';
    let newPassword = '';
    try {
      const body = await req.json();
      token = typeof body?.token === 'string' ? body.token.trim() : '';
      newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Hash the incoming raw token the same way it was stored at generation time
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find alumni with matching hash and a non-expired token
    const alumni = await prisma.alumni.findFirst({
      where: {
        resetTokenHash,
        resetTokenExpiresAt: { gt: new Date() },
      },
    });

    if (!alumni) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Hash the new password using same rounds as register-manual (bcrypt, 10 rounds)
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear the reset token fields so the link cannot be reused
    await prisma.alumni.update({
      where: { id: alumni.id },
      data: {
        passwordHash,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
      },
    });

    return NextResponse.json({ message: 'Password reset successfully. You can now sign in with your new password.' });
  } catch (error) {
    console.error('[ALUMNI_RESET_PASSWORD]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
