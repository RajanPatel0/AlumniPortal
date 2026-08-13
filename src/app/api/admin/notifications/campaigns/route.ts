import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedStaff, resolveCampusScope, CampusScopeError } from '@/lib/auth/staff-auth';
import { buildAlumniWhere, CampaignAudienceFilter } from '@/lib/notifications/buildAlumniWhere';
import { NotificationType } from '@prisma/client';

export async function GET(req: NextRequest) {
  const staff = await getAuthenticatedStaff();
  if (!staff) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '15', 10);
  const skip = (page - 1) * limit;

  // Scoping: Sub-admins only see campaigns they created or relevant to their campus
  const where: Record<string, unknown> = {};
  if (staff.role !== 'ADMIN') {
    where.createdById = staff.id;
  }

  try {
    const [campaigns, total] = await Promise.all([
      prisma.notificationCampaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
      prisma.notificationCampaign.count({ where }),
    ]);

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
    const { title, body: content, url, type = NotificationType.ADMIN_ANNOUNCEMENT, filter = {} } = body;

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

    // Insert campaign row with status: PENDING
    const campaign = await prisma.notificationCampaign.create({
      data: {
        type: type in NotificationType ? type : NotificationType.ADMIN_ANNOUNCEMENT,
        title: title.trim(),
        body: content.trim(),
        url: url?.trim() || null,
        filter: scopedFilter as never,
        status: 'PENDING',
        totalTargets,
        sentCount: 0,
        failedCount: 0,
        createdById: staff.id,
      },
    });

    // Return immediately (202 Accepted) without synchronous push processing
    return NextResponse.json(
      {
        success: true,
        campaign: {
          id: campaign.id,
          title: campaign.title,
          status: campaign.status,
          totalTargets: campaign.totalTargets,
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
