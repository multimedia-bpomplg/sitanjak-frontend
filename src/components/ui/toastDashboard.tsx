"use client";

import { toast } from "react-toastify";
import { HiCheckCircle, HiXCircle, HiExclamation } from "react-icons/hi";

/* ================= DARK MODE DETECTION ================= */
const isDark = () =>
  typeof document !== "undefined" &&
  document.documentElement.classList.contains("dark");

/* ================= BASE TOAST STYLE ================= */
const baseStyle = () => ({
  borderRadius: "14px",
  fontWeight: 500,
  background: isDark() ? "#020617" : "#FFFFFF",
  color: isDark() ? "#E5E7EB" : "#1F2937",
  boxShadow: isDark()
    ? "0 10px 40px rgba(0,0,0,0.6)"
    : "0 10px 30px rgba(0,0,0,0.15)",
});

/* ================= TOAST HELPER ================= */
export const showToast = {
  success: (msg: string) =>
    toast.success(msg, {
      style: baseStyle(),
      progressClassName: "toast-progress-success",
      icon: <HiCheckCircle className="text-emerald-500" size={22} />,
    }),

  error: (msg: string) =>
    toast.error(msg, {
      style: baseStyle(),
      progressClassName: "toast-progress-error",
      icon: <HiXCircle className="text-rose-500" size={22} />,
    }),

  loading: (msg: string) =>
    toast.loading(msg, {
      style: baseStyle(),
      progressClassName: "toast-progress-loading",
      icon: <HiExclamation className="text-yellow-500" size={22} />,
    }),

  updateSuccess: (id: any, msg: string) =>
    toast.update(id, {
      render: msg,
      type: "success",
      isLoading: false,
      autoClose: 3000,
      style: baseStyle(),
      progressClassName: "toast-progress-success",
      icon: <HiCheckCircle className="text-emerald-500" size={22} />,
    }),

  updateError: (id: any, msg: string) =>
    toast.update(id, {
      render: msg,
      type: "error",
      isLoading: false,
      autoClose: 3000,
      style: baseStyle(),
      progressClassName: "toast-progress-error",
      icon: <HiXCircle className="text-rose-500" size={22} />,
    }),
};