"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

type InstallOutcome = "accepted" | "dismissed" | "unavailable";

interface PwaContextValue {
  isReady: boolean;
  isStandalone: boolean;
  isIos: boolean;
  isInAppBrowser: boolean;
  canPromptInstall: boolean;
  isDismissedRecently: boolean;
  dismissInstallPrompt: () => void;
  triggerInstall: () => Promise<InstallOutcome>;
}

const DISMISS_STORAGE_KEY = "sitanjak_pwa_dismissed_at";
const DISMISS_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // 3 hari

const PwaContext = createContext<PwaContextValue>({
  isReady: false,
  isStandalone: false,
  isIos: false,
  isInAppBrowser: false,
  canPromptInstall: false,
  isDismissedRecently: false,
  dismissInstallPrompt: () => {},
  triggerInstall: async () => "unavailable",
});

const emptySubscribe = () => () => {};

function subscribeStandalone(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mediaQuery = window.matchMedia("(display-mode: standalone)");
  mediaQuery.addEventListener("change", callback);
  window.addEventListener("appinstalled", callback);
  return () => {
    mediaQuery.removeEventListener("change", callback);
    window.removeEventListener("appinstalled", callback);
  };
}

function checkStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

function checkDismissedRecently(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(DISMISS_STORAGE_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < DISMISS_COOLDOWN_MS;
  } catch {
    return false;
  }
}

/**
 * Menyediakan registrasi Service Worker, deteksi platform/standalone,
 * serta penangkapan global event `beforeinstallprompt`.
 */
export function PwaProvider({ children }: { children: React.ReactNode }) {
  const isReady = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const standaloneDetected = useSyncExternalStore(
    subscribeStandalone,
    checkStandalone,
    () => false,
  );

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installedManually, setInstalledManually] = useState(false);
  const [dismissedInSession, setDismissedInSession] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => {
          console.warn("Service worker registration failed:", err);
        });
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setInstalledManually(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const ua = isReady ? window.navigator.userAgent || "" : "";
  const isIos =
    isReady &&
    (/iPad|iPhone|iPod/.test(ua) ||
      (window.navigator.platform === "MacIntel" &&
        window.navigator.maxTouchPoints > 1));
  const isInAppBrowser =
    isReady &&
    /FBAN|FBAV|Instagram|Line\/|MicroMessenger|WhatsApp|;\s*wv\)/i.test(ua);

  const isStandalone = standaloneDetected || installedManually;
  const isDismissedRecently =
    isReady && (dismissedInSession || checkDismissedRecently());

  const dismissInstallPrompt = useCallback(() => {
    setDismissedInSession(true);
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
    } catch {
      // Abaikan jika storage diblokir
    }
  }, []);

  const triggerInstall = useCallback(async (): Promise<InstallOutcome> => {
    if (!deferredPrompt) return "unavailable";

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (choice.outcome === "accepted") {
        setInstalledManually(true);
      }
      return choice.outcome;
    } catch (err) {
      console.error("Gagal memicu prompt install PWA:", err);
      return "unavailable";
    }
  }, [deferredPrompt]);

  return (
    <PwaContext.Provider
      value={{
        isReady,
        isStandalone,
        isIos,
        isInAppBrowser,
        canPromptInstall: Boolean(deferredPrompt),
        isDismissedRecently,
        dismissInstallPrompt,
        triggerInstall,
      }}
    >
      {children}
    </PwaContext.Provider>
  );
}

export function usePwa() {
  return useContext(PwaContext);
}
