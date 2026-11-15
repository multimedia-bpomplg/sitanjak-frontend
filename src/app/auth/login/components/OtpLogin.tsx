"use client";

import { useState, useRef } from "react";
import {
  HiMail,
  HiArrowLeft,
  HiOutlineLogin,
  HiOutlineInformationCircle,
} from "react-icons/hi";
import { loginWithOtpApi, verifyOtpLoginApi } from "@/app/lib/api";
import Image from "next/image";

interface OtpLoginProps {
  onBack: () => void;
  onLoginSuccess: (data: any) => void;
  setToast: any;
  setSuccessPopup: any;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function OtpLogin({
  onBack,
  onLoginSuccess,
  setToast,
  setSuccessPopup,
}: OtpLoginProps) {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verifyBlocked, setVerifyBlocked] = useState(false);
  const [blockCountdown, setBlockCountdown] = useState(0);

  const otpLength = 6;
  const [otpValues, setOtpValues] = useState<string[]>(
    Array(otpLength).fill(""),
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
      await loginWithOtpApi({ email });

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

      setToast({
        show: true,
        type: "loading",
        message: "Kode OTP baru berhasil dikirim",
      });

      setTimeout(() => {
        setToast({ show: false, type: "loading", message: "" });
      }, 900);

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
    <div className="w-full space-y-4 animate-fadeIn">
      {/* Brand Identity */}
      <div className="flex flex-col items-center text-center">
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
          Login Email OTP
        </h1>
        <p className="text-xs text-[#64748B] mt-0.5">
          {step === "email"
            ? "Masukkan email terdaftar untuk menerima kode OTP"
            : "Masukkan 6 digit kode verifikasi yang dikirim ke email Anda"}
        </p>
      </div>

      {step === "email" ? (
        // FORM EMAIL
        <form onSubmit={handleRequestOtp} noValidate className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-[#0B1B3D] uppercase tracking-wider mb-1">
              Alamat Email
            </label>
            <div className="relative group">
              <HiMail
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] group-focus-within:text-[#0088FF] transition-colors"
                size={18}
              />
              <input
                type="text"
                inputMode="email"
                placeholder="nama@email.com"
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
                disabled={loading}
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
              transition-all duration-200
              disabled:opacity-60
            "
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Mengirim OTP...</span>
              </>
            ) : (
              <>
                <HiOutlineLogin size={19} />
                <span>Kirim Kode OTP</span>
              </>
            )}
          </button>
        </form>
      ) : (
        // FORM OTP
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="bg-[#F0F7FF] border border-[#D6EEFF] rounded-xl p-2.5 text-center">
            <p className="text-[11px] text-[#64748B]">Kode OTP dikirim ke:</p>
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
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  onKeyDown={(e) => handleOtpKeyDown(e, index)}
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

          {verifyBlocked && (
            <p className="text-xs text-center font-semibold text-rose-600">
              Silakan tunggu {blockCountdown} detik sebelum mencoba kembali.
            </p>
          )}

          <button
            type="submit"
            disabled={loading || otp.length !== 6 || verifyBlocked}
            className="
              w-full flex items-center justify-center gap-2
              py-2.5 xl:py-3 rounded-xl
              font-bold text-sm text-white
              bg-[#0088FF]
              shadow-lg shadow-[#0088FF]/25
              hover:bg-[#0073E6] hover:shadow-xl hover:shadow-[#0088FF]/30
              transition-all duration-200
              disabled:opacity-60
            "
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verifikasi...</span>
              </>
            ) : (
              <>
                <HiOutlineLogin size={19} />
                <span>Verifikasi & Login</span>
              </>
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading || countdown > 0}
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
                ? `Kirim ulang OTP (${countdown}s)`
                : "Kirim ulang OTP"}
            </button>
          </div>
        </form>
      )}

      {/* Informasi */}
      <div className="p-3 bg-[#F0F7FF] border border-[#D6EEFF] rounded-xl flex items-start gap-2">
        <HiOutlineInformationCircle className="text-[#0088FF] text-base shrink-0 mt-0.5" />
        <p className="text-[11.5px] text-[#475569] leading-relaxed">
          Kode OTP dikirim ke email Anda dan berlaku selama{" "}
          <span className="font-bold text-[#0B1B3D]">5 menit</span>. Jika tidak
          menerima email, silakan periksa folder spam.
        </p>
      </div>

      {/* Tombol Kembali ke Login Password */}
      <button
        type="button"
        onClick={onBack}
        className="
          w-full flex items-center justify-center gap-2
          py-2 rounded-xl
          text-xs font-bold text-[#475569]
          hover:text-[#0B1B3D] hover:bg-slate-100
          transition-colors
        "
      >
        <HiArrowLeft className="text-sm" />
        <span>Kembali ke Login Password</span>
      </button>
    </div>
  );
}
