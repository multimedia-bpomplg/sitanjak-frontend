"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BookOpenCheck,
  Building2,
  Calendar,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  Mail,
  MessageSquareHeart,
  Phone,
  RefreshCw,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import AnnouncementBox from "@/components/AnnouncementBox";
import { AdminDashboardSkeleton } from "@/components/dashboard/skeletons";

/* ================= TYPES ================= */

type PendaftaranStatus =
  | "Menunggu"
  | "Sedang Diproses"
  | "Disetujui"
  | "Ditolak";

type PendaftaranTerbaru = {
  _id: string;
  kategori: "sendiri" | "bersama" | string;
  status: PendaftaranStatus;
  createdAt: string;
  jumlahPeserta: number;
  peserta: Array<{
    nama: string;
    email: string;
    wa: string;
    posisi: string;
    jurusan?: string;
    asal?: { jenis: string; nama: string } | null;
    tanggalMulaiMagang: string;
    tanggalSelesaiMagang: string;
    mentor?: { name: string } | null;
  }>;
};

type AdminDashboardSummary = {
  totalPendaftaran: number;
  pendaftaranMenunggu: number;
  pendaftaranSedangDiproses: number;
  pendaftaranDisetujui: number;
  pendaftaranDitolak: number;
  pendaftaranHariIni: number;
  totalPesertaDisetujui: number;
  pesertaSedangMagang: number;
  pesertaBelumMulai: number;
  pesertaSelesai: number;
  pesertaTanpaMentor: number;
  totalAkunPeserta: number;
  akunPesertaAktif: number;
  totalMentor: number;
  mentorAktif: number;
  totalLogbook: number;
  logbookMenunggu: number;
  totalLaporanAkhir: number;
  laporanAkhirMenunggu: number;
  totalFeedback: number;
  feedbackBelumDirespon: number;
};

type AdminDashboardResponse = {
  admin: {
    name: string;
    email: string;
  } | null;
  summary: AdminDashboardSummary;
  pendaftaranTerbaru: PendaftaranTerbaru[];
};

/* ================= HELPERS ================= */

function getNowWIB(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
  );
}

function getInitials(name = "A"): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "A"
  );
}

function formatTanggal(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function hitungHariLalu(dateString: string): string {
  const now = getNowWIB();
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays <= 0) return "Hari ini";
  if (diffDays === 1) return "Kemarin";
  return `${diffDays} hari lalu`;
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "Menunggu":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
    case "Sedang Diproses":
      return "bg-sky-50 text-[#0284c7] border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800";
    case "Disetujui":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
    case "Ditolak":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  }
}

const EMPTY_SUMMARY: AdminDashboardSummary = {
  totalPendaftaran: 0,
  pendaftaranMenunggu: 0,
  pendaftaranSedangDiproses: 0,
  pendaftaranDisetujui: 0,
  pendaftaranDitolak: 0,
  pendaftaranHariIni: 0,
  totalPesertaDisetujui: 0,
  pesertaSedangMagang: 0,
  pesertaBelumMulai: 0,
  pesertaSelesai: 0,
  pesertaTanpaMentor: 0,
  totalAkunPeserta: 0,
  akunPesertaAktif: 0,
  totalMentor: 0,
  mentorAktif: 0,
  totalLogbook: 0,
  logbookMenunggu: 0,
  totalLaporanAkhir: 0,
  laporanAkhirMenunggu: 0,
  totalFeedback: 0,
  feedbackBelumDirespon: 0,
};

