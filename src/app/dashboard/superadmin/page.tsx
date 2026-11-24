"use client";

import { useCallback, useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import {
  AlertTriangle,
  Clock,
  DatabaseZap,
  Download,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { SuperAdminDashboardSkeleton } from "@/components/dashboard/skeletons";
import SuperadminActionQueues from "@/components/superadmin/dashboard/SuperadminActionQueues";
import SuperadminActivityCharts from "@/components/superadmin/dashboard/SuperadminActivityCharts";
import SuperadminAnalyticsGrid from "@/components/superadmin/dashboard/SuperadminAnalyticsGrid";
import SuperadminKpiGrid from "@/components/superadmin/dashboard/SuperadminKpiGrid";
import type {
  DashboardFilterState,
  SuperadminDashboardSummary,
} from "@/components/superadmin/dashboard/types";
import { showToast } from "@/components/ui/toastDashboard";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

function createInitialFilters(): DashboardFilterState {
  const now = new Date();
  return {
    range: "all",
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    posisi: "",
    mentorId: "",
    kategoriMagang: "",
    asalJenis: "",
    statusMagang: "",
  };
}

export default function SuperadminOversistemDashboard() {
  const [filters] = useState<DashboardFilterState>(() =>
    createInitialFilters(),
  );
  const [summary, setSummary] = useState<SuperadminDashboardSummary | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [apiStatus, setApiStatus] = useState<
    "connected" | "disconnected" | "checking"
  >("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchSummary = useCallback(
    async (isManual = false) => {
      try {
        if (isManual) setRefreshing(true);
        else if (!summary) setLoading(true);
        else setRefreshing(true);

        const token = localStorage.getItem("token");
        if (!token) {
          setApiStatus("disconnected");
          setLoading(false);
          setRefreshing(false);
          return;
        }

        const params = new URLSearchParams();
        params.set("range", filters.range);
        params.set("year", String(filters.year));
        params.set("month", String(filters.month));
        if (filters.posisi) params.set("posisi", filters.posisi);
        if (filters.mentorId) params.set("mentorId", filters.mentorId);
        if (filters.kategoriMagang) {
          params.set("kategoriMagang", filters.kategoriMagang);
        }
        if (filters.asalJenis) params.set("asalJenis", filters.asalJenis);
        if (filters.statusMagang) {
          params.set("statusMagang", filters.statusMagang);
        }

        const res = await fetch(
          `${API_BASE_URL}/oversistem/superadmin-summary?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          },
        );

        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success) {
          throw new Error(
            json?.message || "Gagal memuat statistik dashboard superadmin",
          );
        }

        setSummary(json as SuperadminDashboardSummary);
        setApiStatus("connected");
        setErrorMessage(null);
        setLastUpdated(format(new Date(), "HH:mm:ss"));
      } catch (err) {
        setApiStatus("disconnected");
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Gagal memuat statistik dashboard superadmin",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters],
  );

  useEffect(() => {
    void fetchSummary();
    const interval = setInterval(() => {
      void fetchSummary(true);
    }, 300000);
    return () => clearInterval(interval);
  }, [fetchSummary]);

  const exportToExcel = async () => {
    if (!summary) {
      showToast.error("Data dashboard belum tersedia untuk diekspor");
      return;
    }

    setExporting(true);
    const toastId = showToast.loading("Menyiapkan laporan Excel lengkap...");

    try {
      const workbook = XLSX.utils.book_new();
      const c = summary.cards;

      const kpiRows = [
        {
          Kategori: "Peserta",
          Indikator: "Peserta Sedang Magang",
          Jumlah: c.pesertaSedangMagang,
        },
        {
          Kategori: "Peserta",
          Indikator: "Peserta Belum Mulai",
          Jumlah: c.pesertaBelumMulai,
        },
        {
          Kategori: "Peserta",
          Indikator: "Peserta Selesai",
          Jumlah: c.pesertaSelesai,
        },
        {
          Kategori: "Peserta",
          Indikator: "Peserta Tanpa Mentor",
          Jumlah: c.pesertaTanpaMentor,
        },
        {
          Kategori: "Pendaftaran",
          Indikator: "Pendaftaran Menunggu",
          Jumlah: c.pendaftaranMenunggu,
        },
        {
          Kategori: "Pendaftaran",
          Indikator: "Pendaftaran Sedang Diproses",
          Jumlah: c.pendaftaranSedangDiproses,
        },
        {
          Kategori: "Pendaftaran",
          Indikator: "Pendaftaran Disetujui",
          Jumlah: c.pendaftaranDisetujui,
        },
        {
          Kategori: "Pendaftaran",
          Indikator: "Pendaftaran Ditolak",
          Jumlah: c.pendaftaranDitolak,
        },
        {
          Kategori: "Logbook",
          Indikator: "Logbook Belum Diverifikasi (Menunggu)",
          Jumlah: c.logbookMenunggu,
        },
        {
          Kategori: "Logbook",
          Indikator: "Logbook Disetujui",
          Jumlah: c.logbookDisetujui,
        },
        {
          Kategori: "Logbook",
          Indikator: "Logbook Revisi",
          Jumlah: c.logbookRevisi,
        },
        {
          Kategori: "Logbook",
          Indikator: "Logbook Ditolak",
          Jumlah: c.logbookDitolak,
        },
        {
          Kategori: "Laporan Akhir",
          Indikator: "Laporan Menunggu Review",
          Jumlah: c.laporanMenunggu,
        },
        {
          Kategori: "Laporan Akhir",
          Indikator: "Laporan Revisi",
          Jumlah: c.laporanRevisi,
        },
        {
          Kategori: "Laporan Akhir",
          Indikator: "Laporan Disetujui",
          Jumlah: c.laporanDisetujui,
        },
        {
          Kategori: "Laporan Akhir",
          Indikator: "Laporan Ditolak",
          Jumlah: c.laporanDitolak,
        },
        {
          Kategori: "Evaluasi & Penilaian",
          Indikator: "Evaluasi Menunggu Review",
          Jumlah: c.evaluasiMenunggu,
        },
        {
          Kategori: "Evaluasi & Penilaian",
          Indikator: "Peserta Selesai Belum Dinilai",
          Jumlah: c.belumDinilaiSelesai,
        },
        {
          Kategori: "Evaluasi & Penilaian",
          Indikator: "Feedback Belum Direspon Mentor",
          Jumlah: c.feedbackBelumDirespon,
        },
        {
          Kategori: "Dokumen Selesai",
          Indikator: "Belum Upload Surat Selesai",
          Jumlah: c.selesaiBelumSurat,
        },
        {
          Kategori: "Dokumen Selesai",
          Indikator: "Belum Upload Sertifikat",
          Jumlah: c.selesaiBelumSertifikat,
        },
      ];
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(kpiRows),
        "KPI & Antrean Verifikasi",
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          summary.pipelineStatus.map((p) => ({
            Modul: p.label,
            "Disetujui / Selesai": p.selesai,
            Menunggu: p.menunggu,
            Revisi: p.revisi,
            Ditolak: p.ditolak,
          })),
        ),
        "Status Lintas Modul",
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          summary.formasiOccupancy.map((f) => ({
            Formasi: f.title,
            "Kapasitas Kuota": f.kuota,
            "Kuota Terisi": f.terisi,
            "Sisa Kuota": f.sisaKuota,
            "Pendaftar Menunggu": f.menungguPendaftar,
          })),
        ),
        "Okupansi Formasi",
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          summary.mentorWorkload.map((m) => ({
            "Nama Mentor": m.name,
            "Posisi / Fungsi": m.posisiMentor,
            "Peserta Aktif": m.pesertaAktif,
            "Total Peserta Bimbingan": m.pesertaTotal,
            "Logbook Menunggu": m.logbookMenunggu,
            "Laporan Menunggu": m.laporanMenunggu,
            "Evaluasi Menunggu": m.evaluasiMenunggu,
          })),
        ),
        "Beban Mentor",
      );

      const timeSeriesRows = summary.trendChart.labels.map((lbl, idx) => ({
        Periode: lbl,
        "Pendaftaran Masuk": summary.trendChart.pendaftaranMasuk[idx] || 0,
        "Pendaftaran Disetujui":
          summary.trendChart.pendaftaranDisetujui[idx] || 0,
        "Logbook Masuk": summary.trendChart.logbookMasuk[idx] || 0,
        "Logbook Disetujui": summary.trendChart.logbookDisetujui[idx] || 0,
        "Logbook Menunggu": summary.trendChart.logbookMenunggu[idx] || 0,
        "Absensi Hadir": summary.trendChart.absensiHadir[idx] || 0,
        "Absensi Terlambat": summary.trendChart.absensiTelat[idx] || 0,
        "Absensi Izin": summary.trendChart.absensiIzin[idx] || 0,
      }));
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(timeSeriesRows),
        "Time Series Terfilter",
      );

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(
        blob,
        `oversistem-superadmin-${filters.year}-${format(new Date(), "yyyyMMdd-HHmm")}.xlsx`,
      );
      showToast.updateSuccess(toastId, "Laporan Excel berhasil diunduh");
    } catch (err) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal mengekspor Excel",
      );
    } finally {
      setExporting(false);
    }
  };

  if (loading && !summary) {
    return <SuperAdminDashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Oversistem Dashboard
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-[#0284c7] border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              Superadmin
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                apiStatus === "connected"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                  : apiStatus === "disconnected"
                    ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
                    : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
              }`}
            >
              {apiStatus === "connected" ? (
                <>
                  <DatabaseZap className="w-3.5 h-3.5" />
                  LIVE
                </>
              ) : apiStatus === "disconnected" ? (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  OFFLINE
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  CHECKING
                </>
              )}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pemantauan ekosistem magang, antrean verifikasi lintas modul, beban
            mentor, dan okupansi kuota
            {lastUpdated && (
              <span className="ml-2 text-slate-400">
                • Diperbarui {lastUpdated} WIB
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fetchSummary(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-60"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Memuat..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={exportToExcel}
            disabled={loading || exporting || !summary}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white shadow-xs transition disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? "Menyiapkan..." : "Download Excel"}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs font-medium text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {summary && (
        <div
          className={`space-y-6 transition-opacity ${
            refreshing ? "opacity-65" : "opacity-100"
          }`}
        >
          {/* ================= 2-LAYER KPI CARDS ================= */}
          <SuperadminKpiGrid cards={summary.cards} />

          {/* ================= GRAFIK TREN PESERTA MAGANG PER BULAN & STATUS ================= */}
          <SuperadminActivityCharts
            initialTrend={summary.participantTrend}
            initialStatusSummary={summary.participantStatusSummary}
            filterOptions={summary.filterOptions}
            defaultYear={filters.year}
          />

          {/* ================= ANALYTICS GRID (NON-PIE CHARTS) ================= */}
          <SuperadminAnalyticsGrid
            surveyIndicators={summary.surveyIndicators}
            nilaiBuckets={summary.nilaiBuckets}
            demographics={summary.demographics}
            perkiraanSelesai={summary.perkiraanSelesai}
          />

          {/* ================= ACTION QUEUES, MENTOR PESERTA & TIME SERIES TABLE ================= */}
          <SuperadminActionQueues
            actionQueues={summary.actionQueues}
            mentorWorkload={summary.mentorWorkload}
            trendChart={summary.trendChart}
          />
        </div>
      )}
    </div>
  );
}
