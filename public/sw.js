// PTU Alumni PWA Service Worker
const CACHE_NAME = 'ptu-alumni-v1';

// On install: cache the app shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// On activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Network-first fetch strategy: always try network, fall back to cache
self.addEventListener('fetch', (event) => {
  // Only handle GET requests for same-origin or CDN assets
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for static assets only
        if (
          response.ok &&
          (event.request.url.includes('/icon') ||
            event.request.url.includes('/manifest'))
        ) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener('push', (event) => {
  const scope = self.registration.scope;
  const defaultIcon = new URL('icon.png', scope).href;

  let data = {
    title: 'IKGPTU Alumni Portal',
    body: 'You have a new notification',
    icon: defaultIcon,
    badge: defaultIcon,
    url: scope,
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      data = {
        title: parsed.title || data.title,
        body: parsed.body || data.body,
        icon: parsed.icon ? new URL(parsed.icon, scope).href : defaultIcon,
        badge: parsed.badge ? new URL(parsed.badge, scope).href : defaultIcon,
        url: parsed.url ? new URL(parsed.url, scope).href : scope,
        tag: parsed.tag || parsed.type || 'general-notification',
      };
    }
  } catch (err) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      data: {
        url: data.url,
      },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const rawUrl = event.notification.data?.url || self.registration.scope;
  const targetUrl = new URL(rawUrl, self.registration.scope).href;
  const appScope = self.registration.scope;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Find existing window belonging to this app scope
      for (const client of clientList) {
        if (client.url.startsWith(appScope) && 'focus' in client) {
          if ('navigate' in client && client.url !== targetUrl) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // If no open window found, open a new window at targetUrl
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});