"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function Page400() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-[#020617] dark:to-[#0F172A] px-4">
      <div className="max-w-md w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 text-center border">
        <div className="mx-auto mb-6 w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
          <AlertTriangle size={36} />
        </div>

        <h1 className="text-5xl font-extrabold mb-2">400</h1>
        <h2 className="text-xl font-semibold mb-2">Bad Request</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Permintaan yang dikirim tidak valid.
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
