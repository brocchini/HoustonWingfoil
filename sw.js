const SHELL_CACHE = "wingfoil-shell-v1";
const DATA_CACHE = "wingfoil-data-v1";

const SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE && key !== DATA_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Forecast/live data APIs: network-first, fall back to last cached response
  // (marked with X-From-Cache so the page can show an "offline/stale" notice).
  if (url.origin === "https://api.open-meteo.com" || url.origin === "https://marine-api.open-meteo.com" || url.origin === "https://api.tidesandcurrents.noaa.gov") {
    event.respondWith(
      caches.open(DATA_CACHE).then((cache) =>
        fetch(req)
          .then((res) => {
            cache.put(req, res.clone());
            return res;
          })
          .catch(() =>
            cache.match(req).then((cached) => {
              if (!cached) return Promise.reject(new Error("offline, no cached data"));
              const headers = new Headers(cached.headers);
              headers.set("X-From-Cache", "true");
              return cached.blob().then((body) => new Response(body, {
                status: cached.status, statusText: cached.statusText, headers,
              }));
            })
          )
      )
    );
    return;
  }

  // App shell: cache-first, fall back to network and update cache.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(SHELL_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          if (cached) return cached;
          return fetch(req).then((res) => {
            cache.put(req, res.clone());
            return res;
          });
        })
      )
    );
  }
});
