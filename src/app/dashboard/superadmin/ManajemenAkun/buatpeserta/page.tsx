"use client";

import { useState } from "react";

type PesertaAkun = {
  id: number;
  email: string;
  status: "Aktif" | "Nonaktif";
  periode: string;
};

export default function BuatAkunPesertaPage() {
  const [data] = useState<PesertaAkun[]>([
    {
      id: 1,
      email: "peserta1@email.com",
      status: "Aktif",
      periode: "1 Jan 2025 – 31 Mar 2025",
    },
    {
      id: 2,
      email: "peserta2@email.com",
      status: "Nonaktif",
      periode: "1 Feb 2025 – 30 Apr 2025",
    },
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 text-gray-800 dark:text-gray-200">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Akun Peserta</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Kelola akun peserta magang yang terdaftar dan status keaktifannya.
          </p>
        </div>

        <button
          className="
            inline-flex items-center justify-center
            px-5 py-2.5
            rounded-xl
            bg-blue-600 text-white
            font-semibold
            hover:bg-blue-700
            transition
          "
        >
          + Buat Akun Peserta
        </button>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">No</th>
              <th className="px-4 py-3 text-left">Email Peserta</th>
              <th className="px-4 py-3 text-left">Periode Magang</th>
              <th className="px-4 py-3 text-left">Status Akun</th>
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  Belum ada akun peserta
                </td>
              </tr>
            )}

            {data.map((item, index) => (
              <tr
                key={item.id}
                className="border-t hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="px-4 py-3">{index + 1}</td>
                <td className="px-4 py-3 font-medium">{item.email}</td>
                <td className="px-4 py-3">{item.periode}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 text-center">
                  <button className="text-blue-600 hover:underline text-xs">
                    Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================= COMPONENT ================= */

function StatusBadge({ status }: { status: "Aktif" | "Nonaktif" }) {
  const color =
    status === "Aktif"
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700";

  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${color}`}
    >
      {status}
    </span>
  );
}
