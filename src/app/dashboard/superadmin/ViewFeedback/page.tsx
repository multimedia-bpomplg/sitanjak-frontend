"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  LayoutGrid,
  MessageSquareHeart,
  RefreshCw,
  Search,
  Star,
  Table2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import AdminFeedbackModal, {
  type AdminFeedbackItem,
} from "@/components/admin/AdminFeedbackModal";
import PaginationFooter from "@/components/dashboard/PaginationFooter";
import { TablePageSkeleton } from "@/components/dashboard/skeletons";
import { showToast } from "@/components/ui/toastDashboard";
import { getMentorFilterKey } from "@/lib/pesertaFilter";

/* ================= TYPES ================= */

type PesertaFeedback = {
  _id: string;
  name: string;
  email: string;
  mentor?: {
    _id?: string;
    name?: string;
    email?: string;
  } | null;
  totalFeedback: number;
  sentToMentor: number;
  notSentToMentor: number;
  responded: number;
  unresponded: number;
  feedbackMonths: string[];
  lastFeedbackDate: string | null;
};

type FilterTab = "Semua" | "Menunggu Respon" | "Sudah Direspon";
type ViewMode = "tabel" | "kartu";

/* ================= CONSTANTS & HELPERS ================= */

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

function getAverageRating(survey?: AdminFeedbackItem["survey"]): number | null {
  if (!survey) return null;
  const scores = [
    survey.kepuasanMagang,
    survey.rekomendasiProgram,
    survey.kemudahanProses,
    survey.peningkatanSkill,
  ].filter((n): n is number => typeof n === "number" && n > 0);
  if (scores.length === 0) return null;
  return (
    Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
  );
}

