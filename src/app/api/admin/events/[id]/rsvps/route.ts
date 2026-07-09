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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdminAuth();
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id },
      select: { title: true, eventDate: true }
    });
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const rsvps = await prisma.rsvp.findMany({
      where: { eventId: id },
      include: {
        alumni: {
          select: {
            id: true,
            name: true,
            email: true,
            batchYear: true,
            branch: true,
            course: true,
            currentRole: true,
            currentCompany: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { respondedAt: 'desc' }
    });

    const attendingCount = rsvps.filter(r => r.status === 'ATTENDING').length;
    const maybeCount = rsvps.filter(r => r.status === 'MAYBE').length;
    const notAttendingCount = rsvps.filter(r => r.status === 'NOT_ATTENDING').length;

    return NextResponse.json({
      eventTitle: event.title,
      eventDate: event.eventDate,
      totalCount: rsvps.length,
      attendingCount,
      maybeCount,
      notAttendingCount,
      rsvps
    });
  } catch (error) {
    console.error('Error fetching RSVPs for event:', error);
    return NextResponse.json({ error: 'Failed to fetch RSVPs' }, { status: 500 });
  }
}
