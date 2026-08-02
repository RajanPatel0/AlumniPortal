import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedStaff } from '@/lib/auth/staff-auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const modules = Array.isArray(staff.modules) ? (staff.modules as string[]) : [];
    if (staff.role !== 'ADMIN' && !modules.includes('requests')) {
      return NextResponse.json({ error: 'Forbidden: Access denied to registration requests' }, { status: 403 });
    }

    const { requestId } = await params;
    const request = await prisma.registrationRequest.findUnique({
      where: { id: requestId },
      include: {
        campus: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true, role: true } }
      }
    });

    if (!request) {
      return NextResponse.json({ error: 'Registration request not found' }, { status: 404 });
    }

    if (staff.role !== 'ADMIN' && request.campusId && request.campusId !== staff.campusId) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to view this request' }, { status: 403 });
    }

    return NextResponse.json(request);
  } catch (error) {
    console.error('[ADMIN_REGISTRATION_REQUEST_DETAIL_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch request' }, { status: 500 });
  }
}