// Bump CACHE_VERSION whenever you change cached files to push an update.
const CACHE_VERSION = "v1";
const CACHE_NAME = `pwa-starter-${CACHE_VERSION}`;

// Core files to precache. Relative paths keep this working in a
// GitHub Pages subdirectory (username.github.io/repo/).
const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
];

// Install: precache the app shell.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// Activate: drop old caches so updates take effect.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for same-origin GET requests, network fallback.
// Navigations fall back to the cached shell when offline.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          // Cache successful same-origin responses for next time.
          if (
            response.ok &&
            new URL(request.url).origin === self.location.origin
          ) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          // Offline and not cached: serve the shell for page navigations.
          if (request.mode === "navigate") return caches.match("./index.html");
        });
    })
  );
});
