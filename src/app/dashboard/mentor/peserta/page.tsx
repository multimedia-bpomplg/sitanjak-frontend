"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import PesertaDetailModal from "@/components/peserta/PesertaDetailModal";
import { TablePageSkeleton } from "@/components/dashboard/skeletons";
import { showToast } from "@/components/ui/toastDashboard";
import { isPkpaPeserta } from "@/lib/pesertaKategori";
import { downloadPesertaLengkapPdf } from "@/lib/pesertaPdf";
import type { Peserta } from "@/types/peserta";

type InternshipPhase =
  | "belum_mulai"
  | "sedang_magang"
  | "selesai"
  | "tidak_magang";

type FilterPhase = "semua" | "sedang_magang" | "belum_mulai" | "selesai";
type FilterBulan = "semua" | number;
type FilterTahun = "semua" | number;

const BULAN_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

type PesertaRow = Peserta & {
  phase?: InternshipPhase;
  logbookStats?: {
    total: number;
    menunggu: number;
    revisi: number;
    disetujui: number;
    ditolak: number;
  };
};

type SummaryResponse = {
  mentor?: {
    name: string;
    email: string;
    posisiMentor?: string;
  } | null;
  summary: {
    totalPeserta: number;
    sedangMagang: number;
    belumMulai: number;
    selesaiMagang: number;
    pesertaDenganLogbookMenunggu: number;
  };
  peserta: PesertaRow[];
};

const ITEMS_PER_PAGE = 10;

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

function formatShortDate(dateStr?: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function extractYearMonth(
  dateStr?: string,
): { year: number; month: number } | null {
  if (!dateStr) return null;
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr.trim());
  if (isoMatch) {
    return {
      year: Number(isoMatch[1]),
      month: Number(isoMatch[2]),
    };
  }
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return null;
  return {
    year: parsed.getFullYear(),
    month: parsed.getMonth() + 1,
  };
}

function getPesertaYearMonthRange(
  peserta: Pick<Peserta, "tanggalMulaiMagang" | "tanggalSelesaiMagang">,
): { minYm: number; maxYm: number } | null {
  const start = extractYearMonth(peserta.tanggalMulaiMagang);
  const end = extractYearMonth(peserta.tanggalSelesaiMagang);
  if (!start && !end) return null;

  const s = start ?? end!;
  const e = end ?? start!;
  const sYm = s.year * 12 + (s.month - 1);
  const eYm = e.year * 12 + (e.month - 1);
  return {
    minYm: Math.min(sYm, eYm),
    maxYm: Math.max(sYm, eYm),
  };
}

function matchesPeriodeFilter(
  peserta: Pick<Peserta, "tanggalMulaiMagang" | "tanggalSelesaiMagang">,
  bulan: FilterBulan,
  tahun: FilterTahun,
): boolean {
  if (bulan === "semua" && tahun === "semua") return true;

  const range = getPesertaYearMonthRange(peserta);
  if (!range) return false;

  const { minYm, maxYm } = range;

  if (tahun !== "semua" && bulan !== "semua") {
    const targetYm = tahun * 12 + (bulan - 1);
    return targetYm >= minYm && targetYm <= maxYm;
  }

  if (tahun !== "semua") {
    const yearStartYm = tahun * 12;
    const yearEndYm = tahun * 12 + 11;
    return maxYm >= yearStartYm && minYm <= yearEndYm;
  }

  if (maxYm - minYm >= 11) return true;
  const startYear = Math.floor(minYm / 12);
  const endYear = Math.floor(maxYm / 12);
  for (let y = startYear; y <= endYear; y++) {
    const candidateYm = y * 12 + ((bulan as number) - 1);
    if (candidateYm >= minYm && candidateYm <= maxYm) {
      return true;
    }
  }
  return false;
}

