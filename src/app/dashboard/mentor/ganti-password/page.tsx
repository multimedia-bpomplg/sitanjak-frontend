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

export default function GantiPasswordMentorPage() {
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
          Perbarui kata sandi akun mentor Anda secara berkala untuk menjaga
          keamanan akses
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
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Password Baru
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
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

              {/* Strength Indicator */}
              {passwordBaru && (
                <div className="space-y-1.5 pt-0.5">
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-1.5 rounded-full transition-colors ${
                          step <= strength.score
                            ? strength.barClass
                            : "bg-slate-200 dark:bg-slate-700"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Kekuatan password:{" "}
                    <span className={`font-bold ${strength.textClass}`}>
                      {strength.label}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Konfirmasi Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                  Konfirmasi password belum cocok dengan password baru.
                </p>
              )}
            </div>

            {/* Warning Auto-Logout */}
            <div className="rounded-xl border border-amber-200 dark:border-amber-800/70 bg-amber-50/80 dark:bg-amber-950/30 px-4 py-3 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p>
                Setelah password berhasil diperbarui, sesi Anda akan{" "}
                <span className="font-bold">otomatis logout</span> dan Anda perlu
                login kembali menggunakan password baru.
              </p>
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0284c7] hover:bg-sky-700 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Save className="w-4 h-4" />
                {loading ? "Menyimpan..." : "Simpan Password"}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT: CHECKLIST KEAMANAN */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#0284c7] dark:bg-sky-950/60 dark:text-sky-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Kriteria Password
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pastikan hal berikut terpenuhi
              </p>
            </div>
          </div>

          <ul className="space-y-2.5 text-xs">
            <ChecklistItem
              checked={checks.minLength}
              label="Minimal 8 karakter"
            />
            <ChecklistItem
              checked={checks.hasMix}
              label="Kombinasi huruf & angka (disarankan)"
            />
            <ChecklistItem
              checked={checks.differsFromOld}
              label="Berbeda dari password lama"
            />
            <ChecklistItem
              checked={checks.matchesConfirm}
              label="Konfirmasi password cocok"
            />
          </ul>

          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            Jangan bagikan password akun mentor Anda kepada siapa pun karena
            akun mentor memiliki akses verifikasi logbook serta penilaian
            laporan akhir peserta.
          </div>
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({
  checked,
  label,
}: {
  checked: boolean;
  label: string;
}) {
  return (
    <li className="flex items-center gap-2">
      {checked ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
      ) : (
        <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
      )}
      <span
        className={
          checked
            ? "font-semibold text-emerald-700 dark:text-emerald-300"
            : "text-slate-600 dark:text-slate-400"
        }
      >
        {label}
      </span>
    </li>
  );
}
