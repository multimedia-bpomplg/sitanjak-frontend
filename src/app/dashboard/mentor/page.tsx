"use client";
import Link from "next/link";

import { useEffect, useState } from "react";
import {
  HiUserGroup,
  HiClipboardCheck,
  HiDocumentText,
  HiAcademicCap,
} from "react-icons/hi";
import AnnouncementBox from "@/components/AnnouncementBox";

/* ================= TYPE ================= */
type Peserta = {
  userId: string; // 🔑 untuk fetch detail
  nama: string;
  email: string;
  posisi: string;
  kategori: string;
  jurusan?: string;
};

export default function MentorDashboard() {
  const [peserta, setPeserta] = useState<Peserta[]>([]);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchPeserta = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/mentor/peserta`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        const data = await res.json();
        setPeserta(data);
      } catch (err) {
        console.error("❌ Gagal memuat dashboard mentor", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPeserta();
  }, []);

  /* ================= SUMMARY (REAL) ================= */
  const totalPeserta = peserta.length;
  const pesertaAktif = peserta.filter((p) => p.kategori !== "Selesai").length;
  const pesertaSelesai = peserta.filter((p) => p.kategori === "Selesai").length;

  const summary = [
    {
      label: "Total Peserta",
      value: totalPeserta,
      icon: <HiUserGroup />,
      color:
        "from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B] dark:from-indigo-600 dark:to-indigo-400",
    },
    {
      label: "Peserta Aktif",
      value: pesertaAktif,
      icon: <HiClipboardCheck />,
      color:
        "from-[#991B1B] via-[#DC2626] to-[#FBBF24] dark:from-indigo-700 dark:to-violet-500",
    },
    {
      label: "Peserta Selesai",
      value: pesertaSelesai,
      icon: <HiAcademicCap />,
      color:
        "from-[#B91C1C] via-[#F59E0B] to-[#FDE68A] dark:from-violet-700 dark:to-indigo-500",
    },
    {
      label: "Logbook Belum Dicek",
      value: Math.max(0, pesertaAktif),
      icon: <HiDocumentText />,
      color:
        "from-[#7F1D1D] via-[#DC2626] to-[#F59E0B] dark:from-indigo-800 dark:to-indigo-500",
    },
  ];

  /* ================= TUGAS MENTOR ================= */
  const tasks = [
    {
      title: "Cek Logbook",
      desc: "Periksa logbook harian peserta magang",
      icon: <HiClipboardCheck />,
    },
    {
      title: "Cek Laporan Bulanan",
      desc: "Evaluasi laporan bulanan peserta",
      icon: <HiDocumentText />,
    },
    {
      title: "Cek Laporan Akhir",
      desc: "Validasi laporan akhir magang",
      icon: <HiAcademicCap />,
    },
  ];

  /* ================= PESERTA BARU ================= */
  const pesertaBaru = peserta.filter((p) => p.kategori !== "Selesai");

  /* ================= PAGINATION ================= */
  const LIMIT = 4;
  const [page, setPage] = useState(1);
  const totalPage = Math.ceil(pesertaBaru.length / LIMIT);

  const paginatedPeserta = pesertaBaru.slice((page - 1) * LIMIT, page * LIMIT);

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        ⏳ Memuat dashboard mentor...
      </div>
    );
  }

  return (
    <div
      className="
        min-h-screen p-4 sm:p-6 lg:p-10
        bg-linear-to-br
        from-slate-50 via-white to-indigo-100
        dark:from-[#0B0614] dark:via-[#120A24] dark:to-[#1E0F3D]
        text-slate-800 dark:text-slate-100
        transition-colors
      "
    >
      <AnnouncementBox type="mentor" />

      {/* HEADER */}
      <div className="mb-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
          Dashboard Mentor 👋
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Ringkasan & monitoring peserta magang Anda
        </p>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-12">
        {summary.map((s, i) => (
          <div
            key={i}
            className="
              group
              relative rounded-3xl
              bg-white/80 dark:bg-white/5
              backdrop-blur
              border border-slate-200 dark:border-slate-700
              shadow-md hover:shadow-xl
              transition-all
            "
          >
            {/* GRADIENT BORDER GLOW */}
            <div
              className={`
                pointer-events-none absolute inset-0 rounded-3xl
                bg-linear-to-br ${s.color}
                opacity-0 group-hover:opacity-30 blur-xl
                transition
              `}
            />

            <div className="relative p-6 flex items-center gap-4">
              {/* ICON */}
              <div
                className="
                  w-14 h-14 sm:w-16 sm:h-16   
                  rounded-2xl
                  bg-linear-to-br from-[#7F1D1D] to-[#F59E0B]
                  dark:from-indigo-600 dark:to-violet-500
                  text-white
                  flex items-center justify-center
                  shadow-lg
                "
              >
                <span className="text-xl sm:text-2xl">{s.icon}</span>
              </div>

              {/* TEXT */}
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {s.label}
                </p>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {s.value}
                </h2>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TUGAS MENTOR */}
        <div
          className="
            rounded-3xl
            bg-white/80 dark:bg-white/5
            backdrop-blur
            border border-slate-200 dark:border-slate-700
            shadow-lg
            p-6
          "
        >
          <h3 className="font-bold mb-5 flex items-center gap-2">
            📝 Tugas Mentor
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
            {tasks.map((t, i) => (
              <div
                key={i}
                className="
                  flex items-center gap-3
                  p-3 sm:p-4
                  rounded-2xl
                  bg-white/90 dark:bg-white/5
                  border border-slate-200 dark:border-slate-700
                  shadow-sm hover:shadow-md
                  transition
                "
              >
                <div
                  className="
                    shrink-0
                    w-10 h-10
                    rounded-xl
                    bg-linear-to-br from-[#7F1D1D] to-[#F59E0B]
                    dark:from-indigo-600 dark:to-violet-500
                    text-white
                    flex items-center justify-center
                    shadow
                  "
                >
                  {t.icon}
                </div>

                <div className="leading-tight">
                  <p className="font-semibold text-sm sm:text-base">
                    {t.title}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    {t.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PESERTA BARU */}
        <div
          className="
            lg:col-span-2
            rounded-3xl
            bg-white/80 dark:bg-white/5
            backdrop-blur
            border border-slate-200 dark:border-slate-700
            shadow-lg
            p-6
          "
        >
          <h3 className="font-bold mb-5 flex items-center gap-2">
            👥 Peserta Baru
          </h3>

          {paginatedPeserta.length === 0 ? (
            <p className="text-sm text-gray-500">🎉 Belum ada peserta baru</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {paginatedPeserta.map((p, i) => (
                <div
                  key={i}
                  className="
                    group
                    flex flex-col gap-3
                    rounded-2xl border p-4
                    bg-white/90 dark:bg-white/5
                    backdrop-blur
                    hover:shadow-xl hover:-translate-y-1
                    transition-all
                  "
                >
                  {/* TOP */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-base sm:text-lg">
                        {p.nama}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-500">
                        {p.jurusan || p.posisi}
                      </p>
                    </div>

                    <span
                      className="
                        shrink-0
                        text-[11px] px-3 py-1 rounded-full
                        bg-[#FEE2E2] text-[#7F1D1D]
                        dark:bg-indigo-500/20 dark:text-indigo-300
                      "
                    >
                      Baru
                    </span>
                  </div>

                  {/* CTA */}
                  <Link
                    href={`/dashboard/mentor/peserta?email=${encodeURIComponent(p.email)}`}
                    className="
                      w-full sm:w-auto
                      inline-flex items-center justify-center gap-1
                      px-4 py-2 rounded-xl
                      text-xs sm:text-sm font-bold text-white
                      bg-linear-to-r from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                      dark:from-indigo-600 dark:to-violet-500
                      shadow-md hover:shadow-xl
                      hover:-translate-y-0.5
                      transition-all
                    "
                  >
                    Lihat Detail
                    <span className="ml-1 group-hover:translate-x-1 transition">
                      →
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* PAGINATION */}
          {totalPage > 1 && (
            <div className="flex justify-end items-center gap-3 mt-6">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="
                  px-4 py-1.5 text-sm rounded-lg
                  border border-slate-300 dark:border-slate-600
                  bg-white dark:bg-slate-900
                  hover:bg-slate-100 dark:hover:bg-slate-800
                  disabled:opacity-40 transition
                "
              >
                Prev
              </button>

              <span className="text-sm text-slate-500 dark:text-slate-400">
                {page} / {totalPage}
              </span>

              <button
                disabled={page === totalPage}
                onClick={() => setPage((p) => p + 1)}
                className="
                  px-4 py-1.5 text-sm rounded-lg
                  border border-slate-300 dark:border-slate-600
                  bg-white dark:bg-slate-900
                  hover:bg-slate-100 dark:hover:bg-slate-800
                  disabled:opacity-40 transition
                "
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
