import React from "react";
import Skeleton from "@/components/ui/Skeleton";

export default function SuperAdminDashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* HEADER SKELETON */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 sm:h-9 w-60 rounded-xl" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-48 rounded-lg" />
        </div>
      </div>

      {/* 6 METRIC CARDS SKELETON */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-2xl p-5 bg-white/90 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-6 w-12 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-2.5 w-24 rounded pt-1" />
          </div>
        ))}
      </div>

      {/* CHART SECTION SKELETON */}
      <div className="rounded-2xl bg-white/90 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
        {/* Chart Header & Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-48 rounded-lg" />
            <Skeleton className="h-3.5 w-64 rounded" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>

        {/* Chart Simulated Area */}
        <div className="h-80 w-full flex items-end justify-between gap-3 px-4 pt-8 pb-4">
          {[40, 65, 80, 50, 90, 75, 45, 60, 85, 70, 95, 55].map((height, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <Skeleton
                className="w-full rounded-t-lg transition-all"
                style={{ height: `${height}%` }}
              />
              <Skeleton className="h-3 w-6 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* 2 BREAKDOWN CARDS SKELETON */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((card) => (
          <div
            key={card}
            className="rounded-2xl bg-white/90 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5"
          >
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-40 rounded-lg" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>

            <div className="flex items-center justify-center py-6">
              <Skeleton className="w-44 h-44 rounded-full ring-8 ring-slate-100 dark:ring-slate-800/40" />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-4 w-12 rounded" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-4 w-12 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* OVERVIEW TABLE SKELETON */}
      <div className="rounded-2xl bg-white/90 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-52 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>

        <div className="space-y-3 pt-2">
          <div className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-lg flex items-center px-4 gap-4">
            <Skeleton className="h-4 w-12 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-24 rounded ml-auto" />
          </div>

          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="h-14 border-b border-slate-100 dark:border-slate-800/60 flex items-center px-4 gap-4"
            >
              <Skeleton className="h-4 w-8 rounded" />
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-6 w-20 rounded-full ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

