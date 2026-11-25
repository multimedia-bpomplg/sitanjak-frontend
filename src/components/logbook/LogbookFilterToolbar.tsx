"use client";

import {
  Briefcase,
  Calendar,
  CalendarDays,
  RotateCcw,
  Search,
  UserCheck,
  X,
} from "lucide-react";
import ModernDatePickerPopover from "@/components/pendaftaran/ModernDatePickerPopover";
import { normalizeFormasiKey } from "@/lib/formasiMentor";
import { BULAN_OPTIONS } from "@/lib/pesertaFilter";

export type LogbookFilterTab =
  | "Semua"
  | "Belum Isi Logbook"
  | "Perlu Review"
  | "Disetujui"
  | "Ditolak";

export type LogbookExtraFilterState = {
  mentor: string; // "semua" | "tanpa_mentor" | mentorNameKey
  formasi: string; // "semua" | normalizedFormasiKey
  year: string; // "" | "2026"
  month: string; // "" | "01".."12"
  date: string; // "" | "YYYY-MM-DD"
};

export const INITIAL_LOGBOOK_EXTRA_FILTERS: LogbookExtraFilterState = {
  mentor: "semua",
  formasi: "semua",
  year: "",
  month: "",
  date: "",
};

const FILTER_TABS: LogbookFilterTab[] = [
  "Semua",
  "Belum Isi Logbook",
  "Perlu Review",
  "Disetujui",
  "Ditolak",
];

export function getLogbookMentorFilterKey(mentorName?: string | null): string {
  const trimmed = (mentorName || "").trim();
  if (!trimmed || trimmed === "-" || trimmed.toLowerCase() === "belum ditentukan") {
    return "tanpa_mentor";
  }
  return trimmed.toLowerCase();
}

export function hasTimeFilter(filters: LogbookExtraFilterState): boolean {
  return Boolean(filters.year || filters.month || filters.date);
}

export function matchesLogbookDateCriteria(
  dateIso: string | undefined,
  filters: Pick<LogbookExtraFilterState, "year" | "month" | "date">,
): boolean {
  if (!dateIso) return false;
  const iso = dateIso.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;

  if (filters.date) {
    return iso === filters.date;
  }
  if (filters.year && iso.slice(0, 4) !== filters.year) {
    return false;
  }
  if (filters.month && iso.slice(5, 7) !== filters.month) {
    return false;
  }
  return true;
}

export function matchesLogbookPeriodeOverlap(
  peserta: { tanggalMulaiMagang?: string; tanggalSelesaiMagang?: string },
  filters: Pick<LogbookExtraFilterState, "year" | "month" | "date">,
): boolean {
  if (filters.date) return false;
  const start = peserta.tanggalMulaiMagang?.trim().slice(0, 10);
  const end = peserta.tanggalSelesaiMagang?.trim().slice(0, 10);
  if (!start && !end) return false;

  const s = start || end!;
  const e = end || start!;
  const minDate = s <= e ? s : e;
  const maxDate = s <= e ? e : s;

  if (filters.year && filters.month) {
    const ym = `${filters.year}-${filters.month}`;
    return minDate.slice(0, 7) <= ym && maxDate.slice(0, 7) >= ym;
  }
  if (filters.year) {
    return (
      minDate.slice(0, 4) <= filters.year &&
      maxDate.slice(0, 4) >= filters.year
    );
  }
  if (filters.month) {
    const startYear = Number(minDate.slice(0, 4));
    const endYear = Number(maxDate.slice(0, 4));
    if (endYear - startYear >= 1) return true;
    const targetMonth = Number(filters.month);
    const startMonth = Number(minDate.slice(5, 7));
    const endMonth = Number(maxDate.slice(5, 7));
    return targetMonth >= startMonth && targetMonth <= endMonth;
  }
  return true;
}

export function extractLogbookDates(
  logbooks: Array<{ date?: string }>,
): string[] {
  const dateSet = new Set<string>();
  for (const lb of logbooks) {
    const iso = lb.date?.trim().slice(0, 10);
    if (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      dateSet.add(iso);
    }
  }
  return Array.from(dateSet);
}

