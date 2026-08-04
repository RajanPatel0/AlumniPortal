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

    if (isStaff) {
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

    // Alumni self-lookup: always fetch viewerId only
    const alumni = await prisma.alumni.findUnique({
      where: { id: viewerId },
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

    const { passwordHash, ...alumniWithoutPassword } = alumni;

    // Resolve current job details from active work experience if present
    const activeExp = alumni.workExperience.find(exp => exp.isCurrent);
    if (activeExp) {
      alumniWithoutPassword.currentRole = activeExp.title;
      alumniWithoutPassword.currentCompany = activeExp.company;
    }

    return NextResponse.json({ user: alumniWithoutPassword, isSelf: true, isAdmin: false });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}