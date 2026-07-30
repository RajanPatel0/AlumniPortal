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
  const body = await req.json().catch(() => ({}));
  const { targetCollegeId } = body;

  if (!targetCollegeId) {
    return NextResponse.json({ error: 'targetCollegeId is required for merging' }, { status: 400 });
  }

  try {
    const pendingCollege = await prisma.affiliatedCollege.findUnique({ where: { id } });
    if (!pendingCollege) {
      return NextResponse.json({ error: 'Pending college not found' }, { status: 404 });
    }

    const targetCollege = await prisma.affiliatedCollege.findUnique({ where: { id: targetCollegeId } });
    if (!targetCollege) {
      return NextResponse.json({ error: 'Target college not found' }, { status: 404 });
    }

    let updatedAlumniCount = 0;
    let updatedRequestsCount = 0;

    await prisma.$transaction(async (tx) => {
      const alumniRes = await tx.alumni.updateMany({
        where: { affiliatedCollegeId: id },
        data: {
          affiliatedCollegeId: targetCollege.id,
          college: targetCollege.name,
        },
      });
      updatedAlumniCount = alumniRes.count;

      const requestsRes = await tx.registrationRequest.updateMany({
        where: { affiliatedCollegeId: id },
        data: {
          affiliatedCollegeId: targetCollege.id,
          college: targetCollege.name,
        },
      });
      updatedRequestsCount = requestsRes.count;

      await tx.affiliatedCollege.delete({ where: { id } });
    });

    return NextResponse.json({
      message: `Merged "${pendingCollege.name}" into "${targetCollege.name}". Updated ${updatedAlumniCount} alumni and ${updatedRequestsCount} registration requests.`,
      updatedAlumniCount,
      updatedRequestsCount,
    });
  } catch (error: any) {
    console.error('[MERGE_AFFILIATED_COLLEGE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
