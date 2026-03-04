"use client";

import { useState, useRef } from "react";
import { HiMail, HiArrowLeft, HiOutlineLogin } from "react-icons/hi";
import { loginWithOtpApi, verifyOtpLoginApi } from "@/app/lib/api";
import Image from "next/image";

interface OtpLoginProps {
  onBack: () => void;
  onLoginSuccess: (data: any) => void;
  setToast: any;
  setSuccessPopup: any;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function OtpLogin({ onBack, onLoginSuccess, setToast, setSuccessPopup, }: OtpLoginProps) {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verifyBlocked, setVerifyBlocked] = useState(false);
  const [blockCountdown, setBlockCountdown] = useState(0);

  const otpLength = 6;
  const [otpValues, setOtpValues] = useState<string[]>(
    Array(otpLength).fill("")
  );

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Kirim OTP ke email
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailRegex.test(email)) {
      setToast({
        show: true,
        type: "error",
        message: "Format email tidak valid",
      });
      return;
    }

    setLoading(true);
    setToast({
      show: true,
      type: "loading",
      message: "Mengirim kode OTP...",
    });

    try {
      const response = await loginWithOtpApi({ email });

      setToast({
        show: true,
        type: "loading",
        message: "Kode OTP berhasil dikirim",
      });

      setTimeout(() => {
        setToast({ show: false, type: "loading", message: "" });
        setStep("otp");
      }, 1000);

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
      setToast({
        show: true,
        type: "error",
        message: err.message || "Gagal mengirim OTP",
      });
    } finally {
      setLoading(false);
    }
  };

  // Verifikasi OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setToast({
        show: true,
        type: "error",
        message: "Kode OTP harus 6 digit",
      });
      return;
    }

    if (verifyBlocked) return;

    setLoading(true);
    setToast({
      show: true,
      type: "loading",
      message: "Memverifikasi OTP...",
    });

    try {
      const response = await verifyOtpLoginApi({ email, otp });

      setToast({ show: false, type: "loading", message: "" });
      setSuccessPopup(true);

      setTimeout(() => {
        onLoginSuccess(response);
      }, 1000);
    } catch (err: any) {
      setToast({ show: false, type: "loading", message: "" });

      if (err?.status === 429) {
        setToast({
          show: true,
          type: "error",
          message:
            err.message ||
            "Terlalu banyak percobaan. Silakan tunggu sebelum mencoba lagi.",
        });

        setVerifyBlocked(true);

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
        setToast({
          show: true,
          type: "error",
          message: err.message || "Kode OTP tidak valid",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Request ulang OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return;

    setLoading(true);
    setToast({
      show: true,
      type: "loading",
      message: "Mengirim ulang OTP...",
    });

    try {
      await loginWithOtpApi({ email });

      setToast({ show: false, type: "loading", message: "" });
      setSuccessPopup(true);

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
      setToast({
        show: true,
        type: "error",
        message: err.message || "Gagal mengirim ulang OTP",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);

    if (value && index < otpLength - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    setOtp(newOtp.join(""));
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").slice(0, otpLength);
    if (!/^\d+$/.test(pasteData)) return;

    const newOtp = pasteData.split("");
    setOtpValues(newOtp);
    setOtp(newOtp.join(""));

    newOtp.forEach((digit, i) => {
      if (inputsRef.current[i]) {
        inputsRef.current[i]!.value = digit;
      }
    });
  };

  return (
    <div className="w-full space-y-6 animate-fadeIn">
      <h1 className="text-3xl font-extrabold text-center text-[#7F1D1D] mb-2">
        Login Email OTP
      </h1>

      <div className="flex justify-center my-4">
        <Image
          src="/images/icons/sitanjak.png"
          alt="Logo"
          width={100}
          height={100}
        />
      </div>

      <p className="text-center text-gray-600 mb-8">
        Masukkan email untuk menerima kode OTP
      </p>
      

      {step === "email" ? (
        // FORM EMAIL
        <form onSubmit={handleRequestOtp} noValidate className="space-y-5">
          <div className="relative">
            <HiMail
              className="absolute left-4 top-3.5 text-[#B91C1C]"
              size={20}
            />
            <input
              type="text"
              inputMode="email"
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
          <div className="bg-[#FFF7ED] border border-[#FACC15]/40 rounded-xl p-3 text-center">
            <p className="text-sm text-gray-600">Kode OTP dikirim ke:</p>
            <p className="font-semibold text-[#7F1D1D]">{email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Masukkan Kode OTP (6 digit)
            </label>
            <div
              className="flex justify-center gap-3"
              onPaste={handleOtpPaste}
            >
              {otpValues.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputsRef.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) =>
                    handleOtpChange(e.target.value, index)
                  }
                  onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  disabled={loading}
                  className="
                    w-12 h-14
                    text-black
                    text-center text-xl font-bold
                    rounded-xl
                    border border-gray-300
                    bg-white
                    focus:outline-none
                    focus:ring-2 focus:ring-[#FACC15]
                    focus:border-[#F59E0B]
                    transition-all
                    shadow-sm
                  "
                />
              ))}
            </div>
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