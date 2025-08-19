const CACHE_NAME = 'mentepy-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install event: caching static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate event: cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
});

// Fetch event: cache-first strategy for static, network-first for others
self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Only handle GET requests
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // If request is for our origin
  if (url.origin === location.origin) {
    // Serve static assets from cache
    if (STATIC_ASSETS.includes(url.pathname)) {
      event.respondWith(
        caches.match(request).then((cachedResponse) => {
          return (
            cachedResponse || fetch(request).then((response) => {
              return caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, response.clone());
                return response;
              });
            })
          );
        })
      );
      return;
    }
  }
  // Default: network-first with fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, response.clone());
          return response;
        });
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});