/**
 * LUMA 🌟 - Service Worker PWA
 * "Comparte · Guarda · Revive"
 */

const CACHE_NAME = 'luma-pwa-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/variables.css',
  './css/layout.css',
  './css/animations.css',
  './css/sections.css',
  './js/config.js',
  './js/utils.js',
  './js/media.js',
  './js/presence.js',
  './js/animations.js',
  './js/storage.js',
  './js/app.js',
  './assets/icon.png',
  './assets/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Ignorar peticiones externas, Firebase RTDB o APIs de streaming
  if (event.request.url.includes('firebaseio.com') ||
      event.request.url.includes('themoviedb.org') ||
      event.request.url.includes('itunes.apple.com') ||
      event.request.url.includes('apple.com') ||
      event.request.url.includes('lrclib.net') ||
      event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Retornar de caché y refrescar en background (Stale-While-Revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});

// Manejo de clic en notificaciones locales de grupo (Redirige a la sección exacta)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || './';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
