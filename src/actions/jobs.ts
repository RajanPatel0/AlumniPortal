'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentAlumni, getCurrentAlumniOrStaff } from '@/lib/auth/getCurrentAlumni';
import { getAuthenticatedStaff, hasCampusAccess } from '@/lib/auth/staff-auth';
import { jobSchema, type JobSchemaType } from '@/schemas/job';
import { Prisma } from '@prisma/client';

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

export interface JobFilterParams {
  search?: string;
  type?: string;
  workplace?: string;
  experience?: string;
  industry?: string;
  tab?: 'all' | 'posted' | 'applied' | 'alumni' | 'staff';
  page?: number;
  limit?: number;
  showOpenOnly?: boolean;
}

/** Shape of a job's extra metadata JSON column */
interface JobMetadata {
  workplaceType: string;
  type: string;
  experienceRange: string;
  industry: string;
  skills: string[];
  applicants: string[];
}

// ─────────────────────────────────────────
// SHARED HELPERS  (no repetition between alumni & admin)
// ─────────────────────────────────────────

/** Build a Prisma JobWhereInput from common filter params */
function buildWhereClause(
  params: JobFilterParams,
  tabClause?: Prisma.JobWhereInput,
): Prisma.JobWhereInput {
  const {
    search = '',
    type = 'All',
    workplace = 'All',
    experience = 'All',
    industry = 'All',
    showOpenOnly = false,
  } = params;

  const and: Prisma.JobWhereInput[] = [];

  if (search) {
    and.push({
      OR: [
        { title: { contains: search } },
        { company: { contains: search } },
        { description: { contains: search } },
      ],
    });
  }

  const metaFilter = (key: string, value: string) => ({
    metadata: { path: [key], equals: value },
  });

  if (industry !== 'All') and.push(metaFilter('industry', industry));
  if (type !== 'All') and.push(metaFilter('type', type));
  if (workplace !== 'All') and.push(metaFilter('workplaceType', workplace));
  if (experience !== 'All') and.push(metaFilter('experienceRange', experience));

  if (tabClause) and.push(tabClause);

  if (showOpenOnly) {
    and.push({ isActive: true });
    and.push({ OR: [{ expireAt: null }, { expireAt: { gte: new Date() } }] });
  }

  return and.length > 0 ? { AND: and } : {};
}

/** Extract unique sidebar filter values from all job metadata rows */
function extractFilterOptions(distinctJobs: { metadata: Prisma.JsonValue }[]) {
  const sets = {
    industries: new Set<string>(),
    types: new Set<string>(),
    workplaces: new Set<string>(),
    experiences: new Set<string>(),
  };

  for (const job of distinctJobs) {
    const m = (job.metadata as Partial<JobMetadata>) || {};
    if (m.industry) sets.industries.add(m.industry);
    if (m.type) sets.types.add(m.type);
    if (m.workplaceType) sets.workplaces.add(m.workplaceType);
    if (m.experienceRange) sets.experiences.add(m.experienceRange);
  }

  return {
    industries: Array.from(sets.industries),
    types: Array.from(sets.types),
    workplaces: Array.from(sets.workplaces),
    experiences: Array.from(sets.experiences),
  };
}

/** Select spec for a public alumni mini-profile (reused everywhere) */
const alumniProfileSelect = {
  id: true,
  name: true,
  email: true,
  currentRole: true,
  avatarUrl: true,
  city: true,
} as const;

/** Resolve candidate profiles from an applicant ID list in one batch query */
async function resolveApplicantProfiles(applicantIds: string[]) {
  if (applicantIds.length === 0) return [];
  return prisma.alumni.findMany({
    where: { id: { in: applicantIds } },
    select: alumniProfileSelect,
  });
}

/** Flatten raw metadata onto job shape */
function normalizeMetadata(raw: unknown): JobMetadata {
  const m = (raw as Partial<JobMetadata>) || {};
  return {
    workplaceType: m.workplaceType ?? 'On-site',
    type: m.type ?? 'Full Time',
    experienceRange: m.experienceRange ?? 'Not specified',
    industry: m.industry ?? 'Software',
    skills: m.skills ?? [],
    applicants: m.applicants ?? [],
  };
}

