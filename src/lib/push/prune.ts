import { prisma as defaultPrisma } from '@/lib/prisma';
import type { PrismaClient } from '@prisma/client';

/**
 * Deletes expired or invalid push subscriptions from the database.
 * Accepts an optional PrismaClient instance to allow reuse in standalone background workers.
 */
export async function pruneExpiredSubscriptions(
  endpoints: string[],
  db: PrismaClient = defaultPrisma
): Promise<{ deletedCount: number }> {
  if (!endpoints || endpoints.length === 0) {
    return { deletedCount: 0 };
  }

  const uniqueEndpoints = Array.from(new Set(endpoints.filter(Boolean)));
  if (uniqueEndpoints.length === 0) {
    return { deletedCount: 0 };
  }

  try {
    const result = await db.pushSubscription.deleteMany({
      where: {
        endpoint: {
          in: uniqueEndpoints,
        },
      },
    });

    return { deletedCount: result.count };
  } catch (err) {
    console.error('Failed to prune expired push subscriptions:', err);
    return { deletedCount: 0 };
  }
}