export function extractLogbookYears(
  logbooks: Array<{ date?: string }>,
  pesertaList: Array<{
    tanggalMulaiMagang?: string;
    tanggalSelesaiMagang?: string;
  }>,
): string[] {
  const nowYear = new Date()
    .toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
    .slice(0, 4);
  const yearSet = new Set<string>([nowYear]);

  for (const lb of logbooks) {
    const yr = lb.date?.trim().slice(0, 4);
    if (yr && /^\d{4}$/.test(yr)) yearSet.add(yr);
  }
  for (const p of pesertaList) {
    const startYr = p.tanggalMulaiMagang?.trim().slice(0, 4);
    const endYr = p.tanggalSelesaiMagang?.trim().slice(0, 4);
    if (startYr && /^\d{4}$/.test(startYr)) yearSet.add(startYr);
    if (endYr && /^\d{4}$/.test(endYr)) yearSet.add(endYr);
  }

  return Array.from(yearSet).sort((a, b) => b.localeCompare(a));
}

export function buildMentorOptions(
  pesertaList: Array<{ mentorName?: string }>,
): Array<{ value: string; label: string }> {
  const map = new Map<string, string>();
  let hasTanpaMentor = false;

  for (const p of pesertaList) {
    const key = getLogbookMentorFilterKey(p.mentorName);
    if (key === "tanpa_mentor") {
      hasTanpaMentor = true;
      continue;
    }
    if (!map.has(key) && p.mentorName) {
      map.set(key, p.mentorName.trim());
    }
  }

  const options = Array.from(map.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "id-ID"));

  if (hasTanpaMentor) {
    options.push({ value: "tanpa_mentor", label: "Belum Ditentukan" });
  }

  return options;
}

export function buildFormasiOptions(
  pesertaList: Array<{ posisi?: string }>,
  formasiTitles: string[],
): Array<{ value: string; label: string }> {
  const map = new Map<string, string>();

  for (const title of formasiTitles) {
    const key = normalizeFormasiKey(title);
    if (key && !map.has(key)) {
      map.set(key, title.trim());
    }
  }

  for (const p of pesertaList) {
    const pos = p.posisi?.trim();
    if (!pos || pos === "-") continue;
    const key = normalizeFormasiKey(pos);
    if (key && !map.has(key)) {
      map.set(key, pos);
    }
  }

  return Array.from(map.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "id-ID"));
}

export type BasePesertaLogbookStat = {
  _id: string;
  name: string;
  email: string;
  posisi?: string;
  mentorName?: string;
  tanggalMulaiMagang?: string;
  tanggalSelesaiMagang?: string;
  totalLogbooks: number;
  approvedLogbooks: number;
  pendingLogbooks: number;
  rejectedLogbooks: number;
  revisiLogbooks: number;
  missedCount: number;
  missedDates: string[];
};

export function computeScopedLogbookMonitoring<
  TPeserta extends BasePesertaLogbookStat,
  TLogbook extends {
    approvalStatus?: string;
    date?: string;
    user?: { _id?: string };
  },
