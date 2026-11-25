"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ScanFace,
  RefreshCw,
  Download,
  Search,
  Calendar,
  CalendarDays,
  Briefcase,
  UserCheck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Users,
  Award,
  ShieldCheck,
  FilterX,
  Trash2,
  CloudRain,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import PaginationFooter from "@/components/dashboard/PaginationFooter";
import { TablePageSkeleton } from "@/components/dashboard/skeletons";
import ModernDatePickerPopover from "@/components/pendaftaran/ModernDatePickerPopover";
import {
  buildFormasiOptions,
  buildMentorOptions,
  getLogbookMentorFilterKey,
} from "@/components/logbook/LogbookFilterToolbar";
import { BULAN_OPTIONS } from "@/lib/pesertaFilter";
import { normalizeFormasiKey } from "@/lib/formasiMentor";
import { fetchFormasi, type IFormasi } from "@/services/formasiService";
import { showToast } from "@/components/ui/toastDashboard";
import { useConfirm } from "@/components/ui/ConfirmProvider";
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

interface AttendanceToleranceItem {
  _id: string;
  date: string;
  checkInLimitTime: string;
  reason: string;
  createdByName?: string;
  createdByRole?: string;
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
  const confirm = useConfirm();
  const canManageTolerance = role === "admin" || role === "superadmin";
  const showAdminFilters = role === "admin" || role === "superadmin";
  const [activeTab, setActiveTab] = useState<"harian" | "rekap">("harian");

  // Filters
  const [mentorFilter, setMentorFilter] = useState<string>("semua");
  const [formasiFilter, setFormasiFilter] = useState<string>("semua");
  const [yearFilter, setYearFilter] = useState<string>("");
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [areaFilter, setAreaFilter] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  // Option pools (diakumulasi agar pilihan tidak hilang saat filter aktif)
  const [formasiTitles, setFormasiTitles] = useState<string[]>([]);
  const [knownMentorNames, setKnownMentorNames] = useState<string[]>([]);
  const [knownPosisi, setKnownPosisi] = useState<string[]>([]);
  const [knownYears, setKnownYears] = useState<string[]>(() => [
    getTodayWibDate().slice(0, 4),
  ]);
  const [knownDates, setKnownDates] = useState<string[]>([]);

  // Data
  const [items, setItems] = useState<ManageAbsensiItem[]>([]);
  const [rekapList, setRekapList] = useState<ManageRekapPesertaItem[]>([]);

