"use client";

import {
  HiCheckCircle,
  HiXCircle,
  HiExclamation,
  HiInformationCircle,
} from "react-icons/hi";

type AlertType = "success" | "error" | "warning" | "info";

interface AlertPopupProps {
  open: boolean;
  title?: string;
  message: string;
  type?: AlertType;
  onClose: () => void;
}

export default function AlertPopup({
  open,
  title,
  message,
  type = "info",
  onClose,
}: AlertPopupProps) {
  if (!open) return null;

  const styleMap = {
    success: {
      icon: <HiCheckCircle />,
      gradient: "from-emerald-500 to-green-600",
      softBg: "bg-emerald-50 dark:bg-emerald-500/10",
      button: "bg-emerald-600 hover:bg-emerald-700",
    },
    error: {
      icon: <HiXCircle />,
      gradient: "from-rose-500 to-red-600",
      softBg: "bg-rose-50 dark:bg-rose-500/10",
      button: "bg-rose-600 hover:bg-rose-700",
    },
    warning: {
      icon: <HiExclamation />,
      gradient: "from-amber-400 to-yellow-500",
      softBg: "bg-yellow-50 dark:bg-yellow-500/10",
      button: "bg-yellow-500 hover:bg-yellow-600",
    },
    info: {
      icon: <HiInformationCircle />,
      gradient: "from-indigo-500 to-blue-600",
      softBg: "bg-indigo-50 dark:bg-indigo-500/10",
      button: "bg-indigo-600 hover:bg-indigo-700",
    },
  };

  const style = styleMap[type];

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center px-4">
      {/* OVERLAY */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* DIALOG */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          relative
          w-full max-w-lg
          rounded-3xl
          bg-white dark:bg-slate-900
          shadow-[0_60px_160px_-40px_rgba(0,0,0,0.65)]
          ring-1 ring-black/5 dark:ring-white/10
          animate-scaleIn
        "
      >
        {/* FLOATING ICON */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2">
          <div
            className={`
              w-20 h-20
              rounded-2xl
              flex items-center justify-center
              text-white text-4xl
              bg-linear-to-br ${style.gradient}
              shadow-[0_25px_60px_rgba(0,0,0,0.35)]
              ring-8 ring-white dark:ring-slate-900
            `}
          >
            {style.icon}
          </div>
        </div>

        {/* CONTENT */}
        <div className="pt-16 px-8 pb-6 text-center">
          {title && (
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              {title}
            </h2>
          )}

          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {message}
          </p>
        </div>

        {/* FOOTER */}
        <div
          className={`
            px-8 py-4
            rounded-b-3xl
            ${style.softBg}
            flex justify-center
          `}
        >
          <button
            onClick={onClose}
            className={`
              px-8 py-2.5
              rounded-xl
              text-sm font-semibold
              text-white
              shadow-lg
              transition-all
              active:scale-95
              ${style.button}
            `}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}