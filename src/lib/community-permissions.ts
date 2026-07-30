import { CommunityRoleTagType } from "@/components/community/MemberBadgeTag";

export interface CommunityPermissions {
  canEditCommunity: boolean;
  canPostUpdate: boolean;
  canCreateBlog: boolean;
  canManageMembers: boolean;
  canDeletePosts: boolean;
  isMember: boolean;
  roleTag?: CommunityRoleTagType | null;
  customTitle?: string | null;
}

/**
 * Calculates user capabilities within a community based on their member role tag and admin privileges.
 */
export function getCommunityPermissions(
  roleTag?: CommunityRoleTagType | null,
  isAdmin: boolean = false,
): CommunityPermissions {
  if (isAdmin) {
    return {
      canEditCommunity: true,
      canPostUpdate: true,
      canCreateBlog: true,
      canManageMembers: true,
      canDeletePosts: true,
      isMember: true,
      roleTag: roleTag || "LEADER",
    };
  }

  const isLeader =
    roleTag === "LEADER" || roleTag === "COORDINATOR" || roleTag === "ADVISOR";
  const isMember =
    isLeader || roleTag === "CORE_MEMBER" || roleTag === "MEMBER";

  return {
    canEditCommunity: isLeader,
    canPostUpdate: isLeader,
    canCreateBlog: isLeader,
    canManageMembers: isLeader,
    canDeletePosts: isLeader,
    isMember,
    roleTag,
  };
}

/**
 * Checks if a member role tag constitutes community leadership (LEADER, COORDINATOR, ADVISOR).
 */
export function isLeadershipRole(roleTag?: string | null): boolean {
  return (
    roleTag === "LEADER" || roleTag === "COORDINATOR" || roleTag === "ADVISOR"
  );
}

/**
 * Centralized authorization check for community-level administrative/leader actions.
 */
export function isLeaderOrAdmin(
  isAdmin: boolean = false,
  memberRoleTag?: string | null,
): boolean {
  return isAdmin || isLeadershipRole(memberRoleTag);
}

/**
 * Checks whether a user can delete a post (update/blog).
 * Granted if the user is the author (self) OR has leadership/admin delete permissions.
 */
export function canDeletePost(
  authorAlumniId?: string | null,
  authorStaffId?: string | null,
  currentAlumniId?: string | null,
  currentStaffId?: string | null,
  canDeletePostsPermission: boolean = false,
): boolean {
  if (canDeletePostsPermission) return true;
  if (currentAlumniId && authorAlumniId && currentAlumniId === authorAlumniId)
    return true;
  if (currentStaffId && authorStaffId && currentStaffId === authorStaffId)
    return true;
  return false;
}

/**
 * Checks whether a user can edit a post (update/blog).
 * Granted if the user is the author (self) OR has leadership/admin edit permissions.
 */
export function canEditPost(
  authorAlumniId?: string | null,
  authorStaffId?: string | null,
  currentAlumniId?: string | null,
  currentStaffId?: string | null,
  canEditPostsPermission: boolean = false,
): boolean {
  if (canEditPostsPermission) return true;
  if (currentAlumniId && authorAlumniId && currentAlumniId === authorAlumniId)
    return true;
  if (currentStaffId && authorStaffId && currentStaffId === authorStaffId)
    return true;
  return false;
}

/**
 * Calculates estimated reading time (in minutes) based on article text length (~200 words per minute).
 */
export function calculateReadTime(text?: string | null): number {
  if (!text) return 1;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export const COMMUNITY_CATEGORIES = [
  "All",
  "Tech",
  "Culture",
  "Sports",
  "NSS",
  "NCC",
  "Research",
  "Patent",
  "Events",
  "General",
] as const;

export const BLOG_CATEGORIES = [
  { value: "General", label: "General / News" },
  { value: "Project Update", label: "Project Showcase" },
  { value: "Grant Recap", label: "Grants and Funding" },
  { value: "Event Recap", label: "Event Recap" },
  { value: "Workshop and Seminar", label: "Workshop and Seminar" },
  { value: "Technical Article", label: "Tech Article" },
  { value: "Research", label: "Research and Papers" },
  { value: "Announcement", label: "Announcement" },
] as const;

export const UPDATE_TYPES = [
  { value: "GENERAL_MSG", label: "General Message" },
  { value: "NEWSLETTER", label: "Newsletter Broadcast" },
  { value: "PROGRESS_REPORT", label: "Progress Report" },
  { value: "FUTURE_PLAN", label: "Future Plan" },
  { value: "IDEA_SUGGESTION", label: "Public Suggestion" },
] as const;

export const UPDATE_FILTERS = [
  { label: "All Updates", value: "ALL" },
  { label: "Newsletters", value: "NEWSLETTER" },
  { label: "Progress Reports", value: "PROGRESS_REPORT" },
  { label: "Future Plans", value: "FUTURE_PLAN" },
  { label: "Public Suggestions", value: "IDEA_SUGGESTION" },
] as const;
