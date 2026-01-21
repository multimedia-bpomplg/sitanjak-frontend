"use client";
import Link from "next/link";

import { useEffect, useState } from "react";
import {
  HiUserGroup,
  HiClipboardCheck,
  HiDocumentText,
  HiAcademicCap,
} from "react-icons/hi";

/* ================= TYPE ================= */
type Peserta = {
  userId: string; // 🔑 untuk fetch detail
  nama: string;
  email: string;
  posisi: string;
  kategori: string;
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
      color: "from-indigo-500 to-blue-500",
    },
    {
      label: "Peserta Aktif",
      value: pesertaAktif,
      icon: <HiClipboardCheck />,
      color: "from-emerald-500 to-green-500",
    },
    {
      label: "Peserta Selesai",
      value: pesertaSelesai,
      icon: <HiAcademicCap />,
      color: "from-purple-500 to-fuchsia-500",
    },
    {
      label: "Logbook Belum Dicek",
      value: Math.max(0, pesertaAktif),
      icon: <HiDocumentText />,
      color: "from-orange-500 to-amber-500",
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
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 via-white to-indigo-50 dark:from-gray-900 dark:to-slate-900 text-gray-800 dark:text-gray-200">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold">Dashboard Mentor 👋</h1>
        <p className="text-sm text-gray-500">
          Ringkasan dan monitoring peserta magang
        </p>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {summary.map((s, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-2xl shadow-lg text-white"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${s.color}`} />
            <div className="relative p-5">
              <div className="text-3xl mb-3 opacity-90">{s.icon}</div>
              <p className="text-sm opacity-90">{s.label}</p>
              <h2 className="text-4xl font-extrabold">{s.value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TUGAS MENTOR */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border p-6">
          <h3 className="font-bold mb-5 flex items-center gap-2">
            📝 Tugas Mentor
          </h3>

          <div className="space-y-4">
            {tasks.map((t, i) => (
              <div
                key={i}
                className="
                  flex items-start gap-4 p-4
                  rounded-xl border
                  bg-gray-50 dark:bg-gray-900
                  hover:shadow-md transition
                "
              >
                <div className="text-2xl text-indigo-600">{t.icon}</div>
                <div>
                  <p className="font-semibold">{t.title}</p>
                  <p className="text-sm text-gray-500">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PESERTA BARU */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border p-6">
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
                    rounded-xl border p-4
                    bg-gray-50 dark:bg-gray-900
                    hover:shadow-md transition
                  "
                >
                  <p className="font-semibold text-lg">{p.nama}</p>
                  <p className="text-sm text-gray-500">
                    {p.jurusan || p.posisi}
                  </p>

                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                      Baru
                    </span>

                    <Link
                      href={`/dashboard/mentor/peserta?email=${encodeURIComponent(p.email)}`}
                      className="text-sm font-medium text-indigo-600 hover:underline"
                    >
                      Lihat Detail →
                    </Link>
                  </div>
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
                className="px-3 py-1 text-sm rounded-lg border disabled:opacity-40"
              >
                Prev
              </button>

              <span className="text-sm">
                {page} / {totalPage}
              </span>

              <button
                disabled={page === totalPage}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 text-sm rounded-lg border disabled:opacity-40"
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
