import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/brevo';
import { forgotPasswordIpLimiter, forgotPasswordEmailLimiter } from '@/lib/rate-limit';
import crypto from 'crypto';

const GENERIC_RESPONSE = {
  message: 'If an account with that email exists, a reset link has been sent.',
};

export async function POST(req: NextRequest) {
  try {
    let email = '';
    try {
      const body = await req.json();
      email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : '';
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Dual-axis rate limiting: both IP and email must pass
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const ipCheck = forgotPasswordIpLimiter.check(`fp_ip_${ip}`);
    if (!ipCheck.success) {
      return NextResponse.json(
        { error: 'Too many requests from this location. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }
    const emailCheck = forgotPasswordEmailLimiter.check(`fp_email_${email}`);
    if (!emailCheck.success) {
      return NextResponse.json(
        { error: 'Too many reset requests for this email. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    // Look up alumnus — silently no-op on any non-eligible case for enumeration safety
    const alumni = await prisma.alumni.findUnique({ where: { email } });

    // Only send email when: record exists, fully registered, AND has a password hash
    // (passwordHash === null means OAuth-only — they cannot use password reset)
    if (alumni && alumni.isRegistered && alumni.passwordHash) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const resetTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      await prisma.alumni.update({
        where: { id: alumni.id },
        data: { resetTokenHash, resetTokenExpiresAt },
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || req.nextUrl.origin;
      const resetLink = `${appUrl}/alumni/reset-password?token=${rawToken}`;

      await sendEmail({
        to: [{ email: alumni.email, name: alumni.name }],
        subject: 'Reset Your PTU Alumni Connect Password',
        htmlContent: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;">
            <h2 style="color:#003D7A;margin-bottom:16px;">Password Reset Request</h2>
            <p style="color:#374151;">Hello <strong>${alumni.name}</strong>,</p>
            <p style="color:#374151;">We received a request to reset the password for your PTU Alumni Connect account. Click the button below to set a new password. This link expires in <strong>30 minutes</strong>.</p>
            <p style="margin:28px 0;">
              <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background-color:#003D7A;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;">
                Reset My Password
              </a>
            </p>
            <p style="color:#6b7280;font-size:13px;">If the button does not work, paste this URL into your browser:</p>
            <p style="color:#003D7A;font-size:13px;word-break:break-all;">${resetLink}</p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
            <p style="color:#9ca3af;font-size:12px;">If you did not request this, you can safely ignore this email. Your password will not change.</p>
          </div>
        `,
        textContent: `Hello ${alumni.name}, reset your PTU Alumni Connect password here: ${resetLink} — This link expires in 30 minutes.`,
        tags: ['alumni-password-reset'],
      });
    }

    // Always return the same generic response regardless of outcome
    return NextResponse.json(GENERIC_RESPONSE);
  } catch (error) {
    console.error('[ALUMNI_FORGOT_PASSWORD]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
