"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HiMail, HiKey, HiLockClosed, HiArrowLeft } from "react-icons/hi";

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
    <div className="min-h-screen flex items-center justify-center bg-[#F6FFFC] px-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 relative">
        <Link
          href="/auth/login"
          className="absolute top-5 left-5 flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
        >
          <HiArrowLeft /> Kembali
        </Link>

        <h1 className="text-2xl font-extrabold text-center text-blue-800 mb-4">
          Lupa Password
        </h1>

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
              <HiMail className="absolute left-4 top-3.5 text-blue-600" />
              <input
                type="email"
                placeholder="Email"
                className="w-full pl-12 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-60"
            >
              {loading ? "Mengirim..." : "Kirim Kode OTP"}
            </button>
          </form>
        )}

        {/* STEP 2 */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="relative">
              <HiKey className="absolute left-4 top-3.5 text-blue-600" />
              <input
                type="text"
                maxLength={6}
                placeholder="Kode OTP"
                className="w-full pl-12 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <button
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-60"
            >
              Verifikasi OTP
            </button>

            <button
              type="button"
              disabled={countdown > 0}
              onClick={handleSendOtp}
              className="w-full text-sm text-blue-600 disabled:text-gray-400"
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
              <HiLockClosed className="absolute left-4 top-3.5 text-blue-600" />
              <input
                type="password"
                placeholder="Password Baru"
                className="w-full pl-12 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <button
              disabled={loading}
              className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold disabled:opacity-60"
            >
              Simpan Password Baru
            </button>
          </form>
        )}

        {/* SUCCESS */}
        {step === "success" && (
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <p className="mb-4 text-green-600 font-semibold">
              Password berhasil diubah
            </p>
            <Link
              href="/auth/login"
              className="text-blue-600 font-semibold hover:underline"
            >
              Login Sekarang
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
