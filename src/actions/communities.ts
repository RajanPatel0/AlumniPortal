"use server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedStaff, resolveCampusScope } from "@/lib/auth/staff-auth";
import { StaffRole } from "@prisma/client";
import {
  communitySchema,
  memberRoleUpdateSchema,
  type CommunitySchemaType,
  type MemberRoleUpdateType,
} from "@/schemas/community";

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

// ─────────────────────────────────────────
// ADMIN COMMUNITY SERVER ACTIONS
// ─────────────────────────────────────────

export async function getAdminCommunitiesAction() {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) {
      return { success: false, error: "Unauthorized", communities: [], campuses: [], userRole: "STAFF", userCampusId: null };
    }

    let scopedCampusId: string | null = null;
    try {
      scopedCampusId = resolveCampusScope(staff, null);
    } catch {
      scopedCampusId = staff.campusId;
    }

    const where: any = {};
    if (scopedCampusId) {
      where.campusId = scopedCampusId;
    }

    const [communities, campuses] = await Promise.all([
      prisma.community.findMany({
        where,
        include: {
          campus: {
            select: { id: true, name: true, code: true },
          },
          _count: {
            select: { members: true, updates: true, blogs: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.campus.findMany({
        select: { id: true, name: true, code: true },
        orderBy: { name: "asc" },
      }),
    ]);

    const formattedCommunities = communities.map((c) => ({
      ...c,
      externalLinks: (c.externalLinks as Record<string, string>) || null,
    }));

    return {
      success: true,
      communities: formattedCommunities,
      campuses,
      userRole: staff.role,
      userCampusId: staff.campusId,
    };
  } catch (error: any) {
    console.error("getAdminCommunitiesAction error:", error);
    return { success: false, error: error.message, communities: [], campuses: [], userRole: "STAFF", userCampusId: null };
  }
}

export async function createAdminCommunityAction(formData: CommunitySchemaType): Promise<ActionResult> {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) return { success: false, error: "Unauthorized" };

    const validated = communitySchema.safeParse(formData);
    if (!validated.success) {
      const issue = validated.error.issues[0]?.message || "Validation failed";
      return { success: false, error: issue };
    }

    const data = validated.data;
    let targetCampusId = data.campusId || null;
    if (staff.role !== StaffRole.ADMIN) {
      targetCampusId = staff.campusId || null;
    }

    const generatedSlug = (data.slug || data.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const existing = await prisma.community.findUnique({
      where: { slug: generatedSlug },
    });

    if (existing) {
      return { success: false, error: "Community slug already exists" };
    }

    await prisma.community.create({
      data: {
        name: data.name,
        slug: generatedSlug,
        description: data.description,
        logoUrl: data.logoUrl || null,
        bannerUrl: data.bannerUrl || null,
        category: data.category || "General",
        campusId: targetCampusId,
        externalLinks: data.externalLinks || {},
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("createAdminCommunityAction error:", error);
    return { success: false, error: error.message || "Failed to create community" };
  }
}

export async function updateAdminCommunityAction(id: string, formData: Partial<CommunitySchemaType>): Promise<ActionResult> {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) return { success: false, error: "Unauthorized" };

    const validated = communitySchema.partial().safeParse(formData);
    if (!validated.success) {
      const issue = validated.error.issues[0]?.message || "Validation failed";
      return { success: false, error: issue };
    }

    const data = validated.data;
    let targetCampusId = data.campusId !== undefined ? data.campusId : undefined;
    if (staff.role !== StaffRole.ADMIN && targetCampusId !== undefined) {
      targetCampusId = staff.campusId || null;
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.description) updateData.description = data.description;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.bannerUrl !== undefined) updateData.bannerUrl = data.bannerUrl;
    if (data.category) updateData.category = data.category;
    if (targetCampusId !== undefined) updateData.campusId = targetCampusId;
    if (data.externalLinks !== undefined) updateData.externalLinks = data.externalLinks;

    if (data.slug) {
      updateData.slug = data.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }

    await prisma.community.update({
      where: { id },
      data: updateData,
    });

    return { success: true };
  } catch (error: any) {
    console.error("updateAdminCommunityAction error:", error);
    return { success: false, error: error.message || "Failed to update community" };
  }
}

export async function deleteAdminCommunityAction(id: string): Promise<ActionResult> {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) return { success: false, error: "Unauthorized" };

    await prisma.community.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    console.error("deleteAdminCommunityAction error:", error);
    return { success: false, error: error.message || "Failed to delete community" };
  }
}

