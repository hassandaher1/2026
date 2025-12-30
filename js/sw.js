// Service Worker for PWA - Version 2
const CACHE_NAME = 'activity-tracker-v2';
const urlsToCache = [
  './',
  './index.html',
  './css/styles.css',
  './js/script.js',
  './assets/favicon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// Install event - force update
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force activation
  event.waitUntil(
    caches.delete('activity-tracker-v1').then(() => {
      return caches.open(CACHE_NAME);
    }).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate event - clear old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});
