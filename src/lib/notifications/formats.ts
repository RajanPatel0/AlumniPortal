import { NotificationType } from '@prisma/client';

export interface NotificationFormatConfig<T = Record<string, unknown>> {
  icon: string;
  badge?: string;
  renderTitle: (payload: T) => string;
  renderBody: (payload: T) => string;
  getUrl: (payload: T) => string;
}

export interface AdminAnnouncementPayload {
  title?: string;
  body?: string;
  url?: string;
  [key: string]: unknown;
}

export interface FollowPayload {
  followerId: string;
  followerName: string;
  followerAvatarUrl?: string | null;
  [key: string]: unknown;
}

export interface MilestonePayload {
  milestoneTitle: string;
  milestoneDescription: string;
  url?: string;
  [key: string]: unknown;
}

export const notificationFormats: {
  [NotificationType.ADMIN_ANNOUNCEMENT]: NotificationFormatConfig<AdminAnnouncementPayload>;
  [NotificationType.FOLLOW]: NotificationFormatConfig<FollowPayload>;
  [NotificationType.ANALYTICS_MILESTONE]: NotificationFormatConfig<MilestonePayload>;
} = {
  [NotificationType.ADMIN_ANNOUNCEMENT]: {
    icon: '/icon.png',
    renderTitle: (p) => p.title || 'Announcement from Alumni Portal',
    renderBody: (p) => p.body || '',
    getUrl: (p) => p.url || '/alumni/feed',
  },
  [NotificationType.FOLLOW]: {
    icon: '/icon.png',
    renderTitle: (p) => `${p.followerName || 'An alumnus'} started following you`,
    renderBody: () => 'Connect and explore their updates on IKGPTU Alumni Portal.',
    getUrl: (p) => (p.followerId ? `/alumni/profile/${p.followerId}` : '/alumni/networking'),
  },
  [NotificationType.ANALYTICS_MILESTONE]: {
    icon: '/icon.png',
    renderTitle: (p) => p.milestoneTitle || 'New Milestone Reached!',
    renderBody: (p) => p.milestoneDescription || 'Check out your recent achievement.',
    getUrl: (p) => p.url || '/alumni/feed',
  },
};

/**
 * Format a push notification payload using the unified format registry.
 */
export function formatPushPayload(type: NotificationType, payload: Record<string, unknown>) {
  const formatter = notificationFormats[type] || notificationFormats[NotificationType.ADMIN_ANNOUNCEMENT];

  return {
    type,
    title: formatter.renderTitle(payload as never),
    body: formatter.renderBody(payload as never),
    url: formatter.getUrl(payload as never),
    icon: formatter.icon,
  };
}
