"use client";

import { Briefcase, GraduationCap, UserCheck } from "lucide-react";
import { normalizeFormasiKey } from "@/lib/formasiMentor";
import { isPkpaPeserta } from "@/lib/pesertaKategori";

export type ProgramFilter = "semua" | "pkpa" | "reguler";

export function matchesProgramAndFormasiFilter(
  item: {
    posisi?: string | null;
    jurusan?: string | null;
    kategoriMagang?: string | null;
  },
  filterFormasi: string,
  filterProgram: ProgramFilter,
): boolean {
  if (
    filterFormasi !== "semua" &&
    normalizeFormasiKey(item.posisi) !== filterFormasi
  ) {
    return false;
  }

  if (filterProgram !== "semua") {
    const isPkpa = isPkpaPeserta({
      kategoriMagang: item.kategoriMagang,
      jurusan: item.jurusan,
    });
    if (filterProgram === "pkpa" && !isPkpa) return false;
    if (filterProgram === "reguler" && isPkpa) return false;
  }

  return true;
}

export function buildLaporanAkhirFilterSummary(params: {
  filterTab: string;
  filterMentor?: string;
  mentorOptions?: Array<{ value: string; label: string }>;
  filterFormasi: string;
  formasiOptions: Array<{ value: string; label: string }>;
  filterProgram: ProgramFilter;
  search?: string;
}): string {
  const parts: string[] = [];

  if (params.filterTab && params.filterTab !== "Semua") {
    parts.push(`Status: ${params.filterTab}`);
  }

  if (params.filterMentor && params.filterMentor !== "semua") {
    if (params.filterMentor === "tanpa_mentor") {
      parts.push("Mentor: Belum ditetapkan");
    } else {
      const mLabel =
        params.mentorOptions?.find((m) => m.value === params.filterMentor)
          ?.label || params.filterMentor;
      parts.push(`Mentor: ${mLabel}`);
    }
  }

  if (params.filterFormasi !== "semua") {
    const fLabel =
      params.formasiOptions.find((f) => f.value === params.filterFormasi)
        ?.label || params.filterFormasi;
    parts.push(`Formasi: ${fLabel}`);
  }

  if (params.filterProgram === "pkpa") {
    parts.push("Program: PKPA");
  } else if (params.filterProgram === "reguler") {
    parts.push("Program: Reguler");
  }

  const q = params.search?.trim();
  if (q) {
    parts.push(`Pencarian: "${q}"`);
  }

  return parts.length > 0 ? parts.join(" | ") : "Semua Data Laporan Akhir";
}

type Props = {
  filterFormasi: string;
  onFormasiChange: (next: string) => void;
  formasiOptions: Array<{ value: string; label: string }>;
  filterProgram: ProgramFilter;
  onProgramChange: (next: ProgramFilter) => void;
  showMentorFilter?: boolean;
  filterMentor?: string;
  onMentorChange?: (next: string) => void;
  mentorOptions?: Array<{ value: string; label: string }>;
};

export default function LaporanAkhirFilterControls({
  filterFormasi,
  onFormasiChange,
  formasiOptions,
  filterProgram,
  onProgramChange,
  showMentorFilter = false,
  filterMentor = "semua",
  onMentorChange,
  mentorOptions = [],
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {showMentorFilter && onMentorChange && (
        <div className="h-9 inline-flex items-center gap-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-[#0284c7]/40 focus-within:border-[#0284c7]">
          <UserCheck className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
          <select
            aria-label="Filter berdasarkan mentor"
            value={filterMentor}
            onChange={(e) => onMentorChange(e.target.value)}
            className="text-xs font-semibold bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[175px] truncate"
          >
            <option
              value="semua"
              className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
            >
              Semua Mentor
            </option>
            <option
              value="tanpa_mentor"
              className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
            >
              Belum Ditetapkan
            </option>
            {mentorOptions.map((m) => (
              <option
                key={m.value}
                value={m.value}
                className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
              >
                {m.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Filter Formasi */}
      <div className="h-9 inline-flex items-center gap-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-[#0284c7]/40 focus-within:border-[#0284c7]">
        <Briefcase className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
        <select
          aria-label="Filter berdasarkan formasi"
          value={filterFormasi}
          onChange={(e) => onFormasiChange(e.target.value)}
          className="text-xs font-semibold bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[195px] truncate"
        >
          <option
            value="semua"
            className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
          >
            Semua Formasi
          </option>
          {formasiOptions.map((f) => (
            <option
              key={f.value}
              value={f.value}
              className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
            >
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Filter PKPA / Reguler */}
      <div className="h-9 inline-flex items-center gap-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-[#0284c7]/40 focus-within:border-[#0284c7]">
        <GraduationCap className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
        <select
          aria-label="Filter program PKPA atau Reguler"
          value={filterProgram}
          onChange={(e) => onProgramChange(e.target.value as ProgramFilter)}
          className="text-xs font-semibold bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
        >
          <option
            value="semua"
            className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
          >
            Semua Program (PKPA/Reguler)
          </option>
          <option
            value="pkpa"
            className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
          >
            Khusus PKPA
          </option>
          <option
            value="reguler"
            className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
          >
            Magang Reguler
          </option>
        </select>
      </div>
    </div>
  );
}
