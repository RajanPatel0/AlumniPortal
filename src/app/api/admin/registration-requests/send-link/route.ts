import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedStaff } from '@/lib/auth/staff-auth';
import { sendEmail } from '@/lib/brevo';

export async function POST(req: NextRequest) {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check staff requests module permissions or admin role
    const modules = Array.isArray(staff.modules) ? (staff.modules as string[]) : [];
    if (staff.role !== 'ADMIN' && !modules.includes('requests')) {
      return NextResponse.json({ error: 'Forbidden: Access denied to registration requests' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required fields' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    const registerUrl = `${appUrl}/alumni/register`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; color: #1f2937;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #003D7A; margin: 0;">IKGPTU Alumni Connect</h2>
          <p style="font-size: 14px; color: #6b7280; margin: 4px 0 0;">University Alumni Relations Portal</p>
        </div>
        
        <p>Hello <strong>${name}</strong>,</p>
        <p>The Alumni Relations Office of I.K.G. Punjab Technical University has sent you a link to register on the official Alumni Portal.</p>
        
        <p>Please click the button below to register and setup your profile:</p>
        
        <div style="text-align: center; margin: 28px 0;">
          <a href="${registerUrl}" style="display: inline-block; padding: 12px 24px; background: #C41E3A; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">Register as Alumni</a>
        </div>
        
        <p>Alternatively, you can copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; background-color: #f8fafc; padding: 10px; border-radius: 6px; font-size: 13px; color: #475569;">
          <a href="${registerUrl}" style="color: #003D7A; text-decoration: none;">${registerUrl}</a>
        </p>
        
        <p style="font-size: 14px; line-height: 1.5; margin-top: 20px;">Once registered, you can connect with batchmates, view latest campus notifications, participate in upcoming alumni meets, list your startup, and browse jobs.</p>
        
        <hr style="margin: 24px 0; border: 0; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">IKGPTU Alumni Connect · University Alumni Relations Office</p>
      </div>
    `;

    const result = await sendEmail({
      to: [{ email, name }],
      subject: 'IKGPTU Alumni Connect — Register Now',
      htmlContent,
      tags: ['alumni-open-invite'],
    });

    if (!result.ok) {
      return NextResponse.json({ error: 'Failed to send invite email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Registration invitation sent successfully to ${email}.` });
  } catch (error) {
    console.error('[ADMIN_SEND_REGISTRATION_LINK]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
