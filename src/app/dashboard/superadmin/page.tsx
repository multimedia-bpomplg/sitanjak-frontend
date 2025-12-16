"use client";

import { useEffect, useMemo, useState } from "react";
import { addMonths, format, differenceInCalendarMonths } from "date-fns";
import { DateRange, Range } from "react-date-range";

import { Calendar, Users, UserCheck, UserCog } from "lucide-react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

/* Register Chart.js components */
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle,
  ChartTooltip,
  ChartLegend
);

/* ---------------------------
   Data Types
   --------------------------- */
type DataRow = {
  date: string;
  logbook: number;
  pendaftaran: number;
};

type ChartMonth = {
  name: string;
  total: number;
  year: number;
  month: number;
};

/* ---------------------------
   Sample Data Generator
   --------------------------- */
function generateSampleData(): DataRow[] {
  const datasets: DataRow[] = [];
  const start = new Date(2023, 0, 1); // Jan 2023
  const end = new Date(2025, 11, 1); // Dec 2025
  let cursor = start;

  while (cursor <= end) {
    const month = cursor.getMonth();
    const year = cursor.getFullYear();

    const baseLog = 20 + (month + 1) * 5 + (year - 2023) * 10;
    const basePendaftaran = 100 + (month + 1) * 25 + (year - 2023) * 40;

    datasets.push({
      date: format(new Date(year, month, 1), "yyyy-MM-dd"),
      logbook: Math.round(baseLog + Math.sin(month) * 8 + Math.random() * 10),
      pendaftaran: Math.round(
        basePendaftaran + Math.cos(month) * 40 + Math.random() * 30
      ),
    });

    cursor = addMonths(cursor, 1);
  }

  return datasets;
}

/* ---------------------------
   Helper Functions
   --------------------------- */
function groupByMonth(
  rows: DataRow[],
  startDate: Date,
  endDate: Date,
  activeTab: "logbook" | "pendaftaran"
): ChartMonth[] {
  const monthsCount = differenceInCalendarMonths(
    new Date(endDate.getFullYear(), endDate.getMonth(), 1),
    new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  );

  const result: ChartMonth[] = [];
  for (let i = 0; i <= monthsCount; i++) {
    const d = addMonths(
      new Date(startDate.getFullYear(), startDate.getMonth(), 1),
      i
    );
    const ym = format(d, "yyyy-MM");
    const label = format(d, "MMM yyyy");
    const row = rows.find((r) => r.date.slice(0, 7) === ym);

    result.push({
      name: label,
      total: row
        ? activeTab === "logbook"
          ? row.logbook
          : row.pendaftaran
        : 0,
      year: d.getFullYear(),
      month: d.getMonth(),
    });
  }
  return result;
}

function sumTotals(arr: ChartMonth[]): number {
  return arr.reduce((s, x) => s + x.total, 0);
}

/* ---------------------------
   Component
   --------------------------- */
