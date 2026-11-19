"use client";

import React, { useState } from "react";
import {
  Download,
  MoreVertical,
  PlusSquare,
  Share,
  Smartphone,
  X,
} from "lucide-react";
import { usePwa } from "@/components/pwa/PwaProvider";
import { showToast } from "@/components/ui/toastDashboard";

interface InstallAppModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal ajakan instalasi PWA SI TANJAK untuk Peserta Magang.
 * Mendukung one-tap install pada Android/Chrome serta panduan manual iOS Safari & browser lainnya.
 */
export function InstallAppModal({ open, onClose }: InstallAppModalProps) {
  const { isIos, isInAppBrowser, canPromptInstall, triggerInstall } = usePwa();
  const [installing, setInstalling] = useState(false);

  if (!open) return null;

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      const outcome = await triggerInstall();
      if (outcome === "accepted") {
        showToast.success("Aplikasi SI TANJAK berhasil dipasang ke perangkat.");
        onClose();
      } else if (outcome === "dismissed") {
        onClose();
      }
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-pwa-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/55 backdrop-blur-xs p-3 sm:p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/assets-new/icon-mobile/apple-touch-180.png"
              alt="Logo SI TANJAK"
              className="w-12 h-12 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white shadow-xs shrink-0 object-contain"
            />
            <div className="min-w-0">
              <h3
                id="install-pwa-title"
                className="text-base font-extrabold text-slate-900 dark:text-white leading-snug"
              >
                Pasang Aplikasi SI TANJAK
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Akses absensi &amp; logbook lebih cepat dari layar utama HP.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {canPromptInstall ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 p-3.5 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                Pasang SI TANJAK sebagai aplikasi ringan di HP Anda tanpa
                address bar browser dan langsung terbuka ke portal peserta.
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  disabled={installing}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1D64F2] hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs transition disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {installing ? "Memasang..." : "Install Aplikasi"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition"
                >
                  Nanti Saja
                </button>
              </div>
            </div>
          ) : isInAppBrowser ? (
            <div className="space-y-3.5">
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 p-3.5 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                Anda membuka halaman ini melalui browser di dalam aplikasi
                (misalnya WhatsApp/Instagram). Untuk meng-install aplikasi,
                buka tautan ini terlebih dahulu di{" "}
                <strong>{isIos ? "Safari" : "Google Chrome"}</strong>.
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1D64F2] hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition"
              >
                Mengerti
              </button>
            </div>
          ) : isIos ? (
            <div className="space-y-3.5">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Untuk memasang aplikasi SI TANJAK di iPhone/iPad melalui{" "}
                <strong>Safari</strong>, ikuti 3 langkah berikut:
              </p>

              <ol className="space-y-2.5 text-xs text-slate-700 dark:text-slate-200">
                <li className="flex items-start gap-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 p-3">
                  <span className="w-5 h-5 rounded-full bg-[#1D64F2] text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span className="leading-relaxed">
                    Ketuk ikon{" "}
                    <span className="inline-flex items-center gap-1 font-bold text-slate-900 dark:text-white">
                      Bagikan <Share className="w-3.5 h-3.5 text-[#1D64F2]" />
                    </span>{" "}
                    pada bilah menu Safari.
                  </span>
                </li>
                <li className="flex items-start gap-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 p-3">
                  <span className="w-5 h-5 rounded-full bg-[#1D64F2] text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span className="leading-relaxed">
                    Gulir ke bawah lalu pilih{" "}
                    <span className="inline-flex items-center gap-1 font-bold text-slate-900 dark:text-white">
                      Tambahkan ke Layar Utama{" "}
                      <PlusSquare className="w-3.5 h-3.5 text-[#1D64F2]" />
                    </span>
                    .
                  </span>
                </li>
                <li className="flex items-start gap-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 p-3">
                  <span className="w-5 h-5 rounded-full bg-[#1D64F2] text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                    3
                  </span>
                  <span className="leading-relaxed">
                    Ketuk <strong>Tambah (Add)</strong> di pojok kanan atas.
                  </span>
                </li>
              </ol>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1D64F2] hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition"
              >
                Mengerti
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 p-3.5 space-y-2 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Smartphone className="w-4 h-4 text-[#1D64F2] shrink-0" />
                  <span>Cara Pasang Lewat Menu Browser</span>
                </div>
                <p>
                  Ketuk ikon menu{" "}
                  <MoreVertical className="inline w-3.5 h-3.5 text-slate-500" />{" "}
                  di pojok kanan atas browser (Chrome/Edge), lalu pilih{" "}
                  <strong>&ldquo;Install app&rdquo;</strong> atau{" "}
                  <strong>&ldquo;Tambahkan ke layar utama&rdquo;</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1D64F2] hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition"
              >
                Nanti Saja
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
