"use client";

import {
  Calendar,
  CalendarDays,
  RotateCcw,
  Search,
  Users,
  X,
} from "lucide-react";
import ModernDatePickerPopover from "./ModernDatePickerPopover";

export type PendaftaranStatus =
  | "Menunggu"
  | "Sedang Diproses"
  | "Disetujui"
  | "Ditolak";

export type StatusFilter = "Semua" | PendaftaranStatus;
export type KategoriFilter = "semua" | "sendiri" | "bersama";

export type PendaftaranExtraFilterState = {
  kategori: KategoriFilter;
  year: string;
  month: string;
  date: string;
};

export const INITIAL_PENDAFTARAN_EXTRA_FILTERS: PendaftaranExtraFilterState = {
  kategori: "semua",
  year: "",
  month: "",
  date: "",
};

const MONTH_OPTIONS = [
  { value: "01", label: "Januari" },
  { value: "02", label: "Februari" },
  { value: "03", label: "Maret" },
  { value: "04", label: "April" },
  { value: "05", label: "Mei" },
  { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },
  { value: "08", label: "Agustus" },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

export function getCreatedWibIso(createdAt?: string): string {
  if (!createdAt) return "";
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

export function extractPendaftaranDates(
  items: Array<{ createdAt?: string }>,
): string[] {
  const dateSet = new Set<string>();
  for (const item of items) {
    const iso = getCreatedWibIso(item.createdAt);
    if (iso) dateSet.add(iso);
  }
  return Array.from(dateSet);
}

export function extractPendaftaranYears(
  items: Array<{ createdAt?: string }>,
): string[] {
  const nowYear = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Jakarta",
  }).slice(0, 4);
  const yearSet = new Set<string>([nowYear]);
  for (const item of items) {
    const iso = getCreatedWibIso(item.createdAt);
    if (iso) yearSet.add(iso.slice(0, 4));
  }
  return Array.from(yearSet).sort((a, b) => b.localeCompare(a));
}

export function matchesPendaftaranExtraFilters(
  item: { kategori?: string; createdAt?: string },
  filters: PendaftaranExtraFilterState,
): boolean {
  if (filters.kategori !== "semua") {
    const itemKat = item.kategori === "bersama" ? "bersama" : "sendiri";
    if (itemKat !== filters.kategori) return false;
  }

  if (filters.date || filters.year || filters.month) {
    const createdIso = getCreatedWibIso(item.createdAt);
    if (!createdIso) return false;
    if (filters.date && createdIso !== filters.date) return false;
    if (filters.year && createdIso.slice(0, 4) !== filters.year) return false;
    if (filters.month && createdIso.slice(5, 7) !== filters.month) return false;
  }

  return true;
}

type Props = {
  statusFilter: StatusFilter;
  onStatusChange: (next: StatusFilter) => void;
  statusCounts: Record<StatusFilter, number>;
  search: string;
  onSearchChange: (next: string) => void;
  extraFilters: PendaftaranExtraFilterState;
  onExtraFiltersChange: (next: PendaftaranExtraFilterState) => void;
  availableYears: string[];
  highlightedDates?: string[];
  filteredCount: number;
};

export default function PendaftaranFilterToolbar({
  statusFilter,
  onStatusChange,
  statusCounts,
  search,
  onSearchChange,
  extraFilters,
  onExtraFiltersChange,
  availableYears,
  highlightedDates,
  filteredCount,
}: Props) {
  const hasExtraFilter =
    extraFilters.kategori !== "semua" ||
    Boolean(extraFilters.year) ||
    Boolean(extraFilters.month) ||
    Boolean(extraFilters.date);

  const hasAnyFilter =
    statusFilter !== "Semua" || Boolean(search.trim()) || hasExtraFilter;

  const handleResetAll = () => {
    onStatusChange("Semua");
    onSearchChange("");
    onExtraFiltersChange(INITIAL_PENDAFTARAN_EXTRA_FILTERS);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 p-3.5 sm:p-4 space-y-3">
      {/* Row 1: Status Tabs + Search */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              "Semua",
              "Menunggu",
              "Sedang Diproses",
              "Disetujui",
              "Ditolak",
            ] as StatusFilter[]
          ).map((tab) => {
            const active = statusFilter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onStatusChange(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition inline-flex items-center gap-1.5 cursor-pointer ${
                  active
                    ? "bg-[#0284c7] text-white shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {statusCounts[tab]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nama, email, posisi, instansi..."
            className="w-full pl-9 pr-9 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Hapus pencarian"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Kategori (Individu/Kelompok) + Tahun + Bulan + Tanggal */}
      <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/70 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Individu / Kelompok Segmented Control */}
          <div
            role="group"
            aria-label="Filter tipe pendaftaran"
            className="inline-flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
          >
            {(
              [
                { value: "semua", label: "Semua Tipe" },
                { value: "sendiri", label: "Individu" },
                { value: "bersama", label: "Kelompok" },
              ] as Array<{ value: KategoriFilter; label: string }>
            ).map((opt) => {
              const active = extraFilters.kategori === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    onExtraFiltersChange({
                      ...extraFilters,
                      kategori: opt.value,
                    })
                  }
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    active
                      ? "bg-[#0284c7] text-white shadow-2xs"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {opt.value === "bersama" && (
                    <Users className="w-3 h-3 shrink-0" />
                  )}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Per Tahun */}
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
            <select
              aria-label="Filter pendaftaran per tahun"
              value={extraFilters.year}
              onChange={(e) => {
                const nextYear = e.target.value;
                onExtraFiltersChange({
                  ...extraFilters,
                  year: nextYear,
                  date:
                    extraFilters.date &&
                    (!nextYear || extraFilters.date.slice(0, 4) === nextYear)
                      ? extraFilters.date
                      : "",
                });
              }}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option
                value=""
                className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100"
              >
                Semua Tahun
              </option>
              {availableYears.map((yr) => (
                <option
                  key={yr}
                  value={yr}
                  className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100"
                >
                  Tahun {yr}
                </option>
              ))}
            </select>
          </label>

          {/* Per Bulan */}
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <CalendarDays className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
            <select
              aria-label="Filter pendaftaran per bulan"
              value={extraFilters.month}
              onChange={(e) => {
                const nextMonth = e.target.value;
                onExtraFiltersChange({
                  ...extraFilters,
                  month: nextMonth,
                  date:
                    extraFilters.date &&
                    (!nextMonth || extraFilters.date.slice(5, 7) === nextMonth)
                      ? extraFilters.date
                      : "",
                });
              }}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option
                value=""
                className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100"
              >
                Semua Bulan
              </option>
              {MONTH_OPTIONS.map((m) => (
                <option
                  key={m.value}
                  value={m.value}
                  className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100"
                >
                  {m.label}
                </option>
              ))}
            </select>
          </label>

          {/* Per Tanggal (Custom Modern Calendar Popover) */}
          <ModernDatePickerPopover
            value={extraFilters.date}
            defaultYear={extraFilters.year}
            defaultMonth={extraFilters.month}
            highlightedDates={highlightedDates}
            onChange={(nextDate) =>
              onExtraFiltersChange({
                ...extraFilters,
                date: nextDate,
                year: nextDate ? nextDate.slice(0, 4) : extraFilters.year,
                month: nextDate ? nextDate.slice(5, 7) : extraFilters.month,
              })
            }
          />
        </div>

        {/* Result Count & Reset */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
            {filteredCount} data ditampilkan
          </span>

          {hasAnyFilter && (
            <button
              type="button"
              onClick={handleResetAll}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
