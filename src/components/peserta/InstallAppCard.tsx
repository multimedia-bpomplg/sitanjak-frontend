"use client";

import React, { useState } from "react";
import { ChevronRight, Smartphone } from "lucide-react";
import { usePwa } from "@/components/pwa/PwaProvider";
import { InstallAppModal } from "@/components/peserta/InstallAppModal";
import { showToast } from "@/components/ui/toastDashboard";

/**
 * Card akses cadangan untuk memasang aplikasi SI TANJAK dari halaman Akun Peserta.
 * Otomatis tersembunyi ketika aplikasi sudah berjalan dalam mode standalone.
 */
export function InstallAppCard() {
  const { isReady, isStandalone, canPromptInstall, triggerInstall } = usePwa();
  const [openModal, setOpenModal] = useState(false);

  if (!isReady || isStandalone) {
    return null;
  }

  const handleClick = async () => {
    if (canPromptInstall) {
      const outcome = await triggerInstall();
      if (outcome === "accepted") {
        showToast.success("Aplikasi SI TANJAK berhasil dipasang ke perangkat.");
      }
      return;
    }
    setOpenModal(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="w-full rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-5 flex items-center justify-between gap-3 text-left shadow-2xs hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition"
      >
        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1D64F2] dark:text-blue-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-slate-900 dark:text-white">
              Install Aplikasi di HP
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
              Pasang SI TANJAK ke layar utama untuk akses cepat seperti
              aplikasi native.
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0" />
      </button>

      <InstallAppModal open={openModal} onClose={() => setOpenModal(false)} />
    </>
  );
}