>(
  pesertaList: TPeserta[],
  allLogbooks: TLogbook[],
  extraFilters: LogbookExtraFilterState,
) {
  const timeActive = hasTimeFilter(extraFilters);
  const logsByUser = new Map<string, TLogbook[]>();

  if (timeActive) {
    for (const lb of allLogbooks) {
      const uid = lb.user?._id;
      if (!uid) continue;
      if (!matchesLogbookDateCriteria(lb.date, extraFilters)) continue;
      const arr = logsByUser.get(uid) || [];
      arr.push(lb);
      logsByUser.set(uid, arr);
    }
  } else {
    for (const lb of allLogbooks) {
      const uid = lb.user?._id;
      if (!uid) continue;
      const arr = logsByUser.get(uid) || [];
      arr.push(lb);
      logsByUser.set(uid, arr);
    }
  }

  const scopedPeserta: TPeserta[] = [];
  const allowedUserIds = new Set<string>();

  for (const p of pesertaList) {
    if (
      extraFilters.mentor !== "semua" &&
      getLogbookMentorFilterKey(p.mentorName) !== extraFilters.mentor
    ) {
      continue;
    }

    if (
      extraFilters.formasi !== "semua" &&
      normalizeFormasiKey(p.posisi) !== extraFilters.formasi
    ) {
      continue;
    }

    if (!timeActive) {
      scopedPeserta.push(p);
      allowedUserIds.add(p._id);
      continue;
    }

    const userLogs = logsByUser.get(p._id) || [];
    const userMissed = p.missedDates.filter((d) =>
      matchesLogbookDateCriteria(d, extraFilters),
    );
    const hasPeriodeOverlap =
      !extraFilters.date && matchesLogbookPeriodeOverlap(p, extraFilters);

    if (userLogs.length === 0 && userMissed.length === 0 && !hasPeriodeOverlap) {
      continue;
    }

    let approvedLogbooks = 0;
    let pendingLogbooks = 0;
    let rejectedLogbooks = 0;
    let revisiLogbooks = 0;
    for (const lb of userLogs) {
      if (lb.approvalStatus === "disetujui") approvedLogbooks += 1;
      else if (lb.approvalStatus === "ditolak") rejectedLogbooks += 1;
      else if (lb.approvalStatus === "revisi") revisiLogbooks += 1;
      else pendingLogbooks += 1;
    }

    scopedPeserta.push({
      ...p,
      totalLogbooks: userLogs.length,
      approvedLogbooks,
      pendingLogbooks,
      rejectedLogbooks,
      revisiLogbooks,
      missedCount: userMissed.length,
      missedDates: userMissed,
    });
    allowedUserIds.add(p._id);
  }

  const scopedLogbooks = allLogbooks.filter((lb) => {
    const uid = lb.user?._id;
    if (!uid || !allowedUserIds.has(uid)) return false;
    if (timeActive && !matchesLogbookDateCriteria(lb.date, extraFilters)) {
      return false;
    }
    return true;
  });

  let totalPending = 0;
  let totalApproved = 0;
  let totalRejectedOrRevisi = 0;
  for (const lb of scopedLogbooks) {
    if (lb.approvalStatus === "disetujui") totalApproved += 1;
    else if (lb.approvalStatus === "menunggu") totalPending += 1;
    else totalRejectedOrRevisi += 1;
  }

  const counts: Record<LogbookFilterTab, number> = {
    Semua: scopedPeserta.length,
    "Belum Isi Logbook": scopedPeserta.filter((p) => p.missedCount > 0).length,
    "Perlu Review": scopedPeserta.filter((p) => p.pendingLogbooks > 0).length,
    Disetujui: scopedPeserta.filter(
      (p) =>
        p.totalLogbooks > 0 &&
        p.pendingLogbooks === 0 &&
        p.rejectedLogbooks === 0 &&
        p.revisiLogbooks === 0,
    ).length,
    Ditolak: scopedPeserta.filter(
      (p) => p.rejectedLogbooks > 0 || p.revisiLogbooks > 0,
    ).length,
  };

  return {
    scopedPeserta,
    scopedLogbooks,
    summary: {
      totalPeserta: scopedPeserta.length,
      totalEntries: scopedLogbooks.length,
      totalPending,
      totalApproved,
      totalRejectedOrRevisi,
      counts,
    },
  };
}

type Props = {
  filterTab: LogbookFilterTab;
  onFilterTabChange: (next: LogbookFilterTab) => void;
  tabCounts: Record<LogbookFilterTab, number>;
  search: string;
  onSearchChange: (next: string) => void;
  extraFilters: LogbookExtraFilterState;
  onExtraFiltersChange: (next: LogbookExtraFilterState) => void;
  mentorOptions: Array<{ value: string; label: string }>;
  formasiOptions: Array<{ value: string; label: string }>;
  availableYears: string[];
  highlightedDates: string[];
  filteredCount: number;
};

