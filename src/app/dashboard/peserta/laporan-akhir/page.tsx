"use client";

import { useEffect, useState } from "react";
import LaporanAkhirModal from "@/components/Laporan/LaporanAkhirModal";

type LaporanAkhir = {
  judul: string;
  createdAt: string;
  approvedByMentor?: boolean;
};

export default function LaporanAkhirPage() {
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<"create" | "view">("create");
  const [laporan, setLaporan] = useState<LaporanAkhir | null>(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : "";

  /* ================= CEK LAPORAN AKHIR ================= */
  const fetchLaporan = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/laporan-akhir`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) return;

      const data = await res.json();
      setLaporan(data);
      setMode("view");
    } catch {
      console.error("Gagal mengambil laporan akhir");
    }
  };

  useEffect(() => {
    fetchLaporan();
  }, []);

  const downloadPdf = () => {
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL}/laporan-akhir/pdf`,
      "_blank"
    );
  };

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-10">
      {/* ================= HEADER ================= */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          📄 Laporan Akhir Magang
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl">
          Laporan akhir hanya dapat diisi satu kali dan bersifat <b>final</b>.
          Pastikan seluruh data telah benar sebelum dikirim.
        </p>
      </div>

      {/* ================= KONTEN ================= */}
      <div className="grid gap-6">
        {/* ===== CARD LAPORAN ===== */}
        {laporan && (
          <div
            className="
              relative overflow-hidden
              rounded-3xl
              bg-white dark:bg-slate-900
              border border-slate-200 dark:border-slate-800
              shadow-[0_20px_50px_-20px_rgba(0,0,0,0.35)]
              p-6 sm:p-8
              space-y-6
            "
          >
            {/* Accent */}
            <div
              className="
                absolute top-0 left-0 right-0 h-0.75
                bg-linear-to-r
                from-emerald-400 via-teal-400 to-cyan-400
                dark:from-indigo-500 dark:via-violet-500 dark:to-fuchsia-500
              "
            />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {laporan.judul}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Dikirim pada{" "}
                  {new Date(laporan.createdAt).toLocaleDateString("id-ID")}
                </p>
              </div>

              <span
                className="
                  shrink-0
                  inline-flex items-center gap-1
                  px-3 py-1.5
                  rounded-full
                  text-xs font-semibold
                  bg-rose-100 text-rose-700
                  dark:bg-rose-900/30 dark:text-rose-300
                "
              >
                🔒 FINAL
              </span>
            </div>

            {/* Action */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowModal(true)}
                className="
                  group
                  inline-flex items-center justify-center gap-2
                  px-5 py-2.5
                  rounded-full
                  text-sm font-semibold
                  text-emerald-700 dark:text-indigo-300
                  border border-emerald-300 dark:border-indigo-500
                  bg-white dark:bg-slate-900
                  hover:bg-linear-to-r
                  hover:from-emerald-500 hover:to-teal-500
                  dark:hover:from-indigo-500 dark:hover:to-violet-600
                  hover:text-white
                  shadow-sm hover:shadow-lg
                  transition-all
                "
              >
                <span className="group-hover:scale-110 transition">📑</span>
                Lihat Detail
              </button>

              <button
                onClick={downloadPdf}
                className="
                  inline-flex items-center justify-center gap-2
                  px-5 py-2.5
                  rounded-full
                  text-sm font-semibold
                  text-white
                  bg-linear-to-r from-emerald-500 to-teal-600
                  hover:from-emerald-600 hover:to-teal-700
                  shadow-md hover:shadow-xl
                  transition-all
                "
              >
                ⬇️ Download PDF
              </button>
            </div>

            {/* Approval */}
            {laporan.approvedByMentor && (
              <div
                className="
                  rounded-2xl
                  border border-emerald-300
                  bg-emerald-50 dark:bg-emerald-900/30
                  px-4 py-3
                  text-sm
                  text-emerald-800 dark:text-emerald-200
                "
              >
                ✅ <b>Laporan akhir telah disetujui oleh mentor</b>
              </div>
            )}
          </div>
        )}

        {/* ===== CTA ISI LAPORAN ===== */}
        {!laporan && (
          <div
            className="
              rounded-3xl
              border border-dashed
              border-slate-300 dark:border-slate-700
              bg-slate-50 dark:bg-slate-900
              p-8
              flex flex-col items-center justify-center
              text-center
              space-y-4
            "
          >
            <div className="text-4xl">📝</div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              Belum Ada Laporan Akhir
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
              Silakan isi laporan akhir magang Anda.
            </p>

            {/* ⚠️ WARNING */}
            <div
              className="
                mt-1
                inline-flex items-center gap-2
                rounded-full
                px-4 py-1.5
                text-xs font-semibold
                bg-amber-50 text-amber-700
                dark:bg-amber-900/30 dark:text-amber-300
                border border-amber-300 dark:border-amber-600
              "
            >
              ⚠️ Laporan hanya dapat dikirim <b>satu kali</b>
            </div>

            {/* CTA BUTTON */}
            <button
              onClick={() => setShowModal(true)}
              className="
                mt-4
                group
                inline-flex items-center gap-3
                px-7 py-3.5
                rounded-full
                text-sm font-bold
                transition-all
                shadow-lg hover:shadow-2xl
                hover:-translate-y-0.5

                /* LIGHT MODE */
                bg-linear-to-r
                from-[#7F1D1D]
                via-[#B91C1C]
                to-[#D97706]
                text-white
                hover:from-[#991B1B]
                hover:via-[#B91C1C]
                hover:to-[#F59E0B]

                /* DARK MODE */
                dark:bg-linear-to-r dark:from-indigo-500 dark:to-violet-600
                dark:hover:from-indigo-600 dark:hover:to-violet-700
              "
            >
              <span className="text-lg group-hover:rotate-6 transition">✍️</span>
              Isi Laporan Akhir
            </button>
          </div>
        )}
      </div>

      {/* ================= MODAL ================= */}
      {showModal && (
        <LaporanAkhirModal
          mode={mode}
          onClose={(success) => {
            setShowModal(false);
            if (success) fetchLaporan();
          }}
        />
      )}
    </div>
  );
}
