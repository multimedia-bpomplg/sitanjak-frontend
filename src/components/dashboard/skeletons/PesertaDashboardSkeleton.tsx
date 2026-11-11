import React from "react";
import Skeleton, { SkeletonCircle } from "@/components/ui/Skeleton";

export default function PesertaDashboardSkeleton() {
  return (
    <div className="space-y-10">
      {/* ANNOUNCEMENT BOX SKELETON */}
      <div className="rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48 rounded" />
            <Skeleton className="h-3 w-3/4 rounded" />
          </div>
        </div>
      </div>

      {/* HERO SECTION SKELETON */}
      <div className="relative overflow-hidden rounded-[2.25rem] bg-slate-900/10 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 px-8 sm:px-10 py-10 sm:py-12 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          {/* Avatar Skeleton */}
          <Skeleton className="w-24 h-24 rounded-full shrink-0 ring-4 ring-white/20" />

          {/* User info */}
          <div className="text-center sm:text-left space-y-3 flex-1">
            <Skeleton className="h-8 sm:h-9 w-64 sm:w-80 rounded-xl mx-auto sm:mx-0" />
            <Skeleton className="h-4 w-48 rounded-md mx-auto sm:mx-0" />
            <Skeleton className="h-7 w-40 rounded-full mx-auto sm:mx-0 mt-2" />
          </div>
        </div>
      </div>

      {/* COUNTDOWN & PROGRESS BAR SKELETON */}
      <div className="px-2 sm:px-0">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-2">
              <Skeleton className="h-3 w-32 rounded uppercase" />
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
            <div className="text-right space-y-2">
              <Skeleton className="h-3 w-24 rounded ml-auto" />
              <Skeleton className="h-4 w-32 rounded ml-auto" />
            </div>
          </div>

          {/* Progress Bar Line */}
          <div className="space-y-2 pt-2">
            <Skeleton className="h-2.5 w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-12 rounded" />
              <Skeleton className="h-3 w-14 rounded" />
            </div>
          </div>
          <Skeleton className="h-4 w-44 rounded" />
        </div>
      </div>

      {/* 4 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-3"
          >
            <Skeleton className="h-3 w-24 rounded uppercase" />
            <Skeleton className="h-6 w-36 rounded-md" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
        ))}
      </div>

      {/* DETAIL ACCORDION SKELETON */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-56 rounded-lg" />
            <Skeleton className="h-3.5 w-72 rounded" />
          </div>
          <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

