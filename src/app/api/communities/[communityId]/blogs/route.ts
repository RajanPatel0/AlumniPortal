import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const { communityId } = await params;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const community = await prisma.community.findFirst({
      where: { OR: [{ id: communityId }, { slug: communityId }] },
    });

    if (!community) {
      return NextResponse.json({ success: false, error: "Community not found" }, { status: 404 });
    }

    const where: any = {
      communityId: community.id,
      isPublished: true,
    };

    if (category && category !== "All") {
      where.category = category;
    }

    const blogs = await prisma.communityBlog.findMany({
      where,
      include: {
        authorAlumni: {
          select: { id: true, name: true, avatarUrl: true, currentRole: true },
        },
        authorStaff: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: blogs });
  } catch (error: any) {
    console.error("GET /api/communities/[communityId]/blogs error:", error);
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
    const { title, slug, summary, content, coverImage, category, tags, authorAlumniId, authorStaffId, isPublished } = body;

    if (!title || !summary || !content) {
      return NextResponse.json({ success: false, error: "Title, summary, and content are required" }, { status: 400 });
    }

    const community = await prisma.community.findFirst({
      where: { OR: [{ id: communityId }, { slug: communityId }] },
    });

    if (!community) {
      return NextResponse.json({ success: false, error: "Community not found" }, { status: 404 });
    }

    const generatedSlug = (slug || title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const blog = await prisma.communityBlog.create({
      data: {
        communityId: community.id,
        title,
        slug: generatedSlug,
        summary,
        content,
        coverImage: coverImage || null,
        category: category || "Recap",
        tags: tags || [],
        authorAlumniId: authorAlumniId || null,
        authorStaffId: authorStaffId || null,
        isPublished: isPublished !== undefined ? isPublished : true,
        publishedAt: isPublished ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, data: blog }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/communities/[communityId]/blogs error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
