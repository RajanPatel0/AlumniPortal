import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [branchRows, courseRows, companyRows] = await Promise.all([
      prisma.alumni.findMany({
        select: { branch: true },
        distinct: ['branch'],
        orderBy: { branch: 'asc' },
      }),
      prisma.alumni.findMany({
        where: {
          course: {
            not: null,
            notIn: [''],
          },
        },
        select: { course: true },
        distinct: ['course'],
        orderBy: { course: 'asc' },
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
    ]);

    return NextResponse.json({
      branches: branchRows.map((r) => r.branch).filter(Boolean),
      courses: courseRows.map((r) => r.course).filter(Boolean),
      companies: companyRows.map((r) => r.currentCompany).filter(Boolean),
    });
  } catch (error) {
    console.error('[GET_ALUMNI_OPTIONS_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
