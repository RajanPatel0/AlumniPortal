import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedStaff, resolveCampusScope, CampusScopeError } from '@/lib/auth/staff-auth';
import { buildAlumniWhere, CampaignAudienceFilter } from '@/lib/notifications/buildAlumniWhere';

export async function POST(req: NextRequest) {
  const staff = await getAuthenticatedStaff();
  if (!staff) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const rawFilter: CampaignAudienceFilter = body.filter || {};

    // Enforce campus scoping
    let scopedFilter: CampaignAudienceFilter = { ...rawFilter };

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
      // Admin: if single campus requested, validate; if array, keep as array
      if (typeof rawFilter.campusId === 'string' && rawFilter.campusId !== 'all') {
        scopedFilter.campusId = rawFilter.campusId;
      }
    }

    const where = buildAlumniWhere(scopedFilter);

    // Cheap count queries
    const [totalAlumni, subscribedDevices] = await Promise.all([
      prisma.alumni.count({ where }),
      prisma.pushSubscription.count({
        where: {
          user: where,
        },
      }),
    ]);

    return NextResponse.json({
      totalAlumni,
      subscribedDevices,
      filter: scopedFilter,
    });
  } catch (err: unknown) {
    console.error('Error calculating audience count:', err);
    return NextResponse.json(
      { error: 'Failed to calculate audience count' },
      { status: 500 }
    );
  }
}
