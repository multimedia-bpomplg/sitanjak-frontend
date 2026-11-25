"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  Eye,
  FileText,
  Image as ImageIcon,
  Info,
  MessageSquareText,
  X,
} from "lucide-react";

export type AdminLogbookItem = {
  _id: string;
  date: string;
  status:
    | "hadir"
    | "tidak_hadir_keterangan"
    | "tidak_hadir_tanpa_keterangan"
    | string;
  judul?: string;
  pengalaman?: string;
  kendala?: string;
  keterangan?: string;
  files?: string[];
  pdfFile?: string | null;
  approvalStatus: "menunggu" | "disetujui" | "ditolak" | "revisi";
  mentorNote?: string;
  approvedAt?: string;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
};

type Props = {
  logbook: AdminLogbookItem;
  onClose: () => void;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function getFileUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const clean = path.replace(/^\/+/, "");
  return `${API_BASE}/${clean}`;
}

function getApprovalBadge(status: string) {
  switch (status) {
    case "disetujui":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
    case "ditolak":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800";
    case "revisi":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
    default:
      return "bg-sky-50 text-[#0284c7] border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800";
  }
}

function getAttendanceLabel(status: string) {
  if (status === "hadir") return "Hadir";
  if (status === "tidak_hadir_keterangan") return "Izin / Sakit";
  if (status === "tidak_hadir_tanpa_keterangan") return "Tanpa Keterangan";
  return status || "-";
}

export default function AdminLogbookModal({ logbook, onClose }: Props) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (previewImage) setPreviewImage(null);
      else onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, previewImage]);

  return (
    <>
      <div
        className="fixed inset-0 z-60 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="w-full max-w-3xl max-h-[90vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-linear-to-r from-[#0284c7] to-blue-700 px-6 py-4 text-white flex items-start justify-between gap-4 shrink-0">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Calendar className="w-4 h-4" />
                <h3 className="text-base sm:text-lg font-bold">
                  Detail Logbook Peserta
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-[#0284c7] capitalize">
                  {logbook.approvalStatus}
                </span>
              </div>
              <p className="text-xs text-sky-100 mt-1">
                {logbook.user?.name || "-"} ({logbook.user?.email || "-"}) •
                Tanggal: {logbook.date}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup modal logbook"
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                Kehadiran: {getAttendanceLabel(logbook.status)}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-semibold capitalize ${getApprovalBadge(
                  logbook.approvalStatus,
                )}`}
              >
                <Clock className="w-3.5 h-3.5" />
                Status Verifikasi: {logbook.approvalStatus}
              </span>
            </div>

            {logbook.status === "hadir" ? (
              <div className="space-y-4 min-w-0">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 min-w-0 overflow-hidden">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">
                    Judul / Aktivitas Utama
                  </p>
                  <p className="font-bold text-slate-900 dark:text-white whitespace-pre-wrap break-words wrap-anywhere">
                    {logbook.judul || "-"}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 min-w-0 overflow-hidden">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">
                    Uraian Pengalaman & Kegiatan
                  </p>
                  <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words wrap-anywhere leading-relaxed">
                    {logbook.pengalaman || "-"}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 min-w-0 overflow-hidden">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">
                    Kendala
                  </p>
                  <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words wrap-anywhere">
                    {logbook.kendala || "-"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 min-w-0 overflow-hidden">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase mb-1">
                  Keterangan Ketidakhadiran
                </p>
                <p className="text-slate-800 dark:text-slate-100 whitespace-pre-wrap break-words wrap-anywhere">
                  {logbook.keterangan || "-"}
                </p>
              </div>
            )}

            {/* Dokumentasi & Lampiran */}
            {((logbook.files && logbook.files.length > 0) ||
              logbook.pdfFile) && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Lampiran Dokumentasi
                </p>

                {logbook.files && logbook.files.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {logbook.files.map((imgPath, i) => {
                      const fullUrl = getFileUrl(imgPath);
                      return (
                        <button
                          key={`${imgPath}-${i}`}
                          type="button"
                          onClick={() => setPreviewImage(fullUrl)}
                          className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-slate-100 dark:bg-slate-800"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={fullUrl}
                            alt={`Dokumentasi ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                          <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold gap-1">
                            <ImageIcon className="w-4 h-4" />
                            Perbesar
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {logbook.pdfFile && (
                  <a
                    href={getFileUrl(logbook.pdfFile)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-50 text-[#0284c7] border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800 hover:bg-sky-100 transition"
                  >
                    <FileText className="w-4 h-4" />
                    Buka Lampiran PDF
                    <Eye className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}

            {/* Catatan Mentor (Read-only) */}
            {logbook.mentorNote && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5">
                  <MessageSquareText className="w-3.5 h-3.5" />
                  Catatan Mentor
                </p>
                <p className="text-slate-800 dark:text-slate-100 whitespace-pre-wrap break-words wrap-anywhere">
                  {logbook.mentorNote}
                </p>
              </div>
            )}

            {/* Info Read-only untuk Admin / Superadmin */}
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-sky-200/80 dark:border-sky-900/70 bg-sky-50/70 dark:bg-sky-950/30 text-xs text-sky-900 dark:text-sky-200">
              <Info className="w-4 h-4 text-[#0284c7] dark:text-sky-400 shrink-0 mt-0.5" />
              <span>
                Mode pemantauan: persetujuan, permintaan revisi, atau penolakan
                logbook hanya dapat dilakukan oleh Mentor pembimbing.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 flex justify-end shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-70 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewImage}
            alt="Preview Dokumentasi"
            className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain"
          />
        </div>
      )}
    </>
  );
}
