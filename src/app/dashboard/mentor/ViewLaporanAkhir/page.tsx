"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  GraduationCap,
  RefreshCw,
  Search,
  Users,
  XCircle,
} from "lucide-react";
import MentorLaporanAkhirModal from "@/components/Laporan/MentorLaporanAkhirModal";
import PaginationFooter from "@/components/dashboard/PaginationFooter";
import { TablePageSkeleton } from "@/components/dashboard/skeletons";

const ITEMS_PER_PAGE = 10;

/* ================= TYPES ================= */

type LaporanStatus = "Menunggu" | "Disetujui" | "Ditolak";

type LaporanSummary = {
  _id: string;
  status: LaporanStatus;
  fileName?: string;
  submittedAt?: string;
  approvedAt?: string | null;
};

type PesertaLaporanRow = {
  userId?: string | null;
  nama: string;
  email: string;
  posisi: string;
  jurusan?: string;
  asal?: { jenis: string; nama: string } | null;
  laporanAkhir: LaporanSummary | null;
};

type FilterTab =
  | "semua"
  | "menunggu"
  | "disetujui"
  | "ditolak"
  | "belum_upload";

/* ================= HELPERS ================= */

function getInitials(name = "P"): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "P"
  );
}

function formatDateShort(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusBadge(status?: LaporanStatus) {
  switch (status) {
    case "Disetujui":
      return {
        label: "Disetujui",
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        className:
          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
      };
    case "Ditolak":
      return {
        label: "Ditolak",
        icon: <XCircle className="w-3.5 h-3.5" />,
        className:
          "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
      };
    case "Menunggu":
      return {
        label: "Perlu Review",
        icon: <Clock className="w-3.5 h-3.5" />,
        className:
          "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
      };
    default:
      return {
        label: "Belum Upload",
        icon: <FileText className="w-3.5 h-3.5" />,
        className:
          "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
      };
  }
}

/* ================= PAGE ================= */

export default function ViewLaporanAkhirMentor() {
  const [pesertaList, setPesertaList] = useState<PesertaLaporanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("semua");
  const [page, setPage] = useState(1);
  const [selectedPeserta, setSelectedPeserta] = useState<{
    id: string;
    nama: string;
    email: string;
    posisi: string;
  } | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/mentor/dashboard-summary`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) {
        throw new Error("Gagal memuat data laporan akhir peserta");
      }

      const json = await res.json();
      setPesertaList(json.peserta || []);
    } catch (err: unknown) {
      console.error("Gagal memuat laporan akhir:", err);
      if (!silent) {
        setError(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat memuat data.",
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    const totalPeserta = pesertaList.length;
    const totalLaporan = pesertaList.filter((p) => p.laporanAkhir).length;
    const menunggu = pesertaList.filter(
      (p) => p.laporanAkhir?.status === "Menunggu",
    ).length;
    const disetujui = pesertaList.filter(
      (p) => p.laporanAkhir?.status === "Disetujui",
    ).length;
    const ditolak = pesertaList.filter(
      (p) => p.laporanAkhir?.status === "Ditolak",
    ).length;
    const belumUpload = totalPeserta - totalLaporan;
    const persentase =
      totalPeserta > 0 ? Math.round((totalLaporan / totalPeserta) * 100) : 0;

    return {
      totalPeserta,
      totalLaporan,
      menunggu,
      disetujui,
      ditolak,
      belumUpload,
      persentase,
    };
  }, [pesertaList]);

  const filteredPeserta = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return pesertaList.filter((p) => {
      const st = p.laporanAkhir?.status;
      if (activeFilter === "menunggu" && st !== "Menunggu") return false;
      if (activeFilter === "disetujui" && st !== "Disetujui") return false;
      if (activeFilter === "ditolak" && st !== "Ditolak") return false;
      if (activeFilter === "belum_upload" && p.laporanAkhir) return false;

      if (!q) return true;
      return (
        p.nama?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.posisi?.toLowerCase().includes(q) ||
        p.jurusan?.toLowerCase().includes(q) ||
        p.asal?.nama?.toLowerCase().includes(q)
      );
    });
  }, [pesertaList, activeFilter, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [activeFilter, searchQuery]);

  const totalPage = Math.max(
    1,
    Math.ceil(filteredPeserta.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(page, totalPage);
  const paginatedPeserta = filteredPeserta.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  if (loading) {
    return (
      <TablePageSkeleton
        title="Review Laporan Akhir"
        subtitle="Memuat laporan akhir peserta bimbingan Anda..."
        columnsCount={6}
        rowsCount={6}
      />
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Gagal Memuat Laporan Akhir
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
        </div>
        <button
          onClick={() => fetchData()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#0284c7] hover:bg-sky-700 text-white transition"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
      </div>
    );
  }

  const filterTabs: Array<{ id: FilterTab; label: string; count: number }> = [
    { id: "semua", label: "Semua", count: stats.totalPeserta },
    { id: "menunggu", label: "Perlu Review", count: stats.menunggu },
    { id: "disetujui", label: "Disetujui", count: stats.disetujui },
    { id: "ditolak", label: "Ditolak", count: stats.ditolak },
    { id: "belum_upload", label: "Belum Upload", count: stats.belumUpload },
  ];

  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Review Laporan Akhir
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tinjau dokumen, berikan keputusan, dan isi penilaian akhir peserta
            bimbingan
          </p>
        </div>

        <button
          onClick={() => fetchData()}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* ================= STATISTIC CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Biru (Senada Sidebar) */}
        <div className="rounded-2xl border border-sky-500/30 bg-linear-to-br from-[#0284c7] via-sky-600 to-blue-700 dark:from-[#0369a1] dark:to-blue-800 p-5 text-white shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-sky-100">
                Total Laporan Terkumpul
              </p>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-3xl font-extrabold">
                  {stats.totalLaporan}
                </span>
                <span className="text-xs text-sky-100">
                  / {stats.totalPeserta} peserta
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="mt-3 pt-2.5 border-t border-white/20 text-xs text-sky-100/90">
            {stats.persentase}% peserta bimbingan sudah mengunggah laporan
          </p>
        </div>

        {/* Card 2: Perlu Review */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Perlu Review
              </p>
              <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1.5">
                {stats.menunggu}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            Menunggu persetujuan & penilaian mentor
          </p>
        </div>

        {/* Card 3: Disetujui */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Disetujui & Dinilai
              </p>
              <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1.5">
                {stats.disetujui}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            Laporan akhir yang sudah selesai dinilai
          </p>
        </div>

        {/* Card 4: Belum Upload / Ditolak */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Belum Upload
              </p>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1.5">
                {stats.belumUpload}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            {stats.ditolak} laporan berstatus ditolak
          </p>
        </div>
      </div>

      {/* ================= FILTER & SEARCH ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {filterTabs.map((tab) => {
            const active = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
                  active
                    ? "bg-[#0284c7] text-white border-[#0284c7] shadow-2xs"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, posisi, kampus/SMK..."
            className="w-full pl-10 pr-8 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7] transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ================= TABLE ================= */}
      {filteredPeserta.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 py-14 px-4 text-center space-y-2">
          <GraduationCap className="w-9 h-9 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {pesertaList.length === 0
              ? "Belum ada peserta bimbingan"
              : "Data tidak ditemukan"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {pesertaList.length === 0
              ? "Peserta bimbingan akan tampil setelah ditugaskan kepada Anda."
              : "Coba ubah filter status atau kata kunci pencarian."}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-225 w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="w-[5%] py-3.5 px-4 text-center">No</th>
                  <th className="w-[26%] py-3.5 px-4 text-left">Peserta</th>
                  <th className="w-[18%] py-3.5 px-4 text-left">
                    Posisi & Jurusan
                  </th>
                  <th className="w-[21%] py-3.5 px-4 text-left">
                    Dokumen Laporan
                  </th>
                  <th className="w-[15%] py-3.5 px-4 text-center">Status</th>
                  <th className="w-[15%] py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {paginatedPeserta.map((p, i) => {
                  const rowNumber = (safePage - 1) * ITEMS_PER_PAGE + i + 1;
                  const laporan = p.laporanAkhir;
                  const badge = getStatusBadge(laporan?.status);

                  const openReview = () => {
                    if (!laporan) return;
                    setSelectedPeserta({
                      id: p.userId || p.email,
                      nama: p.nama,
                      email: p.email,
                      posisi: p.posisi,
                    });
                  };

                  return (
                    <tr
                      key={p.userId || `${p.email}-${i}`}
                      onClick={openReview}
                      className={`transition ${
                        laporan
                          ? "hover:bg-sky-50/50 dark:hover:bg-sky-950/20 cursor-pointer"
                          : "opacity-85"
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-medium text-slate-500 dark:text-slate-400">
                        {rowNumber}
                      </td>

                      <td className="py-3.5 px-4 text-left">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#0284c7] to-blue-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {getInitials(p.nama)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {p.nama}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-52">
                              {p.asal?.nama || p.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-left">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
                          {p.posisi}
                        </p>
                        {p.jurusan && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-44">
                            {p.jurusan}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-left">
                        {laporan ? (
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate max-w-48">
                              {laporan.fileName || "Laporan_Akhir.pdf"}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {laporan.approvedAt
                                ? `Direview ${formatDateShort(laporan.approvedAt)}`
                                : `Diunggah ${formatDateShort(laporan.submittedAt)}`}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.className}`}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>
                      </td>

                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {laporan ? (
                          <button
                            type="button"
                            onClick={openReview}
                            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                              laporan.status === "Menunggu"
                                ? "bg-[#0284c7] hover:bg-sky-700 text-white shadow-2xs"
                                : "bg-sky-50 text-[#0284c7] border border-sky-200 hover:bg-[#0284c7] hover:text-white dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800"
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {laporan.status === "Menunggu"
                              ? "Review"
                              : "Lihat Detail"}
                          </button>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-400">
                            Belum Ada
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <PaginationFooter
            currentPage={safePage}
            totalItems={filteredPeserta.length}
            itemsPerPage={ITEMS_PER_PAGE}
            itemLabel="peserta"
            onPageChange={setPage}
          />
        </div>
      )}

      {/* ================= MODAL REVIEW ================= */}
      {selectedPeserta && (
        <MentorLaporanAkhirModal
          peserta={selectedPeserta}
          onClose={() => setSelectedPeserta(null)}
          onStatusUpdate={() => fetchData(true)}
        />
      )}
    </div>
  );
}
