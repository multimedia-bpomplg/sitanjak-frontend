import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export default function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-slate-200/90 dark:bg-slate-800/80 rounded-md ${className}`}
      {...props}
    />
  );
}

export function SkeletonCircle({
  size = "w-10 h-10",
  className = "",
  ...props
}: { size?: string; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton
      className={`rounded-full shrink-0 ${size} ${className}`}
      {...props}
    />
  );
}

export function SkeletonText({
  lines = 1,
  className = "",
  gap = "gap-2",
}: {
  lines?: number;
  className?: string;
  gap?: string;
}) {
  return (
    <div className={`flex flex-col ${gap} w-full`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={`h-4 ${index === lines - 1 && lines > 1 ? "w-3/4" : "w-full"} ${className}`}
        />
      ))}
    </div>
  );
}

