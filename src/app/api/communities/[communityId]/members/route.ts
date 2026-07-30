import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const { communityId } = await params;

    const community = await prisma.community.findFirst({
      where: { OR: [{ id: communityId }, { slug: communityId }] },
    });

    if (!community) {
      return NextResponse.json({ success: false, error: "Community not found" }, { status: 404 });
    }

    const members = await prisma.communityMember.findMany({
      where: { communityId: community.id },
      include: {
        alumni: {
          select: { id: true, name: true, avatarUrl: true, currentRole: true, currentCompany: true, batchYear: true, branch: true, email: true },
        },
        staff: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: [{ roleTag: "asc" }, { joinedAt: "asc" }],
    });

    return NextResponse.json({ success: true, data: members });
  } catch (error: any) {
    console.error("GET /api/communities/[communityId]/members error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const { communityId } = await params;
    const body = await request.json();
    const { alumniId, staffId, roleTag, customTitle, isFollowingNewsletter } = body;

    if (!alumniId && !staffId) {
      return NextResponse.json({ success: false, error: "alumniId or staffId is required" }, { status: 400 });
    }

    const community = await prisma.community.findFirst({
      where: { OR: [{ id: communityId }, { slug: communityId }] },
    });

    if (!community) {
      return NextResponse.json({ success: false, error: "Community not found" }, { status: 404 });
    }

    const member = await prisma.communityMember.upsert({
      where: alumniId
        ? { communityId_alumniId: { communityId: community.id, alumniId } }
        : { communityId_staffId: { communityId: community.id, staffId } },
      update: {
        ...(roleTag && { roleTag }),
        ...(customTitle !== undefined && { customTitle }),
        ...(isFollowingNewsletter !== undefined && { isFollowingNewsletter }),
      },
      create: {
        communityId: community.id,
        alumniId: alumniId || null,
        staffId: staffId || null,
        roleTag: roleTag || "FOLLOWER",
        customTitle: customTitle || null,
        isFollowingNewsletter: isFollowingNewsletter !== undefined ? isFollowingNewsletter : true,
      },
      include: {
        alumni: { select: { id: true, name: true, avatarUrl: true } },
        staff: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: member });
  } catch (error: any) {
    console.error("POST /api/communities/[communityId]/members error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const { communityId } = await params;
    const { searchParams } = new URL(request.url);
    const alumniId = searchParams.get("alumniId");
    const staffId = searchParams.get("staffId");

    const community = await prisma.community.findFirst({
      where: { OR: [{ id: communityId }, { slug: communityId }] },
    });

    if (!community) {
      return NextResponse.json({ success: false, error: "Community not found" }, { status: 404 });
    }

    if (alumniId) {
      await prisma.communityMember.deleteMany({
        where: { communityId: community.id, alumniId },
      });
    } else if (staffId) {
      await prisma.communityMember.deleteMany({
        where: { communityId: community.id, staffId },
      });
    }

    return NextResponse.json({ success: true, message: "Member removed" });
  } catch (error: any) {
    console.error("DELETE /api/communities/[communityId]/members error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