export default function SuperadminDashboard() {
  const rawData = useMemo(() => generateSampleData(), []);

  // UI state
  const [activeTab, setActiveTab] = useState<"logbook" | "pendaftaran">(
    "logbook"
  );
  const [dark, setDark] = useState(false);

  const defaultEnd = new Date();
  const defaultStart = addMonths(defaultEnd, -5);
  const [range, setRange] = useState<{ startDate: Date; endDate: Date }>({
    startDate: defaultStart,
    endDate: defaultEnd,
  });
  const [showPicker, setShowPicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [selectedMonth, setSelectedMonth] = useState<number | "all">("all");

  // Years available
  const years = useMemo(() => {
    const s = new Set<number>();
    rawData.forEach((r) => s.add(new Date(r.date).getFullYear()));
    return Array.from(s).sort();
  }, [rawData]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const effectiveRange = useMemo(() => {
    let s = range.startDate;
    let e = range.endDate;

    if (selectedYear !== "all") {
      if (selectedMonth === "all") {
        s = new Date(Number(selectedYear), 0, 1);
        e = new Date(Number(selectedYear), 11, 1);
      } else {
        s = new Date(Number(selectedYear), Number(selectedMonth), 1);
        e = new Date(Number(selectedYear), Number(selectedMonth), 1);
      }
    }

    return { s, e };
  }, [range, selectedYear, selectedMonth]);

  const chartMonthly = useMemo(() => {
    return groupByMonth(rawData, effectiveRange.s, effectiveRange.e, activeTab);
  }, [rawData, effectiveRange, activeTab]);

  const stats = useMemo(() => {
    const total = sumTotals(chartMonthly);
    const months = chartMonthly.length || 1;
    const avg = Math.round(total / months);

    const curStart = chartMonthly.length
      ? new Date(chartMonthly[0].year, chartMonthly[0].month, 1)
      : range.startDate;
    const prevStart = addMonths(curStart, -months);
    const prevEnd = addMonths(curStart, -1);

    const prev = groupByMonth(rawData, prevStart, prevEnd, activeTab);
    const prevTotal = sumTotals(prev);
    const pctChange =
      prevTotal === 0
        ? 100
        : Math.round(((total - prevTotal) / prevTotal) * 100);

    return { total, avg, pctChange, prevTotal };
  }, [chartMonthly, rawData, activeTab, range]);

  const pesertaCount = 128;
  const mentorCount = 12;
  const adminCount = 5;

  const chartData = useMemo(() => {
    const labels = chartMonthly.map((m) => m.name);
    const dataValues = chartMonthly.map((m) => m.total);
    return {
      labels,
      datasets: [
        {
          label: activeTab === "logbook" ? "Logbook" : "Pendaftaran",
          data: dataValues,
          backgroundColor: "#3b82f6",
          borderRadius: 6,
          barPercentage: 0.6,
        },
      ],
    };
  }, [chartMonthly, activeTab]);

  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: false },
        tooltip: { mode: "index", intersect: false },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: dark ? "#cbd5e1" : "#374151" },
        },
        y: {
          grid: { color: dark ? "#1f2937" : "#e6e6e6" },
          ticks: { color: dark ? "#cbd5e1" : "#374151" },
        },
      },
    };
  }, [dark]);

  const monthNames = useMemo(
    () => [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    []
  );

  function onRangeChange(selection: { selection: Range }) {
    const sel = selection.selection ?? selection;
    setRange({ startDate: sel.startDate!, endDate: sel.endDate! });
    setSelectedYear("all");
    setSelectedMonth("all");
  }

  return (
    <div className="p-6 space-y-6 text-gray-800 dark:text-gray-200">
      {/* Top Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
            <Users className="w-6 h-6 text-blue-600 dark:text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Peserta Magang
            </p>
            <h2 className="text-2xl font-bold">{pesertaCount}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Aktif
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow flex items-center gap-4">
          <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
            <UserCheck className="w-6 h-6 text-green-600 dark:text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-300">Mentor</p>
            <h2 className="text-2xl font-bold">{mentorCount}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tersedia
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow flex items-center gap-4">
          <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
            <UserCog className="w-6 h-6 text-purple-600 dark:text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-300">Admin</p>
            <h2 className="text-2xl font-bold">{adminCount}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Superuser
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 flex">
            <button
              onClick={() => setActiveTab("logbook")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === "logbook"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-gray-200 hover:bg-gray-50"
              }`}
            >
              Logbook
            </button>
            <button
              onClick={() => setActiveTab("pendaftaran")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === "pendaftaran"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-gray-200 hover:bg-gray-50"
              }`}
            >
              Pendaftaran
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowPicker((s) => !s)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border rounded-md text-sm shadow-sm"
            >
              <Calendar className="w-4 h-4" />
              <span className="whitespace-nowrap">
                {format(range.startDate, "MMM d, yyyy")} -{" "}
                {format(range.endDate, "MMM d, yyyy")}
              </span>
            </button>

            {showPicker && (
              <div className="absolute z-50 mt-2 bg-white dark:bg-gray-800 shadow-lg rounded-md p-2">
                <DateRange
                  onChange={onRangeChange}
                  moveRangeOnFirstSelection={false}
                  ranges={[
                    {
                      startDate: range.startDate,
                      endDate: range.endDate,
                      key: "selection",
                    },
                  ]}
                  months={2}
                  direction="horizontal"
                />
                <div className="flex justify-end mt-2 gap-2">
                  <button
                    onClick={() => setShowPicker(false)}
                    className="px-3 py-1 rounded-md text-sm bg-gray-100 dark:bg-gray-700"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) =>
              setSelectedYear(
                e.target.value === "all" ? "all" : Number(e.target.value)
              )
            }
            className="px-3 py-2 bg-white dark:bg-gray-800 border rounded-md text-sm"
          >
            <option value="all">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select
            value={selectedMonth}
            onChange={(e) =>
              setSelectedMonth(
                e.target.value === "all" ? "all" : Number(e.target.value)
              )
            }
            className="px-3 py-2 bg-white dark:bg-gray-800 border rounded-md text-sm"
          >
            <option value="all">All months</option>
            {monthNames.map((m, idx) => (
              <option key={m} value={idx}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
          <div className="text-sm text-gray-500 dark:text-gray-300">
            Total ({activeTab === "logbook" ? "Logbook" : "Pendaftaran"})
          </div>
          <div className="text-2xl font-bold mt-2">{stats.total}</div>
          <div
            className={`text-sm mt-1 ${
              stats.pctChange >= 0 ? "text-green-600" : "text-red-500"
            }`}
          >
            {stats.pctChange >= 0
              ? `+${stats.pctChange}%`
              : `${stats.pctChange}%`}{" "}
            vs prev period
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
          <div className="text-sm text-gray-500 dark:text-gray-300">
            Rata-rata / bulan
          </div>
          <div className="text-2xl font-bold mt-2">{stats.avg}</div>
          <div className="text-sm mt-1 text-gray-500 dark:text-gray-300">
            Berdasarkan periode terpilih
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
          <div className="text-sm text-gray-500 dark:text-gray-300">
            Periode
          </div>
          <div className="text-2xl font-bold mt-2">
            {chartMonthly.length} bulan
          </div>
          <div className="text-sm mt-1 text-gray-500 dark:text-gray-300">
            {chartMonthly.length
              ? `${chartMonthly[0].name} — ${
                  chartMonthly[chartMonthly.length - 1].name
                }`
              : "-"}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm h-96">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {activeTab === "logbook"
              ? "Perkembangan Logbook"
              : "Perkembangan Pendaftaran"}
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-300">
            {selectedYear !== "all" ? `${selectedYear}` : ""}
            {selectedMonth !== "all"
              ? ` • ${monthNames[Number(selectedMonth)]}`
              : ""}
          </div>
        </div>
        <div className="h-72">
          <Bar options={chartOptions} data={chartData} />
        </div>
      </div>
    </div>
  );
}
