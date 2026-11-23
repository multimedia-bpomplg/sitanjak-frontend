"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Lock,
  MessageSquare,
  Paperclip,
  X,
  XCircle,
} from "lucide-react";
import { showToast } from "@/components/ui/toastDashboard";

type Props = {
  peserta: {
    id: string;
    nama: string;
    email: string;
    posisi: string;
  };
  onClose: () => void;
  onStatusUpdate?: () => void;
};

type LaporanData = {
  _id: string;
  status: "Menunggu" | "Disetujui" | "Ditolak";
  filePdf: string;
  fileName?: string;
  fileSize?: number;
  lampiran1Pdf?: string | null;
  lampiran1Name?: string | null;
  lampiran1Size?: number | null;
  lampiran2Pdf?: string | null;
  lampiran2Name?: string | null;
  lampiran2Size?: number | null;
  mentorNote?: string;
  submittedAt?: string;
  createdAt?: string;
  approvedAt?: string;
};

function formatFileSize(bytes?: number | null): string {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateId(dateStr?: string, withTime = false): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

function getFileUrl(filePath?: string | null): string {
  if (!filePath) return "";
  const normalized = filePath.replace(/\\/g, "/");
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  return `${baseUrl}/${normalized.replace(/^\//, "")}`;
}

export default function MentorLaporanAkhirModal({
  peserta,
  onClose,
  onStatusUpdate,
}: Props) {
  const [laporan, setLaporan] = useState<LaporanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mentorNote, setMentorNote] = useState("");
  const [status, setStatus] = useState<"Disetujui" | "Ditolak">("Disetujui");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPdf, setShowPdf] = useState(false);

  const fetchLaporanAkhirPeserta = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      if (!peserta.email || !peserta.email.includes("@")) {
        setLaporan(null);
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/laporan-akhir/mentor/peserta-email/${encodeURIComponent(peserta.email)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) {
        setLaporan(null);
        setMentorNote("");
        setStatus("Disetujui");
        return;
      }

      const data: LaporanData = await res.json();
      setLaporan(data);
      setMentorNote(data.mentorNote || "");
      setStatus(data.status === "Ditolak" ? "Ditolak" : "Disetujui");
    } catch (error) {
      console.error("Gagal memuat laporan akhir:", error);
      setLaporan(null);
    } finally {
      setLoading(false);
    }
  }, [peserta.email]);

  useEffect(() => {
    fetchLaporanAkhirPeserta();
  }, [fetchLaporanAkhirPeserta]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showConfirm) {
          setShowConfirm(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showConfirm, onClose]);

  const alreadyReviewed =
    laporan?.status === "Disetujui" || laporan?.status === "Ditolak";

  const isCommentFilled = mentorNote.trim().length > 0;
  const canSubmit = !submitting && !alreadyReviewed && isCommentFilled;

  const handleUpdateStatus = async () => {
    if (!laporan || alreadyReviewed) return;

    if (!mentorNote.trim()) {
      showToast.error("Komentar mentor wajib diisi");
      return;
    }

    setSubmitting(true);
    const toastId = showToast.loading("Menyimpan review laporan akhir...");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/laporan-akhir/mentor/update-status-penilaian/${laporan._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
            mentorNote: mentorNote.trim(),
          }),
        },
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Gagal mengupdate status");
      }

      showToast.updateSuccess(toastId, "Review laporan akhir berhasil disimpan");
      await fetchLaporanAkhirPeserta();
      onStatusUpdate?.();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengupdate status";
      showToast.updateError(toastId, message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!laporan) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/laporan-akhir/mentor/download/${laporan._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error("Gagal mengunduh PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = laporan.fileName || "Laporan_Akhir.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showToast.error("Gagal mengunduh PDF");
    }
  };

  const lampiranList = [
    laporan?.lampiran1Pdf
      ? {
          label: "Lampiran 1",
          name: laporan.lampiran1Name || "Lampiran_1.pdf",
          size: laporan.lampiran1Size,
          url: getFileUrl(laporan.lampiran1Pdf),
        }
      : null,
    laporan?.lampiran2Pdf
      ? {
          label: "Lampiran 2",
          name: laporan.lampiran2Name || "Lampiran_2.pdf",
          size: laporan.lampiran2Size,
          url: getFileUrl(laporan.lampiran2Pdf),
        }
      : null,
  ].filter(Boolean) as Array<{
    label: string;
    name: string;
    size?: number | null;
    url: string;
  }>;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-5"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-4xl bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= HEADER (TEMA BIRU SIDEBAR) ================= */}
        <div className="px-5 sm:px-6 py-4 bg-linear-to-r from-[#0284c7] via-sky-600 to-blue-700 dark:from-[#0369a1] dark:to-blue-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-white/20 rounded-xl shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold truncate">
                Review Laporan Akhir
              </h2>
              <p className="text-xs sm:text-sm text-sky-100 truncate">
                {peserta.nama} • {peserta.posisi}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= BODY ================= */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">
          {loading ? (
            <div className="py-14 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-3 border-slate-200 border-t-[#0284c7] mx-auto" />
              <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                Memuat laporan akhir...
              </p>
            </div>
          ) : !laporan ? (
            <div className="rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 py-14 px-4 text-center space-y-2">
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-base font-bold text-slate-700 dark:text-slate-200">
                Belum Ada Laporan Akhir
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Peserta belum mengunggah dokumen laporan akhir magang.
              </p>
            </div>
          ) : (
            <>
              {/* Status Banner */}
              <div
                className={`rounded-xl border px-4 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                  laporan.status === "Disetujui"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                    : laporan.status === "Ditolak"
                      ? "border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
                      : "border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0">
                    {laporan.status === "Disetujui" ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : laporan.status === "Ditolak" ? (
                      <XCircle className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-bold">
                      {laporan.status === "Disetujui"
                        ? "Laporan Disetujui"
                        : laporan.status === "Ditolak"
                          ? "Laporan Ditolak"
                          : "Menunggu Review Mentor"}
                    </p>
                    <p className="text-xs opacity-85 mt-0.5">
                      {alreadyReviewed && laporan.approvedAt
                        ? `Direview pada ${formatDateId(laporan.approvedAt, true)}`
                        : `Diunggah pada ${formatDateId(laporan.submittedAt || laporan.createdAt, true)}`}
                    </p>
                  </div>
                </div>

                {alreadyReviewed && (
                  <span className="self-start sm:self-center inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/75 dark:bg-slate-900/60 shrink-0">
                    <Lock className="w-3 h-3" />
                    Review Final
                  </span>
                )}
              </div>

              {/* File Laporan Utama + Preview */}
              <div className="rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0284c7] dark:bg-sky-950/60 dark:text-sky-300 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {laporan.fileName || "Laporan_Akhir.pdf"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Ukuran: {formatFileSize(laporan.fileSize)} • Diunggah{" "}
                        {formatDateId(laporan.submittedAt || laporan.createdAt)}
                      </p>
                    </div>
                  </div>

                  {laporan.filePdf && (
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowPdf((v) => !v)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-50 text-[#0284c7] border border-sky-200 hover:bg-[#0284c7] hover:text-white dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {showPdf ? "Tutup Preview" : "Preview PDF"}
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadPdf}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Unduh PDF
                      </button>
                    </div>
                  )}
                </div>

                {showPdf && laporan.filePdf && (
                  <div className="rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700">
                    <iframe
                      src={`${getFileUrl(laporan.filePdf)}#toolbar=0&navpanes=0`}
                      className="w-full h-[460px] sm:h-[540px]"
                      title="Preview Laporan Akhir PDF"
                    />
                  </div>
                )}

                {/* Lampiran Tambahan (jika ada) */}
                {lampiranList.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5" />
                      Lampiran Tambahan
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {lampiranList.map((lamp) => (
                        <a
                          key={lamp.label}
                          href={lamp.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-sky-300 dark:hover:border-sky-700 transition text-xs"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                              {lamp.label}: {lamp.name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {formatFileSize(lamp.size)}
                            </p>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Review & Catatan Mentor */}
              <div className="rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 space-y-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#0284c7] dark:bg-sky-950/60 dark:text-sky-300 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Review & Catatan Mentor
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {alreadyReviewed
                          ? "Review sudah bersifat final dan tidak dapat diubah"
                          : "Pilih keputusan persetujuan laporan dan berikan catatan atau komentar"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pilihan Status */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Keputusan Review
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(["Disetujui", "Ditolak"] as const).map((option) => {
                      const active = status === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          disabled={alreadyReviewed}
                          onClick={() => setStatus(option)}
                          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold border transition ${
                            alreadyReviewed
                              ? active
                                ? option === "Disetujui"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                  : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                                : "bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700 opacity-60 cursor-not-allowed"
                              : active
                                ? option === "Disetujui"
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                  : "bg-rose-600 text-white border-rose-600 shadow-xs"
                                : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          {option === "Disetujui" ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Komentar Mentor */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Catatan / Komentar Mentor{" "}
                    {!alreadyReviewed && <span className="text-rose-500">*</span>}
                  </label>
                  <textarea
                    value={mentorNote}
                    onChange={(e) =>
                      !alreadyReviewed && setMentorNote(e.target.value)
                    }
                    disabled={alreadyReviewed}
                    readOnly={alreadyReviewed}
                    rows={3}
                    placeholder="Berikan catatan evaluasi atau alasan keputusan..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7] resize-none disabled:opacity-75 transition"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* ================= FOOTER ================= */}
        <div className="px-5 sm:px-6 py-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Tutup
          </button>

          {laporan && !alreadyReviewed && (
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => setShowConfirm(true)}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white transition ${
                !canSubmit
                  ? "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed"
                  : status === "Disetujui"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
              }`}
            >
              {status === "Disetujui" ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Setujui Laporan
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  Tolak Laporan
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ================= MODAL KONFIRMASI ================= */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center ${
                status === "Disetujui"
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                  : "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Konfirmasi {status === "Disetujui" ? "Persetujuan" : "Penolakan"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Keputusan ini bersifat final dan tidak dapat diubah kembali.
                Lanjutkan {status === "Disetujui" ? "menyetujui" : "menolak"}{" "}
                laporan akhir ini?
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirm(false);
                  handleUpdateStatus();
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold text-white transition ${
                  status === "Disetujui"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
