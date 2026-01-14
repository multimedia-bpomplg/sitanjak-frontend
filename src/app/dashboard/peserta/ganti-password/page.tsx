"use client";

import { useState } from "react";
import { toast } from "react-toastify";

export default function GantiPasswordPage() {
  const [passwordLama, setPasswordLama] = useState("");
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordLama || !passwordBaru || !konfirmasi) {
      toast.error("Semua field wajib diisi");
      return;
    }

    if (passwordBaru !== konfirmasi) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }

    if (passwordBaru.length < 8) {
      toast.error("Password minimal 8 karakter");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/peserta/ganti-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            passwordLama,
            passwordBaru,
            konfirmasiPassword: konfirmasi,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      toast.success("Password berhasil diganti");

      // reset
      setPasswordLama("");
      setPasswordBaru("");
      setKonfirmasi("");
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
    toast.success("Password berhasil diganti, silakan login ulang");

    localStorage.removeItem("token");

    setTimeout(() => {
      window.location.href = "/auth/login";
    }, 1500);
  };

  return (
    <div className="max-w-lg mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-6">Ganti Password</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl bg-white dark:bg-slate-900 p-6 shadow"
      >
        <div>
          <label className="text-sm font-medium">Password Lama</label>
          <input
            type="password"
            value={passwordLama}
            onChange={(e) => setPasswordLama(e.target.value)}
            className="w-full mt-1 px-4 py-2 rounded-xl border dark:bg-slate-800"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Password Baru</label>
          <input
            type="password"
            value={passwordBaru}
            onChange={(e) => setPasswordBaru(e.target.value)}
            className="w-full mt-1 px-4 py-2 rounded-xl border dark:bg-slate-800"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Konfirmasi Password Baru
          </label>
          <input
            type="password"
            value={konfirmasi}
            onChange={(e) => setKonfirmasi(e.target.value)}
            className="w-full mt-1 px-4 py-2 rounded-xl border dark:bg-slate-800"
          />
        </div>

        <button
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
        >
          {loading ? "Menyimpan..." : "Simpan Password"}
        </button>
      </form>
    </div>
  );
}
