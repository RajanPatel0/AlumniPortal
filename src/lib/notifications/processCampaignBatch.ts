import type { PrismaClient } from '@prisma/client';
import { buildAlumniWhere, CampaignAudienceFilter } from './buildAlumniWhere';
import { formatPushPayload } from './formats';
import { sendPush } from '../push/send';

/**
 * Processes a single batch (default 500 alumni) for a given campaign.
 * Accepts PrismaClient as a parameter to keep the worker's connection pool
 * decoupled from the Next.js app pool.
 */
export async function processCampaignBatch(
  db: PrismaClient,
  notificationId: string,
  batchSize = 500
): Promise<{ done: boolean; batchCount?: number; sentCount?: number; failedCount?: number }> {
  const notification = await db.notification.findUniqueOrThrow({
    where: { id: notificationId },
  });

  if (notification.pushStatus === 'COMPLETED') {
    return { done: true };
  }

  const where = buildAlumniWhere((notification.filter || {}) as CampaignAudienceFilter);

  // Resumable cursor query: orders by id ascending, takes next batchSize
  const batch = await db.alumni.findMany({
    where: {
      ...where,
      ...(notification.pushCursor ? { id: { gt: notification.pushCursor } } : {}),
    },
    orderBy: { id: 'asc' },
    take: batchSize,
    select: {
      id: true,
      pushSubscriptions: {
        select: {
          endpoint: true,
          p256dh: true,
          auth: true,
        },
      },
    },
  });

  // If no remaining alumni match the cursor, mark as completed
  if (batch.length === 0) {
    await db.notification.update({
      where: { id: notificationId },
      data: {
        pushStatus: 'COMPLETED',
        completedAt: new Date(),
      },
    });
    return { done: true };
  }

  // 2. Dispatch OS Web Push notifications ONLY if channel is PUSH_AND_INAPP
  const isPushEnabled = notification.channel !== 'INAPP_ONLY';
  // Flatten subscriptions for this batch
  const subs = isPushEnabled ? batch.flatMap((a) => a.pushSubscriptions) : [];

  // Format push payload using single source of truth
  const pushPayload = formatPushPayload(notification.type, {
    title: notification.title,
    body: notification.body,
    url: notification.url,
  });

  let sent = 0;
  let failed = 0;

  if (isPushEnabled && subs.length > 0) {
    const results = await Promise.allSettled(
      subs.map((s) => sendPush(s, pushPayload))
    );

    // Collect expired endpoints (HTTP 404/410) for automatic pruning
    const expiredEndpoints = subs
      .filter((_, i) => {
        const r = results[i];
        return r.status === 'fulfilled' && !r.value.ok && r.value.expired;
      })
      .map((s) => s.endpoint);

    if (expiredEndpoints.length > 0) {
      await db.pushSubscription.deleteMany({
        where: {
          endpoint: {
            in: expiredEndpoints,
          },
        },
      });
    }

    sent = results.filter((r) => r.status === 'fulfilled' && r.value.ok).length;
    failed = subs.length - sent;
  } else if (!isPushEnabled) {
    // For INAPP_ONLY, sent count represents in-app notifications created
    sent = batch.length;
  }

  const lastProcessedId = batch[batch.length - 1].id;

  // Persist progress and cursor atomically
  await db.notification.update({
    where: { id: notificationId },
    data: {
      pushStatus: 'PROCESSING',
      startedAt: notification.startedAt ?? new Date(),
      pushCursor: lastProcessedId,
      sentCount: { increment: sent },
      failedCount: { increment: failed },
    },
  });

  return {
    done: false,
    batchCount: batch.length,
    sentCount: sent,
    failedCount: failed,
  };
}
