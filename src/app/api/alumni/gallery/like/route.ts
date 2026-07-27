import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAlumniAccessToken } from "@/lib/auth/alumni-jwt";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const alumniToken = cookieStore.get("alumniAccessToken")?.value;

    if (!alumniToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAlumniAccessToken(alumniToken);
    if (!payload?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { albumId } = body;

    if (!albumId) {
      return NextResponse.json({ error: "Album ID is required" }, { status: 400 });
    }

    const alumniId = payload.id;

    // Check if user already liked the album
    const existingLike = await prisma.albumLike.findUnique({
      where: {
        albumId_alumniId: {
          albumId,
          alumniId,
        },
      },
    });

    let isLiked = false;
    if (existingLike) {
      // Unlike
      await prisma.albumLike.delete({
        where: { id: existingLike.id },
      });
      isLiked = false;
    } else {
      // Like
      await prisma.albumLike.create({
        data: {
          albumId,
          alumniId,
        },
      });
      isLiked = true;
    }

    // Get updated total likes count
    const likesCount = await prisma.albumLike.count({
      where: { albumId },
    });

    return NextResponse.json({ success: true, isLiked, likesCount });
  } catch (error) {
    console.error("[API_POST_GALLERY_LIKE_ERROR]", error);
    return NextResponse.json({ error: "Failed to toggle album like" }, { status: 500 });
  }
}
