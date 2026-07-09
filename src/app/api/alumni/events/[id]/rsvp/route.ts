import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAlumniAccessToken } from '@/lib/auth/alumni-jwt';
import { prisma } from '@/lib/prisma';
import { RsvpStatus } from '@prisma/client';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('alumniAccessToken')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let alumni;
  try {
    const payload = verifyAlumniAccessToken(token);
    alumni = await prisma.alumni.findUnique({ where: { id: payload.id } });
    if (!alumni) {
      return NextResponse.json({ error: 'Alumni not found' }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { status, message } = body;

    if (!status) {
      return NextResponse.json({ error: 'Missing RSVP status' }, { status: 400 });
    }

    const validStatuses: RsvpStatus[] = ['ATTENDING', 'NOT_ATTENDING', 'MAYBE'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid RSVP status. Must be ATTENDING, NOT_ATTENDING, or MAYBE' }, { status: 400 });
    }

    // Check if event exists and is published
    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (!event.isPublished) {
      return NextResponse.json({ error: 'This event is not open for RSVP' }, { status: 403 });
    }

    // Complete flow check: Once event occur date has passed, restrict RSVP
    const now = new Date();
    if (now > new Date(event.eventDate)) {
      return NextResponse.json({ error: 'RSVP is restricted because this event date has passed' }, { status: 400 });
    }

    // Optional check: If there is an RSVP deadline and it has passed
    if (event.rsvpDeadline && now > new Date(event.rsvpDeadline)) {
      return NextResponse.json({ error: 'RSVP is closed because the RSVP deadline has passed' }, { status: 400 });
    }

    const rsvp = await prisma.rsvp.upsert({
      where: {
        alumniId_eventId: {
          alumniId: alumni.id,
          eventId: id
        }
      },
      update: {
        status: status as RsvpStatus,
        message: message || null,
        respondedAt: new Date()
      },
      create: {
        alumniId: alumni.id,
        eventId: id,
        status: status as RsvpStatus,
        message: message || null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'RSVP submitted successfully',
      rsvp
    });
  } catch (error) {
    console.error('Error submitting RSVP:', error);
    return NextResponse.json({ error: 'Failed to submit RSVP' }, { status: 500 });
  }
}
