"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileCheck2,
  GraduationCap,
  RefreshCw,
  RotateCcw,
  Search,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import SuperadminPesertaModal, {
  type SuperadminPesertaItem,
} from "@/components/superadmin/SuperadminPesertaModal";
import PaginationFooter from "@/components/dashboard/PaginationFooter";
import { TablePageSkeleton } from "@/components/dashboard/skeletons";
import { showToast } from "@/components/ui/toastDashboard";
import { normalizeFormasiKey } from "@/lib/formasiMentor";
import {
  buildPesertaFilterSummary,
  BULAN_OPTIONS,
  collectAvailableYears,
  FilterBulan,
  FilterTahun,
  getJwtUserSummary,
  getMentorFilterKey,
  matchesPeriodeFilter,
} from "@/lib/pesertaFilter";
import { isPkpaPeserta } from "@/lib/pesertaKategori";
import { downloadPesertaLengkapPdf } from "@/lib/pesertaPdf";
import { fetchFormasi } from "@/services/formasiService";

/* ================= TYPES & CONSTANTS ================= */

type SuratSelesaiItem = {
  email: string;
  file?: string;
  tanggalKirim?: string;
};

type FilterTab =
  | "Semua"
  | "Sedang Magang"
  | "Belum Waktu Magang"
  | "Selesai"
  | "Tanpa Mentor";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const ITEMS_PER_PAGE = 10;

