import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';

async function isAdmin(req: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return false;
  try {
    const payload = verifyAccessToken(token);
    const staff = await prisma.staff.findUnique({ where: { id: payload.id } });
    return staff?.role === 'ADMIN';
  } catch {
    return false;
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const { name, code } = await req.json();
  if (!name || !code) {
    return NextResponse.json({ error: 'Name and code are required' }, { status: 400 });
  }
  const existing = await prisma.campus.findFirst({
    where: { OR: [{ name }, { code }], NOT: { id } },
  });
  if (existing) {
    return NextResponse.json({ error: 'Campus name or code already exists' }, { status: 400 });
  }
  const campus = await prisma.campus.update({
    where: { id },
    data: { name, code },
  });
  return NextResponse.json(campus);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const staffCount = await prisma.staff.count({ where: { campusId: id } });
  const alumniCount = await prisma.alumni.count({ where: { campusId: id } });
  if (staffCount > 0 || alumniCount > 0) {
    return NextResponse.json({ error: 'Cannot delete campus with associated staff or alumni' }, { status: 400 });
  }
  await prisma.campus.delete({ where: { id } });
  return NextResponse.json({ success: true });
}