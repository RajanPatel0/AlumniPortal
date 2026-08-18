import { CampaignAudienceFilter } from './buildAlumniWhere';

const DIM_ORDER = ['campus', 'course', 'branch', 'batch'] as const;
type Dim = typeof DIM_ORDER[number];

/**
 * Normalizes input strings to prevent casing and whitespace mismatch bugs
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphen
    .replace(/^-+|-+$/g, '');    // Strip leading/trailing hyphens
}

/**
 * Parses batch year inputs (single year like 2024, or ranges like 2024-26 / 2021-2023) into numbers.
 */
export function parseBatchYears(input: string | number | null | undefined): number[] {
  if (input === null || input === undefined) return [];
  const trimmed = String(input).trim();
  if (!trimmed) return [];

  // Range match e.g. "2024-2026" or "2024-26"
  const rangeMatch = trimmed.match(/^(\d{4})\s*-\s*(\d{2,4})$/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    let end = parseInt(rangeMatch[2], 10);
    if (rangeMatch[2].length === 2) {
      const prefix = Math.floor(start / 100) * 100;
      end = prefix + end;
    }
    if (start <= end && end - start <= 10) { // Safety bound of 10 years max
      const years: number[] = [];
      for (let y = start; y <= end; y++) {
        years.push(y);
      }
      return years;
    }
  }

  // Single year, e.g. "2024"
  const single = parseInt(trimmed, 10);
  if (!isNaN(single) && single > 1900 && single < 2100) {
    return [single];
  }

  return [];
}

function buildTag(fields: Partial<Record<Dim, string>>): string {
  const segments = ['alumni'];
  for (const dim of DIM_ORDER) {
    if (fields[dim]) segments.push(`${dim}-${fields[dim]}`);
  }
  return segments.length === 1 ? 'alumni:all' : segments.join(':');
}

export interface ScopedCampaignTag {
  tag: string;
  scopedFilter: CampaignAudienceFilter;
}

export function generateCampaignTags(filter: CampaignAudienceFilter, campusCode?: string | null): ScopedCampaignTag[] {
  const campus = campusCode ? slugify(campusCode) : null;
  const course = filter.course ? slugify(filter.course) : null;
  const branch = filter.branch ? slugify(filter.branch) : null;

  const parsedBatches = parseBatchYears(filter.batchYear);
  const batchYears = parsedBatches.length > 0 ? parsedBatches : [null];

  return batchYears.map((batchYear) => {
    const fields: Partial<Record<Dim, string>> = {};
    if (campus) fields.campus = campus;
    if (course) fields.course = course;
    if (branch) fields.branch = branch;
    if (batchYear) fields.batch = String(batchYear);

    const tag = buildTag(fields);
    return {
      tag,
      scopedFilter: {
        campusId: filter.campusId,
        course: filter.course,
        branch: filter.branch,
        batchYear: batchYear,
        inviteStatus: filter.inviteStatus,
        isRegistered: filter.isRegistered
      }
    };
  });
}

/**
 * Generates the full set of tags (including power-sets) that an alumnus qualifies for.
 * Capped at 2^4 combinations (15 strings).
 */
export function getAlumniAudienceTags(
  alumni: {
    id: string;
    campusCode: string;
    batchYear: number;
    branch: string;
    course?: string | null;
  },
  followedCommunities: { communityId: string; isFollowingNewsletter: boolean }[]
): string[] {
  const tags: string[] = [`user:${alumni.id}`, 'alumni:all'];

  const present: Partial<Record<Dim, string>> = {};
  if (alumni.campusCode) present.campus = slugify(alumni.campusCode);
  if (alumni.course) present.course = slugify(alumni.course);
  if (alumni.branch) present.branch = slugify(alumni.branch);
  if (alumni.batchYear) present.batch = slugify(String(alumni.batchYear));

  const keys = Object.keys(present) as Dim[];
  const n = keys.length;
  
  // Compute power set of matching audience scopes
  for (let mask = 1; mask < (1 << n); mask++) {
    const subset: Partial<Record<Dim, string>> = {};
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        subset[keys[i]] = present[keys[i]];
      }
    }
    tags.push(buildTag(subset));
  }

  // Add community updates
  for (const comm of followedCommunities) {
    tags.push(`community:${comm.communityId}:all`);
    if (comm.isFollowingNewsletter) {
      tags.push(`community:${comm.communityId}:newsletter`);
    }
  }

  return tags;
}
