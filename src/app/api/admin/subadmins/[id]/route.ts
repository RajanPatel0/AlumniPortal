import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

async function getAdmin(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return null;
  try {
    const payload = verifyAccessToken(token);
    const staff = await prisma.staff.findUnique({ where: { id: payload.id } });
    return staff?.role === 'ADMIN' ? staff : null;
  } catch {
    return null;
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;

  const target = await prisma.staff.findUnique({ where: { id } });
  if (!target || target.role !== 'SUB_ADMIN') {
    return NextResponse.json({ error: 'Sub-admin not found' }, { status: 404 });
  }

  const { name, email, campusId, modules, password } = await req.json();
  if (!name || !email || !campusId || !modules) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (!Array.isArray(modules) || modules.length === 0) {
    return NextResponse.json({ error: 'At least one module must be selected' }, { status: 400 });
  }

  const campus = await prisma.campus.findUnique({ where: { id: campusId } });
  if (!campus) {
    return NextResponse.json({ error: 'Invalid campus' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase();
  const existing = await prisma.staff.findFirst({
    where: { email: normalizedEmail, NOT: { id } },
  });
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
  }

  const data: Record<string, unknown> = {
    name,
    email: normalizedEmail,
    campusId,
    modules,
  };

  if (password) {
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    data.passwordHash = await bcrypt.hash(password, 10);
  }

  const subAdmin = await prisma.staff.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      modules: true,
      campus: { select: { id: true, name: true } },
      createdBy: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json({ success: true, subAdmin });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;

  const target = await prisma.staff.findUnique({ where: { id } });
  if (!target || target.role !== 'SUB_ADMIN') {
    return NextResponse.json({ error: 'Sub-admin not found' }, { status: 404 });
  }

  await prisma.staff.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
