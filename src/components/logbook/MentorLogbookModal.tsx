"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Calendar,
  Check,
  Clock,
  Edit3,
  Eye,
  FileText,
  Image as ImageIcon,
  Lock,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { showToast } from "@/components/ui/toastDashboard";

type Props = {
  date: string;
  pesertaId: string;
  pesertaNama: string;
  onClose: () => void;
  onUpdated?: () => void;
};

const QUICK_NOTES = [
  "Sudah baik dan sesuai, pertahankan.",
  "Mohon lengkapi uraian aktivitas hari ini.",
  "Mohon tambahkan dokumentasi atau bukti kegiatan.",
];

export default function MentorLogbookModal({
  date,
  pesertaId,
  pesertaNama,
  onClose,
  onUpdated,
}: Props) {
  const [logbookId, setLogbookId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("hadir");
  const [judul, setJudul] = useState("");
  const [pengalaman, setPengalaman] = useState("");
  const [kendala, setKendala] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [mentorNote, setMentorNote] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<
    "menunggu" | "disetujui" | "ditolak" | "revisi"
  >("menunggu");
  const [isFinalized, setIsFinalized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvedAt, setApprovedAt] = useState<string>("");
  const [notFound, setNotFound] = useState(false);

  const fetchLogbook = useCallback(async () => {
    setIsLoading(true);
    setNotFound(false);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/logbook/mentor/peserta/${pesertaId}/date/${date}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (res.status === 404) {
        setNotFound(true);
        showToast.error("Logbook ini belum dibuat oleh peserta");
        return;
      }

      if (!res.ok) throw new Error("Gagal mengambil logbook");

      const data = await res.json();

      setLogbookId(data._id);
      setStatus(data.status);
      setJudul(data.judul || "");
      setPengalaman(data.pengalaman || "");
      setKendala(data.kendala || "");
      setKeterangan(data.keterangan || "");
      setFiles(data.files || []);
      setPdfFile(data.pdfFile || null);
      setApprovalStatus(data.approvalStatus || "menunggu");
      setMentorNote(data.mentorNote || "");
      setApprovedAt(data.approvedAt || "");
      setIsFinalized(Boolean(data.isFinalized));
    } catch {
      showToast.error("Gagal memuat logbook");
    } finally {
      setIsLoading(false);
    }
  }, [date, pesertaId]);

  useEffect(() => {
    fetchLogbook();
  }, [fetchLogbook]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (previewImage) {
          setPreviewImage(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewImage, onClose]);

  const getImageUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    if (path.startsWith("uploads/")) {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        "";
      return `${baseUrl.replace(/\/$/, "")}/${path}`;
    }
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    return `${baseUrl}/${path}`;
  };

  const handleApprove = async (approved: boolean) => {
    if (!logbookId) {
      showToast.error("Logbook tidak ditemukan");
      return;
    }

    if (isFinalized) {
      showToast.error("Logbook sudah diproses dan tidak dapat diubah");
      return;
    }

    if (!mentorNote.trim()) {
      showToast.error("Harap berikan catatan terlebih dahulu");
      return;
    }

    setIsSubmitting(true);
    const toastId = showToast.loading("Memproses logbook...");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/logbook/mentor/approve/${logbookId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            approvalStatus: approved ? "disetujui" : "ditolak",
            mentorNote: mentorNote.trim(),
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal memproses logbook");
      }

      setIsFinalized(true);
      setApprovalStatus(approved ? "disetujui" : "ditolak");
      setApprovedAt(new Date().toISOString());

      showToast.updateSuccess(
        toastId,
        approved ? "Logbook berhasil disetujui" : "Logbook berhasil ditolak",
      );

      onUpdated?.();

      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      showToast.updateError(toastId, message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevision = async () => {
    if (!logbookId) {
      showToast.error("Logbook tidak ditemukan");
      return;
    }

    if (!mentorNote.trim()) {
      showToast.error("Catatan revisi wajib diisi");
      return;
    }

    setIsSubmitting(true);
    const toastId = showToast.loading("Mengirim permintaan revisi...");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/logbook/mentor/request-revision/${logbookId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            revisionNote: mentorNote.trim(),
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal mengirim revisi");
      }

      showToast.updateSuccess(toastId, "Permintaan revisi berhasil dikirim");

      setApprovalStatus("revisi");
      setIsFinalized(false);
      onUpdated?.();

      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      showToast.updateError(toastId, message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "";
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return dateString;
    return parsed.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatSimpleDate = (dateString: string) => {
    if (!dateString) return "";
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return dateString;
    return parsed.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
        <div className="w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center shadow-2xl">
          <div className="animate-spin mx-auto h-10 w-10 rounded-full border-3 border-slate-200 border-t-[#0284c7]" />
          <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Memuat detail logbook...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-3xl rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= HEADER (TEMA BIRU SIDEBAR) ================= */}
        <div className="px-5 sm:px-6 py-4 bg-linear-to-r from-[#0284c7] via-sky-600 to-blue-700 dark:from-[#0369a1] dark:to-blue-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-white/20 rounded-xl shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold leading-tight truncate">
                Verifikasi Logbook Harian
              </h2>
              <p className="text-xs sm:text-sm text-sky-100 truncate">
                {pesertaNama} • {formatSimpleDate(date)}
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
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5">
          {notFound ? (
            <div className="rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 p-10 text-center space-y-2">
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="font-bold text-slate-700 dark:text-slate-200">
                Belum Ada Logbook pada Tanggal Ini
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Peserta belum mengisi catatan logbook untuk tanggal{" "}
                {formatSimpleDate(date)}.
              </p>
            </div>
          ) : (
            <>
              {/* Status Approval Banner */}
              <div
                className={`rounded-xl border px-4 py-3.5 flex items-start gap-3 ${
                  approvalStatus === "disetujui"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                    : approvalStatus === "ditolak"
                      ? "border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
                      : approvalStatus === "revisi"
                        ? "border-purple-200 bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300"
                        : "border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300"
                }`}
              >
                <span className="mt-0.5 shrink-0">
                  {approvalStatus === "disetujui" ? (
                    <Check className="w-5 h-5" />
                  ) : approvalStatus === "ditolak" ? (
                    <X className="w-5 h-5" />
                  ) : approvalStatus === "revisi" ? (
                    <Edit3 className="w-5 h-5" />
                  ) : (
                    <Clock className="w-5 h-5" />
                  )}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">
                    {approvalStatus === "disetujui"
                      ? "Logbook Disetujui"
                      : approvalStatus === "ditolak"
                        ? "Logbook Ditolak"
                        : approvalStatus === "revisi"
                          ? "Menunggu Revisi Peserta"
                          : "Menunggu Persetujuan Mentor"}
                  </p>
                  {approvedAt && approvalStatus !== "menunggu" && (
                    <p className="text-xs opacity-85 mt-0.5">
                      Diproses pada: {formatDateTime(approvedAt)}
                    </p>
                  )}
                </div>

                {isFinalized && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/70 dark:bg-slate-900/60 shrink-0">
                    <Lock className="w-3 h-3" />
                    Final
                  </span>
                )}
              </div>

              {/* Kehadiran */}
              <div className="rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Status Kehadiran
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                    status === "hadir"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                      : status === "tidak_hadir_keterangan"
                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                        : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
                  }`}
                >
                  {status === "hadir" ? (
                    <UserCheck className="w-3.5 h-3.5" />
                  ) : (
                    <UserX className="w-3.5 h-3.5" />
                  )}
                  {status === "hadir"
                    ? "Hadir"
                    : status === "tidak_hadir_keterangan"
                      ? "Tidak Hadir (Dengan Keterangan)"
                      : "Tidak Hadir (Tanpa Keterangan)"}
                </span>
              </div>

              {/* Konten Logbook */}
              {status === "hadir" && (
                <div className="space-y-4">
                  <FieldSection label="Uraian Aktivitas" value={judul} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FieldSection label="Pembelajaran" value={pengalaman} />
                    <FieldSection label="Kendala" value={kendala} />
                  </div>
                </div>
              )}

              {status === "tidak_hadir_keterangan" && (
                <FieldSection label="Alasan Tidak Hadir" value={keterangan} />
              )}

              {/* Dokumentasi Foto */}
              {status !== "tidak_hadir_tanpa_keterangan" && (
                <div className="rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <ImageIcon className="w-4 h-4 text-[#0284c7]" />
                    <span>
                      {status === "hadir"
                        ? "Dokumentasi Kegiatan"
                        : "Bukti Pendukung"}
                    </span>
                  </div>

                  {files.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {files.map((f, i) => {
                        const imageUrl = getImageUrl(f);
                        return (
                          <button
                            type="button"
                            key={i}
                            onClick={() => setPreviewImage(imageUrl)}
                            className="relative group overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
                          >
                            <img
                              src={imageUrl}
                              className="w-full h-32 object-cover group-hover:scale-105 transition"
                              alt={`Dokumentasi ${i + 1}`}
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://via.placeholder.com/300x200?text=Gambar+Tidak+Tersedia";
                              }}
                            />
                            <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/35 transition flex items-center justify-center">
                              <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      Tidak ada lampiran foto
                    </p>
                  )}
                </div>
              )}

              {/* Lampiran PDF */}
              {pdfFile && (
                <a
                  href={getImageUrl(pdfFile)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-4 p-4 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-950/40 hover:bg-sky-100/70 dark:hover:bg-sky-900/50 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#0284c7] text-white flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Lampiran Dokumen PDF
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Klik untuk membuka file di tab baru
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 text-[#0284c7] dark:text-sky-300 border border-sky-200 dark:border-sky-700 shrink-0">
                    Lihat PDF
                  </span>
                </a>
              )}

              {/* Catatan Mentor */}
              <div className="rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Catatan Mentor{" "}
                  {!isFinalized && <span className="text-rose-500">*</span>}
                </label>

                {isFinalized ? (
                  <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line">
                    {mentorNote || "-"}
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_NOTES.map((note) => (
                        <button
                          key={note}
                          type="button"
                          onClick={() => setMentorNote(note)}
                          className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-50 hover:text-[#0284c7] dark:hover:bg-sky-950/60 dark:hover:text-sky-300 border border-slate-200 dark:border-slate-700 transition"
                        >
                          + {note}
                        </button>
                      ))}
                    </div>

                    <textarea
                      value={mentorNote}
                      onChange={(e) => setMentorNote(e.target.value)}
                      rows={3}
                      placeholder="Tulis catatan evaluasi atau arahan untuk peserta..."
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7] resize-none transition"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      * Catatan wajib diisi sebelum menyetujui, meminta revisi,
                      atau menolak logbook. Keputusan Setujui/Tolak bersifat
                      final.
                    </p>
                  </>
                )}
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

          {!notFound && !isFinalized && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleApprove(false)}
                disabled={isSubmitting || !mentorNote.trim()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 transition"
              >
                <X className="w-3.5 h-3.5" />
                Tolak
              </button>

              <button
                type="button"
                onClick={handleRevision}
                disabled={isSubmitting || !mentorNote.trim()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Minta Revisi
              </button>

              <button
                type="button"
                onClick={() => handleApprove(true)}
                disabled={isSubmitting || !mentorNote.trim()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 transition"
              >
                <Check className="w-3.5 h-3.5" />
                Setujui
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================= IMAGE PREVIEW LIGHTBOX ================= */}
      {previewImage && (
        <div
          className="fixed inset-0 z-60 bg-slate-950/90 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            aria-label="Tutup pratinjau gambar"
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={previewImage}
            className="max-h-[85vh] max-w-full rounded-xl object-contain"
            alt="Preview Dokumentasi"
            onClick={(e) => e.stopPropagation()}
            onError={(e) => {
              e.currentTarget.src =
                "https://via.placeholder.com/800x600?text=Gambar+Tidak+Dapat+Dimuat";
            }}
          />
        </div>
      )}
    </div>
  );
}

function FieldSection({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 p-4 space-y-1.5">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="text-sm leading-relaxed whitespace-pre-line text-slate-800 dark:text-slate-200">
        {value || <span className="text-slate-400">-</span>}
      </p>
    </div>
  );
}
