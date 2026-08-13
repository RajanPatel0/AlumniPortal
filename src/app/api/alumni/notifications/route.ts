import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAlumni } from '@/lib/auth/getCurrentAlumni';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const alumni = await getCurrentAlumni();
    if (!alumni) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: alumni.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId: alumni.id } }),
      prisma.notification.count({
        where: { userId: alumni.id, isRead: false },
      }),
    ]);

    return NextResponse.json({
      data: notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err: unknown) {
    console.error('Error fetching alumni notifications:', err);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const alumni = await getCurrentAlumni();
    if (!alumni) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      await prisma.notification.updateMany({
        where: { userId: alumni.id, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (notificationId) {
      await prisma.notification.updateMany({
        where: { id: notificationId, userId: alumni.id },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: 'Notification marked as read' });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (err: unknown) {
    console.error('Error updating notification read state:', err);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const alumni = await getCurrentAlumni();
    if (!alumni) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId: alumni.id,
      },
    });

    return NextResponse.json({ success: true, message: 'Notification deleted' });
  } catch (err: unknown) {
    console.error('Error deleting notification:', err);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
