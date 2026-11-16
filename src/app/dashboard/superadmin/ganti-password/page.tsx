"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Save,
  ShieldCheck,
} from "lucide-react";
import { showToast } from "@/components/ui/toastDashboard";

function getPasswordStrength(password: string): {
  label: string;
  score: number;
  barClass: string;
  textClass: string;
} {
  if (!password) {
    return {
      label: "Belum diisi",
      score: 0,
      barClass: "bg-slate-200 dark:bg-slate-700",
      textClass: "text-slate-400",
    };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return {
      label: "Lemah",
      score: 1,
      barClass: "bg-rose-500",
      textClass: "text-rose-600 dark:text-rose-400",
    };
  }
  if (score <= 2) {
    return {
      label: "Sedang",
      score: 2,
      barClass: "bg-amber-500",
      textClass: "text-amber-600 dark:text-amber-400",
    };
  }
  if (score === 3) {
    return {
      label: "Baik",
      score: 3,
      barClass: "bg-[#0284c7]",
      textClass: "text-[#0284c7] dark:text-sky-400",
    };
  }
  return {
    label: "Kuat",
    score: 4,
    barClass: "bg-emerald-500",
    textClass: "text-emerald-600 dark:text-emerald-400",
  };
}

export default function GantiPasswordSuperadminPage() {
  const [passwordLama, setPasswordLama] = useState("");
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [loading, setLoading] = useState(false);

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const strength = useMemo(
    () => getPasswordStrength(passwordBaru),
    [passwordBaru],
  );

  const checks = useMemo(
    () => ({
      minLength: passwordBaru.length >= 8,
      hasMix: /[A-Za-z]/.test(passwordBaru) && /\d/.test(passwordBaru),
      differsFromOld:
        Boolean(passwordBaru) &&
        (!passwordLama || passwordBaru !== passwordLama),
      matchesConfirm:
        Boolean(passwordBaru) &&
        Boolean(konfirmasi) &&
        passwordBaru === konfirmasi,
    }),
    [passwordLama, passwordBaru, konfirmasi],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordLama || !passwordBaru || !konfirmasi) {
      showToast.error("Semua field wajib diisi");
      return;
    }

    if (passwordBaru.length < 8) {
      showToast.error("Password baru minimal 8 karakter");
      return;
    }

    if (passwordBaru === passwordLama) {
      showToast.error("Password baru tidak boleh sama dengan password lama");
      return;
    }

    if (passwordBaru !== konfirmasi) {
      showToast.error("Konfirmasi password tidak cocok");
      return;
    }

    setLoading(true);
    const toastId = showToast.loading("Menyimpan password...");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast.updateError(
          toastId,
          "Sesi login habis. Silakan login ulang.",
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
        },
      );

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error(
            "Sesi login Anda telah berakhir. Silakan login ulang.",
          );
        }
        throw new Error(data?.message || "Gagal mengganti password");
      }

      showToast.updateSuccess(
        toastId,
        "Password berhasil diganti. Silakan login ulang.",
      );

      setPasswordLama("");
      setPasswordBaru("");
      setKonfirmasi("");

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 1400);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengganti password";
      showToast.updateError(toastId, message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ================= PAGE HEADER ================= */}
      <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Ganti Password
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Perbarui kata sandi akun Superadmin Anda secara berkala untuk menjaga
          keamanan penuh sistem
        </p>
      </div>

      {/* ================= CONTENT GRID ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT: FORM CARD */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <div className="px-5 sm:px-6 py-4 bg-linear-to-r from-[#0284c7] via-sky-600 to-blue-700 dark:from-[#0369a1] dark:to-blue-900 text-white flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold">
                Formulir Pembaruan Password
              </h2>
              <p className="text-xs text-sky-100">
                Masukkan password saat ini dan password baru Anda
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
            {/* Password Lama */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Password Lama
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showOldPassword ? "text" : "password"}
                  value={passwordLama}
                  onChange={(e) => setPasswordLama(e.target.value)}
                  placeholder="Masukkan password saat ini"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword((v) => !v)}
                  aria-label="Tampilkan atau sembunyikan password lama"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0284c7] transition"
                >
                  {showOldPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Baru */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Password Baru
                </label>
                <span className={`text-xs font-semibold ${strength.textClass}`}>
                  Kekuatan: {strength.label}
                </span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordBaru}
                  onChange={(e) => setPasswordBaru(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  autoComplete="new-password"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  aria-label="Tampilkan atau sembunyikan password baru"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0284c7] transition"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Strength Bars */}
              <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1.5 rounded-full transition-colors ${
                      strength.score >= level
                        ? strength.barClass
                        : "bg-slate-200 dark:bg-slate-800"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Konfirmasi Password Baru */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <CheckCircle2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={konfirmasi}
                  onChange={(e) => setKonfirmasi(e.target.value)}
                  placeholder="Ulangi password baru"
                  autoComplete="new-password"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label="Tampilkan atau sembunyikan konfirmasi password"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0284c7] transition"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {konfirmasi && passwordBaru !== konfirmasi && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  Konfirmasi password belum cocok dengan password baru
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-linear-to-r from-[#0284c7] to-blue-700 hover:from-[#0369a1] hover:to-blue-800 shadow-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {loading ? "Menyimpan..." : "Simpan Password Baru"}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT: GUIDELINES & SECURITY NOTICE */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Kriteria Keamanan Password
                </h3>
                <p className="text-[11px] text-slate-400">
                  Pastikan seluruh poin berikut terpenuhi
                </p>
              </div>
            </div>

            <ul className="space-y-2.5 text-xs">
              {[
                { ok: checks.minLength, text: "Minimal 8 karakter" },
                { ok: checks.hasMix, text: "Kombinasi huruf dan angka" },
                {
                  ok: checks.differsFromOld,
                  text: "Berbeda dari password lama",
                },
                {
                  ok: checks.matchesConfirm,
                  text: "Konfirmasi password sesuai",
                },
              ].map((item) => (
                <li
                  key={item.text}
                  className={`flex items-center gap-2 ${
                    item.ok
                      ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {item.ok ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 shrink-0 opacity-60" />
                  )}
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-200/90 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/20 p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
              <p className="font-bold">Keluar Otomatis Setelah Perubahan</p>
              <p className="leading-relaxed opacity-90">
                Demi keamanan sesi akun Anda, sistem akan mengeluarkan Anda
                setelah password diperbarui agar dapat login ulang dengan
                password baru.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
