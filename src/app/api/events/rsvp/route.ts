import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/brevo';
import { z } from 'zod';

const rsvpSchema = z.object({
  eventId: z.string().optional(),
  eventTitle: z.string().min(2, 'Event title is required'),
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = rsvpSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { eventId, eventTitle, name, email, phone, notes } = validation.data;

    // Check if an RSVP for this email & event already exists to prevent duplicates
    const existingRsvp = await prisma.eventRsvp.findFirst({
      where: eventId
        ? { email, OR: [{ eventId }, { eventName: eventTitle }] }
        : { email, eventName: eventTitle },
    });

    let rsvp;
    if (existingRsvp) {
      // Update existing record with latest info
      rsvp = await prisma.eventRsvp.update({
        where: { id: existingRsvp.id },
        data: {
          name,
          phone: phone || existingRsvp.phone,
          notes: notes || existingRsvp.notes,
        },
      });
    } else {
      // Create new RSVP record
      rsvp = await prisma.eventRsvp.create({
        data: {
          eventId: eventId || null,
          eventName: eventTitle,
          name,
          email,
          phone: phone || null,
          notes: notes || null,
        },
      });
    }

    // Send confirmation email to user via Brevo API
    await sendEmail({
      to: [{ email, name }],
      subject: `RSVP Confirmed: ${eventTitle} | IKGPTU Alumni`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #003D7A; margin-top: 0;">Event RSVP Confirmation</h2>
          <p>Dear <strong>${name}</strong>,</p>
          <p>Your RSVP registration for <strong>${eventTitle}</strong> has been successfully confirmed!</p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #003D7A; padding: 14px; margin: 16px 0; border-radius: 6px;">
            <p style="margin: 0 0 6px 0; font-[#003D7A]"><strong>Event Name:</strong> ${eventTitle}</p>
            <p style="margin: 0 0 6px 0;"><strong>Participant Name:</strong> ${name}</p>
            <p style="margin: 0;"><strong>Registered Email:</strong> ${email}</p>
          </div>

          <p>We look forward to seeing you at the event. Further reminders and link credentials (if virtual) will be shared closer to the event date.</p>
          
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="margin: 0; font-weight: bold; color: #003D7A;">IKGPTU Alumni Office</p>
          <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Email: alumni@ptu.ac.in | IKG Punjab Technical University</p>
        </div>
      `,
      textContent: `Dear ${name},\nYour RSVP for "${eventTitle}" is confirmed!\nWe look forward to seeing you there.\n\nIKGPTU Alumni Office`,
    });

    return NextResponse.json({
      success: true,
      rsvpId: rsvp.id,
      message: `RSVP confirmed for ${eventTitle}! A confirmation email has been sent.`,
    });
  } catch (error: any) {
    console.error('[EVENT_RSVP_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to process RSVP. Please try again.' },
      { status: 500 }
    );
  }
}
