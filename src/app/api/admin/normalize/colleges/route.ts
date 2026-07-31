import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return null;
  try {
    const payload = verifyAccessToken(token);
    const staff = await prisma.staff.findUnique({ where: { id: payload.id } });
    if (!staff || staff.role !== 'ADMIN') return null;
    return staff;
  } catch {
    return null;
  }
}

// Best-guess campus suggestion logic based on college text keywords
function computeBestGuessCampus(collegeText: string, campuses: { id: string; name: string; code: string }[]) {
  const lower = collegeText.toLowerCase();

  for (const c of campuses) {
    if (c.code && c.code !== 'main' && lower.includes(c.code.toLowerCase())) {
      return c;
    }
  }

  for (const c of campuses) {
    const words = c.name.split(/\s+/).map((w) => w.replace(/[^a-zA-Z]/g, '').toLowerCase());
    for (const w of words) {
      if (w.length > 3 && !['campus', 'center', 'ikgptu', 'ptu', 'university'].includes(w) && lower.includes(w)) {
        return c;
      }
    }
  }

  const mainCampus = campuses.find((c) => c.code === 'main') || campuses[0];
  return mainCampus;
}

export async function GET(req: NextRequest) {
  const admin = await checkAdminAuth();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const campuses = await prisma.campus.findMany({ orderBy: { name: 'asc' } });
    const approvedAffiliatedColleges = await prisma.affiliatedCollege.findMany({
      where: { isApproved: true },
      orderBy: { name: 'asc' },
    });

    const alumniColleges = await prisma.alumni.groupBy({
      by: ['college'],
      _count: { college: true },
    });

    const requestColleges = await prisma.registrationRequest.groupBy({
      by: ['college'],
      _count: { college: true },
    });

    const countMap = new Map<string, { alumniCount: number; requestCount: number }>();

    for (const row of alumniColleges) {
      if (!row.college) continue;
      const key = row.college.trim();
      const existing = countMap.get(key) || { alumniCount: 0, requestCount: 0 };
      existing.alumniCount += row._count.college;
      countMap.set(key, existing);
    }

    for (const row of requestColleges) {
      if (!row.college) continue;
      const key = row.college.trim();
      const existing = countMap.get(key) || { alumniCount: 0, requestCount: 0 };
      existing.requestCount += row._count.college;
      countMap.set(key, existing);
    }

    const clusters: any[] = [];
    for (const [collegeText, counts] of countMap.entries()) {
      const suggestedCampus = computeBestGuessCampus(collegeText, campuses);
      clusters.push({
        collegeText,
        alumniCount: counts.alumniCount,
        requestCount: counts.requestCount,
        totalCount: counts.alumniCount + counts.requestCount,
        suggestedCampusId: suggestedCampus?.id || null,
        suggestedCampusName: suggestedCampus?.name || 'Main Campus',
      });
    }

    clusters.sort((a, b) => b.totalCount - a.totalCount);

    return NextResponse.json({
      clusters,
      campuses,
      approvedAffiliatedColleges,
    });
  } catch (error: any) {
    console.error('[GET_COLLEGE_CLUSTERS]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await checkAdminAuth();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      selectedColleges,
      actionType,
      targetCampusId,
      affiliatedMode,
      newCollegeName,
      targetAffiliatedId,
    } = body;

    if (!Array.isArray(selectedColleges) || selectedColleges.length === 0) {
      return NextResponse.json({ error: 'No college text variants selected' }, { status: 400 });
    }

    const campuses = await prisma.campus.findMany();
    const mainCampus = campuses.find((c) => c.code === 'main') || campuses[0];

    // Collect affected IDs before updating for audit logging
    const matchingAlumni = await prisma.alumni.findMany({
      where: { college: { in: selectedColleges } },
      select: { id: true },
    });
    const matchingRequests = await prisma.registrationRequest.findMany({
      where: { college: { in: selectedColleges } },
      select: { id: true },
    });

    const affectedIds = [
      ...matchingAlumni.map((a) => `alumni:${a.id}`),
      ...matchingRequests.map((r) => `req:${r.id}`),
    ];

    let updatedAlumniCount = 0;
    let updatedRequestsCount = 0;

    if (actionType === 'MAP_TO_CAMPUS') {
      if (!targetCampusId) {
        return NextResponse.json({ error: 'Target Campus selection is required' }, { status: 400 });
      }
      const targetCampus = campuses.find((c) => c.id === targetCampusId);
      if (!targetCampus) {
        return NextResponse.json({ error: 'Invalid target campus' }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        const alumniRes = await tx.alumni.updateMany({
          where: { college: { in: selectedColleges } },
          data: {
            campusId: targetCampus.id,
            college: targetCampus.name,
            affiliatedCollegeId: null,
            needsReview: false,
          },
        });
        updatedAlumniCount = alumniRes.count;

        const requestRes = await tx.registrationRequest.updateMany({
          where: { college: { in: selectedColleges } },
          data: {
            campusId: targetCampus.id,
            college: targetCampus.name,
            affiliatedCollegeId: null,
            needsReview: false,
          },
        });
        updatedRequestsCount = requestRes.count;

        await tx.normalizationMergeLog.create({
          data: {
            field: 'college',
            fromValues: JSON.stringify(selectedColleges),
            toValue: targetCampus.name,
            affectedIds: JSON.stringify(affectedIds),
            performedBy: admin.email || admin.id,
          },
        });
      }, { timeout: 30000 });

      return NextResponse.json({
        message: `Mapped ${selectedColleges.length} college variants (${updatedAlumniCount} alumni, ${updatedRequestsCount} requests) to constituent campus "${targetCampus.name}".`,
        updatedAlumniCount,
        updatedRequestsCount,
      });
    } else if (actionType === 'TREAT_AS_AFFILIATED') {
      let targetAff: { id: string; name: string };

      if (affiliatedMode === 'CREATE_NEW') {
        if (!newCollegeName?.trim()) {
          return NextResponse.json({ error: 'New affiliated college name is required' }, { status: 400 });
        }
        const trimmedName = newCollegeName.trim();
        targetAff = await prisma.affiliatedCollege.upsert({
          where: { name: trimmedName },
          update: { isApproved: true },
          create: {
            name: trimmedName,
            isApproved: true,
            requestedBy: `Admin Action by ${admin.name}`,
          },
        });
      } else if (affiliatedMode === 'MERGE_EXISTING') {
        if (!targetAffiliatedId) {
          return NextResponse.json({ error: 'Target approved affiliated college selection is required' }, { status: 400 });
        }
        const existingAff = await prisma.affiliatedCollege.findUnique({ where: { id: targetAffiliatedId } });
        if (!existingAff) {
          return NextResponse.json({ error: 'Target affiliated college not found' }, { status: 404 });
        }
        targetAff = existingAff;
      } else {
        return NextResponse.json({ error: 'Invalid affiliated mode' }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        const alumniRes = await tx.alumni.updateMany({
          where: { college: { in: selectedColleges } },
          data: {
            campusId: mainCampus.id,
            affiliatedCollegeId: targetAff.id,
            college: targetAff.name,
            needsReview: false,
          },
        });
        updatedAlumniCount = alumniRes.count;

        const requestRes = await tx.registrationRequest.updateMany({
          where: { college: { in: selectedColleges } },
          data: {
            campusId: mainCampus.id,
            affiliatedCollegeId: targetAff.id,
            college: targetAff.name,
            needsReview: false,
          },
        });
        updatedRequestsCount = requestRes.count;

        await tx.normalizationMergeLog.create({
          data: {
            field: 'college',
            fromValues: JSON.stringify(selectedColleges),
            toValue: targetAff.name,
            affectedIds: JSON.stringify(affectedIds),
            performedBy: admin.email || admin.id,
          },
        });
      }, { timeout: 30000 });

      return NextResponse.json({
        message: `Mapped ${selectedColleges.length} college variants (${updatedAlumniCount} alumni, ${updatedRequestsCount} requests) to affiliated college "${targetAff.name}".`,
        updatedAlumniCount,
        updatedRequestsCount,
      });
    } else {
      return NextResponse.json({ error: 'Invalid actionType' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[POST_COLLEGE_NORMALIZATION]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
