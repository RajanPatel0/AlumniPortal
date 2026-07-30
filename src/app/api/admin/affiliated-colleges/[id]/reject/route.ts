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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdminAuth();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const college = await prisma.affiliatedCollege.findUnique({ where: { id } });
    if (!college) {
      return NextResponse.json({ error: 'Affiliated college not found' }, { status: 404 });
    }

    let unlinkedAlumniCount = 0;
    let unlinkedRequestsCount = 0;

    await prisma.$transaction(async (tx) => {
      const alumniRes = await tx.alumni.updateMany({
        where: { affiliatedCollegeId: id },
        data: {
          affiliatedCollegeId: null,
          needsReview: true,
        },
      });
      unlinkedAlumniCount = alumniRes.count;

      const requestsRes = await tx.registrationRequest.updateMany({
        where: { affiliatedCollegeId: id },
        data: {
          affiliatedCollegeId: null,
          needsReview: true,
        },
      });
      unlinkedRequestsCount = requestsRes.count;

      await tx.affiliatedCollege.delete({ where: { id } });
    });

    return NextResponse.json({
      message: `Rejected and removed college "${college.name}". Unlinked ${unlinkedAlumniCount} alumni and ${unlinkedRequestsCount} registration requests (flagged for review).`,
      unlinkedAlumniCount,
      unlinkedRequestsCount,
    });
  } catch (error: any) {
    console.error('[REJECT_AFFILIATED_COLLEGE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
