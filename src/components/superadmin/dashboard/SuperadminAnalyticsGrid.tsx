"use client";

import { useMemo, useState } from "react";
import { type ChartData, type ChartOptions, type Plugin } from "chart.js";
import { Bar } from "react-chartjs-2";
import { Briefcase, Users, UsersRound } from "lucide-react";
import type { SuperadminDashboardSummary } from "./types";

type LimitChoice = 5 | 10 | "all";

const BAR_PALETTE = [
  "#1d6ef5",
  "#10b981",
  "#7c3aed",
  "#f59e0b",
  "#ef4444",
  "#14b8a6",
  "#06b6d4",
  "#ec4899",
  "#8b5cf6",
  "#f97316",
];

const INSTANSI_PALETTE = [
  "#1d6ef5",
  "#10b981",
  "#7c3aed",
  "#f59e0b",
  "#14b8a6",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#8b5cf6",
  "#64748b",
];

const FUNNEL_GRADIENTS: Array<{ id: string; start: string; end: string }> = [
  { id: "funnel-blue", start: "#2563eb", end: "#0284c7" },
  { id: "funnel-purple", start: "#7c3aed", end: "#6d28d9" },
  { id: "funnel-pink", start: "#ec4899", end: "#db2777" },
  { id: "funnel-amber", start: "#fb923c", end: "#ea580c" },
  { id: "funnel-green", start: "#22c55e", end: "#059669" },
];

function createFunnelTrapezoidPath(
  cx: number,
  topW: number,
  botW: number,
  h: number,
  r = 5,
): string {
  const xTL = cx - topW / 2;
  const xTR = cx + topW / 2;
  const xBR = cx + botW / 2;
  const xBL = cx - botW / 2;
  return [
    `M ${xTL + r} 0`,
    `L ${xTR - r} 0`,
    `Q ${xTR} 0 ${xTR - r * 0.25} ${r}`,
    `L ${xBR + r * 0.25} ${h - r}`,
    `Q ${xBR} ${h} ${xBR - r} ${h}`,
    `L ${xBL + r} ${h}`,
    `Q ${xBL} ${h} ${xBL - r * 0.25} ${h - r}`,
    `L ${xTL + r * 0.25} ${r}`,
    `Q ${xTL} 0 ${xTL + r} 0`,
    "Z",
  ].join(" ");
}

