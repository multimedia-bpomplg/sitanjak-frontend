import React from "react";
import Skeleton, { SkeletonCircle } from "@/components/ui/Skeleton";

interface TablePageSkeletonProps {
  title?: string;
  subtitle?: string;
  columnsCount?: number;
  rowsCount?: number;
}

export default function TablePageSkeleton({
  title,
  subtitle,
  columnsCount = 5,
  rowsCount = 6,
}: TablePageSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* HEADER SKELETON */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          {title ? (
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              {title}
            </h1>
          ) : (
            <Skeleton className="h-8 w-56 rounded-xl" />
          )}
          {subtitle ? (
            <p className="text-sm text-slate-500">{subtitle}</p>
          ) : (
            <Skeleton className="h-4 w-72 rounded-md" />
          )}
        </div>

        {/* Action button placeholder */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      {/* FILTER & SEARCH BAR SKELETON */}
      <div className="rounded-2xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <Skeleton className="h-10 w-full sm:w-80 rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-36 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </div>
      </div>

      {/* TABLE SKELETON */}
      <div className="rounded-2xl bg-white/90 dark:bg-white/5 border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
        {/* Table Head */}
        <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
          {Array.from({ length: columnsCount }).map((_, idx) => (
            <Skeleton
              key={idx}
              className={`h-4 ${idx === 0 ? "w-8" : idx === 1 ? "w-36" : "w-24"} rounded`}
            />
          ))}
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {Array.from({ length: rowsCount }).map((_, rIdx) => (
            <div
              key={rIdx}
              className="px-6 py-4 flex items-center justify-between gap-4"
            >
              {/* Col 0: No */}
              <Skeleton className="h-4 w-6 rounded shrink-0" />

              {/* Col 1: Person / Identity with Avatar */}
              <div className="flex items-center gap-3 flex-1 min-w-40">
                <SkeletonCircle size="w-10 h-10" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
              </div>

              {/* Middle columns */}
              {Array.from({ length: Math.max(1, columnsCount - 3) }).map(
                (_, cIdx) => (
                  <Skeleton
                    key={cIdx}
                    className="h-4 w-28 rounded hidden sm:block"
                  />
                )
              )}

              {/* Badge column */}
              <Skeleton className="h-6 w-20 rounded-full shrink-0" />

              {/* Action column */}
              <Skeleton className="h-8 w-16 rounded-lg shrink-0" />
            </div>
          ))}
        </div>

        {/* Pagination Skeleton */}
        <div className="bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <Skeleton className="h-4 w-44 rounded" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

