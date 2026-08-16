import { Prisma } from '@prisma/client';

export interface CampaignAudienceFilter {
  campusId?: string | string[] | null;
  batchYear?: number | string | null;
  branch?: string | null;
  college?: string | null;
  course?: string | null;
  inviteStatus?: string | null;
  isRegistered?: boolean | null;
}

/**
 * Builds the Prisma where clause for Alumni audience queries.
 * Used identically by:
 * 1. Live audience count endpoint
 * 2. Campaign submission endpoint
 * 3. Standalone background batch worker
 */
export function buildAlumniWhere(filter: CampaignAudienceFilter = {}): Prisma.AlumniWhereInput {
  const where: Prisma.AlumniWhereInput = {
    isActive: true, // Only target active accounts
  };

  // Campus filter
  if (filter.campusId) {
    if (Array.isArray(filter.campusId)) {
      const validCampuses = filter.campusId.filter(Boolean);
      if (validCampuses.length === 1) {
        where.campusId = validCampuses[0];
      } else if (validCampuses.length > 1) {
        where.campusId = { in: validCampuses };
      }
    } else if (typeof filter.campusId === 'string' && filter.campusId.trim() !== '' && filter.campusId !== 'all') {
      where.campusId = filter.campusId.trim();
    }
  }

  // Batch Year
  if (filter.batchYear !== undefined && filter.batchYear !== null && filter.batchYear !== '') {
    const year = typeof filter.batchYear === 'string' ? parseInt(filter.batchYear, 10) : filter.batchYear;
    if (!isNaN(year) && year > 0) {
      where.batchYear = year;
    }
  }

  // Branch
  if (filter.branch && typeof filter.branch === 'string' && filter.branch.trim() !== '') {
    where.branch = { contains: filter.branch.trim() };
  }

  // College
  if (filter.college && typeof filter.college === 'string' && filter.college.trim() !== '') {
    where.college = { contains: filter.college.trim() };
  }

  // Course
  if (filter.course && typeof filter.course === 'string' && filter.course.trim() !== '') {
    where.course = { contains: filter.course.trim() };
  }

  // Invite / Registration status
  if (filter.inviteStatus && typeof filter.inviteStatus === 'string' && filter.inviteStatus.trim() !== '') {
    if (filter.inviteStatus === 'PENDING') {
      where.inviteStatus = { in: ['PENDING', 'BOUNCED'] };
    } else {
      where.inviteStatus = filter.inviteStatus as never;
    }
  }

  if (typeof filter.isRegistered === 'boolean') {
    where.isRegistered = filter.isRegistered;
  } else {
    // By default for all campaigns/notifications, target registered alumni ONLY
    where.isRegistered = true;
  }

  return where;
}