  // States
  const [loading, setLoading] = useState<boolean>(true);
  const hasLoadedOnceRef = useRef<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);

  // Pagination
  const [harianPage, setHarianPage] = useState<number>(1);
  const [rekapPage, setRekapPage] = useState<number>(1);

  // Modal
  const [selectedItem, setSelectedItem] = useState<ManageAbsensiItem | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // Toleransi Jam Masuk (Admin & Superadmin)
  const [showTolerancePanel, setShowTolerancePanel] = useState<boolean>(false);
  const [tolerances, setTolerances] = useState<AttendanceToleranceItem[]>([]);
  const [tolDate, setTolDate] = useState<string>(() => getTodayWibDate());
  const [tolLimitTime, setTolLimitTime] = useState<string>("09:00");
  const [tolReason, setTolReason] = useState<string>(
    "Dispensasi Cuaca / Hujan Deras",
  );
  const [savingTolerance, setSavingTolerance] = useState<boolean>(false);

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
  }, [
    mentorFilter,
    formasiFilter,
    yearFilter,
    monthFilter,
    dateFilter,
    areaFilter,
    debouncedSearch,
  ]);

  const loadData = useCallback(
    async (isManual = false) => {
      try {
        if (isManual) setRefreshing(true);
        else if (!hasLoadedOnceRef.current) setLoading(true);

        const token = localStorage.getItem("token");
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        let queryStartDate = "";
        let queryEndDate = "";
        if (!dateFilter && yearFilter && monthFilter) {
          const lastDay = new Date(
            Number(yearFilter),
            Number(monthFilter),
            0,
          ).getDate();
          queryStartDate = `${yearFilter}-${monthFilter}-01`;
          queryEndDate = `${yearFilter}-${monthFilter}-${String(lastDay).padStart(2, "0")}`;
        } else if (!dateFilter && yearFilter) {
          queryStartDate = `${yearFilter}-01-01`;
          queryEndDate = `${yearFilter}-12-31`;
        }

        const listParams = new URLSearchParams();
        if (dateFilter) listParams.set("date", dateFilter);
        else if (queryStartDate && queryEndDate) {
          listParams.set("startDate", queryStartDate);
          listParams.set("endDate", queryEndDate);
        }
        if (areaFilter) listParams.set("area", areaFilter);
        if (debouncedSearch) listParams.set("search", debouncedSearch);

        const rekapParams = new URLSearchParams();
        if (dateFilter) rekapParams.set("date", dateFilter);
        else if (queryStartDate && queryEndDate) {
          rekapParams.set("startDate", queryStartDate);
          rekapParams.set("endDate", queryEndDate);
        }
        if (debouncedSearch) rekapParams.set("search", debouncedSearch);

        const [listRes, rekapRes, tolRes, formasiRes] = await Promise.all([
          fetch(`${API_BASE}/absensi/manage/list?${listParams.toString()}`, { headers }),
          fetch(`${API_BASE}/absensi/manage/rekap-peserta?${rekapParams.toString()}`, { headers }),
          canManageTolerance
            ? fetch(`${API_BASE}/absensi/toleransi`, { headers }).catch(() => null)
            : Promise.resolve(null),
          showAdminFilters
            ? fetchFormasi().catch(() => [] as IFormasi[])
            : Promise.resolve([] as IFormasi[]),
        ]);

        if (!listRes.ok || !rekapRes.ok) {
          throw new Error("Gagal memuat data absensi");
        }

        const listJson = await listRes.json();
        const rekapJson = await rekapRes.json();

        const nextItems: ManageAbsensiItem[] = Array.isArray(listJson?.items)
          ? listJson.items
          : [];
        const nextRekap: ManageRekapPesertaItem[] = Array.isArray(rekapJson)
          ? rekapJson
          : [];

        setItems(nextItems);
        setRekapList(nextRekap);

        // Akumulasi pilihan filter agar opsi tetap tersedia meski sedang terfilter
        const mentorSet = new Set<string>();
        const posSet = new Set<string>();
        const yearSet = new Set<string>();
        const dateSet = new Set<string>();

        for (const it of nextItems) {
          if (it.mentorName) mentorSet.add(it.mentorName);
          if (it.posisi) posSet.add(it.posisi);
          const iso = it.date?.trim().slice(0, 10);
          if (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
            yearSet.add(iso.slice(0, 4));
            dateSet.add(iso);
          }
        }
        for (const rk of nextRekap) {
          if (rk.mentorName) mentorSet.add(rk.mentorName);
          if (rk.posisi) posSet.add(rk.posisi);
        }

        if (mentorSet.size > 0) {
          setKnownMentorNames((prev) =>
            Array.from(new Set([...prev, ...mentorSet])),
          );
        }
        if (posSet.size > 0) {
          setKnownPosisi((prev) => Array.from(new Set([...prev, ...posSet])));
        }
        if (yearSet.size > 0) {
          setKnownYears((prev) =>
            Array.from(new Set([...prev, ...yearSet])).sort((a, b) =>
              b.localeCompare(a),
            ),
          );
        }
        if (dateSet.size > 0) {
          setKnownDates((prev) => Array.from(new Set([...prev, ...dateSet])));
        }

        if (Array.isArray(formasiRes) && formasiRes.length > 0) {
          setFormasiTitles(formasiRes.map((f) => f.title).filter(Boolean));
        }

        if (tolRes && tolRes.ok) {
          const tolJson = await tolRes.json().catch(() => null);
          setTolerances(Array.isArray(tolJson?.data) ? tolJson.data : []);
        }
      } catch (err) {
        console.error("Load KelolaAbsensi error:", err);
        showToast.error("Gagal memuat data absensi kehadiran");
      } finally {
        hasLoadedOnceRef.current = true;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      yearFilter,
      monthFilter,
      dateFilter,
      areaFilter,
      debouncedSearch,
      canManageTolerance,
      showAdminFilters,
    ],
  );

  const todayTolerance = useMemo(() => {
    const todayIso = getTodayWibDate();
    return tolerances.find((t) => t.date === todayIso) || null;
  }, [tolerances]);

  const handleSaveTolerance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tolDate || !tolLimitTime) {
      showToast.error("Tanggal dan batas jam toleransi wajib diisi");
      return;
    }

    setSavingTolerance(true);
    const toastId = showToast.loading("Menyimpan toleransi jam masuk...");
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE}/absensi/toleransi`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: tolDate,
          checkInLimitTime: tolLimitTime,
          reason: tolReason.trim() || "Dispensasi Cuaca / Hujan",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || "Gagal menyimpan toleransi jam masuk");
      }
      showToast.updateSuccess(
        toastId,
        json?.message || "Toleransi jam masuk berhasil disimpan",
      );
      await loadData(true);
    } catch (err: unknown) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal menyimpan toleransi",
      );
    } finally {
      setSavingTolerance(false);
    }
  };

  const handleDeleteTolerance = (item: AttendanceToleranceItem) => {
    confirm({
      title: "Hapus Toleransi Jam Masuk",
      message: `Kembalikan batas jam masuk tanggal ${formatDateShortID(item.date)} menjadi normal (08.00 WIB)? Absensi pada tanggal ini akan dihitung ulang.`,
      confirmText: "Ya, Kembalikan 08.00",
      onConfirm: async () => {
        const toastId = showToast.loading("Menghapus toleransi...");
        try {
          const token = localStorage.getItem("token") || "";
          const res = await fetch(`${API_BASE}/absensi/toleransi/${item._id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(json?.message || "Gagal menghapus toleransi");
          }
          showToast.updateSuccess(
            toastId,
            json?.message || "Toleransi berhasil dihapus",
          );
          await loadData(true);
        } catch (err: unknown) {
          showToast.updateError(
            toastId,
            err instanceof Error ? err.message : "Gagal menghapus toleransi",
          );
        }
      },
    });
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const mentorOptions = useMemo(
    () =>
      buildMentorOptions(knownMentorNames.map((mentorName) => ({ mentorName }))),
    [knownMentorNames],
  );

  const formasiOptions = useMemo(
    () =>
      buildFormasiOptions(
        knownPosisi.map((posisi) => ({ posisi })),
        formasiTitles,
      ),
    [knownPosisi, formasiTitles],
  );

  const filteredItems = useMemo(() => {
    const monthOnly = !dateFilter && !yearFilter ? monthFilter : "";
    return items.filter((row) => {
      if (
        mentorFilter !== "semua" &&
        getLogbookMentorFilterKey(row.mentorName) !== mentorFilter
      ) {
        return false;
      }
      if (
        formasiFilter !== "semua" &&
        normalizeFormasiKey(row.posisi) !== formasiFilter
      ) {
        return false;
      }
      if (monthOnly && row.date?.slice(5, 7) !== monthOnly) {
        return false;
      }
      return true;
    });
  }, [items, mentorFilter, formasiFilter, dateFilter, yearFilter, monthFilter]);

  const filteredRekap = useMemo(() => {
    const monthOnly = !dateFilter && !yearFilter ? monthFilter : "";
    const emailsInMonth = monthOnly
      ? new Set(filteredItems.map((i) => i.email.trim().toLowerCase()))
      : null;

    return rekapList.filter((r) => {
      if (
        mentorFilter !== "semua" &&
        getLogbookMentorFilterKey(r.mentorName) !== mentorFilter
      ) {
        return false;
      }
      if (
        formasiFilter !== "semua" &&
        normalizeFormasiKey(r.posisi) !== formasiFilter
      ) {
        return false;
      }
      if (
        emailsInMonth &&
        !emailsInMonth.has((r.email || "").trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [
    rekapList,
    filteredItems,
    mentorFilter,
    formasiFilter,
    dateFilter,
    yearFilter,
    monthFilter,
  ]);

  const displaySummary = useMemo<ManageAbsensiSummary>(() => {
    if (filteredItems.length === 0) return DEFAULT_SUMMARY;
    const totalRecords = filteredItems.length;
    const tepatWaktuCount = filteredItems.filter(
      (i) => i.checkIn?.timeStatus === "on_time",
    ).length;
    const terlambatCount = filteredItems.filter(
      (i) =>
        i.checkIn?.timeStatus === "late" ||
        i.checkOut?.timeStatus === "early_no_note",
    ).length;
    const outsideBpomCount = filteredItems.filter(
      (i) => i.attendanceMode === "masuk" && i.isAnyOutside,
    ).length;
    const averageDailyScore = Math.round(
      filteredItems.reduce((sum, i) => sum + (i.dailyScore ?? 0), 0) /
        totalRecords,
    );
    return {
      totalRecords,
      tepatWaktuCount,
      terlambatCount,
      outsideBpomCount,
      averageDailyScore,
    };
  }, [filteredItems]);

  const safeHarianPage = useMemo(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(filteredItems.length / ITEMS_PER_PAGE),
    );
    return Math.min(Math.max(1, harianPage), totalPages);
  }, [filteredItems.length, harianPage]);

  const paginatedItems = useMemo(() => {
    const start = (safeHarianPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, safeHarianPage]);

  const safeRekapPage = useMemo(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(filteredRekap.length / ITEMS_PER_PAGE),
    );
    return Math.min(Math.max(1, rekapPage), totalPages);
  }, [filteredRekap.length, rekapPage]);

  const paginatedRekap = useMemo(() => {
    const start = (safeRekapPage - 1) * ITEMS_PER_PAGE;
    return filteredRekap.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRekap, safeRekapPage]);

  const handleResetFilters = () => {
    setMentorFilter("semua");
    setFormasiFilter("semua");
    setYearFilter("");
    setMonthFilter("");
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
    if (filteredItems.length === 0 && filteredRekap.length === 0) {
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

      const harianRows = filteredItems.map((row, idx) => {
        const isMissed = row.attendanceMode === "tidak_absen" || row.isVirtualMissed;
        return {
          No: idx + 1,
          Tanggal: row.date || "-",
          "Nama Peserta": row.namaPeserta || "-",
          Email: row.email || "-",
          Posisi: row.posisi || "-",
          Institusi: row.institusi || "-",
          Pembimbing: row.mentorName || "-",
          "Mode Kehadiran": isMissed
            ? "Tidak Absen (0%)"
            : row.attendanceMode === "izin"
              ? "Izin"
              : row.attendanceMode === "wfh"
                ? "WFH"
                : "Masuk (WFO)",
          "Keterangan Izin": row.izinNote || "-",
          "Jam Masuk (WIB)":
            isMissed || row.attendanceMode === "izin"
              ? "-"
              : row.checkIn?.timeWIB || "-",
          "Status Masuk": isMissed
            ? "Tidak Absen"
            : row.attendanceMode === "izin"
              ? "Izin (100%)"
              : row.checkIn?.timeStatusLabel || "Belum Check-In",
          "Selisih Masuk (Menit)": row.checkIn ? (row.checkIn.diffMinutes ?? 0) : "-",
          "Skor Masuk (%)": isMissed
            ? 0
            : row.attendanceMode === "izin"
              ? 100
              : row.checkIn
                ? (row.checkIn.score ?? 0)
                : 0,
          "Area Masuk": formatAreaLabel(row.checkIn),
          "Jam Pulang (WIB)":
            isMissed || row.attendanceMode === "izin"
              ? "-"
              : row.checkOut?.timeWIB || "-",
          "Status Pulang": isMissed
            ? "Tidak Absen"
            : row.attendanceMode === "izin"
              ? "Izin"
              : row.checkOut?.timeStatusLabel || "Belum Check-Out",
          "Selisih Pulang (Menit)": row.checkOut ? (row.checkOut.diffMinutes ?? 0) : "-",
          "Skor Pulang (%)": isMissed
            ? 0
            : row.attendanceMode === "izin"
              ? 100
              : row.checkOut
                ? (row.checkOut.score ?? 0)
                : 0,
          "Area Pulang": formatAreaLabel(row.checkOut),
          "Nilai Harian (%)": row.dailyScore ?? 0,
          "Catatan Koreksi": row.koreksiNote || "-",
          "Dikoreksi Oleh": row.koreksiBy?.name
            ? `${row.koreksiBy.name} (${row.koreksiBy.role || "-"})`
            : "-",
        };
      });

      const rekapRows = filteredRekap.map((r, idx) => ({
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
        <div className="space-y-1 min-w-0 flex-1">
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
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
            {pageSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
          {canManageTolerance && (
            <button
              type="button"
              onClick={() => setShowTolerancePanel((prev) => !prev)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap transition ${
                todayTolerance
                  ? "border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100 dark:border-sky-700 dark:bg-sky-950/60 dark:text-sky-200"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <CloudRain className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>
                {todayTolerance
                  ? `Toleransi Hari Ini: s.d. ${todayTolerance.checkInLimitTime.replace(":", ".")} WIB`
                  : "Toleransi Jam Masuk"}
              </span>
              {showTolerancePanel ? (
                <ChevronUp className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 shrink-0" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold whitespace-nowrap transition disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 shrink-0 ${refreshing ? "animate-spin" : ""}`} />
            Muat Ulang
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm whitespace-nowrap transition disabled:opacity-60"
          >
            <Download className="w-4 h-4 shrink-0" />
            {exporting ? "Mengekspor..." : "Export Excel (.xlsx)"}
          </button>
        </div>
      </div>

      {/* Panel Toleransi Jam Masuk Harian (Admin & Superadmin) */}
      {canManageTolerance && showTolerancePanel && (
        <div className="rounded-2xl border border-sky-200/90 dark:border-sky-800/70 bg-sky-50/40 dark:bg-slate-900 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0">
                <CloudRain className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Dispensasi / Toleransi Jam Masuk Harian
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Perpanjang batas jam tepat waktu masuk (default 08.00 WIB) saat kondisi hujan deras atau kendala massal. Absensi di tanggal tersebut otomatis dihitung ulang ke 100% jika tiba sebelum batas toleransi.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSaveTolerance}
            className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
          >
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Tanggal
              </label>
              <input
                type="date"
                value={tolDate}
                onChange={(e) => setTolDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Batas Tepat Waktu (WIB)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="time"
                  min="08:05"
                  max="22:59"
                  value={tolLimitTime}
                  onChange={(e) => setTolLimitTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {["08:30", "09:00", "09:30"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTolLimitTime(preset)}
                    className={`px-2 py-2 rounded-lg text-[11px] font-bold border transition shrink-0 ${
                      tolLimitTime === preset
                        ? "bg-sky-600 text-white border-sky-600"
                        : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Keterangan / Alasan Dispensasi
              </label>
              <input
                type="text"
                value={tolReason}
                onChange={(e) => setTolReason(e.target.value)}
                placeholder="Contoh: Hujan deras di kota Palembang"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={savingTolerance}
                className="w-full px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-bold shadow-xs transition disabled:opacity-60"
              >
                {savingTolerance ? "Menyimpan..." : "Aktifkan"}
              </button>
            </div>
          </form>

          {tolerances.length > 0 && (
            <div className="pt-2 border-t border-sky-200/70 dark:border-slate-800 space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Riwayat Toleransi Jam Masuk ({tolerances.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {tolerances.slice(0, 12).map((t) => (
                  <div
                    key={t._id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatDateShortID(t.date)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold">
                      s.d. {t.checkInLimitTime.replace(":", ".")} WIB
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 max-w-44 truncate">
                      ({t.reason})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteTolerance(t)}
                      title="Hapus toleransi & kembalikan ke 08.00 WIB"
                      className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
              {displaySummary.totalRecords}
            </span>
            <span className="text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-full">
              Rata-rata: {displaySummary.averageDailyScore}%
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
              {displaySummary.tepatWaktuCount}
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
              {displaySummary.terlambatCount}
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
              {displaySummary.outsideBpomCount}
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
              Daftar Absensi Harian ({filteredItems.length})
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
              Rekap Nilai Peserta ({filteredRekap.length})
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 sm:px-6 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
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
              {activeTab === "harian" && (
                <select
                  aria-label="Filter status dan area absensi"
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">Semua Status &amp; Area</option>
                  <option value="inside">Di Area BBPOM</option>
                  <option value="outside">Masuk • Di Luar Area BBPOM</option>
                  <option value="wfh">Mode WFH</option>
                  <option value="izin">Status Izin</option>
                  <option value="missed">Tidak Absen (0%)</option>
                </select>
              )}

              {(mentorFilter !== "semua" ||
                formasiFilter !== "semua" ||
                yearFilter ||
                monthFilter ||
                dateFilter ||
                areaFilter ||
                searchInput) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <FilterX className="w-3.5 h-3.5" />
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-2">
            {showAdminFilters && (
              <>
                {/* Filter Mentor */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <UserCheck className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                  <select
                    aria-label="Filter absensi per mentor"
                    value={mentorFilter}
                    onChange={(e) => setMentorFilter(e.target.value)}
                    className="bg-transparent pr-1 focus:outline-none cursor-pointer max-w-[175px]"
                  >
                    <option value="semua" className="dark:bg-slate-950">
                      Semua Mentor
                    </option>
                    {mentorOptions.map((m) => (
                      <option
                        key={m.value}
                        value={m.value}
                        className="dark:bg-slate-950"
                      >
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter Formasi */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <Briefcase className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                  <select
                    aria-label="Filter absensi per formasi"
                    value={formasiFilter}
                    onChange={(e) => setFormasiFilter(e.target.value)}
                    className="bg-transparent pr-1 focus:outline-none cursor-pointer max-w-[190px]"
                  >
                    <option value="semua" className="dark:bg-slate-950">
                      Semua Formasi
                    </option>
                    {formasiOptions.map((f) => (
                      <option
                        key={f.value}
                        value={f.value}
                        className="dark:bg-slate-950"
                      >
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Per Tahun */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <Calendar className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
              <select
                aria-label="Filter absensi per tahun"
                value={yearFilter}
                onChange={(e) => {
                  const nextYear = e.target.value;
                  setYearFilter(nextYear);
                  if (dateFilter && nextYear && dateFilter.slice(0, 4) !== nextYear) {
                    setDateFilter("");
                  }
                }}
                className="bg-transparent pr-1 focus:outline-none cursor-pointer"
              >
                <option value="" className="dark:bg-slate-950">
                  Semua Tahun
                </option>
                {knownYears.map((yr) => (
                  <option key={yr} value={yr} className="dark:bg-slate-950">
                    Tahun {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Per Bulan */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <CalendarDays className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
              <select
                aria-label="Filter absensi per bulan"
                value={monthFilter}
                onChange={(e) => {
                  const nextMonth = e.target.value;
                  setMonthFilter(nextMonth);
                  if (dateFilter && nextMonth && dateFilter.slice(5, 7) !== nextMonth) {
                    setDateFilter("");
                  }
                }}
                className="bg-transparent pr-1 focus:outline-none cursor-pointer"
              >
                <option value="" className="dark:bg-slate-950">
                  Semua Bulan
                </option>
                {BULAN_OPTIONS.map((m) => {
                  const val = String(m.value).padStart(2, "0");
                  return (
                    <option key={val} value={val} className="dark:bg-slate-950">
                      {m.label}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Per Tanggal (Kalender Popover) */}
            <ModernDatePickerPopover
              value={dateFilter}
              defaultYear={yearFilter}
              defaultMonth={monthFilter}
              highlightedDates={knownDates}
              placeholder="Pilih Tanggal"
              ariaLabel="Filter absensi per tanggal"
              onChange={(nextDate) => {
                setDateFilter(nextDate);
                if (nextDate) {
                  setYearFilter(nextDate.slice(0, 4));
                  setMonthFilter(nextDate.slice(5, 7));
                }
              }}
            />
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
                                {row.attendanceMode === "tidak_absen" && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                                    Tidak Absen
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

                        {row.attendanceMode === "tidak_absen" ? (
                          <td colSpan={2} className="py-3.5 px-4 max-w-[300px]">
                            <div className="rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/60 px-3 py-2 space-y-0.5">
                              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 block">
                                Tidak Melakukan Absen Masuk &amp; Pulang
                              </span>
                              <p className="text-[11px] text-rose-600/90 dark:text-rose-400">
                                Peserta tidak Check-In, Check-Out, maupun Izin pada hari kerja ini.
                              </p>
                            </div>
                          </td>
                        ) : row.attendanceMode === "izin" ? (
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
                          {row.attendanceMode === "tidak_absen" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 text-[11px] font-semibold">
                              Tidak Absen
                            </span>
                          ) : row.attendanceMode === "izin" ? (
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
                          {row.attendanceMode === "tidak_absen" || row.isVirtualMissed ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              Tanpa Record
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(row)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/50 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-semibold transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {role === "mentor" ? "Detail & Koreksi" : "Detail"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <PaginationFooter
              currentPage={safeHarianPage}
              totalItems={filteredItems.length}
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
                            <div className="inline-flex flex-col items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setSearchInput(r.email);
                                  setDebouncedSearch(r.email);
                                  setAreaFilter("missed");
                                  setActiveTab("harian");
                                }}
                                title="Klik untuk melihat tanggal tidak absen"
                                className="inline-block px-2.5 py-0.5 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 font-bold transition"
                              >
                                {r.tidakAbsen} hari
                              </button>
                              {Array.isArray(r.missedDates) &&
                                r.missedDates.length > 0 && (
                                  <span className="text-[10px] text-rose-600/90 dark:text-rose-400 max-w-[150px] truncate">
                                    {r.missedDates
                                      .slice(0, 2)
                                      .map(formatDateShortID)
                                      .join(", ")}
                                    {r.missedDates.length > 2
                                      ? ` +${r.missedDates.length - 2}`
                                      : ""}
                                  </span>
                                )}
                            </div>
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
              totalItems={filteredRekap.length}
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
