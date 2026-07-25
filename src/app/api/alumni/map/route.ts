import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAlumniAccessToken } from '@/lib/auth/alumni-jwt';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  // Authentication check
  const cookieStore = await cookies();
  const alumniToken = cookieStore.get('alumniAccessToken')?.value;
  const staffToken = cookieStore.get('accessToken')?.value;

  if (!alumniToken && !staffToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let authorized = false;
  if (alumniToken) {
    try { verifyAlumniAccessToken(alumniToken); authorized = true; } catch {}
  }
  if (!authorized && staffToken) {
    try { verifyAccessToken(staffToken); authorized = true; } catch {}
  }
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);

  // Bounding box parameters
  const north = searchParams.get('north') ? parseFloat(searchParams.get('north')!) : null;
  const south = searchParams.get('south') ? parseFloat(searchParams.get('south')!) : null;
  const east = searchParams.get('east') ? parseFloat(searchParams.get('east')!) : null;
  const west = searchParams.get('west') ? parseFloat(searchParams.get('west')!) : null;

  // Search filter parameters
  const batchYear = searchParams.get('batchYear') ? parseInt(searchParams.get('batchYear')!) : null;
  const branch = searchParams.get('branch');
  const company = searchParams.get('company');
  const country = searchParams.get('country');

  // Build prisma where query
  const where: any = {
    isRegistered: true,
    mapVisibility: { not: 'HIDDEN' },
    locationId: { not: null },
    location: {
      status: 'FOUND',
    },
  };

  // Add bounding box condition if provided
  if (north !== null && south !== null && east !== null && west !== null) {
    where.location = {
      ...where.location,
      latitude: { gte: south, lte: north },
      longitude: { gte: west, lte: east },
    };
  }

  // Add other query filters
  if (batchYear !== null && !isNaN(batchYear)) {
    where.batchYear = batchYear;
  }
  if (branch) {
    where.branch = { contains: branch };
  }
  if (company) {
    where.currentCompany = { contains: company };
  }
  if (country) {
    where.location = {
      ...where.location,
      country: { contains: country },
    };
  }

  try {
    const alumniList = await prisma.alumni.findMany({
      where,
      select: {
        id: true,
        name: true,
        currentCompany: true,
        currentRole: true,
        linkedinUrl: true,
        avatarUrl: true,
        batchYear: true,
        branch: true,
        location: {
          select: {
            latitude: true,
            longitude: true,
            displayName: true,
          },
        },
        campus: {
          select: {
            code: true,
          },
        },
      },
      take: 1000, // Safety cap on total results returned at once
    });

    // Format the location coordinates and display details nested cleanly
    const formattedAlumni = alumniList.map((alumni) => ({
      id: alumni.id,
      name: alumni.name,
      currentCompany: alumni.currentCompany,
      currentRole: alumni.currentRole,
      linkedinUrl: alumni.linkedinUrl,
      avatarUrl: alumni.avatarUrl,
      batchYear: alumni.batchYear,
      branch: alumni.branch,
      campus: alumni.campus?.code ?? null,
      location: {
        lat: alumni.location?.latitude ?? null,
        lng: alumni.location?.longitude ?? null,
        displayName: alumni.location?.displayName ?? null,
      },
    }));

    return NextResponse.json(
      { alumni: formattedAlumni },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('[MAP_ALUMNI_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
