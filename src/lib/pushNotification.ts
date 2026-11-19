"use client";

export type PushSupportState =
  | "supported"
  | "ios_needs_install"
  | "unsupported";

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function detectPushSupport(): PushSupportState {
  if (typeof window === "undefined") return "unsupported";

  const ua = window.navigator.userAgent || "";
  const isIos =
    /iPad|iPhone|iPod/.test(ua) ||
    (window.navigator.platform === "MacIntel" &&
      window.navigator.maxTouchPoints > 1);
  const nav = window.navigator as Navigator & { standalone?: boolean };
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true;

  if (isIos && !isStandalone) {
    return "ios_needs_install";
  }

  if (
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return "unsupported";
  }

  return "supported";
}

async function resolveVapidPublicKey(apiBase: string, token: string): Promise<string> {
  const envKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "").trim();
  if (envKey) return envKey;

  const res = await fetch(`${apiBase}/notifications/push/vapid-public-key`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error("VAPID public key belum tersedia di server.");
  }
  const json = await res.json();
  const serverKey = String(json?.publicKey || "").trim();
  if (!serverKey) {
    throw new Error("VAPID public key kosong.");
  }
  return serverKey;
}

/**
 * Mengecek apakah perangkat saat ini memiliki izin notifikasi dan PushSubscription aktif di server.
 */
export async function getDevicePushStatus(): Promise<boolean> {
  if (detectPushSupport() !== "supported") return false;
  if (Notification.permission !== "granted") return false;

  try {
    const token = localStorage.getItem("token");
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
    if (!token || !apiBase) return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return false;

    const res = await fetch(
      `${apiBase}/notifications/push/status?endpoint=${encodeURIComponent(
        subscription.endpoint,
      )}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!res.ok) return false;
    const json = await res.json();
    return Boolean(json?.subscribed);
  } catch {
    return false;
  }
}

/**
 * Meminta izin notifikasi OS, membuat PushSubscription via Service Worker,
 * dan menyimpannya ke backend.
 */
export async function subscribeDevicePush(): Promise<void> {
  const support = detectPushSupport();
  if (support === "ios_needs_install") {
    throw new Error(
      "Di iPhone/iPad, pasang aplikasi SI TANJAK ke Layar Utama terlebih dahulu untuk mengaktifkan notifikasi perangkat.",
    );
  }
  if (support === "unsupported") {
    throw new Error("Browser atau perangkat ini belum mendukung Push Notification.");
  }

  const token = localStorage.getItem("token");
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
  if (!token || !apiBase) {
    throw new Error("Sesi login tidak ditemukan.");
  }

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") {
    throw new Error(
      "Izin notifikasi diblokir. Aktifkan izin notifikasi untuk situs ini di pengaturan browser/HP Anda.",
    );
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    const publicKey = await resolveVapidPublicKey(apiBase, token);
    const applicationServerKey = urlBase64ToUint8Array(publicKey);
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as BufferSource,
    });
  }

  const res = await fetch(`${apiBase}/notifications/push/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "Gagal mengaktifkan notifikasi perangkat.");
  }
}

/**
 * Mencabut subscription perangkat saat ini di browser dan menghapusnya dari backend.
 */
export async function unsubscribeDevicePush(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  try {
    const token = localStorage.getItem("token");
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription && token && apiBase) {
      await fetch(`${apiBase}/notifications/push/unsubscribe`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      }).catch(() => {});
    }

    if (subscription) {
      await subscription.unsubscribe().catch(() => {});
    }
  } catch {
    // Abaikan error saat cleanup
  }
}
