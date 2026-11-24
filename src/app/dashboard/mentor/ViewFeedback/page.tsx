"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  LayoutGrid,
  Mail,
  MessageSquareHeart,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Star,
  Table2,
} from "lucide-react";
import MentorFeedbackModal, {
  type MentorFeedbackItem,
} from "@/components/Laporan/MentorFeedbackModal";
import PaginationFooter from "@/components/dashboard/PaginationFooter";
import { TablePageSkeleton } from "@/components/dashboard/skeletons";

const ITEMS_PER_PAGE = 10;

type FilterTab = "semua" | "belum_direspon" | "revisi" | "direspon";
type ViewMode = "tabel" | "kartu";

function getFeedbackStage(
  f: MentorFeedbackItem,
): "direspon" | "revisi" | "belum_direspon" {
  if (f.status === "Revisi") return "revisi";
  if (f.status === "Direspon" || Boolean(f.mentorResponse?.trim())) {
    return "direspon";
  }
  return "belum_direspon";
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

function formatMonthLabel(monthStr?: string): string {
  if (!monthStr) return "-";
  const match = /^(\d{4})-(\d{2})$/.exec(monthStr.trim());
  if (!match) return monthStr;
  const d = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  if (Number.isNaN(d.getTime())) return monthStr;
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

function getAverageSurveyScore(
  survey?: MentorFeedbackItem["survey"],
): number | null {
  if (!survey) return null;
  const scores = [
    survey.kepuasanMagang,
    survey.rekomendasiProgram,
    survey.kemudahanProses,
    survey.peningkatanSkill,
  ].filter((n): n is number => typeof n === "number" && n > 0);
  if (scores.length === 0) return null;
  const avg = scores.reduce((acc, val) => acc + val, 0) / scores.length;
  return Math.round(avg * 10) / 10;
}

export default function ViewFeedbackMentor() {
  const [feedbackList, setFeedbackList] = useState<MentorFeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("semua");
  const [viewMode, setViewMode] = useState<ViewMode>("tabel");
  const [page, setPage] = useState(1);
  const [selectedFeedback, setSelectedFeedback] =
    useState<MentorFeedbackItem | null>(null);

  const fetchAllFeedback = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/feedback/mentor/semua-feedback`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) {
        throw new Error("Gagal memuat daftar feedback peserta");
      }

      const data: MentorFeedbackItem[] = await res.json();
      setFeedbackList(data);
    } catch (err: unknown) {
      console.error("Gagal memuat feedback:", err);
      if (!silent) {
        setError(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat memuat feedback.",
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllFeedback();
  }, [fetchAllFeedback]);

  const stats = useMemo(() => {
    const total = feedbackList.length;
    const belumDirespon = feedbackList.filter(
      (f) => getFeedbackStage(f) === "belum_direspon",
    ).length;
    const perluRevisi = feedbackList.filter(
      (f) => getFeedbackStage(f) === "revisi",
    ).length;
    const sudahDirespon = feedbackList.filter(
      (f) => getFeedbackStage(f) === "direspon",
    ).length;

    const avgList = feedbackList
      .map((f) => getAverageSurveyScore(f.survey))
      .filter((v): v is number => v !== null);
    const overallAverage =
      avgList.length > 0
        ? Math.round(
            (avgList.reduce((acc, v) => acc + v, 0) / avgList.length) * 10,
          ) / 10
        : null;

    return {
      total,
      belumDirespon,
      perluRevisi,
      sudahDirespon,
      overallAverage,
    };
  }, [feedbackList]);

  const filteredFeedback = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return feedbackList.filter((f) => {
      const stage = getFeedbackStage(f);
      if (activeFilter === "belum_direspon" && stage !== "belum_direspon") {
        return false;
      }
      if (activeFilter === "revisi" && stage !== "revisi") return false;
      if (activeFilter === "direspon" && stage !== "direspon") return false;

      if (!q) return true;
      const monthLabel = formatMonthLabel(f.month).toLowerCase();
      return (
        f.user?.name?.toLowerCase().includes(q) ||
        f.user?.email?.toLowerCase().includes(q) ||
        f.month?.toLowerCase().includes(q) ||
        monthLabel.includes(q) ||
        f.feedbackMentor?.toLowerCase().includes(q)
      );
    });
  }, [feedbackList, activeFilter, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [activeFilter, searchQuery]);

  const totalPage = Math.max(
    1,
    Math.ceil(filteredFeedback.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(page, totalPage);
  const paginatedFeedback = filteredFeedback.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  if (loading) {
    return (
      <TablePageSkeleton
        title="Feedback Mahasiswa"
        subtitle="Memuat feedback dari peserta bimbingan..."
        columnsCount={7}
        rowsCount={5}
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
            Gagal Memuat Feedback
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
        </div>
        <button
          onClick={() => fetchAllFeedback()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#0284c7] hover:bg-sky-700 text-white transition"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
      </div>
    );
  }

  const filterTabs: Array<{ id: FilterTab; label: string; count: number }> = [
    { id: "semua", label: "Semua", count: stats.total },
    {
      id: "belum_direspon",
      label: "Belum Direspon",
      count: stats.belumDirespon,
    },
    { id: "revisi", label: "Perlu Revisi", count: stats.perluRevisi },
    { id: "direspon", label: "Sudah Direspon", count: stats.sudahDirespon },
  ];

  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Feedback Mahasiswa
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Lihat penilaian bintang (1–5), masukan bulanan, dan berikan
            tanggapan untuk peserta bimbingan Anda
          </p>
        </div>

        <button
          onClick={() => fetchAllFeedback()}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* ================= STATISTIC CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Biru (Senada Sidebar) */}
        <div className="rounded-2xl border border-sky-500/30 bg-linear-to-br from-[#0284c7] via-sky-600 to-blue-700 dark:from-[#0369a1] dark:to-blue-800 p-5 text-white shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-sky-100">
                Total Feedback Masuk
              </p>
              <p className="text-3xl font-extrabold mt-1.5">{stats.total}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <MessageSquareHeart className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="mt-3 pt-2.5 border-t border-white/20 text-xs text-sky-100/90">
            {stats.overallAverage !== null
              ? `Rata-rata penilaian: ★ ${stats.overallAverage} / 5`
              : "Masukan bulanan dari peserta bimbingan Anda"}
          </p>
        </div>

        {/* Card 2: Belum Direspon */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Belum Direspon
              </p>
              <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1.5">
                {stats.belumDirespon}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            Menunggu tanggapan dari mentor
          </p>
        </div>

        {/* Card 3: Sudah Direspon */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Sudah Direspon
              </p>
              <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1.5">
                {stats.sudahDirespon}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            Tanggapan telah dikirimkan ke peserta
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

        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full lg:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, email, periode, isi feedback..."
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

          {/* Switch Tabel / Kartu */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("tabel")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === "tabel"
                  ? "bg-white dark:bg-slate-900 text-[#0284c7] dark:text-sky-300 shadow-2xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
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
                  ? "bg-white dark:bg-slate-900 text-[#0284c7] dark:text-sky-300 shadow-2xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Kartu
            </button>
          </div>
        </div>
      </div>

      {/* ================= CONTENT (TABEL / KARTU) ================= */}
      {filteredFeedback.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 py-14 px-4 text-center space-y-2">
          <MessageSquareHeart className="w-9 h-9 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {feedbackList.length === 0
              ? "Belum ada feedback dari peserta"
              : "Feedback tidak ditemukan"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {feedbackList.length === 0
              ? "Feedback bulanan dari peserta bimbingan Anda akan muncul di sini."
              : "Coba ubah filter atau kata kunci pencarian."}
          </p>
        </div>
      ) : viewMode === "kartu" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedFeedback.map((f) => (
              <FeedbackCard
                key={f._id}
                feedback={f}
                onOpen={() => setSelectedFeedback(f)}
              />
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden">
            <PaginationFooter
              currentPage={safePage}
              totalItems={filteredFeedback.length}
              itemsPerPage={ITEMS_PER_PAGE}
              itemLabel="feedback"
              onPageChange={setPage}
              className="border-t-0"
            />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-250 w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="w-[5%] py-3.5 px-4 text-center">No</th>
                  <th className="w-[21%] py-3.5 px-4 text-left">Peserta</th>
                  <th className="w-[12%] py-3.5 px-4 text-center">Periode</th>
                  <th className="w-[22%] py-3.5 px-4 text-left">
                    Penilaian (1–5)
                  </th>
                  <th className="w-[19%] py-3.5 px-4 text-left">
                    Feedback untuk Mentor
                  </th>
                  <th className="w-[11%] py-3.5 px-4 text-center">Status</th>
                  <th className="w-[10%] py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {paginatedFeedback.map((f, i) => {
                  const rowNumber = (safePage - 1) * ITEMS_PER_PAGE + i + 1;
                  const stage = getFeedbackStage(f);
                  const hasResponse = stage === "direspon";
                  const isRevisi = stage === "revisi";
                  const avgScore = getAverageSurveyScore(f.survey);
                  const roundedStars = avgScore ? Math.round(avgScore) : 0;

                  return (
                    <tr
                      key={f._id}
                      onClick={() => setSelectedFeedback(f)}
                      className="hover:bg-sky-50/50 dark:hover:bg-sky-950/20 cursor-pointer transition"
                    >
                      <td className="py-3.5 px-4 text-center font-medium text-slate-500 dark:text-slate-400">
                        {rowNumber}
                      </td>

                      <td className="py-3.5 px-4 text-left">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#0284c7] to-blue-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {getInitials(f.user?.name || "P")}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {f.user?.name || "Peserta"}
                            </p>
                            {f.user?.email && (
                              <p className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 truncate max-w-44">
                                <Mail className="w-3 h-3 shrink-0" />
                                <span className="truncate">{f.user.email}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-[#0284c7] border border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800">
                          {formatMonthLabel(f.month)}
                        </span>
                      </td>

                      {/* Penilaian 1–5 Bintang */}
                      <td className="py-3.5 px-4 text-left">
                        {avgScore !== null && f.survey ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <StarRow count={roundedStars} />
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                {avgScore}/5
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                                Kepuasan {f.survey.kepuasanMagang ?? "-"}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                                Rek. {f.survey.rekomendasiProgram ?? "-"}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                                Proses {f.survey.kemudahanProses ?? "-"}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                                Skill {f.survey.peningkatanSkill ?? "-"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-left">
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 max-w-xs">
                          {f.feedbackMentor || "-"}
                        </p>
                        {!f.isFeedbackMentorSent && (
                          <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
                            Draft peserta
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            hasResponse
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                              : isRevisi
                                ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800"
                                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                          }`}
                        >
                          {hasResponse ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Direspon
                            </>
                          ) : isRevisi ? (
                            <>
                              <RotateCcw className="w-3.5 h-3.5" />
                              Perlu Revisi
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5" />
                              Belum Direspon
                            </>
                          )}
                        </span>
                      </td>

                      <td
                        className="py-3.5 px-4 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedFeedback(f)}
                          className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                            hasResponse
                              ? "bg-sky-50 text-[#0284c7] border border-sky-200 hover:bg-[#0284c7] hover:text-white dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800"
                              : "bg-[#0284c7] hover:bg-sky-700 text-white shadow-2xs"
                          }`}
                        >
                          {hasResponse ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              Lihat
                            </>
                          ) : isRevisi ? (
                            <>
                              <RotateCcw className="w-3.5 h-3.5" />
                              Tinjau
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              Respon
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <PaginationFooter
            currentPage={safePage}
            totalItems={filteredFeedback.length}
            itemsPerPage={ITEMS_PER_PAGE}
            itemLabel="feedback"
            onPageChange={setPage}
          />
        </div>
      )}

      {/* ================= MODAL ================= */}
      {selectedFeedback && (
        <MentorFeedbackModal
          feedback={selectedFeedback}
          onClose={() => setSelectedFeedback(null)}
          onResponseSent={() => fetchAllFeedback(true)}
        />
      )}
    </div>
  );
}

/* ================= SUB-COMPONENTS ================= */

function StarRow({
  count,
  sizeClass = "w-3.5 h-3.5",
}: {
  count: number;
  sizeClass?: string;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${
            star <= count
              ? "text-amber-500 fill-amber-400"
              : "text-slate-300 dark:text-slate-600"
          }`}
        />
      ))}
    </div>
  );
}

