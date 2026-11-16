"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  CalendarX2,
  CalendarCheck2,
  CalendarPlus,
  Clock,
  ChevronRight,
  AlertCircle,
  X,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { PesertaDashboardSkeleton } from "@/components/dashboard/skeletons";

/* ================= TYPES ================= */

type Peserta = {
  idPeserta?: string;
  nama: string;
  email: string;
  wa: string;
  posisi: string;
  jenisKelamin: string;
  tempatLahir: string;
  tanggalLahir: string;
  tanggalMulaiMagang: string;
  tanggalSelesaiMagang: string;
  provinsi: string;
  kota: string;
  kecamatan: string;
  kelurahan: string;
  alamatLengkap: string;
  mentor?: {
    name: string;
    email: string;
    posisiMentor: string;
  };
  mentorNama?: string;
  mentorEmail?: string;
  mentorPosisi?: string;
};

type Pendaftaran = {
  status: string;
  kategori: string;
  suratPengantar?: string;
  suratBalasan?: string;
  jawabanAdmin?: string;
  peserta: Peserta[];
};

type Announcement = {
  _id: string;
  title: string;
  subtitle?: string;
  content: string;
  image?: string;
  isActive: boolean;
  createdAt?: string;
};

type FilledDateType = {
  _id: string;
  status: "hadir" | "tidak_hadir_keterangan" | "tidak_hadir_tanpa_keterangan";
  approvalStatus: "menunggu" | "disetujui" | "ditolak" | "revisi";
};

/* ================= HELPERS ================= */

function getNowWIB(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
  );
}

