"use client";

import React from "react";

export interface HorseshoeSegmentItem {
  label: string;
  value: number;
  color: string;
}

interface HorseshoeProgressCardProps {
  title: string;
  badgeText?: string;
  percentage: number;
  subtitle: string;
  maxTotal: number;
  segments: [HorseshoeSegmentItem, HorseshoeSegmentItem, HorseshoeSegmentItem];
}

const CX = 110;
const CY = 104;
const RADIUS = 74;
const START_ANGLE_DEG = 155;
const END_ANGLE_DEG = 25;
const SWEEP_DEG = 230;
const TOTAL_ARC_LENGTH = (SWEEP_DEG / 360) * 2 * Math.PI * RADIUS;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

const START_POINT = polarToCartesian(CX, CY, RADIUS, START_ANGLE_DEG);
const END_POINT = polarToCartesian(CX, CY, RADIUS, END_ANGLE_DEG);
const ARC_PATH = `M ${START_POINT.x.toFixed(2)} ${START_POINT.y.toFixed(2)} A ${RADIUS} ${RADIUS} 0 1 1 ${END_POINT.x.toFixed(2)} ${END_POINT.y.toFixed(2)}`;

/**
 * Single horseshoe semi-circular progress chart displaying three segments
 * stacked sequentially along a rounded gauge track with a 3-column summary below.
 */
export function HorseshoeProgressCard({
  title,
  badgeText,
  percentage,
  subtitle,
  maxTotal,
  segments,
}: HorseshoeProgressCardProps) {
  const [seg1, seg2, seg3] = segments;
  const safeDenominator = Math.max(
    1,
    maxTotal,
    seg1.value + seg2.value + seg3.value,
  );
  const clampedPct = Math.min(100, Math.max(0, Math.round(percentage)));

  const len1 = Math.min(1, seg1.value / safeDenominator) * TOTAL_ARC_LENGTH;
  const len12 =
    Math.min(1, (seg1.value + seg2.value) / safeDenominator) * TOTAL_ARC_LENGTH;
  const len123 =
    Math.min(1, (seg1.value + seg2.value + seg3.value) / safeDenominator) *
    TOTAL_ARC_LENGTH;

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-5 sm:p-6 shadow-2xs space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          {title}
        </h3>
        {badgeText && (
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {badgeText}
          </span>
        )}
      </div>

      {/* Horseshoe Gauge */}
      <div className="relative mx-auto w-full max-w-[260px] pt-2 pb-1 flex items-center justify-center">
        <svg
          viewBox="0 0 220 152"
          className="w-full h-auto overflow-visible"
          role="img"
          aria-label={`${title}: ${clampedPct}%`}
        >
          {/* Background track */}
          <path
            d={ARC_PATH}
            fill="none"
            strokeWidth={22}
            strokeLinecap="round"
            className="stroke-slate-100 dark:stroke-slate-700/80"
          />

          {/* Segment 3 drawn beneath 2 & 1 so each keeps a rounded end cap */}
          {seg3.value > 0 && len123 > 0 && (
            <path
              d={ARC_PATH}
              fill="none"
              stroke={seg3.color}
              strokeWidth={22}
              strokeLinecap="round"
              strokeDasharray={`${Math.min(TOTAL_ARC_LENGTH, len123).toFixed(2)} ${(TOTAL_ARC_LENGTH * 2).toFixed(2)}`}
              className="transition-all duration-700 ease-out"
            />
          )}

          {/* Segment 2 drawn beneath 1 */}
          {seg2.value > 0 && len12 > 0 && (
            <path
              d={ARC_PATH}
              fill="none"
              stroke={seg2.color}
              strokeWidth={22}
              strokeLinecap="round"
              strokeDasharray={`${Math.min(TOTAL_ARC_LENGTH, len12).toFixed(2)} ${(TOTAL_ARC_LENGTH * 2).toFixed(2)}`}
              className="transition-all duration-700 ease-out"
            />
          )}

          {/* Segment 1 */}
          {seg1.value > 0 && len1 > 0 && (
            <path
              d={ARC_PATH}
              fill="none"
              stroke={seg1.color}
              strokeWidth={22}
              strokeLinecap="round"
              strokeDasharray={`${Math.min(TOTAL_ARC_LENGTH, len1).toFixed(2)} ${(TOTAL_ARC_LENGTH * 2).toFixed(2)}`}
              className="transition-all duration-700 ease-out"
            />
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pt-6 text-center pointer-events-none">
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
            {clampedPct}%
          </span>
          <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1.5">
            {subtitle}
          </span>
        </div>
      </div>

      {/* Bottom 3 Legend Counters */}
      <div className="grid grid-cols-3 gap-2 pt-2 text-center">
        {segments.map((item) => (
          <div key={item.label} className="space-y-1 min-w-0">
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {item.value}
            </p>
            <div className="inline-flex items-center justify-center gap-1.5 max-w-full">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                {item.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
