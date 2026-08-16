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
  campaignId: string,
  batchSize = 500
): Promise<{ done: boolean; batchCount?: number; sentCount?: number; failedCount?: number }> {
  const campaign = await db.notificationCampaign.findUniqueOrThrow({
    where: { id: campaignId },
  });

  if (campaign.status === 'COMPLETED') {
    return { done: true };
  }

  const where = buildAlumniWhere((campaign.filter || {}) as CampaignAudienceFilter);

  // Resumable cursor query: orders by id ascending, takes next batchSize
  const batch = await db.alumni.findMany({
    where: {
      ...where,
      ...(campaign.cursor ? { id: { gt: campaign.cursor } } : {}),
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
    await db.notificationCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
    return { done: true };
  }

  // 1. Bulk insert in-app Notification records for all batch alumni (both PUSH_AND_INAPP & INAPP_ONLY)
  try {
    await db.notification.createMany({
      data: batch.map((a) => ({
        userId: a.id,
        campaignId: campaign.id,
        type: campaign.type,
        title: campaign.title,
        body: campaign.body,
        url: campaign.url,
        metadata: { campaignId: campaign.id },
        isRead: false,
      })),
      skipDuplicates: true,
    });
  } catch (inAppErr) {
    console.error('[processCampaignBatch] Failed to bulk insert in-app notification rows:', inAppErr);
  }

  // 2. Dispatch OS Web Push notifications ONLY if channel is PUSH_AND_INAPP
  const isPushEnabled = campaign.channel !== 'INAPP_ONLY';
  // Flatten subscriptions for this batch
  const subs = isPushEnabled ? batch.flatMap((a) => a.pushSubscriptions) : [];

  // Format push payload using single source of truth
  const pushPayload = formatPushPayload(campaign.type, {
    title: campaign.title,
    body: campaign.body,
    url: campaign.url,
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
  await db.notificationCampaign.update({
    where: { id: campaignId },
    data: {
      status: 'PROCESSING',
      startedAt: campaign.startedAt ?? new Date(),
      cursor: lastProcessedId,
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
