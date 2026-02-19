"use client";

import { useEffect } from "react";
import Link from "next/link";
import { HiExclamationCircle, HiArrowLeft } from "react-icons/hi";

export default function ErrorDetailFormasi({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <div className="mb-6">
          <Link
            href="/#formasi"
            className="inline-flex items-center text-gray-600 hover:text-[#7F1D1D] transition-colors group"
          >
            <HiArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
            <span>Kembali ke Daftar Formasi</span>
          </Link>
        </div>

        {/* Error Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-10 text-white">
            <div className="flex flex-col items-center text-center">
              <HiExclamationCircle className="text-6xl mb-4" />
              <h1 className="text-3xl font-extrabold mb-2">
                Oops! Terjadi Kesalahan
              </h1>
              <p className="text-white/90 max-w-lg">
                Maaf, terjadi kesalahan saat memuat halaman detail formasi.
                Silakan coba lagi atau kembali ke halaman utama.
              </p>
            </div>
          </div>

          <div className="p-8 text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={reset}
                className="px-8 py-3 bg-[#7F1D1D] text-white rounded-xl font-bold hover:bg-[#B91C1C] transition-colors"
              >
                Coba Lagi
              </button>
              <Link
                href="/#formasi"
                className="px-8 py-3 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300 transition-colors"
              >
                Lihat Formasi Lain
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
