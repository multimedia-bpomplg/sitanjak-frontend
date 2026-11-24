"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  Chart as ChartJS,
  type ChartData,
  type ChartOptions,
  type Plugin,
  type ScriptableContext,
  registerables,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import {
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  CalendarDays,
  GraduationCap,
  Loader2,
  RotateCcw,
  SlidersHorizontal,
  TrendingUp,
  Users,
} from "lucide-react";
import SuperadminStatusDonutCard from "./SuperadminStatusDonutCard";
import type { SuperadminDashboardSummary } from "./types";

ChartJS.register(...registerables);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

const MONTH_OPTIONS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

type ParticipantTrendData = SuperadminDashboardSummary["participantTrend"];
type ParticipantStatusSummary =
  SuperadminDashboardSummary["participantStatusSummary"];

type TrendFilters = {
  year: "all" | number;
  month: "all" | number;
  posisi: string;
  instansi: string;
  jurusan: string;
  jenisKelamin: string;
};

type Props = {
  initialTrend: ParticipantTrendData;
  initialStatusSummary: ParticipantStatusSummary;
  filterOptions: SuperadminDashboardSummary["filterOptions"];
  defaultYear: number;
};

function createValueLabelsPlugin<T extends "bar" | "line">(
  id: string,
  offsetY: number,
  enabled: boolean,
): Plugin<T> {
  return {
    id,
    afterDatasetsDraw(chart) {
      if (!enabled) return;
      const { ctx } = chart;
      const meta = chart.getDatasetMeta(0);
      if (!meta?.data) return;

      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";

      const isDark = document.documentElement.classList.contains("dark");
      ctx.font = "700 11.5px Inter, ui-sans-serif, system-ui, sans-serif";
      ctx.fillStyle = isDark ? "#e2e8f0" : "#1e293b";

      meta.data.forEach((element, index) => {
        const val = chart.data.datasets[0]?.data?.[index];
        if (typeof val !== "number") return;
        const pos = element.tooltipPosition(true);
        if (pos.x == null) return;
        ctx.fillText(String(val), pos.x, element.y - offsetY);
      });

      ctx.restore();
    },
  };
}

