"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Chart as ChartJS,
  ChartData,
  ChartOptions,
  registerables,
} from "chart.js";
import { Bar, Doughnut, Line, Pie } from "react-chartjs-2";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  DatabaseZap,
  Download,
  FileSpreadsheet,
  PieChart,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { SuperAdminDashboardSkeleton } from "@/components/dashboard/skeletons";
import { showToast } from "@/components/ui/toastDashboard";

ChartJS.register(...registerables);

/* ================= TYPES ================= */

type DataRow = {
  date: string;
  logbook: number;
  pendaftaran: number;
  peserta_aktif: number;
  mentor_aktif: number;
  admin_aktif: number;
};

type StatistikPosisi = { posisi: string; count: number };
type StatistikAsal = { jenis: string; count: number };
type StatistikGender = { gender: string; count: number };
type StatistikSelesai = { periode: string; count: number };

type OverviewStats = {
  pesertaAktif: number;
  mentorAktif: number;
  adminAktif: number;
  pendaftaranAktif: number;
  pendaftaranHariIni: number;
  logbookHariIni: number;
  totalPendaftar: number;
  totalLogbook: number;
  lastUpdated: string;
};

type DetailStatusGroup = {
  _id?: string;
  count: number;
};

type LogbookDetailStats = {
  monthly?: Array<{ total: number; approved?: number }>;
  byStatus?: DetailStatusGroup[];
  topPeserta?: Array<{ name?: string; count: number }>;
};

type PendaftaranDetailStats = {
  monthly?: Array<{ total: number; approved?: number }>;
  byStatus?: DetailStatusGroup[];
  topPosisi?: Array<{ _id?: string; count: number }>;
};

type ActiveTab = "pendaftaran" | "logbook" | "peserta" | "mentor" | "admin";
type ChartKind = "bar" | "line" | "pie" | "doughnut";

/* ================= CONSTANTS ================= */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

const PALETTE = [
  "rgba(2, 132, 199, 0.85)",
  "rgba(16, 185, 129, 0.85)",
  "rgba(245, 158, 11, 0.85)",
  "rgba(99, 102, 241, 0.85)",
  "rgba(244, 63, 94, 0.85)",
  "rgba(236, 72, 153, 0.85)",
  "rgba(14, 165, 233, 0.85)",
  "rgba(20, 184, 166, 0.85)",
  "rgba(168, 85, 247, 0.85)",
  "rgba(100, 116, 139, 0.85)",
  "rgba(234, 179, 8, 0.85)",
  "rgba(37, 99, 235, 0.85)",
];

const EMPTY_STATS: OverviewStats = {
  pesertaAktif: 0,
  mentorAktif: 0,
  adminAktif: 0,
  pendaftaranAktif: 0,
  pendaftaranHariIni: 0,
  logbookHariIni: 0,
  totalPendaftar: 0,
  totalLogbook: 0,
  lastUpdated: "",
};

/* ================= COMPONENT ================= */

