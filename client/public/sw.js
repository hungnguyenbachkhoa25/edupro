const CACHE_NAME = "edupro-cache-v1";
const EXAM_CACHE_NAME = "edupro-exam-cache-v1";
const STATIC_ASSETS = ["/", "/index.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![CACHE_NAME, EXAM_CACHE_NAME].includes(key))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;

  if (url.pathname.startsWith("/api/tests")) {
    event.respondWith(
      caches.open(EXAM_CACHE_NAME).then(async (cache) => {
        try {
          const network = await fetch(event.request);
          cache.put(event.request, network.clone());
          return network;
        } catch {
          const cached = await cache.match(event.request);
          return cached || new Response(JSON.stringify({ message: "Offline and not cached" }), { status: 503 });
        }
      }),
    );
    return;
  }

  if (!url.pathname.startsWith("/api")) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
            return response;
          }),
      ),
    );
  }
});
