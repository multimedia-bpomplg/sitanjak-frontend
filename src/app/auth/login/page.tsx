"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { plusJakarta, caveat } from '@/lib/font';
import {
  HiMail,
  HiLockClosed,
  HiOutlineLogin,
  HiEye,
  HiEyeOff,
  HiArrowLeft,
  HiMailOpen,
  HiOutlineShieldCheck,
  HiOutlineCheckCircle,
} from "react-icons/hi";

import TurnstileCaptcha from "@/components/TurnstileCaptcha";
import { loginApi } from "@/app/lib/api";
import {
  clearAuthSession,
  isJwtExpired,
  persistAuthCookies,
} from "@/lib/authSession";
import OtpLogin from "./components/OtpLogin";



const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ===================== HELPER ===================== */
const redirectByRole = (roles: string[], router: any) => {
  if (roles.includes("superadmin")) return router.push("/dashboard/superadmin");
  if (roles.includes("admin")) return router.push("/dashboard/admin");
  if (roles.includes("mentor")) return router.push("/dashboard/mentor");
  return router.push("/dashboard/peserta");
};

/* ===================== OVERLAY & POPUP COMPONENTS ===================== */
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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[#0B1B3D]/45 backdrop-blur-md" />
      <div
        className="
          relative w-full max-w-sm
          rounded-3xl
          bg-white
          border border-slate-100
          shadow-[0_24px_60px_rgba(11,27,61,0.25)]
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
                border-t-[#0088FF]
                border-l-[#0B1B3D]
                animate-orbitFast
              "
            />
            <div
              className="
                absolute inset-3
                rounded-full
                border-4 border-transparent
                border-b-[#38BDF8]
                border-r-[#0088FF]
                animate-orbitSlow
              "
            />
            <div
              className="
                absolute inset-6
                rounded-full
                bg-[#EBF5FF]
                shadow-inner
                flex items-center justify-center
                text-2xl
                text-[#0088FF]
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
              bg-linear-to-br from-rose-500 to-red-600
              text-white
              flex items-center justify-center
              text-3xl
              shadow-lg shadow-red-500/25
            "
          >
            ✕
          </div>
        )}

        <h3 className="text-xl font-extrabold text-[#0B1B3D]">
          {isLoading ? "Memproses Login" : "Login Gagal"}
        </h3>

        <p className="mt-2 text-sm text-[#475569] leading-relaxed">{message}</p>

        {!isLoading && (
          <button
            onClick={onClose}
            className="
              mt-6 w-full py-3 rounded-xl
              font-bold text-white text-sm
              bg-[#0B1B3D]
              hover:bg-[#162d5c]
              transition-all duration-200
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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[#0B1B3D]/45 backdrop-blur-md" />
      <div
        className="
          relative
          w-full max-w-sm
          rounded-3xl
          bg-white
          border border-slate-100
          px-8 py-10
          shadow-[0_25px_70px_rgba(11,27,61,0.28)]
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
              border-t-[#0088FF]
              border-r-emerald-400
              animate-orbitSlow
            "
          />
          <div
            className="
              absolute inset-4
              rounded-full
              bg-linear-to-br from-[#0088FF] to-emerald-500
              text-white
              flex items-center justify-center
              text-4xl
              shadow-lg shadow-[#0088FF]/25
            "
          >
            ✓
          </div>
        </div>

        <h3 className="text-xl font-extrabold text-[#0B1B3D]">
          Login Berhasil
        </h3>

        <p className="mt-2 text-sm text-[#64748B]">
          Mengarahkan ke dashboard Anda…
        </p>
      </div>
    </div>
  );
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
    let roles: string[] = [];
    try {
      roles = JSON.parse(localStorage.getItem("roles") || "[]");
    } catch {
      roles = [];
    }

    if (token && !isJwtExpired(token) && roles.length) {
      persistAuthCookies(token, roles);
      redirectByRole(roles, router);
    } else if (token) {
      clearAuthSession();
    }
  }, [router]);

  /* ===================== HANDLE LOGIN SUCCESS ===================== */
  const handleLoginSuccess = (data: { token: string; roles?: string[] }) => {
    const roles = Array.isArray(data.roles) ? data.roles : [];
    persistAuthCookies(data.token, roles);

    localStorage.setItem("token", data.token);
    localStorage.setItem("roles", JSON.stringify(roles));

    setToast({ show: false, type: "loading", message: "" });
    setSuccessPopup(true);

    setTimeout(() => {
      redirectByRole(roles, router);
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
          href="/"
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

      {/* ================= KOLOM KIRI: FORM LOGIN ================= */}
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
              href="/"
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
              <span>Kembali ke Beranda</span>
            </Link>
          </div>

          {/* Card Form Utama */}
          <div className="w-full bg-white rounded-3xl shadow-[0_18px_50px_rgba(11,27,61,0.08)] border border-slate-100 p-6 sm:p-8 lg:px-7 lg:py-5 xl:p-7">
            {showOtpLogin ? (
              <OtpLogin
                onBack={() => setShowOtpLogin(false)}
                onLoginSuccess={handleLoginSuccess}
                setToast={setToast}
                setSuccessPopup={setSuccessPopup}
              />
            ) : (
              <>
                {/* Brand Identity */}
                <div className="flex flex-col items-center text-center mb-4 xl:mb-5">
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
                    Masuk ke Akun Anda
                  </h1>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Silakan masukkan kredensial Anda untuk melanjutkan
                  </p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-3">
                  {/* EMAIL */}
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
                        type="email"
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
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  {/* PASSWORD */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-[#0B1B3D] uppercase tracking-wider">
                        Password
                      </label>
                      <Link
                        href="/auth/lupa-password"
                        className="text-xs font-bold text-[#0088FF] hover:text-[#0073E6] hover:underline transition"
                      >
                        Lupa password?
                      </Link>
                    </div>
                    <div className="relative group">
                      <HiLockClosed
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] group-focus-within:text-[#0088FF] transition-colors"
                        size={18}
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Masukkan password"
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
                        value={form.password}
                        onChange={(e) =>
                          setForm({ ...form, password: e.target.value })
                        }
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

                  {/* CAPTCHA */}
                  <div className="flex justify-center lg:scale-[0.92] xl:scale-95 origin-center -my-1">
                    <TurnstileCaptcha
                      key={captchaKey}
                      onVerify={setCaptchaToken}
                    />
                  </div>

                  {/* TOMBOL LOGIN UTAMA */}
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
                    <HiOutlineLogin size={19} />
                    <span>Masuk Sekarang</span>
                  </button>
                </form>

                {/* DIVIDER ATAU */}
                <div className="relative my-3.5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-white text-[#64748B] font-medium">
                      Atau masuk dengan
                    </span>
                  </div>
                </div>

                {/* TOMBOL LOGIN DENGAN EMAIL OTP */}
                <button
                  type="button"
                  onClick={() => setShowOtpLogin(true)}
                  className="
                    w-full flex items-center justify-center gap-2
                    py-2.5 rounded-xl
                    font-bold text-xs sm:text-sm text-[#0B1B3D]
                    bg-[#F8FAFC]
                    border-[1.5px] border-[#0088FF]/40
                    hover:bg-[#EBF5FF] hover:border-[#0088FF] hover:text-[#0088FF]
                    transition-all duration-200
                    group
                  "
                >
                  <HiMailOpen
                    size={18}
                    className="text-[#0088FF] transition-transform group-hover:scale-110"
                  />
                  <span>Login dengan Email OTP</span>
                </button>

                {/* LINK PENDAFTARAN */}
                <p className="text-center text-xs sm:text-sm text-[#475569] mt-4">
                  Belum melakukan pengajuan magang?{" "}
                  <Link
                    href="/pendaftaran"
                    className="text-[#0088FF] font-bold hover:text-[#0073E6] hover:underline transition"
                  >
                    Daftar Sekarang
                  </Link>
                </p>
              </>
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