function getPhaseBadge(phase?: InternshipPhase) {
  switch (phase) {
    case "sedang_magang":
      return {
        label: "Sedang Magang",
        className:
          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/70",
      };
    case "belum_mulai":
      return {
        label: "Belum Mulai",
        className:
          "bg-sky-50 text-[#0284c7] border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/70",
      };
    case "selesai":
      return {
        label: "Selesai",
        className:
          "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      };
    case "tidak_magang":
      return {
        label: "Tidak Magang",
        className:
          "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/70",
      };
    default:
      return {
        label: "Aktif",
        className:
          "bg-sky-50 text-[#0284c7] border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/70",
      };
  }
}

export default function MentorPesertaPage() {
  const [data, setData] = useState<PesertaRow[]>([]);
  const [mentorInfo, setMentorInfo] = useState<SummaryResponse["mentor"]>(null);
  const [summary, setSummary] = useState<SummaryResponse["summary"]>({
    totalPeserta: 0,
    sedangMagang: 0,
    belumMulai: 0,
    selesaiMagang: 0,
    pesertaDenganLogbookMenunggu: 0,
  });
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activePhase, setActivePhase] = useState<FilterPhase>("semua");
  const [filterBulan, setFilterBulan] = useState<FilterBulan>("semua");
  const [filterTahun, setFilterTahun] = useState<FilterTahun>("semua");
  const [page, setPage] = useState(1);

  const [openModal, setOpenModal] = useState(false);
  const [selectedPeserta, setSelectedPeserta] = useState<Peserta | null>(null);

  const fetchPeserta = useCallback(async () => {
    setLoading(true);
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
        throw new Error("Gagal mengambil data peserta bimbingan");
      }

      const json: SummaryResponse = await res.json();
      const list = json.peserta || [];
      setMentorInfo(json.mentor || null);
      setData(list);
      setSummary(
        json.summary || {
          totalPeserta: list.length,
          sedangMagang: 0,
          belumMulai: 0,
          selesaiMagang: 0,
          pesertaDenganLogbookMenunggu: 0,
        },
      );

      // Buka otomatis modal detail jika ada query ?email=...
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const emailParam = params.get("email");
        if (emailParam) {
          const matched = list.find(
            (p) => p.email?.toLowerCase() === emailParam.toLowerCase(),
          );
          if (matched) {
            setSelectedPeserta(matched);
            setOpenModal(true);
          }
        }
      }
    } catch (err: unknown) {
      console.error("Error fetch peserta bimbingan:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memuat data peserta.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPeserta();
  }, [fetchPeserta]);

  const availableYears = useMemo(() => {
    const years = new Set<number>([new Date().getFullYear()]);
    for (const p of data) {
      const range = getPesertaYearMonthRange(p);
      if (!range) continue;
      const startYear = Math.floor(range.minYm / 12);
      const endYear = Math.floor(range.maxYm / 12);
      for (let y = startYear; y <= endYear; y++) {
        years.add(y);
      }
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [data]);

  const periodFilteredData = useMemo(() => {
    return data.filter((p) =>
      matchesPeriodeFilter(p, filterBulan, filterTahun),
    );
  }, [data, filterBulan, filterTahun]);

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return periodFilteredData.filter((p) => {
      if (activePhase !== "semua" && p.phase !== activePhase) {
        return false;
      }
      if (!q) return true;
      return (
        p.nama?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.posisi?.toLowerCase().includes(q) ||
        p.jurusan?.toLowerCase().includes(q) ||
        p.asal?.nama?.toLowerCase().includes(q)
      );
    });
  }, [periodFilteredData, activePhase, searchQuery]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setActivePhase("semua");
    setFilterBulan("semua");
    setFilterTahun("semua");
    setPage(1);
  };

  const totalPage = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPage);
  const paginatedData = filteredData.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );
  const hasPeriodFilter = filterBulan !== "semua" || filterTahun !== "semua";
  const hasActiveFilters =
    Boolean(searchQuery.trim()) || activePhase !== "semua" || hasPeriodFilter;

  const handleOpenDetail = (peserta: PesertaRow) => {
    setSelectedPeserta(peserta);
    setOpenModal(true);
  };

  if (loading) {
    return (
      <TablePageSkeleton
        title="Peserta Bimbingan"
        subtitle="Memuat daftar peserta magang yang berada di bawah bimbingan Anda..."
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
            Gagal Memuat Peserta Bimbingan
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
            {error}
          </p>
        </div>
        <button
          onClick={fetchPeserta}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#0284c7] hover:bg-sky-700 text-white transition"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
      </div>
    );
  }

  const filterTabs: Array<{ id: FilterPhase; label: string; count: number }> = [
    {
      id: "semua",
      label: "Semua",
      count: hasPeriodFilter ? periodFilteredData.length : summary.totalPeserta,
    },
    {
      id: "sedang_magang",
      label: "Sedang Magang",
      count: hasPeriodFilter
        ? periodFilteredData.filter((p) => p.phase === "sedang_magang").length
        : summary.sedangMagang,
    },
    {
      id: "belum_mulai",
      label: "Belum Mulai",
      count: hasPeriodFilter
        ? periodFilteredData.filter((p) => p.phase === "belum_mulai").length
        : summary.belumMulai,
    },
    {
      id: "selesai",
      label: "Selesai",
      count: hasPeriodFilter
        ? periodFilteredData.filter((p) => p.phase === "selesai").length
        : summary.selesaiMagang,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Peserta Bimbingan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Daftar lengkap dan profil peserta magang di bawah bimbingan Anda
          </p>
        </div>

        <div className="self-start sm:self-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              if (filteredData.length === 0) {
                showToast.error("Tidak ada data peserta untuk diunduh");
                return;
              }
              try {
                setExportingPdf(true);
                const activeTabLabel =
                  filterTabs.find((t) => t.id === activePhase)?.label ||
                  "Semua";
                const filterParts: string[] = [];
                if (activePhase !== "semua") {
                  filterParts.push(`Status: ${activeTabLabel}`);
                }
                if (filterBulan !== "semua") {
                  const bulanLabel =
                    BULAN_OPTIONS.find((b) => b.value === filterBulan)?.label ||
                    String(filterBulan);
                  filterParts.push(`Bulan: ${bulanLabel}`);
                }
                if (filterTahun !== "semua") {
                  filterParts.push(`Tahun: ${filterTahun}`);
                }
                if (searchQuery.trim()) {
                  filterParts.push(`Pencarian: "${searchQuery.trim()}"`);
                }

                await downloadPesertaLengkapPdf(filteredData, {
                  title: "DATA LENGKAP PESERTA BIMBINGAN MAGANG",
                  subtitle:
                    "Balai Besar Pengawas Obat dan Makanan di Palembang",
                  roleLabel: "Mentor Pembimbing",
                  printedByName: mentorInfo?.name,
                  printedByDetail:
                    mentorInfo?.posisiMentor || mentorInfo?.email,
                  filterSummary:
                    filterParts.length > 0
                      ? filterParts.join(" • ")
                      : "Semua Peserta Bimbingan",
                  fileName: `peserta-bimbingan-${new Date().toISOString().slice(0, 10)}.pdf`,
                });
                showToast.success("PDF data peserta berhasil diunduh");
              } catch (err) {
                console.error("Error export PDF peserta:", err);
                showToast.error("Gagal membuat file PDF");
              } finally {
                setExportingPdf(false);
              }
            }}
            disabled={exportingPdf || filteredData.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Download className="w-3.5 h-3.5" />
            {exportingPdf ? "Menyiapkan PDF..." : "Unduh PDF"}
          </button>

          <button
            type="button"
            onClick={fetchPeserta}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* ================= STATISTICS CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Biru (Senada Sidebar & Dashboard) */}
        <div className="rounded-2xl border border-sky-500/30 bg-linear-to-br from-[#0284c7] via-sky-600 to-blue-700 dark:from-[#0369a1] dark:to-blue-800 p-5 text-white shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-sky-100">
                Total Peserta Bimbingan
              </p>
              <p className="text-3xl font-extrabold mt-1.5">
                {summary.totalPeserta}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="mt-3 pt-2.5 border-t border-white/20 text-xs text-sky-100/90">
            Seluruh peserta magang yang ditugaskan kepada Anda
          </p>
        </div>

        {/* Card 2: Sedang Magang */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Sedang Magang
              </p>
              <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1.5">
                {summary.sedangMagang}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            {summary.pesertaDenganLogbookMenunggu > 0
              ? `${summary.pesertaDenganLogbookMenunggu} peserta memiliki logbook menunggu`
              : "Semua logbook peserta aktif sudah dicek"}
          </p>
        </div>

        {/* Card 3: Belum Mulai & Selesai */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Selesai / Belum Mulai
              </p>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1.5">
                {summary.selesaiMagang + summary.belumMulai}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0284c7] dark:bg-sky-950/60 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            {summary.selesaiMagang} selesai • {summary.belumMulai} belum mulai
          </p>
        </div>
      </div>

      {/* ================= FILTER & SEARCH BAR ================= */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 p-3.5 space-y-3">
        {/* Baris 1: Tab Status */}
        <div className="flex flex-wrap items-center gap-2">
          {filterTabs.map((tab) => {
            const active = activePhase === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActivePhase(tab.id);
                  setPage(1);
                }}
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

        {/* Baris 2: Pencarian & Filter Periode */}
        <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800 flex flex-col md:flex-row md:items-center gap-2.5">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama, email, posisi, kampus/SMK..."
              className="w-full h-10 pl-10 pr-8 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7] transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setPage(1);
                }}
                aria-label="Hapus pencarian"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
            {/* Filter Bulan Periode Magang */}
            <div className="h-10 inline-flex items-center gap-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-[#0284c7]/40 focus-within:border-[#0284c7] transition">
              <Calendar className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
              <select
                aria-label="Filter bulan periode magang"
                value={filterBulan}
                onChange={(e) => {
                  const val = e.target.value;
                  setFilterBulan(val === "semua" ? "semua" : Number(val));
                  setPage(1);
                }}
                className="text-xs font-semibold bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option
                  value="semua"
                  className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                >
                  Semua Bulan
                </option>
                {BULAN_OPTIONS.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Tahun Periode Magang */}
            <div className="h-10 inline-flex items-center gap-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-[#0284c7]/40 focus-within:border-[#0284c7] transition">
              <Calendar className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
              <select
                aria-label="Filter tahun periode magang"
                value={filterTahun}
                onChange={(e) => {
                  const val = e.target.value;
                  setFilterTahun(val === "semua" ? "semua" : Number(val));
                  setPage(1);
                }}
                className="text-xs font-semibold bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option
                  value="semua"
                  className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                >
                  Semua Tahun
                </option>
                {availableYears.map((yr) => (
                  <option
                    key={yr}
                    value={yr}
                    className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                  >
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {hasPeriodFilter && (
              <button
                type="button"
                onClick={() => {
                  setFilterBulan("semua");
                  setFilterTahun("semua");
                  setPage(1);
                }}
                className="h-10 px-3 rounded-xl text-xs font-semibold whitespace-nowrap text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Reset Periode
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      {filteredData.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 py-14 px-4 text-center space-y-3">
          <Users className="w-9 h-9 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
              {data.length === 0
                ? "Belum ada peserta bimbingan"
                : "Peserta tidak ditemukan"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {data.length === 0
                ? "Peserta akan muncul di sini setelah ditugaskan kepada Anda."
                : "Coba ubah kata kunci pencarian atau pilih filter status dan periode magang lain."}
            </p>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white transition"
            >
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-225 w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="w-[5%] py-3.5 px-4 text-center">No</th>
                  <th className="w-[26%] py-3.5 px-4 text-left">Peserta</th>
                  <th className="w-[22%] py-3.5 px-4 text-left">Kontak</th>
                  <th className="w-[17%] py-3.5 px-4 text-left">
                    Posisi & Jurusan
                  </th>
                  <th className="w-[16%] py-3.5 px-4 text-left">
                    Periode Magang
                  </th>
                  <th className="w-[14%] py-3.5 px-4 text-center">Status</th>
                  <th className="w-[12%] py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {paginatedData.map((p, idx) => {
                  const rowNumber = (safePage - 1) * ITEMS_PER_PAGE + idx + 1;
                  const phaseBadge = getPhaseBadge(p.phase);
                  const isBersama = (p.kategori || "").toLowerCase() === "bersama";

                  return (
                    <tr
                      key={p.userId || `${p.email}-${idx}`}
                      onClick={() => handleOpenDetail(p)}
                      className="hover:bg-sky-50/50 dark:hover:bg-sky-950/20 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center font-medium text-slate-500 dark:text-slate-400">
                        {rowNumber}
                      </td>

                      {/* Peserta */}
                      <td className="py-3.5 px-4 text-left">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#0284c7] to-blue-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {getInitials(p.nama)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-slate-900 dark:text-white truncate">
                                {p.nama}
                              </p>
                              {isPkpaPeserta(p) && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800 shrink-0">
                                  PKPA
                                </span>
                              )}
                            </div>
                            {p.asal?.nama ? (
                              <p className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 truncate max-w-56">
                                <Building2 className="w-3 h-3 shrink-0 text-slate-400" />
                                <span className="truncate">{p.asal.nama}</span>
                              </p>
                            ) : (
                              <p className="text-xs text-slate-400">
                                Peserta Magang
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Kontak */}
                      <td className="py-3.5 px-4 text-left">
                        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span className="truncate max-w-48">{p.email}</span>
                          </div>
                          {p.wa && (
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                              <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                              <span>{p.wa}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Posisi & Jurusan */}
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

                      {/* Periode */}
                      <td className="py-3.5 px-4 text-left">
                        <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span>
                            {formatShortDate(p.tanggalMulaiMagang)} –{" "}
                            {formatShortDate(p.tanggalSelesaiMagang)}
                          </span>
                        </div>
                      </td>

                      {/* Status & Kategori */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${phaseBadge.className}`}
                          >
                            {phaseBadge.label}
                          </span>
                          <span
                            className={`text-[11px] font-medium ${
                              isBersama
                                ? "text-[#0284c7] dark:text-sky-400"
                                : "text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {isBersama ? "Kelompok" : "Mandiri"}
                          </span>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(p)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-50 text-[#0284c7] border border-sky-200 hover:bg-[#0284c7] hover:text-white dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 dark:hover:bg-sky-600 dark:hover:text-white transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Menampilkan {(safePage - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(safePage * ITEMS_PER_PAGE, filteredData.length)} dari{" "}
              {filteredData.length} peserta
            </p>

            {totalPage > 1 && (
              <div className="flex items-center gap-2">
                <button
                  disabled={safePage === 1}
                  onClick={() => setPage(safePage - 1)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
                >
                  Sebelumnya
                </button>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 px-2">
                  {safePage} / {totalPage}
                </span>
                <button
                  disabled={safePage === totalPage}
                  onClick={() => setPage(safePage + 1)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
                >
                  Berikutnya
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL DETAIL ================= */}
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
