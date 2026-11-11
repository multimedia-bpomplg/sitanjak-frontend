import React from "react";
import Skeleton, { SkeletonCircle } from "@/components/ui/Skeleton";

export default function AdminDashboardSkeleton() {
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-linear-to-br from-slate-50 via-white to-indigo-50 dark:from-[#0B0614] dark:via-[#120A24] dark:to-[#1E0F3D] text-slate-800 dark:text-slate-100 transition-colors">
      {/* HEADER SKELETON */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="w-9 h-9 rounded-xl" />
          <Skeleton className="h-9 w-64 rounded-xl" />
        </div>
        <Skeleton className="h-4 w-80 rounded-md mt-2" />
      </div>

      {/* ANNOUNCEMENT BOX SKELETON */}
      <div className="mb-8 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48 rounded" />
            <Skeleton className="h-3 w-3/4 rounded" />
          </div>
        </div>
      </div>

      {/* 4 SUMMARY CARDS SKELETON */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur border border-slate-200 dark:border-slate-700 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1 pr-4">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-7 w-16 rounded-lg" />
              </div>
              <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
            </div>
          </div>
        ))}
      </div>

      {/* ALERT BANNER SKELETON */}
      <div className="mb-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-56 rounded" />
            <Skeleton className="h-3 w-36 rounded" />
          </div>
        </div>
        <Skeleton className="h-9 w-36 rounded-lg hidden sm:block" />
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: PENDAFTARAN TERBARU */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur border border-slate-200 dark:border-slate-700 shadow-lg p-4 sm:p-6 h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-6 w-44 rounded-lg" />
              <Skeleton className="h-9 w-28 rounded-xl" />
            </div>

            {/* List Cards */}
            <div className="space-y-4">
              {[1, 2, 3].map((card) => (
                <div
                  key={card}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-white/5 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-5 w-44 rounded" />
                      <Skeleton className="h-3 w-36 rounded" />
                    </div>
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 py-1">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-4 h-4 rounded-full" />
                      <Skeleton className="h-3 w-36 rounded" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-4 h-4 rounded-full" />
                      <Skeleton className="h-3 w-28 rounded" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Skeleton className="h-3 w-32 rounded" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TUGAS CEPAT & STATISTIK */}
        <div>
          <div className="rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur border border-slate-200 dark:border-slate-700 shadow-lg p-6 h-full">
            <Skeleton className="h-6 w-32 rounded-lg mb-6" />

            {/* Tasks list */}
            <div className="space-y-4">
              {[1, 2, 3].map((t) => (
                <div
                  key={t}
                  className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-white/5"
                >
                  <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-3 w-40 rounded" />
                  </div>
                </div>
              ))}
            </div>

            {/* Quick stats footer */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <Skeleton className="h-4 w-36 rounded mb-4" />
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 text-center space-y-2">
                  <Skeleton className="h-7 w-12 mx-auto rounded-md" />
                  <Skeleton className="h-3 w-16 mx-auto rounded" />
                </div>
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 text-center space-y-2">
                  <Skeleton className="h-7 w-12 mx-auto rounded-md" />
                  <Skeleton className="h-3 w-16 mx-auto rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

