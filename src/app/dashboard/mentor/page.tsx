"use client";
import { useState } from "react";

export default function MentorDashboard() {
  const summary = [
    { label: "Total Peserta", value: 10 },
    { label: "Peserta Aktif", value: 7 },
    { label: "Logbook Belum Dicek", value: 4 },
    { label: "Peserta Selesai", value: 3 },
  ];

  const tasks = [
    { title: "Cek Logbook", desc: "Periksa logbook harian peserta" },
    { title: "Penilaian", desc: "Isi penilaian mingguan peserta" },
    { title: "Monitoring", desc: "Pantau kehadiran dan progres" },
  ];

  const pesertaPerluPerhatian = [
    {
      nama: "Ahmad Fauzi",
      jurusan: "Lainnya – Teknik Industri",
      status: "Aktif",
    },
    {
      nama: "Siti Rahma",
      jurusan: "Teknik Informatika",
      status: "Hampir Selesai",
    },
    { nama: "Budi Santoso", jurusan: "RPL", status: "Aktif" },
    { nama: "Dewi Lestari", jurusan: "DKV", status: "Aktif" },
    { nama: "Rizki Maulana", jurusan: "SI", status: "Hampir Selesai" },
  ];

  /* ================= PAGINATION ================= */
  const LIMIT = 4;
  const [page, setPage] = useState(1);
  const totalPage = Math.ceil(pesertaPerluPerhatian.length / LIMIT);

  const paginatedPeserta = pesertaPerluPerhatian.slice(
    (page - 1) * LIMIT,
    page * LIMIT
  );

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* HEADER */}
      <h1 className="text-2xl font-bold mb-2">Dashboard Mentor 👋</h1>
      <p className="text-sm text-gray-500 mb-6">
        Ringkasan aktivitas peserta magang
      </p>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summary.map((s, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 p-5 rounded-xl border shadow-sm"
          >
            <p className="text-sm text-gray-500">{s.label}</p>
            <h2 className="text-3xl font-bold">{s.value}</h2>
          </div>
        ))}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TUGAS */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-5">
          <h3 className="font-semibold mb-4">📝 Tugas Mentor</h3>
          <div className="space-y-3">
            {tasks.map((t, i) => (
              <div
                key={i}
                className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-900"
              >
                <p className="font-medium">{t.title}</p>
                <p className="text-sm text-gray-500">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* PESERTA PERLU PERHATIAN */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border p-5">
          <h3 className="font-semibold mb-4">👥 Peserta Perlu Perhatian</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {paginatedPeserta.map((p, i) => (
              <div
                key={i}
                className="border rounded-xl p-4 bg-gray-50 dark:bg-gray-900"
              >
                <p className="font-semibold">{p.nama}</p>
                <p className="text-sm text-gray-500">{p.jurusan}</p>

                <div className="flex items-center justify-between mt-3">
                  <span
                    className={`text-xs px-3 py-1 rounded-full
                      ${
                        p.status === "Hampir Selesai"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-blue-100 text-blue-700"
                      }
                    `}
                  >
                    {p.status}
                  </span>

                  <button className="text-sm text-blue-600 hover:underline">
                    Lihat Detail
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION BUTTON */}
          {totalPage > 1 && (
            <div className="flex justify-end gap-2 mt-5">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 text-sm rounded-lg border disabled:opacity-40"
              >
                Prev
              </button>

              <span className="text-sm px-2 py-1">
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
