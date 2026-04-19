// SisKeuDes Mobile — Service Worker v1.0
// App Shell + Network First strategy

const CACHE_NAME = "siskeudes-v1.0";
const STATIC_CACHE = "siskeudes-static-v1.0";

// App Shell — selalu cache saat install
const APP_SHELL = [
  "/",
  "/manifest.json",
  "/favicon.ico",
  "/icon.svg",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// ── Install ────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// ── Activate ───────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(
            (name) => name !== CACHE_NAME && name !== STATIC_CACHE
          )
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// ── Fetch ──────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Jangan intercept Firebase, API calls, extension requests
  if (
    url.hostname.includes("firebase") ||
    url.hostname.includes("googleapis") ||
    url.hostname.includes("gstatic") ||
    url.protocol === "chrome-extension:"
  ) {
    return;
  }

  // Untuk navigasi (HTML pages) — Network First, fallback ke "/"
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache respons navigasi yang berhasil
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Offline: kembalikan dari cache atau root
          return caches.match(request).then(
            (cached) => cached || caches.match("/")
          );
        })
    );
    return;
  }

  // Untuk aset statis (JS, CSS, PNG, font, dll) — Cache First
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (!response || response.status !== 200) return response;
          const responseClone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }

  // Default: Network Only
  event.respondWith(fetch(request));
});
