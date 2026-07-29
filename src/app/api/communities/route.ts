import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campusId = searchParams.get("campusId");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: any = {
      isActive: true,
    };

    if (campusId) {
      where.campusId = campusId;
    }

    if (category && category !== "All") {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const communities = await prisma.community.findMany({
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
    });

    return NextResponse.json({ success: true, data: communities });
  } catch (error: any) {
    console.error("GET /api/communities error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slug, description, logoUrl, bannerUrl, category, campusId, externalLinks } = body;

    if (!name || !description) {
      return NextResponse.json({ success: false, error: "Name and description are required" }, { status: 400 });
    }

    const generatedSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const existing = await prisma.community.findUnique({
      where: { slug: generatedSlug },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: "Community slug already exists" }, { status: 400 });
    }

    const community = await prisma.community.create({
      data: {
        name,
        slug: generatedSlug,
        description,
        logoUrl: logoUrl || null,
        bannerUrl: bannerUrl || null,
        category: category || "General",
        campusId: campusId || null,
        externalLinks: externalLinks || {},
      },
      include: {
        campus: true,
      },
    });

    return NextResponse.json({ success: true, data: community }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/communities error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
