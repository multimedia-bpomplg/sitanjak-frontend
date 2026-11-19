const CACHE_NAME = "sitanjak-pwa-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE_ASSETS = [
  OFFLINE_URL,
  "/images/assets-new/icon-mobile/192.png",
  "/images/assets-new/icon-mobile/192-maskable.png",
  "/images/assets-new/icon-mobile/apple-touch-180.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((oldKey) => caches.delete(oldKey)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Jangan pernah intercept request lintas domain (backend API, analytics, dll.)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Jangan pernah cache endpoint API atau request ber-Authorization
  if (url.pathname.startsWith("/api") || request.headers.has("Authorization")) {
    return;
  }

  // Navigasi halaman: selalu network-first agar data peserta & waktu server selalu segar
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cachedOffline = await caches.match(OFFLINE_URL);
        return cachedOffline || Response.error();
      }),
    );
    return;
  }

  // Aset PWA yang di-precache (offline fallback & ikon mobile)
  if (PRECACHE_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request)),
    );
  }
});
