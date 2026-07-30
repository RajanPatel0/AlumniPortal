import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return null;
  try {
    const payload = verifyAccessToken(token);
    const staff = await prisma.staff.findUnique({ where: { id: payload.id } });
    if (!staff || staff.role !== 'ADMIN') return null;
    return staff;
  } catch {
    return null;
  }
}

// GET: List all unapproved (pending) affiliated colleges with referencing counts > 0
export async function GET(req: NextRequest) {
  const admin = await checkAdminAuth();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pendingColleges = await prisma.affiliatedCollege.findMany({
      where: { isApproved: false },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            alumni: true,
            registrationRequests: true,
          },
        },
      },
    });

    const approvedColleges = await prisma.affiliatedCollege.findMany({
      where: { isApproved: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    const pendingList = pendingColleges
      .map((col) => ({
        id: col.id,
        name: col.name,
        requestedBy: col.requestedBy || 'Anonymous',
        createdAt: col.createdAt,
        alumniCount: col._count.alumni,
        requestCount: col._count.registrationRequests,
        totalReferencing: col._count.alumni + col._count.registrationRequests,
      }))
      .filter((col) => col.totalReferencing > 0);

    return NextResponse.json({
      pending: pendingList,
      approved: approvedColleges,
    });
  } catch (error: any) {
    console.error('[GET_ADMIN_AFFILIATED_COLLEGES]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
