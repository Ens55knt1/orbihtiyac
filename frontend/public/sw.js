/* Minimal service worker for PWA installability */
self.addEventListener('install', function () {
  self.skipWaiting();
});
self.addEventListener('activate', function () {
  self.clients.claim();
});
