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
      {/* HEADER */}
      <div className="mb-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
          Laporan Bulanan Peserta
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Kelola dan pantau laporan bulanan peserta magang Anda
        </p>
      </div>

      {/* STATISTIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Laporan"
          value={stats.totalLaporan}
          icon={<HiDocumentText className="w-7 h-7" />}
          note="Jumlah laporan bulanan"
          color="indigo"
        />

        <StatCard
          title="Disetujui"
          value={stats.disetujui}
          icon={<HiUser className="w-7 h-7" />}
          note="Laporan yang sudah disetujui"
          color="emerald"
        />

        <StatCard
          title="Perlu Perbaikan"
          value={stats.perbaiki}
          icon={<HiCalendar className="w-7 h-7" />}
          note="Laporan perlu revisi"
          color="amber"
        />

        <StatCard
          title="Menunggu"
          value={stats.menunggu}
          icon={<HiUsers className="w-7 h-7" />}
          note="Laporan belum direview"
          color="slate"
        />
      </div>

      {/* SEARCH BAR */}
      <div className="mb-8">
        <div className="relative">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7F1D1D] dark:text-indigo-400 w-5 h-5 z-10" />
          <input
            type="text"
            placeholder="Cari peserta berdasarkan nama, email, atau posisi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              w-full pl-11 pr-10 py-3
              rounded-2xl
              bg-white/90 dark:bg-white/5
              backdrop-blur
              border border-[#F59E0B]/40 dark:border-indigo-500/40
              text-slate-700 dark:text-slate-100
              placeholder:text-slate-400
              focus:outline-none focus:ring-2
              focus:ring-[#B91C1C]/60 dark:focus:ring-indigo-500/60
              transition
            "
          />
        </div>
        <div className="mt-2 flex flex-wrap justify-between text-sm text-slate-500">
          <p>
            Menampilkan {filteredPeserta.length} dari {peserta.length} peserta
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="
                text-[#7F1D1D] dark:text-indigo-300
                hover:underline
                font-semibold
              "
            >
              Reset pencarian
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div
        className="
          rounded-2xl
          bg-white/90 dark:bg-white/5
          backdrop-blur
          border border-slate-200 dark:border-indigo-500/30
          shadow-lg
          overflow-hidden
        "
      >
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-10 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-slate-500">Memuat data...</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-indigo-500/10 border-b border-slate-200 dark:border-indigo-500/30">
                  <Th className="w-[6%]">No</Th>
                  <Th className="w-[22%]">Peserta</Th>
                  <Th className="w-[22%]">Email</Th>
                  <Th className="w-[14%]">Posisi</Th>
                  <Th className="w-[16%]">Status Terbaru</Th>
                  <Th className="w-[20%]">Aksi</Th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-indigo-500/20">
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
                      className="hover:bg-[#FEF3C7]/40 dark:hover:bg-indigo-500/10 transition"
                    >
                      <td className="py-4 px-6 text-center font-medium text-slate-500 dark:text-slate-300">
                        {i + 1}
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex justify-center items-center gap-3">
                          <div
                            className="
                              shrink-0 w-10 h-10
                              rounded-full
                              bg-linear-to-br from-[#7F1D1D] to-[#F59E0B]
                              dark:from-indigo-600 dark:to-violet-500
                              flex items-center justify-center
                              text-white shadow
                              group-hover:scale-110 transition
                            "
                          >
                            <HiUser className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-100">{p.nama}</p>
                            <p className="text-xs text-slate-500">
                              {laporanPeserta.length} laporan
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-center align-middle">
                        <div className="flex justify-center items-center gap-2 text-slate-600 dark:text-slate-300">
                          <MdEmail className="w-4 h-4" />
                          <span className="text-sm">{p.email}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-center align-middle">
                        <span className="
                          inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
                          bg-blue-50 text-blue-700
                          dark:bg-indigo-500/20 dark:text-indigo-200
                        ">
                          <HiBriefcase className="w-3 h-3" />
                          {p.posisi}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-center align-middle">
                        {latestLaporan ? (
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
                            ${
                              latestLaporan.status === "Disetujui"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
                                : latestLaporan.status === "Ditolak"
                                ? "bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-200"
                                : latestLaporan.status === "Perbaiki"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200"
                                : "bg-slate-100 text-slate-700 dark:bg-indigo-500/20 dark:text-indigo-200"
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

                      <td className="py-4 px-6 text-center align-middle">
                        <button
                          onClick={() => setSelectedPeserta(p)}
                          className="
                            group
                            inline-flex items-center justify-center gap-2
                            px-4 sm:px-5 py-2 sm:py-2.5
                            rounded-xl
                            text-xs sm:text-sm font-semibold
                            text-white

                            bg-linear-to-r from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                            hover:from-[#991B1B] hover:via-[#DC2626] hover:to-[#FBBF24]

                            dark:from-indigo-600 dark:to-violet-500
                            dark:hover:from-indigo-500 dark:hover:to-violet-400

                            shadow-md hover:shadow-xl
                            hover:-translate-y-0.5
                            transition-all duration-300
                          "
                        >
                          <HiDocumentText className="w-4 h-4 group-hover:scale-110 transition" />
                          <span className="hidden sm:inline">Lihat Laporan</span>
                          <span className="sm:hidden">Laporan</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
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
function Th({ children, className = "" }: any) {
  return (
    <th
      className={`
        py-4 px-6 text-center
        text-xs font-semibold uppercase
        text-slate-600 dark:text-indigo-200
        tracking-wider
        ${className}
      `}
    >
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
  const iconColorMap: any = {
    indigo: "bg-[#B91C1C]/90 dark:bg-indigo-600",
    emerald: "bg-emerald-500 dark:bg-emerald-600",
    amber: "bg-amber-500 dark:bg-violet-500",
    slate: "bg-slate-500 dark:bg-indigo-700",
  };

  const textColorMap: any = {
    indigo: "text-[#7F1D1D] dark:text-white",
    emerald: "text-[#7F1D1D] dark:text-white",
    amber: "text-[#7F1D1D] dark:text-white",
    slate: "text-[#7F1D1D] dark:text-white",
  };

  return (
    <div
      className="
        group relative
        rounded-2xl
        border border-[#FCA5A5]/40 dark:border-indigo-500/30
        bg-linear-to-br
        from-[#FFFDF8] via-[#FFF4EC] to-white
        dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-800
        p-6
        shadow-sm hover:shadow-xl
        transition
      "
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#7F1D1D] dark:text-indigo-300">
            {title}
          </p>
          <p
            className={`text-4xl font-extrabold mt-1 ${textColorMap[color]}`}
          >
            {value}
          </p>
        </div>

        <div
          className={`
            w-14 h-14 rounded-2xl
            text-white
            flex items-center justify-center
            shadow
            group-hover:scale-110 transition
            ${iconColorMap[color]}
          `}
        >
          {icon}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[#FCA5A5]/40 dark:border-indigo-500/30">
        <p className="text-xs text-slate-600 dark:text-slate-300">{note}</p>
      </div>
    </div>
  );
}