import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ communityId: string }> }
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
              select: { id: true, name: true, avatarUrl: true, currentRole: true, currentCompany: true, batchYear: true, branch: true },
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
      return NextResponse.json({ success: false, error: "Community not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: community });
  } catch (error: any) {
    console.error("GET /api/communities/[communityId] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const { communityId } = await params;
    const body = await request.json();
    const { name, description, logoUrl, bannerUrl, category, campusId, externalLinks, isActive } = body;

    const community = await prisma.community.findFirst({
      where: {
        OR: [{ id: communityId }, { slug: communityId }],
      },
    });

    if (!community) {
      return NextResponse.json({ success: false, error: "Community not found" }, { status: 404 });
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
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

    await prisma.community.delete({
      where: { id: community.id },
    });

    return NextResponse.json({ success: true, message: "Community deleted" });
  } catch (error: any) {
    console.error("DELETE /api/communities/[communityId] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
