"use client";

import Link from "next/link";
import { Ban } from "lucide-react";

export default function Page403() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100 dark:from-[#020617] dark:to-[#0F172A] px-4">
      <div className="max-w-md w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 text-center border">
        <div className="mx-auto mb-6 w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-rose-500 text-white">
          <Ban size={36} />
        </div>

        <h1 className="text-5xl font-extrabold mb-2">403</h1>
        <h2 className="text-xl font-semibold mb-2">Access Forbidden</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>

        <Link
          href="/dashboard/admin"
          className="inline-block px-6 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
