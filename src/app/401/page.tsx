"use client";

import Link from "next/link";

export default function Error401() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-indigo-100 px-6">
      <div className="text-center max-w-xl">
        <h1 className="text-8xl font-extrabold text-blue-600 drop-shadow-lg">
          401
        </h1>
        <h2 className="text-2xl font-bold text-gray-800 mt-4">Unauthorized</h2>
        <p className="text-gray-600 mt-2">
          Anda belum login atau token tidak valid.
        </p>

        <Link
          href="/auth/login"
          className="inline-block mt-6 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:scale-105 transition"
        >
          Login Sekarang
        </Link>
      </div>
    </div>
  );
}
