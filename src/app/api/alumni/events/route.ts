import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAlumniOrStaff } from '@/lib/auth/getCurrentAlumni';

export async function GET(req: NextRequest) {
  const identity = await getCurrentAlumniOrStaff();
  if (!identity) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Resolve the alumni id — null means admin viewer (no personal RSVP tracking)
  const alumniId = identity.isAdmin ? null : identity.alumni.id;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const sort = searchParams.get('sort') || 'date';
    const skip = (page - 1) * limit;

    const whereClause: any = {
      isPublished: true,
    };

    if (category && category !== 'All') {
      whereClause.category = category;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { venue: { contains: search } },
      ];
    }

    const orderBy: any =
      sort === 'newest' ? { createdAt: 'desc' } : { eventDate: 'asc' };

    const [events, totalCount] = await Promise.all([
      prisma.event.findMany({
        where: whereClause,
        orderBy,
        skip,
        take: limit,
        include: {
          postedByAlumni: {
            select: { id: true, name: true, avatarUrl: true, currentRole: true },
          },
          postedByStaff: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.event.count({ where: whereClause }),
    ]);

    const eventIds = events.map((e) => e.id);

    const [rsvpGroups, myRsvps] = await Promise.all([
      eventIds.length > 0
        ? prisma.rsvp.groupBy({
            by: ['eventId'],
            where: { eventId: { in: eventIds }, status: 'ATTENDING' },
            _count: { id: true },
          })
        : Promise.resolve([]),
      // Only fetch personal RSVPs if a real alumni is viewing
      eventIds.length > 0 && alumniId
        ? prisma.rsvp.findMany({
            where: { alumniId, eventId: { in: eventIds } },
            select: { eventId: true, status: true, message: true },
          })
        : Promise.resolve([]),
    ]);

    const attendingCounts: Record<string, number> = {};
    const myRsvpMap: Record<string, { status: any; message: string | null }> = {};

    eventIds.forEach((id) => {
      attendingCounts[id] = 0;
    });

    rsvpGroups.forEach((g) => {
      attendingCounts[g.eventId] = g._count.id;
    });

    myRsvps.forEach((r) => {
      myRsvpMap[r.eventId] = { status: r.status, message: r.message };
    });

    const eventsWithRsvps = events.map((event) => ({
      ...event,
      attendingCount: attendingCounts[event.id] || 0,
      myRsvp: myRsvpMap[event.id] || null,
      postedByMe: alumniId ? event.postedByAlumniId === alumniId : false,
    }));

    return NextResponse.json({
      events: eventsWithRsvps,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching alumni events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

