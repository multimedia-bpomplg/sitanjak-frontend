// dashboard/mentor/ViewLaporanBulanan/Page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  HiUser,
  HiBriefcase,
  HiSearch,
  HiCalendar,
  HiUsers,
  HiDocumentText,
} from "react-icons/hi";
import { MdEmail } from "react-icons/md";
import MentorLaporanBulananModal from "@/components/Laporan/MentorLaporanBulananModal";

/* ================= TYPE ================= */
type Peserta = {
  id: string;
  nama: string;
  email: string;
  posisi: string;
  kategori: string;
};

type Laporan = {
  _id: string;
  month: string;
  status: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  mentorNote?: string;
  createdAt: string;
};

export default function ViewLaporanBulananMentor() {
  const [peserta, setPeserta] = useState<Peserta[]>([]);
  const [filteredPeserta, setFilteredPeserta] = useState<Peserta[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPeserta, setSelectedPeserta] = useState<Peserta | null>(null);
  const [laporanList, setLaporanList] = useState<Laporan[]>([]);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH PESERTA BIMBINGAN ================= */
  const fetchPesertaBimbingan = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/mentor/peserta`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.ok) {
        const data = await res.json();

        // Pastikan data memiliki email
        const mappedPeserta = data
          .filter((p: any) => p.email && p.email.includes("@"))
          .map((p: any) => ({
            id: p._id,
            nama: p.nama || "Nama tidak tersedia",
            email: p.email,
            posisi: p.posisi || "Posisi tidak tersedia",
            kategori: "Magang",
          }));

        setPeserta(mappedPeserta);
        setFilteredPeserta(mappedPeserta);
      }
    } catch (error) {
      console.error("Error fetch peserta bimbingan:", error);
    }
  };

  /* ================= FETCH SEMUA LAPORAN ================= */
  const fetchAllLaporan = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/laporan-bulanan/mentor/semua-laporan`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.ok) {
        const data = await res.json();
        setLaporanList(data);
      }
    } catch (error) {
      console.error("Gagal memuat laporan:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ================= INIT ================= */
  useEffect(() => {
    fetchPesertaBimbingan();
    fetchAllLaporan();
  }, []);

  /* ================= SEARCH ================= */
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

  /* ================= STATISTICS ================= */
  const getStats = () => {
    const totalLaporan = laporanList.length;
    const disetujui = laporanList.filter(
      (l) => l.status === "Disetujui",
    ).length;
    const ditolak = laporanList.filter((l) => l.status === "Ditolak").length;
    const perbaiki = laporanList.filter((l) => l.status === "Perbaiki").length;
    const menunggu = laporanList.filter((l) => l.status === "Menunggu").length;

    return {
      totalLaporan,
      disetujui,
      ditolak,
      perbaiki,
      menunggu,
    };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* HEADER */}
      <h1 className="text-3xl font-bold mb-2 text-slate-800">
        Laporan Bulanan Peserta
      </h1>
      <p className="text-slate-600 mb-8">
        Kelola dan pantau laporan bulanan peserta magang Anda
      </p>

      {/* STATISTIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Laporan"
          value={stats.totalLaporan}
          icon={<HiDocumentText />}
          note="Jumlah laporan bulanan"
          color="indigo"
        />

        <StatCard
          title="Disetujui"
          value={stats.disetujui}
          icon={<HiUser />}
          note="Laporan yang sudah disetujui"
          color="emerald"
        />

        <StatCard
          title="Perlu Perbaikan"
          value={stats.perbaiki}
          icon={<HiCalendar />}
          note="Laporan perlu revisi"
          color="amber"
        />

        <StatCard
          title="Menunggu"
          value={stats.menunggu}
          icon={<HiUsers />}
          note="Laporan belum direview"
          color="slate"
        />
      </div>

      {/* SEARCH BAR */}
      <div className="mb-8">
        <div className="relative">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari peserta berdasarkan nama, email, atau posisi..."
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

      {/* TABLE */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-10 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-slate-500">Memuat data...</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b">
                <Th>No</Th>
                <Th>Peserta</Th>
                <Th>Email</Th>
                <Th>Posisi</Th>
                <Th>Status Terbaru</Th>
                <Th>Aksi</Th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredPeserta.map((p, i) => {
                // FILTER BERDASARKAN EMAIL, BUKAN ID
                const laporanPeserta = laporanList.filter(
                  (l) => l.user?.email === p.email,
                );
                const latestLaporan = laporanPeserta.sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                )[0];

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
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
                          <p className="text-xs text-slate-500">
                            {laporanPeserta.length} laporan
                          </p>
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
                      {latestLaporan ? (
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
                          ${
                            latestLaporan.status === "Disetujui"
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : latestLaporan.status === "Ditolak"
                                ? "bg-red-100 text-red-700 border border-red-200"
                                : latestLaporan.status === "Perbaiki"
                                  ? "bg-amber-100 text-amber-700 border border-amber-200"
                                  : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {latestLaporan.status === "Disetujui"
                            ? "✅"
                            : latestLaporan.status === "Ditolak"
                              ? "❌"
                              : latestLaporan.status === "Perbaiki"
                                ? "📝"
                                : "⏳"}
                          {latestLaporan.status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                          Belum ada laporan
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <button
                        onClick={() => setSelectedPeserta(p)}
                        className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700
                          text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800
                          transition-all text-sm font-medium shadow-sm hover:shadow-md
                          flex items-center gap-2"
                      >
                        <HiDocumentText className="w-4 h-4" />
                        Lihat Laporan
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL */}
      {selectedPeserta && (
        <MentorLaporanBulananModal
          peserta={selectedPeserta}
          onClose={() => setSelectedPeserta(null)}
          onStatusUpdate={fetchAllLaporan}
        />
      )}
    </div>
  );
}

/* ================= REUSABLE COMPONENTS ================= */
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
  color: "indigo" | "emerald" | "amber" | "slate";
}) {
  const colorMap: any = {
    indigo: "bg-indigo-100 text-indigo-600",
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    slate: "bg-slate-100 text-slate-600",
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
