import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAlumni } from '@/lib/auth/getCurrentAlumni';
import { prisma } from '@/lib/prisma';
import { getAlumniAudienceTags } from '@/lib/notifications/tags';

export async function GET(req: NextRequest) {
  try {
    const alumni = await getCurrentAlumni();
    if (!alumni) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const alumniWithCampus = await prisma.alumni.findUnique({
      where: { id: alumni.id },
      select: {
        id: true,
        batchYear: true,
        branch: true,
        course: true,
        campus: { select: { code: true } }
      }
    });

    if (!alumniWithCampus) {
      return NextResponse.json({ data: [], nextCursor: null, unreadCount: 0 });
    }

    // Map campus.code to campusCode for getAlumniAudienceTags
    const alumniData = {
      id: alumniWithCampus.id,
      campusCode: alumniWithCampus.campus.code,
      batchYear: alumniWithCampus.batchYear,
      branch: alumniWithCampus.branch,
      course: alumniWithCampus.course
    };

    const followedCommunities = await prisma.communityMember.findMany({
      where: { alumniId: alumni.id },
      select: { communityId: true, isFollowingNewsletter: true }
    });

    const userTags = getAlumniAudienceTags(
      alumniData,
      followedCommunities
    );

    let whereCondition: any = {
      audienceTag: { in: userTags },
      userStates: {
        none: {
          userId: alumni.id,
          isDeleted: true
        }
      }
    };

    if (cursor) {
      const cursorItem = await prisma.notification.findUnique({
        where: { id: cursor },
        select: { createdAt: true }
      });
      
      if (cursorItem) {
        whereCondition = {
          ...whereCondition,
          OR: [
            { createdAt: { lt: cursorItem.createdAt } },
            {
              createdAt: cursorItem.createdAt,
              id: { lt: cursor } // Tie-breaker: ID descending
            }
          ]
        };
      }
    }

    const [notificationsWithExtra, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereCondition,
        take: limit + 1,
        orderBy: [
          { createdAt: 'desc' },
          { id: 'desc' }
        ],
        include: {
          userStates: {
            where: { userId: alumni.id }
          }
        }
      }),
      prisma.notification.count({
        where: {
          audienceTag: { in: userTags },
          userStates: { none: { userId: alumni.id, OR: [{ isRead: true }, { isDeleted: true }] } }
        }
      })
    ]);

    let nextCursor: string | null = null;
    let data = notificationsWithExtra.map(n => {
      const state = n.userStates[0];
      return {
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        url: n.url,
        metadata: n.metadata,
        createdAt: n.createdAt,
        isRead: state ? state.isRead : false,
      };
    });

    if (data.length > limit) {
      const nextItem = data.pop();
      nextCursor = nextItem?.id || null;
    }

    return NextResponse.json({
      data,
      nextCursor,
      unreadCount,
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

    const alumniWithCampus = await prisma.alumni.findUnique({
      where: { id: alumni.id },
      select: {
        id: true,
        batchYear: true,
        branch: true,
        course: true,
        campus: { select: { code: true } }
      }
    });

    if (!alumniWithCampus) {
      return NextResponse.json({ error: 'Alumni record not found' }, { status: 404 });
    }

    const alumniData = {
      id: alumniWithCampus.id,
      campusCode: alumniWithCampus.campus.code,
      batchYear: alumniWithCampus.batchYear,
      branch: alumniWithCampus.branch,
      course: alumniWithCampus.course
    };

    const followedCommunities = await prisma.communityMember.findMany({
      where: { alumniId: alumni.id },
      select: { communityId: true, isFollowingNewsletter: true }
    });

    const userTags = getAlumniAudienceTags(
      alumniData,
      followedCommunities
    );

    if (markAll) {
      const unreadNotifications = await prisma.notification.findMany({
        where: {
          audienceTag: { in: userTags },
          userStates: { none: { userId: alumni.id, OR: [{ isRead: true }, { isDeleted: true }] } }
        },
        select: { id: true }
      });

      const unreadIds = unreadNotifications.map(n => n.id);

      // Batch insert in chunks of 500
      const CHUNK_SIZE = 500;
      for (let i = 0; i < unreadIds.length; i += CHUNK_SIZE) {
        const chunk = unreadIds.slice(i, i + CHUNK_SIZE);
        
        await prisma.notificationState.createMany({
          data: chunk.map((id) => ({
            userId: alumni.id,
            notificationId: id,
            isRead: true,
            isDeleted: false,
          })),
          skipDuplicates: true
        });
      }

      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (notificationId) {
      await prisma.notificationState.upsert({
        where: {
          userId_notificationId: {
            userId: alumni.id,
            notificationId,
          }
        },
        update: { isRead: true },
        create: {
          userId: alumni.id,
          notificationId,
          isRead: true,
          isDeleted: false,
        }
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

    await prisma.notificationState.upsert({
      where: {
        userId_notificationId: {
          userId: alumni.id,
          notificationId,
        }
      },
      update: { isDeleted: true },
      create: {
        userId: alumni.id,
        notificationId,
        isRead: true,
        isDeleted: true,
      }
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
