import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAlumniOrStaff } from '@/lib/auth/getCurrentAlumni';
import { Prisma } from '@prisma/client';

import type { JobMetadata } from '@/types/jobs';

export async function GET(req: NextRequest) {
  try {
    const identity = await getCurrentAlumniOrStaff();
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve the alumni id (null for admin viewers)
    const alumniId = identity.isAdmin ? null : identity.alumni.id;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '8', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;

    const whereClause: Prisma.JobWhereInput = { isActive: true };

    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { company: { contains: search } },
        { location: { contains: search } },
      ];
    }

    const [jobs, totalCount] = await Promise.all([
      prisma.job.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          postedByAlumni: {
            select: { id: true, name: true, currentRole: true, avatarUrl: true, city: true },
          },
          postedByStaff: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.job.count({ where: whereClause }),
    ]);

    const formattedJobs = jobs.map((job) => {
      const meta = (job.metadata as Partial<JobMetadata>) || {};
      return {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        salaryRange: job.salaryRange,
        type: meta.type || 'Full Time',
        workplaceType: meta.workplaceType || 'On-site',
        experienceRange: meta.experienceRange || 'Not specified',
        industry: meta.industry || '',
        skills: meta.skills || [],
        applyUrl: job.applyUrl,
        isActive: job.isActive,
        createdAt: job.createdAt,
        expireAt: job.expireAt,
        isExpired: job.expireAt ? new Date(job.expireAt) < new Date() : false,
        postedByAlumni: job.postedByAlumni,
        postedByStaff: job.postedByStaff,
        postedByMe: alumniId ? job.postedByAlumniId === alumniId : false,
        appliedByMe: alumniId ? (meta.applicants || []).includes(alumniId) : false,
      };
    });

    return NextResponse.json({
      jobs: formattedJobs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('[GET_ALUMNI_JOBS_ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

