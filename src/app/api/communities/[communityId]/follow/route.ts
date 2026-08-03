import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { alumniAuthConfig } from "@/lib/alumni/auth";
import { getAuthenticatedStaff } from "@/lib/auth/staff-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const { communityId } = await params;
    const body = await request.json();
    const { isFollowing } = body;

    const community = await prisma.community.findFirst({
      where: { OR: [{ id: communityId }, { slug: communityId }] },
    });

    if (!community) {
      return NextResponse.json({ success: false, error: "Community not found" }, { status: 404 });
    }

    let alumniId: string | null = null;
    let staffId: string | null = null;

    const [staff, session] = await Promise.all([
      getAuthenticatedStaff(),
      getServerSession(alumniAuthConfig),
    ]);

    if (staff) {
      staffId = staff.id;
    } else {
      const userId = (session?.user as { id?: string } | undefined)?.id;
      if (userId) {
        alumniId = userId;
      }
    }

    if (!alumniId && !staffId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const existingMember = await prisma.communityMember.findFirst({
      where: {
        communityId: community.id,
        ...(alumniId ? { alumniId } : { staffId }),
      },
    });

    if (existingMember) {
      if (!isFollowing && existingMember.roleTag === "FOLLOWER") {
        await prisma.communityMember.delete({
          where: { id: existingMember.id },
        });
      } else {
        await prisma.communityMember.update({
          where: { id: existingMember.id },
          data: { isFollowingNewsletter: Boolean(isFollowing) },
        });
      }
    } else {
      await prisma.communityMember.create({
        data: {
          communityId: community.id,
          alumniId,
          staffId,
          roleTag: "FOLLOWER",
          isFollowingNewsletter: Boolean(isFollowing),
        },
      });
    }

    return NextResponse.json({ success: true, isFollowingNewsletter: Boolean(isFollowing) });
  } catch (error: any) {
    console.error("POST /api/communities/[communityId]/follow error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
