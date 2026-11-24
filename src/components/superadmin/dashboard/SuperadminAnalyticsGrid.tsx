"use client";

import { useMemo, useState } from "react";
import { type ChartData, type ChartOptions, type Plugin } from "chart.js";
import { Bar } from "react-chartjs-2";
import {
  Award,
  BarChart3,
  CalendarClock,
  Star,
  Users,
} from "lucide-react";
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

type Props = {
  surveyIndicators: SuperadminDashboardSummary["surveyIndicators"];
  nilaiBuckets: SuperadminDashboardSummary["nilaiBuckets"];
  demographics: SuperadminDashboardSummary["demographics"];
  perkiraanSelesai: SuperadminDashboardSummary["perkiraanSelesai"];
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

export default function SuperadminAnalyticsGrid({
  surveyIndicators,
  nilaiBuckets,
  demographics,
  perkiraanSelesai,
}: Props) {
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

  const instansiValuePlugin: Plugin<"bar"> = useMemo(
    () => ({
      id: "instansiBarValueLabels",
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
    }),
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

  const nilaiChartData: ChartData<"bar"> = useMemo(
    () => ({
      labels: nilaiBuckets.map((b) => b.label),
      datasets: [
        {
          label: "Jumlah Peserta",
          data: nilaiBuckets.map((b) => b.count),
          backgroundColor: [
            "rgba(16, 185, 129, 0.85)",
            "rgba(2, 132, 199, 0.85)",
            "rgba(245, 158, 11, 0.85)",
            "rgba(244, 63, 94, 0.85)",
          ],
          borderRadius: 6,
        },
      ],
    }),
    [nilaiBuckets],
  );

  const simpleBarOptions: ChartOptions<"bar"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, ticks: { precision: 0 } },
      },
    }),
    [],
  );

  const demographicRows = useMemo(() => {
    const groups = [
      ...demographics.kategori.map((k) => ({
        group: "Kategori",
        label: k.label,
        count: k.count,
        color: "rgba(2, 132, 199, 0.85)",
      })),
      ...demographics.asalJenis.map((a) => ({
        group: "Jenjang",
        label: a.label,
        count: a.count,
        color: "rgba(16, 185, 129, 0.85)",
      })),
      ...demographics.gender.map((g) => ({
        group: "Gender",
        label: g.label,
        count: g.count,
        color: "rgba(99, 102, 241, 0.85)",
      })),
    ];
    return groups;
  }, [demographics]);

  const demographicBarData: ChartData<"bar"> = useMemo(
    () => ({
      labels: demographicRows.map((d) => `${d.group}: ${d.label}`),
      datasets: [
        {
          label: "Peserta",
          data: demographicRows.map((d) => d.count),
          backgroundColor: demographicRows.map((d) => d.color),
          borderRadius: 5,
        },
      ],
    }),
    [demographicRows],
  );

  const selesaiBarData: ChartData<"bar"> = useMemo(
    () => ({
      labels: perkiraanSelesai.map((s) => s.periode),
      datasets: [
        {
          label: "Peserta Selesai",
          data: perkiraanSelesai.map((s) => s.count),
          backgroundColor: "rgba(16, 185, 129, 0.85)",
          borderRadius: 6,
        },
      ],
    }),
    [perkiraanSelesai],
  );

  const surveyList = [
    { label: "Kepuasan Program Magang", score: surveyIndicators.kepuasanMagang },
    {
      label: "Rekomendasi Program",
      score: surveyIndicators.rekomendasiProgram,
    },
    { label: "Kemudahan Proses", score: surveyIndicators.kemudahanProses },
    { label: "Peningkatan Kompetensi", score: surveyIndicators.peningkatanSkill },
  ];

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

      {/* Row 2: Kualitas Magang (Survei + Distribusi Nilai) & Demografi + Perkiraan Selesai */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Survei Kepuasan + Nilai Akhir */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                Indikator Survei &amp; Nilai
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Skor rata-rata kepuasan (1–5) &amp; predikat nilai akhir
              </p>
            </div>
            <Award className="w-5 h-5 text-[#0284c7]" />
          </div>

          <div className="space-y-2.5">
            {surveyList.map((ind) => (
              <div key={ind.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {ind.label}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                    {ind.score.toFixed(2)} / 5
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${Math.min(100, (ind.score / 5) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
              Sebaran Nilai Akhir Peserta
            </p>
            <div className="h-36">
              <Bar data={nilaiChartData} options={simpleBarOptions} />
            </div>
          </div>
        </div>

        {/* Demografi Gabungan (Horizontal Bar) */}
        <ChartCard
          title="Demografi Peserta (Kategori, Asal & Gender)"
          subtitle="Perbandingan Reguler vs PKPA, Universitas vs SMK, dan Gender"
          icon={<Users className="w-4 h-4 text-indigo-500" />}
          isEmpty={demographicRows.length === 0}
          heightClass="h-72"
        >
          <Bar
            data={demographicBarData}
            options={{
              indexAxis: "y",
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { beginAtZero: true, ticks: { precision: 0 } },
                y: { grid: { display: false } },
              },
            }}
          />
        </ChartCard>

        {/* Perkiraan Selesai (Kuartal) */}
        <ChartCard
          title="Jadwal Selesai Magang (Kuartal)"
          subtitle="Estimasi peserta selesai untuk persiapan surat & sertifikat"
          icon={<CalendarClock className="w-4 h-4 text-emerald-500" />}
          isEmpty={perkiraanSelesai.length === 0}
          heightClass="h-72"
        >
          <Bar data={selesaiBarData} options={simpleBarOptions} />
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  icon,
  isEmpty,
  heightClass = "h-64",
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  isEmpty: boolean;
  heightClass?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {icon}
            <span>{title}</span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        </div>
        <BarChart3 className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
      </div>

      <div className={heightClass}>
        {isEmpty ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            Belum ada data untuk ditampilkan pada filter ini.
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
