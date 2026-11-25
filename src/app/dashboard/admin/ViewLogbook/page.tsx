"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Download,
  RefreshCw,
  Users,
  X,
  XCircle,
} from "lucide-react";
import Calendar from "@/components/logbook/Calendar";
import LogbookFilterToolbar, {
  buildFormasiOptions,
  buildMentorOptions,
  computeScopedLogbookMonitoring,
  extractLogbookDates,
  extractLogbookYears,
  INITIAL_LOGBOOK_EXTRA_FILTERS,
  type LogbookExtraFilterState,
  type LogbookFilterTab,
} from "@/components/logbook/LogbookFilterToolbar";
import AdminLogbookModal, {
  type AdminLogbookItem,
} from "@/components/admin/AdminLogbookModal";
import PaginationFooter from "@/components/dashboard/PaginationFooter";
import { TablePageSkeleton } from "@/components/dashboard/skeletons";
import { showToast } from "@/components/ui/toastDashboard";
import { fetchFormasi, type IFormasi } from "@/services/formasiService";

/* ================= TYPES ================= */

type PesertaStat = {
  _id: string;
  name: string;
  email: string;
  posisi?: string;
  mentorName?: string;
  tanggalMulaiMagang?: string;
  tanggalSelesaiMagang?: string;
  totalLogbooks: number;
  approvedLogbooks: number;
  pendingLogbooks: number;
  rejectedLogbooks: number;
  revisiLogbooks: number;
  missedCount: number;
  missedDates: string[];
};

type FilterTab = LogbookFilterTab;

type FilledDateMap = Record<
  string,
  {
    _id: string;
    status:
      | "hadir"
      | "tidak_hadir_keterangan"
      | "tidak_hadir_tanpa_keterangan";
    approvalStatus: "menunggu" | "disetujui" | "ditolak" | "revisi";
  }
>;

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