export default function LogbookFilterToolbar({
  filterTab,
  onFilterTabChange,
  tabCounts,
  search,
  onSearchChange,
  extraFilters,
  onExtraFiltersChange,
  mentorOptions,
  formasiOptions,
  availableYears,
  highlightedDates,
  filteredCount,
}: Props) {
  const hasAnyFilter =
    filterTab !== "Semua" ||
    search.trim() !== "" ||
    extraFilters.mentor !== "semua" ||
    extraFilters.formasi !== "semua" ||
    extraFilters.year !== "" ||
    extraFilters.month !== "" ||
    extraFilters.date !== "";

  const handleReset = () => {
    onFilterTabChange("Semua");
    onSearchChange("");
    onExtraFiltersChange(INITIAL_LOGBOOK_EXTRA_FILTERS);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 p-3.5 space-y-3">
      {/* Row 1: Status Tabs + Search */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTER_TABS.map((tab) => {
            const active = filterTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onFilterTabChange(tab)}
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
                  {tabCounts[tab]}
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
            placeholder="Cari nama, email, posisi, mentor..."
            className="w-full pl-9 pr-9 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Hapus pencarian"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Mentor + Formasi + Tahun + Bulan + Tanggal */}
      <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-700/70 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Mentor */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <UserCheck className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
            <select
              aria-label="Filter logbook per mentor"
              value={extraFilters.mentor}
              onChange={(e) =>
                onExtraFiltersChange({
                  ...extraFilters,
                  mentor: e.target.value,
                })
              }
              className="bg-transparent pr-1 focus:outline-none cursor-pointer max-w-[175px]"
            >
              <option value="semua" className="dark:bg-slate-900">
                Semua Mentor
              </option>
              {mentorOptions.map((m) => (
                <option
                  key={m.value}
                  value={m.value}
                  className="dark:bg-slate-900"
                >
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Formasi */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <Briefcase className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
            <select
              aria-label="Filter logbook per formasi"
              value={extraFilters.formasi}
              onChange={(e) =>
                onExtraFiltersChange({
                  ...extraFilters,
                  formasi: e.target.value,
                })
              }
              className="bg-transparent pr-1 focus:outline-none cursor-pointer max-w-[190px]"
            >
              <option value="semua" className="dark:bg-slate-900">
                Semua Formasi
              </option>
              {formasiOptions.map((f) => (
                <option
                  key={f.value}
                  value={f.value}
                  className="dark:bg-slate-900"
                >
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Per Tahun */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
            <select
              aria-label="Filter logbook per tahun"
              value={extraFilters.year}
              onChange={(e) => {
                const nextYear = e.target.value;
                onExtraFiltersChange({
                  ...extraFilters,
                  year: nextYear,
                  date:
                    extraFilters.date &&
                    nextYear &&
                    extraFilters.date.slice(0, 4) !== nextYear
                      ? ""
                      : extraFilters.date,
                });
              }}
              className="bg-transparent pr-1 focus:outline-none cursor-pointer"
            >
              <option value="" className="dark:bg-slate-900">
                Semua Tahun
              </option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="dark:bg-slate-900">
                  Tahun {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Per Bulan */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <CalendarDays className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
            <select
              aria-label="Filter logbook per bulan"
              value={extraFilters.month}
              onChange={(e) => {
                const nextMonth = e.target.value;
                onExtraFiltersChange({
                  ...extraFilters,
                  month: nextMonth,
                  date:
                    extraFilters.date &&
                    nextMonth &&
                    extraFilters.date.slice(5, 7) !== nextMonth
                      ? ""
                      : extraFilters.date,
                });
              }}
              className="bg-transparent pr-1 focus:outline-none cursor-pointer"
            >
              <option value="" className="dark:bg-slate-900">
                Semua Bulan
              </option>
              {BULAN_OPTIONS.map((m) => {
                const val = String(m.value).padStart(2, "0");
                return (
                  <option key={val} value={val} className="dark:bg-slate-900">
                    {m.label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Per Tanggal */}
          <ModernDatePickerPopover
            value={extraFilters.date}
            defaultYear={extraFilters.year}
            defaultMonth={extraFilters.month}
            highlightedDates={highlightedDates}
            placeholder="Pilih Tanggal"
            ariaLabel="Filter logbook per tanggal"
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

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {filteredCount} peserta ditampilkan
          </span>
          {hasAnyFilter && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
