"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BookOpenCheck,
  Building2,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  Eye,
  List,
  Mail,
  RefreshCw,
  Search,
  Users,
  XCircle,
} from "lucide-react";
import Calendar from "@/components/logbook/Calendar";
import MentorLogbookModal from "@/components/logbook/MentorLogbookModal";
import PaginationFooter from "@/components/dashboard/PaginationFooter";
import { TablePageSkeleton } from "@/components/dashboard/skeletons";
import { showToast } from "@/components/ui/toastDashboard";
import { isPkpaPeserta } from "@/lib/pesertaKategori";

const ITEMS_PER_PAGE = 10;

/* ================= TYPES ================= */

type ApprovalStatus = "menunggu" | "disetujui" | "ditolak" | "revisi";
type AttendanceStatus =
  | "hadir"
  | "tidak_hadir_keterangan"
  | "tidak_hadir_tanpa_keterangan";

type LogbookItem = {
  _id: string;
  date: string;
  status: AttendanceStatus;
  approvalStatus: ApprovalStatus;
  judul?: string;
  keterangan?: string;
  mentorNote?: string;
};

type PesertaLogbookRow = {
  userId?: string | null;
  nama: string;
  email: string;
  posisi: string;
  jurusan?: string;
  asal?: { jenis: string; nama: string } | null;
  kategori?: string;
  logbookStats: {
    total: number;
    menunggu: number;
    revisi: number;
    disetujui: number;
    ditolak: number;
    latestLogbookDate: string | null;
  };
};

type SummaryStats = {
  totalPeserta: number;
  pesertaDenganLogbookMenunggu: number;
  totalLogbookMenunggu: number;
  totalLogbookRevisi: number;
  totalLogbookDisetujui: number;
};

type FilledDateType = {
  _id: string;
  status: AttendanceStatus;
  approvalStatus: ApprovalStatus;
};

type PesertaFilterTab = "semua" | "menunggu" | "revisi" | "terverifikasi";
type DetailViewMode = "kalender" | "daftar";
type LogbookListFilter = "semua" | ApprovalStatus;

/* ================= HELPERS ================= */

function getInitials(name = "P"): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "P"
  );
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getApprovalBadge(status: ApprovalStatus) {
  switch (status) {
    case "disetujui":
      return {
        label: "Disetujui",
        className:
          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
      };
    case "ditolak":
      return {
        label: "Ditolak",
        className:
          "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
      };
    case "revisi":
      return {
        label: "Revisi",
        className:
          "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
      };
    default:
      return {
        label: "Menunggu",
        className:
          "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
      };
  }
}

function getAttendanceLabel(status: AttendanceStatus): string {
  if (status === "hadir") return "Hadir";
  if (status === "tidak_hadir_keterangan") return "Izin / Keterangan";
  return "Tanpa Keterangan";
}

/* ================= PAGE ================= */