function polarPoint(cx: number, cy: number, radius: number, angleRad: number) {
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function createPieWedgePath(
  cx: number,
  cy: number,
  radius: number,
  startRad: number,
  endRad: number,
): string {
  const start = polarPoint(cx, cy, radius, startRad);
  const end = polarPoint(cx, cy, radius, endRad);
  const largeArc = endRad - startRad > Math.PI ? 1 : 0;
  return [
    `M ${cx} ${cy}`,
    `L ${start.x.toFixed(2)} ${start.y.toFixed(2)}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

type Props = {
  demographics: SuperadminDashboardSummary["demographics"];
};

function TopLimitSelect({
  ariaLabel,
  value,
  onChange,
}: {
  ariaLabel: string;
  value: LimitChoice;
  onChange: (next: LimitChoice) => void;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={String(value)}
      onChange={(e) => {
        const raw = e.target.value;
        onChange(raw === "all" ? "all" : (Number(raw) as 5 | 10));
      }}
      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs focus:outline-none focus:border-blue-400 cursor-pointer"
    >
      <option value="5">Top 5</option>
      <option value="10">Top 10</option>
      <option value="all">Semua</option>
    </select>
  );
}

function createBarValueLabelsPlugin(id: string): Plugin<"bar"> {
  return {
    id,
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      const meta = chart.getDatasetMeta(0);
      if (!meta?.data) return;

      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      const isDark = document.documentElement.classList.contains("dark");
      ctx.font = "700 12px Inter, ui-sans-serif, system-ui, sans-serif";
      ctx.fillStyle = isDark ? "#e2e8f0" : "#0f172a";

      meta.data.forEach((barEl, idx) => {
        const val = chart.data.datasets[0]?.data?.[idx];
        if (typeof val !== "number") return;
        const pos = barEl.tooltipPosition(true);
        if (pos.x == null) return;
        ctx.fillText(String(val), pos.x, barEl.y - 6);
      });

      ctx.restore();
    },
  };
}

export default function SuperadminAnalyticsGrid({ demographics }: Props) {
  const [prodiLimit, setProdiLimit] = useState<LimitChoice>(5);
  const [instansiLimit, setInstansiLimit] = useState<LimitChoice>(5);

  const prodiListRaw = useMemo(
    () => demographics.jurusanBreakdown ?? [],
    [demographics.jurusanBreakdown],
  );

  const instansiListRaw = useMemo(
    () => demographics.instansiBreakdown ?? demographics.topAsalNama ?? [],
    [demographics.instansiBreakdown, demographics.topAsalNama],
  );

  const prodiTotal = useMemo(
    () => prodiListRaw.reduce((sum, item) => sum + item.count, 0),
    [prodiListRaw],
  );

  const prodiDisplayRows = useMemo(() => {
    if (prodiListRaw.length === 0) return [];
    const cap = prodiLimit === "all" ? prodiListRaw.length : prodiLimit;
    const sliced = prodiListRaw.slice(0, cap).map((item, idx) => ({
      label: item.label,
      count: item.count,
      color: BAR_PALETTE[idx % BAR_PALETTE.length],
      pct: prodiTotal > 0 ? Math.round((item.count / prodiTotal) * 100) : 0,
    }));

    if (prodiLimit !== "all" && prodiListRaw.length > cap) {
      const othersSum = prodiListRaw
        .slice(cap)
        .reduce((sum, item) => sum + item.count, 0);
      if (othersSum > 0) {
        sliced.push({
          label: "Lainnya",
          count: othersSum,
          color: "#94a3b8",
          pct:
            prodiTotal > 0 ? Math.round((othersSum / prodiTotal) * 100) : 0,
        });
      }
    }
    return sliced;
  }, [prodiListRaw, prodiLimit, prodiTotal]);

  const maxProdiCount = useMemo(
    () => Math.max(1, ...prodiDisplayRows.map((r) => r.count)),
    [prodiDisplayRows],
  );

  const instansiTotal = useMemo(
    () => instansiListRaw.reduce((sum, item) => sum + item.count, 0),
    [instansiListRaw],
  );

  const instansiDisplayRows = useMemo(() => {
    if (instansiListRaw.length === 0) return [];
    const cap = instansiLimit === "all" ? instansiListRaw.length : instansiLimit;
    return instansiListRaw.slice(0, cap);
  }, [instansiListRaw, instansiLimit]);

  const instansiValuePlugin = useMemo(
    () => createBarValueLabelsPlugin("instansiBarValueLabels"),
    [],
  );

  const instansiChartData: ChartData<"bar"> = useMemo(
    () => ({
      labels: instansiDisplayRows.map((item) =>
        item.nama.length > 16 ? `${item.nama.slice(0, 15)}…` : item.nama,
      ),
      datasets: [
        {
          label: "Jumlah Peserta",
          data: instansiDisplayRows.map((item) => item.count),
          backgroundColor: instansiDisplayRows.map(
            (_, idx) => INSTANSI_PALETTE[idx % INSTANSI_PALETTE.length],
          ),
          borderWidth: 0,
          borderRadius: {
            topLeft: 8,
            topRight: 8,
            bottomLeft: 3,
            bottomRight: 3,
          },
          borderSkipped: false,
          barPercentage: 0.56,
          categoryPercentage: 0.72,
        },
      ],
    }),
    [instansiDisplayRows],
  );

  const maxInstansiCount = useMemo(
    () => Math.max(4, ...instansiDisplayRows.map((r) => r.count)),
    [instansiDisplayRows],
  );

  const instansiChartOptions: ChartOptions<"bar"> = useMemo(() => {
    const isDark =
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark");

    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { top: 24, left: 4, right: 4, bottom: 0 },
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
          padding: 10,
          cornerRadius: 10,
          callbacks: {
            title: (tooltipItems) => {
              const idx = tooltipItems[0]?.dataIndex ?? 0;
              return instansiDisplayRows[idx]?.nama || "";
            },
            label: (ctx) => {
              const count = Number(ctx.parsed.y || 0);
              const pct =
                instansiTotal > 0
                  ? Math.round((count / instansiTotal) * 100)
                  : 0;
              return ` ${count} Peserta (${pct}%)`;
            },
          },
        },
      },
      scales: {
        x: {
          border: { display: false },
          grid: { display: false },
          ticks: {
            color: "#64748b",
            font: { size: 11, weight: 600 },
            maxRotation: 0,
            padding: 6,
          },
        },
        y: {
          beginAtZero: true,
          suggestedMax: Math.ceil(maxInstansiCount * 1.2),
          border: { display: false },
          grid: {
            color: "rgba(148, 163, 184, 0.16)",
          },
          ticks: {
            precision: 0,
            color: "#94a3b8",
            font: { size: 11 },
            padding: 8,
          },
        },
      },
    };
  }, [instansiDisplayRows, instansiTotal, maxInstansiCount]);

  // Row 2 Card 1: Formasi Paling Diminati (Top 5 Funnel)
  const formasiDemandList = useMemo(
    () => (demographics.formasiDemand ?? []).slice(0, 5),
    [demographics.formasiDemand],
  );
  const formasiDemandTotal = useMemo(
    () =>
      (demographics.formasiDemand ?? []).reduce(
        (sum, item) => sum + item.count,
        0,
      ),
    [demographics.formasiDemand],
  );

  // Row 2 Card 2: Jumlah Peserta Individu vs Kelompok (Exploded Striped Pie)
  const tipeRows = useMemo(() => {
    const raw = demographics.tipePeserta ?? [];
    const indCount =
      raw.find((r) => r.label.toLowerCase() === "individu")?.count ?? 0;
    const kelCount =
      raw.find((r) => r.label.toLowerCase() === "kelompok")?.count ?? 0;
    const total = indCount + kelCount;
    const indPct = total > 0 ? Math.round((indCount / total) * 100) : 0;
    const kelPct = total > 0 ? Math.max(0, 100 - indPct) : 0;
    return {
      total,
      indCount,
      kelCount,
      indPct,
      kelPct,
      items: [
        {
          label: "Individu",
          count: indCount,
          color: "#2563eb",
          dotClass: "bg-[#2563eb]",
          pct: indPct,
        },
        {
          label: "Kelompok",
          count: kelCount,
          color: "#10b981",
          dotClass: "bg-[#10b981]",
          pct: kelPct,
        },
      ],
    };
  }, [demographics.tipePeserta]);

  // Row 2 Card 3: Gender Peserta (Overlapping Proportional Bubbles + Progress Bars)
  const genderSummary = useMemo(() => {
    const map = new Map<string, number>();
    for (const g of demographics.gender ?? []) {
      const k = g.label.trim().toLowerCase();
      map.set(k, (map.get(k) || 0) + g.count);
    }
    const male = map.get("laki-laki") ?? 0;
    const female = map.get("perempuan") ?? 0;
    const total = male + female;
    const maxCount = Math.max(1, male, female);

    const calcDiameter = (count: number) =>
      total === 0 ? 92 : Math.round(76 + (count / maxCount) * 56);

    const maleIsLargest = male >= female;

    const rawItems = [
      {
        label: "Laki-laki",
        count: male,
        color: maleIsLargest ? "#4350f6" : "#93b4ff",
        isDarkBg: maleIsLargest,
        pctNum: total > 0 ? Math.round((male / total) * 100) : 0,
        diameter: calcDiameter(male),
      },
      {
        label: "Perempuan",
        count: female,
        color: !maleIsLargest ? "#4350f6" : "#93b4ff",
        isDarkBg: !maleIsLargest,
        pctNum: total > 0 ? Math.round((female / total) * 100) : 0,
        diameter: calcDiameter(female),
      },
    ];

    const bubbles = [...rawItems].sort((a, b) => b.count - a.count);

    return {
      total,
      items: rawItems,
      bubbles,
    };
  }, [demographics.gender]);

  return (
    <div className="space-y-6">
      {/* Row 1: Peserta Berdasarkan Program Studi & Peserta Berdasarkan Instansi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Peserta Berdasarkan Program Studi */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-[0_10px_35px_-15px_rgba(15,23,42,0.08)] flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              Peserta Berdasarkan Program Studi
            </h3>
            <TopLimitSelect
              ariaLabel="Batasi jumlah program studi"
              value={prodiLimit}
              onChange={setProdiLimit}
            />
          </div>

          {prodiDisplayRows.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-slate-400">
              Belum ada data program studi peserta.
            </div>
          ) : (
            <div className="space-y-4 my-auto py-1">
              {prodiDisplayRows.map((row) => {
                const widthPct = Math.max(
                  5,
                  Math.round((row.count / maxProdiCount) * 76),
                );
                return (
                  <div
                    key={row.label}
                    className="flex items-center gap-3 sm:gap-4"
                  >
                    <span
                      title={row.label}
                      className="w-32 sm:w-44 shrink-0 text-xs sm:text-[13px] font-medium text-slate-700 dark:text-slate-200 truncate"
                    >
                      {row.label}
                    </span>

                    <div className="flex-1 min-w-0 flex items-center">
                      <div
                        className="h-5 rounded-md transition-all duration-300 shrink-0"
                        style={{
                          width: `${widthPct}%`,
                          backgroundColor: row.color,
                        }}
                      />
                      <span className="ml-3 text-xs sm:text-[13px] whitespace-nowrap tabular-nums">
                        <strong className="font-extrabold text-slate-900 dark:text-white">
                          {row.count}
                        </strong>{" "}
                        <span className="text-slate-400 font-medium">
                          ({row.pct}%)
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Card: Peserta Berdasarkan Instansi */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-[0_10px_35px_-15px_rgba(15,23,42,0.08)] flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              Peserta Berdasarkan Instansi
            </h3>
            <TopLimitSelect
              ariaLabel="Batasi jumlah instansi"
              value={instansiLimit}
              onChange={setInstansiLimit}
            />
          </div>

          <div className="h-60 sm:h-64">
            {instansiDisplayRows.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Belum ada data instansi peserta.
              </div>
            ) : (
              <Bar
                data={instansiChartData}
                options={instansiChartOptions}
                plugins={[instansiValuePlugin]}
              />
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Minimalist Modern Trio (Formasi Diminati | Individu vs Kelompok | Gender) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Kiri: Formasi Paling Diminati (Funnel Chart) */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-[0_10px_35px_-15px_rgba(15,23,42,0.08)] flex flex-col justify-between space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/70 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                Formasi Paling Diminati
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Peringkat teratas jumlah pendaftar per formasi
              </p>
            </div>
          </div>

          {formasiDemandList.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400">
              Belum ada data peminat formasi.
            </div>
          ) : (
            <div className="space-y-1.5 my-auto">
              {formasiDemandList.map((row, idx) => {
                const n = formasiDemandList.length;
                const maxW = 132;
                const minW = 50;
                const step = (maxW - minW) / Math.max(1, n);
                const topW = maxW - idx * step;
                const botW = Math.max(minW, maxW - (idx + 0.82) * step);
                const grad = FUNNEL_GRADIENTS[idx % FUNNEL_GRADIENTS.length];
                const pct =
                  formasiDemandTotal > 0
                    ? Math.round((row.count / formasiDemandTotal) * 100)
                    : 0;
                const pathD = createFunnelTrapezoidPath(68, topW, botW, 38, 5);

                return (
                  <div
                    key={row.label}
                    className="flex items-center gap-2 group"
                  >
                    {/* Funnel Trapezoid Tier */}
                    <div className="w-[122px] sm:w-[136px] shrink-0 flex items-center justify-center">
                      <svg
                        viewBox="0 0 136 38"
                        className="w-full h-9 drop-shadow-2xs transition-transform duration-200 group-hover:scale-[1.03]"
                        role="img"
                        aria-label={`${row.label}: ${row.count} pendaftar`}
                      >
                        <defs>
                          <linearGradient
                            id={`${grad.id}-${idx}`}
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                          >
                            <stop offset="0%" stopColor={grad.start} />
                            <stop offset="100%" stopColor={grad.end} />
                          </linearGradient>
                        </defs>
                        <path
                          d={pathD}
                          fill={`url(#${grad.id}-${idx})`}
                        />
                        <text
                          x="68"
                          y="20"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#ffffff"
                          fontSize="11"
                          fontWeight="700"
                        >
                          {pct}%
                        </text>
                      </svg>
                    </div>

                    {/* Horizontal Connector Line */}
                    <div className="relative w-4 sm:w-5 shrink-0 flex items-center">
                      <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0 -ml-0.5" />
                    </div>

                    {/* Label & Count */}
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                      <span
                        title={row.label}
                        className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate"
                      >
                        {row.label}
                      </span>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white tabular-nums shrink-0">
                        {row.count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Tengah: Jumlah Peserta Individu vs Kelompok (Exploded Striped Pie) */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-[0_10px_35px_-15px_rgba(15,23,42,0.08)] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/70 flex items-center justify-center text-[#2563eb] dark:text-blue-400 shrink-0">
                <UsersRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Peserta Individu vs Kelompok
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Proporsi jalur pendaftaran peserta
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-400 tabular-nums">
              {tipeRows.total} Total
            </span>
          </div>

          <div className="my-auto flex items-center justify-center">
            {tipeRows.total === 0 ? (
              <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                Belum ada data peserta.
              </div>
            ) : (
              (() => {
                const cx = 130;
                const cy = 98;
                const r = 60;
                const { indCount, kelCount, total, indPct, kelPct } = tipeRows;

                const renderCallout = (
                  originX: number,
                  originY: number,
                  angle: number,
                  pctText: string,
                  colorClass: string,
                ) => {
                  const pStart = polarPoint(originX, originY, r + 1, angle);
                  const pTip = polarPoint(originX, originY, r + 18, angle);
                  const pLabel = polarPoint(originX, originY, r + 26, angle);
                  const cos = Math.cos(angle);
                  const anchor =
                    cos > 0.25 ? "start" : cos < -0.25 ? "end" : "middle";
                  const b1 = {
                    x: pTip.x - 5.5 * Math.cos(angle - 0.55),
                    y: pTip.y - 5.5 * Math.sin(angle - 0.55),
                  };
                  const b2 = {
                    x: pTip.x - 5.5 * Math.cos(angle + 0.55),
                    y: pTip.y - 5.5 * Math.sin(angle + 0.55),
                  };
                  return (
                    <g className={colorClass}>
                      <line
                        x1={pStart.x}
                        y1={pStart.y}
                        x2={pTip.x}
                        y2={pTip.y}
                        stroke="currentColor"
                        strokeWidth={1.6}
                        strokeLinecap="round"
                      />
                      <path
                        d={`M ${b1.x} ${b1.y} L ${pTip.x} ${pTip.y} L ${b2.x} ${b2.y}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.6}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <text
                        x={pLabel.x}
                        y={pLabel.y}
                        textAnchor={anchor}
                        dominantBaseline="central"
                        fontSize="12"
                        fontWeight="800"
                        fill="currentColor"
                      >
                        {pctText}
                      </text>
                    </g>
                  );
                };

                const bothPositive = indCount > 0 && kelCount > 0;
                const kelStart = -Math.PI / 2;
                const kelSweep = (kelCount / total) * Math.PI * 2;
                const kelEnd = kelStart + kelSweep;
                const kelMid = (kelStart + kelEnd) / 2;
                const kelCenter = bothPositive
                  ? polarPoint(cx, cy, 6.5, kelMid)
                  : { x: cx, y: cy };

                const indStart = kelEnd;
                const indEnd = kelStart + Math.PI * 2;
                const indMid = (indStart + indEnd) / 2;

                return (
                  <svg
                    viewBox="0 0 260 198"
                    className="w-full max-w-[260px] h-48 overflow-visible"
                    role="img"
                    aria-label={`Individu ${indPct}%, Kelompok ${kelPct}%`}
                  >
                    <defs>
                      <pattern
                        id="individu-diagonal-stripes"
                        width="7"
                        height="7"
                        patternTransform="rotate(38)"
                        patternUnits="userSpaceOnUse"
                      >
                        <rect width="7" height="7" fill="#1d4ed8" />
                        <line
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="7"
                          stroke="#3b82f6"
                          strokeWidth="2.4"
                        />
                      </pattern>
                    </defs>

                    {!bothPositive ? (
                      indCount > 0 ? (
                        <g>
                          <circle
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="url(#individu-diagonal-stripes)"
                          />
                          {renderCallout(
                            cx,
                            cy,
                            (3 * Math.PI) / 4,
                            "100%",
                            "text-[#1d4ed8] dark:text-blue-400",
                          )}
                        </g>
                      ) : (
                        <g>
                          <circle
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="#ecfdf5"
                            stroke="#10b981"
                            strokeWidth={2}
                          />
                          {renderCallout(
                            cx,
                            cy,
                            -Math.PI / 4,
                            "100%",
                            "text-[#059669] dark:text-emerald-400",
                          )}
                        </g>
                      )
                    ) : (
                      <>
                        {/* Blue Striped Wedge: Individu */}
                        <path
                          d={createPieWedgePath(cx, cy, r, indStart, indEnd)}
                          fill="url(#individu-diagonal-stripes)"
                        />

                        {/* Exploded Emerald-Outlined Wedge: Kelompok */}
                        <path
                          d={createPieWedgePath(
                            kelCenter.x,
                            kelCenter.y,
                            r,
                            kelStart,
                            kelEnd,
                          )}
                          fill="#ecfdf5"
                          stroke="#10b981"
                          strokeWidth={2}
                          strokeLinejoin="round"
                        />

                        {/* Callout Arrows */}
                        {renderCallout(
                          cx,
                          cy,
                          indMid,
                          `${indPct}%`,
                          "text-[#1d4ed8] dark:text-blue-400",
                        )}
                        {renderCallout(
                          kelCenter.x,
                          kelCenter.y,
                          kelMid,
                          `${kelPct}%`,
                          "text-[#059669] dark:text-emerald-400",
                        )}
                      </>
                    )}
                  </svg>
                );
              })()
            )}
          </div>

          <div className="flex items-center justify-center gap-6 pt-2 border-t border-slate-100 dark:border-slate-800">
            {tipeRows.items.map((item) => (
              <div
                key={item.label}
                className="inline-flex items-center gap-2 text-xs"
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.dotClass}`}
                />
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {item.label}
                </span>
                <span className="font-bold text-slate-400 tabular-nums">
                  ({item.count})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Kanan: Peserta Berdasarkan Gender (Overlapping Bubbles) */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-[0_10px_35px_-15px_rgba(15,23,42,0.08)] flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Gender Peserta
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Proporsi laki-laki &amp; perempuan
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-400 tabular-nums">
              {genderSummary.total} Total
            </span>
          </div>

          {/* Overlapping Proportional Bubbles */}
          <div className="flex items-center justify-center py-2 min-h-[146px]">
            {genderSummary.bubbles.map((bubble, idx) => (
              <div
                key={bubble.label}
                title={`${bubble.label}: ${bubble.count} peserta (${bubble.pctNum}%)`}
                style={{
                  width: `${bubble.diameter}px`,
                  height: `${bubble.diameter}px`,
                  backgroundColor: bubble.color,
                }}
                className={`rounded-full flex flex-col items-center justify-center select-none transition-transform duration-200 hover:scale-[1.03] ${
                  idx === 1
                    ? "-ml-5 z-10 ring-[5px] ring-white dark:ring-slate-900"
                    : "z-0"
                }`}
              >
                <span
                  className={`text-2xl sm:text-[26px] font-extrabold tracking-tight tabular-nums leading-none ${
                    bubble.isDarkBg ? "text-white" : "text-slate-900"
                  }`}
                >
                  {bubble.count}
                </span>
              </div>
            ))}
          </div>

          {/* Minimalist Progress Bars */}
          <div className="space-y-3 pt-1">
            {genderSummary.items.map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {item.label}
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                    {item.pctNum}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(item.count > 0 ? 4 : 0, item.pctNum)}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
