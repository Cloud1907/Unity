// 🔥 AGGRESSIVE CACHE CLEAR
console.log('🧹 Cache clearing script loaded');

// 1. Unregister all service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
      console.log('✅ Service Worker unregistered');
    }
  });
}

// 2. Clear all caches
if ('caches' in window) {
  caches.keys().then(function(names) {
    for (let name of names) {
      caches.delete(name);
      console.log('✅ Cache deleted:', name);
    }
  });
}

// 3. Clear storage
try {
  localStorage.clear();
  sessionStorage.clear();
  console.log('✅ Storage cleared');
} catch(e) {
  console.warn('Storage clear failed:', e);
}

// 4. Force reload after 500ms
setTimeout(function() {
  console.log('🔄 Force reloading...');
  window.location.reload(true);
}, 500);
