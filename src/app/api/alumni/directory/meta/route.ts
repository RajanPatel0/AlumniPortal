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

  let authorized = false;
  if (alumniToken) {
    try {
      verifyAlumniAccessToken(alumniToken);
      authorized = true;
    } catch {}
  }
  if (!authorized && staffToken) {
    try {
      verifyAccessToken(staffToken);
      authorized = true;
    } catch {}
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const alumniList = await prisma.alumni.findMany({
      where: { isRegistered: true },
      select: {
        currentCompany: true,
        city: true,
        branch: true,
        course: true,
        batchYear: true,
      },
    });

    const companyCounts: Record<string, number> = {};
    const cityCounts: Record<string, number> = {};
    const branchCounts: Record<string, number> = {};
    const courseCounts: Record<string, number> = {};
    const yearCounts: Record<number, number> = {};

    for (const a of alumniList) {
      if (a.currentCompany && a.currentCompany.trim()) {
        const comp = a.currentCompany.trim();
        companyCounts[comp] = (companyCounts[comp] || 0) + 1;
      }
      if (a.city && a.city.trim()) {
        const city = a.city.trim();
        cityCounts[city] = (cityCounts[city] || 0) + 1;
      }
      if (a.branch && a.branch.trim()) {
        const branch = a.branch.trim();
        branchCounts[branch] = (branchCounts[branch] || 0) + 1;
      }
      if (a.course && a.course.trim()) {
        const course = a.course.trim();
        courseCounts[course] = (courseCounts[course] || 0) + 1;
      }
      if (a.batchYear) {
        yearCounts[a.batchYear] = (yearCounts[a.batchYear] || 0) + 1;
      }
    }

    const companies = Object.entries(companyCounts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));

    const cities = Object.entries(cityCounts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));

    const branches = Object.entries(branchCounts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));

    const courses = Object.entries(courseCounts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));

    const years = Object.entries(yearCounts)
      .map(([valueStr, count]) => ({ value: Number(valueStr), count }))
      .sort((a, b) => b.value - a.value);

    return NextResponse.json({
      companies,
      cities,
      branches,
      courses,
      years,
    });
  } catch (error) {
    console.error('[API_ALUMNI_DIRECTORY_META_ERROR]', error);
    return NextResponse.json({ error: 'Failed to load directory metadata' }, { status: 500 });
  }
}
