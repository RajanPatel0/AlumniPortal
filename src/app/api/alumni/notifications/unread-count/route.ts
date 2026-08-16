import { NextResponse } from 'next/server';
import { getCurrentAlumni } from '@/lib/auth/getCurrentAlumni';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const alumni = await getCurrentAlumni();
    if (!alumni) {
      return NextResponse.json({ unreadCount: 0 });
    }

    const unreadCount = await prisma.notification.count({
      where: { userId: alumni.id, isRead: false },
    });

    return NextResponse.json({ unreadCount });
  } catch (err) {
    console.error('Error fetching unread notification count:', err);
    return NextResponse.json({ unreadCount: 0 });
  }
}
