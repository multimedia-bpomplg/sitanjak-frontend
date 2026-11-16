"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Mail,
  Star,
  User,
  X,
  XCircle,
} from "lucide-react";
import { showToast } from "@/components/ui/toastDashboard";

export type AdminLaporanAkhirItem = {
  _id: string;
  judul?: string;
  status: string;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
  approvedByMentor?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  mentorNote?: string;
  approvedAt?: string;
  createdAt: string;
  fileUrl?: string;
  filePdf?: string;
  fileName?: string;
  fileSize?: number;
  penilaian?: Record<string, string | undefined>;
};

type Props = {
  laporan: AdminLaporanAkhirItem;
  onClose: () => void;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const ASPEK_PENILAIAN: Array<{ key: string; label: string }> = [
  { key: "kehadiranDisiplin", label: "Kehadiran & Disiplin" },
  { key: "sikapPerilaku", label: "Sikap & Perilaku" },
  { key: "kemampuanKomunikasi", label: "Kemampuan Komunikasi" },
  { key: "inisiatifTanggungJawab", label: "Inisiatif & Tanggung Jawab" },
  { key: "kemampuanAdaptasi", label: "Kemampuan Adaptasi" },
  { key: "pengetahuanTeknis", label: "Pengetahuan Teknis" },
  { key: "produktivitasKetepatanWaktu", label: "Produktivitas & Ketepatan Waktu" },
  { key: "kerjaSamaTim", label: "Kerja Sama Tim" },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "Disetujui":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
    case "Ditolak":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800";
    case "Revisi":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
    default:
      return "bg-sky-50 text-[#0284c7] border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800";
  }
}

function getNilaiBadge(val?: string) {
  const lower = (val || "").toLowerCase();
  if (lower === "sangat baik") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
  }
  if (lower === "baik") {
    return "bg-sky-50 text-[#0284c7] border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800";
  }
  if (lower === "buruk") {
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
  }
  if (lower === "sangat buruk") {
    return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800";
  }
  return "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
}

function formatFileSize(bytes?: number) {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function AdminLaporanAkhirModal({ laporan, onClose }: Props) {
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/superadmin/laporan-akhir/download/${laporan._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error("Gagal mengunduh PDF laporan");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        laporan.fileName ||
        `Laporan_Akhir_${laporan.user?.name || "Peserta"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast.success("PDF laporan akhir berhasil diunduh");
    } catch (err) {
      showToast.error(
        err instanceof Error ? err.message : "Gagal mengunduh PDF",
      );
    } finally {
      setDownloading(false);
    }
  };

  const handlePreviewPdf = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/superadmin/laporan-akhir/view/${laporan._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error("Gagal membuka pratinjau PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      showToast.error(
        err instanceof Error ? err.message : "Gagal membuka pratinjau PDF",
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-[#0284c7] to-blue-700 px-6 py-4 text-white flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <FileText className="w-5 h-5 shrink-0" />
              <h2 className="text-lg font-bold">Detail Laporan Akhir Magang</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-[#0284c7]">
                {laporan.status}
              </span>
            </div>
            <p className="text-xs text-sky-100 mt-1 truncate">
              {laporan.user?.name || "-"} • {laporan.user?.email || "-"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal laporan akhir"
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {/* Info Peserta & Dokumen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <p className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#0284c7]" />
                Peserta Magang
              </p>
              <p className="font-bold text-slate-900 dark:text-white">
                {laporan.user?.name || "-"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <Mail className="w-3 h-3" />
                {laporan.user?.email || "-"}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <p className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#0284c7]" />
                Status & Reviewer
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${getStatusBadge(
                    laporan.status,
                  )}`}
                >
                  {laporan.status === "Disetujui" ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : laporan.status === "Ditolak" ? (
                    <XCircle className="w-3.5 h-3.5" />
                  ) : (
                    <Clock className="w-3.5 h-3.5" />
                  )}
                  {laporan.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Mentor:{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {laporan.approvedByMentor?.name || "Belum direview mentor"}
                </span>
              </p>
            </div>
          </div>

          {/* File Box */}
          <div className="p-4 rounded-2xl border border-sky-200 dark:border-sky-800/60 bg-sky-50/60 dark:bg-sky-950/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#0284c7] dark:text-sky-400">
                Dokumen Laporan Akhir
              </p>
              <p className="font-bold text-slate-900 dark:text-white truncate mt-0.5">
                {laporan.judul || laporan.fileName || "Laporan Akhir Magang"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ukuran: {formatFileSize(laporan.fileSize)} • Diunggah:{" "}
                {new Date(laporan.createdAt).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handlePreviewPdf}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#0284c7] text-[#0284c7] dark:text-sky-300 bg-white dark:bg-slate-900 hover:bg-sky-50 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Pratinjau PDF
              </button>
              <button
                type="button"
                disabled={downloading}
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white shadow-xs transition disabled:opacity-60"
              >
                <Download className="w-3.5 h-3.5" />
                {downloading ? "Mengunduh..." : "Unduh PDF"}
              </button>
            </div>
          </div>

          {/* Catatan Mentor */}
          {laporan.mentorNote && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-1">
                Catatan Evaluasi Mentor
              </p>
              <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                {laporan.mentorNote}
              </p>
            </div>
          )}

          {/* Penilaian Mentor (8 Aspek) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                Hasil Penilaian Kinerja Mentor
              </h3>
            </div>

            {laporan.penilaian &&
            Object.values(laporan.penilaian).some(Boolean) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ASPEK_PENILAIAN.map((aspek) => {
                  const val = laporan.penilaian?.[aspek.key];
                  return (
                    <div
                      key={aspek.key}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2"
                    >
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {aspek.label}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold capitalize shrink-0 ${getNilaiBadge(
                          val,
                        )}`}
                      >
                        {val || "-"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
                Belum ada penilaian kinerja yang diisikan oleh mentor.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
