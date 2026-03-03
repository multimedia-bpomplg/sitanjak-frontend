"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
  Shield,
  Clock,
  Mail,
  AlertTriangle,
  Power,
  Settings,
  CheckCircle,
  XCircle,
  ToggleLeft,
  ToggleRight,
  History,
  Calendar,
  User,
  Filter,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Timer,
  Fingerprint,
} from "lucide-react";
import { showToast } from "@/components/ui/toastDashboard";

const API = process.env.NEXT_PUBLIC_API_URL;

interface MaintenanceHistory {
  startTime: string;
  endTime: string | null;
  activatedBy: string;
  durationMinutes: number | null;
  isManual: boolean;
}

interface MaintenanceData {
  isActive: boolean;
  isManual: boolean;
  startTime: string | null;
  endTime: string | null;
  activatedBy: string | null;
  history: MaintenanceHistory[];
}

export default function MaintenanceSuperadmin() {
  const [duration, setDuration] = useState(60);
  const [email, setEmail] = useState("");
  const [maintenanceData, setMaintenanceData] =
    useState<MaintenanceData | null>(null);
  const [confirmStep, setConfirmStep] = useState(0);
  const [manualMode, setManualMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // State untuk riwayat
  const [filter, setFilter] = useState<"ALL" | "ACTIVATE" | "DEACTIVATE">(
    "ALL",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<
    "today" | "week" | "month" | "all"
  >("all");
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 10;

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Fetch data maintenance - pake useCallback biar stable
  const fetchMaintenanceData = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/maintenance/status`);
      setMaintenanceData(res.data);
    } catch (error: any) {
      console.error("Gagal fetch maintenance:", error.response?.data);
    }
  }, []);

  useEffect(() => {
    fetchMaintenanceData();
  }, [fetchMaintenanceData]);

  // Memoized filtered history - ini yang penting!
  const filteredHistory = useMemo(() => {
    if (!maintenanceData?.history) return [];

    let filtered = [...maintenanceData.history];

    // Filter by action
    if (filter === "ACTIVATE") {
      filtered = filtered.filter((item) => !item.endTime);
    } else if (filter === "DEACTIVATE") {
      filtered = filtered.filter((item) => item.endTime);
    }

    // Filter by date range
    const now = new Date();
    if (dateRange === "today") {
      const today = new Date(now.setHours(0, 0, 0, 0));
      filtered = filtered.filter((item) => new Date(item.startTime) >= today);
    } else if (dateRange === "week") {
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      filtered = filtered.filter((item) => new Date(item.startTime) >= weekAgo);
    } else if (dateRange === "month") {
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
      filtered = filtered.filter(
        (item) => new Date(item.startTime) >= monthAgo,
      );
    }

    // Sort by startTime descending (newest first)
    filtered.sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );

    return filtered;
  }, [maintenanceData?.history, filter, dateRange]);

  // Pagination - dihitung dari filteredHistory
  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredHistory.slice(start, end);
  }, [filteredHistory, currentPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredHistory.length / itemsPerPage);
  }, [filteredHistory]);

  // Reset ke halaman 1 ketika filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, dateRange]);

  const activate = async () => {
    setLoading(true);

    const toastId = showToast.loading("Mengaktifkan maintenance...");

    try {
      await axios.post(
        `${API}/maintenance/activate`,
        {
          durationMinutes: manualMode ? null : duration,
          email,
          manual: manualMode,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      await fetchMaintenanceData();
      setConfirmStep(0);
      setEmail("");

      showToast.updateSuccess(toastId, "Maintenance berhasil diaktifkan");
    } catch (error: any) {
      showToast.updateError(
        toastId,
        error.response?.data?.message || "Gagal mengaktifkan maintenance"
      );
    } finally {
      setLoading(false);
    }
  };

  const deactivate = async () => {
    setLoading(true);

    const toastId = showToast.loading("Menonaktifkan maintenance...");

    try {
      await axios.post(
        `${API}/maintenance/deactivate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      await fetchMaintenanceData();

      showToast.updateSuccess(toastId, "Maintenance berhasil dinonaktifkan");
    } catch (error: any) {
      showToast.updateError(
        toastId,
        error.response?.data?.message || "Gagal menonaktifkan maintenance"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "Tidak terbatas";
    if (minutes < 60) return `${minutes} menit`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours} jam ${remainingMinutes} menit`
      : `${hours} jam`;
  };

  const exportHistory = () => {
    if (!maintenanceData?.history) return;

    const csvContent = [
      [
        "Waktu Mulai",
        "Waktu Selesai",
        "Diaktifkan Oleh",
        "Durasi",
        "Mode",
        "Status",
      ].join(","),
      ...maintenanceData.history.map((item) =>
        [
          formatDate(item.startTime),
          formatDate(item.endTime),
          item.activatedBy,
          formatDuration(item.durationMinutes),
          item.isManual ? "Manual" : "Otomatis",
          item.endTime ? "Selesai" : "Aktif",
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `maintenance-history-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const getStatusBadge = () => {
    if (!maintenanceData?.isActive) {
      return (
        <span className="inline-flex items-center
          px-3 sm:px-4
          py-1.5 sm:py-2
          text-xs sm:text-sm rounded-xl font-medium bg-green-100 text-green-700 border border-green-200">
          <span className="w-2 h-2 rounded-full bg-green-600 mr-2"></span>
          INACTIVE
        </span>
      );
    }

    if (maintenanceData.isManual) {
      return (
        <span className="inline-flex items-center
          px-3 sm:px-4
          py-1.5 sm:py-2
          text-xs sm:text-sm rounded-xl font-medium bg-amber-100 text-amber-700 border border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse mr-2"></span>
          MANUAL MODE
        </span>
      );
    }

    return (
      <span className="inline-flex items-center
        px-3 sm:px-4
        py-1.5 sm:py-2
        text-xs sm:text-sm rounded-xl font-medium bg-red-100 text-red-700 border border-red-200">
        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse mr-2"></span>
        AUTO MODE
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 dark:from-[#0B0614] dark:via-[#120A24] dark:to-[#1E0F3D] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          
          {/* Left Section */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 dark:bg-indigo-600/20 flex items-center justify-center">
              <Shield className="w-7 h-7 text-red-600 dark:text-indigo-400" />
            </div>

            <div>
              <h1 className="
                text-3xl lg:text-4xl 
                font-extrabold 
                leading-tight
                bg-clip-text text-transparent 
                bg-linear-to-r 
                from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400
              ">
                Maintenance Mode Control
              </h1>

              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2">
                Kelola mode pemeliharaan sistem dengan aman dan terkontrol
              </p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            
            <button
              onClick={fetchMaintenanceData}
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
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>

            <button
              onClick={exportHistory}
              className="
                inline-flex items-center gap-2
                px-5 py-2
                rounded-lg
                bg-linear-to-r
                from-[#7F1D1D] to-[#B91C1C]
                dark:from-indigo-700 dark:to-indigo-600
                text-white font-semibold text-sm
                shadow-md shadow-[#7F1D1D]/30
                dark:shadow-indigo-600/30
                hover:scale-[1.03]
                transition
              "
            >
              <Download className="w-4 h-4" />
              Export
            </button>

          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 
            md:grid-cols-1 
            lg:grid-cols-3 
            xl:grid-cols-3 
            gap-6 lg:gap-8">
            {/* Left Column - Control Panel */}
            <div className="
              lg:col-span-1
              space-y-6
              xl:sticky xl:top-24
              h-fit
            ">
              {/* Status Card */}
              <div className="rounded-2xl sm:rounded-3xl
                border border-[#FCA5A5]/30 dark:border-indigo-500/30
                bg-linear-to-br
                from-white via-[#FFFDF8] to-[#FFF4EC]
                dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-800
                backdrop-blur
                shadow-sm hover:shadow-xl
                transition overflow-hidden">
                <div className="p-6">
                  <div className="
                    flex flex-col sm:flex-row
                    sm:items-center
                    sm:justify-between
                    gap-4
                  ">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          maintenanceData?.isActive ? "bg-red-50" : "bg-green-50"
                        }`}
                      >
                        {maintenanceData?.isActive ? (
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                        ) : (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-700 dark:text-indigo-200">
                          Status Sistem
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-300">
                          {maintenanceData?.isActive
                            ? "Sistem dalam pemeliharaan"
                            : "Sistem beroperasi normal"}
                        </p>
                      </div>
                    </div>

                    {getStatusBadge()}
                  </div>

                  {/* Info tambahan jika maintenance aktif */}
                  {maintenanceData?.isActive && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                      {maintenanceData.endTime && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Timer className="w-4 h-4 text-slate-400" />
                          <span>
                            Akan berakhir: {formatDate(maintenanceData.endTime)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Fingerprint className="w-4 h-4 text-slate-400" />
                        <span
                          className={`font-medium ${
                            maintenanceData.isManual
                              ? "text-amber-600"
                              : "text-blue-600"
                          }`}
                        >
                          Mode:{" "}
                          {maintenanceData.isManual
                            ? "Manual (Tanpa batas waktu)"
                            : "Otomatis (Dengan timer)"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Control Panel */}
              <div className="rounded-2xl sm:rounded-3xl
                border border-[#FCA5A5]/30 dark:border-indigo-500/30
                bg-linear-to-br
                from-white via-[#FFFDF8] to-[#FFF4EC]
                dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-800
                backdrop-blur
                shadow-sm hover:shadow-xl
                transition">
                <div className="border-b border-slate-200 dark:border-indigo-500/30 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-slate-500 dark:text-indigo-300" />
                    <h3 className="font-semibold text-slate-700 dark:text-indigo-200">
                      Panel Kontrol
                    </h3>
                  </div>
                </div>

                <div className="p-6">
                  {!maintenanceData?.isActive ? (
                    <div className="space-y-6">
                      {/* Mode Manual Toggle */}
                      <div className="
                        rounded-xl p-4
                        bg-slate-50 dark:bg-indigo-900/40
                        border border-transparent dark:border-indigo-500/20
                      ">
                        <div className="
                          flex flex-col sm:flex-row
                          sm:items-center
                          sm:justify-between
                          gap-4
                        ">
                          <div>
                            <label className="font-medium text-slate-700 dark:text-indigo-200">
                              Mode Manual
                            </label>
                            <p className="text-sm text-slate-500 dark:text-indigo-300 mt-0.5">
                              Aktifkan tanpa batas waktu
                            </p>
                          </div>
                          <button
                            onClick={() => setManualMode(!manualMode)}
                            className="relative inline-flex items-center"
                          >
                            {manualMode ? (
                              <ToggleRight className="w-10 h-10 text-red-600" />
                            ) : (
                              <ToggleLeft className="w-10 h-10 text-slate-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Input Durasi */}
                      {!manualMode && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700 dark:text-white">
                            Durasi Maintenance (menit)
                          </label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                              type="number"
                              min="1"
                              value={duration}
                              onChange={(e) =>
                                setDuration(Number(e.target.value))
                              }
                              className="
                                w-full pl-10 pr-4 py-3
                                rounded-xl
                                border border-slate-200 dark:border-indigo-500/40
                                bg-white dark:bg-indigo-950/60
                                text-slate-700 dark:text-white
                                focus:ring-2 focus:ring-red-500 dark:focus:ring-indigo-500
                                outline-none
                              "
                            />
                          </div>
                          <p className="text-xs text-slate-400">
                            Maintenance akan otomatis nonaktif setelah {duration}{" "}
                            menit
                          </p>
                        </div>
                      )}

                      {confirmStep === 0 ? (
                        <button
                          onClick={() => setConfirmStep(1)}
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-red-200 hover:shadow-red-300"
                        >
                          <Power className="w-5 h-5" />
                          Aktifkan Maintenance
                        </button>
                      ) : (
                        <div className="
                          space-y-4
                          bg-red-50 dark:bg-red-900/30
                          border border-red-200 dark:border-red-500/40
                          rounded-xl
                          p-4
                        ">
                          <div className="flex items-start gap-3">
                            <div className="p-1 bg-red-100 dark:bg-red-500/20 rounded-full">
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-red-800 dark:text-red-300">
                                Konfirmasi Keamanan
                              </h4>
                              <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">
                                Masukkan email Superadmin untuk verifikasi
                              </p>
                            </div>
                          </div>

                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-indigo-400" />
                            <input
                              type="email"
                              placeholder="superadmin@example.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="
                                w-full pl-10 pr-4 py-3
                                border border-red-200 dark:border-red-500/40
                                rounded-xl
                                bg-white dark:bg-indigo-950/60
                                text-slate-700 dark:text-white
                                focus:ring-2 focus:ring-red-500 dark:focus:ring-indigo-500
                                outline-none
                              "
                            />
                          </div>

                          <div className="
                            flex flex-col sm:flex-row
                            gap-3
                          ">
                            <button
                              onClick={() => setConfirmStep(0)}
                              className="
                                flex-1
                                bg-white dark:bg-indigo-900/40
                                border border-slate-200 dark:border-indigo-500/30
                                hover:bg-slate-50 dark:hover:bg-indigo-800/50
                                text-slate-700 dark:text-indigo-200
                                font-medium py-3 px-4 rounded-xl transition-all
                              "
                            >
                              Batal
                            </button>
                            <button
                              onClick={activate}
                              disabled={!email || loading}
                              className="flex-1 bg-red-700 hover:bg-red-800 text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {loading ? (
                                <>
                                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                  Memproses...
                                </>
                              ) : (
                                "Konfirmasi"
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div
                        className={`rounded-xl p-4 ${
                          maintenanceData.isManual
                            ? "bg-amber-50 border border-amber-100"
                            : "bg-yellow-50 border border-yellow-100"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle
                            className={`w-5 h-5 shrink-0 mt-0.5 ${
                              maintenanceData.isManual
                                ? "text-amber-600"
                                : "text-yellow-600"
                            }`}
                          />
                          <div>
                            <h4
                              className={`font-medium ${
                                maintenanceData.isManual
                                  ? "text-amber-800"
                                  : "text-yellow-800"
                              }`}
                            >
                              Maintenance Mode Aktif
                            </h4>
                            <p
                              className={`text-sm mt-0.5 ${
                                maintenanceData.isManual
                                  ? "text-amber-700"
                                  : "text-yellow-700"
                              }`}
                            >
                              {maintenanceData.isManual
                                ? "Mode manual - perlu dimatikan secara manual"
                                : `Akan nonaktif otomatis pada ${formatDate(maintenanceData.endTime)}`}
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={deactivate}
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-green-200 hover:shadow-green-300 disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Memproses...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5" />
                            Nonaktifkan Maintenance
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - History */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl sm:rounded-3xl
                border border-[#FCA5A5]/30 dark:border-indigo-500/30
                bg-linear-to-br
                from-white via-[#FFFDF8] to-[#FFF4EC]
                dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-800
                backdrop-blur
                shadow-sm hover:shadow-xl
                transition">
                {/* History Header */}
                <div className="border-b border-slate-100 px-6 py-4">
                  <div className="
                    flex flex-col sm:flex-row
                    sm:items-center
                    sm:justify-between
                    gap-4
                  ">
                    <div className="flex items-center gap-2">
                      <History className="w-5 h-5 text-slate-500" />
                      <h3 className="font-semibold text-slate-700 dark:text-indigo-200">
                        Riwayat Maintenance
                      </h3>
                      <span className="
                        ml-2 px-2 py-0.5 rounded-full text-xs
                        bg-slate-100 text-slate-600
                        dark:bg-indigo-900/50 dark:text-indigo-300
                        wrap-break-word
                      ">
                        Total {maintenanceData?.history?.length || 0} catatan
                      </span>
                    </div>

                    {/* Filter Toggle */}
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`p-2 rounded-lg transition-all ${
                        showFilters
                          ? "bg-slate-100 text-slate-700"
                          : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Filter className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Filter Panel */}
                  {showFilters && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Filter Aksi */}
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">
                            Status
                          </label>
                          <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as any)}
                            className="
                              w-full text-sm
                              border border-[#FCA5A5]/40 dark:border-indigo-500/40
                              bg-white dark:bg-indigo-900
                              text-slate-700 dark:text-slate-100
                              rounded-lg p-2
                              focus:ring-2 focus:ring-[#B91C1C]/60 dark:focus:ring-indigo-500/60
                              outline-none
                            "
                          >
                            <option value="ALL">Semua Status</option>
                            <option value="ACTIVATE">Sedang Aktif</option>
                            <option value="DEACTIVATE">Sudah Selesai</option>
                          </select>
                        </div>

                        {/* Filter Tanggal */}
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">
                            Periode
                          </label>
                          <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value as any)}
                            className="
                              w-full text-sm
                              border border-[#FCA5A5]/40 dark:border-indigo-500/40
                              bg-white dark:bg-indigo-900
                              text-slate-700 dark:text-slate-100
                              rounded-lg p-2
                              focus:ring-2 focus:ring-[#B91C1C]/60 dark:focus:ring-indigo-500/60
                              outline-none
                            "
                          >
                            <option value="all">Semua Waktu</option>
                            <option value="today">Hari Ini</option>
                            <option value="week">7 Hari Terakhir</option>
                            <option value="month">30 Hari Terakhir</option>
                          </select>
                        </div>

                        {/* Reset Filter */}
                        <div className="flex items-end">
                          <button
                            onClick={() => {
                              setFilter("ALL");
                              setDateRange("all");
                            }}
                            className="w-full text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-2 px-3 rounded-lg transition-all"
                          >
                            Reset Filter
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* History Content */}
                <div className="p-6">
                  {!maintenanceData ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-12 h-12 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin"></div>
                      <p className="mt-4 text-sm text-slate-500">
                        Memuat data...
                      </p>
                    </div>
                  ) : paginatedHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
                        <History className="w-8 h-8 text-slate-400" />
                      </div>
                      <h4 className="mt-4 text-sm font-medium text-slate-700">
                        Tidak Ada Riwayat
                      </h4>
                      <p className="mt-1 text-xs text-slate-500">
                        {maintenanceData.history?.length === 0
                          ? "Belum pernah melakukan maintenance"
                          : "Tidak ada riwayat dengan filter ini"}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Timeline History */}
                      <div className="space-y-4">
                        {paginatedHistory.map((item, index) => (
                          <div
                            key={`${item.startTime}-${index}`}
                            className="
                              relative
                              pl-8
                              pb-8
                              border-l-2
                              border-slate-200
                              dark:border-indigo-500/40
                            "
                          >
                            {/* Timeline Dot */}
                            <div
                              className={`
                                absolute
                                -left-2.25
                                top-1
                                w-4 h-4
                                rounded-full
                                border-4
                                border-white
                                dark:border-indigo-950
                                ${!item.endTime ? "bg-red-500 animate-pulse" : "bg-green-500"}
                              `}
                            />
                            {/* Content */}
                            <div className="
                              rounded-2xl
                              border border-[#FCA5A5]/20
                              bg-white/80
                              dark:bg-indigo-950/60
                              dark:border-indigo-500/30
                              backdrop-blur
                              p-4
                              hover:shadow-lg
                              transition
                            ">
                              <div className="space-y-3">
                                {/* Header */}
                                <div className="
                                  flex flex-col sm:flex-row
                                  sm:items-center
                                  sm:justify-between
                                  gap-4
                                ">
                                  <div className="flex flex-wrap items-center gap-2">
                                    {!item.endTime ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-1"></span>
                                        ACTIVE
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-600 mr-1"></span>
                                        COMPLETED
                                      </span>
                                    )}
                                    {item.isManual && (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                        <Settings className="w-3 h-3 mr-1" />
                                        MANUAL
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                  <div className="flex items-start gap-2 text-slate-600 dark:text-indigo-200">
                                    <Calendar className="w-4 h-4 text-slate-400 dark:text-indigo-400 mt-0.5" />
                                    <span className="wrap-break-word">
                                      Mulai: {formatDate(item.startTime)}
                                    </span>
                                  </div>

                                  <div className="flex items-start gap-2 text-slate-600 dark:text-indigo-200">
                                    <Timer className="w-4 h-4 text-slate-400 dark:text-indigo-400 mt-0.5" />
                                    <span className="wrap-break-word">
                                      Selesai: {formatDate(item.endTime)}
                                    </span>
                                  </div>

                                  <div className="flex items-start gap-2 text-slate-600 dark:text-indigo-200">
                                    <User className="w-4 h-4 text-slate-400 dark:text-indigo-400 mt-0.5" />
                                    <span className="break-all">Oleh: {item.activatedBy}</span>
                                  </div>

                                  <div className="flex items-start gap-2 text-slate-600 dark:text-indigo-200">
                                    <Clock className="w-4 h-4 text-slate-400 dark:text-indigo-400 mt-0.5" />
                                    <span>
                                      Durasi:{" "}
                                      {formatDuration(item.durationMinutes)}
                                    </span>
                                  </div>
                                </div>

                                {/* Duration Info */}
                                {item.endTime && (
                                  <div className="
                                    mt-3
                                    text-xs
                                    text-slate-500 dark:text-indigo-200
                                    bg-slate-100 dark:bg-indigo-900/50
                                    p-2
                                    rounded-lg
                                  ">
                                    Total waktu:{" "}
                                    {Math.round(
                                      (new Date(item.endTime).getTime() -
                                        new Date(item.startTime).getTime()) /
                                        60000,
                                    )}{" "}
                                    menit
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                          <div className="text-xs text-slate-500">
                            Halaman {currentPage} dari {totalPages}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                setCurrentPage((p) => Math.max(1, p - 1))
                              }
                              disabled={currentPage === 1}
                              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                setCurrentPage((p) => Math.min(totalPages, p + 1))
                              }
                              disabled={currentPage === totalPages}
                              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          {maintenanceData && (
            <div className="mt-6 grid grid-cols-1 
              sm:grid-cols-2 
              lg:grid-cols-4 
              gap-4 lg:gap-6">
              <div className="rounded-2xl
                border border-[#FCA5A5]/30 dark:border-indigo-500/30
                bg-linear-to-br
                from-[#FFFDF8] via-white to-[#FFF4EC]
                dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-800
                p-5
                shadow-sm hover:shadow-xl
                transition">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <History className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-300">Total Aktivasi</p>
                    <p className="text-lg font-semibold text-slate-700 dark:text-white">
                      {maintenanceData.history?.length || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl
                border border-[#FCA5A5]/30 dark:border-indigo-500/30
                bg-linear-to-br
                from-[#FFFDF8] via-white to-[#FFF4EC]
                dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-800
                p-5
                shadow-sm hover:shadow-xl
                transition">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-300">Selesai</p>
                    <p className="text-lg font-semibold text-slate-700 dark:text-white">
                      {maintenanceData.history?.filter((h) => h.endTime).length ||
                        0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl
                border border-[#FCA5A5]/30 dark:border-indigo-500/30
                bg-linear-to-br
                from-[#FFFDF8] via-white to-[#FFF4EC]
                dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-800
                p-5
                shadow-sm hover:shadow-xl
                transition">
                <div className="flex items-center gap-3">
                  <div className="
                    p-2 rounded-lg
                    bg-red-50 
                  ">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-300">Sedang Aktif</p>
                    <p className="text-lg font-semibold text-slate-700 dark:text-white">
                      {maintenanceData.history?.filter((h) => !h.endTime)
                        .length || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl
                border border-[#FCA5A5]/30 dark:border-indigo-500/30
                bg-linear-to-br
                from-[#FFFDF8] via-white to-[#FFF4EC]
                dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-800
                p-5
                shadow-sm hover:shadow-xl
                transition">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Settings className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-300">Mode Manual</p>
                    <p className="text-lg font-semibold text-slate-700 dark:text-white">
                      {maintenanceData.history?.filter((h) => h.isManual)
                        .length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
