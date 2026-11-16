"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Fingerprint,
  History,
  Mail,
  Power,
  RefreshCw,
  Settings,
  Shield,
  Timer,
  ToggleLeft,
  ToggleRight,
  User,
  X,
} from "lucide-react";
import PaginationFooter from "@/components/dashboard/PaginationFooter";
import { TablePageSkeleton } from "@/components/dashboard/skeletons";
import { showToast } from "@/components/ui/toastDashboard";

/* ================= TYPES ================= */

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

type HistoryFilter = "ALL" | "ACTIVATE" | "DEACTIVATE";
type DateRangeFilter = "all" | "today" | "week" | "month";

/* ================= CONSTANTS & HELPERS ================= */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const ITEMS_PER_PAGE = 10;

const DURATION_PRESETS = [
  { label: "15 Menit", days: 0, hours: 0, minutes: 15 },
  { label: "30 Menit", days: 0, hours: 0, minutes: 30 },
  { label: "1 Jam", days: 0, hours: 1, minutes: 0 },
  { label: "3 Jam", days: 0, hours: 3, minutes: 0 },
];

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return "Manual (Tanpa Batas)";
  if (minutes < 60) return `${minutes} menit`;
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} hari`);
  if (hours > 0) parts.push(`${hours} jam`);
  if (mins > 0) parts.push(`${mins} menit`);
  return parts.join(" ");
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const hms = [hours, mins, secs]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
  return days > 0 ? `${days}h ${hms}` : hms;
}

function escapeCsvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

/* ================= PAGE ================= */

export default function MaintenanceSuperadminPage() {
  const [maintenanceData, setMaintenanceData] =
    useState<MaintenanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* ---------- Activation Controls ---------- */
  const [durationDays, setDurationDays] = useState(0);
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [manualMode, setManualMode] = useState(false);

  /* ---------- Confirmation Modals ---------- */
  const [confirmStep, setConfirmStep] = useState<0 | 1 | 2>(0);
  const [email, setEmail] = useState("");
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  /* ---------- History Filtering & Pagination ---------- */
  const [filter, setFilter] = useState<HistoryFilter>("ALL");
  const [dateRange, setDateRange] = useState<DateRangeFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  /* ---------- Live Countdown State ---------- */
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  /* ================= FETCH ================= */

  const fetchMaintenanceData = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await fetch(`${API_BASE}/maintenance/status`, {
        cache: "no-store",
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result?.message || "Gagal memuat status maintenance");
      }

      setMaintenanceData({
        isActive: Boolean(result.isActive),
        isManual: Boolean(result.isManual),
        startTime: result.startTime ?? null,
        endTime: result.endTime ?? null,
        activatedBy: result.activatedBy ?? null,
        history: Array.isArray(result.history) ? result.history : [],
      });
    } catch (err) {
      showToast.error(
        err instanceof Error ? err.message : "Gagal memuat status maintenance",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMaintenanceData();
  }, [fetchMaintenanceData]);

  /* ================= COUNTDOWN TICKER ================= */

  useEffect(() => {
    if (
      !maintenanceData?.isActive ||
      maintenanceData.isManual ||
      !maintenanceData.endTime
    ) {
      setRemainingMs(null);
      return;
    }

    const endMs = new Date(maintenanceData.endTime).getTime();
    const update = () => {
      const diff = endMs - Date.now();
      if (diff <= 0) {
        setRemainingMs(0);
        fetchMaintenanceData(true);
      } else {
        setRemainingMs(diff);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [
    maintenanceData?.isActive,
    maintenanceData?.isManual,
    maintenanceData?.endTime,
    fetchMaintenanceData,
  ]);

  /* ================= ESCAPE KEY HANDLER ================= */

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || submitting) return;
      if (confirmDeactivate) setConfirmDeactivate(false);
      else if (confirmStep > 0) setConfirmStep(0);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmDeactivate, confirmStep, submitting]);

  /* ================= FILTERED & PAGINATED HISTORY ================= */

  const filteredHistory = useMemo(() => {
    const history = maintenanceData?.history ?? [];
    const nowMs = Date.now();

    return history
      .filter((item) => {
        const endMs = item.endTime ? new Date(item.endTime).getTime() : null;
        const isOngoing =
          endMs === null || (maintenanceData?.isActive && endMs > nowMs);

        if (filter === "ACTIVATE" && !isOngoing) return false;
        if (filter === "DEACTIVATE" && isOngoing) return false;

        if (dateRange !== "all") {
          const startMs = new Date(item.startTime).getTime();
          const ref = new Date();
          if (dateRange === "today") {
            ref.setHours(0, 0, 0, 0);
            if (startMs < ref.getTime()) return false;
          } else if (dateRange === "week") {
            if (startMs < nowMs - 7 * 86400000) return false;
          } else if (dateRange === "month") {
            if (startMs < nowMs - 30 * 86400000) return false;
          }
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
      );
  }, [maintenanceData, filter, dateRange]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredHistory.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);

  const paginatedHistory = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredHistory.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredHistory, safePage]);

  /* ================= ACTIONS ================= */

  const totalConfiguredMinutes =
    durationDays * 1440 + durationHours * 60 + durationMinutes;

  const openActivateConfirmation = () => {
    if (!manualMode && totalConfiguredMinutes <= 0) {
      showToast.error(
        "Atur durasi minimal 1 menit atau aktifkan Mode Manual",
      );
      return;
    }

    try {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const parsed = JSON.parse(rawUser) as { email?: string };
        if (parsed?.email && !email) setEmail(parsed.email);
      }
    } catch {
      // Ignore storage parse issue
    }

    setConfirmStep(1);
  };

  const handleActivate = async () => {
    if (!email.trim()) {
      showToast.error("Email Superadmin wajib diisi untuk konfirmasi");
      return;
    }

    const token = localStorage.getItem("token");
    const isManual = manualMode || totalConfiguredMinutes <= 0;
    const toastId = showToast.loading("Mengaktifkan mode maintenance...");

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/maintenance/activate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          durationMinutes: isManual ? null : totalConfiguredMinutes,
          email: email.trim().toLowerCase(),
          manual: isManual,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result?.message || "Gagal mengaktifkan maintenance");
      }

      showToast.updateSuccess(toastId, "Mode maintenance berhasil diaktifkan");
      setConfirmStep(0);
      setEmail("");
      await fetchMaintenanceData(true);
    } catch (err) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal mengaktifkan maintenance",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    const token = localStorage.getItem("token");
    const toastId = showToast.loading("Menonaktifkan mode maintenance...");

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/maintenance/deactivate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(
          result?.message || "Gagal menonaktifkan mode maintenance",
        );
      }

      showToast.updateSuccess(toastId, "Mode maintenance berhasil dinonaktifkan");
      setConfirmDeactivate(false);
      await fetchMaintenanceData(true);
    } catch (err) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal menonaktifkan maintenance",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    if (!filteredHistory.length) {
      showToast.error("Tidak ada riwayat untuk diekspor");
      return;
    }

    const rows = [
      [
        "Waktu Mulai",
        "Waktu Selesai",
        "Diaktifkan Oleh",
        "Durasi",
        "Mode",
        "Status",
      ].map(escapeCsvCell),
      ...filteredHistory.map((item) => {
        const ongoing =
          !item.endTime ||
          (Boolean(maintenanceData?.isActive) &&
            new Date(item.endTime).getTime() > Date.now());
        return [
          formatDate(item.startTime),
          item.endTime ? formatDate(item.endTime) : "-",
          item.activatedBy || "-",
          formatDuration(item.durationMinutes),
          item.isManual ? "Manual" : "Terjadwal",
          ongoing ? "Sedang Berjalan" : "Selesai",
        ].map(escapeCsvCell);
      }),
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `riwayat-maintenance-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast.success("Riwayat maintenance berhasil diekspor");
  };

  /* ================= RENDER ================= */

  if (loading) {
    return (
      <TablePageSkeleton
        title="Manajemen Maintenance Sistem"
        subtitle="Memuat status dan riwayat pemeliharaan sistem..."
        columnsCount={6}
        rowsCount={6}
      />
    );
  }

  const isActive = Boolean(maintenanceData?.isActive);

  return (
    <div className="space-y-6">
      {/* ================= PAGE HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Manajemen Maintenance Sistem
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kontrol status pemeliharaan portal publik dan pantau riwayat aktivasi
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchMaintenanceData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
          />
          Segarkan Status
        </button>
      </div>

      {/* ================= STATUS HERO BANNER ================= */}
      <div
        className={`rounded-2xl p-6 text-white shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 ${
          isActive
            ? "bg-linear-to-r from-rose-600 via-red-600 to-amber-600"
            : "bg-linear-to-r from-[#0284c7] via-sky-600 to-blue-700"
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-white/15 backdrop-blur-xs shrink-0">
            {isActive ? (
              <AlertTriangle className="w-7 h-7" />
            ) : (
              <Shield className="w-7 h-7" />
            )}
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-wider">
                {isActive ? "MAINTENANCE AKTIF" : "SISTEM NORMAL"}
              </span>
              {isActive && (
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-semibold">
                  {maintenanceData?.isManual
                    ? "Mode Manual (Tanpa Batas)"
                    : "Mode Terjadwal"}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold">
              {isActive
                ? "Portal Sedang Dalam Pemeliharaan"
                : "Seluruh Layanan Berjalan Normal"}
            </h2>

            {isActive ? (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-white/90 pt-1">
                <span className="inline-flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Diaktifkan oleh: {maintenanceData?.activatedBy || "-"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Mulai: {formatDate(maintenanceData?.startTime ?? null)}
                </span>
                {!maintenanceData?.isManual && maintenanceData?.endTime && (
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <Timer className="w-3.5 h-3.5" />
                    Sisa Waktu:{" "}
                    {remainingMs !== null ? formatCountdown(remainingMs) : "-"}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-sky-100">
                Pengunjung dan peserta dapat mengakses pendaftaran, logbook, dan
                dashboard tanpa hambatan.
              </p>
            )}
          </div>
        </div>

        {isActive && (
          <button
            type="button"
            onClick={() => setConfirmDeactivate(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold bg-white text-rose-700 hover:bg-rose-50 shadow-sm transition cursor-pointer shrink-0"
          >
            <Power className="w-4 h-4" />
            Nonaktifkan Maintenance Sekarang
          </button>
        )}
      </div>

      {/* ================= ACTIVATION PANEL + SUMMARY ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Pengaturan Aktivasi Maintenance
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pilih preset durasi, masukkan durasi khusus, atau gunakan mode
                  manual
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setManualMode((v) => !v)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                manualMode
                  ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                  : "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
              }`}
            >
              {manualMode ? (
                <ToggleRight className="w-4 h-4" />
              ) : (
                <ToggleLeft className="w-4 h-4" />
              )}
              <span>Mode Manual</span>
            </button>
          </div>

          {!manualMode ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Preset Cepat
                </p>
                <div className="flex flex-wrap gap-2">
                  {DURATION_PRESETS.map((preset) => {
                    const isSelected =
                      durationDays === preset.days &&
                      durationHours === preset.hours &&
                      durationMinutes === preset.minutes;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setDurationDays(preset.days);
                          setDurationHours(preset.hours);
                          setDurationMinutes(preset.minutes);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? "bg-[#0284c7] text-white shadow-2xs"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Hari
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={durationDays}
                    onChange={(e) =>
                      setDurationDays(Math.max(0, Number(e.target.value) || 0))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Jam
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={durationHours}
                    onChange={(e) =>
                      setDurationHours(Math.max(0, Number(e.target.value) || 0))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Menit
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={durationMinutes}
                    onChange={(e) =>
                      setDurationMinutes(
                        Math.max(0, Number(e.target.value) || 0),
                      )
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/60 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  Total durasi yang dijadwalkan:
                </span>
                <span className="font-extrabold text-[#0284c7] dark:text-sky-400">
                  {totalConfiguredMinutes > 0
                    ? formatDuration(totalConfiguredMinutes)
                    : "Belum diatur"}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-bold">Mode Manual Tanpa Batas Waktu</p>
                <p className="mt-0.5 leading-relaxed opacity-90">
                  Maintenance akan terus aktif sampai Superadmin menekan tombol
                  nonaktifkan secara manual.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={openActivateConfirmation}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-linear-to-r from-[#0284c7] to-blue-700 hover:from-[#0369a1] hover:to-blue-800 shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              <Power className="w-4 h-4" />
              {isActive ? "Perbarui & Aktifkan Maintenance" : "Aktifkan Maintenance"}
            </button>
          </div>
        </div>

        {/* Right Info Card */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Protokol Keamanan
              </h3>
              <p className="text-[11px] text-slate-400">
                Validasi 2 langkah Superadmin
              </p>
            </div>
          </div>

          <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0284c7] shrink-0 mt-0.5" />
              <span>
                Hanya akun <strong>Superadmin dengan Super Access</strong> yang
                dapat mengaktifkan maintenance.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0284c7] shrink-0 mt-0.5" />
              <span>
                Semua aktivitas tercatat otomatis ke dalam riwayat beserta waktu
                selesai aktual.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0284c7] shrink-0 mt-0.5" />
              <span>
                Mode terjadwal akan otomatis nonaktif kembali saat hitung mundur
                habis.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* ================= HISTORY SECTION ================= */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-[#0284c7]" />
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Riwayat Maintenance
              </h3>
              <p className="text-xs text-slate-400">
                Total {filteredHistory.length} entri tercatat
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              {(
                [
                  { id: "ALL", label: "Semua" },
                  { id: "ACTIVATE", label: "Berjalan" },
                  { id: "DEACTIVATE", label: "Selesai" },
                ] as { id: HistoryFilter; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setFilter(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    filter === tab.id
                      ? "bg-[#0284c7] text-white"
                      : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value as DateRangeFilter);
                  setCurrentPage(1);
                }}
                className="text-xs font-semibold bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">Semua Waktu</option>
                <option value="today">Hari Ini</option>
                <option value="week">7 Hari Terakhir</option>
                <option value="month">30 Hari Terakhir</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-[#0284c7] border border-sky-200 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 dark:text-sky-300 dark:border-sky-800 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4 text-center w-12">No</th>
                <th className="py-3.5 px-4">Waktu Mulai</th>
                <th className="py-3.5 px-4">Waktu Selesai</th>
                <th className="py-3.5 px-4">Diaktifkan Oleh</th>
                <th className="py-3.5 px-4">Durasi & Mode</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Calendar className="w-9 h-9 opacity-40" />
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                        Belum ada riwayat maintenance
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedHistory.map((item, idx) => {
                  const ongoing =
                    !item.endTime ||
                    (isActive &&
                      new Date(item.endTime).getTime() > Date.now());
                  return (
                    <tr
                      key={`${item.startTime}-${idx}`}
                      className="hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-400 tabular-nums">
                        {(safePage - 1) * ITEMS_PER_PAGE + idx + 1}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-700 dark:text-slate-200">
                        {formatDate(item.startTime)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                        {item.endTime ? formatDate(item.endTime) : "-"}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-200">
                        {item.activatedBy || "-"}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          {formatDuration(item.durationMinutes)}
                        </span>
                        <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {item.isManual ? "Manual" : "Terjadwal"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            ongoing
                              ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                          }`}
                        >
                          {ongoing ? "Berjalan" : "Selesai"}
                        </span>
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
          totalItems={filteredHistory.length}
          itemsPerPage={ITEMS_PER_PAGE}
          itemLabel="riwayat"
          onPageChange={setCurrentPage}
        />
      </div>

      {/* ================= ACTIVATE 2-STEP MODAL ================= */}
      {confirmStep > 0 && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => !submitting && setConfirmStep(0)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-linear-to-r from-[#0284c7] to-blue-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-extrabold">
                  {confirmStep === 1
                    ? "Konfirmasi Mode Maintenance"
                    : "Verifikasi Email Superadmin"}
                </h3>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setConfirmStep(0)}
                className="p-1.5 rounded-lg hover:bg-white/15"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {confirmStep === 1 ? (
              <div className="p-6 space-y-4">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Mengaktifkan maintenance akan membatasi akses portal publik dan
                  peserta selama{" "}
                  <strong className="text-slate-900 dark:text-white">
                    {manualMode || totalConfiguredMinutes <= 0
                      ? "mode manual tanpa batas waktu"
                      : formatDuration(totalConfiguredMinutes)}
                  </strong>
                  . Lanjutkan ke verifikasi?
                </p>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmStep(0)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmStep(2)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0284c7] hover:bg-sky-700 cursor-pointer"
                  >
                    Lanjutkan
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Email Superadmin Aktif
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="superadmin@bpom.go.id"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setConfirmStep(1)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleActivate}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Mengaktifkan..." : "Ya, Aktifkan Sekarang"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= DEACTIVATE CONFIRM MODAL ================= */}
      {confirmDeactivate && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => !submitting && setConfirmDeactivate(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 shrink-0">
                <Power className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Nonaktifkan Mode Maintenance?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Seluruh akses website dan dashboard akan segera dibuka kembali
                  secara normal untuk semua pengguna.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setConfirmDeactivate(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeactivate}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Memproses..." : "Ya, Nonaktifkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
