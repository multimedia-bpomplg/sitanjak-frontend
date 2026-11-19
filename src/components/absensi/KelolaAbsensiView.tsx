"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ScanFace,
  RefreshCw,
  Download,
  Search,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Users,
  Award,
  ShieldCheck,
  FilterX,
} from "lucide-react";
import PaginationFooter from "@/components/dashboard/PaginationFooter";
import { TablePageSkeleton } from "@/components/dashboard/skeletons";
import { showToast } from "@/components/ui/toastDashboard";
import { saveAs } from "file-saver";
import AbsensiDetailModal from "./AbsensiDetailModal";
import type {
  ManageAbsensiItem,
  ManageAbsensiSummary,
  ManageRekapPesertaItem,
  ManageRole,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const ITEMS_PER_PAGE = 10;

interface KelolaAbsensiViewProps {
  role: ManageRole;
}

const DEFAULT_SUMMARY: ManageAbsensiSummary = {
  totalRecords: 0,
  tepatWaktuCount: 0,
  terlambatCount: 0,
  outsideBpomCount: 0,
  averageDailyScore: 0,
};

function getTodayWibDate(): string {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().slice(0, 10);
}

function formatDateShortID(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(`${dateStr}T00:00:00+07:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getScoreBadgeClass(score: number): string {
  if (score >= 100) {
    return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
  }
  if (score >= 80) {
    return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
  }
  return "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800";
}

function resolvePhotoUrl(photoPath?: string): string {
  if (!photoPath) return "";
  if (/^https?:\/\//i.test(photoPath)) return photoPath;
  const normalizedBase = API_BASE.replace(/\/+$/, "");
  const normalizedPath = photoPath.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedPath}`;
}

export default function KelolaAbsensiView({ role }: KelolaAbsensiViewProps) {
  const [activeTab, setActiveTab] = useState<"harian" | "rekap">("harian");

  // Filters
  const [dateFilter, setDateFilter] = useState<string>("");
  const [areaFilter, setAreaFilter] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  // Data
  const [summary, setSummary] = useState<ManageAbsensiSummary>(DEFAULT_SUMMARY);
  const [items, setItems] = useState<ManageAbsensiItem[]>([]);
  const [rekapList, setRekapList] = useState<ManageRekapPesertaItem[]>([]);

  // States
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);

  // Pagination
  const [harianPage, setHarianPage] = useState<number>(1);
  const [rekapPage, setRekapPage] = useState<number>(1);

  // Modal
  const [selectedItem, setSelectedItem] = useState<ManageAbsensiItem | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const pageTitle =
    role === "mentor" ? "Absensi Peserta Bimbingan" : "Kelola Absensi Kehadiran";
  const pageSubtitle =
    role === "mentor"
      ? "Pantau kehadiran harian, foto wajah, lokasi GPS, skor ketepatan waktu, dan koreksi nilai peserta bimbingan Anda."
      : "Monitoring kehadiran harian, verifikasi foto & lokasi GPS, skor disiplin (%), serta ekspor rekap seluruh peserta magang.";

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setHarianPage(1);
    setRekapPage(1);
  }, [dateFilter, areaFilter, debouncedSearch]);

  const loadData = useCallback(
    async (isManual = false) => {
      try {
        if (isManual) setRefreshing(true);
        else setLoading((prev) => (items.length === 0 && rekapList.length === 0 ? true : prev));

        const token = localStorage.getItem("token");
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const listParams = new URLSearchParams();
        if (dateFilter) listParams.set("date", dateFilter);
        if (areaFilter) listParams.set("area", areaFilter);
        if (debouncedSearch) listParams.set("search", debouncedSearch);

        const rekapParams = new URLSearchParams();
        if (dateFilter) rekapParams.set("date", dateFilter);
        if (debouncedSearch) rekapParams.set("search", debouncedSearch);

        const [listRes, rekapRes] = await Promise.all([
          fetch(`${API_BASE}/absensi/manage/list?${listParams.toString()}`, { headers }),
          fetch(`${API_BASE}/absensi/manage/rekap-peserta?${rekapParams.toString()}`, { headers }),
        ]);

        if (!listRes.ok || !rekapRes.ok) {
          throw new Error("Gagal memuat data absensi");
        }

        const listJson = await listRes.json();
        const rekapJson = await rekapRes.json();

        setSummary(listJson?.summary || DEFAULT_SUMMARY);
        setItems(Array.isArray(listJson?.items) ? listJson.items : []);
        setRekapList(Array.isArray(rekapJson) ? rekapJson : []);
      } catch (err) {
        console.error("Load KelolaAbsensi error:", err);
        showToast.error("Gagal memuat data absensi kehadiran");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [dateFilter, areaFilter, debouncedSearch]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const safeHarianPage = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
    return Math.min(Math.max(1, harianPage), totalPages);
  }, [items.length, harianPage]);

  const paginatedItems = useMemo(() => {
    const start = (safeHarianPage - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  }, [items, safeHarianPage]);

  const safeRekapPage = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(rekapList.length / ITEMS_PER_PAGE));
    return Math.min(Math.max(1, rekapPage), totalPages);
  }, [rekapList.length, rekapPage]);

  const paginatedRekap = useMemo(() => {
    const start = (safeRekapPage - 1) * ITEMS_PER_PAGE;
    return rekapList.slice(start, start + ITEMS_PER_PAGE);
  }, [rekapList, safeRekapPage]);

  const handleResetFilters = () => {
    setDateFilter("");
    setAreaFilter("");
    setSearchInput("");
    setDebouncedSearch("");
  };

  const handleOpenDetail = (item: ManageAbsensiItem) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const handleExportExcel = async () => {
    if (items.length === 0 && rekapList.length === 0) {
      showToast.error("Tidak ada data absensi untuk diekspor");
      return;
    }

    try {
      setExporting(true);

      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
        fill: { fgColor: { rgb: "0369A1" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "thin", color: { rgb: "CBD5E1" } },
          bottom: { style: "thin", color: { rgb: "CBD5E1" } },
          left: { style: "thin", color: { rgb: "CBD5E1" } },
          right: { style: "thin", color: { rgb: "CBD5E1" } },
        },
      };

      const formatAreaLabel = (
        entry?: { location?: { isInsideBpom?: boolean; distanceMeters?: number } } | null,
      ) => {
        if (!entry?.location) return "-";
        const dist = Math.round(entry.location.distanceMeters ?? 0);
        return entry.location.isInsideBpom ? `Di BBPOM (${dist} m)` : `Luar Area (${dist} m)`;
      };

      const harianRows = items.map((row, idx) => ({
        No: idx + 1,
        Tanggal: row.date || "-",
        "Nama Peserta": row.namaPeserta || "-",
        Email: row.email || "-",
        Posisi: row.posisi || "-",
        Institusi: row.institusi || "-",
        Pembimbing: row.mentorName || "-",
        "Mode Kehadiran":
          row.attendanceMode === "izin"
            ? "Izin"
            : row.attendanceMode === "wfh"
              ? "WFH"
              : "Masuk (WFO)",
        "Keterangan Izin": row.izinNote || "-",
        "Jam Masuk (WIB)": row.attendanceMode === "izin" ? "-" : row.checkIn?.timeWIB || "-",
        "Status Masuk":
          row.attendanceMode === "izin"
            ? "Izin (100%)"
            : row.checkIn?.timeStatusLabel || "Belum Check-In",
        "Selisih Masuk (Menit)": row.checkIn ? (row.checkIn.diffMinutes ?? 0) : "-",
        "Skor Masuk (%)": row.attendanceMode === "izin" ? 100 : row.checkIn ? (row.checkIn.score ?? 0) : 0,
        "Area Masuk": formatAreaLabel(row.checkIn),
        "Jam Pulang (WIB)": row.attendanceMode === "izin" ? "-" : row.checkOut?.timeWIB || "-",
        "Status Pulang":
          row.attendanceMode === "izin"
            ? "Izin"
            : row.checkOut?.timeStatusLabel || "Belum Check-Out",
        "Selisih Pulang (Menit)": row.checkOut ? (row.checkOut.diffMinutes ?? 0) : "-",
        "Skor Pulang (%)": row.attendanceMode === "izin" ? 100 : row.checkOut ? (row.checkOut.score ?? 0) : 0,
        "Area Pulang": formatAreaLabel(row.checkOut),
        "Nilai Harian (%)": row.dailyScore ?? 0,
        "Catatan Koreksi": row.koreksiNote || "-",
        "Dikoreksi Oleh": row.koreksiBy?.name
          ? `${row.koreksiBy.name} (${row.koreksiBy.role || "-"})`
          : "-",
      }));

      const rekapRows = rekapList.map((r, idx) => ({
        No: idx + 1,
        "Nama Peserta": r.namaPeserta || "-",
        Email: r.email || "-",
        Posisi: r.posisi || "-",
        Institusi: r.institusi || "-",
        Pembimbing: r.mentorName || "-",
        "Status Magang": r.statusMagang || "-",
        "Total Hari Hadir": r.totalHari ?? 0,
        "Hari WFH": r.wfhCount ?? 0,
        "Hari Izin": r.izinCount ?? 0,
        "Tidak Absen 0% (Hari)": r.tidakAbsen ?? 0,
        "Total Hari Kerja Efektif": r.totalHariKerja ?? r.totalHari ?? 0,
        "Masuk Tepat Waktu": r.tepatWaktuMasuk ?? 0,
        "Terlambat Masuk": r.telatMasuk ?? 0,
        "Pulang Awal Tanpa Ket.": r.pulangAwalTanpaKet ?? 0,
        "Absen Luar Area BBPOM": r.luarAreaBpom ?? 0,
        "Rata-rata Skor Masuk (%)": r.avgCheckInScore ?? 0,
        "Rata-rata Skor Pulang (%)": r.avgCheckOutScore ?? 0,
        "Rata-rata Nilai Harian (%)": r.avgDailyScore ?? 0,
      }));

      type XlsxModule = typeof import("xlsx");

      const buildExcelBuffer = (xlsxLib: XlsxModule, applyStyle: boolean) => {
        const wb = xlsxLib.utils.book_new();

        const styleWorksheetHeader = (ws: Record<string, unknown>, colCount: number) => {
          if (!applyStyle) return;
          for (let c = 0; c < colCount; c += 1) {
            const cellRef = xlsxLib.utils.encode_cell({ r: 0, c });
            const cell = ws[cellRef] as { s?: unknown } | undefined;
            if (cell) cell.s = headerStyle;
          }
        };

        const wsHarian = xlsxLib.utils.json_to_sheet(
          harianRows.length > 0 ? harianRows : [{ Info: "Belum ada data absensi harian" }],
        );
        wsHarian["!cols"] = [
          { wch: 5 },
          { wch: 13 },
          { wch: 24 },
          { wch: 26 },
          { wch: 18 },
          { wch: 22 },
          { wch: 20 },
          { wch: 16 },
          { wch: 28 },
          { wch: 15 },
          { wch: 24 },
          { wch: 18 },
          { wch: 14 },
          { wch: 20 },
          { wch: 15 },
          { wch: 24 },
          { wch: 18 },
          { wch: 14 },
          { wch: 20 },
          { wch: 15 },
          { wch: 28 },
          { wch: 22 },
        ];
        if (harianRows.length > 0) {
          styleWorksheetHeader(
            wsHarian as unknown as Record<string, unknown>,
            Object.keys(harianRows[0]).length,
          );
        }
        xlsxLib.utils.book_append_sheet(wb, wsHarian, "Absensi Harian");

        const wsRekap = xlsxLib.utils.json_to_sheet(
          rekapRows.length > 0 ? rekapRows : [{ Info: "Belum ada data rekap peserta" }],
        );
        wsRekap["!cols"] = [
          { wch: 5 },
          { wch: 24 },
          { wch: 26 },
          { wch: 18 },
          { wch: 22 },
          { wch: 20 },
          { wch: 16 },
          { wch: 16 },
          { wch: 12 },
          { wch: 12 },
          { wch: 20 },
          { wch: 22 },
          { wch: 18 },
          { wch: 16 },
          { wch: 22 },
          { wch: 22 },
          { wch: 22 },
          { wch: 22 },
          { wch: 24 },
        ];
        if (rekapRows.length > 0) {
          styleWorksheetHeader(
            wsRekap as unknown as Record<string, unknown>,
            Object.keys(rekapRows[0]).length,
          );
        }
        xlsxLib.utils.book_append_sheet(wb, wsRekap, "Rekap Nilai Peserta");

        return xlsxLib.write(wb, {
          bookType: "xlsx",
          type: "array",
        });
      };

      const resolveModule = (mod: unknown): XlsxModule | null => {
        const candidate = mod as { default?: Partial<XlsxModule> } & Partial<XlsxModule>;
        if (candidate?.default?.utils && typeof candidate.default.write === "function") {
          return candidate.default as XlsxModule;
        }
        if (candidate?.utils && typeof candidate.write === "function") {
          return candidate as XlsxModule;
        }
        return null;
      };

      let excelBuffer: ArrayBuffer | Uint8Array | number[] | null = null;
      try {
        const styledMod = await import("xlsx-js-style");
        const styledLib = resolveModule(styledMod);
        if (styledLib) {
          excelBuffer = buildExcelBuffer(styledLib, true);
        }
      } catch (styleErr) {
        console.warn("xlsx-js-style fallback ke xlsx standar:", styleErr);
      }

      if (!excelBuffer) {
        const stdMod = await import("xlsx");
        const stdLib = resolveModule(stdMod);
        if (!stdLib) {
          throw new Error("Library Excel gagal dimuat");
        }
        excelBuffer = buildExcelBuffer(stdLib, false);
      }

      const suffix = dateFilter || getTodayWibDate();
      const fileName = `Absensi-Magang-BBPOM-${role}-${suffix}.xlsx`;
      const blob = new Blob([excelBuffer as BlobPart], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      });
      saveAs(blob, fileName);
      showToast.success("File Excel absensi berhasil diunduh");
    } catch (err) {
      console.error("Export Excel error:", err);
      showToast.error("Gagal mengekspor data absensi ke Excel");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <TablePageSkeleton
        title={pageTitle}
        subtitle="Memuat data kehadiran dan skor disiplin peserta magang..."
        columnsCount={role === "mentor" ? 6 : 7}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs font-semibold">
            <ScanFace className="w-3.5 h-3.5" />
            {role === "mentor"
              ? "Panel Bimbingan Mentor"
              : role === "superadmin"
              ? "Panel Superadmin"
              : "Panel Admin"}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {pageTitle}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            {pageSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Muat Ulang
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            {exporting ? "Mengekspor..." : "Export Excel (.xlsx)"}
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Catatan Absen
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {summary.totalRecords}
            </span>
            <span className="text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-full">
              Rata-rata: {summary.averageDailyScore}%
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Masuk Tepat Waktu
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {summary.tepatWaktuCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Skor 100% (&lt;= 08:00)</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Terlambat Masuk
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {summary.terlambatCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">&gt; 08:00 WIB</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Di Luar Area BBPOM
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {summary.outsideBpomCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Perlu verifikasi GPS</span>
          </div>
        </div>
      </div>

      {/* Tabs + Filters Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {/* Tab Switcher */}
        <div className="px-4 sm:px-6 pt-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("harian")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition ${
                activeTab === "harian"
                  ? "border-sky-600 text-sky-600 dark:text-sky-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Daftar Absensi Harian ({items.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("rekap")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition ${
                activeTab === "rekap"
                  ? "border-sky-600 text-sky-600 dark:text-sky-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Award className="w-4 h-4" />
              Rekap Nilai Peserta ({rekapList.length})
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 sm:px-6 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama peserta, email, posisi, atau institusi..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={() => setDateFilter(getTodayWibDate())}
                className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition ${
                  dateFilter === getTodayWibDate()
                    ? "bg-sky-600 text-white border-sky-600"
                    : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                Hari Ini
              </button>
            </div>

            {activeTab === "harian" && (
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Semua Status &amp; Area</option>
                <option value="inside">Di Area BBPOM</option>
                <option value="outside">Masuk • Di Luar Area BBPOM</option>
                <option value="wfh">Mode WFH</option>
                <option value="izin">Status Izin</option>
              </select>
            )}

            {(dateFilter || areaFilter || searchInput) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <FilterX className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: DAFTAR ABSENSI HARIAN */}
        {activeTab === "harian" ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-4">Tanggal</th>
                    <th className="py-3.5 px-4">Peserta</th>
                    <th className="py-3.5 px-4">Check-In (Masuk)</th>
                    <th className="py-3.5 px-4">Check-Out (Pulang)</th>
                    <th className="py-3.5 px-4">Lokasi GPS</th>
                    <th className="py-3.5 px-4">Nilai Harian</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                        Belum ada data absensi harian yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((row) => (
                      <tr
                        key={row._id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition"
                      >
                        <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-700 dark:text-slate-200">
                          {formatDateShortID(row.date)}
                        </td>

                        <td className="py-3.5 px-4 min-w-[210px]">
                          <div className="flex items-center gap-3">
                            {row.checkIn?.photoPath ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={resolvePhotoUrl(row.checkIn.photoPath)}
                                alt={row.namaPeserta}
                                className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                                <ScanFace className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-bold text-slate-900 dark:text-white leading-snug">
                                  {row.namaPeserta}
                                </p>
                                {row.attendanceMode === "wfh" && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                    WFH
                                  </span>
                                )}
                                {row.attendanceMode === "izin" && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                                    Izin
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {row.posisi} • {row.institusi}
                              </p>
                              {role !== "mentor" && (
                                <p className="text-[11px] text-sky-600 dark:text-sky-400">
                                  Pembimbing: {row.mentorName}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {row.attendanceMode === "izin" ? (
                          <td colSpan={2} className="py-3.5 px-4 max-w-[300px]">
                            <div className="rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200/80 dark:border-violet-800/60 px-3 py-2 space-y-0.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-bold text-violet-700 dark:text-violet-300">
                                  Izin (Tanpa Absen)
                                </span>
                                {row.izinSubmittedWIB && (
                                  <span className="text-[10px] text-violet-500 dark:text-violet-400">
                                    {row.izinSubmittedWIB}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                                {row.izinNote || "-"}
                              </p>
                            </div>
                          </td>
                        ) : (
                          <>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {row.checkIn ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-800 dark:text-slate-100">
                                      {row.checkIn.timeWIB}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getScoreBadgeClass(
                                        row.checkIn.score
                                      )}`}
                                    >
                                      {row.checkIn.score}%
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {row.checkIn.diffMinutes > 0
                                      ? `Telat ${row.checkIn.diffMinutes} mnt`
                                      : row.checkIn.timeStatus === "late"
                                        ? row.checkIn.timeStatusLabel || "Terlambat"
                                        : "Tepat waktu"}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">Belum absen</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {row.checkOut ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-800 dark:text-slate-100">
                                      {row.checkOut.timeWIB}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getScoreBadgeClass(
                                        row.checkOut.score
                                      )}`}
                                    >
                                      {row.checkOut.score}%
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {row.checkOut.diffMinutes > 0
                                      ? `Awal ${row.checkOut.diffMinutes} mnt`
                                      : row.checkOut.timeStatus === "early_no_note"
                                        ? row.checkOut.timeStatusLabel || "Pulang Awal"
                                        : row.checkOut.timeStatus === "on_time_note"
                                          ? "Dengan keterangan"
                                          : "Tepat waktu"}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">Belum pulang</span>
                              )}
                            </td>
                          </>
                        )}

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {row.attendanceMode === "izin" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 text-[11px] font-semibold">
                              Izin
                            </span>
                          ) : row.attendanceMode === "wfh" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 text-[11px] font-semibold">
                              <MapPin className="w-3 h-3" />
                              WFH
                            </span>
                          ) : row.isAnyOutside ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 text-[11px] font-semibold">
                              <AlertTriangle className="w-3 h-3" />
                              Luar Area
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 text-[11px] font-semibold">
                              <MapPin className="w-3 h-3" />
                              Di BBPOM
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getScoreBadgeClass(
                                row.dailyScore
                              )}`}
                            >
                              {row.dailyScore}%
                            </span>
                            {row.koreksiNote && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <ShieldCheck className="w-3 h-3" />
                                Dikoreksi
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(row)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/50 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-semibold transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {role === "mentor" ? "Detail & Koreksi" : "Detail"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <PaginationFooter
              currentPage={safeHarianPage}
              totalItems={items.length}
              itemsPerPage={ITEMS_PER_PAGE}
              itemLabel="catatan absensi"
              onPageChange={setHarianPage}
            />
          </>
        ) : (
          /* TAB 2: REKAP NILAI PESERTA */
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-4">Peserta Magang</th>
                    <th className="py-3.5 px-4 text-center">Hadir</th>
                    <th className="py-3.5 px-4 text-center">Tidak Absen (0%)</th>
                    <th className="py-3.5 px-4 text-center">Masuk Tepat / Telat</th>
                    <th className="py-3.5 px-4 text-center">Pulang Awal Tanpa Ket.</th>
                    <th className="py-3.5 px-4 text-center">Luar Area</th>
                    <th className="py-3.5 px-4 text-center">Rata-rata Masuk / Pulang</th>
                    <th className="py-3.5 px-4 text-center">Rata-rata Nilai</th>
                    <th className="py-3.5 px-4 text-right">Log Harian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {paginatedRekap.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500 dark:text-slate-400">
                        Belum ada rekap nilai peserta yang tersedia.
                      </td>
                    </tr>
                  ) : (
                    paginatedRekap.map((r) => (
                      <tr
                        key={r.email}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition"
                      >
                        <td className="py-3.5 px-4 min-w-[220px]">
                          <p className="font-bold text-slate-900 dark:text-white">{r.namaPeserta}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {r.posisi} • {r.institusi}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                              {r.statusMagang}
                            </span>
                            {role !== "mentor" && (
                              <span className="text-[11px] text-sky-600 dark:text-sky-400">
                                Mentor: {r.mentorName}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className="font-bold text-slate-800 dark:text-slate-100 block">
                            {r.totalHari} hari
                          </span>
                          {((r.wfhCount ?? 0) > 0 || (r.izinCount ?? 0) > 0) && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              {[
                                (r.wfhCount ?? 0) > 0 ? `${r.wfhCount} WFH` : "",
                                (r.izinCount ?? 0) > 0 ? `${r.izinCount} Izin` : "",
                              ]
                                .filter(Boolean)
                                .join(" • ")}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {(r.tidakAbsen ?? 0) > 0 ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 font-bold">
                              {r.tidakAbsen} hari
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">0 hari</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {r.tepatWaktuMasuk}
                          </span>{" "}
                          <span className="text-slate-400">/</span>{" "}
                          <span className="text-amber-600 dark:text-amber-400 font-bold">
                            {r.telatMasuk}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-semibold text-rose-600 dark:text-rose-400">
                          {r.pulangAwalTanpaKet}
                        </td>

                        <td className="py-3.5 px-4 text-center font-semibold text-slate-700 dark:text-slate-200">
                          {r.luarAreaBpom}
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap font-semibold text-slate-700 dark:text-slate-200">
                          {r.avgCheckInScore}% / {r.avgCheckOutScore}%
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getScoreBadgeClass(
                              r.avgDailyScore
                            )}`}
                          >
                            {r.avgDailyScore}%
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setSearchInput(r.email);
                              setDebouncedSearch(r.email);
                              setActiveTab("harian");
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Lihat Harian
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <PaginationFooter
              currentPage={safeRekapPage}
              totalItems={rekapList.length}
              itemsPerPage={ITEMS_PER_PAGE}
              itemLabel="peserta"
              onPageChange={setRekapPage}
            />
          </>
        )}
      </div>

      {/* Modal Detail & Koreksi */}
      <AbsensiDetailModal
        item={selectedItem}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        apiBase={API_BASE}
        role={role}
        onKoreksiDone={() => loadData(true)}
      />
    </div>
  );
}
