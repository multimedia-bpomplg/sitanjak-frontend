"use client";

import { useState } from "react";
import { HiMail, HiArrowLeft, HiOutlineLogin } from "react-icons/hi";
import { loginWithOtpApi, verifyOtpLoginApi } from "@/app/lib/api";

interface OtpLoginProps {
  onBack: () => void;
  onLoginSuccess: (data: any) => void;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function OtpLogin({ onBack, onLoginSuccess }: OtpLoginProps) {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
  const [verifyBlocked, setVerifyBlocked] = useState(false);
  const [blockCountdown, setBlockCountdown] = useState(0);

  // Kirim OTP ke email
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!emailRegex.test(email)) {
      setError("Format email tidak valid");
      return;
    }

    setLoading(true);
    try {
      const response = await loginWithOtpApi({ email });
      setSuccessMessage(
        response.message || "Kode OTP telah dikirim ke email Anda",
      );
      setStep("otp");

      // Start countdown 60 detik untuk request ulang
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Gagal mengirim OTP");
    } finally {
      setLoading(false);
    }
  };

  // Verifikasi OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (otp.length !== 6) {
      setError("Kode OTP harus 6 digit");
      return;
    }

    if (verifyBlocked) return;

    setLoading(true);
    try {
      const response = await verifyOtpLoginApi({ email, otp });
      onLoginSuccess(response);
    } catch (err: any) {
      // 🔥 DETEKSI 429
      if (err?.status === 429) {
        setError(
          err.message ||
            "Terlalu banyak percobaan. Silakan tunggu sebelum mencoba lagi.",
        );

        setVerifyBlocked(true);

        // Misal blokir 60 detik (atau ambil dari backend kalau ada)
        const blockTime = 60;
        setBlockCountdown(blockTime);

        const timer = setInterval(() => {
          setBlockCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              setVerifyBlocked(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(err.message || "Kode OTP tidak valid");
      }
    } finally {
      setLoading(false);
    }
  };

  // Request ulang OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return;

    setError("");
    setLoading(true);
    try {
      const response = await loginWithOtpApi({ email });
      setSuccessMessage("Kode OTP baru telah dikirim");
      setCountdown(60);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Gagal mengirim ulang OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-[#7F1D1D] mb-6 transition-colors"
      >
        <HiArrowLeft />
        <span>Kembali ke pilihan login</span>
      </button>

      <h2 className="text-2xl font-bold text-[#7F1D1D] mb-4">
        Login dengan Email OTP
      </h2>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {step === "email" ? (
        // FORM EMAIL
        <form onSubmit={handleRequestOtp} className="space-y-5">
          <div className="relative">
            <HiMail
              className="absolute left-4 top-3.5 text-[#B91C1C]"
              size={20}
            />
            <input
              type="email"
              placeholder="Masukkan email Anda"
              className="
                w-full pl-12 pr-4 py-3
                rounded-xl
                bg-white
                border border-gray-300
                text-gray-800
                placeholder:text-gray-400
                focus:outline-none 
                focus:ring-2 focus:ring-[#FACC15] 
                focus:border-[#F59E0B]
              "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="
              w-full flex items-center justify-center gap-2
              py-3 rounded-xl
              font-semibold text-white
              bg-linear-to-r from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
              hover:brightness-110
              transition
              disabled:opacity-60
            "
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Mengirim OTP...
              </>
            ) : (
              <>
                <HiOutlineLogin size={20} />
                Kirim Kode OTP
              </>
            )}
          </button>
        </form>
      ) : (
        // FORM OTP
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Kode OTP telah dikirim ke:
            </label>
            <p className="font-medium text-[#7F1D1D] bg-[#FEF3C7] p-2 rounded-lg text-center">
              {email}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Masukkan Kode OTP (6 digit)
            </label>
            <input
              type="text"
              placeholder="000000"
              maxLength={6}
              className="
                w-full px-4 py-3 text-center text-2xl tracking-widest
                rounded-xl
                bg-white
                border border-gray-300
                text-gray-800
                focus:outline-none 
                focus:ring-2 focus:ring-[#FACC15] 
                focus:border-[#F59E0B]
              "
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="
              w-full flex items-center justify-center gap-2
              py-3 rounded-xl
              font-semibold text-white
              bg-linear-to-r from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
              hover:brightness-110
              transition
              disabled:opacity-60
            "
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifikasi...
              </>
            ) : (
              <>
                <HiOutlineLogin size={20} />
                Verifikasi & Login
              </>
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading || countdown > 0}
              className={`
                text-sm font-medium
                ${
                  countdown > 0
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-[#7F1D1D] hover:underline"
                }
              `}
            >
              {countdown > 0
                ? `Kirim ulang OTP (${countdown}s)`
                : "Kirim ulang OTP"}
            </button>
          </div>
        </form>
      )}

      {/* Informasi */}
      <div className="mt-6 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-800">
          ℹ️ Kode OTP akan dikirim ke email Anda dan berlaku selama 5 menit.
          Jika tidak menerima email, cek folder spam.
        </p>
      </div>
    </div>
  );
}
