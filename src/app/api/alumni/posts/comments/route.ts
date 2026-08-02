import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAlumni, getCurrentAlumniOrStaff } from '@/lib/auth/getCurrentAlumni';
import { prisma } from '@/lib/prisma';

// GET comments for a postId
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const totalCount = await prisma.comment.count({
      where: { postId }
    });

    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' }, // fetch newest comments first for feed clarity
      skip,
      take: limit,
      include: {
        alumni: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            currentRole: true,
            currentCompany: true,
            batchYear: true
          }
        }
      }
    });

    return NextResponse.json({ 
      comments,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: skip + comments.length < totalCount
      }
    });
  } catch (error) {
    console.error('[API_GET_COMMENTS_ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST create comment on a post
export async function POST(req: NextRequest) {
  try {
    const alumni = await getCurrentAlumni();
    if (!alumni) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { postId, content } = body;

    if (!postId || !content?.trim()) {
      return NextResponse.json({ error: 'Post ID and comment content are required' }, { status: 400 });
    }

    const newComment = await prisma.comment.create({
      data: {
        postId,
        content: content.trim(),
        alumniId: alumni.id
      },
      include: {
        alumni: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            currentRole: true,
            currentCompany: true,
            batchYear: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, comment: newComment });
  } catch (error) {
    console.error('[API_POST_COMMENT_ERROR]', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

// DELETE a comment
export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentAlumniOrStaff();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    let authorized = false;

    if (session.isAdmin) {
      const staffMember = await prisma.staff.findUnique({
        where: { id: session.staffId }
      });
      if (staffMember) {
        if (staffMember.role === 'ADMIN') {
          authorized = true;
        } else if (staffMember.role === 'SUB_ADMIN') {
          // Check if comment author belongs to same campus as staff member
          const commentAuthor = await prisma.alumni.findUnique({
            where: { id: comment.alumniId },
            select: { campusId: true }
          });
          if (commentAuthor && commentAuthor.campusId === staffMember.campusId) {
            authorized = true;
          }
        }
      }
    } else {
      // Alumni can only delete their own comments
      if (comment.alumniId === session.alumni.id) {
        authorized = true;
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to delete this comment' }, { status: 403 });
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    return NextResponse.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('[API_DELETE_COMMENT_ERROR]', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
