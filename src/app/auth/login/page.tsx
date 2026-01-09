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
} from "react-icons/hi";

import TurnstileCaptcha from "@/components/TurnstileCaptcha";
import { loginApi } from "@/app/lib/api";

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

  /* ===================== SUBMIT ===================== */
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

    // SHOW LOADING TOAST
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

      // ===================== CEK STATUS AKUN =====================
      const accountStatus = data.status || data.user?.status || "Aktif";

      if (accountStatus === "Nonaktif") {
        // tutup loading
        setToast({ show: false, type: "loading", message: "" });

        // tampilkan notifikasi
        setToast({
          show: true,
          type: "error",
          message: "Akun Anda Nonaktif, silakan hubungi Admin",
        });

        // reset captcha
        setCaptchaToken("");
        setCaptchaKey((prev) => prev + 1);

        return; // ⛔ STOP LOGIN DI SINI
      }

      // ===================== BARU SIMPAN TOKEN =====================
      document.cookie = `token=${data.token}; path=/`;
      document.cookie = `roles=${JSON.stringify(data.roles)}; path=/`;

      localStorage.setItem("token", data.token);
      localStorage.setItem("roles", JSON.stringify(data.roles));

      setToast({ show: false, type: "loading", message: "" });
      setSuccessPopup(true);

      setTimeout(() => {
        redirectByRole(data.roles || [], router);
      }, 1200);
    } catch (err: any) {
      setToast({ show: false, type: "loading", message: "" });

      setToast({
        show: true,
        type: "error",
        message: err.message || "Email atau password salah",
      });

      setCaptchaToken("");
      setCaptchaKey((prev) => prev + 1);
    }
  };

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
        {/* BACKDROP */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />

        {/* CARD */}
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
          {/* ICON */}
          {isLoading ? (
            <div className="relative mx-auto mb-6 w-24 h-24">
              {/* OUTER ORBIT */}
              <div
                className="
                absolute inset-0
                rounded-full
                border-4 border-transparent
                border-t-blue-500
                border-r-cyan-400
                animate-orbitFast
              "
              />

              {/* INNER ORBIT */}
              <div
                className="
                absolute inset-3
                rounded-full
                border-4 border-transparent
                border-b-emerald-500
                border-l-green-400
                animate-orbitSlow
              "
              />

              {/* CENTER ICON */}
              <div
                className="
                absolute inset-6
                rounded-full
                bg-white
                shadow
                flex items-center justify-center
                text-2xl
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
              bg-gradient-to-br from-red-500 to-pink-500
              text-white
              flex items-center justify-center
              text-3xl
              shadow-lg
            "
            >
              ✕
            </div>
          )}

          {/* TITLE */}
          <h3 className="text-xl font-extrabold text-gray-800">
            {isLoading ? "Memproses Login" : "Login Gagal"}
          </h3>

          {/* MESSAGE */}
          <p className="mt-2 text-sm text-gray-600">{message}</p>

          {/* ACTION */}
          {!isLoading && (
            <button
              onClick={onClose}
              className="
                mt-6 w-full py-3 rounded-xl
                font-semibold text-white
                bg-gradient-to-r from-gray-800 to-gray-900
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

  const Toast = ({
    type,
    message,
  }: {
    type: "loading" | "error";
    message: string;
  }) => {
    const config = {
      loading: {
        bg: "bg-blue-600",
        icon: "⏳",
      },
      error: {
        bg: "bg-red-600",
        icon: "❌",
      },
    };

    const c = config[type];

    return (
      <div className="fixed top-6 right-6 z-50 animate-slideIn">
        <div
          className={`
            ${c.bg}
            text-white
            px-5 py-3
            rounded-xl
            shadow-lg
            flex items-center gap-3
          `}
        >
          <span className="text-lg">{c.icon}</span>
          <span className="text-sm font-medium">{message}</span>
        </div>
      </div>
    );
  };

  const SuccessPopup = () => {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* BACKDROP */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />

        {/* CARD */}
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
          {/* RING + CHECK */}
          <div className="relative mx-auto mb-6 w-24 h-24">
            {/* RING */}
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

            {/* CENTER CHECK */}
            <div
              className="
              absolute inset-4
              rounded-full
              bg-gradient-to-br from-green-500 to-emerald-500
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
      <div className="lg:hidden w-full relative aspect-[16/9] bg-[#ECFDF5]">
        <Image
          src="/images/logins/icon login.png"
          alt="Login Background"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* FORM */}
      <div className="relative flex items-center justify-center bg-[#F6FFFC] px-6 pt-24 pb-12">
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
            hover:border-blue-300
            hover:text-blue-700
            hover:shadow-md
            transition-all duration-200
          "
        >
          <span
            className="
              flex items-center justify-center
              w-8 h-8
              rounded-lg
              bg-blue-50
              text-blue-600
            "
          >
            <HiArrowLeft className="text-lg" />
          </span>

          <span>Kembali</span>
        </Link>

        <div className="w-full max-w-lg bg-white/30 rounded-3xl shadow-2xl p-10">
          <h1 className="text-3xl font-extrabold text-center text-blue-800 mb-2">
            Masuk ke Akun
          </h1>

          <div className="flex justify-center my-4">
            <Image
              src="/images/icons/SIMAGGO.png"
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
                className="absolute left-4 top-3.5 text-blue-600"
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
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                "
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            {/* PASSWORD */}
            <div className="relative">
              <HiLockClosed
                className="absolute left-4 top-3.5 text-blue-600"
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
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                "
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-4 top-3.5 text-gray-500 hover:text-blue-600"
              >
                {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
              </button>
            </div>

            {/* PASSWORD ACTIONS */}
            <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
              <Link
                href="/auth/lupa-password"
                className="
                  font-medium text-blue-600
                  hover:text-blue-700
                  hover:underline
                  transition
                "
              >
                Lupa password?
              </Link>

              <span className="text-gray-300">|</span>

              <Link
                href="/auth/ganti-password"
                className="
                  font-medium text-emerald-600
                  hover:text-emerald-700
                  hover:underline
                  transition
                "
              >
                Ganti password
              </Link>
            </div>

            {/* CAPTCHA */}
            <div className="flex justify-center">
              <TurnstileCaptcha key={captchaKey} onVerify={setCaptchaToken} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="
                w-full flex items-center justify-center gap-2
                py-3 rounded-xl font-semibold text-white
                bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-500
                hover:opacity-90 transition
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

          <p className="mt-6 text-center text-xs text-gray-500">
            © BPOM System • Role Based Access
          </p>
        </div>
      </div>

      {/* IMAGE KANAN */}
      <div className="hidden lg:block relative w-full min-h-screen bg-[#ECFDF5]">
        <Image
          src="/images/logins/icon login.png"
          alt="Login Background"
          fill
          className="object-contain"
          priority
        />
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
