const CACHE_NAME = 'fsOS-cache-v2'; // Versi cache dinaikkan untuk memicu pembaruan
// Daftar file inti yang akan disimpan di cache untuk mode offline
const urlsToCache = [
  '/',
  '/index.html',
  '/admin.html',
  '/admin.js',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// Event 'install': Menyimpan file ke cache saat service worker pertama kali diinstal
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching essential assets for offline use');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Event 'activate': Membersihkan cache lama jika ada versi baru
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
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

// Event 'fetch': Mengambil file dari cache jika tersedia (Cache-First Strategy)
self.addEventListener('fetch', event => {
  // Abaikan permintaan ke Google Apps Script agar data selalu terbaru
  if (event.request.url.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Jika file ada di cache, kembalikan dari cache
        if (response) {
          return response;
        }
        // Jika tidak ada, ambil dari jaringan, simpan ke cache, lalu kembalikan
        return fetch(event.request).then(
          networkResponse => {
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            // Hanya cache permintaan GET yang valid
            if(event.request.method !== 'GET') {
                return networkResponse;
            }
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return networkResponse;
          }
        );
      })
  );
});

