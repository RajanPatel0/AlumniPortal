import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedStaff, resolveCampusScope, CampusScopeError } from '@/lib/auth/staff-auth';
import { buildAlumniWhere, CampaignAudienceFilter } from '@/lib/notifications/buildAlumniWhere';
import { NotificationType } from '@prisma/client';
import { triggerNotification } from '@/lib/notifications/triggerNotification';

export async function GET(req: NextRequest) {
  const staff = await getAuthenticatedStaff();
  if (!staff) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '15', 10);
  const skip = (page - 1) * limit;

  // Scoping: Sub-admins only see campaigns they created
  const where: any = {
    campaignGroupId: { not: null },
  };
  if (staff.role !== 'ADMIN') {
    where.createdById = staff.id;
  }

  try {
    // Get distinct campaign group notifications
    const [distinctNotifs, totalDistinctGroups] = await Promise.all([
      prisma.notification.findMany({
        where,
        distinct: ['campaignGroupId'],
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
      prisma.notification.groupBy({
        by: ['campaignGroupId'],
        where,
      }),
    ]);

    const total = totalDistinctGroups.length;
    const groupIds = distinctNotifs
      .map((n) => n.campaignGroupId)
      .filter((id): id is string => id !== null);

    // Fetch all related fanned-out notification rows to aggregate stats
    const allGroupRows = await prisma.notification.findMany({
      where: { campaignGroupId: { in: groupIds } },
    });

    const campaigns = distinctNotifs.map((notif) => {
      const related = allGroupRows.filter((r) => r.campaignGroupId === notif.campaignGroupId);
      
      const totalTargets = related.reduce((sum, r) => sum + (r.totalTargets || 0), 0);
      const sentCount = related.reduce((sum, r) => sum + r.sentCount, 0);
      const failedCount = related.reduce((sum, r) => sum + r.failedCount, 0);
      
      // Determine worst-case push status
      const statuses = related.map((r) => r.pushStatus);
      let pushStatus = notif.pushStatus;
      if (statuses.includes('PROCESSING')) {
        pushStatus = 'PROCESSING';
      } else if (statuses.includes('PENDING')) {
        pushStatus = 'PENDING';
      } else if (statuses.includes('FAILED')) {
        pushStatus = 'FAILED';
      } else if (statuses.every((s) => s === 'COMPLETED')) {
        pushStatus = 'COMPLETED';
      }

      return {
        id: notif.id,
        type: notif.type,
        title: notif.title,
        body: notif.body,
        url: notif.url,
        metadata: notif.metadata,
        audienceTag: notif.audienceTag,
        createdAt: notif.createdAt,
        channel: notif.channel,
        filter: notif.filter,
        pushStatus,
        totalTargets,
        sentCount,
        failedCount,
        createdBy: notif.createdBy,
      };
    });

    return NextResponse.json({
      data: campaigns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err: unknown) {
    console.error('Error fetching notification campaigns:', err);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const staff = await getAuthenticatedStaff();
  if (!staff) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, body: content, url, type = NotificationType.ADMIN_ANNOUNCEMENT, channel, filter = {} } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Notification title is required' }, { status: 400 });
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Notification body is required' }, { status: 400 });
    }

    // Enforce campus scoping
    const scopedFilter: CampaignAudienceFilter = { ...filter };
    if (staff.role !== 'ADMIN') {
      try {
        const campusId = resolveCampusScope(staff);
        scopedFilter.campusId = campusId;
      } catch (err) {
        if (err instanceof CampusScopeError) {
          return NextResponse.json({ error: err.message }, { status: 403 });
        }
        throw err;
      }
    } else {
      if (typeof filter.campusId === 'string' && filter.campusId !== 'all') {
        scopedFilter.campusId = filter.campusId;
      }
    }

    // Run cheap audience count
    const where = buildAlumniWhere(scopedFilter);
    const totalTargets = await prisma.alumni.count({ where });

    if (totalTargets === 0) {
      return NextResponse.json(
        { error: 'Selected audience filter matches 0 alumni. Please adjust filters.' },
        { status: 400 }
      );
    }

    // Call unified triggerNotification helper
    const campaign = await triggerNotification({
      type: type in NotificationType ? type : NotificationType.ADMIN_ANNOUNCEMENT,
      channel: channel === 'INAPP_ONLY' ? 'INAPP_ONLY' : 'PUSH_AND_INAPP',
      title: title.trim(),
      body: content.trim(),
      url: url?.trim() || null,
      filter: scopedFilter,
      createdById: staff.id,
      staffRole: staff.role,
      staffCampusId: staff.campusId || undefined,
    });

    return NextResponse.json(
      {
        success: true,
        campaign: {
          id: campaign.id,
          title: campaign.title,
          pushStatus: campaign.pushStatus,
          totalTargets,
          createdAt: campaign.createdAt,
        },
      },
      { status: 202 }
    );
  } catch (err: unknown) {
    console.error('Error submitting notification campaign:', err);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
