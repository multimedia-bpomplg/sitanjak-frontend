// dashboard/mentor/ViewLaporanAkhir/Page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import {
  HiUser,
  HiBriefcase,
  HiSearch,
  HiCalendar,
  HiUsers,
  HiDocumentReport,
  HiCheckCircle,
  HiXCircle,
  HiExclamationCircle,
  HiClock,
} from "react-icons/hi";
import { MdEmail } from "react-icons/md";
import MentorLaporanAkhirModal from "@/components/Laporan/MentorLaporanAkhirModal";

/* ================= TYPE ================= */
type Peserta = {
  id: string;
  nama: string;
  email: string;
  posisi: string;
  kategori: string;
};

type LaporanAkhir = {
  _id: string;
  judul: string;
  status: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  mentorNote?: string;
  createdAt: string;
  approvedAt?: string;
  approvedByMentor?: {
    name: string;
    email: string;
  };
};

export default function ViewLaporanAkhirMentor() {
  const [peserta, setPeserta] = useState<Peserta[]>([]);
  const [filteredPeserta, setFilteredPeserta] = useState<Peserta[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPeserta, setSelectedPeserta] = useState<Peserta | null>(null);
  const [laporanList, setLaporanList] = useState<LaporanAkhir[]>([]);
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

  /* ================= FETCH SEMUA LAPORAN AKHIR ================= */
  const fetchAllLaporanAkhir = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/laporan-akhir/mentor/semua-laporan`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.ok) {
        const data = await res.json();
        setLaporanList(data);
      }
    } catch (error) {
      console.error("Gagal memuat laporan akhir:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ================= INIT ================= */
  useEffect(() => {
    fetchPesertaBimbingan();
    fetchAllLaporanAkhir();
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

  /* ================= PROCESS DATA WITH MEMO ================= */
  const pesertaSummary = useMemo(() => {
    const summary = new Map<
      string,
      {
        peserta: Peserta;
        laporan?: LaporanAkhir;
      }
    >();

    // Inisialisasi semua peserta
    peserta.forEach((p) => {
      summary.set(p.email, {
        peserta: p,
        laporan: undefined,
      });
    });

    // Map laporan ke peserta berdasarkan email
    laporanList.forEach((laporan) => {
      if (!laporan.user?.email) return;

      const email = laporan.user.email.toLowerCase().trim();
      const data = summary.get(email);

      if (data) {
        data.laporan = laporan;
      }
    });

    return Array.from(summary.values());
  }, [peserta, laporanList]);

  /* ================= STATISTICS ================= */
  const getStats = () => {
    const totalLaporan = laporanList.length;
    const disetujui = laporanList.filter(
      (l) => l.status === "Disetujui",
    ).length;
    const ditolak = laporanList.filter((l) => l.status === "Ditolak").length;
    const revisi = laporanList.filter((l) => l.status === "Revisi").length;
    const menunggu = laporanList.filter((l) => l.status === "Menunggu").length;

    const totalPeserta = peserta.length || 1;
    const persentaseSelesai = Math.round((totalLaporan / totalPeserta) * 100);

    return {
      totalLaporan,
      disetujui,
      ditolak,
      revisi,
      menunggu,
      totalPeserta,
      persentaseSelesai,
    };
  };

  const stats = getStats();

  /* ================= GET STATUS COLOR ================= */
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Disetujui":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Ditolak":
        return "bg-red-100 text-red-700 border-red-200";
      case "Revisi":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "Menunggu":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-500 border-slate-200";
    }
  };

  /* ================= GET STATUS ICON ================= */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Disetujui":
        return <HiCheckCircle className="w-4 h-4" />;
      case "Ditolak":
        return <HiXCircle className="w-4 h-4" />;
      case "Revisi":
        return <HiExclamationCircle className="w-4 h-4" />;
      case "Menunggu":
        return <HiClock className="w-4 h-4" />;
      default:
        return <HiDocumentReport className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* HEADER */}
      <h1 className="text-3xl font-bold mb-2 text-slate-800">
        Laporan Akhir Peserta
      </h1>
      <p className="text-slate-600 mb-8">
        Kelola dan tinjau laporan akhir peserta magang
      </p>

      {/* STATISTIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Total Peserta"
          value={stats.totalPeserta}
          icon={<HiUsers />}
          note="Jumlah peserta bimbingan"
          color="indigo"
        />

        <StatCard
          title="Total Laporan"
          value={stats.totalLaporan}
          icon={<HiDocumentReport />}
          note={`${stats.persentaseSelesai}% peserta sudah mengisi`}
          color="purple"
        />

        <StatCard
          title="Disetujui"
          value={stats.disetujui}
          icon={<HiCheckCircle />}
          note="Laporan yang sudah disetujui"
          color="emerald"
        />

        <StatCard
          title="Perlu Review"
          value={stats.menunggu + stats.revisi}
          icon={<HiClock />}
          note={`${stats.menunggu} menunggu, ${stats.revisi} revisi`}
          color="amber"
        />

        <StatCard
          title="Ditolak"
          value={stats.ditolak}
          icon={<HiXCircle />}
          note="Laporan yang ditolak"
          color="red"
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
                <Th>Status Laporan Akhir</Th>
                <Th>Aksi</Th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredPeserta.map((p, i) => {
                const summary = pesertaSummary.find(
                  (s) =>
                    s.peserta.email.toLowerCase() === p.email.toLowerCase(),
                );
                const laporan = summary?.laporan;

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
                            Peserta Magang
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
                      {laporan ? (
                        <div className="space-y-2">
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(laporan.status)}`}
                          >
                            {getStatusIcon(laporan.status)}
                            <span className="font-semibold">
                              {laporan.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            {laporan.judul?.substring(0, 60)}...
                            {laporan.approvedAt && (
                              <div className="mt-1">
                                Direview:{" "}
                                {new Date(
                                  laporan.approvedAt,
                                ).toLocaleDateString("id-ID")}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                          <HiDocumentReport className="w-4 h-4" />
                          Belum ada laporan
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <button
                        onClick={() => setSelectedPeserta(p)}
                        disabled={!laporan}
                        className={`px-5 py-2 rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-2 ${
                          !laporan
                            ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800"
                        }`}
                      >
                        <HiDocumentReport className="w-4 h-4" />
                        {laporan ? "Lihat Laporan" : "Tidak Ada"}
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
        <MentorLaporanAkhirModal
          peserta={selectedPeserta}
          onClose={() => setSelectedPeserta(null)}
          onStatusUpdate={fetchAllLaporanAkhir}
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
  color: "indigo" | "emerald" | "amber" | "slate" | "purple" | "red";
}) {
  const colorMap: any = {
    indigo: "bg-indigo-100 text-indigo-600",
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    slate: "bg-slate-100 text-slate-600",
    purple: "bg-purple-100 text-purple-600",
    red: "bg-red-100 text-red-600",
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
