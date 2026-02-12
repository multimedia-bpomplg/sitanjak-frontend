"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
  registerables,
} from "chart.js";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  Calendar,
  Users,
  UserCheck,
  UserCog,
  Download,
  RefreshCw,
  FileSpreadsheet,
  BookOpen,
  UserPlus,
  BarChart3,
  PieChart,
  TrendingUp,
  Database,
  Filter,
  Clock,
  Eye,
  ArrowUpRight,
  AlertCircle,
  DatabaseZap,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { DateRange } from "react-date-range";
// import "react-date-range/dist/styles.css";
// import "react-date-range/dist/theme/default.css";
import {
  format,
  subMonths,
  startOfYear,
  endOfYear,
  parseISO,
  subDays,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  getDaysInMonth,
  startOfDay,
  endOfDay,
} from "date-fns";
import { id } from "date-fns/locale";

// Register Chart.js components
ChartJS.register(...registerables);

/* ---------------------------
    Data Types
    --------------------------- */
type DataRow = {
  date: string;
  logbook: number;
  pendaftaran: number;
  peserta_aktif: number;
  mentor_aktif: number;
  admin_aktif: number;
};

type StatistikPosisi = {
  posisi: string;
  count: number;
};

type StatistikAsal = {
  jenis: string;
  count: number;
};

type StatistikGender = {
  gender: string;
  count: number;
};

type StatistikSelesai = {
  periode: string;
  count: number;
};

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
  statistikPosisi: StatistikPosisi[];
  statistikAsal: StatistikAsal[];
  statistikGender: StatistikGender[];
};

/* ---------------------------
    Component
    --------------------------- */