function FilterSelect({
  icon,
  label,
  ariaLabel,
  value,
  onChange,
  options,
}: {
  icon: ReactNode;
  label: string;
  ariaLabel: string;
  value: string;
  onChange: (val: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex flex-col gap-1 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 px-3 py-2 focus-within:border-blue-400 transition">
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {icon}
        {label}
      </span>
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs font-semibold text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none cursor-pointer truncate"
      >
        {options.map((opt) => (
          <option
            key={`${label}-${opt.value}`}
            value={opt.value}
            className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function SuperadminActivityCharts({
  initialTrend,
  initialStatusSummary,
  filterOptions,
  defaultYear,
}: Props) {
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [filters, setFilters] = useState<TrendFilters>({
    year: defaultYear,
    month: "all",
    posisi: "",
    instansi: "",
    jurusan: "",
    jenisKelamin: "",
  });
  const [remoteTrend, setRemoteTrend] = useState<{
    key: string;
    trend: ParticipantTrendData;
    statusSummary: ParticipantStatusSummary;
  } | null>(null);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const requestSeqRef = useRef(0);

  const filterKey = `${filters.year}|${filters.month}|${filters.posisi}|${filters.instansi}|${filters.jurusan}|${filters.jenisKelamin}`;
  const isDefaultFilter =
    filters.year === defaultYear &&
    filters.month === "all" &&
    filters.posisi === "" &&
    filters.instansi === "" &&
    filters.jurusan === "" &&
    filters.jenisKelamin === "";

  useEffect(() => {
    if (isDefaultFilter) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const reqId = ++requestSeqRef.current;

    const loadTrend = async () => {
      try {
        const params = new URLSearchParams();
        params.set("range", "all");
        params.set("trendYear", String(filters.year));
        params.set("trendMonth", String(filters.month));
        if (filters.posisi) params.set("posisi", filters.posisi);
        if (filters.instansi) params.set("instansi", filters.instansi);
        if (filters.jurusan) params.set("jurusan", filters.jurusan);
        if (filters.jenisKelamin) {
          params.set("jenisKelamin", filters.jenisKelamin);
        }

        const res = await fetch(
          `${API_BASE_URL}/oversistem/superadmin-summary?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          },
        );
        if (!res.ok) return;
        const json = (await res.json().catch(() => null)) as
          | SuperadminDashboardSummary
          | null;
        if (requestSeqRef.current !== reqId) return;
        if (json?.success && json.participantTrend) {
          setRemoteTrend({
            key: filterKey,
            trend: json.participantTrend,
            statusSummary:
              json.participantStatusSummary ?? initialStatusSummary,
          });
        }
      } catch {
        // Diamkan bila jaringan gagal sementara
      } finally {
        if (requestSeqRef.current === reqId) {
          setLoadingKey(null);
        }
      }
    };

    void loadTrend();
  }, [filters, filterKey, isDefaultFilter, initialStatusSummary]);

  const updateFilter = <K extends keyof TrendFilters>(
    field: K,
    value: TrendFilters[K],
  ) => {
    const next = { ...filters, [field]: value };
    const nextKey = `${next.year}|${next.month}|${next.posisi}|${next.instansi}|${next.jurusan}|${next.jenisKelamin}`;
    const nextIsDefault =
      next.year === defaultYear &&
      next.month === "all" &&
      next.posisi === "" &&
      next.instansi === "" &&
      next.jurusan === "" &&
      next.jenisKelamin === "";
    setFilters(next);
    if (nextIsDefault || remoteTrend?.key === nextKey) {
      setLoadingKey(null);
    } else {
      setLoadingKey(nextKey);
    }
  };

  const resetFilters = () => {
    setLoadingKey(null);
    setFilters({
      year: defaultYear,
      month: "all",
      posisi: "",
      instansi: "",
      jurusan: "",
      jenisKelamin: "",
    });
  };

  const isFetching = !isDefaultFilter && loadingKey === filterKey;

  const activeTrend: ParticipantTrendData =
    !isDefaultFilter && remoteTrend?.key === filterKey
      ? remoteTrend.trend
      : initialTrend;

  const activeStatusSummary: ParticipantStatusSummary =
    !isDefaultFilter && remoteTrend?.key === filterKey
      ? remoteTrend.statusSummary
      : initialStatusSummary;

  const yearChoices = useMemo(() => {
    const nowYear = new Date().getFullYear();
    const detected = filterOptions.years || [];
    const maxYear = Math.max(nowYear + 2, ...detected, defaultYear);
    const minYear = Math.min(2022, ...detected, defaultYear);
    const set = new Set<number>(detected);
    for (let y = maxYear; y >= minYear; y -= 1) {
      set.add(y);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [filterOptions.years, defaultYear]);

  const showPointLabels = activeTrend.labels.length <= 14;

  const lineValueLabelsPlugin = useMemo(
    () =>
      createValueLabelsPlugin<"line">(
        "trendLineValueLabels",
        10,
        showPointLabels,
      ),
    [showPointLabels],
  );

  const barValueLabelsPlugin = useMemo(
    () =>
      createValueLabelsPlugin<"bar">(
        "trendBarValueLabels",
        7,
        showPointLabels,
      ),
    [showPointLabels],
  );

  const lineChartData: ChartData<"line"> = useMemo(
    () => ({
      labels: activeTrend.labels,
      datasets: [
        {
          label: "Jumlah Peserta",
          data: activeTrend.counts,
          borderColor: "#2563eb",
          backgroundColor: (context: ScriptableContext<"line">) => {
            const { ctx, chartArea } = context.chart;
            if (!chartArea) return "rgba(37, 99, 235, 0.16)";
            const gradient = ctx.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom,
            );
            gradient.addColorStop(0, "rgba(37, 99, 235, 0.24)");
            gradient.addColorStop(0.75, "rgba(59, 130, 246, 0.06)");
            gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
            return gradient;
          },
          fill: true,
          tension: 0.38,
          borderWidth: 3,
          pointBackgroundColor: "#2563eb",
          pointHoverBackgroundColor: "#1d4ed8",
          pointBorderColor: "#ffffff",
          pointHoverBorderColor: "#ffffff",
          pointBorderWidth: 2.5,
          pointHoverBorderWidth: 3,
          pointRadius: activeTrend.labels.length > 15 ? 3.5 : 5,
          pointHoverRadius: 7,
          pointHitRadius: 14,
        },
      ],
    }),
    [activeTrend],
  );

  const barChartData: ChartData<"bar"> = useMemo(
    () => ({
      labels: activeTrend.labels,
      datasets: [
        {
          label: "Jumlah Peserta",
          data: activeTrend.counts,
          backgroundColor: (context: ScriptableContext<"bar">) => {
            const { ctx, chartArea } = context.chart;
            if (!chartArea) return "#2563eb";
            const gradient = ctx.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom,
            );
            gradient.addColorStop(0, "#3b82f6");
            gradient.addColorStop(1, "#1d4ed8");
            return gradient;
          },
          hoverBackgroundColor: "#1e40af",
          borderWidth: 0,
          borderRadius: {
            topLeft: 10,
            topRight: 10,
            bottomLeft: 4,
            bottomRight: 4,
          },
          borderSkipped: false,
          barPercentage: 0.58,
          categoryPercentage: 0.76,
        },
      ],
    }),
    [activeTrend],
  );

  const maxCount = useMemo(
    () => Math.max(4, ...activeTrend.counts),
    [activeTrend.counts],
  );

  const sharedOptions = useMemo(() => {
    const isDark =
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark");

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index" as const,
        intersect: false,
      },
      layout: {
        padding: { top: 26, left: 6, right: 10, bottom: 2 },
      },
      animation: {
        duration: 400,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark
            ? "rgba(15, 23, 42, 0.96)"
            : "rgba(255, 255, 255, 0.98)",
          titleColor: isDark ? "#94a3b8" : "#64748b",
          bodyColor: isDark ? "#f8fafc" : "#0f172a",
          borderColor: isDark
            ? "rgba(51, 65, 85, 0.9)"
            : "rgba(226, 232, 240, 1)",
          borderWidth: 1,
          padding: 12,
          cornerRadius: 12,
          titleFont: { size: 11, weight: 600 as const },
          bodyFont: { size: 13, weight: 700 as const },
          displayColors: true,
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: true,
          callbacks: {
            title: (tooltipItems: Array<{ dataIndex?: number }>) => {
              const idx = tooltipItems[0]?.dataIndex ?? 0;
              return (
                activeTrend.fullLabels[idx] || activeTrend.labels[idx] || ""
              );
            },
            label: (ctx: { parsed: { y?: number | null } }) =>
              ` ${ctx.parsed.y ?? 0} Peserta`,
          },
        },
      },
      scales: {
        x: {
          border: { display: false },
          grid: { display: false },
          ticks: {
            color: "#64748b",
            maxRotation: 0,
            autoSkip: activeTrend.labels.length > 14,
            maxTicksLimit: activeTrend.labels.length > 14 ? 8 : 12,
            font: { size: 11.5, weight: 600 as const },
            padding: 8,
          },
        },
        y: {
          beginAtZero: true,
          suggestedMax: Math.ceil(maxCount * 1.2),
          border: { display: false },
          grid: {
            color: "rgba(148, 163, 184, 0.16)",
          },
          ticks: {
            precision: 0,
            color: "#94a3b8",
            font: { size: 11, weight: 500 as const },
            padding: 10,
          },
        },
      },
    };
  }, [activeTrend, maxCount]);

  const lineOptions = sharedOptions as ChartOptions<"line">;
  const barOptions = sharedOptions as ChartOptions<"bar">;

  const subtitlePeriod = useMemo(() => {
    const monthName =
      filters.month === "all"
        ? "Per Bulan"
        : `Bulan ${MONTH_OPTIONS.find((m) => m.value === filters.month)?.label || ""}`;
    const yearName =
      filters.year === "all" ? "Semua Tahun" : `Tahun ${filters.year}`;
    return `${monthName} • ${yearName}`;
  }, [filters.month, filters.year]);

  return (
    <div className="space-y-4">
      {/* ================= FILTER BERSAMA (DI ATAS KEDUA KARTU) ================= */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_10px_35px_-15px_rgba(15,23,42,0.08)] p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Filter Tren &amp; Status Peserta</span>
          </div>
          {!isDefaultFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5">
          <FilterSelect
            icon={<Calendar className="w-3 h-3 text-blue-500" />}
            label="Tahun"
            ariaLabel="Filter tahun"
            value={String(filters.year)}
            onChange={(val) =>
              updateFilter("year", val === "all" ? "all" : Number(val))
            }
            options={[
              { value: "all", label: "Semua Tahun" },
              ...yearChoices.map((yr) => ({
                value: String(yr),
                label: String(yr),
              })),
            ]}
          />

          <FilterSelect
            icon={<CalendarDays className="w-3 h-3 text-blue-500" />}
            label="Bulan"
            ariaLabel="Filter bulan"
            value={String(filters.month)}
            onChange={(val) =>
              updateFilter("month", val === "all" ? "all" : Number(val))
            }
            options={[
              { value: "all", label: "Semua Bulan" },
              ...MONTH_OPTIONS.map((m) => ({
                value: String(m.value),
                label: m.label,
              })),
            ]}
          />

          <FilterSelect
            icon={<Briefcase className="w-3 h-3 text-blue-500" />}
            label="Formasi"
            ariaLabel="Filter formasi"
            value={filters.posisi}
            onChange={(val) => updateFilter("posisi", val)}
            options={[
              { value: "", label: "Semua Formasi" },
              ...(filterOptions.formasiTitles || []).map((title) => ({
                value: title,
                label: title,
              })),
            ]}
          />

          <FilterSelect
            icon={<Building2 className="w-3 h-3 text-blue-500" />}
            label="Instansi"
            ariaLabel="Filter instansi"
            value={filters.instansi}
            onChange={(val) => updateFilter("instansi", val)}
            options={[
              { value: "", label: "Semua Instansi" },
              ...(filterOptions.instansiList || []).map((inst) => ({
                value: inst,
                label: inst,
              })),
            ]}
          />

          <FilterSelect
            icon={<GraduationCap className="w-3 h-3 text-blue-500" />}
            label="Jurusan"
            ariaLabel="Filter jurusan"
            value={filters.jurusan}
            onChange={(val) => updateFilter("jurusan", val)}
            options={[
              { value: "", label: "Semua Jurusan" },
              ...(filterOptions.jurusanList || []).map((jur) => ({
                value: jur,
                label: jur,
              })),
            ]}
          />

          <FilterSelect
            icon={<Users className="w-3 h-3 text-blue-500" />}
            label="Jenis Kelamin"
            ariaLabel="Filter jenis kelamin"
            value={filters.jenisKelamin}
            onChange={(val) => updateFilter("jenisKelamin", val)}
            options={[
              { value: "", label: "Semua Gender" },
              ...(
                filterOptions.jenisKelaminList?.length
                  ? filterOptions.jenisKelaminList
                  : ["Laki-laki", "Perempuan"]
              ).map((jk) => ({
                value: jk,
                label: jk,
              })),
            ]}
          />
        </div>
      </div>

      {/* ================= 70% TREN + 30% STATUS DONUT ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-5 items-stretch">
        <div className="lg:col-span-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_10px_35px_-15px_rgba(15,23,42,0.08)]">
          <div className="p-5 sm:p-7 space-y-5">
            {/* ================= HEADER ROW ================= */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/70 flex items-center justify-center text-[#2563eb] dark:text-blue-400 shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      Tren Peserta Magang
                    </h3>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-bold shadow-xs">
                      {isFetching ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Users className="w-3 h-3" />
                      )}
                      <span className="tabular-nums">
                        {activeTrend.totalUniquePeserta} Peserta
                      </span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    Jumlah peserta magang aktif & terjadwal ({subtitlePeriod})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <div
                  role="group"
                  aria-label="Pilih jenis grafik"
                  className="inline-flex items-center gap-1 p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70"
                >
                  <button
                    type="button"
                    onClick={() => setChartType("line")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                      chartType === "line"
                        ? "bg-white dark:bg-slate-900 text-[#2563eb] dark:text-blue-400 shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Garis</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartType("bar")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                      chartType === "bar"
                        ? "bg-white dark:bg-slate-900 text-[#2563eb] dark:text-blue-400 shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Batang</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ================= CHART CONTAINER ================= */}
            <div
              className={`rounded-2xl bg-slate-50/40 dark:bg-slate-950/35 border border-slate-100 dark:border-slate-800/80 p-4 sm:p-5 transition-opacity ${
                isFetching ? "opacity-60" : "opacity-100"
              }`}
            >
              <div className="h-72 sm:h-80">
                {chartType === "line" ? (
                  <Line
                    data={lineChartData}
                    options={lineOptions}
                    plugins={[lineValueLabelsPlugin]}
                  />
                ) : (
                  <Bar
                    data={barChartData}
                    options={barOptions}
                    plugins={[barValueLabelsPlugin]}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ================= STATUS PESERTA DONUT (30%) ================= */}
        <SuperadminStatusDonutCard
          statusSummary={activeStatusSummary}
          periodLabel={subtitlePeriod}
          isLoading={isFetching}
        />
      </div>
    </div>
  );
}
