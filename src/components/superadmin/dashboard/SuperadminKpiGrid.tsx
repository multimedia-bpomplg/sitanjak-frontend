"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  ClipboardList,
  FileSignature,
  GraduationCap,
  MessageSquareHeart,
  ShieldCheck,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";
import type { SuperadminDashboardSummary } from "./types";

type Props = {
  cards: SuperadminDashboardSummary["cards"];
};

export default function SuperadminKpiGrid({ cards }: Props) {
  const actionCards: Array<{
    title: string;
    value: number;
    subtitle: string;
    href: string;
    icon: React.ReactNode;
    accent: "amber" | "rose" | "sky" | "indigo" | "violet" | "emerald";
  }> = [
    {
      title: "Pendaftaran Menunggu",
      value: cards.pendaftaranMenunggu + cards.pendaftaranSedangDiproses,
      subtitle: `${cards.pendaftaranMenunggu} menunggu • ${cards.pendaftaranSedangDiproses} diproses (${cards.pendaftaranHariIni} hari ini)`,
      href: "/dashboard/superadmin/ViewPendaftaran",
      icon: <ClipboardList className="w-4 h-4" />,
      accent: "amber",
    },
    {
      title: "Peserta Tanpa Mentor",
      value: cards.pesertaTanpaMentor,
      subtitle: `Dari ${cards.pesertaDisetujuiTotal} peserta disetujui`,
      href: "/dashboard/superadmin/ViewPeserta",
      icon: <UserX className="w-4 h-4" />,
      accent: "rose",
    },
    {
      title: "Logbook Belum Diverifikasi",
      value: cards.logbookMenunggu,
      subtitle: `${cards.logbookDisetujui} disetujui • ${cards.logbookRevisi} revisi • ${cards.logbookDitolak} ditolak`,
      href: "/dashboard/superadmin/ViewLogbook",
      icon: <BookOpenCheck className="w-4 h-4" />,
      accent: "sky",
    },
    {
      title: "Laporan Akhir Perlu Review",
      value: cards.laporanMenunggu,
      subtitle: `${cards.laporanRevisi} revisi • ${cards.laporanDisetujui} disetujui • ${cards.laporanDitolak} ditolak`,
      href: "/dashboard/superadmin/ViewLaporanAkhir",
      icon: <GraduationCap className="w-4 h-4" />,
      accent: "indigo",
    },
    {
      title: "Evaluasi & Nilai Tertunda",
      value: cards.evaluasiMenunggu + cards.belumDinilaiSelesai,
      subtitle: `${cards.evaluasiMenunggu} evaluasi menunggu • ${cards.belumDinilaiSelesai} selesai blm dinilai`,
      href: "/dashboard/superadmin/ViewEvaluasi",
      icon: <FileSignature className="w-4 h-4" />,
      accent: "violet",
    },
    {
      title: "Feedback & Dokumen Selesai",
      value: cards.feedbackBelumDirespon + cards.selesaiBelumSertifikat,
      subtitle: `${cards.feedbackBelumDirespon} feedback blm respon • ${cards.selesaiBelumSurat} surat / ${cards.selesaiBelumSertifikat} sertif`,
      href: "/dashboard/superadmin/ViewFeedback",
      icon: <MessageSquareHeart className="w-4 h-4" />,
      accent: "emerald",
    },
  ];

  const accentBadgeMap = {
    amber:
      "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/70",
    rose: "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/70",
    sky: "bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400 border-sky-200 dark:border-sky-800/70",
    indigo:
      "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/70",
    violet:
      "bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800/70",
    emerald:
      "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/70",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#0284c7]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Ringkasan &amp; Antrean Verifikasi
          </h2>
        </div>
        <span className="text-[11px] text-slate-400">
          Klik kartu untuk membuka modul pengelolaan
        </span>
      </div>

      {/* ================= GRID 4 KOLOM (2 BARIS x 4 KARTU) ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/dashboard/superadmin/ViewPeserta"
          className="group rounded-2xl p-4 bg-linear-to-br from-[#0284c7] to-blue-700 text-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-sky-100">
                Peserta Sedang Magang
              </p>
              <p className="text-2xl font-extrabold mt-1 tabular-nums">
                {cards.pesertaSedangMagang}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-1 pt-2 border-t border-white/15">
            <span className="text-[11px] text-sky-100 truncate">
              {cards.pesertaBelumMulai} belum mulai • {cards.pesertaSelesai} selesai
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-sky-100 group-hover:translate-x-0.5 transition shrink-0" />
          </div>
        </Link>

        <Link
          href="/dashboard/superadmin/ViewPendaftaran"
          className="group rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#0284c7]/60 hover:shadow-md transition-all flex flex-col justify-between gap-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Pendaftaran Disetujui
              </p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 tabular-nums">
                {cards.pendaftaranDisetujui}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl border bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/70 flex items-center justify-center shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Total {cards.pendaftaranTotal} pengajuan ({cards.pendaftaranDitolak} ditolak)
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0284c7] group-hover:translate-x-0.5 transition shrink-0" />
          </div>
        </Link>

        {actionCards.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#0284c7]/60 hover:shadow-md transition-all flex flex-col justify-between gap-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {item.title}
                </p>
                <p
                  className={`text-2xl font-extrabold mt-1 tabular-nums ${
                    item.value > 0
                      ? "text-slate-900 dark:text-white"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {item.value}
                </p>
              </div>
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${accentBadgeMap[item.accent]}`}
              >
                {item.icon}
              </div>
            </div>

            <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {item.subtitle}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0284c7] group-hover:translate-x-0.5 transition shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
