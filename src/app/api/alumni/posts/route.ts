import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAlumniAccessToken } from '@/lib/auth/alumni-jwt';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const alumniToken = cookieStore.get('alumniAccessToken')?.value;
  const staffToken = cookieStore.get('accessToken')?.value;

  if (!alumniToken && !staffToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let authorized = false;
  if (alumniToken) {
    try {
      verifyAlumniAccessToken(alumniToken);
      authorized = true;
    } catch {}
  }
  if (!authorized && staffToken) {
    try {
      verifyAccessToken(staffToken);
      authorized = true;
    } catch {}
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            branch: true,
            batchYear: true,
            currentRole: true,
            currentCompany: true,
          },
        },
        postedByStaff: {
          select: {
            id: true,
            name: true,
            role: true,
            email: true,
          },
        },
        images: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    const formattedPosts = posts.map((post) => {
      if (post.postedByStaff) {
        return {
          id: post.id,
          content: post.content,
          createdAt: post.createdAt.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          likesCount: post._count.likes,
          commentsCount: post._count.comments,
          media: post.images.length > 0 ? { type: 'image', url: post.images[0].imageUrl } : null,
          author: {
            id: post.postedByStaff.id,
            name: post.postedByStaff.name,
            batchYear: 0,
            avatarUrl: null,
            currentRole: post.postedByStaff.role,
            currentCompany: 'IKGPTU Staff',
            isAdmin: true,
          },
        };
      } else {
        const authorName = post.author?.name || 'Anonymous';
        return {
          id: post.id,
          content: post.content,
          createdAt: post.createdAt.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          likesCount: post._count.likes,
          commentsCount: post._count.comments,
          media: post.images.length > 0 ? { type: 'image', url: post.images[0].imageUrl } : null,
          author: {
            id: post.author?.id || null,
            name: authorName,
            batchYear: post.author?.batchYear || 0,
            avatarUrl: post.author?.avatarUrl || null,
            currentRole: post.author?.currentRole || 'Alumni',
            currentCompany: post.author?.currentCompany || '',
            isAdmin: false,
          },
        };
      }
    });

    return NextResponse.json({ posts: formattedPosts });
  } catch (error) {
    console.error('[API_GET_FEED_POSTS_ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

// POST endpoint for alumni self-post on feed page
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const alumniToken = cookieStore.get('alumniAccessToken')?.value;

    if (!alumniToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAlumniAccessToken(alumniToken);
    if (!payload?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { content, imageUrl } = body;

    if (!content && !imageUrl) {
      return NextResponse.json({ error: 'Content or Image is required' }, { status: 400 });
    }

    const newPost = await prisma.post.create({
      data: {
        content,
        images: imageUrl ? { create: { imageUrl } } : undefined,
        authorId: payload.id,
      },
      include: { images: true }
    });

    const formattedPost = {
      ...newPost,
      images: newPost.images.map(img => img.imageUrl)
    };

    return NextResponse.json({ success: true, post: formattedPost });
  } catch (error) {
    console.error('[API_POST_FEED_POSTS_ERROR]', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
