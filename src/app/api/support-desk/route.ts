import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/brevo';
import { z } from 'zod';

const supportTicketSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  enrollmentNo: z.string().optional(),
  category: z.string().min(2, 'Category is required'),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = supportTicketSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, phone, enrollmentNo, category, subject, message } = validation.data;

    // Generate ticket number SUP-XXXXX
    const ticketNo = `SUP-${Math.floor(10000 + Math.random() * 90000)}`;

    // Save ticket to MySQL Database
    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNo,
        name,
        email,
        phone: phone || null,
        enrollmentNo: enrollmentNo || null,
        category,
        subject,
        message,
        status: 'PENDING',
      },
    });

    // 1. Send notification email to official support desk (alumni@ptu.ac.in)
    await sendEmail({
      to: [{ email: 'alumni@ptu.ac.in', name: 'IKGPTU Support Desk' }],
      subject: `[Support Ticket ${ticketNo}] ${subject}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
          <h2 style="color: #003D7A; border-bottom: 2px solid #003D7A; padding-bottom: 8px;">New Alumni Support Ticket Raised</h2>
          <p><strong>Ticket Reference:</strong> <span style="color: #C41E3A; font-weight: bold;">${ticketNo}</span></p>
          <p><strong>Category:</strong> ${category}</p>
          <p><strong>Alumni Name:</strong> ${name}</p>
          <p><strong>Email Address:</strong> <a href="mailto:${email}">${email}</a></p>
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
          ${enrollmentNo ? `<p><strong>Roll / Reg No:</strong> ${enrollmentNo}</p>` : ''}
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
          <h4 style="color: #003D7A; margin-bottom: 4px;">Subject: ${subject}</h4>
          <div style="background-color: #f8fafc; padding: 14px; border-left: 4px solid #003D7A; margin-bottom: 16px;">
            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
          <p style="font-size: 12px; color: #64748b;">Submitted via IKGPTU Alumni Portal Support Desk.</p>
        </div>
      `,
      textContent: `New Support Ticket ${ticketNo}\nName: ${name}\nEmail: ${email}\nCategory: ${category}\nSubject: ${subject}\n\nMessage:\n${message}`,
    });

    // 2. Send confirmation receipt email to alumni
    await sendEmail({
      to: [{ email, name }],
      subject: `Ticket Received: [${ticketNo}] ${subject}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
          <h2 style="color: #003D7A;">IKGPTU Alumni Support Desk</h2>
          <p>Dear <strong>${name}</strong>,</p>
          <p>Thank you for reaching out to the IKGPTU Alumni Support Desk. Your inquiry has been received and logged under reference number <strong style="color: #C41E3A;">${ticketNo}</strong>.</p>
          
          <div style="background-color: #f1f5f9; padding: 14px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0 0 6px 0;"><strong>Category:</strong> ${category}</p>
            <p style="margin: 0 0 6px 0;"><strong>Subject:</strong> ${subject}</p>
            <p style="margin: 0;"><strong>Status:</strong> <span style="color: #0284c7; font-weight: bold;">PENDING REVIEW</span></p>
          </div>

          <p>Our support team and alumni office will review your ticket and get back to you shortly at this email address (or call you directly if phone was provided).</p>
          
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="margin: 0; font-weight: bold; color: #003D7A;">IKGPTU Alumni Office</p>
          <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Email: alumni@ptu.ac.in | IKG Punjab Technical University</p>
        </div>
      `,
      textContent: `Dear ${name},\nThank you for contacting IKGPTU Support. Ticket ${ticketNo} created.\nCategory: ${category}\nSubject: ${subject}\n\nWe will get back to you shortly.`,
    });

    return NextResponse.json({
      success: true,
      ticketNo,
      message: 'Support ticket created successfully and notification sent.',
    });
  } catch (error: any) {
    console.error('[SUPPORT_TICKET_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to submit support ticket. Please try again later.' },
      { status: 500 }
    );
  }
}
