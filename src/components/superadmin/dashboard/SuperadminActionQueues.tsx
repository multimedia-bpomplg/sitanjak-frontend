"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  UserCheck,
} from "lucide-react";
import type { SuperadminDashboardSummary } from "./types";

type QueueTab = "pendaftaran" | "logbook" | "laporan" | "dokumen";

type Props = {
  actionQueues: SuperadminDashboardSummary["actionQueues"];
  mentorWorkload: SuperadminDashboardSummary["mentorWorkload"];
  trendChart: SuperadminDashboardSummary["trendChart"];
};

function formatDateShort(dateStr?: string): string {
  if (!dateStr || dateStr === "-") return "-";
  const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SuperadminActionQueues({
  actionQueues,
  mentorWorkload,
  trendChart,
}: Props) {
  const [queueTab, setQueueTab] = useState<QueueTab>("pendaftaran");

  const tabs: Array<{
    key: QueueTab;
    label: string;
    count: number;
    icon: typeof ClipboardList;
    href: string;
  }> = [
    {
      key: "pendaftaran",
      label: "Pendaftaran Menunggu",
      count: actionQueues.pendaftaranMenunggu.length,
      icon: ClipboardList,
      href: "/dashboard/superadmin/ViewPendaftaran",
    },
    {
      key: "logbook",
      label: "Logbook Menunggu",
      count: actionQueues.logbookMenunggu.length,
      icon: BookOpenCheck,
      href: "/dashboard/superadmin/ViewLogbook",
    },
    {
      key: "laporan",
      label: "Laporan Akhir",
      count: actionQueues.laporanMenunggu.length,
      icon: GraduationCap,
      href: "/dashboard/superadmin/ViewLaporanAkhir",
    },
    {
      key: "dokumen",
      label: "Dokumen Selesai",
      count: actionQueues.dokumenBelumLengkap.length,
      icon: Award,
      href: "/dashboard/superadmin/ViewPeserta",
    },
  ];

  const activeTabMeta = tabs.find((t) => t.key === queueTab) || tabs[0];

  const activeTrendRows = trendChart.labels
    .map((label, idx) => ({
      label,
      pendaftaranMasuk: trendChart.pendaftaranMasuk[idx] || 0,
      pendaftaranDisetujui: trendChart.pendaftaranDisetujui[idx] || 0,
      logbookMasuk: trendChart.logbookMasuk[idx] || 0,
      logbookDisetujui: trendChart.logbookDisetujui[idx] || 0,
      logbookMenunggu: trendChart.logbookMenunggu[idx] || 0,
      absensiTotal:
        (trendChart.absensiHadir[idx] || 0) +
        (trendChart.absensiTelat[idx] || 0) +
        (trendChart.absensiIzin[idx] || 0),
    }))
    .filter(
      (r) =>
        r.pendaftaranMasuk > 0 ||
        r.logbookMasuk > 0 ||
        r.absensiTotal > 0,
    );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* ================= ACTION QUEUES (8 cols) ================= */}
        <div className="xl:col-span-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Daftar Perlu Tindak Lanjut Segera
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Top 5 antrean prioritas yang menunggu verifikasi atau tindak
                lanjut
              </p>
            </div>
            <Link
              href={activeTabMeta.href}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0284c7] hover:underline shrink-0"
            >
              Lihat Semua
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="px-4 sm:px-5 pt-3 flex flex-wrap gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3 bg-slate-50/50 dark:bg-slate-800/20">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = queueTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setQueueTab(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    active
                      ? "bg-[#0284c7] text-white shadow-xs"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="p-4 sm:p-5">
            {queueTab === "pendaftaran" && (
              <QueueListEmptyOrRows
                isEmpty={actionQueues.pendaftaranMenunggu.length === 0}
                emptyLabel="Tidak ada pendaftaran menunggu review"
              >
                {actionQueues.pendaftaranMenunggu.map((row) => (
                  <div
                    key={row._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {row.namaPemohon}{" "}
                        <span className="text-xs font-normal text-slate-400">
                          ({row.jumlahPeserta} peserta • {row.asalNama})
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {row.posisi} • Daftar {formatDateShort(row.createdAt)}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 self-start sm:self-center shrink-0">
                      {row.status}
                    </span>
                  </div>
                ))}
              </QueueListEmptyOrRows>
            )}

            {queueTab === "logbook" && (
              <QueueListEmptyOrRows
                isEmpty={actionQueues.logbookMenunggu.length === 0}
                emptyLabel="Semua logbook pada filter ini sudah diverifikasi"
              >
                {actionQueues.logbookMenunggu.map((row, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {row.nama}{" "}
                        <span className="text-xs font-normal text-slate-400">
                          ({row.email})
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Mentor: <strong>{row.mentorName}</strong> • Terlama:{" "}
                        {formatDateShort(row.oldestDate)}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-[#0284c7] border border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800 self-start sm:self-center shrink-0">
                      {row.count} logbook menunggu
                    </span>
                  </div>
                ))}
              </QueueListEmptyOrRows>
            )}

            {queueTab === "laporan" && (
              <QueueListEmptyOrRows
                isEmpty={actionQueues.laporanMenunggu.length === 0}
                emptyLabel="Tidak ada laporan akhir menunggu review atau revisi"
              >
                {actionQueues.laporanMenunggu.map((row, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {row.nama}{" "}
                        <span className="text-xs font-normal text-slate-400">
                          ({row.email})
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Mentor: <strong>{row.mentorName}</strong> • Dikirim{" "}
                        {formatDateShort(row.submittedAt)}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border self-start sm:self-center shrink-0 ${
                        row.status === "Revisi"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800"
                          : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                      }`}
                    >
                      {row.status}
                    </span>
                  </div>
                ))}
              </QueueListEmptyOrRows>
            )}

            {queueTab === "dokumen" && (
              <QueueListEmptyOrRows
                isEmpty={actionQueues.dokumenBelumLengkap.length === 0}
                emptyLabel="Seluruh peserta selesai magang sudah lengkap dokumennya"
              >
                {actionQueues.dokumenBelumLengkap.map((row, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {row.nama}{" "}
                        <span className="text-xs font-normal text-slate-400">
                          • {row.posisi}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Mentor: <strong>{row.mentorName}</strong> • Selesai{" "}
                        {formatDateShort(row.tanggalSelesaiMagang)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1 self-start sm:self-center shrink-0">
                      {row.missing.map((m) => (
                        <span
                          key={m}
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
                        >
                          Blm {m}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </QueueListEmptyOrRows>
            )}
          </div>
        </div>

        {/* ================= PESERTA PER MENTOR (4 cols) ================= */}
        <div className="xl:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#0284c7]" />
                Peserta per Mentor
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Jumlah peserta bimbingan masing-masing mentor
              </p>
            </div>
          </div>

          {(() => {
            const sortedMentors = [...mentorWorkload].sort(
              (a, b) =>
                b.pesertaTotal - a.pesertaTotal ||
                b.pesertaAktif - a.pesertaAktif ||
                a.name.localeCompare(b.name, "id-ID"),
            );
            const maxVal = Math.max(1, sortedMentors[0]?.pesertaTotal || 1);

            if (sortedMentors.length === 0) {
              return (
                <p className="text-xs text-slate-400 py-8 text-center">
                  Belum ada data mentor dan peserta bimbingan.
                </p>
              );
            }

            return (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {sortedMentors.map((mentor, idx) => {
                  const widthPct = Math.round(
                    (mentor.pesertaTotal / maxVal) * 100,
                  );
                  return (
                    <div key={mentor.mentorId} className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                          {idx + 1}. {mentor.name}
                        </span>
                        <span className="font-bold text-[#0284c7] dark:text-sky-400 shrink-0 tabular-nums">
                          {mentor.pesertaTotal} peserta
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#0284c7]"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      {/* ================= REKAP TABEL TIME SERIES TERFILTER ================= */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Rekap Time Series Operasional
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ringkasan pendaftaran, verifikasi logbook, dan absensi sesuai
              filter aktif
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            {activeTrendRows.length}{" "}
            {trendChart.mode === "daily" ? "hari aktif" : "bulan aktif"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Periode</th>
                <th className="py-3 px-4 text-center">Pendaftar Masuk</th>
                <th className="py-3 px-4 text-center">Pendaftar Disetujui</th>
                <th className="py-3 px-4 text-center">Logbook Masuk</th>
                <th className="py-3 px-4 text-center">Logbook Disetujui</th>
                <th className="py-3 px-4 text-center">Logbook Menunggu</th>
                <th className="py-3 px-4 text-center">Total Absensi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {activeTrendRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 px-4 text-center text-xs text-slate-400"
                  >
                    Belum ada aktivitas tercatat pada filter periode ini.
                  </td>
                </tr>
              ) : (
                activeTrendRows.map((row) => (
                  <tr
                    key={row.label}
                    className="hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-100">
                      {row.label}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-200">
                      {row.pendaftaranMasuk}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-[#0284c7] dark:text-sky-400">
                      {row.pendaftaranDisetujui}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-200">
                      {row.logbookMasuk}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {row.logbookDisetujui}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-amber-600 dark:text-amber-400">
                      {row.logbookMenunggu}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                      {row.absensiTotal}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function QueueListEmptyOrRows({
  isEmpty,
  emptyLabel,
  children,
}: {
  isEmpty: boolean;
  emptyLabel: string;
  children: React.ReactNode;
}) {
  if (isEmpty) {
    return (
      <div className="py-10 text-center space-y-1.5">
        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {emptyLabel}
        </p>
      </div>
    );
  }
  return <div className="space-y-2.5">{children}</div>;
}
