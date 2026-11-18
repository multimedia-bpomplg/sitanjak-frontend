"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpenCheck,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileCheck2,
  GraduationCap,
  Mail,
  MessageSquareHeart,
  Phone,
  RefreshCw,
  Search,
  Users,
  AlertCircle,
  Award,
  ScanFace,
} from "lucide-react";
import AnnouncementBox from "@/components/AnnouncementBox";
import PesertaDetailModal from "@/components/peserta/PesertaDetailModal";
import { MentorDashboardSkeleton } from "@/components/dashboard/skeletons";
import type { Peserta } from "@/types/peserta";

/* ================= TYPES ================= */

type InternshipPhase =
  | "belum_mulai"
  | "sedang_magang"
  | "selesai"
  | "tidak_magang";

type FilterTab =
  | "semua"
  | "perlu_logbook"
  | "belum_dinilai"
  | "sudah_dinilai"
  | "sedang_magang"
  | "belum_mulai"
  | "selesai";

type LogbookStats = {
  total: number;
  menunggu: number;
  revisi: number;
  disetujui: number;
  ditolak: number;
  latestLogbookDate: string | null;
};

type LaporanAkhirSummary = {
  _id: string;
  status: "Menunggu" | "Disetujui" | "Ditolak";
  fileName: string;
  submittedAt: string;
  approvedAt: string | null;
};

type FeedbackStats = {
  total: number;
  belumDirespon: number;
};

type AbsensiStats = {
  totalHari: number;
  averageScore: number | null;
  todayStatus: "masuk" | "wfh" | "izin" | "belum";
  todayCheckInTimeWIB: string | null;
  todayCheckOutTimeWIB: string | null;
};

type PenilaianAkhirSummary = {
  nilaiRataRata: number;
  keteranganRataRata: string;
  tanggalPenilaian: string | null;
};

type EnrichedPeserta = Peserta & {
  phase: InternshipPhase;
  logbookStats: LogbookStats;
  laporanAkhir: LaporanAkhirSummary | null;
  feedbackStats: FeedbackStats;
  absensiStats?: AbsensiStats;
  penilaianAkhir?: PenilaianAkhirSummary | null;
};

type DashboardSummary = {
  totalPeserta: number;
  sedangMagang: number;
  belumMulai: number;
  selesaiMagang: number;
  pesertaDenganLogbookMenunggu: number;
  totalLogbookMenunggu: number;
  pesertaDenganLogbookRevisi: number;
  totalLogbookRevisi: number;
  totalLogbookDisetujui: number;
  laporanAkhirMenunggu: number;
  laporanAkhirDisetujui: number;
  laporanAkhirDitolak: number;
  totalLaporanAkhir: number;
  feedbackTotal: number;
  feedbackBelumDirespon: number;
  absensiHadirHariIni?: number;
  absensiBelumHariIni?: number;
  penilaianAkhirSudah?: number;
  penilaianAkhirBelum?: number;
  penilaianAkhirRataRata?: number | null;
};

type MentorDashboardResponse = {
  mentor: {
    name: string;
    email: string;
    posisiMentor: string;
  } | null;
  summary: DashboardSummary;
  peserta: EnrichedPeserta[];
};

/* ================= HELPERS ================= */

function getNowWIB(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
  );
}

function getInitials(name = "M"): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "M"
  );
}

function formatShortDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function calculateMagangProgress(
  startStr?: string,
  endStr?: string,
  todayWIB?: Date,
): { hariKe: number; totalHari: number; persentase: number } | null {
  if (!startStr || !endStr) return null;
  const startRaw = new Date(startStr);
  const endRaw = new Date(endStr);
  if (Number.isNaN(startRaw.getTime()) || Number.isNaN(endRaw.getTime())) {
    return null;
  }

  const now = todayWIB || getNowWIB();
  const startDay = new Date(
    startRaw.getFullYear(),
    startRaw.getMonth(),
    startRaw.getDate(),
  );
  const endDay = new Date(
    endRaw.getFullYear(),
    endRaw.getMonth(),
    endRaw.getDate(),
  );
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (endDay < startDay) return null;

  const msPerDay = 1000 * 60 * 60 * 24;
  const totalHari =
    Math.round((endDay.getTime() - startDay.getTime()) / msPerDay) + 1;
  const rawHariKe =
    Math.round((nowDay.getTime() - startDay.getTime()) / msPerDay) + 1;
  const hariKe = Math.min(totalHari, Math.max(0, rawHariKe));
  const persentase = Math.min(
    100,
    Math.max(0, Math.round((hariKe / totalHari) * 100)),
  );

  return { hariKe, totalHari, persentase };
}

