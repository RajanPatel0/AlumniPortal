import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedStaff } from '@/lib/auth/staff-auth';
import { StaffRole } from '@prisma/client';
import { ensureAcademicOptionActive } from '@/lib/academic-options';

export async function POST(req: NextRequest) {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (staff.role !== StaffRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { model, id, branch, course, currentCompany } = body;

    if (!model || !id || !branch?.trim()) {
      return NextResponse.json({ error: 'Missing required parameters (model, id, branch)' }, { status: 400 });
    }

    const cleanBranch = branch.trim();
    const cleanCourse = course?.trim() || null;
    const cleanCompany = currentCompany?.trim() || null;

    // Automatically ensure cleanBranch and cleanCourse are added/activated in AcademicOption table
    await Promise.all([
      ensureAcademicOptionActive('BRANCH', cleanBranch),
      ensureAcademicOptionActive('COURSE', cleanCourse),
    ]);

    if (model === 'ALUMNI') {
      const updated = await prisma.alumni.update({
        where: { id },
        data: {
          branch: cleanBranch,
          course: cleanCourse,
          ...(cleanCompany !== null ? { currentCompany: cleanCompany } : {}),
          needsReview: false, // Resolved by admin
        },
      });
      return NextResponse.json({ message: 'Alumni record resolved successfully', record: updated });
    } else if (model === 'REGISTRATION_REQUEST') {
      const updated = await prisma.registrationRequest.update({
        where: { id },
        data: {
          branch: cleanBranch,
          course: cleanCourse,
          ...(cleanCompany !== null ? { currentCompany: cleanCompany } : {}),
          needsReview: false, // Resolved by admin
        },
      });
      return NextResponse.json({ message: 'Registration request resolved successfully', record: updated });
    } else {
      return NextResponse.json({ error: 'Invalid model parameter. Use ALUMNI or REGISTRATION_REQUEST.' }, { status: 400 });
    }
  } catch (error) {
    console.error('[ADMIN_NORMALIZE_RESOLVE_REVIEW]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
