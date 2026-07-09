import { sendEmail } from './brevo';

export async function sendSubAdminCredentials(
  toEmail: string,
  toName: string,
  password: string
): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
      <h2 style="color: #1e3a8a;">IKGPTU Alumni Connect</h2>
      <p>Hello <strong>${toName}</strong>,</p>
      <p>An admin has created a sub-admin account for you. You can now log in to the admin portal.</p>
      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 8px;"><strong>Your credentials:</strong></p>
        <p style="margin: 4px 0;">Email: <code>${toEmail}</code></p>
        <p style="margin: 4px 0;">Temporary Password: <code>${password}</code></p>
      </div>
      <p>Please log in and change your password immediately.</p>
      <p><a href="${appUrl}/admin/auth/login" style="display: inline-block; padding: 10px 16px; background: #1e3a8a; color: white; text-decoration: none; border-radius: 8px;">Login Now</a></p>
      <hr style="margin: 24px 0; border-color: #e5e7eb;">
      <p style="font-size: 12px; color: #6b7280;">IKGPTU Alumni Connect · Admin Portal</p>
    </div>
  `;
  const result = await sendEmail({
    to: [{ email: toEmail, name: toName }],
    subject: 'Your Sub-Admin Account for Alumni Connect',
    htmlContent: html,
    tags: ['subadmin-creation'],
  });
  return result.ok;
}