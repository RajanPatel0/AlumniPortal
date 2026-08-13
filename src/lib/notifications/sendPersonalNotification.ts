import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';
import { formatPushPayload } from './formats';
import { sendPush } from '../push/send';
import { pruneExpiredSubscriptions } from '../push/prune';

export interface SendPersonalNotificationOptions {
  userId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
}

/**
 * Sends a single-recipient personal notification (e.g. FOLLOW, MILESTONE).
 * Persists one Notification row for the user and sends push directly to their devices.
 * Broadcast campaigns NEVER call this function.
 */
export async function sendPersonalNotification({
  userId,
  type,
  payload,
}: SendPersonalNotificationOptions): Promise<void> {
  try {
    const formatted = formatPushPayload(type, payload);

    // 1. Persist single Notification row for personal in-app record
    await prisma.notification.create({
      data: {
        userId,
        type,
        title: formatted.title,
        body: formatted.body,
        url: formatted.url,
        metadata: payload as never,
        isRead: false,
      },
    });

    // 2. Find recipient's push subscriptions
    const subs = await prisma.pushSubscription.findMany({
      where: { userId },
      select: {
        endpoint: true,
        p256dh: true,
        auth: true,
      },
    });

    if (subs.length === 0) return;

    // 3. Send OS push inline to all recipient's active subscriptions
    const results = await Promise.allSettled(
      subs.map((s) => sendPush(s, formatted))
    );

    // 4. Automatically prune expired endpoints (HTTP 404/410)
    const expired = subs
      .filter((_, i) => {
        const r = results[i];
        return r.status === 'fulfilled' && !r.value.ok && r.value.expired;
      })
      .map((s) => s.endpoint);

    if (expired.length > 0) {
      await pruneExpiredSubscriptions(expired);
    }
  } catch (err) {
    console.error('[sendPersonalNotification] Failed to deliver personal notification:', err);
  }
}
