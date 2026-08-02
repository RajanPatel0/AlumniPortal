import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedStaff, hasCampusAccess } from "@/lib/auth/staff-auth";
import { getServerSession } from "next-auth";
import { alumniAuthConfig } from "@/lib/alumni/auth";
import { getCommunitySession } from "@/lib/auth/community-auth";
import { getCommunityPermissions, isLeaderOrAdmin } from "@/lib/community-permissions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ communityId: string }> },
) {
  try {
    const { communityId } = await params;

    const community = await prisma.community.findFirst({
      where: {
        OR: [{ id: communityId }, { slug: communityId }],
      },
      include: {
        campus: true,
        members: {
          include: {
            alumni: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                currentRole: true,
                currentCompany: true,
                batchYear: true,
                branch: true,
              },
            },
            staff: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        _count: {
          select: { members: true, updates: true, blogs: true },
        },
      },
    });

    if (!community) {
      return NextResponse.json(
        { success: false, error: "Community not found" },
        { status: 404 },
      );
    }

    let currentUserMember: any = null;
    let isAdmin = false;

    // Check staff auth first
    const staff = await getAuthenticatedStaff();
    if (staff) {
      isAdmin = staff.role === "ADMIN";
      currentUserMember =
        community.members.find((m) => m.staffId === staff.id) || null;
    } else {
      // Check alumni NextAuth session
      const session = await getServerSession(alumniAuthConfig);
      const userId = (session?.user as { id?: string } | undefined)?.id;
      if (userId) {
        currentUserMember =
          community.members.find((m) => m.alumniId === userId) || null;
      }
    }

    const permissions = getCommunityPermissions(
      currentUserMember?.roleTag,
      isAdmin,
    );

    return NextResponse.json({
      success: true,
      data: {
        ...community,
        permissions,
      },
    });
  } catch (error: any) {
    console.error("GET /api/communities/[communityId] error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ communityId: string }> },
) {
  try {
    const session = await getCommunitySession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { communityId } = await params;
    const body = await request.json();
    const {
      name,
      description,
      logoUrl,
      bannerUrl,
      category,
      campusId,
      externalLinks,
      isActive,
    } = body;

    const community = await prisma.community.findFirst({
      where: {
        OR: [{ id: communityId }, { slug: communityId }],
      },
      include: {
        members: {
          where: session.alumniId
            ? { alumniId: session.alumniId }
            : session.staffId
            ? { staffId: session.staffId }
            : undefined,
        },
      },
    });

    if (!community) {
      return NextResponse.json(
        { success: false, error: "Community not found" },
        { status: 404 },
      );
    }

    const userMember = community.members[0];
    const canManageOverview = isLeaderOrAdmin(session.isAdmin, userMember?.roleTag);

    if (!canManageOverview) {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin or leader role required to edit community overview." },
        { status: 403 }
      );
    }

    const updated = await prisma.community.update({
      where: { id: community.id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(bannerUrl !== undefined && { bannerUrl }),
        ...(category && { category }),
        ...(campusId !== undefined && { campusId }),
        ...(externalLinks !== undefined && { externalLinks }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        campus: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PATCH /api/communities/[communityId] error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ communityId: string }> },
) {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) {
      return NextResponse.json({ success: false, error: "Unauthorized: Staff authentication required" }, { status: 401 });
    }

    const { communityId } = await params;

    const community = await prisma.community.findFirst({
      where: { OR: [{ id: communityId }, { slug: communityId }] },
    });

    if (!community) {
      return NextResponse.json(
        { success: false, error: "Community not found" },
        { status: 404 },
      );
    }

    // Campus scope enforcement
    if (staff.role !== "ADMIN" && !community.campusId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only global admins can delete global communities" },
        { status: 403 }
      );
    }
    if (!hasCampusAccess(staff, community.campusId)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not have permission to delete communities from another campus" },
        { status: 403 }
      );
    }

    await prisma.community.delete({
      where: { id: community.id },
    });

    return NextResponse.json({ success: true, message: "Community deleted" });
  } catch (error: any) {
    console.error("DELETE /api/communities/[communityId] error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
