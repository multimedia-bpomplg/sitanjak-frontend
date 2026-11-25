"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type FilledDate = {
  _id: string;
  status: "hadir" | "tidak_hadir_keterangan" | "tidak_hadir_tanpa_keterangan";
  approvalStatus: "menunggu" | "disetujui" | "ditolak" | "revisi";
};

type Props = {
  onSelectDate: (
    date: string,
    isFilled: boolean,
    approvalStatus?: "menunggu" | "disetujui" | "ditolak" | "revisi",
  ) => void;
  filledDates: Record<string, FilledDate>;
  missedDates?: string[];
  holidayDates?: string[];
  overrideWorkdays?: string[];
  disableEmptyDates?: boolean;
  startDate?: string | null;
  endDate?: string | null;
};

type PeriodItem = {
  index: number;
  start: Date;
  end: Date;
  label: string;
};

function getNowWIB() {
  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Jakarta",
    }),
  );
}

function parseYmdDate(raw?: string | null): Date | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (match) {
    const [, y, m, d] = match;
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    dt.setHours(0, 0, 0, 0);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  const wib = new Date(
    parsed.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
  );
  wib.setHours(0, 0, 0, 0);
  return wib;
}

function toIsoYmd(d: Date): string {
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

function buildInternshipPeriods(
  startStr?: string | null,
  endStr?: string | null,
): PeriodItem[] {
  const start = parseYmdDate(startStr);
  const end = parseYmdDate(endStr);
  if (!start || !end || end < start) return [];

  const periods: PeriodItem[] = [];
  let curStart = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  let idx = 1;

  while (curStart <= end && idx <= 24) {
    const nextMonthSameDay = new Date(
      curStart.getFullYear(),
      curStart.getMonth() + 1,
      curStart.getDate(),
    );
    const curEnd = new Date(
      nextMonthSameDay.getFullYear(),
      nextMonthSameDay.getMonth(),
      nextMonthSameDay.getDate() - 1,
    );
    const actualEnd = curEnd > end ? new Date(end) : curEnd;

    periods.push({
      index: idx,
      start: new Date(curStart),
      end: actualEnd,
      label: `${formatShortDateID(curStart)} - ${formatShortDateID(actualEnd)}`,
    });

    curStart = nextMonthSameDay;
    idx += 1;
  }

  return periods;
}

export default function Calendar({
  onSelectDate,
  filledDates,
  missedDates,
  holidayDates,
  overrideWorkdays,
  disableEmptyDates = false,
  startDate,
  endDate,
}: Props) {
  const today = useMemo(() => {
    const d = getNowWIB();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const missedSet = useMemo(() => new Set(missedDates || []), [missedDates]);
  const holidaySet = useMemo(
    () => new Set(holidayDates || []),
    [holidayDates],
  );
  const overrideSet = useMemo(
    () => new Set(overrideWorkdays || []),
    [overrideWorkdays],
  );

  const periods = useMemo(
    () => buildInternshipPeriods(startDate, endDate),
    [startDate, endDate],
  );
  const hasPeriodMode = periods.length > 0;
  const periodKey = `${startDate || ""}|${endDate || ""}`;

  const defaultPeriodIdx = useMemo(() => {
    if (periods.length === 0) return 0;
    const todayTime = today.getTime();
    const activeIdx = periods.findIndex(
      (p) => todayTime >= p.start.getTime() && todayTime <= p.end.getTime(),
    );
    if (activeIdx !== -1) return activeIdx;
    if (todayTime > periods[periods.length - 1].end.getTime()) {
      return periods.length - 1;
    }
    return 0;
  }, [periods, today]);

  const [periodOverride, setPeriodOverride] = useState<{
    key: string;
    idx: number;
  } | null>(null);
  const activePeriodIdx =
    periodOverride?.key === periodKey ? periodOverride.idx : defaultPeriodIdx;
  const activePeriod = periods[activePeriodIdx] ?? periods[0] ?? null;

  const [currentMonth, setCurrentMonth] = useState(getNowWIB());
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const days: (Date | null)[] = useMemo(() => {
    const cells: (Date | null)[] = [];

    if (hasPeriodMode && activePeriod) {
      const startDay = (activePeriod.start.getDay() + 6) % 7;
      for (let i = 0; i < startDay; i++) cells.push(null);

      const cur = new Date(activePeriod.start);
      while (cur <= activePeriod.end) {
        cells.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }

      while (cells.length % 7 !== 0) cells.push(null);
      return cells;
    }

    const firstDay = new Date(year, month, 1);
    const lastDate = new Date(year, month + 1, 0).getDate();
    const startDay = (firstDay.getDay() + 6) % 7;

    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let i = 1; i <= lastDate; i++) {
      cells.push(new Date(year, month, i));
    }
    return cells;
  }, [hasPeriodMode, activePeriod, year, month]);

  const spansMultipleMonths =
    hasPeriodMode &&
    activePeriod !== null &&
    (activePeriod.start.getMonth() !== activePeriod.end.getMonth() ||
      activePeriod.start.getFullYear() !== activePeriod.end.getFullYear());

  const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  const legendItems = [
    {
      label: "Menunggu",
      dotClass: "bg-amber-400 border-amber-500",
    },
    {
      label: "Disetujui",
      dotClass: "bg-emerald-500 border-emerald-600",
    },
    {
      label: "Revisi",
      dotClass: "bg-purple-500 border-purple-600",
    },
    {
      label: "Ditolak",
      dotClass: "bg-rose-500 border-rose-600",
    },
    {
      label: "Tidak Hadir",
      dotClass: "bg-orange-400 border-orange-500",
    },
    ...(missedDates !== undefined
      ? [
          {
            label: "Belum Mengisi Logbook",
            dotClass: "bg-rose-500 border-rose-600",
          },
        ]
      : []),
  ];

  return (
    <div className="w-full space-y-4">
      {/* ================= HEADER PERIODE / BULAN ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {hasPeriodMode && activePeriod ? (
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              Periode {activePeriod.index}
            </h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {activePeriod.label}
            </p>
          </div>
        ) : (
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white capitalize">
            {currentMonth.toLocaleDateString("id-ID", {
              month: "long",
              year: "numeric",
            })}
          </h3>
        )}

        <div className="flex items-center gap-2">
          {hasPeriodMode ? (
            <>
              <button
                type="button"
                onClick={() =>
                  setPeriodOverride({ key: periodKey, idx: defaultPeriodIdx })
                }
                disabled={activePeriodIdx === defaultPeriodIdx}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Periode Ini
              </button>

              <button
                type="button"
                disabled={activePeriodIdx <= 0}
                onClick={() =>
                  setPeriodOverride({
                    key: periodKey,
                    idx: Math.max(0, activePeriodIdx - 1),
                  })
                }
                aria-label="Periode sebelumnya"
                className="h-8 w-8 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-sky-50 hover:text-[#0284c7] hover:border-sky-200 dark:hover:bg-slate-700 disabled:opacity-35 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                disabled={activePeriodIdx >= periods.length - 1}
                onClick={() =>
                  setPeriodOverride({
                    key: periodKey,
                    idx: Math.min(periods.length - 1, activePeriodIdx + 1),
                  })
                }
                aria-label="Periode berikutnya"
                className="h-8 w-8 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-sky-50 hover:text-[#0284c7] hover:border-sky-200 dark:hover:bg-slate-700 disabled:opacity-35 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setCurrentMonth(getNowWIB())}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                Bulan Ini
              </button>

              <button
                type="button"
                onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                aria-label="Bulan sebelumnya"
                className="h-8 w-8 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-sky-50 hover:text-[#0284c7] hover:border-sky-200 dark:hover:bg-slate-700 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                aria-label="Bulan berikutnya"
                className="h-8 w-8 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-sky-50 hover:text-[#0284c7] hover:border-sky-200 dark:hover:bg-slate-700 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ================= NAMA HARI ================= */}
      <div className="grid grid-cols-7 text-center text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
        {dayNames.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {/* ================= GRID TANGGAL ================= */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
        {days.map((date, idx) => {
          if (!date) return <div key={idx} />;

          const isoDate = toIsoYmd(date);

          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const isOverrideWorkday = overrideSet.has(isoDate);
          const isHoliday =
            !isOverrideWorkday && (isWeekend || holidaySet.has(isoDate));
          const log = filledDates?.[isoDate];
          const isFilled = Boolean(log);
          const isMissed = !isFilled && !isHoliday && missedSet.has(isoDate);
          const status = log?.status;
          const approval = log?.approvalStatus;
          const isToday = date.getTime() === today.getTime();
          const isRevisi = approval === "revisi";

          const disabled = disableEmptyDates
            ? !isFilled
            : (date.getDay() === 0 && !isOverrideWorkday) ||
              (!isToday && !isFilled && !isRevisi && !isMissed);

          let statusClass = "";
          let statusText = "";

          if (log) {
            if (approval === "revisi") {
              statusClass =
                "bg-purple-50 border-purple-300 text-purple-700 dark:bg-purple-950/50 dark:border-purple-700 dark:text-purple-300";
              statusText = "Revisi";
            } else if (approval === "ditolak") {
              statusClass =
                "bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/50 dark:border-rose-700 dark:text-rose-300";
              statusText = "Ditolak";
            } else if (approval === "menunggu") {
              statusClass =
                "bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/50 dark:border-amber-700 dark:text-amber-300";
              statusText = "Menunggu";
            } else if (approval === "disetujui" && status === "hadir") {
              statusClass =
                "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-700 dark:text-emerald-300";
              statusText = "Disetujui";
            } else if (status?.startsWith("tidak_hadir")) {
              statusClass =
                "bg-orange-50 border-orange-300 text-orange-700 dark:bg-orange-950/50 dark:border-orange-700 dark:text-orange-300";
              statusText = "Tidak Hadir";
            }
          } else if (isMissed) {
            statusClass =
              "bg-rose-50/90 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300";
            statusText = "Belum Isi";
          }

          const dayLabel =
            spansMultipleMonths &&
            (date.getDate() === 1 ||
              toIsoYmd(date) === toIsoYmd(activePeriod.start))
              ? `${date.getDate()} ${date.toLocaleDateString("id-ID", { month: "short" })}`
              : String(date.getDate());

          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => onSelectDate(isoDate, isFilled, approval)}
              className={`
                relative min-h-14 sm:min-h-18
                rounded-xl border p-2 text-left
                flex flex-col justify-between transition
                ${
                  statusClass
                    ? statusClass
                    : isToday
                      ? "bg-sky-50 border-sky-400 text-[#0284c7] dark:bg-sky-950/40 dark:border-sky-600 dark:text-sky-300"
                      : isHoliday
                        ? "bg-slate-50/70 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 text-rose-400"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-800 text-slate-400"
                }
                ${
                  disabled && !isMissed
                    ? "cursor-default opacity-65"
                    : disabled
                      ? "cursor-default"
                      : "cursor-pointer hover:shadow-sm hover:-translate-y-0.5 hover:ring-2 hover:ring-[#0284c7]/30"
                }
              `}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs sm:text-sm font-bold">
                  {dayLabel}
                </span>
                {isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7]" />
                )}
              </div>

              {(isFilled || isMissed) && statusText ? (
                <span className="hidden sm:inline-block text-[10px] font-semibold truncate w-full">
                  {statusText}
                </span>
              ) : isToday ? (
                <span className="hidden sm:inline-block text-[10px] font-semibold text-[#0284c7] dark:text-sky-300 truncate w-full">
                  Hari Ini
                </span>
              ) : !isOverrideWorkday && holidaySet.has(isoDate) ? (
                <span className="hidden sm:inline-block text-[10px] font-medium text-rose-400 truncate w-full">
                  Libur
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* ================= LEGEND ================= */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        {legendItems.map((item) => (
          <span key={item.label} className="inline-flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full border ${item.dotClass}`}
            />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
