"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  HiMail,
  HiLockClosed,
  HiOutlineLogin,
  HiEye,
  HiEyeOff,
  HiArrowLeft,
  HiMailOpen,
} from "react-icons/hi";

import TurnstileCaptcha from "@/components/TurnstileCaptcha";
import { loginApi } from "@/app/lib/api";
import OtpLogin from "./components/OtpLogin";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ===================== HELPER ===================== */
const redirectByRole = (roles: string[], router: any) => {
  if (roles.includes("superadmin")) return router.push("/dashboard/superadmin");
  if (roles.includes("admin")) return router.push("/dashboard/admin");
  if (roles.includes("mentor")) return router.push("/dashboard/mentor");
  return router.push("/dashboard/peserta");
};

export default function LoginPage() {
  const router = useRouter();

  /* ===================== STATE ===================== */
  const [form, setForm] = useState({ email: "", password: "" });
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showOtpLogin, setShowOtpLogin] = useState(false);

  const [toast, setToast] = useState<{
    show: boolean;
    type: "loading" | "error";
    message: string;
  }>({
    show: false,
    type: "loading",
    message: "",
  });

  const [successPopup, setSuccessPopup] = useState(false);

  /* ===================== AUTO REDIRECT ===================== */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const roles = JSON.parse(localStorage.getItem("roles") || "[]");

    if (token && roles.length) {
      redirectByRole(roles, router);
    }
  }, [router]);

  /* ===================== HANDLE LOGIN SUCCESS ===================== */
  const handleLoginSuccess = (data: any) => {
    document.cookie = `token=${data.token}; path=/`;
    document.cookie = `roles=${JSON.stringify(data.roles)}; path=/`;

    localStorage.setItem("token", data.token);
    localStorage.setItem("roles", JSON.stringify(data.roles));

    setToast({ show: false, type: "loading", message: "" });
    setSuccessPopup(true);

    setTimeout(() => {
      redirectByRole(data.roles || [], router);
    }, 1200);
  };

  /* ===================== SUBMIT LOGIN PASSWORD ===================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailRegex.test(form.email)) {
      setToast({
        show: true,
        type: "error",
        message: "Format email tidak valid. Contoh: nama@email.com",
      });
      return;
    }

    if (!captchaToken) {
      setToast({
        show: true,
        type: "error",
        message: "Silakan verifikasi CAPTCHA terlebih dahulu",
      });
      return;
    }

    setLoading(true);
    setToast({
      show: true,
      type: "loading",
      message: "Harap tunggu sebentar ya...",
    });

    try {
      const data = await loginApi({
        email: form.email,
        password: form.password,
        captchaToken,
      });

      const accountStatus = data.status || data.user?.status || "Aktif";

      if (accountStatus === "Nonaktif") {
        setToast({ show: false, type: "loading", message: "" });
        setToast({
          show: true,
          type: "error",
          message: "Akun Anda Nonaktif, silakan hubungi Admin",
        });
        setCaptchaToken("");
        setCaptchaKey((prev) => prev + 1);
        setLoading(false);
        return;
      }

      handleLoginSuccess(data);
    } catch (err: any) {
      setToast({ show: false, type: "loading", message: "" });
      setToast({
        show: true,
        type: "error",
        message: err.message || "Email atau password salah",
      });
      setCaptchaToken("");
      setCaptchaKey((prev) => prev + 1);
      setLoading(false);
    }
  };

  /* ===================== COMPONENTS ===================== */
  const AuthOverlay = ({
    type,
    message,
    onClose,
  }: {
    type: "loading" | "error";
    message: string;
    onClose?: () => void;
  }) => {
    const isLoading = type === "loading";

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
        <div
          className="
            relative w-full max-w-sm
            rounded-3xl
            bg-white/90 backdrop-blur-xl
            shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]
            px-8 py-10
            text-center
            animate-scaleIn
          "
        >
          {isLoading ? (
            <div className="relative mx-auto mb-6 w-24 h-24">
              <div
                className="
                absolute inset-0
                rounded-full
                border-4 border-transparent
                border-t-[#7F1D1D]   
                border-l-[#B91C1C]  
                animate-orbitFast
              "
              />
              <div
                className="
                absolute inset-3
                rounded-full
                border-4 border-transparent
                border-b-[#F59E0B]  
                border-r-[#15803D]   
                animate-orbitSlow
              "
              />
              <div
                className="
                absolute inset-6
                rounded-full
                bg-linear-to-br from-[#FEF3C7] to-[#FFF7ED]
                shadow
                flex items-center justify-center
                text-2xl
                text-[#7F1D1D]
                font-bold
              "
              >
                ⏳
              </div>
            </div>
          ) : (
            <div
              className="
                mx-auto mb-6
                w-20 h-20
                rounded-full
                bg-linear-to-br from-[#B91C1C] to-[#7F1D1D]
                text-white
                flex items-center justify-center
                text-3xl
                shadow-lg
              "
            >
              ✕
            </div>
          )}

          <h3 className="text-xl font-extrabold text-gray-800">
            {isLoading ? "Memproses Login" : "Login Gagal"}
          </h3>

          <p className="mt-2 text-sm text-gray-600">{message}</p>

          {!isLoading && (
            <button
              onClick={onClose}
              className="
                mt-6 w-full py-3 rounded-xl
                font-semibold text-white
                bg-linear-to-r from-gray-800 to-gray-900
                hover:scale-[1.02] transition
              "
            >
              Tutup
            </button>
          )}
        </div>
      </div>
    );
  };

  const SuccessPopup = () => {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
        <div
          className="
            relative
            w-full max-w-sm
            rounded-3xl
            bg-white/95 backdrop-blur-xl
            px-8 py-10
            shadow-[0_25px_70px_-20px_rgba(0,0,0,0.35)]
            text-center
            animate-scaleIn
          "
        >
          <div className="relative mx-auto mb-6 w-24 h-24">
            <div
              className="
              absolute inset-0
              rounded-full
              border-4 border-transparent
              border-t-green-500
              border-r-emerald-400
              animate-orbitSlow
            "
            />
            <div
              className="
              absolute inset-4
              rounded-full
              bg-linear-to-br from-green-500 to-emerald-500
              text-white
              flex items-center justify-center
              text-4xl
              shadow-lg
            "
            >
              ✓
            </div>
          </div>

          <h3 className="text-xl font-extrabold text-gray-800">
            Login Berhasil
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Mengarahkan ke dashboard Anda…
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col lg:grid lg:grid-cols-2">
      {/* IMAGE ATAS */}
      <div className="lg:hidden w-full relative aspect-video bg-linear-to-br from-[#FFFBF5] via-[#FFF7ED] to-[#FEF3C7] flex items-center justify-center">
        <Image
          src="/images/logins/sitanjak_login1.png"
          alt="Login Background"
          className="object-contain"
          priority
          width={350}
          height={350}
        />
      </div>

      {/* FORM */}
      <div className="relative flex items-center justify-center bg-linear-to-br from-[#FFFBF5] via-[#FFF7ED] to-[#FFFFFF] px-6 pt-24 pb-12">
        {/* BUTTON KEMBALI */}
        <Link
          href="/"
          className="
            absolute top-6 left-6
            inline-flex items-center gap-3
            px-4 py-2
            rounded-xl
            bg-white/80 backdrop-blur
            border border-gray-200
            text-gray-700 font-medium text-sm
            shadow-sm
            hover:bg-white
            hover:border-[#F59E0B]
            hover:text-[#7F1D1D]
            hover:shadow-md
            transition-all duration-200
          "
        >
          <span
            className="
              flex items-center justify-center
              w-8 h-8
              rounded-lg
              bg-[#FEF3C7] 
              text-[#7F1D1D]
            "
          >
            <HiArrowLeft className="text-lg" />
          </span>
          <span>Kembali</span>
        </Link>

        <div className="w-full max-w-lg bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-10">
          {showOtpLogin ? (
            <OtpLogin
              onBack={() => setShowOtpLogin(false)}
              onLoginSuccess={handleLoginSuccess}
              setToast={setToast}
              setSuccessPopup={setSuccessPopup}
            />
          ) : (
            <>
              <h1 className="text-3xl font-extrabold text-center text-[#7F1D1D] mb-2">
                Masuk ke Akun
              </h1>

              <div className="flex justify-center my-4">
                <Image
                  src="/images/icons/sitanjak.png"
                  alt="Logo"
                  width={100}
                  height={100}
                />
              </div>

              <p className="text-center text-gray-600 mb-6">
                Silakan login untuk melanjutkan
              </p>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {/* EMAIL */}
                <div className="relative">
                  <HiMail
                    className="absolute left-4 top-3.5 text-[#B91C1C]"
                    size={20}
                  />
                  <input
                    type="email"
                    placeholder="Email"
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
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    required
                  />
                </div>

                {/* PASSWORD */}
                <div className="relative">
                  <HiLockClosed
                    className="absolute left-4 top-3.5 text-[#B91C1C]"
                    size={20}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="
                      w-full pl-12 pr-12 py-3
                      rounded-xl
                      bg-white
                      border border-gray-300
                      text-gray-800
                      placeholder:text-gray-400
                      focus:outline-none 
                      focus:ring-2 focus:ring-[#FACC15] 
                      focus:border-[#F59E0B]
                    "
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-4 top-3.5 text-gray-500 hover:text-blue-600"
                  >
                    {showPassword ? (
                      <HiEyeOff size={20} />
                    ) : (
                      <HiEye size={20} />
                    )}
                  </button>
                </div>

                {/* PASSWORD ACTIONS */}
                <div className="flex justify-end text-sm text-gray-500">
                  <Link
                    href="/auth/lupa-password"
                    className="
                      font-medium
                      text-[#7F1D1D]
                      hover:text-[#B91C1C]
                      hover:underline
                    "
                  >
                    Lupa password?
                  </Link>
                </div>

                {/* CAPTCHA */}
                <div className="flex justify-center">
                  <TurnstileCaptcha
                    key={captchaKey}
                    onVerify={setCaptchaToken}
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
                  <HiOutlineLogin size={20} />
                  Login
                </button>
              </form>

              <p className="text-center text-black mt-6">
                Belum melakukan pengajuan?{" "}
                <Link
                  href="/pendaftaran"
                  className="text-blue-700 font-semibold hover:underline"
                >
                  Daftar
                </Link>
              </p>

              {/* TOMBOL LOGIN DENGAN EMAIL OTP */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Atau</span>
                </div>
              </div>

              <button
                onClick={() => setShowOtpLogin(true)}
                className="
                  w-full flex items-center justify-center gap-2
                  py-3 rounded-xl
                  font-medium text-[#7F1D1D]
                  bg-white
                  border-2 border-[#7F1D1D]
                  hover:bg-[#7F1D1D] hover:text-white
                  transition-all duration-300
                  group
                "
              >
                <HiMailOpen
                  size={20}
                  className="group-hover:text-white transition-colors"
                />
                Login dengan Email OTP
              </button>

              <p className="mt-6 text-center text-xs text-gray-500">
                © BPOM System • Role Based Access
              </p>
            </>
          )}
        </div>
      </div>

      {/* IMAGE KANAN */}
      <div
        className="
        hidden lg:block relative w-full min-h-screen 
        bg-linear-to-br from-[#FFFBF5] via-[#FFF7ED] to-[#FEF3C7]
      "
      >
        <Image
          src="/images/logins/sitanjak_login1.png"
          alt="Login Background"
          fill
          className="object-contain"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-tr from-[#7F1D1D]/10 via-transparent to-[#FACC15]/15" />
      </div>

      {toast.show && (
        <AuthOverlay
          type={toast.type}
          message={toast.message}
          onClose={() => setToast({ show: false, type: "error", message: "" })}
        />
      )}

      {successPopup && <SuccessPopup />}
    </div>
  );
}
