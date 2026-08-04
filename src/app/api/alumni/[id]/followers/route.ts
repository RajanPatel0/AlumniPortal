import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAlumni } from '@/lib/auth/getCurrentAlumni';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    const viewer = await getCurrentAlumni();
    const viewerId = viewer?.id || null;

    const [followers, targetAlumni] = await Promise.all([
      prisma.alumniFollow.findMany({
        where: { followingId: id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          follower: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              currentRole: true,
              currentCompany: true,
              batchYear: true,
              branch: true,
            },
          },
        },
      }),
      prisma.alumni.findUnique({
        where: { id },
        select: { followersCount: true },
      }),
    ]);

    const total = targetAlumni?.followersCount || 0;

    const followerIds = followers.map((f) => f.follower.id);

    let followedIds = new Set<string>();
    if (viewerId && followerIds.length > 0) {
      const follows = await prisma.alumniFollow.findMany({
        where: {
          followerId: viewerId,
          followingId: { in: followerIds },
        },
        select: { followingId: true },
      });
      followedIds = new Set(follows.map((f) => f.followingId));
    }

    return NextResponse.json({
      success: true,
      data: followers.map((f) => ({
        ...f.follower,
        isFollowing: followedIds.has(f.follower.id),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('GET followers error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
