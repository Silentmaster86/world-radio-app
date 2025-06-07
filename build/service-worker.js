// public/service-worker.js

self.addEventListener("install", (event) => {
    console.log("[Service Worker] Installed");
    self.skipWaiting();
  });
  
  self.addEventListener("activate", (event) => {
    console.log("[Service Worker] Activated");
    return self.clients.claim();
  });
  
  self.addEventListener("fetch", (event) => {
    // Bypass external requests
    if (!event.request.url.startsWith(self.location.origin)) return;
  
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return (
          cachedResponse ||
          fetch(event.request).then((response) => {
            return caches.open("radio-cache-v1").then((cache) => {
              cache.put(event.request, response.clone());
              return response;
            });
          })
        );
      })
    );
  });
  