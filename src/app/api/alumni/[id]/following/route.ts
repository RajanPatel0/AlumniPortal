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

    const [following, targetAlumni] = await Promise.all([
      prisma.alumniFollow.findMany({
        where: { followerId: id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          following: {
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
        select: { followingCount: true },
      }),
    ]);

    const total = targetAlumni?.followingCount || 0;

    const followingIds = following.map((f) => f.following.id);

    let followedIds = new Set<string>();
    if (viewerId && followingIds.length > 0) {
      const follows = await prisma.alumniFollow.findMany({
        where: {
          followerId: viewerId,
          followingId: { in: followingIds },
        },
        select: { followingId: true },
      });
      followedIds = new Set(follows.map((f) => f.followingId));
    }

    return NextResponse.json({
      success: true,
      data: following.map((f) => ({
        ...f.following,
        isFollowing: followedIds.has(f.following.id),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('GET following error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
