import React from "react";
import Skeleton from "@/components/ui/Skeleton";

export default function MentorDashboardSkeleton() {
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-10 bg-linear-to-br from-slate-50 via-white to-indigo-100 dark:from-[#0B0614] dark:via-[#120A24] dark:to-[#1E0F3D] text-slate-800 dark:text-slate-100 transition-colors">
      {/* HEADER SKELETON */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="h-9 w-64 rounded-xl" />
          <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>

      {/* ANNOUNCEMENT BOX SKELETON */}
      <div className="mb-10 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-44 rounded" />
            <Skeleton className="h-3 w-2/3 rounded" />
          </div>
        </div>
      </div>

      {/* 4 SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-12">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-3xl bg-white/80 dark:bg-white/5 backdrop-blur border border-slate-200 dark:border-slate-700 p-6 shadow-md"
          >
            <div className="flex items-center gap-4">
              <Skeleton className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-8 w-16 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 2-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: TUGAS MENTOR */}
        <div className="rounded-3xl bg-white/80 dark:bg-white/5 backdrop-blur border border-slate-200 dark:border-slate-700 shadow-lg p-6">
          <Skeleton className="h-6 w-36 rounded-lg mb-5" />

          <div className="space-y-3">
            {[1, 2, 3].map((task) => (
              <div
                key={task}
                className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl bg-white/90 dark:bg-white/5 border border-slate-200 dark:border-slate-700"
              >
                <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-40 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: PESERTA BARU */}
        <div className="lg:col-span-2 rounded-3xl bg-white/80 dark:bg-white/5 backdrop-blur border border-slate-200 dark:border-slate-700 shadow-lg p-6">
          <div className="flex items-center justify-between mb-5">
            <Skeleton className="h-6 w-36 rounded-lg" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((p) => (
              <div
                key={p}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-white/90 dark:bg-white/5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-5 w-36 rounded" />
                    <Skeleton className="h-3 w-28 rounded" />
                  </div>
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
                <Skeleton className="h-9 w-full rounded-xl mt-2" />
              </div>
            ))}
          </div>

          {/* Pagination Placeholder */}
          <div className="flex justify-end items-center gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-4 w-12 rounded" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

