"use client";

import Link from "next/link";

export default function Error403() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-100 via-white to-orange-100 px-6">
      <div className="text-center max-w-xl">
        <h1 className="text-8xl font-extrabold text-red-600 drop-shadow-lg">
          403
        </h1>
        <h2 className="text-2xl font-bold text-gray-800 mt-4">
          Access Forbidden
        </h2>
        <p className="text-gray-600 mt-2">
          Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>

        <Link
          href="/"
          className="inline-block mt-6 px-6 py-3 rounded-xl bg-red-600 text-white font-semibold hover:scale-105 transition"
        >
          Kembali
        </Link>
      </div>
    </div>
  );
}
