"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileSignature,
  RefreshCw,
  RotateCcw,
  Search,
  UserCheck,
  Users,
} from "lucide-react";
import EvaluasiReviewModal, {
  type EvaluasiStatus,
  type ManageEvaluasiItem,
} from "@/components/Laporan/EvaluasiReviewModal";
import ModernDatePickerPopover from "@/components/pendaftaran/ModernDatePickerPopover";
import PaginationFooter from "@/components/dashboard/PaginationFooter";
import { TablePageSkeleton } from "@/components/dashboard/skeletons";
import { showToast } from "@/components/ui/toastDashboard";
import { downloadEvaluasiDanPernyataanPdf } from "@/lib/evaluasiPdf";
import {
  buildEvaluasiFilterSummary,
  downloadRekapEvaluasiPdf,
} from "@/lib/evaluasiRekapPdf";
import {
  BULAN_OPTIONS,
  collectAvailableYears,
  getJwtUserSummary,
  matchesPeriodeFilter,
} from "@/lib/pesertaFilter";
import { isPkpaPeserta } from "@/lib/pesertaKategori";

function toWibYmdIso(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  const isoOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoOnly) {
    return `${isoOnly[1]}-${isoOnly[2]}-${isoOnly[3]}`;
  }
  const dt = new Date(trimmed);
  if (Number.isNaN(dt.getTime())) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dt);
}

const ITEMS_PER_PAGE = 10;

type ManageRole = "mentor" | "admin" | "superadmin";
type FilterTab = "semua" | "menunggu" | "revisi" | "disetujui" | "belum";

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
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusBadge(status?: EvaluasiStatus | null): string {
  switch (status) {
    case "Disetujui":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
    case "Revisi":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800";
    case "Menunggu":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  }
}

