"use client";

import { Calendar, Filter, RotateCcw } from "lucide-react";
import { BULAN_OPTIONS } from "@/lib/pesertaFilter";
import type { DashboardFilterState, RangePreset } from "./types";

const RANGE_PRESETS: Array<{ key: RangePreset; label: string }> = [
  { key: "all", label: "Semua Waktu" },
  { key: "today", label: "Hari Ini" },
  { key: "7d", label: "7 Hari" },
  { key: "30d", label: "30 Hari" },
  { key: "month", label: "Per Bulan" },
  { key: "year", label: "Per Tahun" },
];

type Props = {
  filters: DashboardFilterState;
  options: {
    years: number[];
    formasiTitles: string[];
    mentors: Array<{ _id: string; name: string; posisiMentor: string }>;
  };
  loading?: boolean;
  onChange: (next: DashboardFilterState) => void;
  onReset: () => void;
};

export default function SuperadminFilterBar({
  filters,
  options,
  loading = false,
  onChange,
  onReset,
}: Props) {
  const hasActiveFilter =
    filters.range !== "all" ||
    Boolean(filters.posisi) ||
    Boolean(filters.mentorId) ||
    Boolean(filters.kategoriMagang) ||
    Boolean(filters.asalJenis) ||
    Boolean(filters.statusMagang);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-3.5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400 flex items-center justify-center">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Filter Analitik Global
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Menyaring KPI verifikasi, seluruh grafik, antrean tindak lanjut,
              dan ekspor Excel
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {RANGE_PRESETS.map((preset) => {
            const active = filters.range === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                disabled={loading}
                onClick={() => onChange({ ...filters, range: preset.key })}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-60 ${
                  active
                    ? "bg-[#0284c7] text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 pt-1 border-t border-slate-100 dark:border-slate-800">
        {/* Tahun (untuk mode tahun / bulan / grafik tren) */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
          <Calendar className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
          <select
            aria-label="Filter tahun"
            value={filters.year}
            onChange={(e) =>
              onChange({ ...filters, year: Number(e.target.value) })
            }
            className="w-full text-xs font-semibold bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            {options.years.map((yr) => (
              <option key={yr} value={yr}>
                Tahun {yr}
              </option>
            ))}
          </select>
        </div>

        {/* Bulan (tampil aktif saat Per Bulan, tetap tersedia) */}
        <select
          aria-label="Filter bulan"
          value={filters.month}
          disabled={filters.range !== "month"}
          onChange={(e) =>
            onChange({
              ...filters,
              month: Number(e.target.value),
              range: "month",
            })
          }
          title={
            filters.range !== "month"
              ? "Pilih preset Per Bulan untuk menyaring bulan tertentu"
              : undefined
          }
          className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-50"
        >
          {BULAN_OPTIONS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>

        {/* Formasi / Posisi */}
        <select
          aria-label="Filter formasi"
          value={filters.posisi}
          onChange={(e) => onChange({ ...filters, posisi: e.target.value })}
          className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
        >
          <option value="">Semua Formasi / Posisi</option>
          {options.formasiTitles.map((title) => (
            <option key={title} value={title}>
              {title}
            </option>
          ))}
        </select>

        {/* Mentor Pembimbing */}
        <select
          aria-label="Filter mentor"
          value={filters.mentorId}
          onChange={(e) => onChange({ ...filters, mentorId: e.target.value })}
          className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
        >
          <option value="">Semua Mentor</option>
          <option value="tanpa_mentor">Belum Ada Mentor</option>
          {options.mentors.map((m) => (
            <option key={m._id} value={m._id}>
              {m.name}
            </option>
          ))}
        </select>

        {/* Kategori Magang */}
        <select
          aria-label="Filter kategori magang"
          value={filters.kategoriMagang}
          onChange={(e) =>
            onChange({
              ...filters,
              kategoriMagang: e.target.value as DashboardFilterState["kategoriMagang"],
            })
          }
          className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
        >
          <option value="">Semua Kategori</option>
          <option value="Reguler">Reguler</option>
          <option value="PKPA">PKPA</option>
        </select>

        {/* Asal Instansi */}
        <select
          aria-label="Filter asal instansi"
          value={filters.asalJenis}
          onChange={(e) =>
            onChange({
              ...filters,
              asalJenis: e.target.value as DashboardFilterState["asalJenis"],
            })
          }
          className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
        >
          <option value="">Semua Jenjang Asal</option>
          <option value="Universitas">Universitas</option>
          <option value="SMK">SMK / Sederajat</option>
        </select>

        {/* Status Peserta */}
        <div className="flex items-center gap-1.5">
          <select
            aria-label="Filter status peserta"
            value={filters.statusMagang}
            onChange={(e) =>
              onChange({
                ...filters,
                statusMagang: e.target.value as DashboardFilterState["statusMagang"],
              })
            }
            className="flex-1 min-w-0 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          >
            <option value="">Semua Status Magang</option>
            <option value="Sedang Magang">Sedang Magang</option>
            <option value="Belum Waktu Magang">Belum Mulai</option>
            <option value="Selesai">Selesai</option>
          </select>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={onReset}
              title="Reset semua filter"
              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 transition cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
