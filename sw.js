
const CACHE_NAME = 'duel-ranking-v3';

const urlsToCache = [
  './index.html',
  './manifest.json',
  './icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );

  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    })
  );

  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Recebe notificações mesmo com o site fechado.
self.addEventListener('push', (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {
    data = {
      body: event.data ? event.data.text() : ''
    };
  }

  const title = data.title || 'Duel Ranking';

  const options = {
    body: data.body || 'Você tem uma nova atualização no Duel Ranking.',
    icon: './icon.png',
    badge: './icon.png',
    tag: data.tag || 'duel-ranking-update',
    renotify: true,
    data: {
      url: data.url || './index.html',
      notificationId: data.notificationId || null
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Abre o Duel Ranking ao tocar na notificação.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = new URL(
    event.notification.data?.url || './index.html',
    self.location.origin
  ).href;

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });

    for (const client of windows) {
      if ('focus' in client) {
        if ('navigate' in client) {
          await client.navigate(targetUrl);
        }

        return client.focus();
      }
    }

    if (self.clients.openWindow) {
      return self.clients.openWindow(targetUrl);
    }
  })());
});
