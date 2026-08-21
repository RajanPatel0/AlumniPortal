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
  title?: string;
  body?: string;
  url?: string;
  [key: string]: unknown;
}

export const notificationFormats: {
  [NotificationType.ADMIN_ANNOUNCEMENT]: NotificationFormatConfig<AdminAnnouncementPayload>;
  [NotificationType.FOLLOW]: NotificationFormatConfig<FollowPayload>;
  [NotificationType.ANALYTICS_MILESTONE]: NotificationFormatConfig<MilestonePayload>;
  [NotificationType.POST_CREATED]: NotificationFormatConfig<AdminAnnouncementPayload>;
  [NotificationType.COMMUNITY_UPDATE]: NotificationFormatConfig<AdminAnnouncementPayload>;
} = {
  [NotificationType.ADMIN_ANNOUNCEMENT]: {
    icon: '/icon.png',
    renderTitle: (p) => p.title || 'Announcement from Alumni Portal',
    renderBody: (p) => p.body || '',
    getUrl: (p) => p.url || '/alumni/feed',
  },
  [NotificationType.POST_CREATED]: {
    icon: '/icon.png',
    renderTitle: (p) => p.title || 'New Post Published',
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
    renderTitle: (p) => p.title || 'New Milestone Reached!',
    renderBody: (p) => p.body || 'Check out your recent achievement.',
    getUrl: (p) => p.url || '/alumni/feed',
  },
  [NotificationType.COMMUNITY_UPDATE]: {
    icon: '/icon.png',
    renderTitle: (p) => p.title || 'New Community Update',
    renderBody: (p) => p.body || '',
    getUrl: (p) => p.url || '/alumni/feed',
  },
};

/**
 * Normalizes any user-entered landing URL (internal relative path) to start with exactly
 * one "/alumni/" prefix, stripping out any double-prefixed "/alumni/alumni/..." paths
 * or protocol/domain suffixes for localhost/test.ptu.ac.in.
 */
export function normalizeRoutePath(urlInput: string | null | undefined): string | null {
  if (!urlInput) return null;
  
  // 1. If it's an external URL, return it as-is
  if (/^(https?:)?\/\//i.test(urlInput)) {
    try {
      const parsed = new URL(urlInput);
      
      // Dynamically extract the configured app domain host from env
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      let appHost = "";
      if (appUrl) {
        try {
          appHost = new URL(appUrl).host;
        } catch {}
      }
      
      if (
        parsed.host === "test.ptu.ac.in" || 
        parsed.host === "localhost:3000" || 
        (appHost && parsed.host === appHost)
      ) {
        urlInput = parsed.pathname + parsed.search + parsed.hash;
      } else {
        return urlInput;
      }
    } catch {
      return urlInput;
    }
  }

  // 2. Clean slashes and split path segments
  let cleanPath = urlInput.trim();
  if (!cleanPath.startsWith("/")) {
    cleanPath = "/" + cleanPath;
  }

  // Parse path and query/hash separately
  const queryIndex = cleanPath.indexOf("?");
  const hashIndex = cleanPath.indexOf("#");
  let pathname = cleanPath;
  let suffix = "";

  if (queryIndex !== -1 || hashIndex !== -1) {
    const splitIndex = queryIndex !== -1 && hashIndex !== -1 ? Math.min(queryIndex, hashIndex) : (queryIndex !== -1 ? queryIndex : hashIndex);
    pathname = cleanPath.slice(0, splitIndex);
    suffix = cleanPath.slice(splitIndex);
  }

  // Clean pathname: split by "/" and filter out empty segments
  const segments = pathname.split("/").filter(Boolean);

  // Remove any leading "alumni" segments so we have a clean relative path
  while (segments[0] === "alumni") {
    segments.shift();
  }

  // Re-prepend "alumni" to construct the clean route path relative to basePath
  const normalizedPathname = "/alumni/" + segments.join("/");
  
  return normalizedPathname + suffix;
}

/**
 * Format a push notification payload using the unified format registry.
 */
export function formatPushPayload(type: NotificationType, payload: Record<string, unknown>) {
  const formatter = notificationFormats[type] || notificationFormats[NotificationType.ADMIN_ANNOUNCEMENT];

  const rawUrl = formatter.getUrl(payload as never);
  const normalizedUrl = normalizeRoutePath(rawUrl) || '/alumni/feed';

  return {
    type,
    title: formatter.renderTitle(payload as never),
    body: formatter.renderBody(payload as never),
    url: normalizedUrl,
    icon: formatter.icon,
  };
}