/** Build the metadata object when creating/updating a job */
function buildJobMetadata(data: JobSchemaType): JobMetadata {
  return {
    workplaceType: data.workplaceType,
    type: data.type,
    experienceRange: data.experienceRange,
    industry: data.industry,
    skills: data.skills ? data.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
    applicants: [],
  };
}

/** Common Prisma create-data shape shared by alumni & admin */
function buildJobCreateData(data: JobSchemaType, metadata: JobMetadata) {
  return {
    title: data.title,
    company: data.company,
    description: data.description,
    location: data.location,
    salaryRange: data.salaryRange || null,
    applyUrl: data.applyUrl || null,
    expireAt: data.expireAt || null,
    isActive: true,
    metadata: metadata as unknown as Prisma.InputJsonValue,
  };
}

/** Standard action response type */
type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

// ─────────────────────────────────────────
// ALUMNI ACTIONS
// ─────────────────────────────────────────

export async function getJobsAction(params: JobFilterParams) {
  const identity = await getCurrentAlumniOrStaff();
  if (!identity) throw new Error('Unauthorized');

  // Resolve alumni id — null means an admin/staff is viewing (read-only)
  const alumniId = identity.isAdmin ? null : identity.alumni.id;

  const { tab = 'all', page = 1, limit = 8 } = params;
  const skip = (page - 1) * limit;

  let tabClause: Prisma.JobWhereInput | undefined;
  if (alumniId) {
    if (tab === 'posted') tabClause = { postedByAlumniId: alumniId };
    else if (tab === 'applied')
      tabClause = { metadata: { path: '$.applicants', string_contains: alumniId } };
  }

  const whereClause = buildWhereClause(params, tabClause);

  const [jobs, totalCount, distinctJobs] = await Promise.all([
    prisma.job.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        postedByAlumni: { select: { id: true, name: true, currentRole: true, avatarUrl: true, city: true } },
      },
    }),
    prisma.job.count({ where: whereClause }),
    prisma.job.findMany({
      where: { metadata: { not: Prisma.JsonNull } },
      select: { metadata: true },
    }),
  ]);

  const formattedJobs = await Promise.all(
    jobs.map(async (job) => {
      const meta = normalizeMetadata(job.metadata);
      const isOwner = alumniId ? job.postedByAlumniId === alumniId : false;

      return {
        ...job,
        ...meta,
        applicantsProfiles: isOwner ? await resolveApplicantProfiles(meta.applicants) : [],
        applicants: meta.applicants,
        postedByMe: isOwner,
        appliedByMe: alumniId ? meta.applicants.includes(alumniId) : false,
        isExpired: job.expireAt ? new Date(job.expireAt) < new Date() : false,
      };
    }),
  );

  return {
    jobs: formattedJobs,
    pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
    filters: extractFilterOptions(distinctJobs),
  };
}

