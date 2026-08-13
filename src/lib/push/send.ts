import webpush from 'web-push';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:alumni@ptu.ac.in';

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  } catch (err) {
    console.error('Failed to set VAPID details:', err);
  }
}

export interface PushSubscriptionKeys {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  type?: string;
  [key: string]: unknown;
}

export interface SendPushResult {
  ok: boolean;
  expired: boolean;
  error?: string;
}

/**
 * Sends a web push notification to a single subscription.
 * Catches 404/410 as expired: true and never throws.
 */
export async function sendPush(
  sub: PushSubscriptionKeys,
  payload: PushPayload
): Promise<SendPushResult> {
  try {
    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('VAPID keys not configured. Skipping push delivery.');
      return { ok: false, expired: false, error: 'VAPID keys not configured' };
    }

    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      },
      JSON.stringify(payload)
    );

    return { ok: true, expired: false };
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string };
    if (error.statusCode === 404 || error.statusCode === 410) {
      return { ok: false, expired: true, error: 'Subscription expired or unsubscribed (404/410)' };
    }
    return {
      ok: false,
      expired: false,
      error: error.message || 'Push delivery failed',
    };
  }
}
