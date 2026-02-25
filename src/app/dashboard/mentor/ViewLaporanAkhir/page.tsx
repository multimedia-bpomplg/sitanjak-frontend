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
        return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700";

      case "Ditolak":
        return "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700";

      case "Revisi":
        return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700";

      case "Menunggu":
        return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700";

      default:
        return "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
    }
  };

  /* ================= GET STATUS ICON ================= */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Disetujui":
        return <HiCheckCircle className="w-3.5 h-3.5" />;
      case "Ditolak":
        return <HiXCircle className="w-3.5 h-3.5" />;
      case "Revisi":
        return <HiExclamationCircle className="w-3.5 h-3.5" />;
      case "Menunggu":
        return <HiClock className="w-3.5 h-3.5" />;
      default:
        return <HiDocumentReport className="w-3.5 h-3.5" />;
    }
  };

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
        <h1 className="flex items-center gap-3 tracking-tight mb-2">
          <span
            className="
              text-2xl sm:text-3xl lg:text-4xl
              font-extrabold leading-tight
              bg-clip-text text-transparent
              bg-linear-to-r
              from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
              dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400
            "
          >
            Laporan Akhir Peserta
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Kelola dan tinjau laporan akhir peserta magang
        </p>
      </div>

      {/* STATISTIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        <StatCard
          title="Total Peserta"
          value={stats.totalPeserta}
          icon={<HiUsers className="w-5 h-5" />}
          note="Jumlah peserta bimbingan"
          color="indigo"
        />

        <StatCard
          title="Total Laporan"
          value={stats.totalLaporan}
          icon={<HiDocumentReport className="w-5 h-5" />}
          note={`${stats.persentaseSelesai}% peserta sudah mengisi`}
          color="purple"
        />

        <StatCard
          title="Disetujui"
          value={stats.disetujui}
          icon={<HiCheckCircle className="w-5 h-5" />}
          note="Laporan yang sudah disetujui"
          color="emerald"
        />

        <StatCard
          title="Perlu Review"
          value={stats.menunggu + stats.revisi}
          icon={<HiClock className="w-5 h-5" />}
          note={`${stats.menunggu} menunggu, ${stats.revisi} revisi`}
          color="amber"
        />

        <StatCard
          title="Ditolak"
          value={stats.ditolak}
          icon={<HiXCircle className="w-5 h-5" />}
          note="Laporan yang ditolak"
          color="red"
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
                  <Th className="w-[16%]">Status Laporan Akhir</Th>
                  <Th className="w-[20%]">Aksi</Th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-indigo-500/20">
                {filteredPeserta.map((p, i) => {
                  const summary = pesertaSummary.find(
                    (s) =>
                      s.peserta.email.toLowerCase() === p.email.toLowerCase(),
                  );
                  const laporan = summary?.laporan;

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
                            <p className="font-medium text-slate-800 dark:text-slate-100">
                              {p.nama}
                            </p>
                            <p className="text-xs text-slate-500">
                              Peserta Magang
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
                        <span
                          className="
                            inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold
                            bg-blue-50 text-blue-700
                            dark:bg-indigo-500/20 dark:text-indigo-200
                          "
                        >
                          {p.posisi}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-center align-middle">
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

                      <td className="py-4 px-6 text-center align-middle">
                        <button
                          onClick={() => setSelectedPeserta(p)}
                          disabled={!laporan}
                          className={`
                              group
                              inline-flex items-center justify-center gap-2
                              px-4 sm:px-5 py-2 sm:py-2.5
                              rounded-xl
                              text-xs sm:text-sm font-semibold
                              transition-all duration-300

                              ${
                                !laporan
                                  ? "bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-700 dark:text-slate-400"
                                  : `
                                    text-white
                                    bg-linear-to-r from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                                    hover:from-[#991B1B] hover:via-[#DC2626] hover:to-[#FBBF24]

                                    dark:from-indigo-600 dark:to-violet-500
                                    dark:hover:from-indigo-500 dark:hover:to-violet-400

                                    shadow-md hover:shadow-xl
                                    hover:-translate-y-0.5
                                  `
                              }
                            `}
                        >
                          <HiDocumentReport
                            className={`
                                w-4 h-4 transition
                                ${!laporan ? "" : "group-hover:scale-110"}
                              `}
                          />
                          {laporan ? (
                            <>
                              <span className="hidden sm:inline">
                                Lihat Laporan
                              </span>
                              <span className="sm:hidden">Laporan</span>
                            </>
                          ) : (
                            <span>Tidak Ada</span>
                          )}
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
  color: "indigo" | "emerald" | "amber" | "slate" | "purple" | "red";
}) {
  const iconColorMap: Record<string, string> = {
    indigo: "bg-indigo-500 dark:bg-indigo-600",
    emerald: "bg-emerald-500 dark:bg-emerald-600",
    amber: "bg-amber-500 dark:bg-violet-500",
    slate: "bg-slate-500 dark:bg-indigo-700",
    purple: "bg-purple-500 dark:bg-purple-600",
    red: "bg-red-500 dark:bg-red-600",
  };

  const textColorMap: Record<string, string> = {
    indigo: "text-indigo-700 dark:text-white",
    emerald: "text-emerald-700 dark:text-white",
    amber: "text-amber-700 dark:text-white",
    slate: "text-slate-700 dark:text-white",
    purple: "text-purple-700 dark:text-white",
    red: "text-red-700 dark:text-white",
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
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-indigo-300">
            {title}
          </p>
          <p className={`text-4xl font-extrabold mt-1 ${textColorMap[color]}`}>
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

      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-indigo-500/30">
        <p className="text-xs text-slate-600 dark:text-slate-300">{note}</p>
      </div>
    </div>
  );
}