export default function ViewLogbookMentor() {
  const [pesertaList, setPesertaList] = useState<PesertaLogbookRow[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalPeserta: 0,
    pesertaDenganLogbookMenunggu: 0,
    totalLogbookMenunggu: 0,
    totalLogbookRevisi: 0,
    totalLogbookDisetujui: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [pesertaFilter, setPesertaFilter] = useState<PesertaFilterTab>("semua");
  const [pesertaPage, setPesertaPage] = useState(1);

  const [selectedPeserta, setSelectedPeserta] =
    useState<PesertaLogbookRow | null>(null);
  const [logbooks, setLogbooks] = useState<LogbookItem[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailViewMode, setDetailViewMode] =
    useState<DetailViewMode>("kalender");
  const [logbookListFilter, setLogbookListFilter] =
    useState<LogbookListFilter>("semua");
  const [logbookPage, setLogbookPage] = useState(1);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  /* ================= FETCH PESERTA & SUMMARY ================= */
  const fetchPesertaSummary = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/mentor/dashboard-summary`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error("Gagal memuat data peserta bimbingan");
      }

      const json = await res.json();
      setPesertaList(json.peserta || []);
      setSummaryStats(
        json.summary || {
          totalPeserta: 0,
          pesertaDenganLogbookMenunggu: 0,
          totalLogbookMenunggu: 0,
          totalLogbookRevisi: 0,
          totalLogbookDisetujui: 0,
        },
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Gagal memuat data peserta";
      if (!silent) setError(message);
      showToast.error(message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPesertaSummary();
  }, [fetchPesertaSummary]);

  /* ================= RESOLVE USER ID ================= */
  const getUserIdByEmail = async (email: string): Promise<string | null> => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/by-email/${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      if (!res.ok) return null;
      const user = await res.json();
      return user._id || null;
    } catch {
      return null;
    }
  };

  /* ================= LOAD LOGBOOK PESERTA ================= */
  const loadPesertaLogbook = useCallback(async (email: string) => {
    if (!email) return;
    setLoadingDetail(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/logbook/mentor/peserta/email/${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error("Gagal mengambil logbook peserta");
      }

      const data: LogbookItem[] = await res.json();
      setLogbooks(
        data.map((item) => ({
          ...item,
          approvalStatus: item.approvalStatus || "menunggu",
        })),
      );
    } catch {
      showToast.error("Gagal memuat logbook peserta");
      setLogbooks([]);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const handleSelectPeserta = async (p: PesertaLogbookRow) => {
    let resolvedUserId = p.userId || null;
    if (!resolvedUserId) {
      resolvedUserId = await getUserIdByEmail(p.email);
    }

    if (!resolvedUserId) {
      showToast.error("Akun user peserta belum ditemukan");
      return;
    }

    const updated = { ...p, userId: resolvedUserId };
    setSelectedPeserta(updated);
    setLogbookListFilter("semua");
    setLogbookPage(1);
    await loadPesertaLogbook(updated.email);
  };

  /* ================= DOWNLOAD PDF ================= */
  const handleDownloadLogbook = async (p: PesertaLogbookRow) => {
    const key = p.email;
    setDownloadingKey(key);
    try {
      let userId = p.userId || null;
      if (!userId) {
        userId = await getUserIdByEmail(p.email);
      }

      if (!userId) {
        showToast.error("Gagal menemukan ID peserta");
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/logbook/mentor/${userId}/download/pdf`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error("Gagal download logbook PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `logbook-${p.nama}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showToast.success("Logbook PDF berhasil diunduh");
    } catch {
      showToast.error("Gagal download logbook");
    } finally {
      setDownloadingKey(null);
    }
  };

  /* ================= FILTERED PESERTA ================= */
  const filteredPeserta = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return pesertaList.filter((p) => {
      if (pesertaFilter === "menunggu" && p.logbookStats.menunggu === 0) {
        return false;
      }
      if (pesertaFilter === "revisi" && p.logbookStats.revisi === 0) {
        return false;
      }
      if (
        pesertaFilter === "terverifikasi" &&
        (p.logbookStats.total === 0 || p.logbookStats.menunggu > 0)
      ) {
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
  }, [pesertaList, pesertaFilter, searchQuery]);

  useEffect(() => {
    setPesertaPage(1);
  }, [pesertaFilter, searchQuery]);

  const totalPesertaPages = Math.max(
    1,
    Math.ceil(filteredPeserta.length / ITEMS_PER_PAGE),
  );
  const safePesertaPage = Math.min(pesertaPage, totalPesertaPages);
  const paginatedPeserta = filteredPeserta.slice(
    (safePesertaPage - 1) * ITEMS_PER_PAGE,
    safePesertaPage * ITEMS_PER_PAGE,
  );

  /* ================= DETAIL COMPUTED DATA ================= */
  const filledDates = useMemo(() => {
    const map: Record<string, FilledDateType> = {};
    logbooks.forEach((l) => {
      map[l.date] = {
        _id: l._id,
        status: l.status,
        approvalStatus: l.approvalStatus || "menunggu",
      };
    });
    return map;
  }, [logbooks]);

  const detailSummary = useMemo(() => {
    return logbooks.reduce(
      (acc, item) => {
        acc.total += 1;
        if (item.approvalStatus === "menunggu") acc.menunggu += 1;
        if (item.approvalStatus === "disetujui") acc.disetujui += 1;
        if (item.approvalStatus === "revisi") acc.revisi += 1;
        if (item.approvalStatus === "ditolak") acc.ditolak += 1;
        if (item.status !== "hadir") acc.tidakHadir += 1;
        return acc;
      },
      {
        total: 0,
        menunggu: 0,
        disetujui: 0,
        revisi: 0,
        ditolak: 0,
        tidakHadir: 0,
      },
    );
  }, [logbooks]);

  const pendingLogbooks = useMemo(
    () => logbooks.filter((l) => l.approvalStatus === "menunggu"),
    [logbooks],
  );

  const filteredLogbooks = useMemo(() => {
    if (logbookListFilter === "semua") return logbooks;
    return logbooks.filter((l) => l.approvalStatus === logbookListFilter);
  }, [logbooks, logbookListFilter]);

  useEffect(() => {
    setLogbookPage(1);
  }, [logbookListFilter]);

  const totalLogbookPages = Math.max(
    1,
    Math.ceil(filteredLogbooks.length / ITEMS_PER_PAGE),
  );
  const safeLogbookPage = Math.min(logbookPage, totalLogbookPages);
  const paginatedLogbooks = filteredLogbooks.slice(
    (safeLogbookPage - 1) * ITEMS_PER_PAGE,
    safeLogbookPage * ITEMS_PER_PAGE,
  );

  /* ================= RENDER STATES ================= */
  if (loading) {
    return (
      <TablePageSkeleton
        title="Verifikasi Logbook"
        subtitle="Memuat daftar logbook peserta bimbingan Anda..."
        columnsCount={5}
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
            Gagal Memuat Data Logbook
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
        </div>
        <button
          onClick={() => fetchPesertaSummary()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#0284c7] hover:bg-sky-700 text-white transition"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
      </div>
    );
  }

  /* ================= RENDER DETAIL VIEW ================= */
  if (selectedPeserta) {
    return (
      <div className="space-y-6">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              setSelectedPeserta(null);
              setSelectedDate(null);
              setLogbooks([]);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-sky-50 hover:text-[#0284c7] hover:border-sky-200 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Daftar Peserta
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadPesertaLogbook(selectedPeserta.email)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => handleDownloadLogbook(selectedPeserta)}
              disabled={downloadingKey === selectedPeserta.email}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition"
            >
              <Download className="w-3.5 h-3.5" />
              {downloadingKey === selectedPeserta.email
                ? "Mengunduh..."
                : "Unduh PDF"}
            </button>
          </div>
        </div>

        {/* Participant Header Banner */}
        <div className="rounded-2xl border border-sky-500/30 bg-linear-to-r from-[#0284c7] via-sky-600 to-blue-700 dark:from-[#0369a1] dark:to-blue-900 p-5 text-white shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center font-extrabold text-base sm:text-lg shrink-0">
              {getInitials(selectedPeserta.nama)}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-extrabold truncate">
                {selectedPeserta.nama}
              </h1>
              <p className="text-xs sm:text-sm text-sky-100 truncate">
                {selectedPeserta.posisi}
                {selectedPeserta.jurusan ? ` • ${selectedPeserta.jurusan}` : ""}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-sky-100/90">
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {selectedPeserta.email}
                </span>
                {selectedPeserta.asal?.nama && (
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {selectedPeserta.asal.nama}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center bg-white/15 border border-white/25 rounded-xl px-4 py-2.5 shrink-0">
            <BookOpenCheck className="w-5 h-5 text-white" />
            <div>
              <p className="text-[11px] text-sky-100">Total Terisi</p>
              <p className="text-base font-extrabold">
                {detailSummary.total} Hari
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <DetailStatCard
            label="Total"
            value={detailSummary.total}
            color="slate"
          />
          <DetailStatCard
            label="Menunggu"
            value={detailSummary.menunggu}
            color="amber"
          />
          <DetailStatCard
            label="Disetujui"
            value={detailSummary.disetujui}
            color="emerald"
          />
          <DetailStatCard
            label="Revisi"
            value={detailSummary.revisi}
            color="purple"
          />
          <DetailStatCard
            label="Ditolak"
            value={detailSummary.ditolak}
            color="rose"
          />
          <DetailStatCard
            label="Tidak Hadir"
            value={detailSummary.tidakHadir}
            color="sky"
          />
        </div>

        {/* Quick Queue: Pending Verification */}
        {pendingLogbooks.length > 0 && (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-800/70 bg-amber-50/70 dark:bg-amber-950/30 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h2 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  {pendingLogbooks.length} Logbook Menunggu Verifikasi
                </h2>
              </div>
              <span className="text-xs text-amber-700 dark:text-amber-300">
                Klik tanggal untuk langsung memeriksa
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {pendingLogbooks.slice(0, 8).map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => setSelectedDate(item.date)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 shadow-2xs transition"
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>{formatDateShort(item.date)}</span>
                  {item.judul && (
                    <span className="text-slate-500 dark:text-slate-400 font-normal truncate max-w-36">
                      • {item.judul}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mode Switcher: Kalender vs Daftar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setDetailViewMode("kalender")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                detailViewMode === "kalender"
                  ? "bg-white dark:bg-slate-900 text-[#0284c7] dark:text-sky-300 shadow-2xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Tampilan Kalender
            </button>

            <button
              type="button"
              onClick={() => setDetailViewMode("daftar")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                detailViewMode === "daftar"
                  ? "bg-white dark:bg-slate-900 text-[#0284c7] dark:text-sky-300 shadow-2xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Daftar Logbook ({logbooks.length})
            </button>
          </div>

          {detailViewMode === "daftar" && (
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  "semua",
                  "menunggu",
                  "revisi",
                  "disetujui",
                  "ditolak",
                ] as LogbookListFilter[]
              ).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setLogbookListFilter(st)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize transition ${
                    logbookListFilter === st
                      ? "bg-[#0284c7] text-white border-[#0284c7]"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Detail Content */}
        {loadingDetail ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-slate-200 border-t-[#0284c7] mx-auto" />
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Memuat logbook peserta...
            </p>
          </div>
        ) : detailViewMode === "kalender" ? (
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-2xs">
            <Calendar
              filledDates={filledDates}
              disableEmptyDates
              onSelectDate={(date) => setSelectedDate(date)}
            />
          </div>
        ) : filteredLogbooks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Tidak ada logbook pada filter ini
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-4 text-left">Tanggal</th>
                    <th className="py-3.5 px-4 text-left">Kehadiran</th>
                    <th className="py-3.5 px-4 text-left">
                      Aktivitas / Keterangan
                    </th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {paginatedLogbooks.map((item) => {
                    const badge = getApprovalBadge(item.approvalStatus);
                    return (
                      <tr
                        key={item._id}
                        onClick={() => setSelectedDate(item.date)}
                        className="hover:bg-sky-50/50 dark:hover:bg-sky-950/20 cursor-pointer transition"
                      >
                        <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                          {formatDateShort(item.date)}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {getAttendanceLabel(item.status)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-md">
                          <p className="line-clamp-2 text-xs sm:text-sm">
                            {item.judul || item.keterangan || "-"}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td
                          className="py-3.5 px-4 text-center whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedDate(item.date)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-50 text-[#0284c7] border border-sky-200 hover:bg-[#0284c7] hover:text-white dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Periksa
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <PaginationFooter
              currentPage={safeLogbookPage}
              totalItems={filteredLogbooks.length}
              itemsPerPage={ITEMS_PER_PAGE}
              itemLabel="logbook"
              onPageChange={setLogbookPage}
            />
          </div>
        )}

        {/* Modal Verifikasi Logbook */}
        {selectedDate && selectedPeserta.userId && (
          <MentorLogbookModal
            date={selectedDate}
            pesertaId={selectedPeserta.userId}
            pesertaNama={selectedPeserta.nama}
            onClose={() => setSelectedDate(null)}
            onUpdated={() => {
              loadPesertaLogbook(selectedPeserta.email);
              fetchPesertaSummary(true);
            }}
          />
        )}
      </div>
    );
  }

  /* ================= RENDER LIST PESERTA ================= */
  const filterTabs: Array<{
    id: PesertaFilterTab;
    label: string;
    count: number;
  }> = [
    { id: "semua", label: "Semua", count: pesertaList.length },
    {
      id: "menunggu",
      label: "Perlu Verifikasi",
      count: pesertaList.filter((p) => p.logbookStats.menunggu > 0).length,
    },
    {
      id: "revisi",
      label: "Dalam Revisi",
      count: pesertaList.filter((p) => p.logbookStats.revisi > 0).length,
    },
    {
      id: "terverifikasi",
      label: "Sudah Terverifikasi",
      count: pesertaList.filter(
        (p) => p.logbookStats.total > 0 && p.logbookStats.menunggu === 0,
      ).length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Verifikasi Logbook
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pantau, periksa, dan setujui logbook harian peserta bimbingan Anda
          </p>
        </div>

        <button
          onClick={() => fetchPesertaSummary()}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-sky-500/30 bg-linear-to-br from-[#0284c7] via-sky-600 to-blue-700 dark:from-[#0369a1] dark:to-blue-800 p-5 text-white shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-sky-100">
                Total Peserta Bimbingan
              </p>
              <p className="text-3xl font-extrabold mt-1.5">
                {summaryStats.totalPeserta}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="mt-3 pt-2.5 border-t border-white/20 text-xs text-sky-100/90">
            Pilih peserta untuk memeriksa logbook atau unduh PDF
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Perlu Verifikasi Logbook
              </p>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                  {summaryStats.pesertaDenganLogbookMenunggu}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  peserta
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            Total {summaryStats.totalLogbookMenunggu} entri logbook menunggu
            persetujuan
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Logbook Disetujui
              </p>
              <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1.5">
                {summaryStats.totalLogbookDisetujui}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            {summaryStats.totalLogbookRevisi} entri sedang dalam revisi peserta
          </p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {filterTabs.map((tab) => {
            const active = pesertaFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setPesertaFilter(tab.id)}
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
            placeholder="Cari nama, email, posisi, kampus/SMK..."
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

      {/* Table Peserta */}
      {filteredPeserta.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 py-14 px-4 text-center space-y-2">
          <BookOpenCheck className="w-9 h-9 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {pesertaList.length === 0
              ? "Belum ada peserta bimbingan"
              : "Peserta tidak ditemukan"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {pesertaList.length === 0
              ? "Saat ini belum ada peserta magang yang ditugaskan kepada Anda."
              : "Coba ubah filter atau kata kunci pencarian."}
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
                  <th className="w-[20%] py-3.5 px-4 text-left">
                    Posisi & Jurusan
                  </th>
                  <th className="w-[27%] py-3.5 px-4 text-left">
                    Status Logbook
                  </th>
                  <th className="w-[22%] py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {paginatedPeserta.map((p, i) => {
                  const rowNumber = (safePesertaPage - 1) * ITEMS_PER_PAGE + i + 1;
                  const stats = p.logbookStats;
                  return (
                    <tr
                      key={p.userId || `${p.email}-${i}`}
                      className="hover:bg-sky-50/50 dark:hover:bg-sky-950/20 transition"
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
                        {stats.total === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                            Belum ada logbook
                          </span>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {stats.menunggu > 0 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
                                <Clock className="w-3 h-3" />
                                {stats.menunggu} Menunggu
                              </span>
                            )}
                            {stats.revisi > 0 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800">
                                <Edit3 className="w-3 h-3" />
                                {stats.revisi} Revisi
                              </span>
                            )}
                            {stats.disetujui > 0 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                                <CheckCircle2 className="w-3 h-3" />
                                {stats.disetujui} Disetujui
                              </span>
                            )}
                            {stats.ditolak > 0 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800">
                                <XCircle className="w-3 h-3" />
                                {stats.ditolak} Ditolak
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSelectPeserta(p)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white shadow-2xs transition"
                          >
                            <CalendarIcon className="w-3.5 h-3.5" />
                            Lihat Logbook
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadLogbook(p)}
                            disabled={downloadingKey === p.email}
                            title="Unduh Rekap PDF"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 disabled:opacity-50 transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            {downloadingKey === p.email ? "..." : "PDF"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <PaginationFooter
            currentPage={safePesertaPage}
            totalItems={filteredPeserta.length}
            itemsPerPage={ITEMS_PER_PAGE}
            itemLabel="peserta"
            onPageChange={setPesertaPage}
          />
        </div>
      )}
    </div>
  );
}

/* ================= SUB-COMPONENT ================= */

function DetailStatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "slate" | "amber" | "emerald" | "purple" | "rose" | "sky";
}) {
  const colorMap: Record<typeof color, string> = {
    slate: "text-slate-900 dark:text-white",
    amber: "text-amber-600 dark:text-amber-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    purple: "text-purple-600 dark:text-purple-400",
    rose: "text-rose-600 dark:text-rose-400",
    sky: "text-[#0284c7] dark:text-sky-400",
  };

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 text-center shadow-2xs">
      <p className={`text-2xl font-extrabold ${colorMap[color]}`}>{value}</p>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
        {label}
      </p>
    </div>
  );
}
