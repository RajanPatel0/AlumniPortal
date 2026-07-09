import nodemailer from 'nodemailer'

type SendEmailArgs = {
  to: { email: string; name?: string }[]
  subject: string
  htmlContent: string
  textContent?: string
  tags?: string[]
}

export type SendEmailResult =
  | { ok: true }
  | { ok: false; error: unknown }

function requireEnv(name: 'MAIL_HOST' | 'MAIL_PORT' | 'MAIL_USERNAME' | 'MAIL_PASSWORD' | 'MAIL_FROM_ADDRESS' | 'MAIL_FROM_NAME'): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

let cachedTransporter: nodemailer.Transporter | null = null

function getSmtpTransporter(): nodemailer.Transporter {
  if (cachedTransporter) {
    return cachedTransporter
  }

  const host = requireEnv('MAIL_HOST')
  const port = Number(requireEnv('MAIL_PORT'))
  const username = requireEnv('MAIL_USERNAME')
  const password = requireEnv('MAIL_PASSWORD')

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user: username,
      pass: password,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })

  return cachedTransporter
}

export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  try {
    const senderEmail = requireEnv('MAIL_FROM_ADDRESS')
    const senderName = requireEnv('MAIL_FROM_NAME')
    const transporter = getSmtpTransporter()

    const mailOptions = {
      from: `${senderName} <${senderEmail}>`,
      to: args.to
        .map((recipient) =>
          recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email
        )
        .join(', '),
      subject: args.subject,
      html: args.htmlContent,
      text: args.textContent || undefined,
    }

    await transporter.sendMail(mailOptions)

    return { ok: true }
  } catch (error) {
    console.error('[SMTP] Failed to send email:', error)
    return { ok: false, error }
  }
}