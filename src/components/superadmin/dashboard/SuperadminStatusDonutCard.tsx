"use client";

import { useMemo, useRef, useState } from "react";
import { Loader2, PieChart } from "lucide-react";
import ChartDownloadButton from "./ChartDownloadButton";
import type { SuperadminDashboardSummary } from "./types";

type StatusSummary = SuperadminDashboardSummary["participantStatusSummary"];
type StatusKey = "aktif" | "selesai" | "ditolak" | "menunggu";

type Props = {
  statusSummary: StatusSummary;
  periodLabel?: string;
  isLoading?: boolean;
};

const STATUS_ROWS: Array<{
  key: StatusKey;
  label: string;
  color: string;
  hoverColor: string;
  dotClass: string;
}> = [
  {
    key: "aktif",
    label: "Aktif",
    color: "#2563eb",
    hoverColor: "#1d4ed8",
    dotClass: "bg-[#2563eb]",
  },
  {
    key: "selesai",
    label: "Selesai",
    color: "#10b981",
    hoverColor: "#059669",
    dotClass: "bg-[#10b981]",
  },
  {
    key: "ditolak",
    label: "Ditolak",
    color: "#f97316",
    hoverColor: "#ea580c",
    dotClass: "bg-[#f97316]",
  },
  {
    key: "menunggu",
    label: "Menunggu",
    color: "#8b5cf6",
    hoverColor: "#7c3aed",
    dotClass: "bg-[#8b5cf6]",
  },
];

