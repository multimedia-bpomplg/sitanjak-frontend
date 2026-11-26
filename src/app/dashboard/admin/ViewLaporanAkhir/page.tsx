"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  RefreshCw,
  RotateCcw,
  Search,
  X,
  XCircle,
} from "lucide-react";
import AdminLaporanAkhirModal, {
  type AdminLaporanAkhirItem,
} from "@/components/admin/AdminLaporanAkhirModal";
import LaporanAkhirFilterControls, {
  buildLaporanAkhirFilterSummary,
  matchesProgramAndFormasiFilter,
  type ProgramFilter,
} from "@/components/Laporan/LaporanAkhirFilterControls";
import { buildFormasiOptions } from "@/components/logbook/LogbookFilterToolbar";
import PaginationFooter from "@/components/dashboard/PaginationFooter";
import { TablePageSkeleton } from "@/components/dashboard/skeletons";
import { showToast } from "@/components/ui/toastDashboard";
import { getJwtUserSummary, getMentorFilterKey } from "@/lib/pesertaFilter";
import { isPkpaPeserta } from "@/lib/pesertaKategori";
import { fetchFormasi, type IFormasi } from "@/services/formasiService";

/* ================= TYPES ================= */

type FilterTab = "Semua" | "Menunggu" | "Disetujui" | "Revisi" | "Ditolak";

/* ================= CONSTANTS ================= */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
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

function getStatusBadge(status: string) {
  switch (status) {
    case "Disetujui":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
    case "Ditolak":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800";
    case "Revisi":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
    default:
      return "bg-sky-50 text-[#0284c7] border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800";
  }
}

/* ================= COMPONENT ================= */