// ─────────────────────────────────────────
// ADMIN COMMUNITY MEMBERSHIP ACTIONS
// ─────────────────────────────────────────

export async function getAdminCommunityMembersAction(communityId: string) {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) return { success: false, error: "Unauthorized", data: [] };

    const members = await prisma.communityMember.findMany({
      where: { communityId },
      include: {
        alumni: {
          select: { id: true, name: true, avatarUrl: true, email: true, branch: true, batchYear: true },
        },
        staff: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    return { success: true, data: members };
  } catch (error: any) {
    console.error("getAdminCommunityMembersAction error:", error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function updateAdminMemberRoleAction(
  communityId: string,
  payload: MemberRoleUpdateType
): Promise<ActionResult> {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) return { success: false, error: "Unauthorized" };

    const validated = memberRoleUpdateSchema.safeParse(payload);
    if (!validated.success) {
      const issue = validated.error.issues[0]?.message || "Validation failed";
      return { success: false, error: issue };
    }

    const { alumniId, staffId, roleTag, customTitle } = validated.data;

    if (alumniId) {
      await prisma.communityMember.upsert({
        where: { communityId_alumniId: { communityId, alumniId } },
        update: { roleTag, customTitle: customTitle || null },
        create: { communityId, alumniId, roleTag, customTitle: customTitle || null },
      });
    } else if (staffId) {
      await prisma.communityMember.upsert({
        where: { communityId_staffId: { communityId, staffId } },
        update: { roleTag, customTitle: customTitle || null },
        create: { communityId, staffId, roleTag, customTitle: customTitle || null },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("updateAdminMemberRoleAction error:", error);
    return { success: false, error: error.message || "Failed to update member role" };
  }
}

export async function removeAdminMemberAction(
  communityId: string,
  member: { alumniId?: string; staffId?: string }
): Promise<ActionResult> {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) return { success: false, error: "Unauthorized" };

    if (member.alumniId) {
      await prisma.communityMember.delete({
        where: { communityId_alumniId: { communityId, alumniId: member.alumniId } },
      });
    } else if (member.staffId) {
      await prisma.communityMember.delete({
        where: { communityId_staffId: { communityId, staffId: member.staffId } },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("removeAdminMemberAction error:", error);
    return { success: false, error: error.message || "Failed to remove member" };
  }
}

export async function searchCandidateUsersAction(query: string) {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) return { success: false, error: "Unauthorized", alumni: [], staff: [] };

    const trimmed = query.trim();
    if (!trimmed) return { success: true, alumni: [], staff: [] };

    const [alumniList, staffList] = await Promise.all([
      prisma.alumni.findMany({
        where: {
          OR: [
            { name: { contains: trimmed } },
            { email: { contains: trimmed } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          branch: true,
          batchYear: true,
          campus: { select: { code: true } },
        },
        take: 8,
      }),
      prisma.staff.findMany({
        where: {
          OR: [
            { name: { contains: trimmed } },
            { email: { contains: trimmed } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          campus: { select: { code: true } },
        },
        take: 8,
      }),
    ]);

    return { success: true, alumni: alumniList, staff: staffList };
  } catch (error: any) {
    console.error("searchCandidateUsersAction error:", error);
    return { success: false, error: error.message, alumni: [], staff: [] };
  }
}
