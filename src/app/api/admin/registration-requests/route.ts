import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedStaff, resolveCampusScope, CampusScopeError } from '@/lib/auth/staff-auth';

export async function GET() {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const modules = Array.isArray(staff.modules) ? (staff.modules as string[]) : [];
    if (staff.role !== 'ADMIN' && !modules.includes('requests')) {
      return NextResponse.json({ error: 'Forbidden: Access denied to registration requests' }, { status: 403 });
    }

    let scopedCampusId: string | null;
    try {
      scopedCampusId = resolveCampusScope(staff, staff.campusId);
    } catch (err) {
      if (err instanceof CampusScopeError) {
        return NextResponse.json({ error: err.message }, { status: 403 });
      }
      throw err;
    }

    const where: Record<string, unknown> = { status: 'PENDING' };
    if (scopedCampusId) {
      where.campusId = scopedCampusId;
    }

    const requests = await prisma.registrationRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        campus: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('[ADMIN_REGISTRATION_REQUESTS_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch registration requests' }, { status: 500 });
  }
}
