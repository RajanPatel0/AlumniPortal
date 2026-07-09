import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getAuthenticatedStaff,
  resolveCampusScope,
  CampusScopeError,
} from '@/lib/auth/staff-auth';

export async function GET(req: NextRequest) {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const modules = Array.isArray(staff.modules) ? (staff.modules as string[]) : [];
    if (staff.role !== 'ADMIN' && !modules.includes('dashboard')) {
      return NextResponse.json({ error: 'Forbidden: Access denied to dashboard module' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    let scopedCampusId: string | null;
    try {
      scopedCampusId = resolveCampusScope(staff, searchParams.get('campusId'));
    } catch (err) {
      if (err instanceof CampusScopeError) {
        return NextResponse.json({ error: err.message }, { status: 403 });
      }
      throw err;
    }

    // Alumni and Registration base filters
    const where: Record<string, any> = {};
    if (scopedCampusId) {
      where.campusId = scopedCampusId;
    }

    // Events filter: Filter events created by staff members or alumni of this campus, or global admin
    const eventWhere: Record<string, any> = {};
    if (scopedCampusId) {
      eventWhere.OR = [
        {
          postedByStaff: {
            campusId: scopedCampusId,
          },
        },
        {
          postedByStaff: {
            campusId: null,
          },
        },
        {
          postedByAlumni: {
            campusId: scopedCampusId,
          },
        },
      ];
    }

    // Today's stats boundaries
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Trend queries boundaries: last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      return d;
    }).reverse();

    // Trend queries: last 7 days start date
    const trendStart = last7Days[0];

    // Batch all queries using $transaction
    const batchQueries = [
      prisma.alumni.count({ where }),
      prisma.alumni.count({ where: { ...where, isRegistered: true } }),
      prisma.alumni.count({
        where: { ...where, isRegistered: false, inviteStatus: 'PENDING' },
      }),
      prisma.alumni.count({
        where: { ...where, isRegistered: false, inviteStatus: 'INVITED' },
      }),
      prisma.registrationRequest.count({
        where: { ...where, status: 'PENDING' },
      }),
      prisma.event.count({ where: eventWhere }),
      prisma.rsvp.count({ where: { event: eventWhere } }),
      prisma.alumni.findMany({
        where,
        select: { branch: true },
        distinct: ['branch'],
      }),
      prisma.alumni.findMany({
        where: {
          ...where,
          currentCompany: { not: null, notIn: [''] },
        },
        select: { currentCompany: true },
        distinct: ['currentCompany'],
      }),
      prisma.registrationRequest.count({
        where: { ...where, createdAt: { gte: startOfToday } },
      }),
      prisma.alumni.count({
        where: { ...where, isRegistered: true, registeredAt: { gte: startOfToday } },
      }),
      prisma.event.count({
        where: { ...eventWhere, createdAt: { gte: startOfToday } },
      }),
      prisma.rsvp.count({
        where: { event: eventWhere, respondedAt: { gte: startOfToday } },
      }),
      prisma.alumni.findMany({
        where: {
          ...where,
          isRegistered: true,
          registeredAt: { gte: trendStart },
        },
        select: { registeredAt: true },
      }),
      prisma.alumni.groupBy({
        by: ['branch'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      prisma.alumni.groupBy({
        by: ['currentCompany'],
        where: {
          ...where,
          currentCompany: { not: null, notIn: [''] },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ];

    let distributionPromise;
    if (!scopedCampusId) {
      distributionPromise = prisma.alumni.groupBy({
        by: ['campusId'],
        where,
        _count: { id: true },
      });
    } else {
      distributionPromise = prisma.alumni.groupBy({
        by: ['course'],
        where: {
          ...where,
          course: { not: null, notIn: [''] },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      });
    }

    const results = await prisma.$transaction([
      ...batchQueries,
      distributionPromise,
      ...(scopedCampusId ? [] : [prisma.campus.findMany({ select: { id: true, name: true } })]),
    ]);

    const totalAlumni = results[0] as number;
    const registeredAlumni = results[1] as number;
    const pendingInvites = results[2] as number;
    const invitedAlumni = results[3] as number;
    const pendingRequests = results[4] as number;
    const totalEvents = results[5] as number;
    const totalRsvps = results[6] as number;
    const branchRows = results[7] as any[];
    const companyRows = results[8] as any[];
    const requestsToday = results[9] as number;
    const registrationsToday = results[10] as number;
    const eventsToday = results[11] as number;
    const rsvpsToday = results[12] as number;
    const trendAlumni = results[13] as any[];
    const topBranchesGroup = results[14] as any[];
    const topCompaniesGroup = results[15] as any[];
    const distributionGroup = results[16] as any[];

    const uniqueBranchesCount = branchRows.filter((b) => b.branch).length;
    const uniqueCompaniesCount = companyRows.filter((c) => c.currentCompany).length;

    // Process trend data in-memory
    const trendMap = new Map<string, number>();
    trendAlumni.forEach((al) => {
      if (al.registeredAt) {
        const dateKey = al.registeredAt.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });
        trendMap.set(dateKey, (trendMap.get(dateKey) || 0) + 1);
      }
    });

    const registrationTrend = last7Days.map((day) => {
      const dateKey = day.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
      return {
        date: dateKey,
        count: trendMap.get(dateKey) || 0,
      };
    });

    // Distribution metrics (Donut Chart)
    let distribution: { name: string; count: number }[] = [];
    let distributionType = 'course';

    if (!scopedCampusId) {
      const campuses = results[17] as any[];
      const campusMap = new Map(campuses.map((c) => [c.id, c.name]));
      distribution = distributionGroup.map((cg) => ({
        name: cg.campusId ? campusMap.get(cg.campusId) || 'Unknown' : 'Unassigned',
        count: cg._count.id,
      }));
      distributionType = 'campus';
    } else {
      distribution = distributionGroup.map((cg) => ({
        name: cg.course || 'Unknown',
        count: cg._count.id,
      }));
      distributionType = 'course';
    }

    // Top Branches (Bar Chart)
    const branchDistribution = topBranchesGroup.map((b) => ({
      name: b.branch,
      count: b._count.id,
    }));

    // Top Companies (Bar Chart)
    const companyDistribution = topCompaniesGroup.map((c) => ({
      name: c.currentCompany || 'Unknown',
      count: c._count.id,
    }));

    return NextResponse.json({
      stats: {
        totalAlumni,
        registeredAlumni,
        pendingInvites,
        invitedAlumni,
        pendingRequests,
        totalEvents,
        totalRsvps,
        uniqueBranchesCount,
        uniqueCompaniesCount,
      },
      today: {
        requestsToday,
        registrationsToday,
        eventsToday,
        rsvpsToday,
      },
      charts: {
        registrationTrend,
        distribution,
        distributionType,
        branchDistribution,
        companyDistribution,
      },
    });
  } catch (error) {
    console.error('[GET_ADMIN_DASHBOARD_STATS_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
