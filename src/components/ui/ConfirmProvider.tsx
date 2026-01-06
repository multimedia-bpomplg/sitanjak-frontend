"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type ConfirmOptions = {
  title: string;
  message: string;
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
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-md"
      onClick={onClose}
    />

    <div
      className="
        relative w-full max-w-sm
        rounded-3xl px-8 py-8 text-center
        bg-white dark:bg-[#020617]
        text-slate-800 dark:text-slate-100
        shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)]
        border border-slate-200 dark:border-slate-800
        animate-scaleIn
      "
    >
      <div
        className="
          mx-auto mb-4 w-20 h-20 rounded-full
          bg-gradient-to-br from-rose-500 to-pink-500
          flex items-center justify-center
          text-white text-4xl shadow-lg
        "
      >
        ⚠️
      </div>

      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        {message}
      </p>

      <div className="mt-6 flex gap-3 justify-center">
        <button
          onClick={onClose}
          className="
            px-4 py-2 rounded-xl
            border border-slate-300 dark:border-slate-700
            text-slate-600 dark:text-slate-300
            hover:bg-slate-100 dark:hover:bg-slate-800
          "
        >
          Batal
        </button>

        <button
          onClick={onConfirm}
          className="
            px-5 py-2 rounded-xl
            bg-gradient-to-r from-rose-600 to-pink-600
            text-white font-semibold
            shadow-lg hover:opacity-90
          "
        >
          Ya, Lanjutkan
        </button>
      </div>
    </div>
  </div>
);