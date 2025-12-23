"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowLeft } from "lucide-react";
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

      // localStorage (untuk FE logic)
      localStorage.setItem("token", data.token);
      localStorage.setItem("roles", JSON.stringify(data.roles));

      // cookie (untuk Next middleware)
      document.cookie = `token=${data.token}; path=/; max-age=600`;
      document.cookie = `roles=${JSON.stringify(
        data.roles
      )}; path=/; max-age=600`;

      redirectByRole(data.roles || [], router);
    } catch (err: any) {
      setError(err.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  /* ===================== UI (TIDAK DIUBAH) ===================== */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 relative">
        <button
          onClick={() => router.push("/")}
          className="absolute left-5 top-5 flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600"
        >
          <ArrowLeft size={16} /> Kembali
        </button>

        <h1 className="text-3xl font-bold text-center text-blue-700 mb-2">
          Login Sistem
        </h1>
        <p className="text-center text-gray-500 mb-6">Masuk sesuai role Anda</p>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input
              type="email"
              placeholder="Email"
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input
              type="password"
              placeholder="Password"
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-center">
            <TurnstileCaptcha onVerify={setCaptchaToken} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400">
          © BPOM System • Role Based Access
        </div>
      </div>
    </div>
  );
}
