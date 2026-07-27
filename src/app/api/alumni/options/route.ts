import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [branchRows, courseRows, companyRows, countryRows] = await Promise.all([
      prisma.academicOption.findMany({
        where: { type: 'BRANCH', isActive: true },
        select: { value: true },
        orderBy: { value: 'asc' },
      }),
      prisma.academicOption.findMany({
        where: { type: 'COURSE', isActive: true },
        select: { value: true },
        orderBy: { value: 'asc' },
      }),
      prisma.alumni.findMany({
        where: {
          currentCompany: {
            not: null,
            notIn: [''],
          },
        },
        select: { currentCompany: true },
        distinct: ['currentCompany'],
        orderBy: { currentCompany: 'asc' },
      }),
      prisma.pincodeLocation.findMany({
        where: {
          status: 'FOUND',
          country: {
            not: '',
          },
        },
        select: { country: true },
        distinct: ['country'],
        orderBy: { country: 'asc' },
      }),
    ]);

    return NextResponse.json({
      branches: branchRows.map((r) => r.value).filter(Boolean),
      courses: courseRows.map((r) => r.value).filter(Boolean),
      companies: companyRows.map((r) => r.currentCompany).filter(Boolean),
      countries: countryRows.map((r) => r.country).filter(Boolean),
    });
  } catch (error) {
    console.error('[GET_ALUMNI_OPTIONS_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
