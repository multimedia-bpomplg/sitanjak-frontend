import React from "react";
import Skeleton from "@/components/ui/Skeleton";

export default function PesertaDashboardSkeleton() {
  return (
    <div className="space-y-4">
      {/* HEADER SKELETON */}
      <div className="flex items-center justify-between pt-1">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40 rounded-lg" />
          <Skeleton className="h-3.5 w-48 rounded" />
        </div>
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
      </div>

      {/* ANNOUNCEMENT BANNER SKELETON */}
      <Skeleton className="h-10 w-full rounded-xl" />

      {/* HARI INI CARD SKELETON */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-5 space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-3.5 w-36 rounded" />
              <Skeleton className="h-3 w-44 rounded" />
            </div>
          </div>
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <div className="py-4 flex flex-col items-center space-y-2.5">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <Skeleton className="h-4 w-44 rounded" />
          <Skeleton className="h-3 w-64 rounded" />
        </div>
      </div>

      {/* INFORMASI AKTIVITAS SKELETON */}
      <div className="space-y-2 pt-2">
        <Skeleton className="h-4 w-36 rounded" />
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-4 flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-44 rounded" />
            <Skeleton className="h-3 w-56 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
