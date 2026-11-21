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
  disableEmptyDates?: boolean;
};

function getNowWIB() {
  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Jakarta",
    }),
  );
}

export default function Calendar({
  onSelectDate,
  filledDates,
  missedDates,
  holidayDates,
  disableEmptyDates = false,
}: Props) {
  const today = getNowWIB();
  today.setHours(0, 0, 0, 0);

  const missedSet = useMemo(() => new Set(missedDates || []), [missedDates]);
  const holidaySet = useMemo(
    () => new Set(holidayDates || []),
    [holidayDates],
  );

  const [currentMonth, setCurrentMonth] = useState(getNowWIB());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const startDay = (firstDay.getDay() + 6) % 7;

  const days: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= lastDate; i++) {
    days.push(
      new Date(
        new Date(year, month, i).toLocaleString("en-US", {
          timeZone: "Asia/Jakarta",
        }),
      ),
    );
  }

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
      {/* ================= HEADER BULAN ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white capitalize">
          {currentMonth.toLocaleDateString("id-ID", {
            month: "long",
            year: "numeric",
          })}
        </h3>

        <div className="flex items-center gap-2">
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

          const isoDate = date.toLocaleDateString("en-CA", {
            timeZone: "Asia/Jakarta",
          });

          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const isHoliday = isWeekend || holidaySet.has(isoDate);
          const log = filledDates?.[isoDate];
          const isFilled = Boolean(log);
          const isMissed = !isFilled && !isHoliday && missedSet.has(isoDate);
          const status = log?.status;
          const approval = log?.approvalStatus;
          const isToday = date.getTime() === today.getTime();
          const isRevisi = approval === "revisi";

          const disabled = disableEmptyDates
            ? !isFilled
            : date.getDay() === 0 || (!isToday && !isFilled && !isRevisi && !isMissed);

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
                  {date.getDate()}
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
              ) : holidaySet.has(isoDate) ? (
                <span className="hidden sm:inline-block text-[10px] font-medium text-rose-400 truncate w-full">
                  Libur
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* ================= LEGEND ================= */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
        {legendItems.map((item) => (
          <div key={item.label} className="inline-flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full border ${item.dotClass}`}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