function formatShortPeriodDate(dateStr?: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatFullTodayDate(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const getInitial = (nama = "-") =>
  nama
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function PesertaDashboard() {
  const [pendaftaran, setPendaftaran] = useState<Pendaftaran | null>(null);
  const [emailLogin, setEmailLogin] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [filledDates, setFilledDates] = useState<
    Record<string, FilledDateType>
  >({});

  // Parse email from JWT token
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setEmailLogin(payload.email);
      }
    } catch (err) {
      console.error("Gagal parse token", err);
    }
  }, []);

  // Fetch Pendaftaran Data
  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !emailLogin) return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/pendaftaran/cek?email=${encodeURIComponent(emailLogin)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error("Gagal mengambil data pendaftaran");
      const data = await res.json();
      setPendaftaran(data);
    } catch (err) {
      console.error("Gagal memuat dashboard peserta", err);
    }
  }, [emailLogin]);

  // Fetch Announcements & Logbook Filled Dates
  const fetchActivitiesAndAnnouncements = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const [annRes, datesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/announcements/peserta`).catch(
          () => null,
        ),
        token
          ? fetch(`${process.env.NEXT_PUBLIC_API_URL}/logbook/filled-dates`, {
              headers,
            }).catch(() => null)
          : Promise.resolve(null),
      ]);

      if (annRes && annRes.ok) {
        const annData = await annRes.json();
        if (Array.isArray(annData)) {
          setAnnouncements(annData.filter((item: any) => item.isActive));
        }
      }

      if (datesRes && datesRes.ok) {
        const datesData = await datesRes.json();
        if (datesData && typeof datesData === "object") {
          setFilledDates(datesData);
        }
      }
    } catch (err) {
      console.error("Gagal memuat aktivitas/pengumuman", err);
    }
  }, []);

  useEffect(() => {
    if (emailLogin) {
      fetchData();
      fetchActivitiesAndAnnouncements();
    }
  }, [emailLogin, fetchData, fetchActivitiesAndAnnouncements]);

  // Find current logged-in participant
  const peserta = useMemo(() => {
    if (!pendaftaran || !emailLogin) return null;
    return pendaftaran.peserta.find(
      (p) => p.email.toLowerCase() === emailLogin.toLowerCase(),
    );
  }, [pendaftaran, emailLogin]);

  // Today's date info in WIB
  const todayWIB = useMemo(() => getNowWIB(), []);
  const todayIso = useMemo(
    () =>
      todayWIB.toLocaleDateString("en-CA", {
        timeZone: "Asia/Jakarta",
      }),
    [todayWIB],
  );
  const isWeekend = useMemo(() => {
    const day = todayWIB.getDay();
    return day === 0 || day === 6; // Minggu (0) atau Sabtu (6)
  }, [todayWIB]);

  const todayLogbook = filledDates[todayIso];

  // Check whether today is within participant's internship dates
  const periodStatus = useMemo(() => {
    if (!peserta?.tanggalMulaiMagang || !peserta?.tanggalSelesaiMagang) {
      return { isBeforeStart: false, isAfterEnd: false, isWithinPeriod: true };
    }
    const sRaw = new Date(peserta.tanggalMulaiMagang);
    const eRaw = new Date(peserta.tanggalSelesaiMagang);
    if (isNaN(sRaw.getTime()) || isNaN(eRaw.getTime())) {
      return { isBeforeStart: false, isAfterEnd: false, isWithinPeriod: true };
    }
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate(),
      ).padStart(2, "0")}`;
    const startIso = fmt(sRaw);
    const endIso = fmt(eRaw);

    const isBeforeStart = todayIso < startIso;
    const isAfterEnd = todayIso > endIso;
    return {
      isBeforeStart,
      isAfterEnd,
      isWithinPeriod: !isBeforeStart && !isAfterEnd,
    };
  }, [peserta?.tanggalMulaiMagang, peserta?.tanggalSelesaiMagang, todayIso]);

  // Counts for "Informasi Aktivitas"
  const activityCounts = useMemo(() => {
    const entries = Object.values(filledDates);
    const menunggu = entries.filter(
      (e) => e.approvalStatus === "menunggu",
    ).length;
    const revisi = entries.filter((e) => e.approvalStatus === "revisi").length;
    const disetujui = entries.filter(
      (e) => e.approvalStatus === "disetujui",
    ).length;
    return { menunggu, revisi, disetujui, total: entries.length };
  }, [filledDates]);

  // Internship day counter, remaining days, and completion percentage
  const magangProgress = useMemo(() => {
    if (!peserta?.tanggalMulaiMagang || !peserta?.tanggalSelesaiMagang) {
      return null;
    }
    const startRaw = new Date(peserta.tanggalMulaiMagang);
    const endRaw = new Date(peserta.tanggalSelesaiMagang);
    if (isNaN(startRaw.getTime()) || isNaN(endRaw.getTime())) {
      return null;
    }

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
    const nowDay = new Date(
      todayWIB.getFullYear(),
      todayWIB.getMonth(),
      todayWIB.getDate(),
    );

    if (endDay < startDay) return null;

    const msPerDay = 1000 * 60 * 60 * 24;
    const totalHari =
      Math.round((endDay.getTime() - startDay.getTime()) / msPerDay) + 1;
    const rawHariKe =
      Math.round((nowDay.getTime() - startDay.getTime()) / msPerDay) + 1;

    const hariKe = Math.min(totalHari, Math.max(0, rawHariKe));
    const sisaHari = Math.max(0, totalHari - hariKe);
    const persentase = Math.min(
      100,
      Math.max(0, Math.round((hariKe / totalHari) * 100)),
    );

    return {
      hariKe,
      totalHari,
      sisaHari,
      persentase,
    };
  }, [peserta?.tanggalMulaiMagang, peserta?.tanggalSelesaiMagang, todayWIB]);

  if (!pendaftaran) {
    return <PesertaDashboardSkeleton />;
  }

  if (!peserta) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-center px-4">
        <span className="text-sm text-slate-400">
          Data peserta untuk akun ini tidak ditemukan.
        </span>
      </div>
    );
  }

  const firstName = peserta.nama?.trim().split(" ")[0] || peserta.nama;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ================= 1. TOP HEADER ================= */}
      <div className="flex items-start justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Halo, {firstName}</span>
            <span className="inline-block">👋</span>
          </h1>
          <p className="text-xs sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            Balai Besar POM di Palembang
          </p>
        </div>

        <Link
          href="/dashboard/peserta/ganti-password"
          title="Akun Peserta"
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-linear-to-br from-[#991B1B] to-[#DC2626] text-white font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 ring-2 ring-white dark:ring-slate-800 shadow-sm hover:opacity-95 transition"
        >
          {getInitial(peserta.nama)}
        </Link>
      </div>

      {/* ================= 1B. PROGRESS WAKTU MAGANG ================= */}
      {magangProgress && (
        <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p
                className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white"
                style={{ fontWeight: 800 }}
              >
                Hari ke-{magangProgress.hariKe}{" "}
                <span className="text-slate-500 dark:text-slate-400 font-semibold">
                  dari {magangProgress.totalHari} hari magang
                </span>
              </p>
              <p
                className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 mt-0.5"
                style={{ fontWeight: 600 }}
              >
                {magangProgress.sisaHari > 0
                  ? `Sisa ${magangProgress.sisaHari} hari lagi`
                  : "Masa magang telah selesai"}
              </p>
            </div>

            <span
              className="px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-extrabold bg-blue-50 text-[#1D64F2] border border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800/70 shrink-0"
              style={{ fontWeight: 800 }}
            >
              {magangProgress.persentase}% Selesai
            </span>
          </div>

          {/* Horizontal Progress Bar */}
          <div className="space-y-1.5">
            <div className="h-2.5 sm:h-3 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-linear-to-r from-[#1D64F2] to-[#3B82F6] transition-all duration-500"
                style={{ width: `${magangProgress.persentase}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] sm:text-xs font-medium text-slate-400 dark:text-slate-400">
              <span>
                Mulai: {formatShortPeriodDate(peserta.tanggalMulaiMagang)}
              </span>
              <span>
                Selesai: {formatShortPeriodDate(peserta.tanggalSelesaiMagang)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ================= 2. ANNOUNCEMENT BANNER ================= */}
      {announcements.length > 0 && (
        <div className="rounded-xl bg-[#FEF3C7]/90 dark:bg-amber-950/50 border border-[#FDE68A] dark:border-amber-800/70 px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#D97706] text-white flex items-center justify-center text-xs sm:text-sm font-bold shrink-0">
              !
            </span>
            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-amber-100 truncate">
              {announcements.length} pengumuman · {announcements.length} baru
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAnnouncementModal(true)}
            className="text-xs sm:text-sm font-bold text-slate-900 dark:text-amber-200 underline underline-offset-2 shrink-0 hover:text-blue-600 transition"
          >
            Lihat pengumuman
          </button>
        </div>
      )}

      {/* ================= 3. CARD "HARI INI" ================= */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-6 shadow-2xs space-y-5 sm:space-y-6">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 sm:gap-3.5">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1D64F2] dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                Hari Ini
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                {formatFullTodayDate(todayWIB)}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                Periode magang{" "}
                {formatShortPeriodDate(peserta.tanggalMulaiMagang)}–
                {formatShortPeriodDate(peserta.tanggalSelesaiMagang)}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold border shrink-0 ${
              periodStatus.isAfterEnd
                ? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600"
                : periodStatus.isBeforeStart
                  ? "bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60"
                  : "bg-emerald-50 text-emerald-600 border-emerald-200/70 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60"
            }`}
          >
            {periodStatus.isAfterEnd
              ? "Selesai"
              : periodStatus.isBeforeStart
                ? "Belum Mulai"
                : "Aktif"}
          </span>
        </div>

        {/* Card Body: Period Check -> Holiday vs Workday */}
        {periodStatus.isAfterEnd ? (
          <div className="py-5 sm:py-6 px-3 text-center space-y-3 sm:space-y-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CalendarCheck2 className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Masa magang Anda telah selesai
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Periode magang berakhir pada{" "}
                <b>{formatShortPeriodDate(peserta.tanggalSelesaiMagang)}</b>.
                Pengisian kehadiran dan laporan harian baru sudah ditutup.
              </p>
            </div>
            <div className="pt-1">
              <Link
                href="/dashboard/peserta/isi-logbook"
                className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white transition"
              >
                <FileText className="w-4 h-4" />
                <span>Lihat Riwayat Kehadiran</span>
              </Link>
            </div>
          </div>
        ) : periodStatus.isBeforeStart ? (
          <div className="py-5 sm:py-6 px-3 text-center space-y-2.5 sm:space-y-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Periode magang belum dimulai
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Jadwal magang Anda dimulai pada{" "}
              <b>{formatShortPeriodDate(peserta.tanggalMulaiMagang)}</b>. Form
              pengisian laporan harian akan aktif saat masa magang dimulai.
            </p>
          </div>
        ) : isWeekend ? (
          <div className="py-6 sm:py-8 px-3 text-center space-y-2.5 sm:space-y-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-100 dark:bg-slate-700/70 text-slate-500 dark:text-slate-300 flex items-center justify-center mx-auto">
              <CalendarX2 className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Hari ini adalah hari libur
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Hari ini termasuk jadwal libur posisi Anda. Laporan harian dan
              kehadiran tidak perlu diisi.
            </p>
          </div>
        ) : todayLogbook ? (
          <div className="py-5 sm:py-6 px-3 text-center space-y-3 sm:space-y-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CalendarCheck2 className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Laporan hari ini telah dikirim
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Kehadiran dan laporan aktivitas harian Anda untuk hari ini sudah
                tercatat di sistem.
              </p>
            </div>
            <div className="pt-1 flex justify-center gap-2">
              <Link
                href="/dashboard/peserta/isi-logbook?isi=1"
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white transition"
              >
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>
                  {todayLogbook.approvalStatus === "revisi"
                    ? "Perbaiki Laporan Hari Ini"
                    : "Lihat Laporan Hari Ini"}
                </span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-5 sm:py-6 px-3 text-center space-y-3 sm:space-y-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1D64F2] dark:text-blue-400 flex items-center justify-center mx-auto">
              <CalendarPlus className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Belum mengisi laporan hari ini
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Silakan catat kehadiran dan laporan aktivitas harian Anda untuk
                hari ini.
              </p>
            </div>
            <div className="pt-1">
              <Link
                href="/dashboard/peserta/isi-logbook?isi=1"
                className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold bg-[#1D64F2] hover:bg-blue-700 text-white shadow-xs transition"
              >
                <span>Isi Kehadiran & Laporan Hari Ini</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ================= 4. INFORMASI AKTIVITAS ================= */}
      <div className="space-y-2.5 sm:space-y-3 pt-1">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
          Informasi Aktivitas
        </h2>

        <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 divide-y divide-slate-100 dark:divide-slate-700/60 shadow-2xs overflow-hidden">
          {activityCounts.revisi > 0 ? (
            <Link
              href="/dashboard/peserta/isi-logbook"
              className="p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition"
            >
              <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-base font-bold text-slate-900 dark:text-white">
                    Perlu tindakan revisi Anda
                  </p>
                  <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {activityCounts.revisi} kehadiran dan laporan memerlukan
                    perbaikan sesuai catatan Mentor.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0" />
            </Link>
          ) : activityCounts.menunggu > 0 ? (
            <Link
              href="/dashboard/peserta/isi-logbook"
              className="p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition"
            >
              <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1D64F2] dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-base font-bold text-slate-900 dark:text-white">
                    Menunggu peninjauan Mentor
                  </p>
                  <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {activityCounts.menunggu} kehadiran dan laporan telah
                    dikirim. Tidak ada tindakan yang perlu Anda lakukan.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0" />
            </Link>
          ) : (
            <Link
              href="/dashboard/peserta/isi-logbook"
              className="p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition"
            >
              <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-base font-bold text-slate-900 dark:text-white">
                    Status laporan harian
                  </p>
                  <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {activityCounts.total > 0
                      ? `${activityCounts.disetujui} dari ${activityCounts.total} laporan harian telah disetujui Mentor.`
                      : "Belum ada laporan harian yang dikirim. Ketuk untuk mulai mengisi."}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0" />
            </Link>
          )}
        </div>
      </div>

      {/* ================= MODAL PENGUMUMAN ================= */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#D97706] text-white flex items-center justify-center text-xs font-bold">
                  !
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Pengumuman ({announcements.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAnnouncementModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              {announcements.map((item) => (
                <div
                  key={item._id}
                  className="rounded-xl border border-amber-200/80 dark:border-slate-700 bg-amber-50/40 dark:bg-slate-800/70 p-4 space-y-2.5"
                >
                  {item.createdAt && (
                    <span className="inline-block text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full">
                      {new Date(item.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  )}
                  {item.image && (
                    <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-black/90">
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/announcements/${item.image}`}
                        alt={item.title}
                        className="w-full max-h-52 object-contain"
                      />
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </h4>
                    {item.subtitle && (
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mt-0.5">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line break-words [overflow-wrap:anywhere]">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
