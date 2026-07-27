import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const alumniToken = cookieStore.get("alumniAccessToken")?.value;
    const staffToken = cookieStore.get("accessToken")?.value;

    if (!alumniToken && !staffToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { albumId } = body;

    if (!albumId) {
      return NextResponse.json({ error: "Album ID is required" }, { status: 400 });
    }

    const album = await prisma.album.update({
      where: { id: albumId },
      data: {
        viewsCount: { increment: 1 },
      },
      select: {
        id: true,
        viewsCount: true,
      },
    });

    return NextResponse.json({ success: true, viewsCount: album.viewsCount });
  } catch (error) {
    console.error("[API_POST_GALLERY_VIEW_ERROR]", error);
    return NextResponse.json({ error: "Failed to increment view count" }, { status: 500 });
  }
}
