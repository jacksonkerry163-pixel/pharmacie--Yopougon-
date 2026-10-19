const CACHE_NAME = 'mediflow-v2';

const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo-mediflow.png',
  '/mediflow-icon-192.png',
  '/mediflow-icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) =>
            key.startsWith('mediflow-') && key !== CACHE_NAME
          )
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // Les données des pharmacies restent chargées en ligne.
  if (url.pathname.endsWith('/pharmacies.json')) return;

  event.respondWith(
    fetch(request, { cache: 'no-store' })
      .then(async (response) => {
        if (response.ok && response.type === 'basic') {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        if (request.mode === 'navigate') {
          const page = await caches.match('/index.html');
          if (page) return page;
        }

        return Response.error();
      })
  );
});