export default function SuperadminOversistemDashboard() {
  const isMountedRef = useRef(true);

  const [rawData, setRawData] = useState<DataRow[]>([]);
  const [detailedData, setDetailedData] = useState<DataRow[]>([]);
  const [statistikPosisi, setStatistikPosisi] = useState<StatistikPosisi[]>([]);
  const [statistikAsal, setStatistikAsal] = useState<StatistikAsal[]>([]);
  const [statistikGender, setStatistikGender] = useState<StatistikGender[]>([]);
  const [statistikSelesai, setStatistikSelesai] = useState<StatistikSelesai[]>(
    [],
  );

  const [stats, setStats] = useState<OverviewStats>(EMPTY_STATS);
  const [logbookStats, setLogbookStats] = useState<LogbookDetailStats | null>(
    null,
  );
  const [pendaftaranStats, setPendaftaranStats] =
    useState<PendaftaranDetailStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dataStatus, setDataStatus] = useState<"available" | "empty" | "error">(
    "available",
  );
  const [apiStatus, setApiStatus] = useState<
    "connected" | "disconnected" | "checking"
  >("checking");

  const [activeTab, setActiveTab] = useState<ActiveTab>("pendaftaran");
  const [chartType, setChartType] = useState<ChartKind>("bar");
  const [dataMode, setDataMode] = useState<"monthly" | "daily">("monthly");
  const [selectedYear, setSelectedYear] = useState<number>(() =>
    new Date().getFullYear(),
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    () => new Date().getMonth() + 1,
  );
  const [availableYears, setAvailableYears] = useState<number[]>(() => [
    new Date().getFullYear(),
  ]);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  /* ================= FETCH ================= */

  const fetchAllData = useCallback(
    async (isManual = false) => {
      try {
        if (isManual) setRefreshing(true);
        else setLoading(true);

        const token = localStorage.getItem("token");
        if (!token) {
          if (isMountedRef.current) {
            setApiStatus("disconnected");
            setLoading(false);
            setRefreshing(false);
          }
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };
        const needsDaily =
          (activeTab === "logbook" || activeTab === "pendaftaran") &&
          dataMode === "daily";

        const [
          statsRes,
          tsRes,
          detailedRes,
          lbStatsRes,
          pendStatsRes,
          selesaiRes,
          yearsRes,
        ] = await Promise.all([
          fetch(`${API_BASE_URL}/oversistem/stats`, {
            headers,
            cache: "no-store",
          }),
          fetch(`${API_BASE_URL}/oversistem/timeseries?year=${selectedYear}`, {
            headers,
            cache: "no-store",
          }),
          needsDaily
            ? fetch(
                `${API_BASE_URL}/oversistem/timeseries/detailed?year=${selectedYear}&month=${selectedMonth}`,
                { headers, cache: "no-store" },
              )
            : Promise.resolve(null),
          fetch(
            `${API_BASE_URL}/oversistem/statistik/logbook?year=${selectedYear}`,
            { headers, cache: "no-store" },
          ),
          fetch(
            `${API_BASE_URL}/oversistem/statistik/pendaftaran?year=${selectedYear}`,
            { headers, cache: "no-store" },
          ),
          fetch(`${API_BASE_URL}/oversistem/statistik/selesai`, {
            headers,
            cache: "no-store",
          }),
          fetch(`${API_BASE_URL}/oversistem/years`, {
            headers,
            cache: "no-store",
          }),
        ]);

        if (!isMountedRef.current) return;

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats({
            pesertaAktif: statsData.pesertaAktif || 0,
            mentorAktif: statsData.mentorAktif || 0,
            adminAktif: statsData.adminAktif || 0,
            pendaftaranAktif: statsData.pendaftaranAktif || 0,
            pendaftaranHariIni: statsData.pendaftaranHariIni || 0,
            logbookHariIni: statsData.logbookHariIni || 0,
            totalPendaftar: statsData.totalPendaftar || 0,
            totalLogbook: statsData.totalLogbook || 0,
            lastUpdated: new Date().toISOString(),
          });
          setStatistikPosisi(statsData.statistikPosisi || []);
          setStatistikAsal(statsData.statistikAsal || []);
          setStatistikGender(statsData.statistikGender || []);
          setApiStatus("connected");
        } else {
          setApiStatus("disconnected");
        }

        if (tsRes.ok) {
          const tsData: DataRow[] = await tsRes.json();
          const activeRows = (Array.isArray(tsData) ? tsData : []).filter(
            (row) =>
              row.logbook > 0 ||
              row.pendaftaran > 0 ||
              row.peserta_aktif > 0 ||
              row.mentor_aktif > 0 ||
              row.admin_aktif > 0,
          );
          setRawData(activeRows);
          setDataStatus(activeRows.length === 0 ? "empty" : "available");
        } else {
          setRawData([]);
          setDataStatus("empty");
        }

        if (detailedRes && detailedRes.ok) {
          const dJson = await detailedRes.json();
          setDetailedData(Array.isArray(dJson) ? dJson : []);
        } else if (!needsDaily) {
          setDetailedData([]);
        }

        setLogbookStats(lbStatsRes.ok ? await lbStatsRes.json() : null);
        setPendaftaranStats(
          pendStatsRes.ok ? await pendStatsRes.json() : null,
        );
        setStatistikSelesai(selesaiRes.ok ? await selesaiRes.json() : []);

        if (yearsRes.ok) {
          const yrs = await yearsRes.json();
          if (Array.isArray(yrs) && yrs.length > 0) setAvailableYears(yrs);
        }

        setLastUpdated(format(new Date(), "HH:mm:ss"));
      } catch {
        if (!isMountedRef.current) return;
        setApiStatus("disconnected");
        setDataStatus("error");
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [selectedYear, selectedMonth, activeTab, dataMode],
  );

  useEffect(() => {
    isMountedRef.current = true;
    fetchAllData();

    const interval = setInterval(() => {
      if (isMountedRef.current) {
        fetchAllData(true);
      }
    }, 3600000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchAllData]);

  /* ================= CHART SOURCE & CONFIG ================= */

  const useDailySource =
    (activeTab === "logbook" || activeTab === "pendaftaran") &&
    dataMode === "daily";

  const activeSourceData = useDailySource ? detailedData : rawData;

  const activeTabMeta = useMemo(() => {
    const meta: Record<ActiveTab, { label: string; color: string }> = {
      pendaftaran: { label: "Pendaftaran", color: "rgba(2, 132, 199, 0.85)" },
      logbook: { label: "Logbook", color: "rgba(16, 185, 129, 0.85)" },
      peserta: { label: "Peserta Aktif", color: "rgba(245, 158, 11, 0.85)" },
      mentor: { label: "Mentor Aktif", color: "rgba(99, 102, 241, 0.85)" },
      admin: { label: "Admin Aktif", color: "rgba(244, 63, 94, 0.85)" },
    };
    return meta[activeTab];
  }, [activeTab]);

  const seriesValues = useMemo(() => {
    return activeSourceData.map((row) => {
      switch (activeTab) {
        case "pendaftaran":
          return row.pendaftaran || 0;
        case "logbook":
          return row.logbook || 0;
        case "peserta":
          return row.peserta_aktif || 0;
        case "mentor":
          return row.mentor_aktif || 0;
        case "admin":
          return row.admin_aktif || 0;
      }
    });
  }, [activeSourceData, activeTab]);

  const seriesLabels = useMemo(() => {
    return activeSourceData.map((row) => {
      const parsed = parseISO(row.date);
      if (Number.isNaN(parsed.getTime())) return row.date;
      return format(parsed, useDailySource ? "d MMM" : "MMM yyyy", {
        locale: localeId,
      });
    });
  }, [activeSourceData, useDailySource]);

  const barOrLineChartData: ChartData<"bar"> = useMemo(() => {
    if (activeSourceData.length === 0) {
      return {
        labels: ["Tidak ada data"],
        datasets: [
          {
            label: "Tidak ada data",
            data: [0],
            backgroundColor: "rgba(148, 163, 184, 0.3)",
            borderColor: "rgba(148, 163, 184, 0.5)",
            borderWidth: 1,
          },
        ],
      };
    }

    return {
      labels: seriesLabels,
      datasets: [
        {
          label: activeTabMeta.label,
          data: seriesValues,
          backgroundColor: activeTabMeta.color,
          borderColor: activeTabMeta.color.replace("0.85", "1"),
          borderWidth: 2,
          borderRadius: 6,
        },
      ],
    };
  }, [activeSourceData.length, seriesLabels, seriesValues, activeTabMeta]);

  const pieOrDoughnutSeriesData: ChartData<"pie"> = useMemo(() => {
    if (activeSourceData.length === 0) {
      return {
        labels: ["Tidak ada data"],
        datasets: [
          {
            data: [1],
            backgroundColor: ["rgba(148, 163, 184, 0.4)"],
            borderWidth: 1,
          },
        ],
      };
    }

    return {
      labels: seriesLabels,
      datasets: [
        {
          label: activeTabMeta.label,
          data: seriesValues,
          backgroundColor: seriesLabels.map(
            (_, idx) => PALETTE[idx % PALETTE.length],
          ),
          borderWidth: 2,
        },
      ],
    };
  }, [activeSourceData.length, seriesLabels, seriesValues, activeTabMeta]);

  const barChartOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: `Statistik ${activeTabMeta.label} (${selectedYear})`,
        font: { size: 14, weight: "bold" },
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
  };

  const lineChartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: `Tren ${activeTabMeta.label} (${selectedYear})`,
        font: { size: 14, weight: "bold" },
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
    elements: {
      line: { tension: 0.35 },
      point: { radius: 4, hoverRadius: 6 },
    },
  };

  const pieOptions: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "right" },
    },
  };

  /* ================= DETAIL STATS HELPERS ================= */

  const totalLogbookYear = useMemo(() => {
    if (!logbookStats?.monthly) return stats.totalLogbook;
    return logbookStats.monthly.reduce((acc, item) => acc + item.total, 0);
  }, [logbookStats, stats.totalLogbook]);

  const approvedLogbookYear = useMemo(() => {
    if (!logbookStats?.monthly) return 0;
    return logbookStats.monthly.reduce(
      (acc, item) => acc + (item.approved || 0),
      0,
    );
  }, [logbookStats]);

  const totalPendaftaranYear = useMemo(() => {
    if (!pendaftaranStats?.monthly) return stats.totalPendaftar;
    return pendaftaranStats.monthly.reduce((acc, item) => acc + item.total, 0);
  }, [pendaftaranStats, stats.totalPendaftar]);

  const approvedPendaftaranYear = useMemo(() => {
    if (!pendaftaranStats?.monthly) return stats.pendaftaranAktif;
    return pendaftaranStats.monthly.reduce(
      (acc, item) => acc + (item.approved || 0),
      0,
    );
  }, [pendaftaranStats, stats.pendaftaranAktif]);

  /* ================= EXPORT EXCEL ================= */

  const exportToExcel = async () => {
    const toastId = showToast.loading("Menyiapkan laporan Excel oversistem...");
    try {
      setExporting(true);
      const token = localStorage.getItem("token");
      if (!token) {
        showToast.updateError(toastId, "Sesi login habis. Silakan login ulang.");
        return;
      }

      const startStr = `${selectedYear}-01-01`;
      const endStr = `${selectedYear}-12-31`;

      const exportRes = await fetch(
        `${API_BASE_URL}/oversistem/export?startDate=${startStr}&endDate=${endStr}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!exportRes.ok) throw new Error("Gagal mengambil data ekspor");

      const exportData = await exportRes.json();
      const workbook = XLSX.utils.book_new();

      const timeSeriesRows =
        exportData.timeSeries ||
        rawData.map((row) => ({
          Tanggal: format(parseISO(row.date), "dd/MM/yyyy"),
          Logbook: row.logbook,
          Pendaftaran: row.pendaftaran,
          "Peserta Aktif": row.peserta_aktif,
          "Mentor Aktif": row.mentor_aktif,
          "Admin Aktif": row.admin_aktif,
        }));

      if (timeSeriesRows.length > 0) {
        XLSX.utils.book_append_sheet(
          workbook,
          XLSX.utils.json_to_sheet(timeSeriesRows),
          "Data Time Series",
        );
      }

      if (statistikPosisi.length > 0) {
        XLSX.utils.book_append_sheet(
          workbook,
          XLSX.utils.json_to_sheet(statistikPosisi),
          "Statistik Posisi",
        );
      }
      if (statistikAsal.length > 0) {
        XLSX.utils.book_append_sheet(
          workbook,
          XLSX.utils.json_to_sheet(statistikAsal),
          "Statistik Asal",
        );
      }
      if (statistikGender.length > 0) {
        XLSX.utils.book_append_sheet(
          workbook,
          XLSX.utils.json_to_sheet(statistikGender),
          "Statistik Gender",
        );
      }
      if (statistikSelesai.length > 0) {
        XLSX.utils.book_append_sheet(
          workbook,
          XLSX.utils.json_to_sheet(statistikSelesai),
          "Statistik Selesai",
        );
      }

      const summarySheet = XLSX.utils.json_to_sheet([
        {
          "Peserta Aktif": stats.pesertaAktif,
          "Mentor Aktif": stats.mentorAktif,
          "Admin Aktif": stats.adminAktif,
          "Pendaftaran Disetujui": stats.pendaftaranAktif,
          "Pendaftaran Hari Ini": stats.pendaftaranHariIni,
          "Logbook Hari Ini": stats.logbookHariIni,
          "Total Pendaftar": stats.totalPendaftar,
          "Total Logbook": stats.totalLogbook,
          Tahun: selectedYear,
          "Waktu Ekspor": format(new Date(), "dd/MM/yyyy HH:mm:ss"),
        },
      ]);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary Stats");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(
        blob,
        `oversistem-report-${selectedYear}-${format(new Date(), "yyyyMMdd-HHmm")}.xlsx`,
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

  /* ================= RENDER ================= */

  if (loading && !stats.lastUpdated) {
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
            Pemantauan statistik sistem magang secara menyeluruh
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
            onClick={() => fetchAllData(true)}
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
            disabled={loading || exporting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white shadow-xs transition disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? "Menyiapkan..." : "Download Excel"}
          </button>
        </div>
      </div>

      {dataStatus === "empty" && !loading && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            Belum ada aktivitas time-series untuk tahun {selectedYear}. Coba
            pilih tahun lain pada filter di bawah.
          </span>
        </div>
      )}

      {/* ================= 6 KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="rounded-2xl p-4 bg-linear-to-br from-[#0284c7] to-blue-700 text-white shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-medium text-sky-100">
                Peserta Aktif
              </p>
              <p className="text-2xl font-extrabold mt-1">
                {stats.pesertaAktif}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[10px] text-sky-100 mt-2">Akun peserta aktif</p>
        </div>

        <MetricCard
          title="Mentor Aktif"
          value={stats.mentorAktif}
          subtitle="Pembimbing aktif"
          icon={<UserCheck className="w-4 h-4" />}
          accent="emerald"
        />

        <MetricCard
          title="Admin Aktif"
          value={stats.adminAktif}
          subtitle="Pengelola sistem"
          icon={<UserCog className="w-4 h-4" />}
          accent="sky"
        />

        <MetricCard
          title="Pendaftaran Hari Ini"
          value={stats.pendaftaranHariIni}
          subtitle="Disetujui hari ini"
          icon={<UserPlus className="w-4 h-4" />}
          accent="amber"
        />

        <MetricCard
          title="Logbook Hari Ini"
          value={stats.logbookHariIni}
          subtitle="Entri tercatat hari ini"
          icon={<BookOpen className="w-4 h-4" />}
          accent="indigo"
        />

        <MetricCard
          title="Total Pendaftar"
          value={stats.totalPendaftar}
          subtitle={`${stats.pendaftaranAktif} telah disetujui`}
          icon={<FileSpreadsheet className="w-4 h-4" />}
          accent="rose"
        />
      </div>

      {/* ================= CONTROLS & MAIN CHART ================= */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                {
                  key: "pendaftaran",
                  label: "Pendaftaran",
                  icon: <UserPlus className="w-3.5 h-3.5" />,
                  count: stats.pendaftaranAktif,
                },
                {
                  key: "logbook",
                  label: "Logbook",
                  icon: <BookOpen className="w-3.5 h-3.5" />,
                  count: stats.totalLogbook,
                },
                {
                  key: "peserta",
                  label: "Peserta",
                  icon: <Users className="w-3.5 h-3.5" />,
                  count: stats.pesertaAktif,
                },
                {
                  key: "mentor",
                  label: "Mentor",
                  icon: <UserCheck className="w-3.5 h-3.5" />,
                  count: stats.mentorAktif,
                },
                {
                  key: "admin",
                  label: "Admin",
                  icon: <UserCog className="w-3.5 h-3.5" />,
                  count: stats.adminAktif,
                },
              ] as Array<{
                key: ActiveTab;
                label: string;
                icon: React.ReactNode;
                count: number;
              }>
            ).map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    active
                      ? "bg-[#0284c7] text-white shadow-xs"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {(activeTab === "logbook" || activeTab === "pendaftaran") && (
              <select
                value={dataMode}
                onChange={(e) =>
                  setDataMode(e.target.value as "monthly" | "daily")
                }
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              >
                <option value="monthly">Mode Bulanan</option>
                <option value="daily">Mode Harian</option>
              </select>
            )}

            {useDailySource && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    {format(new Date(selectedYear, month - 1, 1), "MMMM", {
                      locale: localeId,
                    })}
                  </option>
                ))}
              </select>
            )}

            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as ChartKind)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="pie">Pie Chart</option>
              <option value="doughnut">Doughnut Chart</option>
            </select>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <Calendar className="w-3.5 h-3.5 text-[#0284c7]" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="text-xs font-semibold bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Main Chart Canvas */}
        <div className="p-5 sm:p-6">
          <div className="h-80">
            {activeSourceData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Database className="w-12 h-12 mb-2 opacity-40" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Tidak ada data {activeTabMeta.label} pada periode ini
                </p>
              </div>
            ) : chartType === "bar" ? (
              <Bar data={barOrLineChartData} options={barChartOptions} />
            ) : chartType === "line" ? (
              <Line
                data={barOrLineChartData as ChartData<"line">}
                options={lineChartOptions}
              />
            ) : chartType === "pie" ? (
              <Pie data={pieOrDoughnutSeriesData} options={pieOptions} />
            ) : (
              <Doughnut
                data={pieOrDoughnutSeriesData as ChartData<"doughnut">}
                options={pieOptions as ChartOptions<"doughnut">}
              />
            )}
          </div>

          <p className="text-xs text-slate-400 text-center mt-4">
            {useDailySource
              ? `Menampilkan data harian ${format(
                  new Date(selectedYear, selectedMonth - 1, 1),
                  "MMMM yyyy",
                  { locale: localeId },
                )} • ${detailedData.length} hari tercatat`
              : `Menampilkan data bulanan tahun ${selectedYear} • ${rawData.length} bulan tercatat`}
          </p>
        </div>
      </div>

      {/* ================= DETAIL STATS (LOGBOOK / PENDAFTARAN) ================= */}
      {activeTab === "logbook" && logbookStats && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Ringkasan Detail Logbook ({selectedYear})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Total Logbook Tahun {selectedYear}
                  </p>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {totalLogbookYear}
                  </p>
                </div>
                <TrendingUp className="w-6 h-6 text-[#0284c7]" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                <span className="font-semibold text-emerald-600">
                  {approvedLogbookYear}
                </span>{" "}
                disetujui
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Distribusi Status
              </p>
              <div className="space-y-1.5 text-xs">
                {(logbookStats.byStatus || []).map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="capitalize text-slate-600 dark:text-slate-300">
                      {item._id || "Lainnya"}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Peserta Paling Aktif
                </p>
                <ArrowUpRight className="w-4 h-4 text-[#0284c7]" />
              </div>
              <div className="space-y-1.5 text-xs">
                {(logbookStats.topPeserta || []).slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex justify-between gap-2">
                    <span className="truncate text-slate-600 dark:text-slate-300">
                      {item.name || "Peserta"}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "pendaftaran" && pendaftaranStats && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Ringkasan Detail Pendaftaran ({selectedYear})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Total Pendaftaran ({selectedYear})
                  </p>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {totalPendaftaranYear}
                  </p>
                </div>
                <UserPlus className="w-6 h-6 text-[#0284c7]" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                <span className="font-semibold text-emerald-600">
                  {approvedPendaftaranYear}
                </span>{" "}
                disetujui
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Status Pendaftaran
                </p>
                <AlertCircle className="w-4 h-4 text-[#0284c7]" />
              </div>
              <div className="space-y-1.5 text-xs">
                {(pendaftaranStats.byStatus || []).map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">
                      {item._id || "Lainnya"}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Posisi Terbanyak Diminati
              </p>
              <div className="space-y-1.5 text-xs">
                {(pendaftaranStats.topPosisi || []).slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex justify-between gap-2">
                    <span className="truncate text-slate-600 dark:text-slate-300">
                      {item._id || "-"}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 4 BREAKDOWN CHARTS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BreakdownCard
          title="Posisi Magang"
          total={statistikPosisi.reduce((s, x) => s + x.count, 0)}
          icon={<PieChart className="w-4 h-4 text-[#0284c7]" />}
          isEmpty={statistikPosisi.length === 0}
          emptyLabel="Data posisi belum tersedia"
        >
          <Pie
            data={{
              labels: statistikPosisi.map((x) => x.posisi),
              datasets: [
                {
                  data: statistikPosisi.map((x) => x.count),
                  backgroundColor: statistikPosisi.map(
                    (_, i) => PALETTE[i % PALETTE.length],
                  ),
                  borderWidth: 2,
                },
              ],
            }}
            options={pieOptions}
          />
        </BreakdownCard>

        <BreakdownCard
          title="Asal Instansi"
          total={statistikAsal.reduce((s, x) => s + x.count, 0)}
          icon={<PieChart className="w-4 h-4 text-emerald-500" />}
          isEmpty={statistikAsal.length === 0}
          emptyLabel="Data asal instansi belum tersedia"
        >
          <Doughnut
            data={{
              labels: statistikAsal.map((x) => x.jenis || "Lainnya"),
              datasets: [
                {
                  data: statistikAsal.map((x) => x.count),
                  backgroundColor: statistikAsal.map(
                    (_, i) => PALETTE[i % PALETTE.length],
                  ),
                  borderWidth: 2,
                },
              ],
            }}
            options={pieOptions as ChartOptions<"doughnut">}
          />
        </BreakdownCard>

        <BreakdownCard
          title="Jenis Kelamin"
          total={statistikGender.reduce((s, x) => s + x.count, 0)}
          icon={<PieChart className="w-4 h-4 text-indigo-500" />}
          isEmpty={statistikGender.length === 0}
          emptyLabel="Data jenis kelamin belum tersedia"
        >
          <Pie
            data={{
              labels: statistikGender.map((x) => x.gender || "Lainnya"),
              datasets: [
                {
                  data: statistikGender.map((x) => x.count),
                  backgroundColor: [
                    "rgba(2, 132, 199, 0.85)",
                    "rgba(236, 72, 153, 0.85)",
                    "rgba(99, 102, 241, 0.85)",
                  ],
                  borderWidth: 2,
                },
              ],
            }}
            options={pieOptions}
          />
        </BreakdownCard>

        <BreakdownCard
          title="Perkiraan Selesai (Kuartal)"
          total={statistikSelesai.reduce((s, x) => s + x.count, 0)}
          icon={<BarChart3 className="w-4 h-4 text-amber-500" />}
          isEmpty={statistikSelesai.length === 0}
          emptyLabel="Data perkiraan selesai belum tersedia"
        >
          <Bar
            data={{
              labels: statistikSelesai.map((x) => x.periode),
              datasets: [
                {
                  label: "Jumlah Peserta",
                  data: statistikSelesai.map((x) => x.count),
                  backgroundColor: "rgba(16, 185, 129, 0.85)",
                  borderColor: "rgb(16, 185, 129)",
                  borderWidth: 2,
                  borderRadius: 6,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
            }}
          />
        </BreakdownCard>
      </div>

      {/* ================= TIME SERIES TABLE ================= */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Rekap Time Series Bulanan ({selectedYear})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ringkasan aktivitas bulanan langsung dari MongoDB
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            {rawData.length} bulan aktif
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Bulan</th>
                <th className="py-3 px-4 text-center">Pendaftaran</th>
                <th className="py-3 px-4 text-center">Logbook</th>
                <th className="py-3 px-4 text-center">Peserta Aktif</th>
                <th className="py-3 px-4 text-center">Mentor Aktif</th>
                <th className="py-3 px-4 text-center">Admin Aktif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {rawData.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 px-4 text-center text-xs text-slate-400"
                  >
                    Belum ada data bulanan tercatat pada tahun {selectedYear}.
                  </td>
                </tr>
              ) : (
                rawData.map((row, idx) => (
                  <tr
                    key={`${row.date}-${idx}`}
                    className="hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-100">
                      {format(parseISO(row.date), "MMMM yyyy", {
                        locale: localeId,
                      })}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-[#0284c7] dark:text-sky-400">
                      {row.pendaftaran}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {row.logbook}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-700 dark:text-slate-200">
                      {row.peserta_aktif}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-700 dark:text-slate-200">
                      {row.mentor_aktif}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-700 dark:text-slate-200">
                      {row.admin_aktif}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ================= SMALL COMPONENTS ================= */

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  accent,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  accent: "emerald" | "sky" | "amber" | "indigo" | "rose";
}) {
  const accentMap = {
    emerald:
      "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400",
    sky: "bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400",
    amber:
      "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400",
    indigo:
      "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400",
    rose: "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400",
  };

  return (
    <div className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
            {title}
          </p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {value}
          </p>
        </div>
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accentMap[accent]}`}
        >
          {icon}
        </div>
      </div>
      <p className="text-[10px] text-slate-400 mt-2 truncate">{subtitle}</p>
    </div>
  );
}

function BreakdownCard({
  title,
  total,
  icon,
  isEmpty,
  emptyLabel,
  children,
}: {
  title: string;
  total: number;
  icon: React.ReactNode;
  isEmpty: boolean;
  emptyLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          {title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {icon}
          <span>{total} total</span>
        </div>
      </div>
      <div className="h-64">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Database className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-xs font-medium">{emptyLabel}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
