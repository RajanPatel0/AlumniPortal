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

    const updated = await prisma.affiliatedCollege.update({
      where: { id },
      data: { isApproved: true },
    });

    return NextResponse.json({
      message: `Affiliated college "${updated.name}" has been approved.`,
      college: updated,
    });
  } catch (error: any) {
    console.error('[APPROVE_AFFILIATED_COLLEGE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
