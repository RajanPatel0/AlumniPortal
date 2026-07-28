import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';
import { deleteFile } from '@/lib/fileUpload';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch posts created by staff
    const posts = await prisma.post.findMany({
      where: { postedByStaffId: payload.id },
      include: { images: true },
      orderBy: { createdAt: 'desc' },
    });

    const formattedPosts = posts.map(post => ({
      ...post,
      itemType: 'post' as const,
      images: post.images.map(img => img.imageUrl),
    }));

    // Fetch all albums (admin-created & alumni-created) for total admin content policy moderation
    const albums = await prisma.album.findMany({
      include: {
        images: true,
        alumni: {
          select: { id: true, name: true, avatarUrl: true },
        },
        postedByStaff: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedAlbums = albums.map(album => ({
      ...album,
      itemType: 'album' as const,
      postedBy: {
        id: album.alumniId || album.postedByStaffId || 'admin',
        name: album.alumni?.name || album.postedByStaff?.name || 'Alumni Cell',
        avatar: album.alumni?.avatarUrl || null,
        type: album.alumni ? ('alumni' as const) : album.postedByStaff ? ('staff' as const) : ('admin' as const),
      },
    }));

    return NextResponse.json({ posts: formattedPosts, albums: formattedAlbums });
  } catch (error) {
    console.error('[API_ADMIN_GET_POSTS_ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type, content, imageUrl, title, description, category, images } = body;

    if (type === 'post') {
      if (!content && !imageUrl) {
        return NextResponse.json({ error: 'Content or Image is required' }, { status: 400 });
      }

      const post = await prisma.post.create({
        data: {
          content,
          images: imageUrl ? { create: { imageUrl } } : undefined,
          postedByStaffId: payload.id,
        },
        include: { images: true }
      });

      const formattedPost = {
        ...post,
        itemType: 'post' as const,
        images: post.images.map(img => img.imageUrl)
      };

      return NextResponse.json({ success: true, post: formattedPost });
    } else if (type === 'album') {
      if (!title) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 });
      }

      const album = await prisma.album.create({
        data: {
          title,
          description: description || '',
          category: category || 'College Days',
          postedByStaffId: payload.id,
          isPublished: true, // auto-publish admin albums
          images: {
            create: (images || []).map((img: { url: string; caption?: string }) => ({
              imageUrl: img.url,
              caption: img.caption || '',
            })),
          },
        },
        include: { images: true },
      });

      const formattedAlbum = {
        ...album,
        itemType: 'album' as const,
      };

      return NextResponse.json({ success: true, album: formattedAlbum });
    } else {
      return NextResponse.json({ error: 'Invalid post type' }, { status: 400 });
    }
  } catch (error) {
    console.error('[API_ADMIN_CREATE_POSTS_ERROR]', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const deleteType = searchParams.get('deleteType'); // 'post' or 'album'
    const id = searchParams.get('id');

    if (!id || !deleteType) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (deleteType === 'post') {
      const post = await prisma.post.findUnique({
        where: { id },
        include: { images: true },
      });

      if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }

      // Delete images from disk if local uploads
      for (const img of post.images) {
        await deleteFile(img.imageUrl);
      }

      await prisma.post.delete({ where: { id } });
      return NextResponse.json({ success: true, message: 'Post deleted' });
    } else if (deleteType === 'album') {
      const album = await prisma.album.findUnique({
        where: { id },
        include: { images: true },
      });

      if (!album) {
        return NextResponse.json({ error: 'Album not found' }, { status: 404 });
      }

      // Delete images from disk if local uploads
      for (const img of album.images) {
        await deleteFile(img.imageUrl);
      }

      await prisma.album.delete({ where: { id } });
      return NextResponse.json({ success: true, message: 'Album deleted' });
    } else {
      return NextResponse.json({ error: 'Invalid delete type' }, { status: 400 });
    }
  } catch (error) {
    console.error('[API_ADMIN_DELETE_POSTS_ERROR]', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
