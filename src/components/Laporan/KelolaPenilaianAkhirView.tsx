"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  Eye,
  Lock,
  PlusCircle,
  RefreshCw,
  ScanFace,
  Search,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import MentorPenilaianAkhirModal, {
  PesertaPenilaianItem,
} from "@/components/Laporan/MentorPenilaianAkhirModal";
import PaginationFooter from "@/components/dashboard/PaginationFooter";
import { TablePageSkeleton } from "@/components/dashboard/skeletons";
import { showToast } from "@/components/ui/toastDashboard";
import { isPkpaPeserta } from "@/lib/pesertaKategori";

const ITEMS_PER_PAGE = 10;

type ManageRole = "mentor" | "admin" | "superadmin";
type FilterTab = "semua" | "belum_dinilai" | "sudah_dinilai";

type SummaryStats = {
  totalPeserta: number;
  sudahDinilai: number;
  belumDinilai: number;
  rataRataNilai: number | null;
};

type Props = {
  role: ManageRole;
};

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
  const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateLongIndo(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getPredikatBadgeStyle(predikat?: string): string {
  switch (predikat) {
    case "Sangat Baik":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
    case "Baik":
      return "bg-blue-50 text-[#1D64F2] border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800";
    case "Cukup":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
    case "Kurang":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  }
}

export default function KelolaPenilaianAkhirView({ role }: Props) {
  const isAdminScope = role === "admin" || role === "superadmin";

  const [items, setItems] = useState<PesertaPenilaianItem[]>([]);
  const [summary, setSummary] = useState<SummaryStats>({
    totalPeserta: 0,
    sudahDinilai: 0,
    belumDinilai: 0,
    rataRataNilai: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("semua");
  const [mentorFilter, setMentorFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const [selectedPeserta, setSelectedPeserta] =
    useState<PesertaPenilaianItem | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/penilaian-akhir/mentor/list`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(
          errJson?.message || "Gagal memuat daftar penilaian akhir peserta",
        );
      }

      const json = await res.json();
      setItems(Array.isArray(json?.items) ? json.items : []);
      if (json?.summary) {
        setSummary(json.summary);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal memuat data dari server";
      setError(msg);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, activeFilter, mentorFilter]);

  const mentorOptions = useMemo(() => {
    const names = Array.from(
      new Set(
        items
          .map((i) => i.mentorName?.trim())
          .filter((name): name is string => Boolean(name && name !== "-")),
      ),
    );
    return names.sort((a, b) => a.localeCompare(b, "id"));
  }, [items]);

  const scopedItems = useMemo(() => {
    if (!isAdminScope || mentorFilter === "all") return items;
    return items.filter(
      (i) => (i.mentorName || "").trim() === mentorFilter,
    );
  }, [items, isAdminScope, mentorFilter]);

  const scopedSummary = useMemo(() => {
    if (!isAdminScope || mentorFilter === "all") return summary;
    const dinilai = scopedItems.filter((i) => Boolean(i.penilaianAkhir));
    const avg =
      dinilai.length > 0
        ? Number(
            (
              dinilai.reduce(
                (acc, i) => acc + (Number(i.penilaianAkhir?.nilaiRataRata) || 0),
                0,
              ) / dinilai.length
            ).toFixed(2),
          )
        : null;
    return {
      totalPeserta: scopedItems.length,
      sudahDinilai: dinilai.length,
      belumDinilai: scopedItems.length - dinilai.length,
      rataRataNilai: avg,
    };
  }, [scopedItems, summary, isAdminScope, mentorFilter]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scopedItems.filter((item) => {
      if (activeFilter === "belum_dinilai" && item.penilaianAkhir) return false;
      if (activeFilter === "sudah_dinilai" && !item.penilaianAkhir) return false;

      if (q) {
        const haystack =
          `${item.nama} ${item.email} ${item.posisi} ${item.jurusan || ""} ${item.asal?.nama || ""} ${item.mentorName || ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [scopedItems, activeFilter, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(page, totalPages);
  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, safePage]);

  const mentorRatingStats = useMemo(() => {
    if (isAdminScope) {
      return {
        lockedTooEarly: [] as PesertaPenilaianItem[],
        readyToRate: [] as PesertaPenilaianItem[],
        earliestOpenIso: null as string | null,
        earliestDays: 0,
      };
    }
    const lockedTooEarly = items.filter(
      (i) => !i.penilaianAkhir && i.ratingSchedule?.reason === "too_early",
    );
    const readyToRate = items.filter(
      (i) =>
        !i.penilaianAkhir &&
        Boolean(i.userId) &&
        (!i.ratingSchedule || i.ratingSchedule.canRate),
    );
    const sortedByOpen = [...lockedTooEarly]
      .filter((i) => Boolean(i.ratingSchedule?.openDateIso))
      .sort((a, b) =>
        (a.ratingSchedule?.openDateIso || "").localeCompare(
          b.ratingSchedule?.openDateIso || "",
        ),
      );
    const earliest = sortedByOpen[0]?.ratingSchedule;
    return {
      lockedTooEarly,
      readyToRate,
      earliestOpenIso: earliest?.openDateIso || null,
      earliestDays: earliest?.daysUntilOpen ?? 0,
    };
  }, [items, isAdminScope]);

  const handleExportExcel = async () => {
    if (filteredItems.length === 0) {
      showToast.error("Tidak ada data untuk diekspor");
      return;
    }

    try {
      setExporting(true);
      const XLSX = await import("xlsx");
      const rows = filteredItems.map((item, idx) => {
        const pen = item.penilaianAkhir;
        return {
          No: idx + 1,
          Nama_Peserta: item.nama,
          Email: item.email,
          Asal_Instansi: item.asal?.nama || "-",
          Unit_Kerja: item.posisi,
          Mentor_Pembimbing: item.mentorName || "-",
          Status_Penilaian: pen ? "Sudah Dinilai" : "Belum Dinilai",
          "1A_Kehadiran_Taat_Jadwal": pen?.kehadiranTaatJadwal?.nilai ?? "-",
          "1B_Sikap_Kerja": pen?.sikapKerja?.nilai ?? "-",
          "2A_Penguasaan_Materi": pen?.penguasaanMateri?.nilai ?? "-",
          "2B_Praktik_Kerja": pen?.praktikKerja?.nilai ?? "-",
          "2C_Inisiatif_Komunikasi": pen?.inisiatifKomunikasi?.nilai ?? "-",
          Nilai_Rata_Rata: pen?.nilaiRataRata ?? "-",
          Keterangan: pen?.keteranganRataRata || "-",
          Penilai: pen?.penilaiNama || "-",
          Kesan: pen?.kesan || "-",
          Saran: pen?.saran || "-",
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Penilaian Akhir Magang");
      const dateStamp = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Jakarta",
      });
      XLSX.writeFile(wb, `Rekap_Penilaian_Akhir_Magang_${dateStamp}.xlsx`);
      showToast.success("Rekap Penilaian Akhir (Excel) berhasil diunduh");
    } catch (err) {
      console.error("Gagal export penilaian:", err);
      showToast.error("Gagal mengekspor data ke Excel");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <TablePageSkeleton
        title="Penilaian Akhir Magang"
        subtitle={
          isAdminScope
            ? "Memuat status & nilai akhir seluruh peserta magang..."
            : "Memuat daftar peserta bimbingan..."
        }
        columnsCount={6}
        rowsCount={6}
      />
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 p-8 text-center space-y-3">
        <AlertCircle className="w-9 h-9 text-rose-500 mx-auto" />
        <p className="text-sm font-bold text-rose-800 dark:text-rose-200">
          {error}
        </p>
        <button
          type="button"
          onClick={() => fetchData()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Coba Lagi</span>
        </button>
      </div>
    );
  }

  const filterTabs: Array<{ id: FilterTab; label: string; count: number }> = [
    { id: "semua", label: "Semua", count: scopedSummary.totalPeserta },
    {
      id: "belum_dinilai",
      label: "Belum Dinilai",
      count: scopedSummary.belumDinilai,
    },
    {
      id: "sudah_dinilai",
      label: "Sudah Dinilai",
      count: scopedSummary.sudahDinilai,
    },
  ];

  const persentaseDinilai =
    scopedSummary.totalPeserta > 0
      ? Math.round(
          (scopedSummary.sudahDinilai / scopedSummary.totalPeserta) * 100,
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Penilaian Akhir Magang
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isAdminScope
              ? "Pantau peserta yang sudah maupun belum dinilai oleh Mentor serta lihat rincian nilai akhir peserta magang."
              : "Isi dan kelola nilai kedisiplinan, sikap kerja, kemampuan, kesan, dan saran peserta bimbingan Anda."}
          </p>
        </div>

        <div className="flex flex-nowrap items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => fetchData()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap transition"
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
            <span>Refresh</span>
          </button>

          {isAdminScope && (
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={exporting || filteredItems.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-transparent text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white whitespace-nowrap shadow-2xs transition"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>{exporting ? "Mengekspor..." : "Ekspor Excel"}</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= BANNER JADWAL PENGISIAN H-3 (KHUSUS MENTOR) ================= */}
      {!isAdminScope && mentorRatingStats.lockedTooEarly.length > 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800/70 bg-amber-50/90 dark:bg-amber-950/40 p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1 min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-amber-950 dark:text-amber-100">
              {mentorRatingStats.readyToRate.length === 0
                ? "Belum Waktunya Pengisian Penilaian Akhir"
                : "Sebagian Peserta Belum Memasuki Jadwal Pengisian Nilai"}
            </h2>
            <p className="text-xs sm:text-sm text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
              {mentorRatingStats.readyToRate.length === 0 ? (
                <>
                  Pengisian Penilaian Akhir Magang hanya dibuka mulai{" "}
                  <b>H-3 sebelum tanggal selesai magang</b>. Saat ini terdapat{" "}
                  <b>{mentorRatingStats.lockedTooEarly.length} peserta</b> yang
                  belum memasuki masa penilaian
                  {mentorRatingStats.earliestOpenIso
                    ? ` (pengisian terdekat dibuka mulai ${formatDateLongIndo(
                        mentorRatingStats.earliestOpenIso,
                      )}${
                        mentorRatingStats.earliestDays > 0
                          ? ` • ${mentorRatingStats.earliestDays} hari lagi`
                          : ""
                      })`
                    : ""}
                  .
                </>
              ) : (
                <>
                  <b>{mentorRatingStats.readyToRate.length} peserta</b> sudah
                  memasuki H-3 selesai magang dan siap dinilai, sedangkan{" "}
                  <b>{mentorRatingStats.lockedTooEarly.length} peserta</b>{" "}
                  lainnya belum waktunya pengisian
                  {mentorRatingStats.earliestOpenIso
                    ? ` (terdekat dibuka mulai ${formatDateLongIndo(
                        mentorRatingStats.earliestOpenIso,
                      )})`
                    : ""}
                  .
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* ================= STATISTIC CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-sky-500/30 bg-linear-to-br from-[#0284c7] via-sky-600 to-blue-700 dark:from-[#0369a1] dark:to-blue-800 p-5 text-white shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-sky-100">
                Progress Penilaian
              </p>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-3xl font-extrabold">
                  {scopedSummary.sudahDinilai}
                </span>
                <span className="text-xs text-sky-100">
                  / {scopedSummary.totalPeserta} peserta
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="mt-3 pt-2.5 border-t border-white/20 text-xs text-sky-100/90">
            {persentaseDinilai}% peserta {isAdminScope ? "magang" : "bimbingan"}{" "}
            sudah dinilai
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Belum Dinilai
              </p>
              <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1.5">
                {scopedSummary.belumDinilai}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            Menunggu pengisian nilai akhir
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Sudah Dinilai
              </p>
              <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1.5">
                {scopedSummary.sudahDinilai}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            Nilai &amp; PDF peserta telah tersedia
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Rata-Rata Nilai
              </p>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                {scopedSummary.rataRataNilai !== null
                  ? scopedSummary.rataRataNilai
                  : "-"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            Dari seluruh peserta yang telah dinilai
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
                type="button"
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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
          {/* <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as FilterTab)}
            aria-label="Filter Status Penilaian"
            className="px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7] transition"
          >
            <option value="semua">Semua Status Nilai</option>
            <option value="belum_dinilai">Belum Dinilai</option>
            <option value="sudah_dinilai">Sudah Dinilai</option>
          </select> */}

          {isAdminScope && mentorOptions.length > 0 && (
            <select
              value={mentorFilter}
              onChange={(e) => setMentorFilter(e.target.value)}
              aria-label="Filter Mentor Pembimbing"
              className="px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7] transition"
            >
              <option value="all">Semua Mentor</option>
              {mentorOptions.map((mName) => (
                <option key={mName} value={mName}>
                  Mentor: {mName}
                </option>
              ))}
            </select>
          )}

          <div className="relative w-full sm:w-72 lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isAdminScope
                  ? "Cari nama peserta, mentor, instansi..."
                  : "Cari nama, posisi, kampus/SMK..."
              }
              className="w-full pl-10 pr-8 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7] transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 py-14 px-4 text-center space-y-2">
          <Users className="w-9 h-9 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {items.length === 0
              ? "Belum ada data peserta"
              : "Data tidak ditemukan"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {items.length === 0
              ? isAdminScope
                ? "Peserta magang yang disetujui akan tampil di sini."
                : "Peserta bimbingan akan tampil di sini setelah ditugaskan kepada Anda."
              : "Coba ubah filter status, mentor, atau kata kunci pencarian."}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-225 w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="w-[5%] py-3.5 px-4 text-center">No</th>
                  <th className="w-[25%] py-3.5 px-4 text-left">Peserta</th>
                  <th className="w-[22%] py-3.5 px-4 text-left">
                    {isAdminScope
                      ? "Unit Kerja & Mentor"
                      : "Unit Kerja & Periode"}
                  </th>
                  <th className="w-[13%] py-3.5 px-4 text-center">
                    Ref. Absensi
                  </th>
                  <th className="w-[18%] py-3.5 px-4 text-center">
                    Nilai Rata-Rata
                  </th>
                  <th className="w-[17%] py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {paginatedItems.map((p, i) => {
                  const rowNumber = (safePage - 1) * ITEMS_PER_PAGE + i + 1;
                  const pen = p.penilaianAkhir;
                  const canRate = Boolean(p.userId);
                  const isScheduleOpen =
                    !p.ratingSchedule || p.ratingSchedule.canRate;
                  const canOpenModal = isAdminScope
                    ? Boolean(pen)
                    : canRate && (Boolean(pen) || isScheduleOpen);

                  return (
                    <tr
                      key={p.userId || `${p.email}-${i}`}
                      onClick={() => canOpenModal && setSelectedPeserta(p)}
                      className={`transition ${
                        canOpenModal
                          ? "hover:bg-sky-50/50 dark:hover:bg-sky-950/20 cursor-pointer"
                          : "opacity-85"
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-medium text-slate-500 dark:text-slate-400">
                        {rowNumber}
                      </td>

                      <td className="py-3.5 px-4 text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-sky-100 text-[#0284c7] dark:bg-sky-950 dark:text-sky-300 flex items-center justify-center text-xs font-bold shrink-0">
                            {getInitials(p.nama)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-semibold text-slate-900 dark:text-white truncate">
                                {p.nama}
                              </p>
                              {isPkpaPeserta(p) && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800 shrink-0">
                                  PKPA
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {p.asal?.nama || p.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-left">
                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {p.posisi}
                        </p>
                        {isAdminScope ? (
                          <p className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 truncate max-w-full">
                            <UserCheck className="w-3 h-3 text-[#0284c7] shrink-0" />
                            <span className="truncate">
                              {p.mentorName && p.mentorName !== "-"
                                ? p.mentorName
                                : "Belum ada mentor"}
                            </span>
                          </p>
                        ) : (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDateShort(p.tanggalMulaiMagang)} –{" "}
                            {formatDateShort(p.tanggalSelesaiMagang)}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {p.absensiRef &&
                        ((p.absensiRef.totalHariKerja ?? 0) > 0 ||
                          p.absensiRef.totalHari > 0) ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                              <ScanFace className="w-3.5 h-3.5 text-emerald-600" />
                              {p.absensiRef.averageScore ?? 0}%
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {p.absensiRef.totalHari}/
                              {p.absensiRef.totalHariKerja ??
                                p.absensiRef.totalHari}{" "}
                              hari (s/d H-3)
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {pen ? (
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
                              {pen.nilaiRataRata}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getPredikatBadgeStyle(
                                pen.keteranganRataRata,
                              )}`}
                            >
                              {pen.keteranganRataRata}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                            <Clock className="w-3 h-3" />
                            Belum Dinilai
                          </span>
                        )}
                      </td>

                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isAdminScope ? (
                          pen ? (
                            <button
                              type="button"
                              onClick={() => setSelectedPeserta(p)}
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-sky-50 text-[#0284c7] border border-sky-200 hover:bg-[#0284c7] hover:text-white dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat Nilai</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                              Menunggu Mentor
                            </span>
                          )
                        ) : canRate ? (
                          pen || isScheduleOpen ? (
                            <button
                              type="button"
                              onClick={() => setSelectedPeserta(p)}
                              className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                                pen
                                  ? "bg-sky-50 text-[#0284c7] border border-sky-200 hover:bg-[#0284c7] hover:text-white dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800"
                                  : "bg-[#0284c7] hover:bg-sky-700 text-white shadow-2xs"
                              }`}
                            >
                              {pen ? (
                                <>
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit Nilai</span>
                                </>
                              ) : (
                                <>
                                  <PlusCircle className="w-3.5 h-3.5" />
                                  <span>Isi Nilai</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <span
                              title={
                                p.ratingSchedule?.openDateIso
                                  ? `Penilaian dibuka mulai H-3 (${formatDateLongIndo(p.ratingSchedule.openDateIso)})`
                                  : "Belum waktunya pengisian penilaian"
                              }
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/70"
                            >
                              <Lock className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                {p.ratingSchedule?.reason === "inactive"
                                  ? "Tidak Magang"
                                  : p.ratingSchedule?.openDateIso
                                    ? `Dibuka ${formatDateShort(p.ratingSchedule.openDateIso)}`
                                    : "Belum Waktunya"}
                              </span>
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-400">
                            Akun Belum Aktif
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
            totalItems={filteredItems.length}
            itemsPerPage={ITEMS_PER_PAGE}
            itemLabel="peserta"
            onPageChange={setPage}
          />
        </div>
      )}

      {/* ================= MODAL INPUT / EDIT / LIHAT PENILAIAN ================= */}
      {selectedPeserta && (
        <MentorPenilaianAkhirModal
          peserta={selectedPeserta}
          readOnly={isAdminScope}
          onClose={() => setSelectedPeserta(null)}
          onSaved={() => fetchData(true)}
        />
      )}
    </div>
  );
}
