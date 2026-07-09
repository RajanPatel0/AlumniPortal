import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';

// Helper to check if current user is ADMIN
async function getAuthenticatedStaffMember(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return null;
  try {
    const payload = verifyAccessToken(token);
    return await prisma.staff.findUnique({ where: { id: payload.id } });
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const staff = await getAuthenticatedStaffMember(req);
  if (!staff) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const campuses = await prisma.campus.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(campuses);
}

export async function POST(req: NextRequest) {
  const staff = await getAuthenticatedStaffMember(req);
  if (!staff || staff.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { name, code } = await req.json();
  if (!name || !code) {
    return NextResponse.json({ error: 'Name and code are required' }, { status: 400 });
  }
  const existing = await prisma.campus.findFirst({
    where: { OR: [{ name }, { code }] },
  });
  if (existing) {
    return NextResponse.json({ error: 'Campus name or code already exists' }, { status: 400 });
  }
  const campus = await prisma.campus.create({ data: { name, code } });
  return NextResponse.json(campus);
}