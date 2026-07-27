import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAlumniAccessToken } from "@/lib/auth/alumni-jwt";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { getCurrentAlumniOrStaff } from "@/lib/auth/getCurrentAlumni";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const alumniToken = cookieStore.get("alumniAccessToken")?.value;
  const staffToken = cookieStore.get("accessToken")?.value;

  if (!alumniToken && !staffToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let authorized = false;
  let currentUserId: string | null = null;

  if (alumniToken) {
    try {
      const payload = verifyAlumniAccessToken(alumniToken);
      if (payload?.id) {
        currentUserId = payload.id;
        authorized = true;
      }
    } catch {}
  }
  if (!authorized && staffToken) {
    try {
      verifyAccessToken(staffToken);
      authorized = true;
    } catch {}
  }

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dbAlbums = await prisma.album.findMany({
      where: { isPublished: true },
      include: {
        images: true,
        likes: {
          select: {
            alumniId: true,
          },
        },
        alumni: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        postedByStaff: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedDbAlbums = dbAlbums.map((album) => {
      let postedBy = {
        id: album.alumniId || album.postedByStaffId || "admin",
        name: album.alumni?.name || album.postedByStaff?.name || "Alumni Cell",
        avatar: album.alumni?.avatarUrl || null,
        type: album.alumni ? "alumni" : album.postedByStaff ? "staff" : "admin",
      };

      const isLiked = Boolean(
        currentUserId && album.likes.some((l) => l.alumniId === currentUserId)
      );

      return {
        id: album.id,
        title: album.title,
        description: album.description,
        category: album.category,
        alumniId: album.alumniId,
        postedBy,
        images: album.images.map((img) => ({
          id: img.id,
          imageUrl: img.imageUrl,
          caption: img.caption,
        })),
        viewsCount: album.viewsCount || 0,
        likesCount: album.likes.length,
        isLiked,
        createdAt: album.createdAt.toISOString().split("T")[0],
      };
    });

    const albums = [...formattedDbAlbums];

    return NextResponse.json({ albums });
  } catch (error) {
    console.error("[API_GET_GALLERY_ALBUMS_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch gallery" },
      { status: 500 },
    );
  }
}

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
    const { title, description, category, images } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const album = await prisma.album.create({
      data: {
        title,
        description,
        category: category || "College Days",
        alumniId: payload.id,
        isPublished: true, // Auto publish for alumni
        images: {
          create: (images || []).map(
            (img: { url: string; caption?: string }) => ({
              imageUrl: img.url,
              caption: img.caption || "",
            }),
          ),
        },
      },
      include: {
        images: true,
        alumni: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    const formattedAlbum = {
      id: album.id,
      title: album.title,
      description: album.description,
      category: album.category,
      alumniId: album.alumniId,
      postedBy: {
        id: album.alumni?.id || payload.id,
        name: album.alumni?.name || payload.name || "Alumni Member",
        avatar: album.alumni?.avatarUrl || null,
        type: "alumni",
      },
      images: album.images.map((img) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        caption: img.caption,
      })),
      viewsCount: 0,
      likesCount: 0,
      createdAt: album.createdAt.toISOString().split("T")[0],
    };

    return NextResponse.json({ success: true, album: formattedAlbum });
  } catch (error) {
    console.error("[API_POST_GALLERY_ALBUM_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to create album" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentAlumniOrStaff();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const albumId = searchParams.get("id");

    if (!albumId) {
      return NextResponse.json(
        { error: "Album ID is required" },
        { status: 400 },
      );
    }

    const album = await prisma.album.findUnique({
      where: { id: albumId },
    });

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    if (!user.isAdmin && album.alumniId !== user.alumni.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own albums" },
        { status: 403 },
      );
    }

    await prisma.album.delete({
      where: { id: albumId },
    });

    return NextResponse.json({
      success: true,
      message: "Album deleted successfully",
    });
  } catch (error) {
    console.error("[API_DELETE_GALLERY_ALBUM_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to delete album" },
      { status: 500 },
    );
  }
}
