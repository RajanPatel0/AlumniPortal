import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedStaff } from '@/lib/auth/staff-auth';
import { UNDISCLOSED_COMPANY_VARIANTS, NOT_SPECIFIED_COMPANY } from '@/lib/company-utils';

export async function POST(req: NextRequest) {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff || staff.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const variantsList = Array.from(UNDISCLOSED_COMPANY_VARIANTS);

    // Find all alumni with company matching undisclosed variants
    const targetAlumni = await prisma.alumni.findMany({
      where: {
        OR: [
          { currentCompany: { in: variantsList } },
          { currentCompany: '' },
        ],
      },
      select: { id: true, currentCompany: true },
    });

    if (targetAlumni.length === 0) {
      return NextResponse.json({
        message: 'No legacy undisclosed company entries found needing cleanup.',
        affectedCount: 0,
      });
    }

    const affectedIds = targetAlumni.map((a) => a.id);

    // Bulk update alumni records
    const updateResult = await prisma.alumni.updateMany({
      where: {
        id: { in: affectedIds },
      },
      data: {
        currentCompany: NOT_SPECIFIED_COMPANY,
      },
    });

    // Also update current WorkExperiences where company is in variant list
    await prisma.workExperience.updateMany({
      where: {
        alumniId: { in: affectedIds },
        isCurrent: true,
        company: { in: variantsList },
      },
      data: {
        company: NOT_SPECIFIED_COMPANY,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${updateResult.count} alumni records to "${NOT_SPECIFIED_COMPANY}".`,
      affectedCount: updateResult.count,
    });
  } catch (error) {
    console.error('[NORMALIZE_COMPANIES_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
