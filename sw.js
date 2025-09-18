const CACHE_NAME = 'fsOS-shell-cache-v1';
const DATA_CACHE_NAME = 'fsOS-data-cache-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/admin.html',
  '/admin.js',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened shell cache and caching essential assets');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME, DATA_CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Network-first, falling back to cache for API calls to Google Apps Script
  if (requestUrl.origin === 'https://script.google.com') {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(event.request)
          .then(networkResponse => {
            // If we get a valid response, update the cache and return the response
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            // If the network request fails (e.g., offline), try to get it from the cache
            return cache.match(event.request);
          });
      })
    );
    return; // Stop further execution for API calls
  }

  // Cache-first for all other assets (the app shell)
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // If we have a cached response, return it
        if (cachedResponse) {
          return cachedResponse;
        }
        // Otherwise, fetch from the network
        return fetch(event.request).then(networkResponse => {
          // Cache the new response for next time
          return caches.open(CACHE_NAME).then(cache => {
            // Make sure the response is valid before caching
            if (networkResponse.ok) {
                 cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
  );
});
