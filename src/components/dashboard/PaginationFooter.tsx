"use client";

import React from "react";

interface PaginationFooterProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage?: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function PaginationFooter({
  currentPage,
  totalItems,
  itemsPerPage = 10,
  itemLabel = "data",
  onPageChange,
  className = "",
}: PaginationFooterProps) {
  if (totalItems <= 0) return null;

  const totalPage = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(Math.max(1, currentPage), totalPage);
  const start = (safePage - 1) * itemsPerPage + 1;
  const end = Math.min(safePage * itemsPerPage, totalItems);

  return (
    <div
      className={`bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${className}`}
    >
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Menampilkan {start}–{end} dari {totalItems} {itemLabel}
      </p>

      {totalPage > 1 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={safePage === 1}
            onClick={() => onPageChange(safePage - 1)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
          >
            Sebelumnya
          </button>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 px-2">
            {safePage} / {totalPage}
          </span>
          <button
            type="button"
            disabled={safePage === totalPage}
            onClick={() => onPageChange(safePage + 1)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
          >
            Berikutnya
          </button>
        </div>
      )}
    </div>
  );
}
