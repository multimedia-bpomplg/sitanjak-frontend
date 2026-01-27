"use client";

import { useEffect, useState } from "react";
import LaporanBulananModal from "@/components/Laporan/LaporanBulananModal";

export default function LaporanBulananPage() {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "view">("create");
  const [showModal, setShowModal] = useState(false);
  const [riwayat, setRiwayat] = useState<any[]>([]);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : "";

  /* ================= RIWAYAT ================= */
  const fetchRiwayat = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/laporan-bulanan/riwayat`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      setRiwayat(data);
    } catch {
      console.error("Gagal memuat riwayat laporan bulanan");
    }
  };

  useEffect(() => {
    fetchRiwayat();
  }, []);

  /* ================= CEK ================= */
  const checkLaporan = async (month: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/laporan-bulanan/${month}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setModalMode(res.ok ? "view" : "create");
      setShowModal(true);
    } catch {
      setModalMode("create");
      setShowModal(true);
    }
  };

  return (
    <div className="relative p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-10">
      {/* ================= PAGE TITLE ================= */}
      <div className="space-y-1">
        <h1 className="flex items-center gap-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          <span className="text-2xl">📘</span>
          Laporan Bulanan
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl">
          Kelola dan pantau laporan bulanan kegiatan magang Anda secara
          terstruktur.
        </p>
      </div>

      {/* ================= CARD PILIH BULAN ================= */}
      <div className="flex justify-center pt-4">
        <div
          className="
            w-full max-w-2xl
            rounded-2xl
            bg-white dark:bg-slate-900
            border border-slate-200 dark:border-slate-800
            shadow-[0_18px_45px_-20px_rgba(0,0,0,0.35)]
            p-6 sm:p-7
            space-y-5
          "
        >
          <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            📅 Pilih Bulan Laporan
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Bulan
            </label>

            <div className="relative">
              {/* INPUT */}
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="
                  w-full rounded-xl
                  bg-slate-50 dark:bg-slate-800
                  border border-slate-300 dark:border-slate-700
                  px-4 py-3 pr-12
                  text-sm
                  cursor-pointer
                  transition

                  focus:outline-none
                  focus:ring-2 focus:ring-[#B91C1C]

                  /* sembunyikan icon default */
                  [&::-webkit-calendar-picker-indicator]:opacity-0
                  [&::-webkit-calendar-picker-indicator]:absolute
                  [&::-webkit-calendar-picker-indicator]:right-0
                  [&::-webkit-calendar-picker-indicator]:w-full
                  [&::-webkit-calendar-picker-indicator]:h-full
                "
              />

              {/* ICON KALENDER CUSTOM */}
              <div
                className="
                  pointer-events-none
                  absolute right-3 top-1/2 -translate-y-1/2
                  h-8 w-8
                  rounded-lg
                  border border-[#FACC15]
                  flex items-center justify-center
                  text-[#7F1D1D]
                  bg-white dark:bg-slate-900
                  shadow-sm
                "
              >
                📅
              </div>
            </div>

            <p className="mt-1 text-xs text-slate-400">
              Klik area input atau ikon kalender untuk memilih bulan
            </p>
          </div>

          <button
            disabled={!selectedMonth}
            onClick={() => checkLaporan(selectedMonth)}
            className={`
              w-full rounded-xl py-3
              text-sm font-semibold text-white
              transition-all
              shadow-md
              ${
                !selectedMonth
                  ? "bg-slate-400 cursor-not-allowed"
                  : `
                      bg-linear-to-r
                      from-[#7F1D1D]
                      via-[#B91C1C]
                      to-[#F59E0B]
                      hover:from-[#991B1B]
                      hover:via-[#B91C1C]
                      hover:to-[#FACC15]
                      hover:shadow-lg
                      hover:-translate-y-0.5
                    `
              }
            `}
          >
            📂 Lihat / Isi Laporan
          </button>
        </div>
      </div>

      {/* ================= RIWAYAT LAPORAN ================= */}
      <div className="pt-6 space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          🕘 Riwayat Laporan
        </h2>

        {riwayat.length === 0 && (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Belum ada laporan bulanan
          </div>
        )}

        <div className="space-y-3">
          {riwayat.map((item) => (
            <button
              key={item.month}
              onClick={() => {
                setSelectedMonth(item.month);
                setModalMode("view");
                setShowModal(true);
              }}
              className="
      relative w-full
      rounded-xl
      bg-white dark:bg-slate-900
      border border-slate-200 dark:border-slate-800
      p-4
      text-left
      hover:shadow-md
      transition
    "
            >
              {/* accent */}
              <div
                className={`
        absolute left-4 right-4 top-0 h-0.5 rounded-full
        ${
          item.status === "Disetujui"
            ? "bg-emerald-500"
            : item.status === "Ditolak"
              ? "bg-red-500"
              : item.status === "Perbaiki"
                ? "bg-amber-400"
                : "bg-slate-300"
        }
      `}
              />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white">
                    {item.month}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Dibuat{" "}
                    {new Date(item.createdAt).toLocaleDateString("id-ID")}
                    {item.mentor && ` • Mentor: ${item.mentor.name}`}
                  </p>
                  {item.mentorNote && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      📝 {item.mentorNote}
                    </p>
                  )}
                </div>

                <span
                  className={`
          text-xs font-semibold px-3 py-1 rounded-full
          ${
            item.status === "Disetujui"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
              : item.status === "Ditolak"
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                : item.status === "Perbaiki"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
          }
        `}
                >
                  {item.status === "Disetujui"
                    ? "✅ Disetujui"
                    : item.status === "Ditolak"
                      ? "❌ Ditolak"
                      : item.status === "Perbaiki"
                        ? "📝 Perbaiki"
                        : "⏳ Menunggu"}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ================= MODAL ================= */}
      {showModal && selectedMonth && (
        <LaporanBulananModal
          month={selectedMonth}
          mode={modalMode}
          onClose={(submitted) => {
            setShowModal(false);
            if (submitted) fetchRiwayat();
          }}
        />
      )}
    </div>
  );
}
