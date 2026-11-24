"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  type ChartData,
  type ChartOptions,
  registerables,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { PieChart } from "lucide-react";
import type { SuperadminDashboardSummary } from "./types";

ChartJS.register(...registerables);

type StatusSummary = SuperadminDashboardSummary["participantStatusSummary"];

type Props = {
  statusSummary: StatusSummary;
  isLoading?: boolean;
};

const STATUS_ROWS: Array<{
  key: "aktif" | "selesai" | "ditolak" | "menunggu";
  label: string;
  color: string;
  darkColor?: string;
  dotClass: string;
}> = [
  {
    key: "aktif",
    label: "Aktif",
    color: "#2563eb",
    dotClass: "bg-[#2563eb]",
  },
  {
    key: "selesai",
    label: "Selesai",
    color: "#10b981",
    dotClass: "bg-[#10b981]",
  },
  {
    key: "ditolak",
    label: "Ditolak",
    color: "#f59e0b",
    dotClass: "bg-[#f59e0b]",
  },
  {
    key: "menunggu",
    label: "Menunggu",
    color: "#dfe4ef",
    darkColor: "#475569",
    dotClass: "bg-[#dfe4ef] dark:bg-slate-600",
  },
];

export default function SuperadminStatusDonutCard({
  statusSummary,
  isLoading = false,
}: Props) {
  const safeSummary = useMemo(
    () =>
      statusSummary ?? {
        total: 0,
        aktif: 0,
        selesai: 0,
        ditolak: 0,
        menunggu: 0,
      },
    [statusSummary],
  );

  const total = safeSummary.total;
  const hasData = total > 0;

  const legendItems = useMemo(
    () =>
      STATUS_ROWS.map((row) => {
        const count = safeSummary[row.key] ?? 0;
        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
        return { ...row, count, pct };
      }),
    [safeSummary, total],
  );

  const chartData: ChartData<"doughnut"> = useMemo(() => {
    const isDark =
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark");

    if (!hasData) {
      return {
        labels: ["Belum ada data"],
        datasets: [
          {
            data: [1],
            backgroundColor: [isDark ? "#1e293b" : "#f1f5f9"],
            borderWidth: 0,
            hoverOffset: 0,
          },
        ],
      };
    }

    return {
      labels: legendItems.map((item) => item.label),
      datasets: [
        {
          data: legendItems.map((item) => item.count),
          backgroundColor: legendItems.map((item) =>
            isDark && item.darkColor ? item.darkColor : item.color,
          ),
          borderWidth: 0,
          hoverOffset: 5,
        },
      ],
    };
  }, [hasData, legendItems]);

  const chartOptions: ChartOptions<"doughnut"> = useMemo(() => {
    const isDark =
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark");

    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "66%",
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: hasData,
          backgroundColor: isDark
            ? "rgba(15, 23, 42, 0.96)"
            : "rgba(255, 255, 255, 0.98)",
          titleColor: isDark ? "#94a3b8" : "#64748b",
          bodyColor: isDark ? "#f8fafc" : "#0f172a",
          borderColor: isDark
            ? "rgba(51, 65, 85, 0.9)"
            : "rgba(226, 232, 240, 1)",
          borderWidth: 1,
          padding: 10,
          cornerRadius: 10,
          callbacks: {
            label: (ctx) => {
              const count = Number(ctx.parsed || 0);
              const pct =
                total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
              return ` ${ctx.label}: ${count} (${pct}%)`;
            },
          },
        },
      },
    };
  }, [hasData, total]);

  return (
    <div
      className={`lg:col-span-3 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_10px_35px_-15px_rgba(15,23,42,0.08)] p-5 sm:p-6 flex flex-col justify-between transition-opacity ${
        isLoading ? "opacity-65" : "opacity-100"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
          <PieChart className="w-4 h-4" />
        </div>
        <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
          Status Peserta
        </h3>
      </div>

      {/* Donut + Legend (stacked vertically) */}
      <div className="my-auto pt-6 pb-2 flex flex-col items-center justify-center gap-6">
        <div className="relative w-44 h-44 sm:w-48 sm:h-48 shrink-0">
          <Doughnut data={chartData} options={chartOptions} />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums leading-none">
              {total}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Total
            </span>
          </div>
        </div>

        <div className="w-full space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          {legendItems.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 text-xs sm:text-sm"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.dotClass}`}
                />
                <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                  {item.label}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0 tabular-nums">
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {item.count}
                </span>
                <span className="text-xs font-medium text-slate-400 w-12 text-right">
                  {item.pct}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
