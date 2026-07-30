import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCommunitySession } from "@/lib/auth/community-auth";
import { isLeaderOrAdmin } from "@/lib/community-permissions";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ communityId: string; blogId: string }> }
) {
  try {
    const session = await getCommunitySession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { communityId, blogId } = await params;

    const community = await prisma.community.findFirst({
      where: { OR: [{ id: communityId }, { slug: communityId }] },
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
      return NextResponse.json({ success: false, error: "Community not found" }, { status: 404 });
    }

    const blogItem = await prisma.communityBlog.findFirst({
      where: {
        id: blogId,
        communityId: community.id,
      },
      select: { id: true, authorAlumniId: true, authorStaffId: true },
    });

    if (!blogItem) {
      return NextResponse.json({ success: false, error: "Blog article not found" }, { status: 404 });
    }

    const userMember = community.members[0];
    const isLeadership = isLeaderOrAdmin(session.isAdmin, userMember?.roleTag);

    const isAuthor =
      (session.alumniId && blogItem.authorAlumniId === session.alumniId) ||
      (session.staffId && blogItem.authorStaffId === session.staffId);

    if (!isLeadership && !isAuthor) {
      return NextResponse.json({ success: false, error: "Forbidden. You can only delete your own blogs unless you are a leader or admin." }, { status: 403 });
    }

    await prisma.communityBlog.delete({
      where: { id: blogId },
    });

    return NextResponse.json({ success: true, message: "Blog deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/communities/[communityId]/blogs/[blogId] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ communityId: string; blogId: string }> }
) {
  try {
    const { communityId, blogId } = await params;

    const community = await prisma.community.findFirst({
      where: { OR: [{ id: communityId }, { slug: communityId }] },
      select: { id: true },
    });

    if (!community) {
      return NextResponse.json({ success: false, error: "Community not found" }, { status: 404 });
    }

    const blog = await prisma.communityBlog.findFirst({
      where: {
        communityId: community.id,
        OR: [{ id: blogId }, { slug: blogId }],
      },
      include: {
        authorAlumni: { select: { id: true, name: true, avatarUrl: true } },
        authorStaff: { select: { id: true, name: true } },
      },
    });

    if (!blog) {
      return NextResponse.json({ success: false, error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: blog });
  } catch (error: any) {
    console.error("GET /api/communities/[communityId]/blogs/[blogId] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ communityId: string; blogId: string }> }
) {
  try {
    const session = await getCommunitySession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { communityId, blogId } = await params;
    const body = await request.json();
    const { title, slug, summary, content, coverImage, category, tags } = body;

    const community = await prisma.community.findFirst({
      where: { OR: [{ id: communityId }, { slug: communityId }] },
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
      return NextResponse.json({ success: false, error: "Community not found" }, { status: 404 });
    }

    const blogItem = await prisma.communityBlog.findFirst({
      where: {
        id: blogId,
        communityId: community.id,
      },
      select: { id: true, authorAlumniId: true, authorStaffId: true },
    });

    if (!blogItem) {
      return NextResponse.json({ success: false, error: "Blog article not found" }, { status: 404 });
    }

    const userMember = community.members[0];
    const isLeadership = isLeaderOrAdmin(session.isAdmin, userMember?.roleTag);

    const isAuthor =
      (session.alumniId && blogItem.authorAlumniId === session.alumniId) ||
      (session.staffId && blogItem.authorStaffId === session.staffId);

    if (!isLeadership && !isAuthor) {
      return NextResponse.json(
        { success: false, error: "Forbidden. You can only edit your own blogs unless you are a leader or admin." },
        { status: 403 }
      );
    }

    const updated = await prisma.communityBlog.update({
      where: { id: blogId },
      data: {
        title,
        slug,
        summary,
        content,
        coverImage: coverImage || null,
        category,
        tags,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT /api/communities/[communityId]/blogs/[blogId] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
