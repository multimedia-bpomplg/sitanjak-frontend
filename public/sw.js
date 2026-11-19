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

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "SI TANJAK", body: event.data.text() };
  }

  const title = data.title || "SI TANJAK";
  const options = {
    body: data.body || "Ada pembaruan baru di portal peserta SI TANJAK.",
    icon: "/images/assets-new/icon-mobile/192-maskable.png",
    badge: "/images/assets-new/icon-mobile/192.png",
    tag: data.tag || "sitanjak-notification",
    renotify: true,
    data: {
      url: data.url || "/dashboard/peserta",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    (event.notification &&
      event.notification.data &&
      event.notification.data.url) ||
    "/dashboard/peserta";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (
            client.url.startsWith(self.location.origin) &&
            "focus" in client
          ) {
            if ("navigate" in client && typeof client.navigate === "function") {
              return client.navigate(targetUrl).then((c) => (c ? c.focus() : client.focus()));
            }
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      }),
  );
});
