import { CommunityRoleTagType } from "@/components/community/MemberBadgeTag";

export interface CommunityPermissions {
  canEditCommunity: boolean;
  canPostUpdate: boolean;
  canCreateBlog: boolean;
  canManageMembers: boolean;
  isMember: boolean;
  roleTag?: CommunityRoleTagType | null;
  customTitle?: string | null;
}

/**
 * Calculates user capabilities within a community based on their member role tag and admin privileges.
 */
export function getCommunityPermissions(
  roleTag?: CommunityRoleTagType | null,
  isAdmin: boolean = false
): CommunityPermissions {
  if (isAdmin) {
    return {
      canEditCommunity: true,
      canPostUpdate: true,
      canCreateBlog: true,
      canManageMembers: true,
      isMember: true,
      roleTag: roleTag || "LEADER",
    };
  }

  const isLeader = roleTag === "LEADER" || roleTag === "COORDINATOR" || roleTag === "ADVISOR";
  const isMember = isLeader || roleTag === "CORE_MEMBER" || roleTag === "MEMBER";

  return {
    canEditCommunity: isLeader,
    canPostUpdate: isMember,
    canCreateBlog: isLeader,
    canManageMembers: isLeader,
    isMember,
    roleTag,
  };
}