function formatDateCompactID(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(`${dateStr}T00:00:00+07:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ================= COMPONENT ================= */

export default function ViewLogbookAdminPage() {
  const [allLogbooks, setAllLogbooks] = useState<AdminLogbookItem[]>([]);
  const [monitoringPeserta, setMonitoringPeserta] = useState<PesertaStat[]>([]);
  const [formasiTitles, setFormasiTitles] = useState<string[]>([]);
  const [holidayDates, setHolidayDates] = useState<string[]>([]);
  const [overrideWorkdays, setOverrideWorkdays] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("Semua");
  const [extraFilters, setExtraFilters] = useState<LogbookExtraFilterState>(
    INITIAL_LOGBOOK_EXTRA_FILTERS,
  );
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedPesertaId, setSelectedPesertaId] = useState<string | null>(
    null,
  );
  const [selectedLogbook, setSelectedLogbook] =
    useState<AdminLogbookItem | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const deepLinkHandledRef = useRef(false);

  /* ================= FETCH ================= */

  const loadData = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const token = localStorage.getItem("token");
      const [res, formasi] = await Promise.all([
        fetch(`${API_BASE}/admin/logbook/monitoring`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetchFormasi().catch(() => [] as IFormasi[]),
      ]);

      if (!res.ok) {
        throw new Error("Gagal memuat data logbook");
      }

      const json = await res.json();
      setAllLogbooks(Array.isArray(json?.logbooks) ? json.logbooks : []);
      setMonitoringPeserta(
        Array.isArray(json?.pesertaMonitoring) ? json.pesertaMonitoring : [],
      );
      setFormasiTitles(
        Array.isArray(formasi) ? formasi.map((f) => f.title).filter(Boolean) : [],
      );
      setHolidayDates(
        Array.isArray(json?.holidayDates) ? json.holidayDates : [],
      );
      setOverrideWorkdays(
        Array.isArray(json?.overrideWorkdays) ? json.overrideWorkdays : [],
      );
    } catch (err) {
      console.error("Load ViewLogbook error:", err);
      showToast.error("Gagal memuat data logbook peserta");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ================= GROUP PER PESERTA ================= */

  const pesertaList = useMemo<PesertaStat[]>(() => {
    if (monitoringPeserta.length > 0) {
      return monitoringPeserta;
    }

    const map = new Map<string, PesertaStat>();

    for (const lb of allLogbooks) {
      if (!lb.user?._id) continue;
      const uid = lb.user._id;
      let entry = map.get(uid);
      if (!entry) {
        entry = {
          _id: uid,
          name: lb.user.name || "Tanpa Nama",
          email: lb.user.email || "-",
          totalLogbooks: 0,
          approvedLogbooks: 0,
          pendingLogbooks: 0,
          rejectedLogbooks: 0,
          revisiLogbooks: 0,
          missedCount: 0,
          missedDates: [],
        };
        map.set(uid, entry);
      }

      entry.totalLogbooks += 1;
      if (lb.approvalStatus === "disetujui") entry.approvedLogbooks += 1;
      else if (lb.approvalStatus === "ditolak") entry.rejectedLogbooks += 1;
      else if (lb.approvalStatus === "revisi") entry.revisiLogbooks += 1;
      else entry.pendingLogbooks += 1;
    }

    return Array.from(map.values()).sort((a, b) => {
      if (b.pendingLogbooks !== a.pendingLogbooks) {
        return b.pendingLogbooks - a.pendingLogbooks;
      }
      if (b.totalLogbooks !== a.totalLogbooks) {
        return b.totalLogbooks - a.totalLogbooks;
      }
      return a.name.localeCompare(b.name);
    });
  }, [allLogbooks, monitoringPeserta]);

  /* ================= HANDLE DEEP LINK ?email= ================= */

  useEffect(() => {
    if (deepLinkHandledRef.current || pesertaList.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email")?.trim().toLowerCase();
    if (!emailParam) {
      deepLinkHandledRef.current = true;
      return;
    }

    deepLinkHandledRef.current = true;
    setSearch(emailParam);
    const matched = pesertaList.find(
      (p) => p.email.trim().toLowerCase() === emailParam,
    );
    if (matched) {
      setSelectedPesertaId(matched._id);
    }
  }, [pesertaList]);

  /* ================= ESCAPE KEY ================= */

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (!selectedLogbook && selectedPesertaId) {
        setSelectedPesertaId(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedLogbook, selectedPesertaId]);

  /* ================= STATS & FILTERING ================= */

  const mentorOptions = useMemo(
    () => buildMentorOptions(pesertaList),
    [pesertaList],
  );
  const formasiOptions = useMemo(
    () => buildFormasiOptions(pesertaList, formasiTitles),
    [pesertaList, formasiTitles],
  );
  const availableYears = useMemo(
    () => extractLogbookYears(allLogbooks, pesertaList),
    [allLogbooks, pesertaList],
  );
  const highlightedDates = useMemo(
    () => extractLogbookDates(allLogbooks),
    [allLogbooks],
  );

  const { scopedPeserta, summary } = useMemo(
    () => computeScopedLogbookMonitoring(pesertaList, allLogbooks, extraFilters),
    [pesertaList, allLogbooks, extraFilters],
  );

  const filteredPeserta = useMemo(() => {
    const q = search.trim().toLowerCase();

    return scopedPeserta.filter((p) => {
      if (filterTab === "Belum Isi Logbook" && p.missedCount === 0) return false;
      if (filterTab === "Perlu Review" && p.pendingLogbooks === 0) return false;
      if (
        filterTab === "Disetujui" &&
        (p.totalLogbooks === 0 ||
          p.pendingLogbooks > 0 ||
          p.rejectedLogbooks > 0 ||
          p.revisiLogbooks > 0)
      ) {
        return false;
      }
      if (
        filterTab === "Ditolak" &&
        p.rejectedLogbooks === 0 &&
        p.revisiLogbooks === 0
      ) {
        return false;
      }

      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.posisi && p.posisi.toLowerCase().includes(q)) ||
        (p.mentorName && p.mentorName.toLowerCase().includes(q))
      );
    });
  }, [scopedPeserta, search, filterTab]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPeserta.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);

  const paginatedPeserta = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredPeserta.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPeserta, safePage]);

  /* ================= SELECTED PESERTA CALENDAR DATA ================= */

  const selectedPeserta = useMemo(
    () => pesertaList.find((p) => p._id === selectedPesertaId) || null,
    [pesertaList, selectedPesertaId],
  );

  const { filledDates, calendarSummary, selectedPesertaLogbooks } =
    useMemo(() => {
      if (!selectedPesertaId) {
        return {
          filledDates: {} as FilledDateMap,
          calendarSummary: { total: 0, hadir: 0, izin: 0, alpa: 0 },
          selectedPesertaLogbooks: [] as AdminLogbookItem[],
        };
      }

      const items = allLogbooks.filter(
        (lb) => lb.user?._id === selectedPesertaId,
      );
      const map: FilledDateMap = {};
      let hadir = 0;
      let izin = 0;
      let alpa = 0;

      for (const lb of items) {
        if (lb.status === "hadir") hadir += 1;
        else if (lb.status === "tidak_hadir_keterangan") izin += 1;
        else alpa += 1;

        const normalizedStatus =
          lb.status === "hadir" ||
          lb.status === "tidak_hadir_keterangan" ||
          lb.status === "tidak_hadir_tanpa_keterangan"
            ? lb.status
            : "hadir";

        map[lb.date] = {
          _id: lb._id,
          status: normalizedStatus,
          approvalStatus: lb.approvalStatus || "menunggu",
        };
      }

      return {
        filledDates: map,
        calendarSummary: { total: items.length, hadir, izin, alpa },
        selectedPesertaLogbooks: items,
      };
    }, [allLogbooks, selectedPesertaId]);

  /* ================= ACTIONS ================= */

  const handleSelectDate = (date: string, isFilled: boolean) => {
    if (!isFilled) return;
    const match = selectedPesertaLogbooks.find((lb) => lb.date === date);
    if (!match) {
      showToast.error("Detail logbook pada tanggal ini tidak ditemukan");
      return;
    }
    setSelectedLogbook(match);
  };

  const handleDownloadPdf = async (userId: string, name: string) => {
    const toastId = showToast.loading("Menyiapkan PDF logbook...");
    try {
      setDownloadingId(userId);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/logbook/admin/${userId}/download/pdf`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error("Gagal mengunduh PDF logbook");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `logbook-${name}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast.updateSuccess(toastId, "PDF logbook berhasil diunduh");
    } catch (err) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal mengunduh PDF logbook",
      );
    } finally {
      setDownloadingId(null);
    }
  };

  /* ================= RENDER ================= */

  if (loading) {
    return (
      <TablePageSkeleton
        title="Monitoring Logbook Peserta"
        subtitle="Memuat data logbook harian peserta magang..."
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
            Monitoring Logbook Peserta
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pantau catatan aktivitas harian peserta per kalender, status
            verifikasi mentor, dan unduh rekap PDF
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition self-start sm:self-auto disabled:opacity-60"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl p-5 bg-linear-to-br from-[#0284c7] to-blue-700 text-white shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-sky-100">
                Peserta Mengisi Logbook
              </p>
              <p className="text-3xl font-extrabold tracking-tight mt-2">
                {summary.totalPeserta}
              </p>
              <p className="text-[11px] text-sky-100 mt-1.5">
                {summary.totalEntries} total entri logbook
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
                Menunggu Verifikasi
              </p>
              <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight mt-2">
                {summary.totalPending}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                {summary.counts["Perlu Review"]} peserta perlu ditinjau
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
                Logbook Disetujui
              </p>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mt-2">
                {summary.totalApproved}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Telah terverifikasi
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
                Ditolak / Revisi
              </p>
              <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight mt-2">
                {summary.totalRejectedOrRevisi}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Perlu perbaikan peserta
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* ================= FILTER & SEARCH ================= */}
      <LogbookFilterToolbar
        filterTab={filterTab}
        onFilterTabChange={(next) => {
          setFilterTab(next);
          setCurrentPage(1);
        }}
        tabCounts={summary.counts}
        search={search}
        onSearchChange={(next) => {
          setSearch(next);
          setCurrentPage(1);
        }}
        extraFilters={extraFilters}
        onExtraFiltersChange={(next) => {
          setExtraFilters(next);
          setCurrentPage(1);
        }}
        mentorOptions={mentorOptions}
        formasiOptions={formasiOptions}
        availableYears={availableYears}
        highlightedDates={highlightedDates}
        filteredCount={filteredPeserta.length}
      />

      {/* ================= TABLE ================= */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Peserta</th>
                <th className="py-3.5 px-4 text-center">Total Entri</th>
                <th className="py-3.5 px-4">Rekap Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {paginatedPeserta.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-14 px-4 text-center text-slate-500 dark:text-slate-400"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="font-semibold text-slate-700 dark:text-slate-200">
                        Tidak ada data logbook peserta
                      </p>
                      <p className="text-xs text-slate-400">
                        Coba ubah filter atau kata kunci pencarian.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPeserta.map((p, idx) => {
                  const rowNo = (safePage - 1) * ITEMS_PER_PAGE + idx + 1;
                  return (
                    <tr
                      key={p._id}
                      className="hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {rowNo}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#0284c7] to-blue-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {getInitials(p.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {p.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {p.email}
                            </p>
                            {(p.posisi && p.posisi !== "-") ||
                            (p.mentorName && p.mentorName !== "-") ? (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                {p.posisi && p.posisi !== "-" ? p.posisi : "-"} • Mentor:{" "}
                                {p.mentorName && p.mentorName !== "-"
                                  ? p.mentorName
                                  : "Belum Ditentukan"}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                          {p.totalLogbooks} hari
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                            {p.missedCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800">
                                <AlertTriangle className="w-3 h-3" />
                                {p.missedCount} hari belum isi
                              </span>
                            )}
                            {p.totalLogbooks === 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                                Belum ada entri logbook
                              </span>
                            ) : (
                              <>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                                  {p.approvedLogbooks} disetujui
                                </span>
                                {p.pendingLogbooks > 0 && (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
                                    {p.pendingLogbooks} menunggu
                                  </span>
                                )}
                                {p.rejectedLogbooks + p.revisiLogbooks > 0 && (
                                  <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800">
                                    {p.rejectedLogbooks + p.revisiLogbooks}{" "}
                                    ditolak/revisi
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          {p.missedCount > 0 && p.missedDates.length > 0 && (
                            <p className="text-[11px] text-rose-600/90 dark:text-rose-400">
                              Terlewat:{" "}
                              {p.missedDates
                                .slice(0, 3)
                                .map(formatDateCompactID)
                                .join(", ")}
                              {p.missedDates.length > 3
                                ? ` (+${p.missedDates.length - 3} lainnya)`
                                : ""}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            disabled={downloadingId === p._id || p.totalLogbooks === 0}
                            onClick={() => handleDownloadPdf(p._id, p.name)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
                          >
                            <Download className="w-3.5 h-3.5" />
                            {downloadingId === p._id ? "Unduh..." : "PDF"}
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedPesertaId(p._id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white shadow-xs transition"
                          >
                            <CalendarIcon className="w-3.5 h-3.5" />
                            Kalender
                          </button>
                        </div>
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
          totalItems={filteredPeserta.length}
          itemsPerPage={ITEMS_PER_PAGE}
          itemLabel="peserta"
          onPageChange={setCurrentPage}
        />
      </div>

      {/* ================= CALENDAR MODAL ================= */}
      {selectedPeserta && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPesertaId(null);
          }}
        >
          <div className="w-full max-w-4xl max-h-[92vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-linear-to-r from-[#0284c7] to-blue-700 px-6 py-4 text-white flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <CalendarIcon className="w-5 h-5 shrink-0" />
                <div className="min-w-0">
                  <h2 className="text-lg font-bold">Kalender Logbook</h2>
                  <p className="text-xs text-sky-100 truncate">
                    {selectedPeserta.name} • {selectedPeserta.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPesertaId(null)}
                aria-label="Tutup kalender logbook"
                className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 grid grid-cols-2 sm:grid-cols-5 gap-3 shrink-0">
              <SummaryPill label="Total" value={calendarSummary.total} />
              <SummaryPill
                label="Hadir"
                value={calendarSummary.hadir}
                accent="emerald"
              />
              <SummaryPill
                label="Izin / Sakit"
                value={calendarSummary.izin}
                accent="sky"
              />
              <SummaryPill
                label="Tanpa Keterangan"
                value={calendarSummary.alpa}
                accent="rose"
              />
              <SummaryPill
                label="Belum Mengisi"
                value={selectedPeserta.missedCount}
                accent="rose"
              />
            </div>

            {/* Calendar */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              {selectedPeserta.missedCount > 0 && (
                <div className="rounded-xl border border-rose-200 dark:border-rose-800/70 bg-rose-50/80 dark:bg-rose-950/30 p-3.5 space-y-2">
                  <p className="text-xs font-bold text-rose-800 dark:text-rose-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>
                      Terdapat {selectedPeserta.missedCount} hari kerja peserta
                      belum mengisi logbook:
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPeserta.missedDates.slice(0, 12).map((d) => (
                      <span
                        key={d}
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                      >
                        {formatDateCompactID(d)}
                      </span>
                    ))}
                    {selectedPeserta.missedDates.length > 12 && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                        +{selectedPeserta.missedDates.length - 12} hari lainnya
                      </span>
                    )}
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Klik tanggal yang berwarna pada kalender untuk melihat detail
                logbook peserta.
              </p>
              <Calendar
                onSelectDate={handleSelectDate}
                filledDates={filledDates}
                missedDates={selectedPeserta.missedDates}
                holidayDates={holidayDates}
                overrideWorkdays={overrideWorkdays}
                startDate={selectedPeserta.tanggalMulaiMagang}
                endDate={selectedPeserta.tanggalSelesaiMagang}
                disableEmptyDates
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= DETAIL LOGBOOK MODAL (READ-ONLY) ================= */}
      {selectedLogbook && (
        <AdminLogbookModal
          logbook={selectedLogbook}
          onClose={() => setSelectedLogbook(null)}
        />
      )}
    </div>
  );
}

function SummaryPill({
  label,
  value,
  accent = "slate",
}: {
  label: string;
  value: number;
  accent?: "slate" | "emerald" | "sky" | "rose";
}) {
  const colorMap = {
    slate: "text-slate-900 dark:text-white",
    emerald: "text-emerald-600 dark:text-emerald-400",
    sky: "text-[#0284c7] dark:text-sky-400",
    rose: "text-rose-600 dark:text-rose-400",
  };

  return (
    <div className="rounded-xl p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
      <p className={`text-xl font-extrabold ${colorMap[accent]}`}>{value}</p>
      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
        {label}
      </p>
    </div>
  );
}
