"use client";

import { useState } from "react";
import { showToast } from "@/components/ui/toastDashboard";
import { HiEye, HiEyeOff } from "react-icons/hi";

export default function GantiPasswordPage() {
  const [passwordLama, setPasswordLama] = useState("");
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [loading, setLoading] = useState(false);

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordLama || !passwordBaru || !konfirmasi) {
      showToast.error("Semua field wajib diisi");
      return;
    }

    if (passwordBaru !== konfirmasi) {
      showToast.error("Konfirmasi password tidak cocok");
      return;
    }

    if (passwordBaru.length < 8) {
      showToast.error("Password minimal 8 karakter");
      return;
    }

    setLoading(true);

    // 🔔 LOADING TOAST
    const toastId = showToast.loading("Menyimpan password...");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        showToast.updateError(
          toastId,
          "Sesi login habis. Silakan login ulang."
        );
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/peserta/ganti-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            passwordLama,
            passwordBaru,
            konfirmasiPassword: konfirmasi,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Sesi login Anda telah berakhir. Silakan login ulang.");
        }
        throw new Error(data?.message || "Gagal mengganti password");
      }

      // ✅ UPDATE TOAST → SUCCESS
      showToast.updateSuccess(
        toastId,
        "Password berhasil diganti. Silakan login ulang."
      );

      // reset
      setPasswordLama("");
      setPasswordBaru("");
      setKonfirmasi("");

      localStorage.removeItem("token");

      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 1500);
    } catch (err: any) {
      // ❌ UPDATE TOAST → ERROR
      showToast.updateError(
        toastId,
        err.message || "Terjadi kesalahan saat mengganti password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div
        className="
          w-full max-w-md
          rounded-3xl
          bg-white dark:bg-slate-900
          shadow-[0_30px_80px_-25px_rgba(0,0,0,0.35)]
          border border-slate-200 dark:border-slate-800
          overflow-hidden
        "
      >
        {/* HEADER */}
        <div
          className="
            px-6 py-6
            bg-gradient-to-r from-emerald-500 to-teal-500
            dark:from-indigo-600 dark:to-violet-600
            text-white
          "
        >
          <h1 className="text-xl font-extrabold flex items-center gap-2">
            🔐 Ganti Password
          </h1>
          <p className="text-sm text-white/80 mt-1">
            Perbarui password akun Anda secara aman
          </p>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5"
        >
          {/* PASSWORD LAMA */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Password Lama
            </label>

            <div className="relative">
              <input
                type={showOldPassword ? "text" : "password"}
                value={passwordLama}
                onChange={(e) => setPasswordLama(e.target.value)}
                className="
                  w-full px-4 py-2.5 pr-12 rounded-xl
                  bg-white dark:bg-slate-800
                  border border-slate-300 dark:border-slate-700
                  focus:outline-none focus:ring-2 focus:ring-emerald-500
                  transition
                "
              />

              <button
                type="button"
                onClick={() => setShowOldPassword((v) => !v)}
                className="
                  absolute right-4 top-1/2 -translate-y-1/2
                  text-slate-500 hover:text-emerald-600 dark:hover:text-indigo-600
                  transition
                "
              >
                {showOldPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
              </button>
            </div>
          </div>

          {/* PASSWORD BARU */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Password Baru
            </label>

            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={passwordBaru}
                onChange={(e) => setPasswordBaru(e.target.value)}
                className="
                  w-full px-4 py-2.5 pr-12 rounded-xl
                  bg-white dark:bg-slate-800
                  border border-slate-300 dark:border-slate-700
                  focus:outline-none focus:ring-2 focus:ring-emerald-500
                  transition
                "
              />

              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                className="
                  absolute right-4 top-1/2 -translate-y-1/2
                  text-slate-500 hover:text-emerald-600 dark:hover:text-indigo-600
                  transition
                "
              >
                {showNewPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Minimal 8 karakter
            </p>
          </div>

          {/* KONFIRMASI */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Konfirmasi Password Baru
            </label>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={konfirmasi}
                onChange={(e) => setKonfirmasi(e.target.value)}
                className="
                  w-full px-4 py-2.5 pr-12 rounded-xl
                  bg-white dark:bg-slate-800
                  border border-slate-300 dark:border-slate-700
                  focus:outline-none focus:ring-2 focus:ring-emerald-500
                  transition
                "
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="
                  absolute right-4 top-1/2 -translate-y-1/2
                  text-slate-500 hover:text-emerald-600 dark:hover:text-indigo-600
                  transition
                "
              >
                {showConfirmPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
              </button>
            </div>
          </div>

          {/* INFO */}
          <div
            className="
              rounded-xl
              border border-amber-300
              bg-amber-50 dark:bg-amber-900/20
              px-4 py-3
              text-xs text-amber-800 dark:text-amber-200
            "
          >
            ⚠️ Setelah password berhasil diganti, Anda akan
            <b> otomatis logout</b> dan perlu login ulang.
          </div>

          {/* BUTTON */}
          <button
            disabled={loading}
            className="
              w-full
              flex items-center justify-center gap-2
              py-3 rounded-full
              font-semibold text-white
              bg-gradient-to-r from-emerald-600 to-teal-600
              hover:from-emerald-700 hover:to-teal-700
              shadow-md hover:shadow-lg
              transition
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                Menyimpan...
              </>
            ) : (
              <>
                💾 Simpan Password
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
