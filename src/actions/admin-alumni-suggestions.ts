'use server';

import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

export const getAlumniSuggestions = unstable_cache(
  async () => {
    try {
      const [campuses, academicOptions] = await Promise.all([
        prisma.campus.findMany({
          select: { name: true },
          orderBy: { name: 'asc' },
        }),
        prisma.academicOption.findMany({
          where: { isActive: true },
          select: { type: true, value: true },
          orderBy: { value: 'asc' },
        }),
      ]);

      const colleges = campuses.map((c) => c.name);

      const branches = academicOptions
        .filter((o) => o.type === 'BRANCH')
        .map((o) => o.value);

      const courses = academicOptions
        .filter((o) => o.type === 'COURSE')
        .map((o) => o.value);

      return {
        colleges,
        branches,
        courses,
      };
    } catch (error) {
      console.error('Error fetching alumni suggestions on server:', error);
      return {
        colleges: [],
        branches: [],
        courses: [],
      };
    }
  },
  ['alumni-edit-suggestions'],
  {
    revalidate: 300, // cache for 5 minutes
    tags: ['alumni-suggestions'],
  }
);
