"use client";

import { useEffect, useState } from "react";

type FilledDate = {
  _id: string; // 🔥 TAMBAH ID
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
};

function getNowWIB() {
  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Jakarta",
    }),
  );
}

export default function Calendar({ onSelectDate, filledDates }: Props) {
  const today = getNowWIB();
  today.setHours(0, 0, 0, 0);

  const [currentMonth, setCurrentMonth] = useState(getNowWIB());
  const [holidays, setHolidays] = useState<Record<string, string>>({});

  // useEffect(() => {
  //   const fetchHolidays = async () => {
  //     const res = await fetch("https://api-harilibur.vercel.app/api");
  //     const data = await res.json();

  //     const mapped: Record<string, string> = {};
  //     data.forEach((item: any) => {
  //       if (item.is_national_holiday) {
  //         mapped[item.holiday_date] = item.holiday_name;
  //       }
  //     });

  //     setHolidays(mapped);
  //   };

  //   fetchHolidays();
  // }, []);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const startDay = (firstDay.getDay() + 6) % 7;

  const days: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= lastDate; i++)
    days.push(
      new Date(
        new Date(year, month, i).toLocaleString("en-US", {
          timeZone: "Asia/Jakarta",
        }),
      ),
    );

  const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  return (
    <div className="w-full">
      <div
        className="
          mx-auto
          max-w-7xl
          2xl:max-w-350
          rounded-3xl
          bg-white/80 dark:bg-slate-900/70
          backdrop-blur
          shadow-[0_20px_50px_-20px_rgba(0,0,0,0.25)]
          p-4 sm:p-6 lg:p-8
        "
      >
        {/* ================= HEADER ================= */}
        <div className="relative mb-20 flex items-center justify-end">
          {/* Judul Bulan (TENGAH) */}
          <h2
            className="
              absolute
              left-4
              sm:left-1/2 sm:-translate-x-1/2
              text-xs
              sm:text-sm
              md:text-base
              lg:text-lg
              xl:text-xl
              2xl:text-2xl
              font-extrabold
              text-slate-900 dark:text-white
              text-left sm:text-center
            "
          >
            {currentMonth.toLocaleDateString("id-ID", {
              month: "long",
              year: "numeric",
            })}
          </h2>

          {/* NAV */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
              className="
                h-8 w-8 sm:h-9 sm:w-9
                rounded-full
                flex items-center justify-center
                bg-slate-100 dark:bg-slate-800
                hover:bg-slate-200 dark:hover:bg-slate-700
                transition
              "
            >
              ←
            </button>

            <button
              onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
              className="
                h-8 w-8 sm:h-9 sm:w-9
                rounded-full
                flex items-center justify-center
                bg-slate-100 dark:bg-slate-800
                hover:bg-slate-200 dark:hover:bg-slate-700
                transition
              "
            >
              →
            </button>
          </div>
        </div>

        {/* ================= HARI ================= */}
        <div
          className="
            grid grid-cols-7
            text-center
            text-[11px] sm:text-sm
            font-semibold
            text-slate-500 dark:text-slate-400
            mb-2
          "
        >
          {dayNames.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* ================= TANGGAL ================= */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-3 lg:gap-4">
          {days.map((date, idx) => {
            if (!date) return <div key={idx} />;

            const isoDate = date.toLocaleDateString("en-CA", {
              timeZone: "Asia/Jakarta",
            });

            const isSunday = date.getDay() === 0;
            const isHoliday = Boolean(holidays[isoDate]);

            const log = filledDates?.[isoDate];

            const isFilled = Boolean(log);

            const status = log?.status;
            const approval = log?.approvalStatus;

            const isToday = date.getTime() === today.getTime();

            const isRevisi = approval === "revisi";

            const disabled =
              isSunday || isHoliday || (!isToday && !isFilled && !isRevisi);

            // ================= WARNA & TEXT =================
            let statusClass = "";
            let statusText = "";

            if (log) {
              if (approval === "revisi") {
                statusClass =
                  "bg-purple-50 border-purple-400 text-purple-700 dark:bg-purple-900/30";
                statusText = "Revisi";
              }
              if (approval === "ditolak") {
                statusClass =
                  "bg-red-50 border-red-400 text-red-700 dark:bg-red-900/30";
                statusText = "Ditolak";
              } else if (approval === "menunggu") {
                statusClass =
                  "bg-amber-50 border-amber-400 text-amber-700 dark:bg-amber-900/30";
                statusText = "Menunggu";
              } else if (approval === "disetujui" && status === "hadir") {
                statusClass =
                  "bg-emerald-50 border-emerald-400 text-emerald-700 dark:bg-emerald-900/30";
                statusText = "Hadir";
              } else if (status?.startsWith("tidak_hadir")) {
                statusClass =
                  "bg-orange-50 border-orange-400 text-orange-700 dark:bg-orange-900/30";
                statusText = "Tidak Hadir";
              }
            }

            return (
              <button
                key={idx}
                disabled={disabled}
                onClick={() => onSelectDate(isoDate, isFilled, approval)}
                className={`
        relative aspect-6/5 xl:aspect-5/4
        rounded-xl sm:rounded-2xl
        border
        p-1.5 sm:p-2 md:p-3 lg:p-4
        transition

        ${
          statusClass
            ? statusClass
            : isToday
              ? "bg-indigo-50 border-indigo-400 text-indigo-700"
              : "bg-slate-100 dark:bg-slate-800 text-slate-400"
        }

        ${disabled ? "cursor-not-allowed opacity-60" : "hover:scale-[1.03]"}
      `}
              >
                {/* Tanggal */}
                <div className="text-xs sm:text-sm md:text-base font-bold">
                  {date.getDate()}
                </div>

                {/* Status */}
                {isFilled && statusText && (
                  <span
                    className="
            absolute bottom-1 left-1 right-1
            hidden sm:block
            text-[10px]
            text-center font-semibold
          "
                  >
                    {statusText}
                  </span>
                )}

                {!isFilled && isToday && (
                  <span
                    className="
            absolute bottom-1 left-1 right-1
            hidden sm:block
            text-[10px]
            text-center font-semibold
            text-indigo-600 dark:text-indigo-300
          "
                  >
                    Hari Ini
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