function FeedbackCard({
  feedback,
  onOpen,
}: {
  feedback: MentorFeedbackItem;
  onOpen: () => void;
}) {
  const stage = getFeedbackStage(feedback);
  const hasResponse = stage === "direspon";
  const isRevisi = stage === "revisi";
  const avgScore = getAverageSurveyScore(feedback.survey);
  const roundedStars = avgScore ? Math.round(avgScore) : 0;

  const surveyItems = feedback.survey
    ? [
        { label: "Kepuasan", value: feedback.survey.kepuasanMagang },
        { label: "Rekomendasi", value: feedback.survey.rekomendasiProgram },
        { label: "Proses", value: feedback.survey.kemudahanProses },
        { label: "Skill", value: feedback.survey.peningkatanSkill },
      ].filter((item) => typeof item.value === "number")
    : [];

  return (
    <div
      onClick={onOpen}
      className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-sky-200 dark:hover:border-sky-800 cursor-pointer transition flex flex-col justify-between gap-4"
    >
      {/* Top: Identitas & Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full bg-linear-to-br from-[#0284c7] to-blue-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
            {getInitials(feedback.user?.name || "P")}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
              {feedback.user?.name || "Peserta"}
            </h3>
            {feedback.user?.email && (
              <p className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 truncate max-w-full">
                <Mail className="w-3 h-3 shrink-0" />
                <span className="truncate">{feedback.user.email}</span>
              </p>
            )}
          </div>
        </div>

        <span
          className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            hasResponse
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
              : isRevisi
                ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800"
                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
          }`}
        >
          {hasResponse ? (
            <>
              <CheckCircle2 className="w-3 h-3" />
              Direspon
            </>
          ) : isRevisi ? (
            <>
              <RotateCcw className="w-3 h-3" />
              Perlu Revisi
            </>
          ) : (
            <>
              <Clock className="w-3 h-3" />
              Belum Direspon
            </>
          )}
        </span>
      </div>

      {/* Periode & Penilaian 1-5 */}
      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-[#0284c7] border border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800">
            <Calendar className="w-3 h-3" />
            {formatMonthLabel(feedback.month)}
          </span>

          {avgScore !== null && (
            <div className="inline-flex items-center gap-1.5">
              <StarRow count={roundedStars} />
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                {avgScore}/5
              </span>
            </div>
          )}
        </div>

        {surveyItems.length > 0 && (
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/70 dark:border-slate-700/70">
            {surveyItems.map((item) => {
              const score = Number(item.value || 0);
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-1.5 text-[11px]"
                >
                  <span className="text-slate-500 dark:text-slate-400 truncate">
                    {item.label}
                  </span>
                  <div className="inline-flex items-center gap-1 shrink-0">
                    <StarRow count={score} sizeClass="w-3 h-3" />
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {score}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Isi Feedback */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Masukan Peserta
          </p>
          {!feedback.isFeedbackMentorSent && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
              Draft peserta
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 line-clamp-3 leading-relaxed">
          {feedback.feedbackMentor || "-"}
        </p>

        {hasResponse ? (
          <div className="rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/70 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-0.5">
              Tanggapan Anda
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-200 line-clamp-2">
              {feedback.mentorResponse}
            </p>
          </div>
        ) : (
          isRevisi &&
          feedback.revisionNote && (
            <div className="rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-800/70 p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300 mb-0.5">
                Catatan Revisi Dikirim
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-200 line-clamp-2">
                {feedback.revisionNote}
              </p>
            </div>
          )
        )}
      </div>

      {/* Action */}
      <div
        className="pt-1 flex justify-end"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onOpen}
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            hasResponse
              ? "bg-sky-50 text-[#0284c7] border border-sky-200 hover:bg-[#0284c7] hover:text-white dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800"
              : "bg-[#0284c7] hover:bg-sky-700 text-white shadow-2xs"
          }`}
        >
          {hasResponse ? (
            <>
              <Eye className="w-3.5 h-3.5" />
              Lihat Detail
            </>
          ) : isRevisi ? (
            <>
              <RotateCcw className="w-3.5 h-3.5" />
              Tinjau Revisi
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              Respon Feedback
            </>
          )}
        </button>
      </div>
    </div>
  );
}
