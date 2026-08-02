import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAlumni, getCurrentAlumniOrStaff } from '@/lib/auth/getCurrentAlumni';
import { prisma } from '@/lib/prisma';
import { deleteFile } from '@/lib/fileUpload';

export async function GET(req: NextRequest) {
  const session = await getCurrentAlumniOrStaff();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const selfOnly = searchParams.get('self') === 'true';

    const currentAlumniId = session.isAdmin ? null : session.alumni.id;
    const authorIdFilter = selfOnly ? (currentAlumniId || undefined) : undefined;

    const posts = await prisma.post.findMany({
      where: authorIdFilter ? { authorId: authorIdFilter } : undefined,
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
        likes: {
          where: { alumniId: currentAlumniId || '' },
          select: { id: true }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    const formattedPosts = posts.map((post) => {
      const hasLiked = post.likes ? post.likes.length > 0 : false;
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
          hasLiked,
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
          hasLiked,
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
    const alumni = await getCurrentAlumni();
    if (!alumni) {
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
        authorId: alumni.id,
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

// DELETE endpoint for post deletion (supports both alumni self-deletion & admin moderation)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentAlumniOrStaff();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const postId = searchParams.get('id');

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { images: true },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Explicit Authorization Check:
    // Staff/Admin can delete ANY post unconditionally.
    // Non-staff Alumni can ONLY delete posts where authorId === viewerId.
    let authorized = false;

    if (session.isAdmin) {
      const staffMember = await prisma.staff.findUnique({
        where: { id: session.staffId }
      });
      if (staffMember) {
        if (staffMember.role === 'ADMIN') {
          authorized = true;
        } else if (staffMember.role === 'SUB_ADMIN') {
          if (post.postedByStaffId === session.staffId) {
            authorized = true;
          } else if (post.authorId) {
            const authorAlumni = await prisma.alumni.findUnique({
              where: { id: post.authorId },
              select: { campusId: true }
            });
            if (authorAlumni && authorAlumni.campusId === staffMember.campusId) {
              authorized = true;
            }
          }
        }
      }
    } else {
      if (post.authorId === session.alumni.id) {
        authorized = true;
      }
    }

    if (!authorized) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to delete this post' }, 
        { status: 403 }
      );
    }

    // Safe disk file cleanup - failure does not block DB deletion
    if (post.images && post.images.length > 0) {
      for (const img of post.images) {
        if (img.imageUrl) {
          try {
            await deleteFile(img.imageUrl);
          } catch (fileErr) {
            console.warn(`[POST_DELETE_FILE_WARNING] Failed to cleanup image file ${img.imageUrl}:`, fileErr);
          }
        }
      }
    }

    // Delete post record from database
    await prisma.post.delete({
      where: { id: postId },
    });

    return NextResponse.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('[API_DELETE_POST_ERROR]', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
