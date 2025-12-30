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
  const [captchaKey, setCaptchaKey] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ===================== LOAD REMEMBER EMAIL ===================== */
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("remember_email");
    if (rememberedEmail) {
      setForm((prev) => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

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

      if (rememberMe) {
        localStorage.setItem("remember_email", form.email);
        document.cookie = `token=${data.token}; path=/; max-age=2592000`;
        document.cookie = `roles=${JSON.stringify(data.roles)}; path=/; max-age=2592000`;
      } else {
        localStorage.removeItem("remember_email");
        document.cookie = `token=${data.token}; path=/; max-age=600`;
        document.cookie = `roles=${JSON.stringify(data.roles)}; path=/; max-age=600`;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("roles", JSON.stringify(data.roles));

      redirectByRole(data.roles || [], router);
    } catch (err: any) {
      setError(err.message || "Email atau password salah");
      setCaptchaToken("");
      setCaptchaKey((prev) => prev + 1); // reset captcha
    } finally {
      setLoading(false);
    }
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

        <button
          onClick={() => router.push("/")}
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow text-black hover:bg-blue-50"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>

        <div className="w-full max-w-lg bg-white/30 rounded-3xl shadow-2xl p-10">

          <h1 className="text-3xl font-extrabold text-center text-black mb-2">
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

          <p className="text-center text-black mb-6">
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
              <HiMail className="absolute left-4 top-3.5 text-black" size={20} />
              <input
                type="email"
                placeholder="Email"
                className="
                  w-full pl-12 pr-4 py-3
                  rounded-xl
                  bg-white
                  border border-gray-300
                  text-black
                  placeholder:text-gray-500
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                "
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            {/* PASSWORD */}
            <div className="relative">
              <HiLockClosed className="absolute left-4 top-3.5 text-black" size={20} />
              <input
                type="password"
                placeholder="Password"
                className="
                  w-full pl-12 pr-4 py-3
                  rounded-xl
                  bg-white
                  border border-gray-300
                  text-black
                  placeholder:text-gray-500
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                "
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            {/* REMEMBER ME */}
            <div className="flex items-center gap-2 text-sm text-black">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="accent-blue-600"
              />
              <span>Ingatkan saya</span>
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

          <p className="text-center text-black mt-6">
            Belum melakukan pengajuan?{" "}
            <Link href="/pendaftaran" className="text-blue-700 font-semibold hover:underline">
              Daftar
            </Link>
          </p>

          <p className="mt-6 text-center text-xs text-gray-500">
            © BPOM System • Role Based Access
          </p>
        </div>
      </div>

      {/* IMAGE KANAN */}
      <div className="hidden lg:block relative w-full h-screen bg-[#ECFDF5]">
        <Image
          src="/images/logins/icon login.png"
          alt="Login Background"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}