export default function ViewLaporanAkhirAdminPage() {
  const [laporanList, setLaporanList] = useState<AdminLaporanAkhirItem[]>([]);
  const [formasiTitles, setFormasiTitles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("Semua");
  const [filterMentor, setFilterMentor] = useState("semua");
  const [filterFormasi, setFilterFormasi] = useState("semua");
  const [filterProgram, setFilterProgram] = useState<ProgramFilter>("semua");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedLaporan, setSelectedLaporan] =
    useState<AdminLaporanAkhirItem | null>(null);

  const deepLinkHandledRef = useRef(false);

  /* ================= FETCH ================= */

  const loadData = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const token = localStorage.getItem("token");
      const [res, formasi] = await Promise.all([
        fetch(`${API_BASE}/admin/laporan-akhir`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetchFormasi().catch(() => [] as IFormasi[]),
      ]);

      if (!res.ok) {
        throw new Error("Gagal memuat laporan akhir");
      }

      const json = await res.json();
      setLaporanList(Array.isArray(json) ? json : []);
      setFormasiTitles(
        Array.isArray(formasi) ? formasi.map((f) => f.title).filter(Boolean) : [],
      );
    } catch (err) {
      console.error("Load ViewLaporanAkhir error:", err);
      showToast.error("Gagal memuat data laporan akhir");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ================= HANDLE DEEP LINK ?email= ================= */

  useEffect(() => {
    if (deepLinkHandledRef.current || laporanList.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email")?.trim().toLowerCase();
    if (!emailParam) {
      deepLinkHandledRef.current = true;
      return;
    }

    deepLinkHandledRef.current = true;
    setSearch(emailParam);
    const match = laporanList.find(
      (l) => l.user?.email?.trim().toLowerCase() === emailParam,
    );
    if (match) {
      setSelectedLaporan(match);
    }
  }, [laporanList]);

  /* ================= STATS & FILTERING ================= */

  const mentorOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of laporanList) {
      const m = item.mentor || item.approvedByMentor || null;
      if (!m?.name) continue;
      const key = getMentorFilterKey(m);
      if (key && !map.has(key)) {
        map.set(key, m.name);
      }
    }
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "id-ID"));
  }, [laporanList]);

  const formasiOptions = useMemo(
    () => buildFormasiOptions(laporanList, formasiTitles),
    [laporanList, formasiTitles],
  );

  const scopedList = useMemo(() => {
    return laporanList.filter((item) => {
      const resolvedMentor = item.mentor || item.approvedByMentor || null;

      if (filterMentor === "tanpa_mentor" && resolvedMentor) return false;
      if (
        filterMentor !== "semua" &&
        filterMentor !== "tanpa_mentor" &&
        getMentorFilterKey(resolvedMentor) !== filterMentor
      ) {
        return false;
      }

      return matchesProgramAndFormasiFilter(item, filterFormasi, filterProgram);
    });
  }, [laporanList, filterMentor, filterFormasi, filterProgram]);

  const stats = useMemo(() => {
    const counts: Record<FilterTab, number> = {
      Semua: scopedList.length,
      Menunggu: 0,
      Disetujui: 0,
      Revisi: 0,
      Ditolak: 0,
    };
    let ratedCount = 0;

    for (const item of scopedList) {
      if (item.status === "Disetujui") counts.Disetujui += 1;
      else if (item.status === "Revisi") counts.Revisi += 1;
      else if (item.status === "Ditolak") counts.Ditolak += 1;
      else counts.Menunggu += 1;

      if (item.penilaian && Object.values(item.penilaian).some(Boolean)) {
        ratedCount += 1;
      }
    }

    return { counts, ratedCount };
  }, [scopedList]);

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();

    return scopedList.filter((item) => {
      const resolvedMentor = item.mentor || item.approvedByMentor || null;

      if (filterTab !== "Semua") {
        const normalized =
          item.status === "Disetujui" ||
          item.status === "Revisi" ||
          item.status === "Ditolak"
            ? item.status
            : "Menunggu";
        if (normalized !== filterTab) return false;
      }

      if (!q) return true;
      return (
        item.user?.name?.toLowerCase().includes(q) ||
        item.user?.email?.toLowerCase().includes(q) ||
        item.judul?.toLowerCase().includes(q) ||
        item.posisi?.toLowerCase().includes(q) ||
        item.jurusan?.toLowerCase().includes(q) ||
        item.asal?.nama?.toLowerCase().includes(q) ||
        resolvedMentor?.name?.toLowerCase().includes(q)
      );
    });
  }, [scopedList, search, filterTab]);

  const hasActiveFilters =
    Boolean(search.trim()) ||
    filterTab !== "Semua" ||
    filterMentor !== "semua" ||
    filterFormasi !== "semua" ||
    filterProgram !== "semua";

  const handleResetFilters = () => {
    setSearch("");
    setFilterTab("Semua");
    setFilterMentor("semua");
    setFilterFormasi("semua");
    setFilterProgram("semua");
    setCurrentPage(1);
  };

  const totalPages = Math.max(
    1,
    Math.ceil(filteredList.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);

  const paginatedList = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredList.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredList, safePage]);

  /* ================= EXPORTS ================= */

  const handleDownloadAllPDF = async () => {
    if (filteredList.length === 0) {
      showToast.error("Tidak ada laporan untuk diunduh");
      return;
    }

    setDownloadingPdf(true);
    const toastId = showToast.loading("Menyiapkan laporan PDF...");

    try {
      const token = localStorage.getItem("token");
      const user = getJwtUserSummary();
      const filterSummary = buildLaporanAkhirFilterSummary({
        filterTab,
        filterMentor,
        mentorOptions,
        filterFormasi,
        formasiOptions,
        filterProgram,
        search,
      });
      const printedByLabel = user.name
        ? `Admin: ${user.name}${user.email ? ` (${user.email})` : ""}`
        : user.email
          ? `Admin: ${user.email}`
          : "Admin";

      const res = await fetch(
        `${API_BASE}/superadmin/laporan-akhir/download-all-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            laporanList: filteredList,
            totalPeserta: filteredList.length,
            date: new Date().toISOString(),
            filterSummary,
            printedByLabel,
          }),
        },
      );

      if (!res.ok) throw new Error("Gagal mengunduh PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateStamp = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Jakarta",
      });
      a.download = `Laporan-Akhir-Peserta-Magang-${dateStamp}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      showToast.updateSuccess(toastId, "Laporan PDF berhasil diunduh");
    } catch {
      showToast.updateError(toastId, "Gagal mengunduh PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  /* ================= RENDER ================= */

  if (loading) {
    return (
      <TablePageSkeleton
        title="Laporan Akhir Peserta"
        subtitle="Memuat daftar laporan akhir dan penilaian mentor..."
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
            Laporan Akhir Peserta
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tinjau dokumen laporan akhir magang, hasil verifikasi mentor, serta
            unduh rekapitulasi PDF
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-60"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <button
            type="button"
            disabled={downloadingPdf || filteredList.length === 0}
            onClick={handleDownloadAllPDF}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white shadow-xs transition disabled:opacity-60 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            {downloadingPdf ? "Menyiapkan PDF..." : "Unduh PDF"}
          </button>
        </div>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl p-5 bg-linear-to-br from-[#0284c7] to-blue-700 text-white shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-sky-100">
                Total Laporan Akhir
              </p>
              <p className="text-3xl font-extrabold tracking-tight mt-2">
                {stats.counts.Semua}
              </p>
              <p className="text-[11px] text-sky-100 mt-1.5">
                {stats.ratedCount} laporan sudah memiliki penilaian
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Menunggu Review Mentor
              </p>
              <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight mt-2">
                {stats.counts.Menunggu}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Belum disetujui atau ditolak
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
                Disetujui
              </p>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mt-2">
                {stats.counts.Disetujui}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Laporan akhir diterima
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
                Revisi / Ditolak
              </p>
              <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight mt-2">
                {stats.counts.Revisi + stats.counts.Ditolak}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                {stats.counts.Revisi} revisi • {stats.counts.Ditolak} ditolak
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* ================= FILTER & SEARCH ================= */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              ["Semua", "Menunggu", "Disetujui", "Revisi", "Ditolak"] as FilterTab[]
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
                    {stats.counts[tab]}
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

        <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama, judul, posisi, jurusan, atau mentor..."
              className="w-full h-9 pl-9 pr-9 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
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

          <LaporanAkhirFilterControls
            showMentorFilter
            filterMentor={filterMentor}
            onMentorChange={(next) => {
              setFilterMentor(next);
              setCurrentPage(1);
            }}
            mentorOptions={mentorOptions}
            filterFormasi={filterFormasi}
            onFormasiChange={(next) => {
              setFilterFormasi(next);
              setCurrentPage(1);
            }}
            formasiOptions={formasiOptions}
            filterProgram={filterProgram}
            onProgramChange={(next) => {
              setFilterProgram(next);
              setCurrentPage(1);
            }}
          />
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
                <th className="py-3.5 px-4">Judul Laporan</th>
                <th className="py-3.5 px-4">Tanggal Unggah</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {paginatedList.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-14 px-4 text-center text-slate-500 dark:text-slate-400"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="font-semibold text-slate-700 dark:text-slate-200">
                        Tidak ada laporan akhir yang sesuai
                      </p>
                      <p className="text-xs text-slate-400">
                        Ubah filter status, mentor, atau kata kunci pencarian.
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white transition"
                        >
                          Reset Filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedList.map((item, idx) => {
                  const rowNo = (safePage - 1) * ITEMS_PER_PAGE + idx + 1;
                  const hasPenilaian = Boolean(
                    item.penilaian && Object.values(item.penilaian).some(Boolean),
                  );

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {rowNo}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#0284c7] to-blue-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {getInitials(item.user?.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-slate-900 dark:text-white truncate">
                                {item.user?.name || "Tanpa Nama"}
                              </p>
                              {isPkpaPeserta({ jurusan: item.jurusan }) ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800 shrink-0">
                                  PKPA
                                </span>
                              ) : item.jurusan || item.posisi ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 shrink-0">
                                  Reguler
                                </span>
                              ) : null}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {item.user?.email || "-"}
                            </p>
                            {item.posisi && (
                              <p className="text-[11px] text-[#0284c7] dark:text-sky-400 font-medium truncate">
                                {item.posisi}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {item.judul || item.fileName || "Laporan Akhir Magang"}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span>
                            Mentor:{" "}
                            {(item.mentor || item.approvedByMentor)?.name ||
                              "Belum ditetapkan"}
                          </span>
                          {hasPenilaian && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 font-semibold">
                              Sudah Dinilai
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                        {new Date(item.createdAt).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${getStatusBadge(
                            item.status,
                          )}`}
                        >
                          {item.status || "Menunggu"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedLaporan(item)}
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
          totalItems={filteredList.length}
          itemsPerPage={ITEMS_PER_PAGE}
          itemLabel="laporan akhir"
          onPageChange={setCurrentPage}
        />
      </div>

      {/* ================= MODAL ================= */}
      {selectedLaporan && (
        <AdminLaporanAkhirModal
          laporan={selectedLaporan}
          onClose={() => setSelectedLaporan(null)}
        />
      )}
    </div>
  );
}