export default function OversistemDashboard() {
  // State untuk data
  const [rawData, setRawData] = useState<DataRow[]>([]);
  const [statistikPosisi, setStatistikPosisi] = useState<StatistikPosisi[]>([]);
  const [statistikAsal, setStatistikAsal] = useState<StatistikAsal[]>([]);
  const [statistikGender, setStatistikGender] = useState<StatistikGender[]>([]);
  const [statistikSelesai, setStatistikSelesai] = useState<StatistikSelesai[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dataStatus, setDataStatus] = useState<"available" | "empty" | "error">(
    "available",
  );

  // Statistik real-time
  const [stats, setStats] = useState<OverviewStats>({
    pesertaAktif: 0,
    mentorAktif: 0,
    adminAktif: 0,
    pendaftaranAktif: 0,
    pendaftaranHariIni: 0,
    logbookHariIni: 0,
    totalPendaftar: 0,
    totalLogbook: 0,
    lastUpdated: "",
    statistikPosisi: [],
    statistikAsal: [],
    statistikGender: [],
  });

  // Data statistik detail
  const [logbookStats, setLogbookStats] = useState<any>(null);
  const [pendaftaranStats, setPendaftaranStats] = useState<any>(null);
  const [detailedData, setDetailedData] = useState<DataRow[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<
    "logbook" | "pendaftaran" | "peserta" | "mentor" | "admin"
  >("pendaftaran");

  const [chartType, setChartType] = useState<
    "bar" | "line" | "pie" | "doughnut"
  >("bar");

  const defaultEnd = new Date();
  const defaultStart = subMonths(defaultEnd, 11);
  const [dateRange, setDateRange] = useState({
    startDate: defaultStart,
    endDate: defaultEnd,
    key: "selection",
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1,
  );
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [dataMode, setDataMode] = useState<"monthly" | "daily">("monthly");
  const [apiStatus, setApiStatus] = useState<
    "connected" | "disconnected" | "checking"
  >("checking");

  // API Base URL
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  /* ---------------------------
      Fetch Data Functions - REAL TIME VERSION
      --------------------------- */
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("Token tidak ditemukan");
        setLoading(false);
        return;
      }

      console.log("🔄 Fetching REAL-TIME overview data...");

      // 1. Stats utama (REAL TIME)
      const statsRes = await fetch(`${API_BASE_URL}/oversistem/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        console.log("✅ Stats data loaded:", statsData);
        setStats({
          ...statsData,
          lastUpdated: new Date().toISOString(),
        });

        // Set individual statistik
        if (statsData.statistikPosisi) {
          setStatistikPosisi(statsData.statistikPosisi);
        }
        if (statsData.statistikAsal) {
          setStatistikAsal(statsData.statistikAsal);
        }
        if (statsData.statistikGender) {
          setStatistikGender(statsData.statistikGender);
        }

        setApiStatus("connected");
      } else {
        console.error("❌ Failed to fetch stats:", statsRes.status);
        setApiStatus("disconnected");
      }

      // 2. Time series bulanan (HANYA data yang ada di database)
      const timeSeriesRes = await fetch(
        `${API_BASE_URL}/oversistem/timeseries?year=${selectedYear}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );

      if (timeSeriesRes.ok) {
        const timeSeriesData = await timeSeriesRes.json();
        console.log(
          "📊 Time series data loaded:",
          timeSeriesData.length,
          "records",
        );

        // Filter hanya data yang memiliki minimal satu nilai non-zero
        const filteredData = timeSeriesData.filter(
          (row: DataRow) =>
            row.logbook > 0 ||
            row.pendaftaran > 0 ||
            row.peserta_aktif > 0 ||
            row.mentor_aktif > 0 ||
            row.admin_aktif > 0,
        );

        if (filteredData.length === 0) {
          setDataStatus("empty");
          setRawData([]);
          console.log("ℹ️ No monthly data available - showing empty state");
        } else {
          setDataStatus("available");
          setRawData(filteredData);
        }
      } else {
        console.error("❌ Failed to fetch time series:", timeSeriesRes.status);
        setDataStatus("empty");
        setRawData([]); // JANGAN generate dummy data
      }

      // 3. Data detail harian untuk bulan terpilih (HANYA jika ada data)
      if (
        (activeTab === "logbook" || activeTab === "pendaftaran") &&
        dataMode === "daily"
      ) {
        const detailedRes = await fetch(
          `${API_BASE_URL}/oversistem/timeseries/detailed?year=${selectedYear}&month=${selectedMonth}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          },
        );

        if (detailedRes.ok) {
          const detailedData = await detailedRes.json();
          console.log("📅 Daily data loaded:", detailedData.length, "records");

          if (detailedData.length === 0) {
            console.log("ℹ️ No daily data available");
            setDetailedData([]);
          } else {
            setDetailedData(detailedData);
          }
        } else {
          console.error(
            "❌ Failed to fetch detailed data:",
            detailedRes.status,
          );
          setDetailedData([]); // JANGAN generate dummy data
        }
      }

      // 4. Statistik logbook detail
      const logbookStatsRes = await fetch(
        `${API_BASE_URL}/oversistem/statistik/logbook?year=${selectedYear}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );

      if (logbookStatsRes.ok) {
        const logbookData = await logbookStatsRes.json();
        console.log("📝 Logbook stats loaded");
        setLogbookStats(logbookData);
      } else {
        setLogbookStats(null);
      }

      // 5. Statistik pendaftaran detail
      const pendaftaranStatsRes = await fetch(
        `${API_BASE_URL}/oversistem/statistik/pendaftaran?year=${selectedYear}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );

      if (pendaftaranStatsRes.ok) {
        const pendaftaranData = await pendaftaranStatsRes.json();
        console.log("📋 Pendaftaran stats loaded");
        setPendaftaranStats(pendaftaranData);
      } else {
        setPendaftaranStats(null);
      }

      // 6. Statistik selesai
      const selesaiRes = await fetch(
        `${API_BASE_URL}/oversistem/statistik/selesai`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );

      if (selesaiRes.ok) {
        const selesaiData = await selesaiRes.json();
        console.log("✅ Completion stats loaded");
        setStatistikSelesai(selesaiData);
      } else {
        setStatistikSelesai([]);
      }

      // 7. Fetch available years
      const yearsRes = await fetch(`${API_BASE_URL}/oversistem/years`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (yearsRes.ok) {
        const yearsData = await yearsRes.json();
        setAvailableYears(yearsData);
      } else {
        // Default years dari tahun saat ini
        const currentYear = new Date().getFullYear();
        setAvailableYears([currentYear]);
      }

      // 8. Check data availability
      const checkRes = await fetch(
        `${API_BASE_URL}/oversistem/check-data?year=${selectedYear}&month=${selectedMonth}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );

      if (checkRes.ok) {
        const checkData = await checkRes.json();
        console.log("🔍 Data availability:", checkData);
      }

      // Update timestamp
      setLastUpdated(format(new Date(), "HH:mm:ss"));
    } catch (error) {
      console.error("❌ Error fetching data:", error);
      setDataStatus("error");
      setApiStatus("disconnected");

      // TIDAK ADA FALLBACK DATA DUMMY
      // Reset semua state ke nilai kosong/0
      setStats({
        pesertaAktif: 0,
        mentorAktif: 0,
        adminAktif: 0,
        pendaftaranAktif: 0,
        pendaftaranHariIni: 0,
        logbookHariIni: 0,
        totalPendaftar: 0,
        totalLogbook: 0,
        lastUpdated: new Date().toISOString(),
        statistikPosisi: [],
        statistikAsal: [],
        statistikGender: [],
      });

      setRawData([]);
      setDetailedData([]);
      setStatistikPosisi([]);
      setStatistikAsal([]);
      setStatistikGender([]);
      setStatistikSelesai([]);
      setLogbookStats(null);
      setPendaftaranStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Helper untuk generate data bulanan - MODIFIED: Return empty array
  const generateMonthlyData = (year: number): DataRow[] => {
    // Tidak generate data dummy, return empty array
    return [];
  };

  // Helper untuk generate data harian - MODIFIED: Return empty array
  const generateDailyData = (year: number, month: number): DataRow[] => {
    // Tidak generate data dummy, return empty array
    return [];
  };

  const refreshData = () => {
    setRefreshing(true);
    fetchAllData();
  };

  useEffect(() => {
    fetchAllData();

    // Auto-refresh every 2 minutes untuk real-time
    const interval = setInterval(fetchAllData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedYear, selectedMonth, activeTab, dataMode]);

  /* ---------------------------
      Helper Functions
      --------------------------- */
  const filterDataByDateRange = (data: DataRow[]) => {
    return data.filter((row) => {
      const rowDate = parseISO(row.date);
      return rowDate >= dateRange.startDate && rowDate <= dateRange.endDate;
    });
  };

  const getChartData = (): ChartData<"bar"> => {
    // Tentukan data mana yang akan digunakan
    const useDetailedData =
      (activeTab === "logbook" || activeTab === "pendaftaran") &&
      dataMode === "daily";

    let sourceData = useDetailedData
      ? detailedData
      : filterDataByDateRange(rawData);

    // Jika tidak ada data, return empty dataset
    if (sourceData.length === 0) {
      return {
        labels: ["Tidak ada data"],
        datasets: [
          {
            label: "Tidak ada data",
            data: [0],
            backgroundColor: "rgba(200, 200, 200, 0.2)",
            borderColor: "rgba(200, 200, 200, 0.5)",
            borderWidth: 1,
          },
        ],
      };
    }

    // Buat label berdasarkan mode data
    const labels = sourceData.map((row) => {
      if (useDetailedData) {
        const date = parseISO(row.date);
        return `Hari ${date.getDate()}`;
      }
      return format(parseISO(row.date), "MMM yyyy", { locale: id });
    });

    // Data berdasarkan activeTab
    const getDataForTab = () => {
      switch (activeTab) {
        case "pendaftaran":
          return sourceData.map((row) => row.pendaftaran || 0);
        case "logbook":
          return sourceData.map((row) => row.logbook || 0);
        case "peserta":
          return sourceData.map((row) => row.peserta_aktif || 0);
        case "mentor":
          return sourceData.map((row) => row.mentor_aktif || 0);
        case "admin":
          return sourceData.map((row) => row.admin_aktif || 0);
        default:
          return sourceData.map((row) => row.pendaftaran || 0);
      }
    };

    const getLabelForTab = () => {
      switch (activeTab) {
        case "pendaftaran":
          return "Pendaftaran";
        case "logbook":
          return "Logbook";
        case "peserta":
          return "Peserta Aktif";
        case "mentor":
          return "Mentor Aktif";
        case "admin":
          return "Admin Aktif";
        default:
          return "Pendaftaran";
      }
    };

    const getColorForTab = () => {
      switch (activeTab) {
        case "pendaftaran":
          return "rgba(59, 130, 246, 0.8)";
        case "logbook":
          return "rgba(16, 185, 129, 0.8)";
        case "peserta":
          return "rgba(245, 158, 11, 0.8)";
        case "mentor":
          return "rgba(139, 92, 246, 0.8)";
        case "admin":
          return "rgba(239, 68, 68, 0.8)";
        default:
          return "rgba(59, 130, 246, 0.8)";
      }
    };

    const datasets = [
      {
        label: getLabelForTab(),
        data: getDataForTab(),
        backgroundColor: getColorForTab(),
        borderColor: getColorForTab().replace("0.8", "1"),
        borderWidth: 2,
        tension: 0.4,
        fill: chartType === "line",
      },
    ];

    return { labels, datasets };
  };

  const getPosisiChartData = (): ChartData<"pie"> => {
    if (statistikPosisi.length === 0) {
      return {
        labels: ["Tidak ada data"],
        datasets: [
          {
            data: [1],
            backgroundColor: ["rgba(200, 200, 200, 0.5)"],
            borderWidth: 1,
          },
        ],
      };
    }

    return {
      labels: statistikPosisi.map((item) => item.posisi || "Tidak diketahui"),
      datasets: [
        {
          data: statistikPosisi.map((item) => item.count),
          backgroundColor: [
            "rgba(59, 130, 246, 0.8)",
            "rgba(16, 185, 129, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(139, 92, 246, 0.8)",
            "rgba(239, 68, 68, 0.8)",
            "rgba(236, 72, 153, 0.8)",
            "rgba(14, 165, 233, 0.8)",
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  const getAsalChartData = (): ChartData<"doughnut"> => {
    if (statistikAsal.length === 0) {
      return {
        labels: ["Tidak ada data"],
        datasets: [
          {
            data: [1],
            backgroundColor: ["rgba(200, 200, 200, 0.5)"],
            borderWidth: 1,
          },
        ],
      };
    }

    return {
      labels: statistikAsal.map((item) => item.jenis || "Tidak diketahui"),
      datasets: [
        {
          data: statistikAsal.map((item) => item.count),
          backgroundColor: [
            "rgba(59, 130, 246, 0.8)",
            "rgba(16, 185, 129, 0.8)",
            "rgba(245, 158, 11, 0.8)",
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  const getGenderChartData = (): ChartData<"pie"> => {
    if (statistikGender.length === 0) {
      return {
        labels: ["Tidak ada data"],
        datasets: [
          {
            data: [1],
            backgroundColor: ["rgba(200, 200, 200, 0.5)"],
            borderWidth: 1,
          },
        ],
      };
    }

    return {
      labels: statistikGender.map((item) => item.gender || "Tidak diketahui"),
      datasets: [
        {
          data: statistikGender.map((item) => item.count),
          backgroundColor: [
            "rgba(59, 130, 246, 0.8)",
            "rgba(236, 72, 153, 0.8)",
            "rgba(139, 92, 246, 0.8)",
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  const getSelesaiChartData = (): ChartData<"bar"> => {
    if (statistikSelesai.length === 0) {
      return {
        labels: ["Tidak ada data"],
        datasets: [
          {
            label: "Tidak ada data",
            data: [0],
            backgroundColor: "rgba(200, 200, 200, 0.5)",
            borderColor: "rgb(200, 200, 200)",
            borderWidth: 1,
          },
        ],
      };
    }

    return {
      labels: statistikSelesai.map((item) => item.periode),
      datasets: [
        {
          label: "Jumlah Peserta",
          data: statistikSelesai.map((item) => item.count),
          backgroundColor: "rgba(16, 185, 129, 0.8)",
          borderColor: "rgb(16, 185, 129)",
          borderWidth: 2,
        },
      ],
    };
  };

  /* ---------------------------
      Export Functions
      --------------------------- */
  const exportToExcel = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Silakan login kembali");
        return;
      }

      // Fetch export data dari API
      const exportRes = await fetch(
        `${API_BASE_URL}/oversistem/export?startDate=${format(
          dateRange.startDate,
          "yyyy-MM-dd",
        )}&endDate=${format(dateRange.endDate, "yyyy-MM-dd")}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!exportRes.ok) {
        throw new Error("Gagal mengambil data export");
      }

      const exportData = await exportRes.json();

      // Prepare data untuk Excel
      const workbook = XLSX.utils.book_new();

      // 1. Time Series Sheet (hanya data yang ada)
      const timeSeriesData =
        exportData.timeSeries ||
        (rawData.length > 0
          ? rawData.map((row) => ({
              Tanggal: format(parseISO(row.date), "dd/MM/yyyy"),
              Logbook: row.logbook,
              Pendaftaran: row.pendaftaran,
              "Peserta Aktif": row.peserta_aktif,
              "Mentor Aktif": row.mentor_aktif,
              "Admin Aktif": row.admin_aktif,
            }))
          : []);

      if (timeSeriesData.length > 0) {
        const timeSeriesWS = XLSX.utils.json_to_sheet(timeSeriesData);
        XLSX.utils.book_append_sheet(
          workbook,
          timeSeriesWS,
          "Data Time Series",
        );
      }

      // 2. Statistik Posisi
      if (statistikPosisi.length > 0) {
        const posisiWS = XLSX.utils.json_to_sheet(statistikPosisi);
        XLSX.utils.book_append_sheet(workbook, posisiWS, "Statistik Posisi");
      }

      // 3. Statistik Asal
      if (statistikAsal.length > 0) {
        const asalWS = XLSX.utils.json_to_sheet(statistikAsal);
        XLSX.utils.book_append_sheet(workbook, asalWS, "Statistik Asal");
      }

      // 4. Statistik Gender
      if (statistikGender.length > 0) {
        const genderWS = XLSX.utils.json_to_sheet(statistikGender);
        XLSX.utils.book_append_sheet(workbook, genderWS, "Statistik Gender");
      }

      // 5. Statistik Selesai
      if (statistikSelesai.length > 0) {
        const selesaiWS = XLSX.utils.json_to_sheet(statistikSelesai);
        XLSX.utils.book_append_sheet(workbook, selesaiWS, "Statistik Selesai");
      }

      // 6. Summary Stats Sheet
      const summaryData = [
        {
          "Peserta Aktif": stats.pesertaAktif,
          "Mentor Aktif": stats.mentorAktif,
          "Admin Aktif": stats.adminAktif,
          "Pendaftaran Aktif": stats.pendaftaranAktif,
          "Pendaftaran Hari Ini": stats.pendaftaranHariIni,
          "Logbook Hari Ini": stats.logbookHariIni,
          "Total Pendaftar": stats.totalPendaftar,
          "Total Logbook": stats.totalLogbook || 0,
          Periode: `${format(dateRange.startDate, "dd/MM/yyyy")} - ${format(
            dateRange.endDate,
            "dd/MM/yyyy",
          )}`,
          Tahun: selectedYear,
          "Terakhir Update": stats.lastUpdated
            ? format(parseISO(stats.lastUpdated), "dd/MM/yyyy HH:mm:ss")
            : "-",
        },
      ];

      const summaryWS = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWS, "Summary Stats");

      // 7. Data Status Sheet
      const statusData = [
        {
          Status:
            dataStatus === "available" ? "Data Tersedia" : "Tidak Ada Data",
          "Total Records": rawData.length + detailedData.length,
          "API Status":
            apiStatus === "connected" ? "Connected" : "Disconnected",
          "Data Mode": dataMode === "daily" ? "Harian" : "Bulanan",
          "Export Time": format(new Date(), "dd/MM/yyyy HH:mm:ss"),
        },
      ];

      const statusWS = XLSX.utils.json_to_sheet(statusData);
      XLSX.utils.book_append_sheet(workbook, statusWS, "Data Status");

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const file = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(
        file,
        `oversistem-report-${format(new Date(), "yyyy-MM-dd-HHmm")}.xlsx`,
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Gagal mengekspor data ke Excel");
    }
  };

  /* ---------------------------
      Chart Options
      --------------------------- */
  const barChartOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text:
          dataStatus === "empty"
            ? "Tidak Ada Data"
            : `Statistik ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} - ${selectedYear}`,
        font: {
          size: 16,
          weight: "bold",
        },
        color: dataStatus === "empty" ? "#9CA3AF" : undefined,
      },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            label += context.parsed.y;
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        title: {
          display: true,
          text: "Jumlah",
        },
      },
      x: {
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
    },
  };

  const lineChartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text:
          dataStatus === "empty"
            ? "Tidak Ada Data"
            : `Statistik ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} - ${selectedYear}`,
        font: {
          size: 16,
          weight: "bold",
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0 },
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 4,
        hoverRadius: 6,
      },
    },
  };

  const pieChartOptions: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: statistikPosisi.length === 0 ? "Tidak Ada Data" : undefined,
        color: "#9CA3AF",
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = context.parsed;
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0,
            );
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  const doughnutChartOptions: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = context.parsed;
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0,
            );
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  /* ---------------------------
      Helper untuk statistik
      --------------------------- */
  const getTotalLogbook = () => {
    if (!logbookStats?.monthly) return stats.totalLogbook || 0;
    return logbookStats.monthly.reduce(
      (sum: number, item: any) => sum + item.total,
      0,
    );
  };

  const getTotalPendaftaran = () => {
    if (!pendaftaranStats?.monthly) return stats.totalPendaftar || 0;
    return pendaftaranStats.monthly.reduce(
      (sum: number, item: any) => sum + item.total,
      0,
    );
  };

  const getApprovedLogbook = () => {
    if (!logbookStats?.monthly) return 0;
    return logbookStats.monthly.reduce(
      (sum: number, item: any) => sum + (item.approved || 0),
      0,
    );
  };

  const getApprovedPendaftaran = () => {
    if (!pendaftaranStats?.monthly) return stats.pendaftaranAktif || 0;
    return pendaftaranStats.monthly.reduce(
      (sum: number, item: any) => sum + (item.approved || 0),
      0,
    );
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  /* ---------------------------
      Render - REAL TIME VERSION
      --------------------------- */
  return (
    <div
      className="
        min-h-screen
        bg-linear-to-br
        from-[#FFFDF5] via-[#FFF7ED] to-white
        dark:from-[#020617] dark:via-[#020617] dark:to-[#1E1B4B]
        p-4 md:p-6 xl:p-10
      "
    >
      {/* Header dengan status */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#7F1D1D] dark:text-indigo-300">
                Oversistem Dashboard
              </h1>
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                  apiStatus === "connected"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    : apiStatus === "disconnected"
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                }`}
              >
                {apiStatus === "connected" ? (
                  <>
                    <DatabaseZap className="w-3 h-3" />
                    <span>REAL-TIME</span>
                  </>
                ) : apiStatus === "disconnected" ? (
                  <>
                    <XCircle className="w-3 h-3" />
                    <span>DISCONNECTED</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3" />
                    <span>CHECKING</span>
                  </>
                )}
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Dashboard monitoring real-time sistem magang
              {lastUpdated && (
                <span className="ml-2 text-sm text-gray-500">
                  (Terakhir diperbarui: {lastUpdated})
                </span>
              )}
            </p>
            {dataStatus === "empty" && !loading && (
              <div className="mt-2 flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>
                  Tidak ada data tersedia di database untuk periode ini
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={refreshData}
              disabled={refreshing || loading}
              className="
                  inline-flex items-center gap-2
                  px-4 py-2
                  rounded-lg
                  bg-linear-to-r
                  from-[#F59E0B] to-[#B91C1C]
                  dark:from-indigo-600 dark:to-indigo-800
                  text-white font-semibold text-sm
                  shadow-md shadow-[#B91C1C]/30
                  dark:shadow-indigo-600/30
                  hover:scale-[1.03]
                  transition
                "
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Memuat..." : "Refresh"}
            </button>

            <button
              onClick={exportToExcel}
              disabled={loading || dataStatus === "empty"}
              className="px-4 py-2 bg-linear-to-r from-[#7F1D1D] to-[#B91C1C] dark:from-indigo-700 dark:to-indigo-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export Excel
            </button>
          </div>
        </div>

        {/* Stats Cards - REAL TIME */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {/* Peserta Aktif */}
          <div
            className={`rounded-2xl p-5 bg-white/90 dark:bg-indigo-950/40 border border-amber-200 dark:border-indigo-500/30 shadow-sm hover:shadow-xl transition ${
              stats.pesertaAktif > 0
                ? "bg-white dark:bg-gray-800"
                : "bg-gray-50 dark:bg-gray-800/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  stats.pesertaAktif > 0
                    ? "bg-blue-100 dark:bg-blue-900"
                    : "bg-gray-100 dark:bg-gray-700"
                }`}
              >
                <Users
                  className={`w-6 h-6 ${
                    stats.pesertaAktif > 0
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Peserta Aktif
                </p>
                <p className="text-2xl font-bold">
                  {loading ? "-" : stats.pesertaAktif}
                </p>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {stats.pesertaAktif > 0 ? (
                <>
                  <DatabaseZap className="w-3 h-3 inline mr-1 text-green-500" />
                  <span>Live database count</span>
                </>
              ) : (
                <>
                  <Database className="w-3 h-3 inline mr-1 text-gray-400" />
                  <span>No active participants</span>
                </>
              )}
            </div>
          </div>

          {/* Mentor Aktif */}
          <div
            className={`rounded-2xl p-5 bg-white/90 dark:bg-indigo-950/40 border border-amber-200 dark:border-indigo-500/30 shadow-sm hover:shadow-xl transition ${
              stats.mentorAktif > 0
                ? "bg-white dark:bg-gray-800"
                : "bg-gray-50 dark:bg-gray-800/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  stats.mentorAktif > 0
                    ? "bg-green-100 dark:bg-green-900"
                    : "bg-gray-100 dark:bg-gray-700"
                }`}
              >
                <UserCheck
                  className={`w-6 h-6 ${
                    stats.mentorAktif > 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Mentor Aktif
                </p>
                <p className="text-2xl font-bold">
                  {loading ? "-" : stats.mentorAktif}
                </p>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {stats.mentorAktif > 0 ? (
                <>
                  <CheckCircle className="w-3 h-3 inline mr-1 text-green-500" />
                  <span>Active mentors</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3 h-3 inline mr-1 text-gray-400" />
                  <span>No mentors</span>
                </>
              )}
            </div>
          </div>

          {/* Admin Aktif */}
          <div
            className={`rounded-2xl p-5 bg-white/90 dark:bg-indigo-950/40 border border-amber-200 dark:border-indigo-500/30 shadow-sm hover:shadow-xl transition ${
              stats.adminAktif > 0
                ? "bg-white dark:bg-gray-800"
                : "bg-gray-50 dark:bg-gray-800/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  stats.adminAktif > 0
                    ? "bg-purple-100 dark:bg-purple-900"
                    : "bg-gray-100 dark:bg-gray-700"
                }`}
              >
                <UserCog
                  className={`w-6 h-6 ${
                    stats.adminAktif > 0
                      ? "text-purple-600 dark:text-purple-400"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Admin Aktif
                </p>
                <p className="text-2xl font-bold">
                  {loading ? "-" : stats.adminAktif}
                </p>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              <Clock className="w-3 h-3 inline mr-1 text-purple-500" />
              <span>Auto-refresh: 2 min</span>
            </div>
          </div>

          {/* Pendaftaran Hari Ini */}
          <div
            className={`rounded-2xl p-5 bg-white/90 dark:bg-indigo-950/40 border border-amber-200 dark:border-indigo-500/30 shadow-sm hover:shadow-xl transition ${
              stats.pendaftaranHariIni > 0
                ? "bg-white dark:bg-gray-800"
                : "bg-gray-50 dark:bg-gray-800/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  stats.pendaftaranHariIni > 0
                    ? "bg-amber-100 dark:bg-amber-900"
                    : "bg-gray-100 dark:bg-gray-700"
                }`}
              >
                <UserPlus
                  className={`w-6 h-6 ${
                    stats.pendaftaranHariIni > 0
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Pendaftaran Hari Ini
                </p>
                <p className="text-2xl font-bold">
                  {loading ? "-" : stats.pendaftaranHariIni}
                </p>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              <Calendar className="w-3 h-3 inline mr-1 text-amber-500" />
              <span>{format(new Date(), "dd MMM yyyy")}</span>
            </div>
          </div>

          {/* Logbook Hari Ini */}
          <div
            className={`rounded-2xl p-5 bg-white/90 dark:bg-indigo-950/40 border border-amber-200 dark:border-indigo-500/30 shadow-sm hover:shadow-xl transition ${
              stats.logbookHariIni > 0
                ? "bg-white dark:bg-gray-800"
                : "bg-gray-50 dark:bg-gray-800/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  stats.logbookHariIni > 0
                    ? "bg-indigo-100 dark:bg-indigo-900"
                    : "bg-gray-100 dark:bg-gray-700"
                }`}
              >
                <BookOpen
                  className={`w-6 h-6 ${
                    stats.logbookHariIni > 0
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Logbook Hari Ini
                </p>
                <p className="text-2xl font-bold">
                  {loading ? "-" : stats.logbookHariIni}
                </p>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {stats.logbookHariIni > 0 ? (
                <>
                  <TrendingUp className="w-3 h-3 inline mr-1 text-green-500" />
                  <span>Today's activity</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-3 h-3 inline mr-1 text-gray-400" />
                  <span>No logbook today</span>
                </>
              )}
            </div>
          </div>

          {/* Total Pendaftar */}
          <div
            className={`rounded-2xl p-5 bg-white/90 dark:bg-indigo-950/40 border border-amber-200 dark:border-indigo-500/30 shadow-sm hover:shadow-xl transition ${
              stats.totalPendaftar > 0
                ? "bg-white dark:bg-gray-800"
                : "bg-gray-50 dark:bg-gray-800/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  stats.totalPendaftar > 0
                    ? "bg-rose-100 dark:bg-rose-900"
                    : "bg-gray-100 dark:bg-gray-700"
                }`}
              >
                <FileSpreadsheet
                  className={`w-6 h-6 ${
                    stats.totalPendaftar > 0
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Pendaftar
                </p>
                <p className="text-2xl font-bold">
                  {loading ? "-" : stats.totalPendaftar}
                </p>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              <Database className="w-3 h-3 inline mr-1 text-rose-500" />
              <span>All time registrations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div
        className="
          mb-8
          bg-white/90 dark:bg-indigo-950/40
          rounded-2xl p-5
          border border-amber-200 dark:border-indigo-500/30
          shadow
        "
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2">
            {[
              {
                key: "pendaftaran",
                label: "Pendaftaran",
                icon: <UserPlus className="w-4 h-4" />,
                count: stats.pendaftaranAktif || 0,
              },
              {
                key: "logbook",
                label: "Logbook",
                icon: <BookOpen className="w-4 h-4" />,
                count: stats.totalLogbook || 0,
              },
              {
                key: "peserta",
                label: "Peserta",
                icon: <Users className="w-4 h-4" />,
                count: stats.pesertaAktif || 0,
              },
              {
                key: "mentor",
                label: "Mentor",
                icon: <UserCheck className="w-4 h-4" />,
                count: stats.mentorAktif || 0,
              },
              {
                key: "admin",
                label: "Admin",
                icon: <UserCog className="w-4 h-4" />,
                count: stats.adminAktif || 0,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`
                    px-4 py-2 rounded-xl
                    flex items-center gap-2 relative
                    font-medium
                    transition-all 
                  ${
                    activeTab === tab.key
                      ? `
                        bg-linear-to-r
                        from-[#F59E0B] to-[#B91C1C]
                        dark:from-indigo-600 dark:to-indigo-800
                        text-white
                        shadow-lg shadow-[#B91C1C]/30
                        dark:shadow-indigo-600/40
                      `
                      : `
                        bg-amber-50
                        text-[#7F1D1D]
                        hover:bg-amber-100
                        dark:bg-indigo-950/40
                        dark:text-indigo-200
                        dark:hover:bg-indigo-900/40
                      `
                  }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`
                        absolute -top-1 -right-1
                        text-xs px-1.5 py-0.5 rounded-full
                        ${
                          activeTab === tab.key
                            ? `
                            bg-[#7F1D1D]
                            text-white
                            dark:bg-indigo-500
                          `
                            : `
                            bg-amber-200
                            text-[#7F1D1D]
                            dark:bg-indigo-500/30
                            dark:text-indigo-200
                          `
                        }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Right Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Data Mode Toggle */}
            {(activeTab === "logbook" || activeTab === "pendaftaran") && (
              <div className="flex items-center gap-2">
                <select
                  value={dataMode}
                  onChange={(e) =>
                    setDataMode(e.target.value as "monthly" | "daily")
                  }
                  className="px-3 py-2 bg-white dark:bg-gray-700 rounded-lg text-[#7F1D1D] dark:text-gray-300 text-sm border border-amber-200 dark:border-indigo-500/40"
                >
                  <option value="monthly">Data Bulanan</option>
                  <option value="daily">Data Harian</option>
                </select>
              </div>
            )}

            {/* Month Selector untuk data harian */}
            {dataMode === "daily" &&
              (activeTab === "logbook" || activeTab === "pendaftaran") && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="px-3 py-2 bg-white dark:bg-gray-700 rounded-lg text-[#7F1D1D] dark:text-gray-300 text-sm border border-amber-200 dark:border-indigo-500/40"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(
                      (month) => (
                        <option key={month} value={month}>
                          {format(new Date(selectedYear, month - 1), "MMMM", {
                            locale: id,
                          })}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              )}

            {/* Chart Type Selector */}
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#7F1D1D] dark:text-indigo-200" />
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as any)}
                className="px-3 py-2 bg-white dark:bg-gray-700 rounded-lg text-[#7F1D1D] dark:text-gray-300 text-sm border border-amber-200 dark:border-indigo-500/40"
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="doughnut">Doughnut Chart</option>
              </select>
            </div>

            {/* Year Selector */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#7F1D1D] dark:text-indigo-200" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 bg-white dark:bg-gray-700 rounded-lg text-[#7F1D1D] dark:text-gray-300 text-sm border border-amber-200 dark:border-indigo-500/40"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="mb-8">
        <div
          className="
            bg-white/95 dark:bg-indigo-950/40
            rounded-2xl p-6
            border border-amber-200 dark:border-indigo-500/30
            shadow-xl
          "
        >
          <div className="h-100">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B91C1C] dark:border-indigo-500 mb-4"></div>
                <span className="text-gray-600 dark:text-gray-400">
                  Memuat data real-time...
                </span>
              </div>
            ) : dataStatus === "empty" ? (
              <div className="h-full flex flex-col items-center justify-center">
                <Database className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Tidak Ada Data
                </h3>
                <p className="text-gray-400 dark:text-gray-500 text-center max-w-md">
                  Belum ada data {activeTab} yang tersedia di database untuk
                  periode yang dipilih. Data akan muncul secara otomatis ketika
                  ada aktivitas di sistem.
                </p>
              </div>
            ) : chartType === "bar" ? (
              <Bar data={getChartData()} options={barChartOptions} />
            ) : chartType === "line" ? (
              <Line
                data={getChartData() as ChartData<"line">}
                options={lineChartOptions}
              />
            ) : chartType === "pie" ? (
              <Pie data={getPosisiChartData()} options={pieChartOptions} />
            ) : (
              <Doughnut
                data={getAsalChartData()}
                options={doughnutChartOptions}
              />
            )}
          </div>
          <div className="mt-4 text-sm text-gray-500 text-center">
            {dataMode === "daily"
              ? `Menampilkan data harian ${format(
                  new Date(selectedYear, selectedMonth - 1, 1),
                  "MMMM yyyy",
                  { locale: id },
                )} • ${detailedData.length} hari dengan data`
              : `Menampilkan data bulanan tahun ${selectedYear} • ${rawData.length} bulan dengan data`}
            {apiStatus === "disconnected" && (
              <span className="ml-2 text-red-500">• API disconnected</span>
            )}
          </div>
        </div>
      </div>

      {/* Detail Stats untuk Logbook dan Pendaftaran - REAL TIME */}
      {(activeTab === "logbook" || activeTab === "pendaftaran") &&
        dataStatus !== "empty" && (
          <div className="mb-8">
            <div
              className="bg-white/95 dark:bg-indigo-950/40
                rounded-2xl p-6
                border border-amber-200 dark:border-indigo-500/30
                shadow-xl
              "
            >
              <h3 className="text-lg font-semibold mb-4">
                Statistik Detail{" "}
                {activeTab === "logbook" ? "Logbook" : "Pendaftaran"}{" "}
                (Real-Time)
              </h3>

              {activeTab === "logbook" && logbookStats ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Total Logbook */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Total Logbook
                        </p>
                        <p className="text-2xl font-bold">
                          {getTotalLogbook()}
                        </p>
                      </div>
                      <BookOpen className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <span className="text-green-600 font-medium">
                        {getApprovedLogbook()}
                      </span>{" "}
                      disetujui •{" "}
                      <span className="text-amber-600 font-medium">
                        {logbookStats?.byStatus?.find(
                          (s: any) => s._id === "menunggu",
                        )?.count || 0}
                      </span>{" "}
                      menunggu
                    </div>
                  </div>

                  {/* Status Logbook */}
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Status Distribusi
                      </p>
                      <Eye className="w-6 h-6 text-green-500" />
                    </div>

                    <div className="space-y-2 text-sm">
                      {logbookStats.byStatus?.map(
                        (item: any, index: number) => (
                          <div
                            key={index}
                            className="flex justify-between items-center"
                          >
                            <span className="text-gray-700 dark:text-gray-300">
                              {item._id === "disetujui"
                                ? "Disetujui"
                                : item._id === "menunggu"
                                  ? "Menunggu"
                                  : item._id === "ditolak"
                                    ? "Ditolak"
                                    : item._id || "Tidak diketahui"}
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {item.count}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Top Peserta */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Top Peserta
                      </p>
                      <ArrowUpRight className="w-6 h-6 text-purple-500" />
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {logbookStats.topPeserta &&
                      logbookStats.topPeserta.length > 0 ? (
                        logbookStats.topPeserta
                          .slice(0, 3)
                          .map((item: any, index: number) => (
                            <div
                              key={index}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="truncate">
                                {item.name || "Unknown"}
                              </span>
                              <span className="font-semibold">
                                {item.count}
                              </span>
                            </div>
                          ))
                      ) : (
                        <div className="text-center text-gray-400 py-2">
                          Tidak ada data
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : activeTab === "logbook" ? (
                <div className="text-center py-8 text-gray-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Data statistik logbook tidak tersedia</p>
                </div>
              ) : null}

              {activeTab === "pendaftaran" && pendaftaranStats ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Total Pendaftaran */}
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Total Pendaftaran
                        </p>
                        <p className="text-2xl font-bold">
                          {getTotalPendaftaran()}
                        </p>
                      </div>
                      <UserPlus className="w-8 h-8 text-amber-500" />
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <span className="text-green-600 font-medium">
                        {getApprovedPendaftaran()}
                      </span>{" "}
                      disetujui •{" "}
                      <span className="text-blue-600 font-medium">
                        {pendaftaranStats?.byStatus?.find(
                          (s: any) => s._id === "Menunggu",
                        )?.count || 0}
                      </span>{" "}
                      menunggu
                    </div>
                  </div>

                  {/* Status Pendaftaran */}
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Status Pendaftaran
                      </p>
                      <AlertCircle className="w-6 h-6 text-red-500" />
                    </div>

                    <div className="space-y-2 text-sm">
                      {pendaftaranStats.byStatus?.map(
                        (item: any, index: number) => (
                          <div
                            key={index}
                            className="flex justify-between items-center"
                          >
                            <span className="text-gray-700 dark:text-gray-300">
                              {item._id === "Disetujui"
                                ? "Disetujui"
                                : item._id === "Menunggu"
                                  ? "Menunggu"
                                  : item._id === "Ditolak"
                                    ? "Ditolak"
                                    : item._id || "Tidak diketahui"}
                            </span>
                            <span
                              className={`font-semibold ${
                                item._id === "Disetujui"
                                  ? "text-green-600"
                                  : item._id === "Ditolak"
                                    ? "text-red-600"
                                    : "text-yellow-600"
                              }`}
                            >
                              {item.count}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Top Posisi */}
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Top Posisi
                      </p>
                      <Users className="w-6 h-6 text-indigo-500" />
                    </div>

                    <div className="space-y-2 max-h-32 overflow-y-auto text-sm">
                      {pendaftaranStats.topPosisi
                        ?.slice(0, 3)
                        .map((item: any, index: number) => (
                          <div
                            key={index}
                            className="flex justify-between items-center"
                          >
                            <span className="truncate text-gray-700 dark:text-gray-300">
                              {item._id || "Tidak diketahui"}
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {item.count}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ) : activeTab === "pendaftaran" ? (
                <div className="text-center py-8 text-gray-400">
                  <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Data statistik pendaftaran tidak tersedia</p>
                </div>
              ) : null}
            </div>
          </div>
        )}

      {/* Statistik Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Posisi Magang */}
        <div
          className="bg-white/95 dark:bg-indigo-950/40
            rounded-2xl p-6
            border border-amber-200 dark:border-indigo-500/30
            shadow-xl
          "
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Posisi Magang</h3>
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-500">
                {statistikPosisi.reduce((sum, item) => sum + item.count, 0)}{" "}
                total
              </span>
            </div>
          </div>
          <div className="h-75">
            {statistikPosisi.length > 0 ? (
              <Pie data={getPosisiChartData()} options={pieChartOptions} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Database className="w-16 h-16 mb-3 opacity-50" />
                <p>Data posisi belum tersedia</p>
                <p className="text-sm mt-1">Akan muncul saat ada pendaftaran</p>
              </div>
            )}
          </div>
        </div>

        {/* Asal Instansi */}
        <div
          className="bg-white/95 dark:bg-indigo-950/40
            rounded-2xl p-6
            border border-amber-200 dark:border-indigo-500/30
            shadow-xl
          "
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Asal Instansi</h3>
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-500">
                {statistikAsal.reduce((sum, item) => sum + item.count, 0)} total
              </span>
            </div>
          </div>
          <div className="h-75">
            {statistikAsal.length > 0 ? (
              <Doughnut
                data={getAsalChartData()}
                options={doughnutChartOptions}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Database className="w-16 h-16 mb-3 opacity-50" />
                <p>Data asal instansi belum tersedia</p>
              </div>
            )}
          </div>
        </div>

        {/* Jenis Kelamin */}
        <div
          className="bg-white/95 dark:bg-indigo-950/40
            rounded-2xl p-6
            border border-amber-200 dark:border-indigo-500/30
            shadow-xl
          "
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Jenis Kelamin</h3>
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-gray-500">
                {statistikGender.reduce((sum, item) => sum + item.count, 0)}{" "}
                total
              </span>
            </div>
          </div>
          <div className="h-75">
            {statistikGender.length > 0 ? (
              <Pie data={getGenderChartData()} options={pieChartOptions} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Database className="w-16 h-16 mb-3 opacity-50" />
                <p>Data gender belum tersedia</p>
              </div>
            )}
          </div>
        </div>

        {/* Perkiraan Selesai */}
        <div
          className="bg-white/95 dark:bg-indigo-950/40
            rounded-2xl p-6
            border border-amber-200 dark:border-indigo-500/30
            shadow-xl
          "
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Perkiraan Selesai</h3>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-500" />
              <span className="text-sm text-gray-500">
                {statistikSelesai.reduce((sum, item) => sum + item.count, 0)}{" "}
                total
              </span>
            </div>
          </div>
          <div className="h-75">
            {statistikSelesai.length > 0 ? (
              <Bar data={getSelesaiChartData()} options={barChartOptions} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Database className="w-16 h-16 mb-3 opacity-50" />
                <p>Data selesai belum tersedia</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data Table - REAL TIME */}
      <div
        className="bg-white/95 dark:bg-indigo-950/40
          rounded-2xl
          border border-amber-200 dark:border-indigo-500/30
          shadow-xl
        "
      >
        <div className="px-6 py-4 border-b dark:border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Data Detail Time Series</h3>
            <p className="text-sm text-gray-500 mt-1">
              Data real-time dari database • Auto-refresh setiap 2 menit
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {filterDataByDateRange(rawData).length} data ditampilkan
            </span>
            {apiStatus === "connected" && (
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                Live
              </span>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          {filterDataByDateRange(rawData).length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Pendaftaran
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Logbook
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Peserta Aktif
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Mentor Aktif
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Admin Aktif
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filterDataByDateRange(rawData).map((row, index) => (
                  <tr
                    key={index}
                    className="hover:bg-[#FEF3C7]/40 dark:hover:bg-indigo-500/10 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-gray-300">
                      {format(parseISO(row.date), "MMM yyyy", { locale: id })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-gray-300">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          row.pendaftaran > 0
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {row.pendaftaran}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-gray-300">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          row.logbook > 0
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {row.logbook}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-gray-300">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          row.peserta_aktif > 0
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {row.peserta_aktif}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-gray-300">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          row.mentor_aktif > 0
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {row.mentor_aktif}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-gray-300">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          row.admin_aktif > 0
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {row.admin_aktif}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : !loading ? (
            <div className="py-16 text-center">
              <Database className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                Tidak Ada Data
              </h3>
              <p className="text-gray-400 dark:text-gray-500 max-w-md mx-auto">
                Belum ada data yang tersedia di database untuk periode yang
                dipilih.
              </p>
              <button
                onClick={refreshData}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Coba Refresh
              </button>
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B91C1C] dark:border-indigo-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Memuat data...</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info - REAL TIME VERSION */}
      <div className="mt-8 p-4 bg-white/90 dark:bg-indigo-950/40 rounded-2xl border border-amber-200 dark:border-indigo-500/30 shadow">
        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-medium mb-1">System Status:</p>
              <div className="flex items-center gap-4">
                <span
                  className={`flex items-center gap-1 ${apiStatus === "connected" ? "text-green-600" : "text-red-600"}`}
                >
                  {apiStatus === "connected" ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>API Connected</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>API Disconnected</span>
                    </>
                  )}
                </span>
                <span className="flex items-center gap-1">
                  <DatabaseZap className="w-4 h-4 text-blue-500" />
                  <span>
                    Data Mode: {dataMode === "daily" ? "Harian" : "Bulanan"}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <span>Auto-refresh: 2 menit</span>
                </span>
              </div>
            </div>
            <div className="text-right">
              <p>Last Updated: {lastUpdated || "Never"}</p>
              <p className="text-xs mt-1">
                API: {API_BASE_URL}/oversistem • Data Source: MongoDB Real-time
              </p>
            </div>
          </div>
          <div className="border-t dark:border-gray-700 pt-3 mt-3">
            <p className="text-xs">
              <strong>Real-Time System:</strong> Semua data ditampilkan langsung
              dari database tanpa data dummy. Jika tidak ada data yang tersedia,
              sistem akan menampilkan status "Tidak Ada Data".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