export default function KelolaEvaluasiView({ role }: Props) {
  const isAdminScope = role === "admin" || role === "superadmin";

  const [items, setItems] = useState<ManageEvaluasiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("semua");
  const [mentorFilter, setMentorFilter] = useState<string>("all");
  const [formasiFilter, setFormasiFilter] = useState<string>("all");
  const [jurusanFilter, setJurusanFilter] = useState<string>("all");
  const [instansiFilter, setInstansiFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("");
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const [selectedItem, setSelectedItem] = useState<ManageEvaluasiItem | null>(
    null,
  );

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/evaluasi/manage`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(
          errJson?.message ||
            "Gagal memuat daftar evaluasi & surat pernyataan peserta",
        );
      }

      const json = await res.json();
      setItems(Array.isArray(json?.items) ? json.items : []);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat data dari server",
      );
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [
    searchQuery,
    activeFilter,
    mentorFilter,
    formasiFilter,
    jurusanFilter,
    instansiFilter,
    yearFilter,
    monthFilter,
    dateFilter,
  ]);

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

  const formasiOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of items) {
      const raw = item.posisi?.trim();
      if (!raw || raw === "-") continue;
      const key = raw.toLowerCase();
      if (!map.has(key)) map.set(key, raw);
    }
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "id-ID"));
  }, [items]);

  const jurusanOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of items) {
      const raw = item.jurusan?.trim();
      if (!raw || raw === "-") continue;
      const key = raw.toLowerCase();
      if (!map.has(key)) map.set(key, raw);
    }
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "id-ID"));
  }, [items]);

  const instansiOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of items) {
      const raw = item.asal?.nama?.trim();
      if (!raw || raw === "-") continue;
      const key = raw.toLowerCase();
      if (!map.has(key)) map.set(key, raw);
    }
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "id-ID"));
  }, [items]);

  const availableYears = useMemo(() => {
    const years = new Set<number>(collectAvailableYears(items));
    for (const item of items) {
      const subIso = toWibYmdIso(item.evaluasi?.submittedAt);
      if (subIso) {
        years.add(Number(subIso.slice(0, 4)));
      }
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [items]);

  const highlightedDates = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      const subIso = toWibYmdIso(item.evaluasi?.submittedAt);
      if (subIso) set.add(subIso);
      const startIso = toWibYmdIso(item.tanggalMulaiMagang);
      if (startIso) set.add(startIso);
      const endIso = toWibYmdIso(item.tanggalSelesaiMagang);
      if (endIso) set.add(endIso);
    }
    return Array.from(set);
  }, [items]);

  const hasActiveAdvancedFilters = Boolean(
    (isAdminScope && mentorFilter !== "all") ||
      (isAdminScope && formasiFilter !== "all") ||
      (!isAdminScope && jurusanFilter !== "all") ||
      (!isAdminScope && instansiFilter !== "all") ||
      yearFilter ||
      monthFilter ||
      dateFilter ||
      searchQuery.trim(),
  );

  const handleResetFilters = () => {
    setActiveFilter("semua");
    setMentorFilter("all");
    setFormasiFilter("all");
    setJurusanFilter("all");
    setInstansiFilter("all");
    setYearFilter("");
    setMonthFilter("");
    setDateFilter("");
    setSearchQuery("");
  };

  const scopedItems = useMemo(() => {
    return items.filter((item) => {
      if (isAdminScope && mentorFilter !== "all") {
        if ((item.mentorName || "").trim() !== mentorFilter) return false;
      }

      if (isAdminScope && formasiFilter !== "all") {
        const f = (item.posisi || "").trim().toLowerCase();
        if (f !== formasiFilter) return false;
      }

      if (!isAdminScope && jurusanFilter !== "all") {
        const j = (item.jurusan || "").trim().toLowerCase();
        if (j !== jurusanFilter) return false;
      }

      if (!isAdminScope && instansiFilter !== "all") {
        const inst = (item.asal?.nama || "").trim().toLowerCase();
        if (inst !== instansiFilter) return false;
      }

      const subIso = toWibYmdIso(item.evaluasi?.submittedAt);
      const startIso = toWibYmdIso(item.tanggalMulaiMagang);
      const endIso = toWibYmdIso(item.tanggalSelesaiMagang);

      if (dateFilter) {
        if (subIso !== dateFilter && startIso !== dateFilter && endIso !== dateFilter) {
          return false;
        }
      } else if (yearFilter || monthFilter) {
        const matchesSub = (() => {
          if (!subIso) return false;
          if (yearFilter && subIso.slice(0, 4) !== yearFilter) return false;
          if (monthFilter) {
            const targetMonth = String(Number(monthFilter)).padStart(2, "0");
            if (subIso.slice(5, 7) !== targetMonth) return false;
          }
          return true;
        })();

        const matchesPeriode = matchesPeriodeFilter(
          item,
          monthFilter ? Number(monthFilter) : "semua",
          yearFilter ? Number(yearFilter) : "semua",
        );

        if (!matchesSub && !matchesPeriode) return false;
      }

      return true;
    });
  }, [
    items,
    isAdminScope,
    mentorFilter,
    formasiFilter,
    jurusanFilter,
    instansiFilter,
    yearFilter,
    monthFilter,
    dateFilter,
  ]);

  const stats = useMemo(() => {
    return {
      totalPeserta: scopedItems.length,
      menunggu: scopedItems.filter((i) => i.evaluasi?.status === "Menunggu")
        .length,
      revisi: scopedItems.filter((i) => i.evaluasi?.status === "Revisi").length,
      disetujui: scopedItems.filter((i) => i.evaluasi?.status === "Disetujui")
        .length,
      belumMengisi: scopedItems.filter((i) => !i.evaluasi).length,
    };
  }, [scopedItems]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scopedItems.filter((item) => {
      if (activeFilter === "menunggu" && item.evaluasi?.status !== "Menunggu") {
        return false;
      }
      if (activeFilter === "revisi" && item.evaluasi?.status !== "Revisi") {
        return false;
      }
      if (
        activeFilter === "disetujui" &&
        item.evaluasi?.status !== "Disetujui"
      ) {
        return false;
      }
      if (activeFilter === "belum" && Boolean(item.evaluasi)) {
        return false;
      }
      if (!q) return true;
      return (
        item.nama.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.posisi.toLowerCase().includes(q) ||
        (item.jurusan || "").toLowerCase().includes(q) ||
        (item.asal?.nama || "").toLowerCase().includes(q) ||
        (item.mentorName || "").toLowerCase().includes(q)
      );
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

  const handleExportPdf = async () => {
    if (filteredItems.length === 0) {
      showToast.error("Tidak ada data untuk diunduh");
      return;
    }

    try {
      setExporting(true);
      const user = getJwtUserSummary();
      const filterSummary = buildEvaluasiFilterSummary({
        activeFilter,
        isAdminScope,
        mentorFilter,
        formasiFilter,
        formasiOptions,
        jurusanFilter,
        jurusanOptions,
        instansiFilter,
        instansiOptions,
        yearFilter,
        monthFilter,
        dateFilter,
        searchQuery,
      });

      const dateStamp = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Jakarta",
      });
      await downloadRekapEvaluasiPdf(filteredItems, {
        role,
        printedByName: user.name,
        printedByDetail: user.email,
        filterSummary,
        summary: stats,
        fileName: `Rekap_Evaluasi_Surat_Pernyataan_${role}_${dateStamp}.pdf`,
      });
      showToast.success("Rekap Evaluasi & Surat Pernyataan (PDF) berhasil diunduh");
    } catch (err) {
      console.error("Gagal membuat PDF evaluasi:", err);
      showToast.error("Gagal membuat file PDF rekap evaluasi");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <TablePageSkeleton
        title="Evaluasi & Surat Pernyataan"
        subtitle="Memuat daftar evaluasi & surat pernyataan peserta magang..."
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
    { id: "semua", label: "Semua", count: stats.totalPeserta },
    { id: "menunggu", label: "Menunggu", count: stats.menunggu },
    { id: "revisi", label: "Revisi", count: stats.revisi },
    { id: "disetujui", label: "Disetujui", count: stats.disetujui },
    { id: "belum", label: "Belum Mengisi", count: stats.belumMengisi },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Evaluasi &amp; Surat Pernyataan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {isAdminScope
              ? "Pantau status, unduh rekap PDF, edit, atau reset data Evaluasi & Surat Pernyataan peserta magang (persetujuan/revisi dilakukan oleh Mentor)."
              : "Tinjau Evaluasi & Surat Pernyataan peserta bimbingan Anda lalu berikan persetujuan atau catatan revisi."}
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 self-start lg:self-auto">
          {isAdminScope && (
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={exporting || filteredItems.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-transparent text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 disabled:opacity-50 text-white whitespace-nowrap shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>{exporting ? "Menyiapkan PDF..." : "Unduh PDF"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fetchData()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl p-5 bg-linear-to-br from-[#0284c7] to-blue-700 text-white shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-sky-100">Total Peserta</p>
              <p className="text-3xl font-extrabold tracking-tight mt-2">
                {stats.totalPeserta}
              </p>
              <p className="text-[11px] text-sky-100 mt-1.5">
                {stats.belumMengisi} belum mengisi formulir
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Menunggu Penindakan
              </p>
              <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight mt-2">
                {stats.menunggu}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Menunggu persetujuan mentor
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Perlu Revisi
              </p>
              <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight mt-2">
                {stats.revisi}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Dikembalikan untuk diperbaiki
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Sudah Disetujui
              </p>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mt-2">
                {stats.disetujui}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Peserta dapat mengunduh PDF
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 p-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {filterTabs.map((tab) => {
              const active = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition inline-flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? "bg-[#0284c7] text-white shadow-xs"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, instansi, jurusan..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40"
              />
            </div>
          </div>
        </div>

        {/* FILTER MENTOR, FORMASI (ADMIN/SUPERADMIN), JURUSAN, INSTANSI, TAHUN, BULAN, TANGGAL */}
        <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-700/70 flex flex-wrap items-center gap-2">
          {isAdminScope && (
            <>
              <div className="flex items-center gap-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 min-w-[165px] flex-1 sm:flex-initial">
                <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={mentorFilter}
                  onChange={(e) => setMentorFilter(e.target.value)}
                  aria-label="Filter berdasarkan mentor"
                  className="w-full bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="all">Semua Mentor</option>
                  {mentorOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 min-w-[165px] flex-1 sm:flex-initial">
                <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={formasiFilter}
                  onChange={(e) => setFormasiFilter(e.target.value)}
                  aria-label="Filter berdasarkan formasi"
                  className="w-full bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="all">Semua Formasi</option>
                  {formasiOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {!isAdminScope && (
            <>
              <div className="flex items-center gap-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 min-w-[165px] flex-1 sm:flex-initial">
                <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={jurusanFilter}
                  onChange={(e) => setJurusanFilter(e.target.value)}
                  aria-label="Filter berdasarkan jurusan"
                  className="w-full bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="all">Semua Jurusan</option>
                  {jurusanOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 min-w-[180px] flex-1 sm:flex-initial">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={instansiFilter}
                  onChange={(e) => setInstansiFilter(e.target.value)}
                  aria-label="Filter berdasarkan instansi"
                  className="w-full bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="all">Semua Instansi</option>
                  {instansiOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="flex items-center gap-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={yearFilter}
              onChange={(e) => {
                setYearFilter(e.target.value);
                if (dateFilter) setDateFilter("");
              }}
              aria-label="Filter berdasarkan tahun"
              className="bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="">Semua Tahun</option>
              {availableYears.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5">
            <select
              value={monthFilter}
              onChange={(e) => {
                setMonthFilter(e.target.value);
                if (dateFilter) setDateFilter("");
              }}
              aria-label="Filter berdasarkan bulan"
              className="bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="">Semua Bulan</option>
              {BULAN_OPTIONS.map((b) => (
                <option key={b.value} value={String(b.value)}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          <ModernDatePickerPopover
            value={dateFilter}
            onChange={(nextIso) => {
              setDateFilter(nextIso);
              if (nextIso) {
                setYearFilter(nextIso.slice(0, 4));
                setMonthFilter(String(Number(nextIso.slice(5, 7))));
              }
            }}
            defaultYear={yearFilter}
            defaultMonth={monthFilter}
            highlightedDates={highlightedDates}
            placeholder="Pilih Tanggal"
            ariaLabel="Filter berdasarkan tanggal"
          />

          {(hasActiveAdvancedFilters || activeFilter !== "semua") && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {paginatedItems.length === 0 ? (
          <div className="py-14 px-4 text-center space-y-2">
            <FileSignature className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
              Tidak ada data peserta yang sesuai
            </p>
            <p className="text-xs text-slate-400">
              Ubah filter atau kata kunci pencarian untuk melihat data lainnya.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-800/70 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4">Peserta</th>
                  <th className="py-3.5 px-4">Asal &amp; Penempatan</th>
                  {isAdminScope && <th className="py-3.5 px-4">Mentor</th>}
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Dikirim</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedItems.map((item) => {
                  const ev = item.evaluasi;
                  const pkpa = isPkpaPeserta(item);

                  return (
                    <tr
                      key={item.email}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#0284c7] to-blue-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {getInitials(item.nama)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-slate-900 dark:text-white truncate">
                                {item.nama}
                              </p>
                              <span
                                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border whitespace-nowrap ${
                                  pkpa
                                    ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800"
                                    : "bg-blue-50 text-[#1D64F2] border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                                }`}
                              >
                                {pkpa ? "PKPA" : "Reguler"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {item.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-xs">
                          {item.asal?.nama || "-"}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.posisi}
                          {item.jurusan && item.jurusan !== "-"
                            ? ` · ${item.jurusan}`
                            : ""}
                        </p>
                      </td>

                      {isAdminScope && (
                        <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-200 font-medium">
                          {item.mentorName || "-"}
                        </td>
                      )}

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusBadge(
                            ev ? ev.status : null,
                          )}`}
                        >
                          {ev ? ev.status : "Belum Mengisi"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {ev ? formatDateShort(ev.submittedAt) : "-"}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {ev ? (
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {ev.status === "Disetujui" && (
                              <button
                                type="button"
                                onClick={() =>
                                  downloadEvaluasiDanPernyataanPdf(ev, {
                                    mulai: item.tanggalMulaiMagang,
                                    selesai: item.tanggalSelesaiMagang,
                                    submittedAt: ev.submittedAt,
                                    isPkpa: pkpa,
                                  })
                                }
                                title="Unduh PDF"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 transition cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">PDF</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedItem(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0284c7] hover:bg-sky-700 text-white shadow-2xs transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>
                                {isAdminScope
                                  ? "Kelola"
                                  : ev.status === "Menunggu"
                                    ? "Tindak"
                                    : "Detail"}
                              </span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Menunggu isian peserta
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <PaginationFooter
          currentPage={safePage}
          totalItems={filteredItems.length}
          itemsPerPage={ITEMS_PER_PAGE}
          itemLabel="peserta"
          onPageChange={setPage}
        />
      </div>

      {selectedItem && (
        <EvaluasiReviewModal
          item={selectedItem}
          role={role}
          onClose={() => setSelectedItem(null)}
          onUpdated={() => fetchData(true)}
        />
      )}
    </div>
  );
}
