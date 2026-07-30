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
