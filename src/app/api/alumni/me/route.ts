import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAlumniAccessToken } from '@/lib/auth/alumni-jwt';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const alumniToken = cookieStore.get('alumniAccessToken')?.value;
  const staffToken = cookieStore.get('accessToken')?.value;

  if (!alumniToken && !staffToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let viewerId: string | null = null;
    let isStaff = false;

    // Check staff token first to avoid mixing staff sessions with alumni profiles
    if (staffToken) {
      try {
        const payload = verifyAccessToken(staffToken);
        viewerId = payload.id;
        isStaff = true;
      } catch {}
    }

    if (!viewerId && alumniToken) {
      try {
        const payload = verifyAlumniAccessToken(alumniToken);
        viewerId = payload.id;
      } catch {}
    }

    if (!viewerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetId = searchParams.get('id');

    // If targetId is not specified, and the viewer is staff, return staff details
    if (!targetId && isStaff) {
      const staff = await prisma.staff.findUnique({
        where: { id: viewerId },
        include: { campus: { select: { id: true, name: true } } },
      });

      if (!staff) {
        return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
      }

      return NextResponse.json({
        user: {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          isAdmin: true,
          role: staff.role,
          college: staff.campus?.name || 'All Campuses (Consolidated)',
          currentRole: staff.role,
        },
        isSelf: false,
        isAdmin: true,
      });
    }

    // Resolve targetId: defaults to viewerId for alumni self-lookup
    const activeTargetId = targetId || viewerId;
    const isSelf = !isStaff && (activeTargetId === viewerId);

    const alumni = await prisma.alumni.findUnique({
      where: { id: activeTargetId },
      include: {
        education: {
          orderBy: { startDate: 'desc' },
        },
        workExperience: {
          orderBy: { startDate: 'desc' },
        },
        campus: {
          select: { id: true, name: true },
        },
      },
    });

    if (!alumni) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ user: alumni, isSelf, isAdmin: isStaff });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}