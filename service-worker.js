// service-worker.js
const CACHE_NAME = 'sga-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './data.js',
  './manifest.json',
  './icon.png'
];

// Installation : Mise en cache des fichiers essentiels
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SGA: Mise en cache des fichiers');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activation : Nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  return self.clients.claim();
});

// Stratégie : Cache First, Network Fallback
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') return;

  // Pour les données, utiliser Network First
  if (event.request.url.includes('/api/') || event.request.url.includes('data')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Mettre en cache si succès
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // En cas d'erreur, essayer le cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // Pour les assets, utiliser Cache First
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Ne mettre en cache que les réponses valides
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Page d'erreur hors ligne
        if (event.request.mode === 'navigate') {
          return new Response(
            '<!DOCTYPE html><html><head><title>Hors ligne</title><style>body{background:#2c3e50;color:white;text-align:center;padding:50px;}</style></head><body><h1>Application hors ligne</h1><p>Certaines fonctionnalités nécessitent une connexion internet.</p><button onclick="location.reload()">Réessayer</button></body></html>',
            {
              headers: { 'Content-Type': 'text/html' }
            }
          );
        }
        return new Response('Réseau indisponible', {
          status: 503,
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      });
    })
  );
});

// Gérer les messages depuis l'application
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('Synchronisation des données');
  }
});

// Notifications push
self.addEventListener('push', function(event) {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'Notification SGA',
    icon: './icon.png',
    badge: './icon.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || './'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'SGA', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
