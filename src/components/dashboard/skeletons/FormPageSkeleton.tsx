import React from "react";
import Skeleton from "@/components/ui/Skeleton";

interface FormPageSkeletonProps {
  title?: string;
  subtitle?: string;
  fieldsCount?: number;
}

export default function FormPageSkeleton({
  title,
  subtitle,
  fieldsCount = 4,
}: FormPageSkeletonProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* HEADER SKELETON */}
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

      {/* FORM CARD SKELETON */}
      <div className="rounded-3xl bg-white/90 dark:bg-white/5 border border-slate-200 dark:border-slate-800 shadow-md p-6 sm:p-8 space-y-6">
        {/* Form fields */}
        {Array.from({ length: fieldsCount }).map((_, idx) => (
          <div key={idx} className="space-y-2">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ))}

        {/* Buttons / Actions */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

