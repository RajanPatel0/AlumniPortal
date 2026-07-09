import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';
import { deleteFile } from '@/lib/fileUpload';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  try {
    const payload = verifyAccessToken(token);
    const staff = await prisma.staff.findUnique({ where: { id: payload.id } });
    if (!staff) {
      return { error: NextResponse.json({ error: 'User not found' }, { status: 404 }) };
    }

    // Check permissions for SUB_ADMIN
    const modules = Array.isArray(staff.modules) ? (staff.modules as string[]) : [];
    if (staff.role !== 'ADMIN' && !modules.includes('events')) {
      return { error: NextResponse.json({ error: 'Forbidden: Access denied to events module' }, { status: 403 }) };
    }

    return { staff };
  } catch (err) {
    return { error: NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }) };
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdminAuth();
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const body = await req.json();
    const { title, description, category, eventDate, venue, coverImageUrl, rsvpDeadline, isPublished } = body;

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({ where: { id } });
    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Delete old cover image if changed
    if (existingEvent.coverImageUrl && existingEvent.coverImageUrl !== coverImageUrl) {
      await deleteFile(existingEvent.coverImageUrl);
    }

    if (!title || !description || !eventDate || !venue) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const eventDateParsed = new Date(eventDate);
    if (isNaN(eventDateParsed.getTime())) {
      return NextResponse.json({ error: 'Invalid event date' }, { status: 400 });
    }

    let rsvpDeadlineParsed = null;
    if (rsvpDeadline) {
      rsvpDeadlineParsed = new Date(rsvpDeadline);
      if (isNaN(rsvpDeadlineParsed.getTime())) {
        return NextResponse.json({ error: 'Invalid RSVP deadline date' }, { status: 400 });
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        title,
        description,
        category: category || existingEvent.category,
        eventDate: eventDateParsed,
        venue,
        coverImageUrl: coverImageUrl || null,
        rsvpDeadline: rsvpDeadlineParsed,
        isPublished: isPublished === undefined ? existingEvent.isPublished : !!isPublished
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Event updated successfully',
      event: updatedEvent
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdminAuth();
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    // Check if event exists
    const existingEvent = await prisma.event.findUnique({ where: { id } });
    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Delete cover image from disk
    if (existingEvent.coverImageUrl) {
      await deleteFile(existingEvent.coverImageUrl);
    }

    // Delete related records first to avoid foreign key constraint errors
    await prisma.rsvp.deleteMany({ where: { eventId: id } });
    await prisma.emailLog.deleteMany({ where: { eventId: id } });

    // Delete the event
    await prisma.event.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