function formatMonthLabel(monthStr?: string): string {
  if (!monthStr) return "-";
  const match = /^(\d{4})-(\d{2})$/.exec(monthStr.trim());
  if (!match) return monthStr;
  const d = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  if (Number.isNaN(d.getTime())) return monthStr;
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

function StarRow({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= rounded
              ? "fill-amber-400 text-amber-400"
              : "text-slate-200 dark:text-slate-700"
          }`}
        />
      ))}
    </div>
  );
}

/* ================= COMPONENT ================= */

export default function ViewFeedbackSuperadminPage() {
  const [feedbackList, setFeedbackList] = useState<AdminFeedbackItem[]>([]);
  const [pesertaFeedback, setPesertaFeedback] = useState<PesertaFeedback[]>([]);
  const [statistics, setStatistics] = useState<Record<string, unknown> | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("Semua");
  const [filterMentor, setFilterMentor] = useState("semua");
  const [viewMode, setViewMode] = useState<ViewMode>("tabel");
  const [currentPage, setCurrentPage] = useState(1);

  const [modalTarget, setModalTarget] = useState<{
    peserta: PesertaFeedback;
    feedbacks: AdminFeedbackItem[];
  } | null>(null);

  /* ================= FETCH ================= */

  const loadData = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [pesertaRes, statsRes, feedbackRes] = await Promise.all([
        fetch(`${API_BASE}/superadmin/feedback/peserta-summary`, { headers }),
        fetch(`${API_BASE}/superadmin/feedback/statistics`, { headers }),
        fetch(`${API_BASE}/superadmin/feedback`, { headers }),
      ]);

      if (pesertaRes.ok) {
        const pesertaData = await pesertaRes.json();
        setPesertaFeedback(Array.isArray(pesertaData) ? pesertaData : []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStatistics(statsData);
      }

      if (feedbackRes.ok) {
        const feedbackData = await feedbackRes.json();
        setFeedbackList(Array.isArray(feedbackData) ? feedbackData : []);
      }
    } catch {
      showToast.error("Gagal memuat data feedback peserta");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ================= GROUP PER PESERTA ================= */

  const feedbackByUserMap = useMemo(() => {
    const map = new Map<string, AdminFeedbackItem[]>();

    for (const fb of feedbackList) {
      const uid = fb.user?._id;
      if (!uid) continue;
      const arr = map.get(uid) || [];
      arr.push(fb);
      map.set(uid, arr);
    }

    for (const [, arr] of map.entries()) {
      arr.sort((a, b) => {
        const [yA, mA] = (a.month || "0-0").split("-").map(Number);
        const [yB, mB] = (b.month || "0-0").split("-").map(Number);
        if (yA !== yB) return yB - yA;
        return mB - mA;
      });
    }

    return map;
  }, [feedbackList]);

  /* ================= STATS & FILTERING ================= */

  const stats = useMemo(() => {
    let totalResponded = 0;
    let totalUnresponded = 0;
    const allRatings: number[] = [];

    for (const p of pesertaFeedback) {
      totalResponded += p.responded || 0;
      totalUnresponded += p.unresponded || 0;
    }

    for (const fb of feedbackList) {
      const avg = getAverageRating(fb.survey);
      if (avg !== null) allRatings.push(avg);
    }

    const overallRating =
      allRatings.length > 0
        ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(
            1,
          )
        : "0.0";

    const counts: Record<FilterTab, number> = {
      Semua: pesertaFeedback.length,
      "Menunggu Respon": pesertaFeedback.filter((p) => p.unresponded > 0)
        .length,
      "Sudah Direspon": pesertaFeedback.filter(
        (p) => p.totalFeedback > 0 && p.unresponded === 0,
      ).length,
    };

    return {
      totalPeserta: pesertaFeedback.length,
      totalFeedback: feedbackList.length,
      totalResponded,
      totalUnresponded,
      overallRating,
      counts,
    };
  }, [pesertaFeedback, feedbackList]);

  const mentorOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of pesertaFeedback) {
      if (!p.mentor?.name) continue;
      const key = getMentorFilterKey(p.mentor);
      if (key && !map.has(key)) {
        map.set(key, p.mentor.name);
      }
    }
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "id-ID"));
  }, [pesertaFeedback]);

  const filteredPeserta = useMemo(() => {
    const q = search.trim().toLowerCase();

    return pesertaFeedback.filter((p) => {
      if (filterTab === "Menunggu Respon" && p.unresponded === 0) return false;
      if (filterTab === "Sudah Direspon" && p.unresponded > 0) return false;

      if (filterMentor === "tanpa_mentor" && p.mentor?.name) return false;
      if (
        filterMentor !== "semua" &&
        filterMentor !== "tanpa_mentor" &&
        getMentorFilterKey(p.mentor) !== filterMentor
      ) {
        return false;
      }

      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        Boolean(p.mentor?.name?.toLowerCase().includes(q))
      );
    });
  }, [pesertaFeedback, search, filterTab, filterMentor]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPeserta.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);

  const paginatedPeserta = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredPeserta.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPeserta, safePage]);

  /* ================= HANDLERS ================= */

  const handleOpenDetail = (peserta: PesertaFeedback) => {
    const list = feedbackByUserMap.get(peserta._id) || [];
    if (list.length === 0) {
      showToast.error("Peserta belum memiliki detail feedback");
      return;
    }
    setModalTarget({ peserta, feedbacks: list });
  };

  const handleDownloadAllFeedback = async () => {
    if (feedbackList.length === 0) {
      showToast.error("Tidak ada data feedback untuk diunduh");
      return;
    }

    setDownloading(true);
    const toastId = showToast.loading("Menyiapkan laporan feedback PDF...");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/superadmin/feedback/download-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          feedbackList,
          statistics,
          date: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Gagal mengunduh PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laporan-feedback-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showToast.updateSuccess(toastId, "Laporan feedback berhasil diunduh");
    } catch {
      showToast.updateError(toastId, "Gagal mengunduh laporan feedback");
    } finally {
      setDownloading(false);
    }
  };

  /* ================= RENDER ================= */

  if (loading) {
    return (
      <TablePageSkeleton
        title="Evaluasi & Feedback Peserta"
        subtitle="Memuat ringkasan feedback dan rating survei peserta..."
        columnsCount={7}
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
            Evaluasi &amp; Feedback Peserta
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tinjau rating kepuasan (1–5 bintang), masukan untuk instansi &amp;
            mentor, serta respon pembimbing
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => loadData(true)}
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
            disabled={downloading}
            onClick={handleDownloadAllFeedback}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white shadow-xs transition disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5" />
            {downloading ? "Menyiapkan..." : "Unduh PDF"}
          </button>
        </div>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl p-5 bg-linear-to-br from-[#0284c7] to-blue-700 text-white shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-sky-100">
                Total Peserta Mengisi
              </p>
              <p className="text-3xl font-extrabold tracking-tight mt-2">
                {stats.totalPeserta}
              </p>
              <p className="text-[11px] text-sky-100 mt-1.5">
                {stats.totalFeedback} total feedback bulanan
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
                Rata-rata Rating Survei
              </p>
              <p className="text-3xl font-extrabold text-amber-500 tracking-tight mt-2">
                {stats.overallRating}
                <span className="text-sm font-semibold text-slate-400 ml-1">
                  / 5.0
                </span>
              </p>
              <div className="mt-1.5">
                <StarRow rating={Number(stats.overallRating)} />
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Sudah Direspon Mentor
              </p>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mt-2">
                {stats.totalResponded}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Feedback ditindaklanjuti
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
                Belum Direspon Mentor
              </p>
              <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight mt-2">
                {stats.totalUnresponded}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                {stats.counts["Menunggu Respon"]} peserta menunggu respon
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* ================= FILTER, VIEW TOGGLE & SEARCH ================= */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 p-3.5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(["Semua", "Menunggu Respon", "Sudah Direspon"] as FilterTab[]).map(
            (tab) => {
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
            },
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-wrap">
          {/* Filter Mentor */}
          <div className="relative min-w-[190px]">
            <UserCheck className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              aria-label="Filter berdasarkan mentor"
              value={filterMentor}
              onChange={(e) => {
                setFilterMentor(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-8 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
            >
              <option value="semua">Semua Mentor</option>
              {mentorOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
              <option value="tanpa_mentor">Belum Ditetapkan</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("tabel")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === "tabel"
                  ? "bg-[#0284c7] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              Tabel
            </button>
            <button
              type="button"
              onClick={() => setViewMode("kartu")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === "kartu"
                  ? "bg-[#0284c7] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Kartu
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama atau email peserta..."
              className="w-full pl-9 pr-9 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
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
        </div>
      </div>

      {/* ================= TABEL OR KARTU ================= */}
      {viewMode === "tabel" ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">Peserta</th>
                  <th className="py-3.5 px-4">Mentor</th>
                  <th className="py-3.5 px-4">Periode Terbaru</th>
                  <th className="py-3.5 px-4">Rating (1–5 Bintang)</th>
                  <th className="py-3.5 px-4">Status Respon</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {paginatedPeserta.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-14 px-4 text-center text-slate-500 dark:text-slate-400"
                    >
                      <MessageSquareHeart className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700 dark:text-slate-200">
                        Tidak ada data feedback peserta
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedPeserta.map((p, idx) => {
                    const rowNo = (safePage - 1) * ITEMS_PER_PAGE + idx + 1;
                    const userFeedbacks = feedbackByUserMap.get(p._id) || [];
                    const latest = userFeedbacks[0];
                    const avgRating = latest
                      ? getAverageRating(latest.survey)
                      : null;

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
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-xs">
                          {p.mentor?.name ? (
                            <div className="min-w-0">
                              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100">
                                <UserCheck className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                                <span className="truncate">{p.mentor.name}</span>
                              </span>
                              {p.mentor.email && (
                                <p className="text-[11px] text-slate-400 truncate mt-0.5 pl-5">
                                  {p.mentor.email}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs italic text-slate-400">
                              Belum ditetapkan
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-xs">
                          <p className="font-semibold text-slate-800 dark:text-slate-100">
                            {latest ? formatMonthLabel(latest.month) : "-"}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Total: {p.totalFeedback} bulan
                          </p>
                        </td>

                        <td className="py-3.5 px-4">
                          {avgRating !== null ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <StarRow rating={avgRating} />
                                <span className="text-xs font-bold text-slate-800 dark:text-white">
                                  {avgRating.toFixed(1)}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400">
                                Kepuasan {latest?.survey?.kepuasanMagang || 0} •
                                Skill {latest?.survey?.peningkatanSkill || 0}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                            {p.responded > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                                {p.responded} direspon
                              </span>
                            )}
                            {p.unresponded > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
                                {p.unresponded} menunggu
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(p)}
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
            totalItems={filteredPeserta.length}
            itemsPerPage={ITEMS_PER_PAGE}
            itemLabel="peserta"
            onPageChange={setCurrentPage}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedPeserta.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-14 px-4 text-center">
              <MessageSquareHeart className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 dark:text-slate-200">
                Tidak ada data feedback peserta
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedPeserta.map((p) => {
                const userFeedbacks = feedbackByUserMap.get(p._id) || [];
                const latest = userFeedbacks[0];
                const avgRating = latest
                  ? getAverageRating(latest.survey)
                  : null;

                return (
                  <div
                    key={p._id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#0284c7] to-blue-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {getInitials(p.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {p.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {p.email}
                            </p>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-[#0284c7] border border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800 shrink-0">
                          <Calendar className="w-3 h-3" />
                          {latest ? formatMonthLabel(latest.month) : "-"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <UserCheck className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                        <span className="text-slate-400">Mentor:</span>
                        {p.mentor?.name ? (
                          <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                            {p.mentor.name}
                          </span>
                        ) : (
                          <span className="italic text-slate-400">
                            Belum ditetapkan
                          </span>
                        )}
                      </div>

                      {avgRating !== null && latest?.survey && (
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                              Rating Survei
                            </span>
                            <div className="flex items-center gap-1.5">
                              <StarRow rating={avgRating} />
                              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                {avgRating.toFixed(1)} / 5
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                            <span>
                              Kepuasan:{" "}
                              <strong className="text-slate-700 dark:text-slate-200">
                                {latest.survey.kepuasanMagang || 0}/5
                              </strong>
                            </span>
                            <span>
                              Rekomendasi:{" "}
                              <strong className="text-slate-700 dark:text-slate-200">
                                {latest.survey.rekomendasiProgram || 0}/5
                              </strong>
                            </span>
                            <span>
                              Kemudahan:{" "}
                              <strong className="text-slate-700 dark:text-slate-200">
                                {latest.survey.kemudahanProses || 0}/5
                              </strong>
                            </span>
                            <span>
                              Skill:{" "}
                              <strong className="text-slate-700 dark:text-slate-200">
                                {latest.survey.peningkatanSkill || 0}/5
                              </strong>
                            </span>
                          </div>
                        </div>
                      )}

                      {latest?.feedbackBPOM && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 italic">
                          &ldquo;{latest.feedbackBPOM}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {p.totalFeedback} feedback
                        </span>
                        {p.unresponded > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
                            {p.unresponded} menunggu
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                            Sudah direspon
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenDetail(p)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white shadow-xs transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Detail
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <PaginationFooter
              currentPage={safePage}
              totalItems={filteredPeserta.length}
              itemsPerPage={ITEMS_PER_PAGE}
              itemLabel="peserta"
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* ================= DETAIL MODAL ================= */}
      {modalTarget && (
        <AdminFeedbackModal
          pesertaName={modalTarget.peserta.name}
          pesertaEmail={modalTarget.peserta.email}
          feedbacks={modalTarget.feedbacks}
          onClose={() => setModalTarget(null)}
        />
      )}
    </div>
  );
}
