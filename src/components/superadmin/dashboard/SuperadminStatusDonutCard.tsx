"use client";

import { useMemo, useState } from "react";
import { Loader2, PieChart } from "lucide-react";
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
    color: "#0077e6",
    hoverColor: "#14269e",
    dotClass: "bg-[#0077e6]",
  },
  {
    key: "selesai",
    label: "Selesai",
    color: "#1ecad3",
    hoverColor: "#0e9aa7",
    dotClass: "bg-[#1ecad3]",
  },
  {
    key: "ditolak",
    label: "Ditolak",
    color: "#e83b8a",
    hoverColor: "#be185d",
    dotClass: "bg-[#e83b8a]",
  },
  {
    key: "menunggu",
    label: "Menunggu",
    color: "#6f42c1",
    hoverColor: "#4c1d95",
    dotClass: "bg-[#6f42c1]",
  },
];

function polar(cx: number, cy: number, r: number, angleRad: number) {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function createDonutArcPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startRad: number,
  endRad: number,
): string {
  const largeArc = endRad - startRad > Math.PI ? 1 : 0;
  const oStart = polar(cx, cy, outerR, startRad);
  const oEnd = polar(cx, cy, outerR, endRad);
  const iEnd = polar(cx, cy, innerR, endRad);
  const iStart = polar(cx, cy, innerR, startRad);
  return [
    `M ${oStart.x.toFixed(2)} ${oStart.y.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${oEnd.x.toFixed(2)} ${oEnd.y.toFixed(2)}`,
    `L ${iEnd.x.toFixed(2)} ${iEnd.y.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${iStart.x.toFixed(2)} ${iStart.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

export default function SuperadminStatusDonutCard({
  statusSummary,
  periodLabel,
  isLoading = false,
}: Props) {
  const [hoveredKey, setHoveredKey] = useState<StatusKey | null>(null);

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

  const featuredKey: StatusKey | null = useMemo(() => {
    if (segments.length === 0) return null;
    return segments.reduce(
      (best, seg) => (seg.count > best.count ? seg : best),
      segments[0],
    ).key;
  }, [segments]);

  const protrudingKey = hoveredKey ?? featuredKey;

  const orderedSegments = useMemo(() => {
    if (!protrudingKey) return segments;
    return [
      ...segments.filter((s) => s.key !== protrudingKey),
      ...segments.filter((s) => s.key === protrudingKey),
    ];
  }, [segments, protrudingKey]);

  const activeSegment =
    segments.find((s) => s.key === hoveredKey) ?? null;

  const cx = 120;
  const cy = 120;
  const innerR = 52;
  const outerR = 88;
  const labelR = (innerR + outerR) / 2;

  return (
    <div
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
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin text-blue-500 shrink-0" />
        )}
      </div>

      {/* Interactive Exploding Donut + Legend */}
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
                      transform: isActive ? "scale(1.03)" : "scale(1)",
                      transformOrigin: `${cx}px ${cy}px`,
                      filter: isActive
                        ? "drop-shadow(0px 10px 14px rgba(15, 23, 42, 0.22))"
                        : "none",
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
                      fontSize="11.5"
                      fontWeight="700"
                      className="pointer-events-none"
                    >
                      100%
                    </text>
                  </g>
                );
              })()
            ) : (
              orderedSegments.map((seg) => {
                const isProtruding = protrudingKey === seg.key;
                const popDist = isProtruding ? 5 : 0;
                const dx = popDist * Math.cos(seg.midRad);
                const dy = popDist * Math.sin(seg.midRad);
                const rIn = isProtruding ? innerR - 2 : innerR;
                const rOut = isProtruding ? outerR + 16 : outerR;
                const rLabel = (rIn + rOut) / 2;
                const pathD = createDonutArcPath(
                  cx,
                  cy,
                  rIn,
                  rOut,
                  seg.startRad,
                  seg.endRad,
                );
                const labelPos = polar(cx, cy, rLabel, seg.midRad);
                const showPctLabel = seg.sweep >= 0.4;

                return (
                  <g
                    key={seg.key}
                    onMouseEnter={() => setHoveredKey(seg.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                    className="cursor-pointer transition-all duration-200 ease-out"
                    style={{
                      transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px)`,
                      filter: isProtruding
                        ? "drop-shadow(0px 8px 16px rgba(15, 23, 42, 0.25))"
                        : "none",
                    }}
                  >
                    <path
                      d={pathD}
                      fill={isProtruding ? seg.hoverColor : seg.color}
                      className="transition-colors duration-200"
                    />
                    {showPctLabel && (
                      <text
                        x={labelPos.x}
                        y={labelPos.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        fontSize="11"
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

          {/* Center Total / Active Hint */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums leading-none">
              {activeSegment ? activeSegment.count : total}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate max-w-[90px]">
              {activeSegment ? activeSegment.label : "Total"}
            </span>
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
