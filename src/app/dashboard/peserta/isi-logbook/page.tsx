"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
  Edit3,
  FileText,
  Check,
  X,
  ScanFace,
  Lock,
} from "lucide-react";
import InlineLogbookForm from "@/components/logbook/InlineLogbookForm";
import { showToast } from "@/components/ui/toastDashboard";

/* ================= TYPES ================= */

type FilledDateType = {
  _id: string;
  status: "hadir" | "tidak_hadir_keterangan" | "tidak_hadir_tanpa_keterangan";
  approvalStatus: "menunggu" | "disetujui" | "ditolak" | "revisi";
};

type LogbookDetail = {
  _id: string;
  date: string;
  status: "hadir" | "tidak_hadir_keterangan" | "tidak_hadir_tanpa_keterangan";
  judul?: string;
  pengalaman?: string;
  kendala?: string;
  keterangan?: string;
  files?: string[];
  pdfFile?: string;
  approvalStatus: "menunggu" | "disetujui" | "ditolak" | "revisi";
  mentorNote?: string;
  revisionNote?: string;
  approvedAt?: string;
};

type PeriodItem = {
  index: number;
  start: Date;
  end: Date;
  label: string;
};

type TodayAbsensiStatus = {
  attendanceMode?: "masuk" | "wfh" | "izin";
  izinNote?: string;
  checkIn?: { timeWIB?: string } | null;
} | null;

/* ================= HELPERS ================= */

