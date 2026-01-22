"use client";

import { useEffect, useState } from "react";
import {
  HiUser,
  HiBriefcase,
  HiSearch,
  HiCalendar,
  HiUsers,
  HiDocumentReport,
} from "react-icons/hi";
import { MdEmail } from "react-icons/md";
import LaporanAkhirModal from "@/components/Laporan/MentorLaporanAkhirModal";

/* ================= TYPE ================= */
type Peserta = {
  id: string;
  nama: string;
  email: string;
  posisi: string;
  kategori: string;
};

export default function ViewLaporanAkhirMentor() {
  /* ================= DUMMY DATA (1 AKUN) ================= */
  const pesertaData: Peserta[] = [
    {
      id: "dummy-1",
      nama: "Dummy User",
      email: "dummy@gmail.com",
      posisi: "IT / Programmer",
      kategori: "Magang",
    },
  ];

  const [peserta, setPeserta] = useState<Peserta[]>([]);
  const [filteredPeserta, setFilteredPeserta] = useState<Peserta[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPeserta, setSelectedPeserta] = useState<Peserta | null>(null);

  /* ================= INIT ================= */
  useEffect(() => {
    setPeserta(pesertaData);
    setFilteredPeserta(pesertaData);
  }, []);

  /* ================= SEARCH (IDENTIK VIEWLOGBOOK) ================= */
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPeserta(peserta);
      return;
    }

    const q = searchQuery.toLowerCase();
    const filtered = peserta.filter(
      (p) =>
        p.nama.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.posisi.toLowerCase().includes(q) ||
        p.kategori.toLowerCase().includes(q),
    );

    setFilteredPeserta(filtered);
  }, [searchQuery, peserta]);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* ================= HEADER ================= */}
      <h1 className="text-3xl font-bold mb-2 text-slate-800">
        Laporan Akhir Peserta
      </h1>
      <p className="text-slate-600 mb-8">
        Kelola dan tinjau laporan akhir peserta magang
      </p>

      {/* ================= STATISTIC CARD ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Peserta"
          value={peserta.length}
          icon={<HiUsers />}
          note="Jumlah peserta bimbingan aktif"
          color="indigo"
        />

        <StatCard
          title="Laporan Akhir"
          value={filteredPeserta.length}
          icon={<HiDocumentReport />}
          note={`Hasil pencarian: "${searchQuery || "Semua peserta"}"`}
          color="emerald"
        />

        <StatCard
          title="Status"
          value="Selesai"
          icon={<HiCalendar />}
          note="Tahap akhir magang"
          color="amber"
        />
      </div>

      {/* ================= SEARCH BAR ================= */}
      <div className="mb-8">
        <div className="relative">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari peserta berdasarkan nama, email, posisi, atau kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
              text-slate-700 placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        <div className="mt-2 flex justify-between text-sm text-slate-500">
          <p>
            Menampilkan {filteredPeserta.length} dari {peserta.length} peserta
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Reset pencarian
            </button>
          )}
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b">
              <Th>No</Th>
              <Th>Peserta</Th>
              <Th>Email</Th>
              <Th>Posisi</Th>
              <Th>Kategori</Th>
              <Th>Aksi</Th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filteredPeserta.map((p, i) => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6 text-center text-slate-500 font-medium">
                  {i + 1}
                </td>

                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <HiUser className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{p.nama}</p>
                      <p className="text-xs text-slate-500">Peserta Magang</p>
                    </div>
                  </div>
                </td>

                <td className="py-4 px-6">
                  <div className="flex items-center gap-2 text-slate-600">
                    <MdEmail className="w-4 h-4" />
                    <span className="text-sm">{p.email}</span>
                  </div>
                </td>

                <td className="py-4 px-6">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    <HiBriefcase className="w-3 h-3" />
                    {p.posisi}
                  </span>
                </td>

                <td className="py-4 px-6">
                  <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {p.kategori}
                  </span>
                </td>

                <td className="py-4 px-6">
                  <button
                    onClick={() => setSelectedPeserta(p)}
                    className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700
                      text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800
                      transition-all text-sm font-medium shadow-sm hover:shadow-md
                      flex items-center gap-2"
                  >
                    <HiDocumentReport className="w-4 h-4" />
                    Lihat Laporan Akhir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= MODAL ================= */}
      {selectedPeserta && (
        <LaporanAkhirModal
          peserta={selectedPeserta}
          onClose={() => setSelectedPeserta(null)}
        />
      )}
    </div>
  );
}

/* ================= REUSABLE ================= */
function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
      {children}
    </th>
  );
}

function StatCard({
  title,
  value,
  icon,
  note,
  color,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  note: string;
  color: "indigo" | "emerald" | "amber";
}) {
  const colorMap: any = {
    indigo: "bg-indigo-100 text-indigo-600",
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
  };

  return (
    <div className="bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorMap[color]}`}>{icon}</div>
      </div>
      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-slate-500">{note}</p>
      </div>
    </div>
  );
}
