"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { plusJakarta } from "@/lib/font";
import {
  HiMail,
  HiLockClosed,
  HiArrowLeft,
  HiEye,
  HiEyeOff,
  HiOutlineShieldCheck,
  HiOutlineCheckCircle,
} from "react-icons/hi";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = "email" | "otp" | "reset" | "success";

export default function LupaPasswordPage() {
  /* ===================== STATE ===================== */
  const [step, setStep] = useState<Step>("email");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const otpLength = 6;
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  /* ===================== TIMER OTP ===================== */
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  /* ===================== STEP 1: REQUEST OTP ===================== */
  const handleSendOtp = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (!emailRegex.test(email)) {
      setError("Format email tidak valid");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/lupa-password/request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setStep("otp");
      setCountdown(60);
      setMessage("Kode OTP telah dikirim ke email Anda");
    } catch (err: unknown) {
      setError(err instanceof Error && err.message ? err.message : "Gagal mengirim OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ===================== STEP 2: VERIFY OTP ===================== */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError("Kode OTP harus 6 digit");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/lupa-password/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setStep("reset");
      setMessage("OTP valid, silakan masukkan password baru");
    } catch (err: unknown) {
      setError(err instanceof Error && err.message ? err.message : "OTP tidak valid");
    } finally {
      setLoading(false);
    }
  };

  /* ===================== STEP 3: RESET PASSWORD ===================== */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/lupa-password/reset`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            otp,
            newPassword,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setStep("success");
    } catch (err: unknown) {
      setError(err instanceof Error && err.message ? err.message : "Gagal reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const otpArray = Array.from({ length: otpLength }, (_, i) => otp[i] || "");
    otpArray[index] = digit;
    setOtp(otpArray.join(""));

    if (digit && index < otpLength - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, otpLength);
    if (!pasteData) return;
    setOtp(pasteData);
    const focusIndex = Math.min(pasteData.length, otpLength - 1);
    inputsRef.current[focusIndex]?.focus();
  };

  return (
    <div
      className={`${plusJakarta.className} min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden flex flex-col lg:grid lg:grid-cols-12 bg-[#F8FAFC]`}
    >
      {/* ================= BANNER ATAS (MOBILE & TABLET) ================= */}
      <div className="lg:hidden relative w-full h-56 sm:h-64 overflow-hidden shrink-0">
        <Image
          src="/images/assets-new/gedung-bpom2.png"
          alt="Gedung BBPOM di Palembang"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#0B1B3D]/90 via-[#0B1B3D]/40 to-black/20" />

        {/* Tombol Kembali (Mobile) */}
        <Link
          href="/auth/login"
          className="
            absolute top-4 left-4 z-20
            inline-flex items-center gap-2.5
            px-3.5 py-2
            rounded-full
            bg-white/90 backdrop-blur-md
            text-[#0B1B3D] font-bold text-xs
            shadow-md
            hover:bg-white
            transition
          "
        >
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#EBF5FF] text-[#0088FF]">
            <HiArrowLeft className="text-sm" />
          </span>
          <span>Kembali</span>
        </Link>

        {/* Caption Gedung (Mobile) */}
        <div className="absolute bottom-5 left-5 right-5 z-10 text-white">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0088FF]/80 backdrop-blur-sm text-[10px] font-bold tracking-wider uppercase mb-1.5">
            <HiOutlineShieldCheck className="text-sm" />
            <span>BBPOM di Palembang</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold leading-tight">
            Portal Magang Akademik SI TANJAK
          </h2>
        </div>
      </div>

      {/* ================= KOLOM KIRI: FORM LUPA PASSWORD ================= */}
      <div className="relative lg:col-span-6 xl:col-span-5 lg:h-full flex flex-col justify-center px-5 sm:px-8 lg:px-8 xl:px-12 pt-6 pb-10 sm:py-8 lg:py-4 overflow-hidden">
        {/* Ornamen Latar Biru Muda Halus */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#D6EEFF]/60 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-[#EBF5FF]/80 blur-3xl"
        />

        <div className="relative z-10 w-full max-w-[440px] mx-auto my-auto flex flex-col">
          {/* Tombol Kembali (Desktop) — Sejajar garis kiri dengan Card */}
          <div className="hidden lg:flex items-center justify-start mb-3 shrink-0">
            <Link
              href="/auth/login"
              className="
                inline-flex items-center gap-2.5
                px-3.5 py-1.5
                rounded-full
                bg-white
                border border-slate-200/90
                text-[#0B1B3D] font-bold text-xs
                shadow-xs
                hover:border-[#0088FF]
                hover:text-[#0088FF]
                hover:shadow-md
                transition-all duration-200
                group
              "
            >
              <span
                className="
                  flex items-center justify-center
                  w-6 h-6
                  rounded-full
                  bg-[#EBF5FF]
                  text-[#0088FF]
                  group-hover:bg-[#0088FF]
                  group-hover:text-white
                  transition-colors
                "
              >
                <HiArrowLeft className="text-sm" />
              </span>
              <span>Kembali ke Login</span>
            </Link>
          </div>

          {/* Card Form Utama */}
          <div className="w-full bg-white rounded-3xl shadow-[0_18px_50px_rgba(11,27,61,0.08)] border border-slate-100 p-6 sm:p-8 lg:px-7 lg:py-6 xl:p-8">
            {/* Brand Identity & Card Heading */}
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-12 h-12 xl:w-14 xl:h-14 rounded-2xl bg-[#F0F7FF] border border-[#D6EEFF] flex items-center justify-center p-2 shadow-xs mb-2">
                <Image
                  src="/images/icons/sitanjak.png"
                  alt="Logo SI TANJAK"
                  width={44}
                  height={44}
                  className="object-contain"
                />
              </div>
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#0088FF] uppercase">
                SI TANJAK • BBPOM PALEMBANG
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B1B3D] mt-0.5 tracking-[-0.02em]">
                Lupa Password
              </h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                Pulihkan akses akun Anda
              </p>
            </div>

            {message && (
              <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs font-medium text-emerald-700 text-center">
                {message}
              </div>
            )}
            {error && (
              <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-medium text-rose-600 text-center">
                {error}
              </div>
            )}

            {/* STEP 1 */}
            {step === "email" && (
              <form onSubmit={handleSendOtp} noValidate className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#0B1B3D] uppercase tracking-wider mb-1">
                    Masukkan Email Terdaftar
                  </label>
                  <div className="relative group">
                    <HiMail
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] group-focus-within:text-[#0088FF] transition-colors"
                      size={18}
                    />
                    <input
                      type="email"
                      placeholder="Masukkan email terdaftar"
                      className="
                        w-full pl-10 pr-4 py-2.5
                        rounded-xl
                        bg-[#F8FAFC]
                        border border-slate-200
                        text-[#0B1B3D] text-sm font-medium
                        placeholder:text-[#94A3B8] placeholder:font-normal
                        focus:bg-white
                        focus:outline-none
                        focus:ring-4 focus:ring-[#0088FF]/15
                        focus:border-[#0088FF]
                        transition-all
                      "
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="
                    w-full flex items-center justify-center gap-2
                    py-2.5 xl:py-3 rounded-xl
                    font-bold text-sm text-white
                    bg-[#0088FF]
                    shadow-lg shadow-[#0088FF]/25
                    hover:bg-[#0073E6] hover:shadow-xl hover:shadow-[#0088FF]/30
                    active:scale-[0.99]
                    transition-all duration-200
                    disabled:opacity-60
                  "
                >
                  {loading ? "Mengirim..." : "Kirim Kode OTP"}
                </button>
              </form>
            )}

            {/* STEP 2 */}
            {step === "otp" && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="bg-[#F0F7FF] border border-[#D6EEFF] rounded-xl p-2.5 text-center">
                  <p className="text-[11px] text-[#64748B]">
                    Kode OTP dikirim ke:
                  </p>
                  <p className="font-bold text-xs sm:text-sm text-[#0B1B3D]">
                    {email}
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#0B1B3D] uppercase tracking-wider text-center mb-2">
                    Masukkan Kode OTP (6 digit)
                  </label>
                  <div
                    className="flex justify-center gap-2"
                    onPaste={handleOtpPaste}
                  >
                    {Array.from({ length: otpLength }).map((_, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          inputsRef.current[i] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={otp[i] || ""}
                        onChange={(e) => handleOtpChange(e.target.value, i)}
                        onKeyDown={(e) => handleOtpKeyDown(e, i)}
                        disabled={loading}
                        className="
                          w-10 sm:w-11 h-12
                          text-[#0B1B3D]
                          text-center text-lg font-extrabold
                          rounded-xl
                          border border-slate-200
                          bg-[#F8FAFC]
                          focus:bg-white
                          focus:outline-none
                          focus:ring-4 focus:ring-[#0088FF]/15
                          focus:border-[#0088FF]
                          transition-all
                          shadow-xs
                        "
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="
                    w-full flex items-center justify-center gap-2
                    py-2.5 xl:py-3 rounded-xl
                    font-bold text-sm text-white
                    bg-[#0088FF]
                    shadow-lg shadow-[#0088FF]/25
                    hover:bg-[#0073E6] hover:shadow-xl hover:shadow-[#0088FF]/30
                    active:scale-[0.99]
                    transition-all duration-200
                    disabled:opacity-60
                  "
                >
                  {loading ? "Memverifikasi..." : "Verifikasi OTP"}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    disabled={loading || countdown > 0}
                    onClick={handleSendOtp}
                    className={`
                      text-xs font-bold
                      ${
                        countdown > 0
                          ? "text-[#94A3B8] cursor-not-allowed"
                          : "text-[#0088FF] hover:text-[#0073E6] hover:underline"
                      }
                    `}
                  >
                    {countdown > 0
                      ? `Kirim ulang OTP dalam ${countdown}s`
                      : "Kirim OTP Kembali"}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3 */}
            {step === "reset" && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#0B1B3D] uppercase tracking-wider mb-1">
                    Password Baru
                  </label>
                  <div className="relative group">
                    <HiLockClosed
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] group-focus-within:text-[#0088FF] transition-colors"
                      size={18}
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan password baru"
                      className="
                        w-full pl-10 pr-10 py-2.5
                        rounded-xl
                        bg-[#F8FAFC]
                        border border-slate-200
                        text-[#0B1B3D] text-sm font-medium
                        placeholder:text-[#94A3B8] placeholder:font-normal
                        focus:bg-white
                        focus:outline-none
                        focus:ring-4 focus:ring-[#0088FF]/15
                        focus:border-[#0088FF]
                        transition-all
                      "
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0088FF] transition-colors p-1"
                      aria-label="Tampilkan atau sembunyikan password"
                    >
                      {showPassword ? (
                        <HiEyeOff size={18} />
                      ) : (
                        <HiEye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="
                    w-full flex items-center justify-center gap-2
                    py-2.5 xl:py-3 rounded-xl
                    font-bold text-sm text-white
                    bg-[#0088FF]
                    shadow-lg shadow-[#0088FF]/25
                    hover:bg-[#0073E6] hover:shadow-xl hover:shadow-[#0088FF]/30
                    active:scale-[0.99]
                    transition-all duration-200
                    disabled:opacity-60
                  "
                >
                  {loading ? "Menyimpan..." : "Simpan Password Baru"}
                </button>
              </form>
            )}

            {/* SUCCESS */}
            {step === "success" && (
              <div className="text-center py-2">
                <div className="relative mx-auto mb-5 w-20 h-20">
                  <div
                    className="
                      w-20 h-20
                      rounded-full
                      bg-linear-to-br from-[#0088FF] to-emerald-500
                      text-white text-3xl
                      flex items-center justify-center
                      shadow-lg shadow-[#0088FF]/25
                    "
                  >
                    ✓
                  </div>
                </div>

                <p className="mb-5 text-sm font-bold text-[#0B1B3D]">
                  Password berhasil diubah
                </p>

                <Link href="/auth/login" className="block w-full">
                  <button
                    type="button"
                    className="
                      w-full flex items-center justify-center gap-2
                      py-2.5 xl:py-3 rounded-xl
                      font-bold text-sm text-white
                      bg-[#0088FF]
                      shadow-lg shadow-[#0088FF]/25
                      hover:bg-[#0073E6] hover:shadow-xl hover:shadow-[#0088FF]/30
                      active:scale-[0.99]
                      transition-all duration-200
                    "
                  >
                    Login Sekarang
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Footer Kecil */}
          <p className="mt-3 text-center text-[11px] text-[#64748B] shrink-0">
            © {new Date().getFullYear()} BBPOM di Palembang • SI TANJAK Role
            Based Access
          </p>
        </div>
      </div>

      {/* ================= KOLOM KANAN: SHOWCASE GEDUNG BPOM (DESKTOP) ================= */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 lg:h-full p-3 xl:p-5">
        <div className="relative w-full h-full rounded-[28px] overflow-hidden shadow-[0_20px_60px_rgba(11,27,61,0.16)] flex flex-col justify-between p-8 xl:p-10">
          {/* Gambar Gedung BBPOM 2 */}
          <Image
            src="/images/assets-new/gedung-bpom2.png"
            alt="Gedung Balai Besar POM di Palembang"
            fill
            className="object-cover object-center scale-[1.01] hover:scale-105 transition-transform duration-1000"
            priority
            sizes="(max-width: 1280px) 50vw, 58vw"
          />

          {/* Overlay Gradasi Navy & Biru khas Landing Page */}
          <div className="absolute inset-0 bg-linear-to-t from-[#0B1B3D]/95 via-[#0B1B3D]/35 to-[#0B1B3D]/15" />
          <div className="absolute inset-0 bg-linear-to-tr from-[#0088FF]/20 via-transparent to-transparent" />

          {/* Badge Atas & Logo BPOM */}
          <div className="relative z-10 flex items-center gap-3.5">
            <div className="flex items-center justify-center w-16 h-16 xl:w-20 xl:h-20 rounded-2xl bg-white/95 backdrop-blur-md border border-white/40 shadow-lg p-2 shrink-0">
              <Image
                src="/images/assets-new/logo-bpom.png"
                alt="Logo Badan POM"
                width={72}
                height={72}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-bold tracking-[0.14em] uppercase">
              <span className="w-2 h-2 rounded-full bg-[#0088FF] animate-pulse" />
              <span>Unit Pelaksana Teknis Badan POM RI</span>
            </div>
          </div>

          {/* Kartu Informasi Bawah */}
          <div className="relative z-10 max-w-2xl">
            <div className="rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-6 xl:p-7 text-white shadow-2xl">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-8 h-[2px] bg-[#38BDF8] rounded-full" />
                <span className="text-[11px] font-bold tracking-[0.18em] text-[#BAE6FD] uppercase">
                  BALAI BESAR POM DI PALEMBANG
                </span>
              </div>

              <h2 className="text-xl xl:text-2xl font-extrabold leading-snug tracking-[-0.02em]">
                Sistem Informasi Tahapan dan Jangkauan Magang Akademik{" "}
                <span className="text-[#38BDF8]">(SI TANJAK)</span>
              </h2>

              <p className="mt-2 text-xs xl:text-sm text-slate-200 leading-relaxed">
                Wadah pembelajaran nyata dan terpadu bagi mahasiswa serta siswa
                magang akademik dalam mengawal keamanan, mutu, dan khasiat Obat
                serta Makanan bersama SDM profesional.
              </p>

              {/* 3 Poin Tagline BBPOM */}
              <div className="mt-4 pt-4 border-t border-white/15 flex flex-wrap items-center gap-2.5">
                {["Aman", "Bermutu", "Berdaya Saing"].map((item) => (
                  <div
                    key={item}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-bold text-white"
                  >
                    <HiOutlineCheckCircle className="text-[#38BDF8] text-sm" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
