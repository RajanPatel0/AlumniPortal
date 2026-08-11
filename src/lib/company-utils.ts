/**
 * Company name normalization utilities to standardize undisclosed / unemployed / non-specified entries.
 */

export const NOT_SPECIFIED_COMPANY = 'Not Specified';

// Common text variations entered by alumni when unemployed or unwilling to disclose company name
export const UNDISCLOSED_COMPANY_VARIANTS = new Set([
  'na',
  'n/a',
  'n.a.',
  'n.a',
  'none',
  'not specified',
  'not-specified',
  'notspecified',
  'nothing',
  'other',
  'others',
  'self',
  'self-employed',
  'self employed',
  'unemployed',
  'freelance',
  'freelancer',
  'student',
  'fresher',
  'freshers',
  'nil',
  'null',
  '-',
  '--',
  'no',
  'not working',
  'not-working',
  'prefer not to say',
  'dont want to disclose',
  "don't want to disclose",
  'disclose',
  'idle',
]);

/**
 * Checks if a company name string represents an undisclosed / not-specified company.
 * Returns false if string is empty/null/undefined so form inputs remain editable by default.
 */
export function isCompanyNotSpecified(rawCompany?: string | null): boolean {
  if (!rawCompany) return false;
  const trimmed = rawCompany.trim().toLowerCase();
  if (!trimmed) return false;
  return UNDISCLOSED_COMPANY_VARIANTS.has(trimmed);
}

/**
 * Normalizes any undisclosed or empty company name to "Not Specified" for backend saving.
 * Preserves actual company names as entered (trimmed).
 */
export function normalizeCompanyName(rawCompany?: string | null): string {
  if (!rawCompany || !rawCompany.trim()) {
    return NOT_SPECIFIED_COMPANY;
  }
  const trimmed = rawCompany.trim();
  if (UNDISCLOSED_COMPANY_VARIANTS.has(trimmed.toLowerCase())) {
    return NOT_SPECIFIED_COMPANY;
  }
  return trimmed;
}
