/**
 * Shared types for the Jobs feature (alumni + admin views).
 * Both pages import from here — no duplication.
 */

import type { JobItemType } from '@/components/jobs/JobCard';

export interface JobsApiResponse {
  jobs: JobItemType[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  filters: {
    industries: string[];
    types: string[];
    workplaces: string[];
    experiences: string[];
  };
}

/** Default fallback filter values shown before the first API response */
export const DEFAULT_FILTER_OPTIONS = {
  industries: ['Software', 'Design', 'Administration'],
  types: ['Full Time', 'Internship', 'Contract'],
  workplaces: ['On-site', 'Remote', 'Hybrid'],
  experiences: ['0-1 years', '1-4 years', '2-6 years', '5+ years', '9-10 years'],
} as const;

/** Prepend "All" to a dynamic filter list */
export function withAll(values: readonly string[] | string[]): string[] {
  return ['All', ...values];
}