/* ================= PAGE ================= */

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nameFromToken, setNameFromToken] = useState("Administrator");

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload?.name || payload?.nama) {
        setNameFromToken(payload.name || payload.nama);
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
        `${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard-summary`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) {
        throw new Error("Gagal memuat ringkasan dashboard admin");
      }

      const data: AdminDashboardResponse = await res.json();
      setDashboard(data);
    } catch (err: unknown) {
      console.error("Gagal memuat dashboard admin:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memuat dashboard.",
      );
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

  if (loading) {
    return <AdminDashboardSkeleton />;
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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#0284c7] hover:bg-sky-700 text-white transition"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
      </div>
    );
  }

  const summary = dashboard?.summary || EMPTY_SUMMARY;
  const pendaftaranTerbaru = dashboard?.pendaftaranTerbaru || [];
  const displayName = dashboard?.admin?.name || nameFromToken;
  const firstName = displayName.trim().split(" ")[0] || displayName;

  return (
    <div className="space-y-6">
      {/* ================= 1. HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Halo, {firstName} 👋
            </h1>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-[#0284c7] border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800">
              Administrator
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {formattedToday} • Ringkasan pendaftaran, peserta, dan operasional
            magang
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={fetchDashboard}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>

          <div
            title={displayName}
            className="w-10 h-10 rounded-full bg-linear-to-br from-[#0284c7] to-blue-700 text-white font-bold text-xs flex items-center justify-center shadow-sm ring-2 ring-white dark:ring-slate-800 shrink-0"
          >
            {getInitials(displayName)}
          </div>
        </div>
      </div>

      {/* ================= 2. PENGUMUMAN ================= */}
      <AnnouncementBox type="admin" />

      {/* ================= 3. 4 KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AdminStatCard
          href="/dashboard/admin/ViewPeserta"
          title="Peserta Magang Disetujui"
          value={summary.totalPesertaDisetujui}
          unit="peserta"
          subtitle={`${summary.pesertaSedangMagang} aktif • ${summary.pesertaBelumMulai} belum mulai • ${summary.pesertaSelesai} selesai`}
          icon={<Users className="w-5 h-5" />}
          accent="blue"
        />

        <AdminStatCard
          href="/dashboard/admin/ViewPendaftaran"
          title="Pendaftaran Menunggu"
          value={summary.pendaftaranMenunggu}
          unit="berkas"
          subtitle={`${summary.pendaftaranSedangDiproses} diproses • ${summary.totalPendaftaran} total pendaftar`}
          icon={<ClipboardList className="w-5 h-5" />}
          accent={summary.pendaftaranMenunggu > 0 ? "amber" : "emerald"}
          highlight={summary.pendaftaranMenunggu > 0}
        />

        <AdminStatCard
          href="/dashboard/admin/ManajemenAkun/buatmentor"
          title="Mentor Aktif"
          value={summary.mentorAktif}
          unit="mentor"
          subtitle={`Dari ${summary.totalMentor} mentor • ${summary.pesertaTanpaMentor} peserta tanpa mentor`}
          icon={<UserCheck className="w-5 h-5" />}
          accent="sky"
        />

        <AdminStatCard
          href="/dashboard/admin/ViewLogbook"
          title="Logbook & Laporan Menunggu"
          value={summary.logbookMenunggu + summary.laporanAkhirMenunggu}
          unit="antrian"
          subtitle={`${summary.logbookMenunggu} logbook • ${summary.laporanAkhirMenunggu} laporan akhir`}
          icon={<BookOpenCheck className="w-5 h-5" />}
          accent={
            summary.logbookMenunggu + summary.laporanAkhirMenunggu > 0
              ? "purple"
              : "emerald"
          }
          highlight={summary.logbookMenunggu + summary.laporanAkhirMenunggu > 0}
        />
      </div>

      {/* ================= 4. ALERT VERIFIKASI ================= */}
      {(summary.pendaftaranMenunggu > 0 || summary.pesertaTanpaMentor > 0) && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800/70 bg-amber-50/80 dark:bg-amber-950/30 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {summary.pendaftaranMenunggu > 0
                  ? `Ada ${summary.pendaftaranMenunggu} pendaftaran menunggu verifikasi`
                  : `Ada ${summary.pesertaTanpaMentor} peserta disetujui belum memiliki mentor`}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {summary.pendaftaranMenunggu > 0 && summary.pesertaTanpaMentor > 0
                  ? `Selain itu, ${summary.pesertaTanpaMentor} peserta disetujui belum ditugaskan mentor.`
                  : "Segera tinjau dan tindak lanjuti di halaman Pendaftaran."}
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/admin/ViewPendaftaran"
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition shrink-0"
          >
            Kelola Pendaftaran
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ================= 5. PERLU TINDAK LANJUT & RINGKASAN SISTEM (ATAS) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KIRI (2 cols): PERLU TINDAK LANJUT */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 p-5 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Perlu Tindak Lanjut
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pintasan cepat manajemen operasional admin
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <QuickActionLink
              href="/dashboard/admin/ViewPendaftaran"
              icon={<ClipboardList className="w-4 h-4" />}
              iconBg="bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
              title="Verifikasi Pendaftaran"
              desc={
                summary.pendaftaranMenunggu > 0
                  ? `${summary.pendaftaranMenunggu} menunggu • ${summary.pendaftaranSedangDiproses} diproses`
                  : "Semua pendaftaran baru sudah ditinjau"
              }
            />

            <QuickActionLink
              href="/dashboard/admin/ManajemenAkun/buatpeserta"
              icon={<UserPlus className="w-4 h-4" />}
              iconBg="bg-sky-50 text-[#0284c7] dark:bg-sky-950/60 dark:text-sky-400"
              title="Kelola Akun Peserta & Mentor"
              desc={`${summary.akunPesertaAktif} akun peserta aktif • ${summary.mentorAktif} mentor aktif`}
            />

            <QuickActionLink
              href="/dashboard/admin/ViewLaporanAkhir"
              icon={<GraduationCap className="w-4 h-4" />}
              iconBg="bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400"
              title="Monitoring Laporan Akhir"
              desc={`${summary.laporanAkhirMenunggu} menunggu • ${summary.totalLaporanAkhir} total terkumpul`}
            />

            <QuickActionLink
              href="/dashboard/admin/ViewFeedback"
              icon={<MessageSquareHeart className="w-4 h-4" />}
              iconBg="bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
              title="Feedback & Ulasan"
              desc={`${summary.feedbackBelumDirespon} belum direspon dari ${summary.totalFeedback} feedback`}
            />
          </div>
        </div>

        {/* KANAN (1 col): RINGKASAN SISTEM */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 p-5 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Ringkasan Sistem
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Statistik ringkas aktivitas hari ini & sistem
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <MiniMetric
              label="Daftar Hari Ini"
              value={summary.pendaftaranHariIni}
            />
            <MiniMetric
              label="Pendaftar Disetujui"
              value={summary.pendaftaranDisetujui}
            />
            <MiniMetric
              label="Total Logbook"
              value={summary.totalLogbook}
            />
            <MiniMetric
              label="Tanpa Mentor"
              value={summary.pesertaTanpaMentor}
              highlight={summary.pesertaTanpaMentor > 0}
            />
          </div>
        </div>
      </div>

      {/* ================= 6. TABEL PENDAFTARAN TERBARU (BAWAH) ================= */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Pendaftaran Terbaru
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              6 pengajuan magang paling baru masuk ke sistem
            </p>
          </div>

          <Link
            href="/dashboard/admin/ViewPendaftaran"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-50 text-[#0284c7] border border-sky-200 hover:bg-[#0284c7] hover:text-white dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 transition"
          >
            Lihat Semua
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pendaftaranTerbaru.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Belum ada pendaftaran masuk
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-225 w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="w-[5%] py-3.5 px-4 text-center">No</th>
                  <th className="w-[24%] py-3.5 px-4 text-left">Pendaftar</th>
                  <th className="w-[16%] py-3.5 px-4 text-left">
                    Kategori & Posisi
                  </th>
                  <th className="w-[22%] py-3.5 px-4 text-left">Kontak</th>
                  <th className="w-[14%] py-3.5 px-4 text-left">
                    Tanggal Daftar
                  </th>
                  <th className="w-[11%] py-3.5 px-4 text-center">Status</th>
                  <th className="w-[8%] py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {pendaftaranTerbaru.map((item, idx) => {
                  const lead = item.peserta[0];
                  const asalNama = lead?.asal?.nama;
                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-sky-50/50 dark:hover:bg-sky-950/20 transition"
                    >
                      <td className="py-3.5 px-4 text-center font-medium text-slate-500 dark:text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="py-3.5 px-4 text-left">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#0284c7] to-blue-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {getInitials(lead?.nama || "P")}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {lead?.nama || "Nama tidak tersedia"}
                            </p>
                            {asalNama && (
                              <p className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 truncate max-w-48">
                                <Building2 className="w-3 h-3 shrink-0" />
                                <span className="truncate">{asalNama}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-left">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                          {item.kategori === "bersama"
                            ? `Kelompok (${item.jumlahPeserta} peserta)`
                            : "Mandiri (1 peserta)"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-40">
                          {lead?.posisi || "-"}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-left">
                        <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-300">
                          <p className="inline-flex items-center gap-1.5 max-w-48">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">
                              {lead?.email || "-"}
                            </span>
                          </p>
                          {lead?.wa && (
                            <p className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{lead.wa}</span>
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-left whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                        <p className="inline-flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatTanggal(item.createdAt)}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {hitungHariLalu(item.createdAt)}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusBadgeClass(
                            item.status,
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <Link
                          href={`/dashboard/admin/ViewPendaftaran#${item._id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white transition"
                        >
                          Detail
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= SUB-COMPONENTS ================= */

function AdminStatCard({
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
  accent: "blue" | "sky" | "amber" | "purple" | "emerald";
  highlight?: boolean;
}) {
  const styles: Record<
    typeof accent,
    {
      cardBg: string;
      border: string;
      iconBg: string;
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
      border: "border-sky-500/30",
      iconBg: "bg-white/20 text-white",
      titleText: "text-sky-100",
      valueText: "text-white",
      unitText: "text-sky-100",
      divider: "border-white/20",
      subtitleText: "text-sky-100/90",
      chevron: "text-sky-100",
    },
    sky: {
      cardBg: "bg-white dark:bg-slate-900/90",
      border: "border-slate-200/80 dark:border-slate-800",
      iconBg: "bg-sky-50 text-[#0284c7] dark:bg-sky-950/60 dark:text-sky-400",
      titleText: "text-slate-500 dark:text-slate-400",
      valueText: "text-slate-900 dark:text-white",
      unitText: "text-slate-500 dark:text-slate-400",
      divider: "border-slate-100 dark:border-slate-800",
      subtitleText: "text-slate-500 dark:text-slate-400",
      chevron: "text-slate-400",
    },
    amber: {
      cardBg: "bg-white dark:bg-slate-900/90",
      border: highlight
        ? "border-amber-300/80 dark:border-amber-700/70"
        : "border-slate-200/80 dark:border-slate-800",
      iconBg:
        "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
      titleText: "text-slate-500 dark:text-slate-400",
      valueText: "text-amber-700 dark:text-amber-300",
      unitText: "text-slate-500 dark:text-slate-400",
      divider: "border-slate-100 dark:border-slate-800",
      subtitleText: "text-slate-500 dark:text-slate-400",
      chevron: "text-slate-400",
    },
    purple: {
      cardBg: "bg-white dark:bg-slate-900/90",
      border: highlight
        ? "border-purple-300/80 dark:border-purple-700/70"
        : "border-slate-200/80 dark:border-slate-800",
      iconBg:
        "bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400",
      titleText: "text-slate-500 dark:text-slate-400",
      valueText: "text-purple-700 dark:text-purple-300",
      unitText: "text-slate-500 dark:text-slate-400",
      divider: "border-slate-100 dark:border-slate-800",
      subtitleText: "text-slate-500 dark:text-slate-400",
      chevron: "text-slate-400",
    },
    emerald: {
      cardBg: "bg-white dark:bg-slate-900/90",
      border: "border-slate-200/80 dark:border-slate-800",
      iconBg:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
      titleText: "text-slate-500 dark:text-slate-400",
      valueText: "text-slate-900 dark:text-white",
      unitText: "text-slate-500 dark:text-slate-400",
      divider: "border-slate-100 dark:border-slate-800",
      subtitleText: "text-slate-500 dark:text-slate-400",
      chevron: "text-slate-400",
    },
  };

  const s = styles[accent];

  return (
    <Link
      href={href}
      className={`group rounded-2xl border ${s.border} ${s.cardBg} p-4 sm:p-5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between gap-3`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold ${s.titleText}`}>{title}</p>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className={`text-3xl font-extrabold ${s.valueText}`}>
              {value}
            </span>
            <span className={`text-xs font-medium ${s.unitText}`}>{unit}</span>
          </div>
        </div>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.iconBg}`}
        >
          {icon}
        </div>
      </div>

      <div
        className={`flex items-center justify-between gap-2 pt-2.5 border-t ${s.divider}`}
      >
        <span className={`text-[11px] sm:text-xs truncate ${s.subtitleText}`}>
          {subtitle}
        </span>
        <ChevronRight
          className={`w-3.5 h-3.5 ${s.chevron} group-hover:translate-x-0.5 transition shrink-0`}
        />
      </div>
    </Link>
  );
}

function QuickActionLink({
  href,
  icon,
  iconBg,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-2xs transition"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
            {title}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {desc}
          </p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition shrink-0" />
    </Link>
  );
}

function MiniMetric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 text-center">
      <p
        className={`text-xl font-extrabold ${
          highlight
            ? "text-amber-600 dark:text-amber-400"
            : "text-slate-900 dark:text-white"
        }`}
      >
        {value}
      </p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
        {label}
      </p>
    </div>
  );
}
