import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = verifyAccessToken(token);
    const staff = await prisma.staff.findUnique({
      where: { id: payload.id },
      include: { campus: true },
    });
    if (!staff) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        campus: staff.campus ? { id: staff.campus.id, name: staff.campus.name } : null,
        modules: staff.modules,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}