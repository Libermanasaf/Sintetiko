// Service worker for Sintetiko Holon — web push + offline app shell

const CACHE = 'sintetiko-v5';

// Pre-cache the offline fallback so a navigation can ALWAYS render something
// (never a blank screen) even on the very first offline launch. The app's JS/CSS
// (hashed filenames) still cache on first online load via the fetch handler.
const PRECACHE_URLS = ['/offline.html', '/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {})            // never let a failed precache block install
      .then(() => self.skipWaiting())
  );
});

// Let the page ask a waiting worker to activate immediately (auto-update flow).
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      ),
    ])
  );
});

// Network-first for same-origin GET requests, falling back to cache when offline.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (!request.url.startsWith(self.location.origin)) return;

  // Navigation (HTML) requests: always go to the network so a stale index.html
  // can never pin the app to an old JS bundle. Offline, fall back to a cached
  // index.html (full app) if present, else the always-precached offline page —
  // so a navigation never yields a blank screen.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Keep a fresh copy of the shell for offline use.
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put('/index.html', clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request)
            .then((cached) => cached || caches.match('/index.html'))
            .then((cached) => cached || caches.match('/offline.html'))
        )
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || caches.match('/index.html'))
      )
  );
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'סינתטיקו חולון', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'סינתטיקו חולון';
  const options = {
    body: data.body || '',
    icon: '/icon.svg',
    badge: '/icon.svg',
    dir: 'rtl',
    lang: 'he',
    tag: data.tag || 'sintetiko',
    // Large picture inside the notification. Android/Chrome renders it; iOS
    // ignores the field, so every push must still read correctly as text.
    ...(data.image ? { image: data.image } : {}),
    renotify: true,
    data: { url: data.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';

  // External links (e.g. a Bit payment page) can't be navigated to inside the
  // PWA window (cross-origin navigate() is rejected) — always open a new window.
  const isExternal = /^https?:\/\//.test(url) && !url.startsWith(self.location.origin);

  event.waitUntil(
    isExternal
      ? self.clients.openWindow(url)
      : self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
          for (const client of clientList) {
            if ('focus' in client) {
              client.navigate(url);
              return client.focus();
            }
          }
          if (self.clients.openWindow) return self.clients.openWindow(url);
        })
  );
});
