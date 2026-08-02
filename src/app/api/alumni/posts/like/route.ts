import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAlumni } from '@/lib/auth/getCurrentAlumni';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const alumni = await getCurrentAlumni();
    if (!alumni) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    // Check if like already exists
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_alumniId: {
          postId,
          alumniId: alumni.id
        }
      }
    });

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: {
          id: existingLike.id
        }
      });
      return NextResponse.json({ success: true, liked: false });
    } else {
      // Like
      await prisma.like.create({
        data: {
          postId,
          alumniId: alumni.id
        }
      });
      return NextResponse.json({ success: true, liked: true });
    }
  } catch (error) {
    console.error('[API_POST_POST_LIKE_ERROR]', error);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}
