// Service Worker para ReShop Paraguay PWA
const CACHE_NAME = 'reshop-v1';
const STATIC_CACHE = 'reshop-static-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/css/mobile.css',
  '/js/mobile.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== STATIC_CACHE)
          .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});