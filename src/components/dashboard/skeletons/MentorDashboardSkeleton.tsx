import React from "react";
import Skeleton from "@/components/ui/Skeleton";

export default function MentorDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* HEADER SKELETON */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-xl" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-20 rounded-xl" />
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
        </div>
      </div>

      {/* 4 SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 sm:p-5 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3.5 w-28 rounded" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
              <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            </div>
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800">
              <Skeleton className="h-3.5 w-44 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* PERLU TINDAK LANJUT */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 p-4 sm:p-5 space-y-4">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-40 rounded-lg" />
          <Skeleton className="h-3.5 w-64 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800"
            >
              <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-44 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DAFTAR PESERTA BIMBINGAN */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-60 rounded-lg" />
            <Skeleton className="h-4 w-80 rounded" />
          </div>
          <Skeleton className="h-10 w-full lg:w-80 rounded-xl" />
        </div>

        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((t) => (
            <Skeleton key={t} className="h-8 w-28 rounded-full" />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((card) => (
            <div
              key={card}
              className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 sm:p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <Skeleton className="w-11 h-11 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-40 rounded" />
                    <Skeleton className="h-3.5 w-32 rounded" />
                    <Skeleton className="h-3 w-44 rounded" />
                  </div>
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-20 w-full rounded-xl" />
              <div className="grid grid-cols-2 gap-2.5">
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-28 rounded-xl" />
                <Skeleton className="h-9 w-28 rounded-xl" />
                <Skeleton className="h-9 w-24 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
