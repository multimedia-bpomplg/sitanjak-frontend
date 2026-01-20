"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HiMail, HiKey, HiLockClosed, HiArrowLeft, HiEye, HiEyeOff, } from "react-icons/hi";

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
  const handleSendOtp = async (e: React.FormEvent) => {
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
    } catch (err: any) {
      setError(err.message || "Gagal mengirim OTP");
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
    } catch (err: any) {
      setError(err.message || "OTP tidak valid");
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
    } catch (err: any) {
      setError(err.message || "Gagal reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2">
      
      {/* ================= LEFT SIDE (FORM) ================= */}
      <div className="relative flex items-center justify-center bg-white px-6">
        {/* BUTTON KEMBALI */}
        <div className="absolute top-6 left-6">
          <Link
            href="/auth/login"
            className="
              group
              inline-flex items-center gap-2
              px-3 py-2
              rounded-full
              bg-gray-100
              text-sm font-medium
              text-gray-700
              hover:bg-[#FEF3C7]
              hover:text-[#7F1D1D]
              transition-all
            "
          >
            <span
              className="
                flex items-center justify-center
                w-8 h-8
                rounded-full
                bg-white
                shadow
                group-hover:bg-[#B91C1C]
                group-hover:text-white
                transition
              "
            >
              <HiArrowLeft className="text-base" />
            </span>
            Kembali
          </Link>
        </div>  

        {/* FORM CONTAINER */}
        <div className="w-full max-w-md">
          {/* HEADER */}
          <div className="text-center mb-8">
            <div
              className="
                mx-auto mb-4
                w-16 h-16
                rounded-2xl
                bg-gradient-to-br from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                text-white
                flex items-center justify-center
                shadow-lg
              "
            >
              <HiKey className="text-2xl" />
            </div>

            <h1 className="text-2xl font-extrabold text-gray-800">
              Lupa Password
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Pulihkan akses akun Anda
            </p>
          </div>

          {message && (
            <p className="text-sm text-green-600 text-center mb-4">{message}</p>
          )}
          {error && (
            <p className="text-sm text-red-600 text-center mb-4">{error}</p>
          )}

          {/* STEP 1 */}
          {step === "email" && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="relative">
                <HiMail className="absolute left-4 top-3.5 text-[#B91C1C]" />
                <input
                  type="email"
                  placeholder="Masukkan email terdaftar"
                  className="
                    w-full pl-12 pr-4 py-3
                    rounded-xl
                    bg-gray-50
                     border border-gray-200
                    text-gray-800
                    placeholder:text-gray-400
                    focus:outline-none focus:ring-2 focus:ring-[#F59E0B]
                  "
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button
                disabled={loading}
                className="
                  w-full py-3 rounded-xl
                  bg-gradient-to-r from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                  text-white font-semibold
                  hover:opacity-90
                  disabled:opacity-60
                  transition
                "
              >
                {loading ? "Mengirim..." : "Kirim Kode OTP"}
              </button>
            </form>
          )}

          {/* STEP 2 */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="flex justify-center gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[i] || ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      const newOtp = otp.split("");
                      newOtp[i] = val;
                      setOtp(newOtp.join(""));

                      // AUTO FOCUS NEXT
                      if (val && e.target.nextSibling instanceof HTMLInputElement) {
                        e.target.nextSibling.focus();
                      }
                    }}
                    className="
                      w-12 h-14
                      text-center text-xl font-bold
                      rounded-xl
                      text-gray-800
                      border border-gray-300
                      bg-gray-50
                      focus:outline-none focus:ring-2 focus:ring-[#F59E0B]
                    "
                  />
                ))}
              </div>

              <button
                disabled={loading}
                className="
                  w-full py-3 rounded-xl
                  bg-gradient-to-r from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                  text-white font-semibold
                  hover:opacity-90
                  disabled:opacity-60
                  transition
                "
              >
                Verifikasi OTP
              </button>

              <button
                type="button"
                disabled={countdown > 0}
                onClick={handleSendOtp}
                className="w-full text-sm text-[#B91C1C] disabled:text-gray-400"
              >
                {countdown > 0
                  ? `Kirim ulang OTP dalam ${countdown}s`
                  : "Kirim OTP Kembali"}
              </button>
            </form>
          )}

          {/* STEP 3 */}
          {step === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="relative">
                <HiLockClosed className="absolute left-4 top-3.5 text-[#B91C1C]" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password baru"
                  className="
                    w-full pl-12 pr-4 py-3
                    rounded-xl
                    bg-gray-50
                    border border-gray-300
                    text-gray-800
                    placeholder:text-gray-400
                    focus:outline-none focus:ring-2 focus:ring-[#F59E0B]
                  "
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-4 top-3.5 text-gray-500 hover:text-[#B91C1C]"
                >
                  {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                </button>
              </div>

              <button
                disabled={loading}
                className="
                  w-full py-3 rounded-xl
                  bg-gradient-to-r from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                  text-white font-semibold
                  hover:opacity-90
                  disabled:opacity-60
                  transition
                "
              >
                Simpan Password Baru
              </button>
            </form>
          )}

          {/* SUCCESS */}
          {step === "success" && (
            <div className="text-center">
              <div className="
                mx-auto mb-4
                w-20 h-20
                rounded-full
                bg-gradient-to-br from-[#F59E0B] to-[#FACC15]
                text-white text-4xl
                flex items-center justify-center
                shadow-lg
              ">
                ✓
              </div>

              <p className="mb-4 text-[#7F1D1D] font-semibold">
                Password berhasil diubah
              </p>

              <Link href="/auth/login" className="block w-full">
                <button
                  type="button"
                  className="
                    w-full
                    py-3.5
                    rounded-xl
                    bg-gradient-to-r from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                    text-white
                    font-semibold
                    shadow-md
                    hover:shadow-lg
                    hover:opacity-95
                    transition-all
                  "
                >
                  Login Sekarang
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ================= RIGHT SIDE (IMAGE) ================= */}
      <div
        className="
          hidden lg:flex
          items-center justify-center
          bg-gradient-to-br from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
          px-12
        "
      >
        <div className="text-center text-white max-w-md">
          <div className="mx-auto mb-6 w-28 h-28 rounded-3xl bg-[#FEF3C7]/30 flex items-center justify-center">
            <HiKey className="text-6xl" />
          </div>

          <h2 className="text-3xl font-bold mb-3">
            Lupa Password?
          </h2>
          <p className="text-white/90 text-base leading-relaxed">
            Jangan khawatir. Kami akan membantu Anda memulihkan akses akun
            dengan aman dan cepat.
          </p>
        </div>
      </div>
    </div>
  );
}
