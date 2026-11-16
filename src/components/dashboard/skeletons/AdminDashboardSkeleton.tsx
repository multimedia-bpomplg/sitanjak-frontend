import React from "react";
import Skeleton, { SkeletonCircle } from "@/components/ui/Skeleton";

export default function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* HEADER SKELETON */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-xl" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-20 rounded-xl" />
          <SkeletonCircle size="w-10 h-10" />
        </div>
      </div>

      {/* 4 SUMMARY CARDS */}
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

      {/* TOP: PERLU TINDAK LANJUT + RINGKASAN SISTEM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 p-5 space-y-4">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-40 rounded-lg" />
            <Skeleton className="h-3.5 w-56 rounded" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((t) => (
              <div
                key={t}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800"
              >
                <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-40 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 p-5 space-y-4">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-36 rounded-lg" />
            <Skeleton className="h-3.5 w-48 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[1, 2, 3, 4].map((m) => (
              <Skeleton key={m} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM: TABEL PENDAFTARAN TERBARU */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-44 rounded-lg" />
            <Skeleton className="h-3.5 w-60 rounded" />
          </div>
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>

        <div className="space-y-3">
          {[1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between gap-4 py-3 border-t border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center gap-3 flex-1">
                <SkeletonCircle size="w-9 h-9" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-40 rounded" />
                  <Skeleton className="h-3 w-32 rounded" />
                </div>
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
