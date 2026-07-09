import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';

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

export async function GET(req: NextRequest) {
  const auth = await checkAdminAuth();
  if (auth.error) return auth.error;

  try {
    const staff = auth.staff!;
    const where: Record<string, any> = {};
    if (staff.role !== 'ADMIN' && staff.campusId) {
      where.OR = [
        {
          postedByStaff: {
            campusId: staff.campusId,
          },
        },
        {
          postedByStaff: {
            campusId: null,
          },
        },
        {
          postedByAlumni: {
            campusId: staff.campusId,
          },
        },
      ];
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { eventDate: 'desc' },
      include: {
        _count: {
          select: { rsvps: true }
        },
        postedByStaff: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    const eventIds = events.map((e) => e.id);
    const rsvpGroups =
      eventIds.length > 0
        ? await prisma.rsvp.groupBy({
            by: ['eventId', 'status'],
            where: { eventId: { in: eventIds } },
            _count: { id: true },
          })
        : [];

    const countsMap: Record<string, { ATTENDING: number; MAYBE: number }> = {};
    eventIds.forEach((id) => {
      countsMap[id] = { ATTENDING: 0, MAYBE: 0 };
    });

    rsvpGroups.forEach((g) => {
      if (countsMap[g.eventId]) {
        if (g.status === 'ATTENDING') {
          countsMap[g.eventId].ATTENDING = g._count.id;
        } else if (g.status === 'MAYBE') {
          countsMap[g.eventId].MAYBE = g._count.id;
        }
      }
    });

    const eventsWithRsvpBreakdown = events.map((event) => {
      const counts = countsMap[event.id] || { ATTENDING: 0, MAYBE: 0 };
      return {
        ...event,
        attendingCount: counts.ATTENDING,
        maybeCount: counts.MAYBE,
        totalRsvps: event._count.rsvps,
      };
    });

    return NextResponse.json(eventsWithRsvpBreakdown);
  } catch (error) {
    console.error('Error fetching admin events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await checkAdminAuth();
  if (auth.error) return auth.error;
  const staff = auth.staff!;

  try {
    const body = await req.json();
    const { title, description, category, eventDate, venue, coverImageUrl, rsvpDeadline, isPublished } = body;

    if (!title || !description || !eventDate || !venue) {
      return NextResponse.json({ error: 'Missing required fields: title, description, eventDate, venue' }, { status: 400 });
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

    const event = await prisma.event.create({
      data: {
        title,
        description,
        category: category || 'General',
        eventDate: eventDateParsed,
        venue,
        coverImageUrl: coverImageUrl || null,
        rsvpDeadline: rsvpDeadlineParsed,
        isPublished: isPublished === undefined ? false : !!isPublished,
        postedByStaffId: staff.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Event created successfully',
      event
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
