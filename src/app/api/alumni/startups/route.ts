import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAlumni } from '@/lib/auth/getCurrentAlumni';
import { startupSchema } from '@/schemas/startup';
import { Prisma } from '@prisma/client';

// ─── Helper: resolve current alumni (optional, doesn't throw) ────────────────
async function tryGetCurrentAlumni() {
  try {
    return await getCurrentAlumni();
  } catch {
    return null;
  }
}

// In-memory cache for filter options to prevent full table DISTINCT scans on every pagination/search
interface FiltersCache {
  industries: string[];
  locations: string[];
  designations: string[];
  fetchedAt: number;
}

let filtersCache: FiltersCache | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(req: NextRequest) {
  const currentAlumni = await tryGetCurrentAlumni();
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const industry = searchParams.get('industry') || '';
    const designation = searchParams.get('designation') || '';
    const location = searchParams.get('location') || '';
    const sort = searchParams.get('sort') || 'Name';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '8', 10);

    const skip = (page - 1) * limit;

    // Build Where Clause
    const whereClause: Prisma.StartUpWhereInput = {};

    if (industry && industry !== 'All') {
      whereClause.industry = industry;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Filter by founder characteristics (designation or location/city)
    if ((designation && designation !== 'All') || (location && location !== 'All')) {
      whereClause.founder = {
        currentRole: designation && designation !== 'All' ? designation : undefined,
        city: location && location !== 'All' ? location : undefined,
      };
    }

    // Build Order By
    let orderBy: Prisma.StartUpOrderByWithRelationInput = { name: 'asc' };
    if (sort === 'Newest') {
      orderBy = { createdAt: 'desc' };
    }

    // Fetch startups and total count
    const [startups, totalCount] = await Promise.all([
      prisma.startUp.findMany({
        where: whereClause,
        orderBy,
        skip,
        take: limit,
        include: {
          founder: {
            select: {
              id: true,
              name: true,
              currentRole: true,
              avatarUrl: true,
              city: true,
            },
          },
        },
      }),
      prisma.startUp.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Fetch distinct filter options only if cache is expired/missing
    let industriesList: string[] = [];
    let locationsList: string[] = [];
    let designationsList: string[] = [];
    const now = Date.now();

    if (filtersCache && now - filtersCache.fetchedAt < CACHE_TTL) {
      industriesList = filtersCache.industries;
      locationsList = filtersCache.locations;
      designationsList = filtersCache.designations;
    } else {
      const [distinctIndustries, distinctFounders] = await Promise.all([
        prisma.startUp.findMany({
          where: { industry: { not: null } },
          distinct: ['industry'],
          select: { industry: true },
        }),
        prisma.alumni.findMany({
          where: {
            startups: { some: {} },
          },
          distinct: ['city', 'currentRole'],
          select: {
            city: true,
            currentRole: true,
          },
        }),
      ]);

      industriesList = Array.from(new Set(distinctIndustries.map((item) => item.industry).filter(Boolean))) as string[];
      locationsList = Array.from(new Set(distinctFounders.map((item) => item.city).filter(Boolean))) as string[];
      designationsList = Array.from(new Set(distinctFounders.map((item) => item.currentRole).filter(Boolean))) as string[];

      filtersCache = {
        industries: industriesList,
        locations: locationsList,
        designations: designationsList,
        fetchedAt: now,
      };
    }

    // Annotate each startup with postedByMe flag
    const startupsWithMeta = startups.map((s) => ({
      ...s,
      postedByMe: currentAlumni ? s.founderId === currentAlumni.id : false,
    }));

    return NextResponse.json({
      startups: startupsWithMeta,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
      filters: {
        industries: industriesList,
        locations: locationsList,
        designations: designationsList,
      },
    });
  } catch (error) {
    console.error('Error fetching startups:', error);
    return NextResponse.json({ error: 'Failed to fetch startups' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const alumni = await getCurrentAlumni();
    if (!alumni) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = startupSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const startup = await prisma.startUp.create({
      data: {
        name: validated.data.name,
        description: validated.data.description,
        industry: validated.data.industry,
        websiteUrl: validated.data.websiteUrl || null,
        logoUrl: validated.data.logoUrl || null,
        foundedYear: validated.data.foundedYear || null,
        founderId: alumni.id,
      },
    });

    return NextResponse.json({ success: true, startup }, { status: 201 });
  } catch (error) {
    console.error('Error creating startup:', error);
    return NextResponse.json({ error: 'Failed to register startup' }, { status: 500 });
  }
}

