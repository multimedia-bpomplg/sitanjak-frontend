"use client";

import { HiDocumentText, HiUser, HiBriefcase } from "react-icons/hi";

export default function ViewPendaftaranUI() {
  return (
    <div
      className="
        min-h-screen p-6
        bg-gradient-to-br
        from-slate-50 via-white to-indigo-50
        dark:from-[#020617] dark:via-[#020617] dark:to-[#1E1B4B]
        text-slate-800 dark:text-slate-100
      "
    >
      {/* TITLE */}
      <h1 className="text-3xl font-bold tracking-tight mb-8">
        Data Pendaftaran
      </h1>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard title="Jumlah Pendaftar" value="120" />
        <SummaryCard title="Disetujui" value="80" color="green" />
        <SummaryCard title="Ditolak" value="15" color="red" />
      </div>

      {/* SEARCH + BUTTON */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-6">
        <input
          placeholder="Cari nama peserta..."
          className="
            w-full sm:max-w-sm
            px-4 py-2.5
            rounded-xl
            border border-slate-300 dark:border-slate-700
            bg-white dark:bg-slate-800
            text-sm
            focus:ring-2 focus:ring-indigo-500
            outline-none
          "
        />

        <button
          className="
            inline-flex items-center gap-2
            px-5 py-2.5
            rounded-xl
            text-sm font-semibold
            text-white
            bg-gradient-to-r from-emerald-500 to-green-600
            shadow hover:opacity-90
          "
        >
          <HiDocumentText />
          Download Excel
        </button>
      </div>

      {/* TABLE */}
      <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 border shadow-xl overflow-x-auto">
        <table className="min-w-[720px] w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-800 text-xs uppercase">
            <tr>
              <th className="px-6 py-4 text-center">No</th>
              <th className="px-6 py-4 text-left">Nama</th>
              <th className="px-6 py-4 text-left">Email</th>
              <th className="px-6 py-4 text-center">Posisi</th>
              <th className="px-6 py-4 text-center">Kategori</th>
              <th className="px-6 py-4 text-center">Status</th>
            </tr>
          </thead>

          <tbody>
            {[1, 2, 3].map((i) => (
              <tr
                key={i}
                className="
                  border-t
                  hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10
                  transition
                "
              >
                <td className="px-6 py-4 text-center">{i}</td>

                <td className="px-6 py-4 font-medium text-indigo-600 flex items-center gap-2">
                  <HiUser />
                  Ahmad Fauzi
                </td>

                <td className="px-6 py-4 text-slate-600">ahmad@mail.com</td>

                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                    <HiBriefcase />
                    IT / Programmer
                  </span>
                </td>

                <td className="px-6 py-4 text-center">Bersama</td>

                <td className="px-6 py-4 text-center">
                  <StatusBadge />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="flex justify-center gap-2 py-5">
          <button className="px-4 py-2 border rounded-lg text-sm">Prev</button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">
            1
          </button>
          <button className="px-4 py-2 border rounded-lg text-sm">2</button>
          <button className="px-4 py-2 border rounded-lg text-sm">Next</button>
        </div>
      </div>
    </div>
  );
}

/* ================= COMPONENT ================= */

function SummaryCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color?: "green" | "red";
}) {
  const map = {
    green: "text-emerald-500",
    red: "text-rose-500",
    default: "text-indigo-500",
  };

  return (
    <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border shadow">
      <p className="text-sm text-slate-500">{title}</p>
      <h2 className={`text-3xl font-bold ${map[color || "default"]}`}>
        {value}
      </h2>
    </div>
  );
}

function StatusBadge() {
  return (
    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
      Disetujui
    </span>
  );
}
