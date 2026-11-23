// components/Laporan/PenilaianModal.tsx
"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Award,
  Calendar,
  CheckCircle2,
  UserCheck,
  X,
} from "lucide-react";
import { showToast } from "@/components/ui/toastDashboard";

type Props = {
  onClose: () => void;
};

type Penilaian = {
  kehadiranDisiplin: string;
  sikapPerilaku: string;
  kemampuanKomunikasi: string;
  inisiatifTanggungJawab: string;
  kemampuanAdaptasi: string;
  pengetahuanTeknis: string;
  produktivitasKetepatanWaktu: string;
  kerjaSamaTim: string;
};

const PENILAIAN_LABELS: Record<keyof Penilaian, string> = {
  kehadiranDisiplin: "Kehadiran dan Disiplin",
  sikapPerilaku: "Sikap dan Perilaku",
  kemampuanKomunikasi: "Kemampuan Komunikasi",
  inisiatifTanggungJawab: "Inisiatif dan Tanggung Jawab",
  kemampuanAdaptasi: "Kemampuan Adaptasi",
  pengetahuanTeknis: "Pengetahuan Teknis",
  produktivitasKetepatanWaktu: "Produktivitas dan Ketepatan Waktu",
  kerjaSamaTim: "Kerja Sama Tim",
};

function getNilaiColor(nilai: string): string {
  switch (nilai) {
    case "sangat baik":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
    case "baik":
      return "bg-blue-50 text-[#1D64F2] border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800";
    case "buruk":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
    case "sangat buruk":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  }
}

function formatNilai(nilai: string): string {
  const map: Record<string, string> = {
    "sangat baik": "Sangat Baik",
    baik: "Baik",
    buruk: "Buruk",
    "sangat buruk": "Sangat Buruk",
  };
  return map[nilai] || nilai || "-";
}

export default function PenilaianModal({ onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [penilaian, setPenilaian] = useState<Penilaian | null>(null);
  const [mentorNote, setMentorNote] = useState("");
  const [approvedAt, setApprovedAt] = useState("");
  const [mentorName, setMentorName] = useState("");

  useEffect(() => {
    let active = true;

    const fetchPenilaian = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token") ?? "";
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/laporan-akhir/penilaian`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!active) return;

        if (res.ok) {
          const data = await res.json();
          setPenilaian(data.penilaian);
          setMentorNote(data.mentorNote || "");
          setApprovedAt(data.approvedAt || "");
          setMentorName(data.approvedBy?.name || "Mentor");
        } else {
          showToast.error("Gagal mengambil data penilaian");
          onClose();
        }
      } catch (error) {
        console.error(error);
        if (active) {
          showToast.error("Terjadi kesalahan saat memuat penilaian");
          onClose();
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPenilaian();
    return () => {
      active = false;
    };
  }, [onClose]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-xs p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-3 min-w-[240px]">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-[#1D64F2] mx-auto" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Memuat penilaian mentor...
          </p>
        </div>
      </div>
    );
  }

  const aspectKeys = Object.keys(PENILAIAN_LABELS) as Array<keyof Penilaian>;
  const goodCount = penilaian
    ? Object.values(penilaian).filter(
        (v) => v === "sangat baik" || v === "baik",
      ).length
    : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-xs p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* ================= HEADER ================= */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1D64F2] dark:text-blue-400 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight"
                style={{ fontWeight: 800 }}
              >
                Penilaian Mentor
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Hasil evaluasi laporan akhir dari mentor pembimbing
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal penilaian"
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= BODY ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#F8FAFC] dark:bg-slate-950/50 space-y-4">
          {/* INFO MENTOR */}
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1D64F2] dark:text-blue-400 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Direview Oleh
                </p>
                <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  {mentorName}
                </p>
                {approvedAt && (
                  <p className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {new Date(approvedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 shrink-0">
              Disetujui
            </span>
          </div>

          {/* ASPEK PENILAIAN */}
          {penilaian && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 px-0.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#1D64F2] dark:text-blue-400" />
                  <span>Aspek Penilaian</span>
                </h3>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {aspectKeys.length} indikator
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {aspectKeys.map((key) => (
                  <div
                    key={key}
                    className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-3.5 py-3 flex items-center justify-between gap-2.5 shadow-2xs"
                  >
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 leading-snug">
                      {PENILAIAN_LABELS[key]}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 whitespace-nowrap ${getNilaiColor(
                        penilaian[key],
                      )}`}
                    >
                      {formatNilai(penilaian[key])}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CATATAN MENTOR */}
          {mentorNote && (
            <div className="rounded-xl bg-[#FFFBEB] dark:bg-amber-950/40 border border-[#FDE68A] dark:border-amber-800/70 p-3.5 sm:p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-sm font-bold text-amber-900 dark:text-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Catatan Review Mentor</span>
              </div>
              <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-100 pl-5.5 whitespace-pre-line break-words [overflow-wrap:anywhere] leading-relaxed">
                {mentorNote}
              </p>
            </div>
          )}

          {/* RINGKASAN */}
          {penilaian && (
            <div className="rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70 px-4 py-3 flex items-center gap-2.5 text-xs sm:text-sm text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p>
                <span className="font-bold">Ringkasan:</span> {goodCount} dari{" "}
                {aspectKeys.length} aspek mendapat nilai Baik atau Sangat Baik.
              </p>
            </div>
          )}
        </div>

        {/* ================= FOOTER ================= */}
        <div className="px-5 sm:px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