function getNowWIB(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
  );
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatShortDateID(d: Date): string {
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatLongDateID(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function generatePeriods(mulaiStr?: string, selesaiStr?: string): PeriodItem[] {
  const now = getNowWIB();

  if (mulaiStr && selesaiStr) {
    const startRaw = new Date(mulaiStr);
    const endRaw = new Date(selesaiStr);

    if (!isNaN(startRaw.getTime()) && !isNaN(endRaw.getTime()) && endRaw >= startRaw) {
      const periods: PeriodItem[] = [];
      let curStart = new Date(
        startRaw.getFullYear(),
        startRaw.getMonth(),
        startRaw.getDate(),
      );
      const finalEnd = new Date(
        endRaw.getFullYear(),
        endRaw.getMonth(),
        endRaw.getDate(),
      );

      let idx = 1;
      while (curStart <= finalEnd && idx <= 24) {
        // Next period starts 1 month later, so current period ends 1 day before that
        const nextMonthSameDay = new Date(
          curStart.getFullYear(),
          curStart.getMonth() + 1,
          curStart.getDate(),
        );
        const curEnd = new Date(nextMonthSameDay.getTime() - 24 * 60 * 60 * 1000);
        const actualEnd = curEnd > finalEnd ? finalEnd : curEnd;

        periods.push({
          index: idx,
          start: new Date(curStart),
          end: new Date(actualEnd),
          label: `${formatShortDateID(curStart)} - ${formatShortDateID(actualEnd)}`,
        });

        curStart = nextMonthSameDay;
        idx++;
      }

      if (periods.length > 0) return periods;
    }
  }

  // Fallback: generate 6 monthly periods around current month
  const fallback: PeriodItem[] = [];
  for (let i = -3; i <= 2; i++) {
    const s = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const e = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);
    fallback.push({
      index: i + 4,
      start: s,
      end: e,
      label: `${formatShortDateID(s)} - ${formatShortDateID(e)}`,
    });
  }
  return fallback;
}

export default function IsiLogbookPage() {
  const [filledDates, setFilledDates] = useState<
    Record<string, FilledDateType>
  >({});
  const [totalLogbooks, setTotalLogbooks] = useState(0);
  const [mulaiMagang, setMulaiMagang] = useState<string | undefined>();
  const [selesaiMagang, setSelesaiMagang] = useState<string | undefined>();
  const [periodIdx, setPeriodIdx] = useState(0);

  // Selected date & inline detail state
  const [selectedDate, setSelectedDate] = useState<string | null>(() =>
    toIsoDate(getNowWIB()),
  );
  const [detailData, setDetailData] = useState<LogbookDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isEditingRevisi, setIsEditingRevisi] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [todayAbsensi, setTodayAbsensi] = useState<TodayAbsensiStatus>(null);

  const todayWIB = useMemo(() => getNowWIB(), []);
  const todayIso = useMemo(() => toIsoDate(todayWIB), [todayWIB]);

  const { mulaiIso, selesaiIso } = useMemo(() => {
    const parseIso = (rawStr?: string) => {
      if (!rawStr) return undefined;
      const d = new Date(rawStr);
      if (isNaN(d.getTime())) return undefined;
      return toIsoDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    };
    return {
      mulaiIso: parseIso(mulaiMagang),
      selesaiIso: parseIso(selesaiMagang),
    };
  }, [mulaiMagang, selesaiMagang]);

  const isTodayInPeriod = useMemo(() => {
    if (mulaiIso && todayIso < mulaiIso) return false;
    if (selesaiIso && todayIso > selesaiIso) return false;
    return true;
  }, [todayIso, mulaiIso, selesaiIso]);

  const refreshAll = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      let email = "";
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        email = payload.email || "";
      } catch {
        // ignore
      }

      const [datesRes, summaryRes, pendRes, absenTodayRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/logbook/filled-dates`, {
          headers,
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/logbook/summary`, {
          headers,
        }),
        email
          ? fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/pendaftaran/cek?email=${encodeURIComponent(email)}`,
              { headers },
            ).catch(() => null)
          : Promise.resolve(null),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/absensi/today`, {
          headers,
        }).catch(() => null),
      ]);

      if (datesRes.ok) {
        const datesJson = await datesRes.json();
        setFilledDates(datesJson || {});
      }
      if (summaryRes.ok) {
        const summaryJson = await summaryRes.json();
        setTotalLogbooks(summaryJson?.total || 0);
      }
      if (pendRes && pendRes.ok) {
        const pendJson = await pendRes.json();
        const found = pendJson?.peserta?.find(
          (p: any) => p.email?.toLowerCase() === email.toLowerCase(),
        );
        if (found) {
          setMulaiMagang(found.tanggalMulaiMagang);
          setSelesaiMagang(found.tanggalSelesaiMagang);
        }
      }
      if (absenTodayRes && absenTodayRes.ok) {
        const absenJson = await absenTodayRes.json();
        setTodayAbsensi(absenJson?.absensi || null);
      }
    } catch (err) {
      console.error("Gagal memuat riwayat kehadiran:", err);
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Clamp initial selectedDate into internship period & auto-scroll if ?isi=1
  useEffect(() => {
    if (loadingInitial) return;

    if (!isTodayInPeriod) {
      if (selesaiIso && todayIso > selesaiIso) {
        setSelectedDate(selesaiIso);
      } else if (mulaiIso && todayIso < mulaiIso) {
        setSelectedDate(mulaiIso);
      }
      return;
    }

    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("isi") === "1") {
      setSelectedDate(todayIso);
      const timer = setTimeout(() => {
        const el =
          document.getElementById("form-kehadiran") ||
          document.getElementById("detail-kehadiran-section");
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [loadingInitial, todayIso, isTodayInPeriod, mulaiIso, selesaiIso]);

  // Compute periods from internship dates
  const periods = useMemo(
    () => generatePeriods(mulaiMagang, selesaiMagang),
    [mulaiMagang, selesaiMagang],
  );

  // Set default active period containing today
  useEffect(() => {
    if (periods.length === 0) return;
    const nowTime = todayWIB.getTime();
    const foundIdx = periods.findIndex(
      (p) =>
        nowTime >= p.start.getTime() &&
        nowTime <= p.end.getTime() + 24 * 60 * 60 * 1000,
    );
    if (foundIdx !== -1) {
      setPeriodIdx(foundIdx);
    } else if (nowTime > periods[periods.length - 1].end.getTime()) {
      setPeriodIdx(periods.length - 1);
    } else {
      setPeriodIdx(0);
    }
  }, [periods, todayWIB]);

  const activePeriod = periods[periodIdx] || periods[0];

  // Fetch inline detail when a filled date is selected
  const fetchDateDetail = useCallback(async (isoDate: string) => {
    setLoadingDetail(true);
    setDetailData(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/logbook/date/${isoDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setDetailData(data);
      }
    } catch (err) {
      console.error("Gagal memuat detail logbook:", err);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedDate) {
      setDetailData(null);
      return;
    }
    if (filledDates[selectedDate]) {
      fetchDateDetail(selectedDate);
    } else {
      setDetailData(null);
    }
  }, [selectedDate, filledDates, fetchDateDetail]);

  // Build calendar cells & week rows for activePeriod
  const calendarWeeks = useMemo(() => {
    if (!activePeriod) return [];
    const cells: (Date | null)[] = [];
    const startDayOfWeek = (activePeriod.start.getDay() + 6) % 7; // Mon=0 .. Sun=6
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push(null);
    }

    const cur = new Date(activePeriod.start);
    while (cur <= activePeriod.end) {
      cells.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
  }, [activePeriod]);

  // Download all logbook PDF
  const handleDownloadAll = async () => {
    if (totalLogbooks === 0) {
      showToast.error("Belum ada logbook untuk diunduh");
      return;
    }

    setIsDownloading(true);
    const toastId = showToast.loading("Menyiapkan PDF logbook...");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/logbook/download/pdf`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        throw new Error("Gagal mengunduh logbook");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `logbook-${todayIso}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showToast.updateSuccess(toastId, "PDF logbook berhasil diunduh! ✅");
    } catch (error: any) {
      showToast.updateError(
        toastId,
        error.message || "Gagal mengunduh logbook",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const getImageUrl = (url: string) => {
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const cleanBase = baseUrl.replace(/\/api$/, "");
    const cleanUrl = url.startsWith("/") ? url : `/${url}`;
    return `${cleanBase}${cleanUrl}`;
  };

  // Symbol renderer for calendar cell & legend
  const renderSymbol = (
    isoDate: string,
    dateObj: Date,
  ): { symbol: React.ReactNode; type: string } => {
    const log = filledDates[isoDate];
    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

    if (log) {
      if (log.approvalStatus === "ditolak") {
        return {
          symbol: (
            <X
              className="w-3.5 h-3.5 text-red-600 shrink-0"
              strokeWidth={3.5}
            />
          ),
          type: "ditolak",
        };
      }
      if (log.approvalStatus === "revisi") {
        return {
          symbol: (
            <svg
              viewBox="0 0 12 10"
              className="w-2.5 h-2.5 shrink-0"
              style={{ fill: "#B45309" }}
            >
              <polygon points="6,0 12,10 0,10" />
            </svg>
          ),
          type: "revisi",
        };
      }
      if (log.approvalStatus === "menunggu") {
        return {
          symbol: (
            <span
              className="inline-block w-2.5 h-2.5 rotate-45 bg-[#1D64F2] dark:bg-blue-400"
              style={{ borderRadius: "1.5px" }}
            />
          ),
          type: "menunggu",
        };
      }
      if (log.approvalStatus === "disetujui") {
        if (log.status === "hadir") {
          return {
            symbol: (
              <Check
                className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                strokeWidth={3}
              />
            ),
            type: "hadir_disetujui",
          };
        }
        if (log.status === "tidak_hadir_keterangan") {
          return {
            symbol: (
              <span
                className="inline-block w-3 rounded-full bg-emerald-600 dark:bg-emerald-400"
                style={{ height: "2.5px" }}
              />
            ),
            type: "izin_disetujui",
          };
        }
        return {
          symbol: (
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-600" />
          ),
          type: "tidak_hadir",
        };
      }
    }

    if (isWeekend) {
      return {
        symbol: (
          <span
            className="inline-block w-2.5 h-2.5 bg-slate-800 dark:bg-slate-300"
            style={{ borderRadius: "2px" }}
          />
        ),
        type: "libur",
      };
    }

    return {
      symbol: (
        <span
          className="inline-block w-2.5 h-2.5 rounded-full border border-slate-400 dark:border-slate-500"
          style={{ borderWidth: "1.5px" }}
        />
      ),
      type: "belum_diisi",
    };
  };

  // Status badge helper for the selected date card
  const getDetailBadge = (log?: FilledDateType | LogbookDetail | null) => {
    if (!log) {
      return {
        label: "Belum Diisi",
        className:
          "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600",
      };
    }
    if (log.approvalStatus === "menunggu") {
      return {
        label: "Menunggu Persetujuan",
        className:
          "bg-blue-50 text-[#1D64F2] border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
      };
    }
    if (log.approvalStatus === "disetujui") {
      if (log.status === "tidak_hadir_keterangan") {
        return {
          label: "Izin disetujui",
          className:
            "bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800",
        };
      }
      return {
        label: "Hadir disetujui",
        className:
          "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
      };
    }
    if (log.approvalStatus === "revisi") {
      return {
        label: "Perlu Tindakan Anda",
        className:
          "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
      };
    }
    return {
      label: "Kehadiran Ditolak",
      className:
        "bg-red-50 text-red-600 border-red-200/80 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800",
    };
  };

  const selectedLogSummary = selectedDate ? filledDates[selectedDate] : null;
  const selectedDateObj = useMemo(() => {
    if (!selectedDate) return null;
    const [y, m, d] = selectedDate.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDate]);
  const isSelectedWeekend = selectedDateObj
    ? selectedDateObj.getDay() === 0 || selectedDateObj.getDay() === 6
    : false;
  const isSelectedToday = selectedDate === todayIso;
  const isSelectedInPeriod = useMemo(() => {
    if (!selectedDate) return false;
    if (mulaiIso && selectedDate < mulaiIso) return false;
    if (selesaiIso && selectedDate > selesaiIso) return false;
    return true;
  }, [selectedDate, mulaiIso, selesaiIso]);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ================= 1. HEADER ================= */}
      <div className="flex items-start justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Logbook Peserta
          </h1>
          <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
            Lihat catatan kehadiran dan laporan harian Anda.
          </p>
        </div>

        {totalLogbooks > 0 && (
          <button
            type="button"
            onClick={handleDownloadAll}
            disabled={isDownloading}
            title="Unduh semua logbook (PDF)"
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition shrink-0 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1D64F2]" />
            <span>{isDownloading ? "Unduh..." : "PDF"}</span>
          </button>
        )}
      </div>

      {/* ================= 2. PERIOD SELECTOR ================= */}
      {activePeriod && (
        <div className="rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-3 sm:p-4 flex items-center justify-between shadow-2xs">
          <button
            type="button"
            disabled={periodIdx <= 0}
            onClick={() => setPeriodIdx((i) => Math.max(0, i - 1))}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-35 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
          </button>

          <div className="text-center">
            <p
              className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight"
              style={{ fontWeight: 800 }}
            >
              Periode {activePeriod.index}
            </p>
            <p
              className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-0.5"
              style={{ fontWeight: 600 }}
            >
              {activePeriod.label}
            </p>
          </div>

          <button
            type="button"
            disabled={periodIdx >= periods.length - 1}
            onClick={() =>
              setPeriodIdx((i) => Math.min(periods.length - 1, i + 1))
            }
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-35 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* ================= 3. CALENDAR GRID & LEGEND ================= */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-5 shadow-2xs space-y-4">
        {/* Inner Bordered Calendar Table */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
          {/* Days of week header */}
          <div
            className="grid grid-cols-7 bg-white dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 py-3 sm:py-3.5 text-center text-sm font-bold text-slate-600 dark:text-slate-300"
            style={{ fontWeight: 700 }}
          >
            {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Week rows */}
          <div>
            {calendarWeeks.map((week, weekIdx) => (
              <div
                key={`week-${weekIdx}`}
                className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700/80 last:border-b-0"
              >
                {week.map((dateObj, colIdx) => {
                  if (!dateObj) {
                    return (
                      <div
                        key={`empty-${weekIdx}-${colIdx}`}
                        className="h-14 sm:h-16 bg-white dark:bg-slate-900"
                      />
                    );
                  }

                  const iso = toIsoDate(dateObj);
                  const isSelected = selectedDate === iso;
                  const isToday = iso === todayIso;
                  const isWeekend = colIdx >= 5;
                  const { symbol } = renderSymbol(iso, dateObj);

                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => {
                        setSelectedDate(iso);
                        setIsEditingRevisi(false);
                      }}
                      className={`h-14 sm:h-16 flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                        isWeekend
                          ? "bg-slate-100/90 hover:bg-slate-200/70 dark:bg-slate-800/90 dark:hover:bg-slate-700/80"
                          : "bg-slate-50/90 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-sm flex items-center justify-center transition ${
                          isSelected
                            ? "border-2 border-[#1D64F2] bg-blue-100/80 text-slate-800 dark:border-blue-400 dark:bg-blue-950/70 dark:text-white font-bold"
                            : isToday
                              ? "ring-1 ring-[#1D64F2]/60 text-[#1D64F2] dark:text-blue-400 font-bold"
                              : isWeekend
                                ? "text-slate-400 dark:text-slate-400 font-semibold"
                                : "text-slate-600 dark:text-slate-200 font-semibold"
                        }`}
                        style={{
                          fontWeight: isSelected || isToday ? 700 : 600,
                        }}
                      >
                        {dateObj.getDate()}
                      </span>
                      <div className="h-3.5 sm:h-4 flex items-center justify-center">
                        {symbol}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div
          className="pt-2 flex flex-wrap items-center text-sm font-bold text-slate-800 dark:text-slate-200"
          style={{ columnGap: "24px", rowGap: "12px", fontWeight: 700 }}
        >
          <div
            className="inline-flex items-center"
            style={{ columnGap: "8px" }}
          >
            <Check
              className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0"
              strokeWidth={3}
            />
            <span>Hadir disetujui</span>
          </div>
          <div
            className="inline-flex items-center"
            style={{ columnGap: "8px" }}
          >
            <span
              className="inline-block w-3.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0"
              style={{ height: "2.5px" }}
            />
            <span>Izin disetujui</span>
          </div>
          <div
            className="inline-flex items-center"
            style={{ columnGap: "8px" }}
          >
            <span className="inline-block w-3 h-3 rounded-full bg-red-600 shrink-0" />
            <span>Tidak Hadir</span>
          </div>
          <div
            className="inline-flex items-center"
            style={{ columnGap: "8px" }}
          >
            <X
              className="w-3.5 h-3.5 text-red-600 shrink-0"
              strokeWidth={3.5}
            />
            <span>Kehadiran Ditolak</span>
          </div>
          <div
            className="inline-flex items-center"
            style={{ columnGap: "8px" }}
          >
            <svg
              viewBox="0 0 12 10"
              className="w-3 h-2.5 shrink-0"
              style={{ fill: "#B45309" }}
            >
              <polygon points="6,0 12,10 0,10" />
            </svg>
            <span>Perlu Tindakan Anda</span>
          </div>
          <div
            className="inline-flex items-center"
            style={{ columnGap: "8px" }}
          >
            <span
              className="inline-block w-2.5 h-2.5 rotate-45 bg-[#1D64F2] dark:bg-blue-400 shrink-0"
              style={{ borderRadius: "1.5px" }}
            />
            <span>Menunggu Tindakan Mentor</span>
          </div>
          <div
            className="inline-flex items-center"
            style={{ columnGap: "8px" }}
          >
            <span
              className="inline-block w-2.5 h-2.5 rounded-full border border-slate-500 dark:border-slate-400 shrink-0"
              style={{ borderWidth: "1.75px" }}
            />
            <span>Belum Diisi</span>
          </div>
          <div
            className="inline-flex items-center"
            style={{ columnGap: "8px" }}
          >
            <span
              className="inline-block w-2.5 h-2.5 bg-slate-800 dark:bg-slate-300 shrink-0"
              style={{ borderRadius: "2px" }}
            />
            <span>Hari Libur</span>
          </div>
        </div>
      </div>

      {/* ================= 4. SELECTED DATE DETAIL / INLINE FORM CARD ================= */}
      {selectedDate && (
        <div
          id="detail-kehadiran-section"
          className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-6 shadow-2xs space-y-4 sm:space-y-5 overflow-hidden"
        >
          {loadingInitial || loadingDetail ? (
            <div className="py-8 text-center text-sm text-slate-400">
              Memuat catatan kehadiran...
            </div>
          ) : selectedLogSummary && detailData ? (
            isEditingRevisi && detailData.approvalStatus === "revisi" ? (
              <InlineLogbookForm
                date={selectedDate}
                mode="edit"
                initialData={detailData}
                formattedDateLabel={formatLongDateID(selectedDate)}
                onCancel={() => setIsEditingRevisi(false)}
                onSuccess={() => {
                  setIsEditingRevisi(false);
                  refreshAll();
                  fetchDateDetail(selectedDate);
                }}
              />
            ) : (
            <>
              {/* Date & Status Badge */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-700/70">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {formatLongDateID(selectedDate)}
                </h2>
                <span
                  className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold border ${
                    getDetailBadge(detailData).className
                  }`}
                >
                  {getDetailBadge(detailData).label}
                </span>
              </div>

              {/* Catatan Mentor Alert Box (Shown when disetujui, revisi, ditolak, or note exists) */}
              {(detailData.mentorNote ||
                detailData.revisionNote ||
                detailData.approvalStatus === "disetujui") && (
                <div className="rounded-xl bg-[#FFFBEB] dark:bg-amber-950/40 border border-[#FDE68A] dark:border-amber-800/70 p-3.5 sm:p-4 space-y-1 overflow-hidden">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-amber-900 dark:text-amber-200">
                    <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
                    <span>Catatan Mentor</span>
                  </div>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100 pl-5 sm:pl-6 break-words [overflow-wrap:anywhere]">
                    {detailData.revisionNote ||
                      detailData.mentorNote ||
                      "Baik, terima kasih"}
                  </p>
                  <p className="text-xs text-amber-700/85 dark:text-amber-300/80 pl-5 sm:pl-6">
                    {detailData.approvalStatus === "revisi"
                      ? "Laporan Anda memerlukan perbaikan sesuai catatan di atas."
                      : detailData.approvalStatus === "ditolak"
                        ? "Kehadiran Anda ditolak oleh Mentor."
                        : "Kehadiran Anda tidak ditolak dan tidak perlu diubah."}
                  </p>
                </div>
              )}

              {/* Detail Fields */}
              <div className="divide-y divide-slate-100 dark:divide-slate-700/70">
                {/* Kehadiran */}
                <div className="py-3 sm:py-3.5 first:pt-0">
                  <p className="text-xs text-slate-400">Kehadiran</p>
                  <p className="text-base font-medium text-slate-900 dark:text-white mt-0.5">
                    {detailData.status === "hadir"
                      ? "Hadir"
                      : detailData.status === "tidak_hadir_keterangan"
                        ? "Izin / Sakit (Dengan Keterangan)"
                        : "Tidak Hadir (Tanpa Keterangan)"}
                  </p>
                </div>

                {detailData.status === "hadir" ? (
                  <>
                    {/* Uraian Aktivitas */}
                    <div className="py-3 sm:py-3.5 min-w-0">
                      <p className="text-xs text-slate-400">
                        Uraian Aktivitas
                      </p>
                      <p className="text-base text-slate-800 dark:text-slate-200 leading-relaxed mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere]">
                        {detailData.judul || "-"}
                      </p>
                    </div>

                    {/* Pembelajaran yang Diperoleh */}
                    <div className="py-3 sm:py-3.5 min-w-0">
                      <p className="text-xs text-slate-400">
                        Pembelajaran yang Diperoleh
                      </p>
                      <p className="text-base text-slate-800 dark:text-slate-200 leading-relaxed mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere]">
                        {detailData.pengalaman || "-"}
                      </p>
                    </div>

                    {/* Kendala yang Dialami */}
                    <div className="py-3 sm:py-3.5 last:pb-0 min-w-0">
                      <p className="text-xs text-slate-400">
                        Kendala yang Dialami
                      </p>
                      <p className="text-base text-slate-800 dark:text-slate-200 leading-relaxed mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere]">
                        {detailData.kendala || "-"}
                      </p>
                    </div>
                  </>
                ) : detailData.status === "tidak_hadir_keterangan" ? (
                  <div className="py-3 sm:py-3.5 last:pb-0 min-w-0">
                    <p className="text-xs text-slate-400">
                      Keterangan Ketidakhadiran
                    </p>
                    <p className="text-base text-slate-800 dark:text-slate-200 leading-relaxed mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere]">
                      {detailData.keterangan || "-"}
                    </p>
                  </div>
                ) : null}

                {/* Dokumentasi Foto (Jika Ada) */}
                {Array.isArray(detailData.files) &&
                  detailData.files.length > 0 && (
                    <div className="py-3 last:pb-0 space-y-2">
                      <p className="text-xs text-slate-400">
                        Dokumentasi Kegiatan
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {detailData.files.map((f, i) => {
                          const imgUrl = getImageUrl(f);
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setPreviewImage(imgUrl)}
                              className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 h-20 bg-slate-100"
                            >
                              <img
                                src={imgUrl}
                                alt={`Dokumentasi ${i + 1}`}
                                className="w-full h-full object-cover hover:scale-105 transition"
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* Lampiran PDF Surat Izin (Jika Ada) */}
                {detailData.pdfFile && (
                  <div className="py-3 last:pb-0 space-y-1.5">
                    <p className="text-xs text-slate-400">
                      Surat Keterangan (PDF)
                    </p>
                    <a
                      href={getImageUrl(detailData.pdfFile)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D64F2] hover:underline"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Lihat Lampiran PDF</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Action Button if Revisi */}
              {detailData.approvalStatus === "revisi" && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingRevisi(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Perbaiki Laporan Harian</span>
                  </button>
                </div>
              )}
            </>
            )
          ) : isSelectedToday && isSelectedInPeriod && !isSelectedWeekend ? (
            Boolean(todayAbsensi?.checkIn) || todayAbsensi?.attendanceMode === "izin" ? (
              <div className="space-y-4">
                {todayAbsensi?.attendanceMode === "izin" && !todayAbsensi?.checkIn && (
                  <div className="rounded-xl bg-violet-50/80 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/70 p-3.5 text-sm text-violet-900 dark:text-violet-200">
                    <b>Status Absensi Hari Ini: Izin.</b> Silakan pilih kategori <b>Izin / Sakit (Dengan Keterangan)</b> jika ingin melengkapi catatan di riwayat logbook.
                  </div>
                )}
                <InlineLogbookForm
                  date={selectedDate}
                  mode="create"
                  formattedDateLabel={formatLongDateID(selectedDate)}
                  onSuccess={() => {
                    refreshAll();
                    fetchDateDetail(selectedDate);
                  }}
                />
              </div>
            ) : (
              <div id="form-kehadiran" className="py-6 sm:py-8 px-3 text-center space-y-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Lakukan Check-In Absensi Terlebih Dahulu
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    Pengisian logbook harian pada <b>{formatLongDateID(selectedDate)}</b> hanya dibuka setelah Anda melakukan Absen Pagi (Check-In) atau mengajukan keterangan Izin pada hari ini.
                  </p>
                </div>
                <div className="pt-1">
                  <Link
                    href="/dashboard/peserta/absen"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 rounded-xl bg-[#1D64F2] hover:bg-blue-700 text-white text-sm font-bold shadow-xs transition"
                  >
                    <ScanFace className="w-4 h-4" />
                    <span>Ke Halaman Absensi (Check-In)</span>
                  </Link>
                </div>
              </div>
            )
          ) : (
            /* Other unfilled date, weekend/holiday, or outside internship period */
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/70">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {formatLongDateID(selectedDate)}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {!isSelectedInPeriod
                    ? "Di Luar Masa Magang"
                    : isSelectedWeekend
                      ? "Hari Libur"
                      : "Belum Diisi"}
                </span>
              </div>

              {!isSelectedInPeriod ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tanggal ini berada di luar periode magang Anda. Pengisian
                  laporan harian baru tidak tersedia.
                </p>
              ) : isSelectedWeekend ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tanggal ini merupakan jadwal hari libur. Laporan harian dan
                  kehadiran tidak perlu diisi.
                </p>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tidak ada catatan kehadiran atau laporan harian pada tanggal
                  ini. Pengisian logbook baru hanya dapat dilakukan pada hari
                  yang bersangkutan selama periode magang aktif.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= IMAGE PREVIEW MODAL ================= */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <div className="relative max-w-lg w-full">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Preview Dokumentasi"
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