function getPhaseBadge(phase: InternshipPhase) {
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
          "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/70",
      };
    case "selesai":
      return {
        label: "Selesai Magang",
        className:
          "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      };
    default:
      return {
        label: "Tidak Magang",
        className:
          "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/70",
      };
  }
}

function getLaporanBadge(laporan: LaporanAkhirSummary | null) {
  if (!laporan) {
    return {
      label: "Belum Upload",
      className:
        "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
    };
  }
  switch (laporan.status) {
    case "Disetujui":
      return {
        label: "Disetujui",
        className:
          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/70",
      };
    case "Ditolak":
      return {
        label: "Ditolak",
        className:
          "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/70",
      };
    default:
      return {
        label: "Menunggu Review",
        className:
          "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/70",
      };
  }
}

const ITEMS_PER_PAGE = 6;

/* ================= MAIN PAGE ================= */

export default function MentorDashboard() {
  const [dashboard, setDashboard] = useState<MentorDashboardResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mentorNameFromToken, setMentorNameFromToken] = useState("Mentor");

  const [activeFilter, setActiveFilter] = useState<FilterTab>("semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedPeserta, setSelectedPeserta] = useState<Peserta | null>(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload?.name || payload?.nama) {
        setMentorNameFromToken(payload.name || payload.nama);
      }
    } catch {
      // Abaikan jika token gagal di-parse
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/mentor/dashboard-summary`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error("Gagal memuat ringkasan dashboard mentor");
      }

      const data: MentorDashboardResponse = await res.json();
      setDashboard(data);
    } catch (err: unknown) {
      console.error("Gagal memuat dashboard mentor:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memuat data.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const todayWIB = useMemo(() => getNowWIB(), []);
  const formattedToday = useMemo(
    () =>
      todayWIB.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [todayWIB],
  );

  const pesertaList = useMemo(() => dashboard?.peserta || [], [dashboard]);
  const summary = dashboard?.summary || {
    totalPeserta: 0,
    sedangMagang: 0,
    belumMulai: 0,
    selesaiMagang: 0,
    pesertaDenganLogbookMenunggu: 0,
    totalLogbookMenunggu: 0,
    pesertaDenganLogbookRevisi: 0,
    totalLogbookRevisi: 0,
    totalLogbookDisetujui: 0,
    laporanAkhirMenunggu: 0,
    laporanAkhirDisetujui: 0,
    laporanAkhirDitolak: 0,
    totalLaporanAkhir: 0,
    feedbackTotal: 0,
    feedbackBelumDirespon: 0,
    absensiHadirHariIni: 0,
    absensiBelumHariIni: 0,
    penilaianAkhirSudah: 0,
    penilaianAkhirBelum: 0,
    penilaianAkhirRataRata: null,
  };

  const pesertaMenungguLogbookList = useMemo(
    () => pesertaList.filter((p) => p.logbookStats.menunggu > 0),
    [pesertaList],
  );

  const filteredPeserta = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return pesertaList.filter((p) => {
      if (activeFilter === "perlu_logbook" && p.logbookStats.menunggu === 0) {
        return false;
      }
      if (activeFilter === "belum_dinilai" && Boolean(p.penilaianAkhir)) {
        return false;
      }
      if (activeFilter === "sudah_dinilai" && !p.penilaianAkhir) {
        return false;
      }
      if (
        activeFilter === "sedang_magang" &&
        p.phase !== "sedang_magang"
      ) {
        return false;
      }
      if (activeFilter === "belum_mulai" && p.phase !== "belum_mulai") {
        return false;
      }
      if (activeFilter === "selesai" && p.phase !== "selesai") {
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
  }, [pesertaList, activeFilter, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [activeFilter, searchQuery]);

  const totalPage = Math.max(1, Math.ceil(filteredPeserta.length / ITEMS_PER_PAGE));
  const paginatedPeserta = filteredPeserta.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  if (loading) {
    return <MentorDashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Gagal Memuat Dashboard
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
            {error}
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
      </div>
    );
  }

  const displayName = dashboard?.mentor?.name || mentorNameFromToken;
  const firstName = displayName.trim().split(" ")[0] || displayName;
  const posisiMentor = dashboard?.mentor?.posisiMentor;

  const filterTabs: Array<{ id: FilterTab; label: string; count: number }> = [
    { id: "semua", label: "Semua", count: summary.totalPeserta },
    {
      id: "perlu_logbook",
      label: "Logbook Menunggu",
      count: summary.pesertaDenganLogbookMenunggu,
    },
    {
      id: "belum_dinilai",
      label: "Belum Dinilai",
      count:
        summary.penilaianAkhirBelum ??
        pesertaList.filter((p) => !p.penilaianAkhir).length,
    },
    {
      id: "sudah_dinilai",
      label: "Sudah Dinilai",
      count:
        summary.penilaianAkhirSudah ??
        pesertaList.filter((p) => Boolean(p.penilaianAkhir)).length,
    },
    { id: "sedang_magang", label: "Sedang Magang", count: summary.sedangMagang },
    { id: "belum_mulai", label: "Belum Mulai", count: summary.belumMulai },
    { id: "selesai", label: "Selesai", count: summary.selesaiMagang },
  ];

  return (
    <div className="space-y-6">
      {/* ================= 1. HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Halo, {firstName} 👋
            </h1>
            {posisiMentor && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                {posisiMentor}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {formattedToday} • Ringkasan bimbingan & progres peserta magang Anda
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={fetchDashboard}
            title="Muat ulang data"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* ================= 2. PENGUMUMAN ================= */}
      <AnnouncementBox type="mentor" />

      {/* ================= 3. KPI SUMMARY CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryStatCard
          href="/dashboard/mentor/peserta"
          title="Peserta Bimbingan"
          value={summary.totalPeserta}
          unit="peserta"
          subtitle={`${summary.sedangMagang} aktif • ${summary.belumMulai} belum mulai • ${summary.selesaiMagang} selesai`}
          icon={<Users className="w-5 h-5" />}
          accent="blue"
        />

        <SummaryStatCard
          href="/dashboard/mentor/ViewLogbook"
          title="Logbook Belum Disetujui"
          value={summary.pesertaDenganLogbookMenunggu}
          unit="peserta"
          subtitle={
            summary.totalLogbookMenunggu > 0
              ? `${summary.totalLogbookMenunggu} entri menunggu • ${summary.totalLogbookRevisi} revisi`
              : `${summary.totalLogbookDisetujui} logbook sudah disetujui`
          }
          icon={<BookOpenCheck className="w-5 h-5" />}
          accent={summary.pesertaDenganLogbookMenunggu > 0 ? "amber" : "emerald"}
          highlight={summary.pesertaDenganLogbookMenunggu > 0}
        />

        <SummaryStatCard
          href="/dashboard/mentor/ViewAbsensi"
          title="Absensi Hari Ini"
          value={summary.absensiHadirHariIni ?? 0}
          unit={`dari ${summary.sedangMagang} aktif`}
          subtitle={
            (summary.absensiBelumHariIni ?? 0) > 0
              ? `${summary.absensiBelumHariIni} peserta aktif belum absen hari ini`
              : summary.sedangMagang > 0
                ? "Semua peserta aktif sudah absen hari ini"
                : "Belum ada peserta sedang magang"
          }
          icon={<ScanFace className="w-5 h-5" />}
          accent={(summary.absensiBelumHariIni ?? 0) > 0 ? "amber" : "emerald"}
          highlight={(summary.absensiBelumHariIni ?? 0) > 0}
        />

        <SummaryStatCard
          href="/dashboard/mentor/ViewLaporanAkhir"
          title="Laporan Akhir Perlu Review"
          value={summary.laporanAkhirMenunggu}
          unit="laporan"
          subtitle={`${summary.laporanAkhirDisetujui} disetujui • ${summary.totalLaporanAkhir} terkumpul`}
          icon={<GraduationCap className="w-5 h-5" />}
          accent={summary.laporanAkhirMenunggu > 0 ? "purple" : "emerald"}
          highlight={summary.laporanAkhirMenunggu > 0}
        />

        <SummaryStatCard
          href="/dashboard/mentor/ViewPenilaianAkhir"
          title="Penilaian Akhir Magang"
          value={summary.penilaianAkhirBelum ?? 0}
          unit="belum dinilai"
          subtitle={
            summary.penilaianAkhirRataRata !== null &&
            summary.penilaianAkhirRataRata !== undefined
              ? `${summary.penilaianAkhirSudah ?? 0} dinilai • Rata-rata ${summary.penilaianAkhirRataRata}`
              : `${summary.penilaianAkhirSudah ?? 0} peserta sudah dinilai`
          }
          icon={<Award className="w-5 h-5" />}
          accent={(summary.penilaianAkhirBelum ?? 0) > 0 ? "purple" : "emerald"}
          highlight={(summary.penilaianAkhirBelum ?? 0) > 0}
        />

        <SummaryStatCard
          href="/dashboard/mentor/ViewFeedback"
          title="Feedback Belum Direspon"
          value={summary.feedbackBelumDirespon}
          unit="feedback"
          subtitle={`Dari total ${summary.feedbackTotal} feedback masuk`}
          icon={<MessageSquareHeart className="w-5 h-5" />}
          accent={summary.feedbackBelumDirespon > 0 ? "rose" : "emerald"}
          highlight={summary.feedbackBelumDirespon > 0}
        />
      </div>

      {/* ================= 4. PERLU TINDAK LANJUT ================= */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Perlu Tindak Lanjut
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ringkasan tugas aktif mentor berdasarkan data terbaru
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Task 1: Verifikasi Logbook */}
          <Link
            href="/dashboard/mentor/ViewLogbook"
            className="group flex items-start justify-between gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-sm transition"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <BookOpenCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Verifikasi Logbook
                </p>
                {pesertaMenungguLogbookList.length > 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {pesertaMenungguLogbookList.length} peserta
                    </span>{" "}
                    menunggu:{" "}
                    {pesertaMenungguLogbookList
                      .slice(0, 2)
                      .map((p) => p.nama.split(" ")[0])
                      .join(", ")}
                    {pesertaMenungguLogbookList.length > 2
                      ? ` +${pesertaMenungguLogbookList.length - 2} lainnya`
                      : ""}
                  </p>
                ) : (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Semua logbook sudah diverifikasi
                  </p>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition shrink-0 mt-1" />
          </Link>

          {/* Task 2: Absensi Kehadiran */}
          <Link
            href="/dashboard/mentor/ViewAbsensi"
            className="group flex items-start justify-between gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-sm transition"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400 flex items-center justify-center shrink-0">
                <ScanFace className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Absensi Kehadiran
                </p>
                {summary.sedangMagang > 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span className="font-semibold text-[#0284c7] dark:text-sky-400">
                      {summary.absensiHadirHariIni ?? 0}/{summary.sedangMagang} peserta
                    </span>{" "}
                    sudah absen hari ini
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Pantau kehadiran masuk, WFH, dan izin peserta
                  </p>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition shrink-0 mt-1" />
          </Link>

          {/* Task 3: Review Laporan Akhir */}
          <Link
            href="/dashboard/mentor/ViewLaporanAkhir"
            className="group flex items-start justify-between gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-sm transition"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Review Laporan Akhir
                </p>
                {summary.laporanAkhirMenunggu > 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      {summary.laporanAkhirMenunggu} laporan
                    </span>{" "}
                    menunggu persetujuan
                  </p>
                ) : (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Tidak ada laporan akhir tertunda
                  </p>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition shrink-0 mt-1" />
          </Link>

          {/* Task 4: Penilaian Akhir Magang */}
          <Link
            href="/dashboard/mentor/ViewPenilaianAkhir"
            className="group flex items-start justify-between gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm transition"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Penilaian Akhir Magang
                </p>
                {(summary.penilaianAkhirBelum ?? 0) > 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span className="font-semibold text-violet-600 dark:text-violet-400">
                      {summary.penilaianAkhirBelum} peserta
                    </span>{" "}
                    belum mendapatkan nilai akhir
                  </p>
                ) : (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Semua peserta bimbingan sudah dinilai
                  </p>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition shrink-0 mt-1" />
          </Link>

          {/* Task 5: Balas Feedback */}
          <Link
            href="/dashboard/mentor/ViewFeedback"
            className="group flex items-start justify-between gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-sm transition"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <MessageSquareHeart className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Respon Feedback Peserta
                </p>
                {summary.feedbackBelumDirespon > 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      {summary.feedbackBelumDirespon} feedback
                    </span>{" "}
                    belum mendapatkan tanggapan
                  </p>
                ) : (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Semua feedback sudah direspon
                  </p>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition shrink-0 mt-1" />
          </Link>
        </div>
      </div>

      {/* ================= 5. DAFTAR PESERTA MAGANG BIMBINGAN ================= */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Daftar Peserta Magang Bimbingan
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Pantau identitas, periode magang, status logbook, dan laporan akhir
              setiap peserta
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, posisi, kampus/SMK..."
              className="w-full pl-10 pr-8 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
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

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
                  isActive
                    ? "bg-slate-900 text-white border-slate-900 dark:bg-emerald-600 dark:border-emerald-600"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                    isActive
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

        {/* Grid Cards */}
        {paginatedPeserta.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 py-12 px-4 text-center space-y-2">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {pesertaList.length === 0
                ? "Belum ada peserta magang yang ditugaskan"
                : "Tidak ada peserta yang sesuai dengan filter"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {pesertaList.length === 0
                ? "Peserta bimbingan Anda akan muncul di sini setelah ditugaskan oleh admin."
                : "Coba ubah kata kunci pencarian atau pilih tab filter lain."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedPeserta.map((p, idx) => (
              <PesertaBimbinganCard
                key={p.userId || `${p.email}-${idx}`}
                peserta={p}
                todayWIB={todayWIB}
                onOpenDetail={() => setSelectedPeserta(p)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPage > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Menampilkan {(page - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(page * ITEMS_PER_PAGE, filteredPeserta.length)} dari{" "}
              {filteredPeserta.length} peserta
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition"
              >
                Sebelumnya
              </button>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 px-2">
                {page} / {totalPage}
              </span>
              <button
                disabled={page === totalPage}
                onClick={() => setPage((prev) => prev + 1)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL DETAIL PESERTA ================= */}
      <PesertaDetailModal
        open={Boolean(selectedPeserta)}
        peserta={selectedPeserta}
        onClose={() => setSelectedPeserta(null)}
      />
    </div>
  );
}

/* ================= SUB-COMPONENTS ================= */

function SummaryStatCard({
  href,
  title,
  value,
  unit,
  subtitle,
  icon,
  accent,
  highlight = false,
}: {
  href: string;
  title: string;
  value: number;
  unit: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: "blue" | "amber" | "purple" | "rose" | "emerald";
  highlight?: boolean;
}) {
  const accentStyles: Record<
    typeof accent,
    {
      cardBg: string;
      iconBg: string;
      border: string;
      titleText: string;
      valueText: string;
      unitText: string;
      divider: string;
      subtitleText: string;
      chevron: string;
    }
  > = {
    blue: {
      cardBg:
        "bg-linear-to-br from-[#0284c7] via-sky-600 to-blue-700 dark:from-[#0369a1] dark:to-blue-800",
      iconBg: "bg-white/20 text-white backdrop-blur-xs",
      border: "border-sky-500/30",
      titleText: "text-sky-100",
      valueText: "text-white",
      unitText: "text-sky-100",
      divider: "border-white/20",
      subtitleText: "text-sky-100/90",
      chevron: "text-sky-100",
    },
    amber: {
      cardBg: "bg-white dark:bg-slate-900/90",
      iconBg:
        "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
      border: highlight
        ? "border-amber-300/80 dark:border-amber-700/70"
        : "border-slate-200/80 dark:border-slate-800",
      titleText: "text-slate-500 dark:text-slate-400",
      valueText: "text-amber-700 dark:text-amber-300",
      unitText: "text-slate-500 dark:text-slate-400",
      divider: "border-slate-100 dark:border-slate-800",
      subtitleText: "text-slate-500 dark:text-slate-400",
      chevron: "text-slate-400",
    },
    purple: {
      cardBg: "bg-white dark:bg-slate-900/90",
      iconBg:
        "bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400",
      border: highlight
        ? "border-purple-300/80 dark:border-purple-700/70"
        : "border-slate-200/80 dark:border-slate-800",
      titleText: "text-slate-500 dark:text-slate-400",
      valueText: "text-purple-700 dark:text-purple-300",
      unitText: "text-slate-500 dark:text-slate-400",
      divider: "border-slate-100 dark:border-slate-800",
      subtitleText: "text-slate-500 dark:text-slate-400",
      chevron: "text-slate-400",
    },
    rose: {
      cardBg: "bg-white dark:bg-slate-900/90",
      iconBg: "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400",
      border: highlight
        ? "border-rose-300/80 dark:border-rose-700/70"
        : "border-slate-200/80 dark:border-slate-800",
      titleText: "text-slate-500 dark:text-slate-400",
      valueText: "text-rose-700 dark:text-rose-300",
      unitText: "text-slate-500 dark:text-slate-400",
      divider: "border-slate-100 dark:border-slate-800",
      subtitleText: "text-slate-500 dark:text-slate-400",
      chevron: "text-slate-400",
    },
    emerald: {
      cardBg: "bg-white dark:bg-slate-900/90",
      iconBg:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
      border: "border-slate-200/80 dark:border-slate-800",
      titleText: "text-slate-500 dark:text-slate-400",
      valueText: "text-slate-900 dark:text-white",
      unitText: "text-slate-500 dark:text-slate-400",
      divider: "border-slate-100 dark:border-slate-800",
      subtitleText: "text-slate-500 dark:text-slate-400",
      chevron: "text-slate-400",
    },
  };

  const style = accentStyles[accent];

  return (
    <Link
      href={href}
      className={`group rounded-2xl border ${style.border} ${style.cardBg} p-4 sm:p-5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between gap-3`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold ${style.titleText}`}>
            {title}
          </p>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className={`text-3xl font-extrabold ${style.valueText}`}>
              {value}
            </span>
            <span className={`text-xs font-medium ${style.unitText}`}>
              {unit}
            </span>
          </div>
        </div>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.iconBg}`}
        >
          {icon}
        </div>
      </div>

      <div
        className={`flex items-center justify-between gap-2 pt-2.5 border-t ${style.divider}`}
      >
        <span className={`text-[11px] sm:text-xs truncate ${style.subtitleText}`}>
          {subtitle}
        </span>
        <ChevronRight
          className={`w-3.5 h-3.5 ${style.chevron} group-hover:translate-x-0.5 transition shrink-0`}
        />
      </div>
    </Link>
  );
}

function PesertaBimbinganCard({
  peserta,
  todayWIB,
  onOpenDetail,
}: {
  peserta: EnrichedPeserta;
  todayWIB: Date;
  onOpenDetail: () => void;
}) {
  const phaseBadge = getPhaseBadge(peserta.phase);
  const laporanBadge = getLaporanBadge(peserta.laporanAkhir);
  const progress = calculateMagangProgress(
    peserta.tanggalMulaiMagang,
    peserta.tanggalSelesaiMagang,
    todayWIB,
  );

  const { menunggu, revisi, disetujui, total } = peserta.logbookStats;

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 sm:p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between gap-4">
      {/* Top: Identitas & Status Magang */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full bg-linear-to-br from-[#0284c7] via-sky-600 to-blue-700 dark:from-[#0369a1] dark:to-blue-800 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
            {getInitials(peserta.nama)}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
              {peserta.nama}
            </h3>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">
              {peserta.posisi}
              {peserta.jurusan ? ` • ${peserta.jurusan}` : ""}
            </p>
            {peserta.asal?.nama && (
              <p className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-full">
                <Building2 className="w-3 h-3 shrink-0" />
                <span className="truncate">{peserta.asal.nama}</span>
              </p>
            )}
          </div>
        </div>

        <span
          className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${phaseBadge.className}`}
        >
          {phaseBadge.label}
        </span>
      </div>

      {/* Periode & Progress Magang */}
      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {formatShortDate(peserta.tanggalMulaiMagang)} –{" "}
            {formatShortDate(peserta.tanggalSelesaiMagang)}
          </span>
          {progress && (
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {progress.persentase}%
            </span>
          )}
        </div>

        {progress && (
          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-linear-to-r from-emerald-500 to-teal-500 transition-all"
              style={{ width: `${progress.persentase}%` }}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
          <span className="inline-flex items-center gap-1 truncate max-w-full">
            <Mail className="w-3 h-3 shrink-0" />
            <span className="truncate">{peserta.email}</span>
          </span>
          {peserta.wa && (
            <span className="inline-flex items-center gap-1">
              <Phone className="w-3 h-3 shrink-0" />
              {peserta.wa}
            </span>
          )}
        </div>
      </div>

      {/* Status Logbook, Absensi, Laporan Akhir & Penilaian Akhir */}
      <div className="grid grid-cols-2 gap-2.5 text-xs">
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            Status Logbook
          </p>
          {total === 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              Belum ada logbook
            </span>
          ) : menunggu > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              {menunggu} belum disetujui
            </span>
          ) : revisi > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400">
              <Clock className="w-3.5 h-3.5" />
              {revisi} menunggu revisi
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {disetujui} disetujui
            </span>
          )}
        </div>

        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            Absensi Kehadiran
          </p>
          {peserta.absensiStats && peserta.absensiStats.totalHari > 0 ? (
            <div className="space-y-0.5">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                  peserta.absensiStats.todayStatus === "masuk"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/70"
                    : peserta.absensiStats.todayStatus === "wfh"
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/70"
                      : peserta.absensiStats.todayStatus === "izin"
                        ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800/70"
                        : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                }`}
              >
                {peserta.absensiStats.todayStatus === "masuk"
                  ? `Hadir${peserta.absensiStats.todayCheckInTimeWIB ? ` (${peserta.absensiStats.todayCheckInTimeWIB})` : ""}`
                  : peserta.absensiStats.todayStatus === "wfh"
                    ? "WFH Hari Ini"
                    : peserta.absensiStats.todayStatus === "izin"
                      ? "Izin Hari Ini"
                      : "Belum Absen Hari Ini"}
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                Rata-rata {peserta.absensiStats.averageScore ?? 0}% •{" "}
                {peserta.absensiStats.totalHari} hari
              </p>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              Belum ada absensi
            </span>
          )}
        </div>

        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            Laporan Akhir
          </p>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${laporanBadge.className}`}
          >
            {laporanBadge.label}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            Penilaian Akhir
          </p>
          {peserta.penilaianAkhir ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white tabular-nums">
                {peserta.penilaianAkhir.nilaiRataRata}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/70">
                {peserta.penilaianAkhir.keteranganRataRata || "Sudah Dinilai"}
              </span>
            </div>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/70">
              Belum Dinilai
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          onClick={onOpenDetail}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white transition"
        >
          Detail
        </button>

        <Link
          href="/dashboard/mentor/ViewLogbook"
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <BookOpenCheck className="w-3.5 h-3.5" />
          Logbook
        </Link>

        <Link
          href="/dashboard/mentor/ViewAbsensi"
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <ScanFace className="w-3.5 h-3.5" />
          Absensi
        </Link>

        <Link
          href="/dashboard/mentor/ViewLaporanAkhir"
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <GraduationCap className="w-3.5 h-3.5" />
          Laporan
        </Link>

        <Link
          href="/dashboard/mentor/ViewPenilaianAkhir"
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-violet-200 dark:border-violet-800/80 bg-violet-50/70 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition"
        >
          <Award className="w-3.5 h-3.5" />
          Penilaian
        </Link>
      </div>
    </div>
  );
}