export async function createJobAction(formData: JobSchemaType): Promise<ActionResult> {
  try {
    const alumni = await getCurrentAlumni();
    if (!alumni) return { success: false, error: 'Unauthorized' };

    const validated = jobSchema.safeParse(formData);
    if (!validated.success) return { success: false, error: 'Validation failed' };

    const metadata = buildJobMetadata(validated.data);

    await prisma.job.create({
      data: {
        ...buildJobCreateData(validated.data, metadata),
        postedByAlumniId: alumni.id,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('[createJobAction]', error);
    return { success: false, error: error.message || 'Failed to create opportunity' };
  }
}

export async function toggleJobStatusAction(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const alumni = await getCurrentAlumni();
    if (!alumni) return { success: false, error: 'Unauthorized' };

    const job = await prisma.job.findUnique({ where: { id }, select: { postedByAlumniId: true } });
    if (!job) return { success: false, error: 'Job not found' };
    if (job.postedByAlumniId !== alumni.id) return { success: false, error: 'Permission denied' };

    await prisma.job.update({ where: { id }, data: { isActive } });
    return { success: true };
  } catch (error: any) {
    console.error('[toggleJobStatusAction]', error);
    return { success: false, error: error.message || 'Failed to update status' };
  }
}

export async function applyToJobAction(id: string): Promise<ActionResult> {
  try {
    const alumni = await getCurrentAlumni();
    if (!alumni) return { success: false, error: 'Unauthorized' };

    const job = await prisma.job.findUnique({ where: { id }, select: { metadata: true } });
    if (!job) return { success: false, error: 'Opportunity not found' };

    const meta = normalizeMetadata(job.metadata);
    if (meta.applicants.includes(alumni.id)) return { success: true }; // already applied, no-op

    await prisma.job.update({
      where: { id },
      data: {
        metadata: {
          ...meta,
          applicants: [...meta.applicants, alumni.id],
        } as unknown as Prisma.InputJsonValue,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('[applyToJobAction]', error);
    return { success: false, error: error.message || 'Failed to apply' };
  }
}

// ─────────────────────────────────────────
// ADMIN ACTIONS
// ─────────────────────────────────────────

export async function getAdminJobsAction(params: JobFilterParams) {
  const staff = await getAuthenticatedStaff();
  if (!staff) throw new Error('Unauthorized');

  const modules = Array.isArray(staff.modules) ? (staff.modules as string[]) : [];
  if (staff.role !== 'ADMIN' && !modules.includes('jobs')) {
    throw new Error('Forbidden: Access denied to opportunities module');
  }

  const { tab = 'all', page = 1, limit = 8 } = params;
  const skip = (page - 1) * limit;

  // Build tab-specific WHERE clause
  let tabClause: Prisma.JobWhereInput | undefined;
  if (tab === 'posted') {
    tabClause = { postedByStaffId: { not: null } };
  } else if (tab === 'alumni') {
    tabClause = { postedByAlumniId: { not: null } };
  } else if (tab === 'staff') {
    tabClause = { postedByStaffId: { not: null } };
  }

  const whereClause = buildWhereClause(params, tabClause);

  let scopedCampusId: string | null = null;
  if (staff.role !== 'ADMIN') {
    scopedCampusId = staff.campusId;
  }

  if (scopedCampusId) {
    const campusFilter = {
      OR: [
        { postedByStaff: { campusId: scopedCampusId } },
        { postedByStaff: { campusId: null } },
        { postedByAlumni: { campusId: scopedCampusId } }
      ]
    };
    if (whereClause.AND) {
      (whereClause.AND as any).push(campusFilter);
    } else {
      whereClause.AND = [campusFilter] as any;
    }
  }

  const [jobs, totalCount, distinctJobs] = await Promise.all([
    prisma.job.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        postedByAlumni: { select: { id: true, name: true, currentRole: true, avatarUrl: true, city: true } },
        postedByStaff: { select: { id: true, name: true } },
      },
    }),
    prisma.job.count({ where: whereClause }),
    prisma.job.findMany({
      where: {
        metadata: { not: Prisma.JsonNull },
        ...(scopedCampusId ? {
          OR: [
            { postedByStaff: { campusId: scopedCampusId } },
            { postedByStaff: { campusId: null } },
            { postedByAlumni: { campusId: scopedCampusId } }
          ]
        } : {})
      },
      select: { metadata: true },
    }),
  ]);

  const formattedJobs = await Promise.all(
    jobs.map(async (job) => {
      const meta = normalizeMetadata(job.metadata);

      return {
        ...job,
        ...meta,
        applicantsProfiles: await resolveApplicantProfiles(meta.applicants),
        applicants: meta.applicants,
        postedByMe: job.postedByStaffId === staff.id,
        appliedByMe: false,
        isExpired: job.expireAt ? new Date(job.expireAt) < new Date() : false,
      };
    }),
  );

  return {
    jobs: formattedJobs,
    pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
    filters: extractFilterOptions(distinctJobs),
  };
}

export async function createAdminJobAction(formData: JobSchemaType): Promise<ActionResult> {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) return { success: false, error: 'Unauthorized' };

    const modules = Array.isArray(staff.modules) ? (staff.modules as string[]) : [];
    if (staff.role !== 'ADMIN' && !modules.includes('jobs')) {
      return { success: false, error: 'Forbidden: Access denied to opportunities module' };
    }

    const validated = jobSchema.safeParse(formData);
    if (!validated.success) return { success: false, error: 'Validation failed' };

    const metadata = buildJobMetadata(validated.data);

    await prisma.job.create({
      data: {
        ...buildJobCreateData(validated.data, metadata),
        postedByStaffId: staff.id,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('[createAdminJobAction]', error);
    return { success: false, error: error.message || 'Failed to create opportunity' };
  }
}

export async function toggleAdminJobStatusAction(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) return { success: false, error: 'Unauthorized' };

    const modules = Array.isArray(staff.modules) ? (staff.modules as string[]) : [];
    if (staff.role !== 'ADMIN' && !modules.includes('jobs')) {
      return { success: false, error: 'Forbidden: Access denied to opportunities module' };
    }

    const job = await prisma.job.findUnique({
      where: { id },
      select: {
        postedByStaff: { select: { campusId: true } },
        postedByAlumni: { select: { campusId: true } },
      },
    });
    if (!job) return { success: false, error: 'Opportunity not found' };

    const jobCampusId = job.postedByStaff?.campusId || job.postedByAlumni?.campusId || null;
    if (!hasCampusAccess(staff, jobCampusId)) {
      return { success: false, error: 'Forbidden: You do not have permission to manage opportunities from another campus' };
    }

    await prisma.job.update({ where: { id }, data: { isActive } });
    return { success: true };
  } catch (error: any) {
    console.error('[toggleAdminJobStatusAction]', error);
    return { success: false, error: error.message || 'Failed to update status' };
  }
}

export async function deleteJobAction(id: string): Promise<ActionResult> {
  try {
    const identity = await getCurrentAlumniOrStaff();
    if (!identity) return { success: false, error: 'Unauthorized' };

    const job = await prisma.job.findUnique({
      where: { id },
      select: {
        postedByAlumniId: true,
        postedByStaffId: true,
        postedByStaff: { select: { campusId: true } },
        postedByAlumni: { select: { campusId: true } },
      },
    });
    if (!job) return { success: false, error: 'Opportunity not found' };

    if (identity.isAdmin) {
      // Caller is staff, check if they have module permission
      const staff = await prisma.staff.findUnique({
        where: { id: identity.staffId },
        select: { role: true, modules: true, campusId: true },
      });
      if (!staff) return { success: false, error: 'Unauthorized' };

      const modules = Array.isArray(staff.modules) ? (staff.modules as string[]) : [];
      if (staff.role !== 'ADMIN') {
        if (!modules.includes('jobs')) {
          return { success: false, error: 'Forbidden: Access denied to opportunities module' };
        }
        const jobCampusId = job.postedByStaff?.campusId || job.postedByAlumni?.campusId || null;
        if (!hasCampusAccess(staff, jobCampusId)) {
          return { success: false, error: 'Forbidden: You do not have permission to delete opportunities from another campus' };
        }
      }
    } else {
      // Caller is alumni, they can only delete if they posted it
      if (job.postedByAlumniId !== identity.alumni.id) {
        return { success: false, error: 'Permission denied' };
      }
    }

    await prisma.job.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    console.error('[deleteJobAction]', error);
    return { success: false, error: error.message || 'Failed to delete opportunity' };
  }
}

export async function getJobApplicantsExportDataAction(id: string): Promise<ActionResult<any[]>> {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) return { success: false, error: 'Unauthorized' };

    const modules = Array.isArray(staff.modules) ? (staff.modules as string[]) : [];
    if (staff.role !== 'ADMIN' && !modules.includes('jobs')) {
      return { success: false, error: 'Forbidden: Access denied to opportunities module' };
    }

    const job = await prisma.job.findUnique({
      where: { id },
      select: {
        metadata: true,
        postedByStaff: { select: { campusId: true } },
        postedByAlumni: { select: { campusId: true } },
      },
    });
    if (!job) return { success: false, error: 'Opportunity not found' };

    const jobCampusId = job.postedByStaff?.campusId || job.postedByAlumni?.campusId || null;
    if (!hasCampusAccess(staff, jobCampusId)) {
      return { success: false, error: 'Forbidden: You do not have permission to access opportunities from another campus' };
    }

    const meta = normalizeMetadata(job.metadata);
    if (meta.applicants.length === 0) return { success: true, data: [] };

    const applicants = await prisma.alumni.findMany({
      where: { id: { in: meta.applicants } },
      select: {
        id: true,
        name: true,
        email: true,
        enrollmentNo: true,
        college: true,
        course: true,
        branch: true,
        batchYear: true,
      },
    });

    return { success: true, data: applicants };
  } catch (error: any) {
    console.error('[getJobApplicantsExportDataAction]', error);
    return { success: false, error: error.message || 'Failed to fetch applicants details' };
  }
}


