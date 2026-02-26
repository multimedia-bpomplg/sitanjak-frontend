"use client";

import Link from "next/link";

export default function Error402() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-white to-pink-100 px-6">
      <div className="text-center max-w-xl">
        <h1 className="text-8xl font-extrabold text-purple-600 drop-shadow-lg">
          402
        </h1>
        <h2 className="text-2xl font-bold text-gray-800 mt-4">
          Payment Required
        </h2>
        <p className="text-gray-600 mt-2">
          Fitur ini memerlukan akses premium atau pembayaran.
        </p>

        <Link
          href="/"
          className="inline-block mt-6 px-6 py-3 rounded-xl bg-purple-600 text-white font-semibold hover:scale-105 transition"
        >
          Upgrade Sekarang
        </Link>
      </div>
    </div>
  );
}
