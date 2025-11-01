const CACHE_NAME = 'whop-recovery-v2';

// Install service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Network-first strategy (mejor para SPAs con assets dinámicos)
self.addEventListener('fetch', (event) => {
  // Solo cachear GET requests
  if (event.request.method !== 'GET') return;
  
  // No cachear API calls
  if (event.request.url.includes('/api/')) return;
  
  // Ignorar chrome-extension:// y otros protocolos no-http
  if (!event.request.url.startsWith('http')) return;
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, guardar en cache
        if (response && response.status === 200 && response.type !== 'error') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {
              // Ignorar errores de cache silenciosamente
            });
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla network, intentar cache (offline fallback)
        return caches.match(event.request);
      })
  );
});

// Clean old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
