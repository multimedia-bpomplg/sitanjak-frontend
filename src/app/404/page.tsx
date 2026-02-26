"use client";

import Link from "next/link";

export default function Error404() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-200 px-6">
      <div className="text-center max-w-xl">
        <h1 className="text-8xl font-extrabold text-gray-700 drop-shadow-lg">
          404
        </h1>
        <h2 className="text-2xl font-bold text-gray-800 mt-4">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-gray-600 mt-2">
          Halaman yang Anda cari tidak tersedia atau telah dipindahkan.
        </p>

        <Link
          href="/"
          className="inline-block mt-6 px-6 py-3 rounded-xl bg-gray-800 text-white font-semibold hover:scale-105 transition"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
