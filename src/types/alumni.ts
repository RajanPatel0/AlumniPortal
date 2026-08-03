export interface EducationItem {
  id: string;
  school: string;
  degree: string;
  fieldOfStudy?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
}

export interface AlumniProfile {
  id?: string;
  name: string;
  email: string;
  batchYear: number;
  branch: string;
  college: string;
  course?: string;
  phone?: string;
  currentRole?: string;
  currentCompany?: string;
  city?: string;
  country?: string;
  pincode?: string;
  mapVisibility?: 'PUBLIC' | 'ALUMNI_ONLY' | 'HIDDEN';
  avatarUrl?: string;
  bio?: string;
  linkedinUrl?: string;
  isRegistered?: boolean;
  isAdmin?: boolean;
  role?: string;
  followersCount?: number;
  followingCount?: number;
  education?: EducationItem[];
  workExperience?: ExperienceItem[];
  campus?: { id: string; name: string } | null;
}
