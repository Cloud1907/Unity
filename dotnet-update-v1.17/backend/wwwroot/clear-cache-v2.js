// Aggressive cache clearing service worker
self.addEventListener('install', function(event) {
  console.log('🧹 Cache temizleme service worker yüklendi v0.3.2');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('🗑️ Tüm cache temizleniyor...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          console.log('Cache siliniyor:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(function() {
      console.log('✅ Tüm cache temizlendi!');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  // Her istekte fresh data al, cache'i kullanma
  event.respondWith(
    fetch(event.request, {
      cache: 'no-store'
    }).catch(function() {
      return caches.match(event.request);
    })
  );
});