function polar(cx: number, cy: number, r: number, angleRad: number) {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function createRoundedSegmentedArcPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  baseStart: number,
  baseEnd: number,
  gapPx = 7,
  cornerRadius = 7,
): string {
  const halfGap = gapPx / 2;
  const maxInnerHalf = ((baseEnd - baseStart) * innerR) * 0.35;
  const effectiveHalfGap = Math.min(halfGap, maxInnerHalf);

  const sOut = baseStart + effectiveHalfGap / outerR;
  const eOut = baseEnd - effectiveHalfGap / outerR;
  const sIn = baseStart + effectiveHalfGap / innerR;
  const eIn = baseEnd - effectiveHalfGap / innerR;

  const cr = Math.max(
    1.5,
    Math.min(
      cornerRadius,
      (outerR - innerR) * 0.38,
      ((eIn - sIn) * innerR) * 0.32,
    ),
  );

  const dOut = cr / outerR;
  const dIn = cr / innerR;
  const rOutInset = outerR - cr;
  const rInInset = innerR + cr;

  const largeArcOut = eOut - sOut - 2 * dOut > Math.PI ? 1 : 0;
  const largeArcIn = eIn - sIn - 2 * dIn > Math.PI ? 1 : 0;

  const pStartRadialOut = polar(cx, cy, rOutInset, sOut);
  const cOuterStart = polar(cx, cy, outerR, sOut);
  const pOuterArcStart = polar(cx, cy, outerR, sOut + dOut);

  const pOuterArcEnd = polar(cx, cy, outerR, eOut - dOut);
  const cOuterEnd = polar(cx, cy, outerR, eOut);
  const pEndRadialOut = polar(cx, cy, rOutInset, eOut);

  const pEndRadialIn = polar(cx, cy, rInInset, eIn);
  const cInnerEnd = polar(cx, cy, innerR, eIn);
  const pInnerArcEnd = polar(cx, cy, innerR, eIn - dIn);

  const pInnerArcStart = polar(cx, cy, innerR, sIn + dIn);
  const cInnerStart = polar(cx, cy, innerR, sIn);
  const pStartRadialIn = polar(cx, cy, rInInset, sIn);

  return [
    `M ${pStartRadialOut.x.toFixed(2)} ${pStartRadialOut.y.toFixed(2)}`,
    `Q ${cOuterStart.x.toFixed(2)} ${cOuterStart.y.toFixed(2)} ${pOuterArcStart.x.toFixed(2)} ${pOuterArcStart.y.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${largeArcOut} 1 ${pOuterArcEnd.x.toFixed(2)} ${pOuterArcEnd.y.toFixed(2)}`,
    `Q ${cOuterEnd.x.toFixed(2)} ${cOuterEnd.y.toFixed(2)} ${pEndRadialOut.x.toFixed(2)} ${pEndRadialOut.y.toFixed(2)}`,
    `L ${pEndRadialIn.x.toFixed(2)} ${pEndRadialIn.y.toFixed(2)}`,
    `Q ${cInnerEnd.x.toFixed(2)} ${cInnerEnd.y.toFixed(2)} ${pInnerArcEnd.x.toFixed(2)} ${pInnerArcEnd.y.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${largeArcIn} 0 ${pInnerArcStart.x.toFixed(2)} ${pInnerArcStart.y.toFixed(2)}`,
    `Q ${cInnerStart.x.toFixed(2)} ${cInnerStart.y.toFixed(2)} ${pStartRadialIn.x.toFixed(2)} ${pStartRadialIn.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

export default function SuperadminStatusDonutCard({
  statusSummary,
  periodLabel,
  isLoading = false,
}: Props) {
  const [hoveredKey, setHoveredKey] = useState<StatusKey | null>(null);
  const donutCardRef = useRef<HTMLDivElement>(null);

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
        const pctNum = total > 0 ? (count / total) * 100 : 0;
        const pct = pctNum.toFixed(1);
        return { ...row, count, pctNum, pct };
      }),
    [safeSummary, total],
  );

  const segments = useMemo(() => {
    if (!hasData) return [];
    const positive = legendItems.filter((item) => item.count > 0);
    return positive.reduce<
      Array<
        (typeof legendItems)[number] & {
          startRad: number;
          endRad: number;
          midRad: number;
          sweep: number;
        }
      >
    >((acc, item) => {
      const prevEnd =
        acc.length > 0 ? acc[acc.length - 1].endRad : -Math.PI / 2;
      const sweep = (item.count / total) * Math.PI * 2;
      const startRad = prevEnd;
      const endRad = startRad + sweep;
      const midRad = (startRad + endRad) / 2;
      acc.push({ ...item, startRad, endRad, midRad, sweep });
      return acc;
    }, []);
  }, [hasData, legendItems, total]);

  const activeSegment = segments.find((s) => s.key === hoveredKey) ?? null;

  const cx = 120;
  const cy = 120;
  const innerR = 60;
  const outerR = 96;
  const labelR = (innerR + outerR) / 2;

  return (
    <div
      ref={donutCardRef}
      className={`lg:col-span-3 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_10px_35px_-15px_rgba(15,23,42,0.08)] p-5 sm:p-6 flex flex-col justify-between transition-opacity ${
        isLoading ? "opacity-65" : "opacity-100"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <PieChart className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
              Status Peserta
            </h3>
            {periodLabel && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {periodLabel}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-blue-500 shrink-0" />
          )}
          <ChartDownloadButton
            targetRef={donutCardRef}
            fileName="grafik-status-peserta"
            label="Status Peserta"
          />
        </div>
      </div>

      {/* Rounded Segmented Donut + Center Disk */}
      <div className="my-auto pt-4 pb-2 flex flex-col items-center justify-center gap-5">
        <div className="relative w-52 h-52 sm:w-56 sm:h-56 shrink-0">
          <svg
            viewBox="0 0 240 240"
            className="w-full h-full overflow-visible"
            role="img"
            aria-label={`Grafik Status Peserta Total ${total}`}
          >
            {!hasData ? (
              <circle
                cx={cx}
                cy={cy}
                r={(innerR + outerR) / 2}
                fill="none"
                strokeWidth={outerR - innerR}
                className="stroke-slate-100 dark:stroke-slate-800"
              />
            ) : segments.length === 1 ? (
              (() => {
                const seg = segments[0];
                const isActive = hoveredKey === seg.key;
                return (
                  <g
                    onMouseEnter={() => setHoveredKey(seg.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                    className="cursor-pointer transition-transform duration-200 ease-out"
                    style={{
                      transform: isActive ? "scale(1.025)" : "scale(1)",
                      transformOrigin: `${cx}px ${cy}px`,
                    }}
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={(innerR + outerR) / 2}
                      fill="none"
                      stroke={isActive ? seg.hoverColor : seg.color}
                      strokeWidth={outerR - innerR}
                    />
                    <text
                      x={cx}
                      y={cy - labelR}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#ffffff"
                      fontSize="11"
                      fontWeight="700"
                      className="pointer-events-none select-none"
                    >
                      100%
                    </text>
                  </g>
                );
              })()
            ) : (
              segments.map((seg) => {
                const isActive = hoveredKey === seg.key;
                const pathD = createRoundedSegmentedArcPath(
                  cx,
                  cy,
                  innerR,
                  outerR,
                  seg.startRad,
                  seg.endRad,
                  7,
                  7,
                );
                const labelPos = polar(cx, cy, labelR, seg.midRad);
                const showPctLabel = seg.sweep >= 0.28;

                return (
                  <g
                    key={seg.key}
                    onMouseEnter={() => setHoveredKey(seg.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                    className="cursor-pointer transition-all duration-200 ease-out"
                    style={{
                      transform: isActive ? "scale(1.03)" : "scale(1)",
                      transformOrigin: `${cx}px ${cy}px`,
                      filter: isActive
                        ? "drop-shadow(0px 6px 12px rgba(15, 23, 42, 0.18))"
                        : "none",
                    }}
                  >
                    <path
                      d={pathD}
                      fill={isActive ? seg.hoverColor : seg.color}
                      className="transition-colors duration-200"
                    />
                    {showPctLabel && (
                      <text
                        x={labelPos.x}
                        y={labelPos.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="700"
                        className="pointer-events-none select-none"
                      >
                        {seg.pct}%
                      </text>
                    )}
                  </g>
                );
              })
            )}
          </svg>

          {/* Subtle Inner White Disk + Total Above Number */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-[104px] h-[104px] sm:w-[112px] sm:h-[112px] rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-[0_2px_12px_rgba(15,23,42,0.06)] flex flex-col items-center justify-center px-3 text-center">
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 truncate max-w-[84px]">
                {activeSegment ? activeSegment.label : "Total Peserta"}
              </span>
              <span className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums leading-tight mt-0.5">
                {activeSegment ? activeSegment.count : total}
              </span>
            </div>
          </div>
        </div>

        {/* Legend Rows */}
        <div className="w-full space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          {legendItems.map((item) => {
            const active = hoveredKey === item.key;
            return (
              <div
                key={item.key}
                onMouseEnter={() => setHoveredKey(item.key)}
                onMouseLeave={() => setHoveredKey(null)}
                className={`flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-xl text-xs sm:text-sm transition cursor-pointer ${
                  active
                    ? "bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700"
                    : "bg-slate-50/70 dark:bg-slate-800/40"
                }`}
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
