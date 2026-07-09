import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedStaff } from '@/lib/auth/staff-auth';
import { deleteFile } from '@/lib/fileUpload';

// ─── GET: Fetch all startups (with campus scoping for sub-admins) ──────────────

export async function GET(req: NextRequest) {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const modules = Array.isArray(staff.modules) ? (staff.modules as string[]) : [];
    if (staff.role !== 'ADMIN' && !modules.includes('startups')) {
      return NextResponse.json({ error: 'Forbidden: Access denied to startups module' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const industry = searchParams.get('industry') || '';
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { founder: { name: { contains: search } } },
      ];
    }

    if (industry && industry !== 'All') {
      whereClause.industry = industry;
    }

    // Campus scoping for sub-admins
    if (staff.role !== 'ADMIN' && staff.campusId) {
      whereClause.founder = {
        ...whereClause.founder,
        campusId: staff.campusId,
      };
    }

    const orderBy = sort === 'name' ? { name: 'asc' as const } : { createdAt: 'desc' as const };

    const [startups, totalCount, distinctIndustries] = await Promise.all([
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
              email: true,
              currentRole: true,
              avatarUrl: true,
              city: true,
              batchYear: true,
              branch: true,
              campusId: true,
            },
          },
        },
      }),
      prisma.startUp.count({ where: whereClause }),
      prisma.startUp.findMany({
        where: { industry: { not: null } },
        distinct: ['industry'],
        select: { industry: true },
      }),
    ]);

    const industries = Array.from(
      new Set(distinctIndustries.map((i) => i.industry).filter(Boolean))
    ) as string[];

    return NextResponse.json({
      startups,
      pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
      filters: { industries },
    });
  } catch (error: any) {
    console.error('[ADMIN_GET_STARTUPS_ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch startups' }, { status: 500 });
  }
}

// ─── DELETE: Remove a startup ─────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const modules = Array.isArray(staff.modules) ? (staff.modules as string[]) : [];
    if (staff.role !== 'ADMIN' && !modules.includes('startups')) {
      return NextResponse.json({ error: 'Forbidden: Access denied to startups module' }, { status: 403 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Startup ID required' }, { status: 400 });
    }

    const startup = await prisma.startUp.findUnique({
      where: { id },
      include: { founder: { select: { campusId: true } } },
    });

    if (!startup) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404 });
    }

    // Sub-admin can only delete startups from their campus
    if (staff.role !== 'ADMIN' && staff.campusId && startup.founder.campusId !== staff.campusId) {
      return NextResponse.json({ error: 'Permission denied: startup belongs to a different campus' }, { status: 403 });
    }

    if (startup.logoUrl) {
      await deleteFile(startup.logoUrl);
    }

    await prisma.startUp.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[ADMIN_DELETE_STARTUP_ERROR]', error);
    return NextResponse.json({ error: 'Failed to delete startup' }, { status: 500 });
  }
}

