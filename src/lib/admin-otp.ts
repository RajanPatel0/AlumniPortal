import { sendEmail } from './brevo'

export async function sendAdminOtpEmail(
  toEmail: string,
  toName: string,
  otp: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
      <h2 style="color: #1e3a8a;">IKGPTU Alumni Connect</h2>
      <p>Hello <strong>${toName}</strong>,</p>
      <p>Use the following OTP to verify your email address and complete registration:</p>
      <div style="background-color: #f3f4f6; padding: 16px; text-align: center; font-size: 32px; letter-spacing: 4px; font-weight: bold; border-radius: 8px; margin: 20px 0;">
        ${otp}
      </div>
      <p>This OTP is valid for <strong>10 minutes</strong>.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <hr style="margin: 24px 0; border-color: #e5e7eb;">
      <p style="font-size: 12px; color: #6b7280;">IKGPTU Alumni Connect · Staff Portal</p>
    </div>
  `

  const result = await sendEmail({
    to: [{ email: toEmail, name: toName }],
    subject: 'Verify your email – Alumni Connect Staff Registration',
    htmlContent: html,
    tags: ['admin-registration', 'otp'],
  })

  return result.ok
}