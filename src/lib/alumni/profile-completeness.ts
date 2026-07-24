export interface ProfileCompletenessResult {
  percentage: number;
  missing: string[];
  completed: string[];
}

/**
 * Single source of truth helper to calculate alumni profile completeness score.
 * 
 * Rules:
 * 1. Profile Picture (+20%)
 * 2. (Current Role & Company) OR (>=1 Work Experience) (+30%)
 * 3. Location (City or Pincode) (+20%)
 * 4. Phone Number (+15%)
 * 5. Bio or LinkedIn Profile (+15%)
 */
export function calculateProfileCompleteness(alumni: any): ProfileCompletenessResult {
  if (!alumni) {
    return { percentage: 0, missing: [], completed: [] };
  }

  let score = 0;
  const missing: string[] = [];
  const completed: string[] = [];

  // 1. Avatar / DP (+20%)
  if (alumni.avatarUrl && typeof alumni.avatarUrl === 'string' && alumni.avatarUrl.trim().length > 0) {
    score += 20;
    completed.push('Profile Picture');
  } else {
    missing.push('Profile Picture');
  }

  // 2. Current Role & Company OR Work Experience (+30%)
  const hasCurrentRoleAndCompany = Boolean(
    alumni.currentRole &&
    typeof alumni.currentRole === 'string' &&
    alumni.currentRole.trim().length > 0 &&
    alumni.currentCompany &&
    typeof alumni.currentCompany === 'string' &&
    alumni.currentCompany.trim().length > 0
  );
  const hasWorkExp = Array.isArray(alumni.workExperience) && alumni.workExperience.length > 0;

  if (hasCurrentRoleAndCompany || hasWorkExp) {
    score += 30;
    completed.push('Current Role & Company');
  } else {
    missing.push('Current Role & Company');
  }

  // 3. Location (City or Pincode) (+20%)
  const hasCity = Boolean(alumni.city && typeof alumni.city === 'string' && alumni.city.trim().length > 0);
  const hasPincode = Boolean(alumni.pincode && typeof alumni.pincode === 'string' && alumni.pincode.trim().length > 0);
  if (hasCity || hasPincode) {
    score += 20;
    completed.push('Location');
  } else {
    missing.push('Location');
  }

  // 4. Phone Number (+15%)
  if (alumni.phone && typeof alumni.phone === 'string' && alumni.phone.trim().length > 0) {
    score += 15;
    completed.push('Phone Number');
  } else {
    missing.push('Phone Number');
  }

  // 5. Bio or LinkedIn Profile (+15%)
  const hasBio = Boolean(alumni.bio && typeof alumni.bio === 'string' && alumni.bio.trim().length > 0);
  const hasLinkedin = Boolean(alumni.linkedinUrl && typeof alumni.linkedinUrl === 'string' && alumni.linkedinUrl.trim().length > 0);
  if (hasBio || hasLinkedin) {
    score += 15;
    completed.push('Bio / LinkedIn Profile');
  } else {
    missing.push('Bio / LinkedIn Profile');
  }

  return {
    percentage: Math.min(100, score),
    missing,
    completed,
  };
}
