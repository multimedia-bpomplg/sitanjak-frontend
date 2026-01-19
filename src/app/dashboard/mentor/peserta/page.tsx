"use client";

import { useEffect, useState } from "react";
import { HiDocumentText, HiUser, HiBriefcase } from "react-icons/hi";
import PesertaDetailModal from "@/components/peserta/PesertaDetailModal";

/* ================= TYPE ================= */
type Peserta = {
  nama: string;
  email: string;
  posisi: string;
  mentor?: {
    name: string;
    email: string;
  };
};

export default function ViewPendaftaranUI() {
  const [data, setData] = useState<Peserta[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedPeserta, setSelectedPeserta] = useState<Peserta | null>(null);

  /* ================= FETCH PESERTA TERKONEKSI MENTOR ================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/mentor/peserta`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!res.ok) throw new Error("Gagal mengambil data");

        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
        <SummaryCard title="Jumlah Peserta" value={String(data.length)} />
        <SummaryCard
          title="Terkoneksi Mentor"
          value={String(data.length)}
          color="green"
        />
        <SummaryCard title="Belum Mentor" value="0" color="red" />
      </div>

      {/* SEARCH + BUTTON */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-6">
        <input
          placeholder="Cari nama peserta..."
          className="w-full sm:max-w-sm px-4 py-2.5 rounded-xl border"
        />

        <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-gradient-to-r from-emerald-500 to-green-600">
          <HiDocumentText />
          Download Excel
        </button>
      </div>

      {/* TABLE */}
      <div className="rounded-2xl bg-white border shadow-xl overflow-x-auto">
        <table className="min-w-[720px] w-full text-sm">
          <thead className="bg-slate-100 text-xs uppercase">
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
            {loading && (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-center">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-center">
                  Tidak ada peserta
                </td>
              </tr>
            )}

            {data.map((p, i) => (
              <tr key={i} className="border-t hover:bg-indigo-50/50">
                <td className="px-6 py-4 text-center">{i + 1}</td>

                {/* === KLIK NAMA → MODAL === */}
                <td
                  className="px-6 py-4 font-medium text-indigo-600 flex items-center gap-2 cursor-pointer hover:underline"
                  onClick={() => {
                    setSelectedPeserta(p);
                    setOpenModal(true);
                  }}
                >
                  <HiUser />
                  {p.nama}
                </td>

                <td className="px-6 py-4">{p.email}</td>

                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                    <HiBriefcase />
                    {p.posisi}
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
      </div>

      {/* ================= MODAL (INI YANG KAMU LUPA) ================= */}
      <PesertaDetailModal
        open={openModal}
        peserta={selectedPeserta}
        onClose={() => {
          setOpenModal(false);
          setSelectedPeserta(null);
        }}
      />
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
    <div className="rounded-2xl p-5 bg-white border shadow">
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
