"use client";

import React from "react";
import { toast } from "react-toastify";
import { CheckCircle2, AlertCircle, Loader2, Sparkles } from "lucide-react";

/* ================= DARK MODE DETECTION ================= */
const isDark = () =>
  typeof document !== "undefined" &&
  document.documentElement.classList.contains("dark");

/* ================= BASE TOAST CONTAINER STYLE ================= */
const baseStyle = (variant: "success" | "error" | "loading"): React.CSSProperties => {
  const dark = isDark();
  const borderColors = {
    success: dark ? "rgba(29, 100, 242, 0.45)" : "rgba(29, 100, 242, 0.22)",
    error: dark ? "rgba(244, 63, 94, 0.45)" : "rgba(244, 63, 94, 0.25)",
    loading: dark ? "rgba(56, 189, 248, 0.4)" : "rgba(29, 100, 242, 0.22)",
  };

  return {
    borderRadius: "16px",
    padding: "12px 14px",
    background: dark
      ? "linear-gradient(135deg, #0B1528 0%, #0F172A 100%)"
      : "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
    color: dark ? "#F8FAFC" : "#0F172A",
    border: `1px solid ${borderColors[variant]}`,
    boxShadow: dark
      ? "0 20px 45px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.04)"
      : "0 18px 40px -12px rgba(15, 23, 42, 0.16), 0 4px 14px -4px rgba(29, 100, 242, 0.1)",
    overflow: "hidden",
  };
};

/* ================= CUSTOM TOAST CONTENT ================= */
function ToastContent({
  variant,
  message,
}: {
  variant: "success" | "error" | "loading";
  message: string;
}) {
  const config = {
    success: {
      badge: "Berhasil",
      badgeColor: "text-[#1D64F2] dark:text-sky-400",
      iconWrap:
        "bg-linear-to-br from-[#1D64F2] to-[#0088FF] text-white shadow-sm shadow-blue-500/25",
      icon: <CheckCircle2 className="w-5 h-5" strokeWidth={2.4} />,
    },
    error: {
      badge: "Perhatian",
      badgeColor: "text-rose-600 dark:text-rose-400",
      iconWrap:
        "bg-linear-to-br from-rose-500 to-red-600 text-white shadow-sm shadow-rose-500/25",
      icon: <AlertCircle className="w-5 h-5" strokeWidth={2.4} />,
    },
    loading: {
      badge: "Memproses",
      badgeColor: "text-[#1D64F2] dark:text-sky-400",
      iconWrap:
        "bg-blue-50 dark:bg-blue-950/70 border border-blue-200/80 dark:border-blue-800 text-[#1D64F2] dark:text-blue-400",
      icon: <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.4} />,
    },
  }[variant];

  return (
    <div className="flex items-start gap-3 pr-1">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${config.iconWrap}`}
      >
        {config.icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[11px] font-extrabold uppercase tracking-wider ${config.badgeColor}`}
            style={{ fontWeight: 800 }}
          >
            {config.badge}
          </span>
          {variant === "success" && (
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
          )}
        </div>
        <p
          className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug mt-0.5 break-words"
          style={{ fontWeight: 600 }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}

/* ================= TOAST HELPER ================= */
export const showToast = {
  success: (msg: string) =>
    toast(<ToastContent variant="success" message={msg} />, {
      style: baseStyle("success"),
      progressClassName: "toast-progress-success",
      icon: false,
    }),

  error: (msg: string) =>
    toast(<ToastContent variant="error" message={msg} />, {
      style: baseStyle("error"),
      progressClassName: "toast-progress-error",
      icon: false,
    }),

  loading: (msg: string) =>
    toast(<ToastContent variant="loading" message={msg} />, {
      isLoading: true,
      autoClose: false,
       closeOnClick: false,
      style: baseStyle("loading"),
      progressClassName: "toast-progress-loading",
      icon: false,
    }),

  updateSuccess: (id: any, msg: string) =>
    toast.update(id, {
      render: <ToastContent variant="success" message={msg} />,
      type: "default",
      isLoading: false,
      autoClose: 3000,
      closeOnClick: true,
      style: baseStyle("success"),
      progressClassName: "toast-progress-success",
      icon: false,
    }),

  updateError: (id: any, msg: string) =>
    toast.update(id, {
      render: <ToastContent variant="error" message={msg} />,
      type: "default",
      isLoading: false,
      autoClose: 3500,
      closeOnClick: true,
      style: baseStyle("error"),
      progressClassName: "toast-progress-error",
      icon: false,
    }),
};
