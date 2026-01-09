"use client";

import { useEffect, useState } from "react";

type Props = {
  onSelectDate: (date: string, isFilled: boolean) => void;
  filledDates: Record<string, string>;
};

export default function Calendar({ onSelectDate, filledDates }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [holidays, setHolidays] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchHolidays = async () => {
      const res = await fetch("https://api-harilibur.vercel.app/api");
      const data = await res.json();

      const mapped: Record<string, string> = {};
      data.forEach((item: any) => {
        if (item.is_national_holiday) {
          mapped[item.holiday_date] = item.holiday_name;
        }
      });

      setHolidays(mapped);
    };

    fetchHolidays();
  }, []);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const startDay = (firstDay.getDay() + 6) % 7;

  const days: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= lastDate; i++) days.push(new Date(year, month, i));

  const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="bg-white rounded-3xl shadow-xl p-6">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200"
          >
            ←
          </button>

          <h2 className="text-xl font-bold text-indigo-600">
            {currentMonth.toLocaleDateString("id-ID", {
              month: "long",
              year: "numeric",
            })}
          </h2>

          <button
            onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200"
          >
            →
          </button>
        </div>

        {/* HARI */}
        <div className="grid grid-cols-7 text-center text-sm font-semibold text-slate-600 mb-3">
          {dayNames.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* TANGGAL */}
        <div className="grid grid-cols-7 gap-3">
          {days.map((date, idx) => {
            if (!date) return <div key={idx} />;

            const isoDate = date.toISOString().split("T")[0];
            const isSunday = date.getDay() === 0;
            const isHoliday = Boolean(holidays[isoDate]);
            const isFilled = Boolean(filledDates?.[isoDate]);

            const isToday = date.getTime() === today.getTime();

            // 🔑 LOGIKA FINAL
            const canClick =
              (!isFilled && isToday) || // hari ini & belum diisi
              isFilled; // sudah diisi (hari apa pun)

            const disabled = isSunday || isHoliday || !canClick;

            return (
              <button
                key={idx}
                disabled={disabled}
                onClick={() => onSelectDate(isoDate, isFilled)}
                className={`
                    relative h-28 rounded-2xl border p-3 text-left transition
                    ${
                      isFilled
                        ? "bg-emerald-50 border-emerald-400 hover:ring-2 hover:ring-emerald-300"
                        : isToday
                        ? "bg-white hover:bg-indigo-50 hover:border-indigo-400"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }
                  `}
              >
                <div className="text-lg font-bold">{date.getDate()}</div>

                {isHoliday && (
                  <span className="text-[11px] text-red-600">
                    {holidays[isoDate]}
                  </span>
                )}

                {isSunday && !isHoliday && (
                  <span className="text-[11px] text-red-500">Minggu</span>
                )}

                {isFilled && (
                  <span className="absolute bottom-2 left-2 right-2 text-[11px] text-center font-semibold text-emerald-600">
                    ✔ Telah Diisi
                  </span>
                )}

                {!isFilled && isToday && (
                  <span className="absolute bottom-2 left-2 right-2 text-[11px] text-center font-semibold text-indigo-600">
                    🟢 Hari Ini
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
