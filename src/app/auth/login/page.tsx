"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { HiMail, HiLockClosed, HiOutlineLogin } from "react-icons/hi";
import { ArrowLeft } from "lucide-react";

import TurnstileCaptcha from "@/components/TurnstileCaptcha";
import { loginApi } from "@/app/lib/api";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

    if (!captchaToken) {
      setError("Silakan verifikasi CAPTCHA terlebih dahulu");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await loginApi({
        email: form.email,
        password: form.password,
        captchaToken,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("roles", JSON.stringify(data.roles));

      document.cookie = `token=${data.token}; path=/; max-age=600`;
      document.cookie = `roles=${JSON.stringify(data.roles)}; path=/; max-age=600`;

      redirectByRole(data.roles || [], router);
    } catch (err: any) {
      setError(err.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:grid lg:grid-cols-2">

      {/* ===== IMAGE ATAS (MOBILE / TABLET) ===== */}
      <div className="lg:hidden w-full relative aspect-[16/9]">
        <Image
          src="/images/logins/foto login coba.png"
          alt="Login Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0" />
      </div>

      {/* ===== FORM SIDE ===== */}
      <div className="relative flex items-center justify-center bg-gradient-to-br from-[#EAF6FF] via-[#E6FAFA] to-[#ECFDF5] px-6 py-12">

        {/* BACK BUTTON */}
        <button
          onClick={() => router.push("/")}
          className="
            absolute top-6 left-6
            flex items-center gap-2
            px-4 py-2
            rounded-full
            bg-white shadow
            text-gray-700 font-medium
            hover:bg-blue-50 hover:text-blue-700
            transition
          "
        >
          <ArrowLeft size={16} />
          Kembali
        </button>

        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">

          <h1 className="text-3xl font-extrabold text-center text-blue-800 mb-2">
            Masuk ke Akun
          </h1>

          {/* LOGO */}
          <div className="flex justify-center my-4">
            <Image
              src="/images/icons/SIMAGGO.png"
              alt="Logo SIMAGGO"
              width={100}
              height={100}
            />
          </div>

          <p className="text-center text-gray-600 mb-6">
            Silakan login untuk melanjutkan
          </p>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* EMAIL */}
            <div className="relative">
              <HiMail className="absolute left-4 top-3.5 text-blue-600" size={20} />
              <input
                type="email"
                placeholder="Email"
                className="
                  w-full pl-12 pr-4 py-3
                  rounded-xl
                  bg-white
                  border border-gray-300
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                "
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            {/* PASSWORD */}
            <div className="relative">
              <HiLockClosed className="absolute left-4 top-3.5 text-blue-600" size={20} />
              <input
                type="password"
                placeholder="Password"
                className="
                  w-full pl-12 pr-4 py-3
                  rounded-xl
                  bg-white
                  border border-gray-300
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                "
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            {/* CAPTCHA */}
            <div className="flex justify-center">
              <TurnstileCaptcha onVerify={setCaptchaToken} />
            </div>

            {/* LOGIN BUTTON */}
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
              {loading ? "Memproses..." : "Login"}
            </button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            Belum melakukan pengajuan?{" "}
            <Link href="/pendaftaran" className="text-blue-700 font-semibold hover:underline">
              Daftar
            </Link>
          </p>

          <p className="mt-6 text-center text-xs text-gray-400">
            © BPOM System • Role Based Access
          </p>
        </div>
      </div>

      {/* ===== IMAGE RIGHT (DESKTOP) ===== */}
      <div className="hidden lg:block relative w-full h-screen">
        <Image
          src="/images/logins/foto login coba.png"
          alt="Login Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0" />
      </div>
    </div>
  );
}