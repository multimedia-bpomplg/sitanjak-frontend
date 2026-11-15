"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { LogOut, AlertTriangle, X } from "lucide-react";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
};

type ConfirmContextType = {
  confirm: (options: ConfirmOptions) => void;
};

const ConfirmContext = createContext<ConfirmContextType | null>(null);

/* ================= PROVIDER ================= */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const confirm = (opts: ConfirmOptions) => {
    setOptions(opts);
  };

  const close = () => setOptions(null);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {options && (
        <ConfirmPopup
          title={options.title}
          message={options.message}
          confirmText={options.confirmText}
          cancelText={options.cancelText}
          onConfirm={() => {
            options.onConfirm();
            close();
          }}
          onClose={close}
        />
      )}
    </ConfirmContext.Provider>
  );
}

/* ================= HOOK ================= */
export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm harus dipakai di dalam ConfirmProvider");
  }
  return ctx.confirm;
};

/* ================= UI POPUP ================= */
const ConfirmPopup = ({
  title,
  message,
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
}) => {
  const isLogout =
    title.toLowerCase().includes("keluar") ||
    title.toLowerCase().includes("logout");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-xs"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-5 animate-scaleIn">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200/80 dark:border-red-800/70 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              {isLogout ? (
                <LogOut className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>

            <div>
              <h3
                className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight"
                style={{ fontWeight: 800 }}
              >
                {title}
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-2xs transition inline-flex items-center justify-center gap-2"
          >
            {isLogout && <LogOut className="w-4 h-4" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