function getTodayWibIso(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

function getEffectiveStatusMagang(p: SuperadminPesertaItem): string {
  if (p.statusMagang === "Tidak Magang") return "Tidak Magang";
  if (p.tanggalMulaiMagang && p.tanggalSelesaiMagang) {
    const todayIso = getTodayWibIso();
    if (todayIso < p.tanggalMulaiMagang) return "Belum Waktu Magang";
    if (todayIso <= p.tanggalSelesaiMagang) return "Sedang Magang";
    return "Selesai";
  }
  return p.statusMagang || "Menunggu";
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "Sedang Magang":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
    case "Belum Waktu Magang":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
    case "Selesai":
      return "bg-sky-50 text-[#0284c7] border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  }
}

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

/* ================= COMPONENT ================= */

export default function ViewPesertaSuperadminPage() {
  const router = useRouter();

  const [data, setData] = useState<SuperadminPesertaItem[]>([]);
  const [suratSelesaiMap, setSuratSelesaiMap] = useState<
    Record<string, SuratSelesaiItem>
  >({});
  const [sertifikatMap, setSertifikatMap] = useState<
    Record<string, SuratSelesaiItem>
  >({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("Semua");
  const [filterMentor, setFilterMentor] = useState("semua");
  const [filterFormasi, setFilterFormasi] = useState("semua");
  const [filterBulan, setFilterBulan] = useState<FilterBulan>("semua");
  const [filterTahun, setFilterTahun] = useState<FilterTahun>("semua");
  const [formasiApiTitles, setFormasiApiTitles] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedPeserta, setSelectedPeserta] =
    useState<SuperadminPesertaItem | null>(null);

  /* ================= FETCH ================= */

  const fetchPeserta = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [resPeserta, resSurat, resSertifikat] = await Promise.all([
        fetch(`${API_BASE}/superadmin/peserta/disetujui`, { headers }),
        fetch(`${API_BASE}/surat-selesai/all`, { headers }).catch(() => null),
        fetch(`${API_BASE}/sertifikat/all`, { headers }).catch(() => null),
      ]);

      if (!resPeserta.ok) {
        throw new Error("Gagal mengambil data peserta disetujui");
      }

      const jsonPeserta = await resPeserta.json();
      setData(Array.isArray(jsonPeserta) ? jsonPeserta : []);

      if (resSurat && resSurat.ok) {
        const jsonSurat = await resSurat.json();
        const map: Record<string, SuratSelesaiItem> = {};
        if (Array.isArray(jsonSurat)) {
          for (const item of jsonSurat) {
            if (item?.email) {
              map[item.email.trim().toLowerCase()] = item;
            }
          }
        }
        setSuratSelesaiMap(map);
      }

      if (resSertifikat && resSertifikat.ok) {
        const jsonSertifikat = await resSertifikat.json();
        const map: Record<string, SuratSelesaiItem> = {};
        if (Array.isArray(jsonSertifikat)) {
          for (const item of jsonSertifikat) {
            if (item?.email) {
              map[item.email.trim().toLowerCase()] = item;
            }
          }
        }
        setSertifikatMap(map);
      }
    } catch {
      showToast.error("Gagal memuat data peserta disetujui");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPeserta();
    fetchFormasi()
      .then((list) => {
        if (Array.isArray(list)) {
          setFormasiApiTitles(list.map((f) => f.title).filter(Boolean));
        }
      })
      .catch(() => {});
  }, [fetchPeserta]);

  /* ================= STATS & FILTERING ================= */

  const stats = useMemo(() => {
    let sedangMagang = 0;
    let belumMulai = 0;
    let selesai = 0;
    let tanpaMentor = 0;
    let suratTerkirim = 0;

    for (const p of data) {
      const effectiveStatus = getEffectiveStatusMagang(p);
      if (effectiveStatus === "Sedang Magang") sedangMagang += 1;
      else if (effectiveStatus === "Belum Waktu Magang") belumMulai += 1;
      else if (effectiveStatus === "Selesai") selesai += 1;

      if (!p.mentor) tanpaMentor += 1;
      if (p.email && suratSelesaiMap[p.email.trim().toLowerCase()]) {
        suratTerkirim += 1;
      }
    }

    return {
      Semua: data.length,
      "Sedang Magang": sedangMagang,
      "Belum Waktu Magang": belumMulai,
      Selesai: selesai,
      "Tanpa Mentor": tanpaMentor,
      suratTerkirim,
    };
  }, [data, suratSelesaiMap]);

  const mentorOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of data) {
      if (!p.mentor?.name) continue;
      const key = getMentorFilterKey(p.mentor);
      if (key && !map.has(key)) {
        map.set(key, p.mentor.name);
      }
    }
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "id-ID"));
  }, [data]);

  const formasiOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const title of formasiApiTitles) {
      const norm = normalizeFormasiKey(title);
      if (norm && !map.has(norm)) map.set(norm, title.trim());
    }
    for (const p of data) {
      const pos = p.posisi?.trim();
      if (!pos) continue;
      const norm = normalizeFormasiKey(pos);
      if (norm && !map.has(norm)) map.set(norm, pos);
    }
    return Array.from(map.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [data, formasiApiTitles]);

  const availableYears = useMemo(() => collectAvailableYears(data), [data]);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();

    return data.filter((p) => {
      const effectiveStatus = getEffectiveStatusMagang(p);

      if (filterTab === "Tanpa Mentor" && p.mentor) return false;
      if (
        filterTab !== "Semua" &&
        filterTab !== "Tanpa Mentor" &&
        effectiveStatus !== filterTab
      ) {
        return false;
      }

      if (filterMentor === "tanpa_mentor" && p.mentor) return false;
      if (
        filterMentor !== "semua" &&
        filterMentor !== "tanpa_mentor" &&
        getMentorFilterKey(p.mentor) !== filterMentor
      ) {
        return false;
      }

      if (
        filterFormasi !== "semua" &&
        normalizeFormasiKey(p.posisi) !== filterFormasi
      ) {
        return false;
      }

      if (!matchesPeriodeFilter(p, filterBulan, filterTahun)) {
        return false;
      }

      if (!q) return true;

      return (
        p.nama?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.wa?.toLowerCase().includes(q) ||
        p.posisi?.toLowerCase().includes(q) ||
        p.jurusan?.toLowerCase().includes(q) ||
        p.mentor?.name?.toLowerCase().includes(q)
      );
    });
  }, [
    data,
    search,
    filterTab,
    filterMentor,
    filterFormasi,
    filterBulan,
    filterTahun,
  ]);

  const hasActiveFilters =
    Boolean(search.trim()) ||
    filterTab !== "Semua" ||
    filterMentor !== "semua" ||
    filterFormasi !== "semua" ||
    filterBulan !== "semua" ||
    filterTahun !== "semua";

  const handleResetFilters = () => {
    setSearch("");
    setFilterTab("Semua");
    setFilterMentor("semua");
    setFilterFormasi("semua");
    setFilterBulan("semua");
    setFilterTahun("semua");
    setCurrentPage(1);
  };

  const totalPages = Math.max(
    1,
    Math.ceil(filteredData.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, safePage]);

  /* ================= NAVIGATION HANDLERS ================= */

  const handleViewLogbook = (email: string) => {
    router.push(
      `/dashboard/superadmin/ViewLogbook?email=${encodeURIComponent(email)}`,
    );
  };

  const handleViewLaporanAkhir = (email: string) => {
    router.push(
      `/dashboard/superadmin/ViewLaporanAkhir?email=${encodeURIComponent(email)}`,
    );
  };

  const handleDownloadPdf = async () => {
    if (filteredData.length === 0) {
      showToast.error("Tidak ada data peserta untuk diunduh");
      return;
    }

    try {
      setExportingPdf(true);
      const user = getJwtUserSummary();
      const filterSummary = buildPesertaFilterSummary({
        filterTab,
        filterMentor,
        mentorOptions,
        filterFormasi,
        formasiOptions,
        filterBulan,
        filterTahun,
        search,
      });

      await downloadPesertaLengkapPdf(
        filteredData.map((p) => ({
          ...p,
          statusMagang: getEffectiveStatusMagang(p),
        })),
        {
          title: "DATA LENGKAP PESERTA MAGANG",
          subtitle: "Balai Besar Pengawas Obat dan Makanan di Palembang",
          roleLabel: "Superadmin",
          printedByName: user.name || "Superadmin",
          printedByDetail: user.email,
          filterSummary,
          fileName: `Data-Peserta-Magang-Superadmin-${new Date().toISOString().slice(0, 10)}.pdf`,
        },
      );
      showToast.success("PDF data peserta berhasil diunduh");
    } catch (err) {
      console.error("Error export PDF peserta superadmin:", err);
      showToast.error("Gagal membuat file PDF data peserta");
    } finally {
      setExportingPdf(false);
    }
  };

  /* ================= RENDER ================= */

  if (loading) {
    return (
      <TablePageSkeleton
        title="Data Peserta Disetujui"
        subtitle="Memuat daftar peserta magang yang telah disetujui..."
        columnsCount={6}
        rowsCount={8}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Data Peserta Disetujui
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pantau peserta aktif, mentor pembimbing, logbook, laporan akhir, dan
            pengiriman surat selesai magang
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => fetchPeserta(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-60"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={exportingPdf || filteredData.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            {exportingPdf ? "Menyiapkan PDF..." : "Unduh PDF"}
          </button>
        </div>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl p-5 bg-linear-to-br from-[#0284c7] to-blue-700 text-white shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-sky-100">
                Total Peserta Disetujui
              </p>
              <p className="text-3xl font-extrabold tracking-tight mt-2">
                {stats.Semua}
              </p>
              <p className="text-[11px] text-sky-100 mt-1.5">
                {stats.suratTerkirim} surat selesai telah terkirim
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
                Sedang Magang
              </p>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mt-2">
                {stats["Sedang Magang"]}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Aktif melaksanakan magang
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Belum Mulai
              </p>
              <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight mt-2">
                {stats["Belum Waktu Magang"]}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Menunggu jadwal mulai magang
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
                Selesai / Tanpa Mentor
              </p>
              <p className="text-3xl font-extrabold text-[#0284c7] dark:text-sky-400 tracking-tight mt-2">
                {stats.Selesai}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                {stats["Tanpa Mentor"]} peserta belum memiliki mentor
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* ================= FILTER & SEARCH ================= */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 p-3.5 space-y-3">
        {/* Baris 1: Tab Status + Reset */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                "Semua",
                "Sedang Magang",
                "Belum Waktu Magang",
                "Selesai",
                "Tanpa Mentor",
              ] as FilterTab[]
            ).map((tab) => {
              const active = filterTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setFilterTab(tab);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition inline-flex items-center gap-1.5 ${
                    active
                      ? "bg-[#0284c7] text-white shadow-xs"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{tab}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {stats[tab]}
                  </span>
                </button>
              );
            })}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#0284c7]" />
              Reset Filter
            </button>
          )}
        </div>

        {/* Baris 2: Pencarian, Filter Mentor, Formasi, & Periode Magang */}
        <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
          {/* Pencarian */}
          <div className="relative lg:col-span-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama, email, posisi, mentor..."
              className="w-full h-10 pl-9 pr-9 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCurrentPage(1);
                }}
                aria-label="Hapus pencarian"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Mentor */}
          <div className="lg:col-span-2 h-10 inline-flex items-center gap-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-[#0284c7]/40 focus-within:border-[#0284c7]">
            <UserCheck className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
            <select
              aria-label="Filter berdasarkan mentor"
              value={filterMentor}
              onChange={(e) => {
                setFilterMentor(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs font-semibold bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer truncate"
            >
              <option
                value="semua"
                className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
              >
                Semua Mentor
              </option>
              <option
                value="tanpa_mentor"
                className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
              >
                Belum Ditetapkan
              </option>
              {mentorOptions.map((m) => (
                <option
                  key={m.value}
                  value={m.value}
                  className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                >
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Formasi */}
          <div className="lg:col-span-2 h-10 inline-flex items-center gap-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-[#0284c7]/40 focus-within:border-[#0284c7]">
            <Briefcase className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
            <select
              aria-label="Filter berdasarkan formasi"
              value={filterFormasi}
              onChange={(e) => {
                setFilterFormasi(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs font-semibold bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer truncate"
            >
              <option
                value="semua"
                className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
              >
                Semua Formasi
              </option>
              {formasiOptions.map((f) => (
                <option
                  key={f.value}
                  value={f.value}
                  className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                >
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Bulan Periode Magang */}
          <div className="lg:col-span-2 h-10 inline-flex items-center gap-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-[#0284c7]/40 focus-within:border-[#0284c7]">
            <Calendar className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
            <select
              aria-label="Filter bulan periode magang"
              value={filterBulan}
              onChange={(e) => {
                const val = e.target.value;
                setFilterBulan(val === "semua" ? "semua" : Number(val));
                setCurrentPage(1);
              }}
              className="w-full text-xs font-semibold bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
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
          <div className="lg:col-span-2 h-10 inline-flex items-center gap-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-[#0284c7]/40 focus-within:border-[#0284c7]">
            <Calendar className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
            <select
              aria-label="Filter tahun periode magang"
              value={filterTahun}
              onChange={(e) => {
                const val = e.target.value;
                setFilterTahun(val === "semua" ? "semua" : Number(val));
                setCurrentPage(1);
              }}
              className="w-full text-xs font-semibold bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
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
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Peserta</th>
                <th className="py-3.5 px-4">Posisi &amp; Jurusan</th>
                <th className="py-3.5 px-4">Mentor</th>
                <th className="py-3.5 px-4">Periode &amp; Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-14 px-4 text-center text-slate-500 dark:text-slate-400"
                  >
                    <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-200">
                      Tidak ada peserta yang sesuai
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="mt-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white transition"
                      >
                        Reset Filter
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedData.map((p, idx) => {
                  const rowNo = (safePage - 1) * ITEMS_PER_PAGE + idx + 1;
                  const effectiveStatus = getEffectiveStatusMagang(p);
                  const hasSuratSelesai = Boolean(
                    p.email && suratSelesaiMap[p.email.trim().toLowerCase()],
                  );
                  const hasSertifikat = Boolean(
                    p.email && sertifikatMap[p.email.trim().toLowerCase()],
                  );

                  return (
                    <tr
                      key={`${p.pendaftaranId}-${p.pesertaId || p.email}-${idx}`}
                      className="hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {rowNo}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#0284c7] to-blue-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
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
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {p.email}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-[11px] text-slate-400">
                                {p.wa}
                              </span>
                              {hasSuratSelesai && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                                  <FileCheck2 className="w-3 h-3" />
                                  Surat Selesai
                                </span>
                              )}
                              {hasSertifikat && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800">
                                  <Award className="w-3 h-3" />
                                  Sertifikat
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1 text-xs">
                          <p className="font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                            <span>{p.posisi || "-"}</span>
                          </p>
                          <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{p.jurusan || "-"}</span>
                          </p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        {p.mentor ? (
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-100">
                              {p.mentor.name}
                            </p>
                            {p.mentor.email && (
                              <p className="text-[11px] text-slate-400">
                                {p.mentor.email}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
                            Belum Ditetapkan
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5 text-xs">
                          <p className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {p.tanggalMulaiMagang || "-"} s/d{" "}
                              {p.tanggalSelesaiMagang || "-"}
                            </span>
                          </p>
                          <div>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${getStatusBadgeClass(
                                effectiveStatus,
                              )}`}
                            >
                              {effectiveStatus}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedPeserta(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white shadow-xs transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <PaginationFooter
          currentPage={safePage}
          totalItems={filteredData.length}
          itemsPerPage={ITEMS_PER_PAGE}
          itemLabel="peserta"
          onPageChange={setCurrentPage}
        />
      </div>

      {/* ================= MODAL ================= */}
      {selectedPeserta && (
        <SuperadminPesertaModal
          peserta={selectedPeserta}
          onClose={() => setSelectedPeserta(null)}
          onViewLogbook={handleViewLogbook}
          onViewLaporanAkhir={handleViewLaporanAkhir}
          onSuratSelesaiSuccess={() => fetchPeserta(true)}
        />
      )}
    </div>
  );
}
