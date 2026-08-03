'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentAlumni } from '@/lib/auth/getCurrentAlumni';
import { revalidatePath } from 'next/cache';

export async function toggleFollowAlumni(targetAlumniId: string) {
  try {
    const currentAlumni = await getCurrentAlumni();
    if (!currentAlumni) {
      return { success: false, error: 'Unauthorized' };
    }

    const followerId = currentAlumni.id;
    if (followerId === targetAlumniId) {
      return { success: false, error: 'You cannot follow yourself' };
    }

    // Check if target user exists
    const targetAlumni = await prisma.alumni.findUnique({
      where: { id: targetAlumniId },
      select: { id: true },
    });
    if (!targetAlumni) {
      return { success: false, error: 'Alumni not found' };
    }

    // Check if relationship already exists
    const existingFollow = await prisma.alumniFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetAlumniId,
        },
      },
    });

    let isFollowingNow = false;

    // Use Prisma transaction to atomically toggle relationship and update counters
    await prisma.$transaction(async (tx) => {
      if (existingFollow) {
        // Unfollow
        await tx.alumniFollow.delete({
          where: {
            followerId_followingId: {
              followerId,
              followingId: targetAlumniId,
            },
          },
        });

        // Decrement counters
        await tx.alumni.update({
          where: { id: followerId },
          data: {
            followingCount: { decrement: 1 },
          },
        });
        await tx.alumni.update({
          where: { id: targetAlumniId },
          data: {
            followersCount: { decrement: 1 },
          },
        });
      } else {
        // Follow
        await tx.alumniFollow.create({
          data: {
            followerId,
            followingId: targetAlumniId,
          },
        });

        // Increment counters
        await tx.alumni.update({
          where: { id: followerId },
          data: {
            followingCount: { increment: 1 },
          },
        });
        await tx.alumni.update({
          where: { id: targetAlumniId },
          data: {
            followersCount: { increment: 1 },
          },
        });
        isFollowingNow = true;
      }
    });

    // Revalidate paths to refresh page data
    revalidatePath(`/alumni/profile/${targetAlumniId}`);
    revalidatePath(`/alumni/profile/${followerId}`);

    return { success: true, isFollowing: isFollowingNow };
  } catch (error: any) {
    console.error('toggleFollowAlumni error:', error);
    return { success: false, error: error.message || 'Something went wrong' };
  }
}

export async function checkFollowStatus(targetAlumniId: string) {
  try {
    const currentAlumni = await getCurrentAlumni();
    if (!currentAlumni) {
      return { isFollowing: false };
    }

    const existingFollow = await prisma.alumniFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentAlumni.id,
          followingId: targetAlumniId,
        },
      },
    });

    return { isFollowing: !!existingFollow };
  } catch {
    return { isFollowing: false };
  }
}
