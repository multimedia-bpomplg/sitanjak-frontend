"use client";

import Link from "next/link";
import { FileX } from "lucide-react";

export default function Page404() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-gray-200 dark:from-[#020617] dark:to-[#0F172A] px-4">
      <div className="max-w-md w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 text-center border">
        <div className="mx-auto mb-6 w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-gray-800 text-white">
          <FileX size={36} />
        </div>

        <h1 className="text-5xl font-extrabold mb-2">404</h1>
        <h2 className="text-xl font-semibold mb-2">Page Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Halaman yang Anda cari tidak ditemukan.
        </p>

        <Link
          href="/"
          className="inline-block px-6 py-2 rounded-xl bg-gray-800 text-white hover:bg-black transition"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
