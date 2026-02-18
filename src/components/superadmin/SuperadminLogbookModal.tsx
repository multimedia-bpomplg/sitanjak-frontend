// components/superadmin/SuperadminLogbookModal.tsx
"use client";

import { useState, useEffect } from "react";
import {
  FiX,
  FiCalendar,
  FiFileText,
  FiImage,
  FiCheck,
  FiXCircle,
  FiUser,
  FiMail,
  FiClock,
  FiEdit,
  FiEye,
  FiUserCheck,
  FiUserX,
} from "react-icons/fi";
import { showToast } from "@/components/ui/toastDashboard";

type Props = {
  logbook: any;
  onClose: () => void;
  onAction: (id: string, status: string, note: string) => Promise<void>;
  userRole: string;
  userName: string;
};

export default function SuperadminLogbookModal({
  logbook,
  onClose,
  onAction,
  userRole,
  userName,
}: Props) {
  const [note, setNote] = useState(logbook?.mentorNote || "");
  const [approvalStatus, setApprovalStatus] = useState(
    logbook?.approvalStatus || "menunggu",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const getImageUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${process.env.NEXT_PUBLIC_API_URL || window.location.origin}/${path}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
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
    return new Date(dateString).toLocaleDateString("id-ID");
  };

  // Simulasi riwayat approval (nanti bisa diganti dengan data real dari API)
  useEffect(() => {
    if (logbook?.approvalHistory) {
      setHistory(logbook.approvalHistory);
    } else if (logbook?.approvedAt) {
      // Buat riwayat dummy jika tidak ada history
      const dummyHistory = [];
      if (logbook.approvedByMentor) {
        dummyHistory.push({
          action:
            logbook.approvalStatus === "disetujui" ? "disetujui" : "ditolak",
          by: "Mentor",
          note: logbook.mentorNote,
          date: logbook.approvedAt,
        });
      }
      if (logbook.superadminAction) {
        dummyHistory.push({
          action: logbook.superadminAction,
          by: "Superadmin",
          note: logbook.superadminNote,
          date: logbook.superadminActionAt,
        });
      }
      setHistory(dummyHistory);
    }
  }, [logbook]);

  const handleAction = async (status: "disetujui" | "ditolak" | "revisi") => {
    if (!logbook?._id) return;

    if ((status === "ditolak" || status === "revisi") && !note.trim()) {
      showToast.error(
        `Catatan wajib diisi untuk ${status === "ditolak" ? "penolakan" : "revisi"}`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onAction(logbook._id, status, note);
      showToast.success(
        `Logbook berhasil ${status === "disetujui" ? "disetujui" : status === "ditolak" ? "ditolak" : "direvisi"}`,
      );
      onClose();
    } catch (error) {
      showToast.error("Gagal memproses logbook");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-[#F59E0B] via-[#B91C1C] to-[#7F1D1D] dark:from-indigo-600 dark:to-violet-500 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FiCalendar className="text-xl" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold">Detail Logbook</h2>
                <p className="text-xs sm:text-sm opacity-90">
                  {logbook?.user?.name} • {formatSimpleDate(logbook?.date)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                  title="Lihat Riwayat"
                >
                  <FiClock className="text-xl" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition"
              >
                <FiX className="text-xl" />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-6">
          {/* Riwayat Approval */}
          {showHistory && history.length > 0 && (
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-700 dark:text-white flex items-center gap-2">
                <FiClock /> Riwayat Persetujuan
              </h3>
              <div className="space-y-3">
                {history.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm">
                    <div
                      className={`
                      w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                      ${
                        item.action === "disetujui"
                          ? "bg-emerald-100 text-emerald-600"
                          : item.action === "ditolak"
                            ? "bg-red-100 text-red-600"
                            : "bg-amber-100 text-amber-600"
                      }
                    `}
                    >
                      {item.action === "disetujui" ? (
                        <FiCheck className="w-3 h-3" />
                      ) : item.action === "ditolak" ? (
                        <FiXCircle className="w-3 h-3" />
                      ) : (
                        <FiEdit className="w-3 h-3" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 dark:text-white">
                        {item.action === "disetujui"
                          ? "Disetujui"
                          : item.action === "ditolak"
                            ? "Ditolak"
                            : "Revisi"}{" "}
                        oleh {item.by}
                      </p>
                      {item.note && (
                        <p className="text-slate-600 dark:text-slate-300 mt-1 text-xs">
                          Catatan: {item.note}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        {formatDate(item.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div
            className={`
            px-4 py-3 rounded-xl border
            ${
              approvalStatus === "disetujui"
                ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-600 dark:text-emerald-300"
                : approvalStatus === "ditolak"
                  ? "border-red-300 bg-red-50 text-red-800 dark:bg-red-900/30 dark:border-red-600 dark:text-red-300"
                  : approvalStatus === "revisi"
                    ? "border-purple-300 bg-purple-50 text-purple-800 dark:bg-purple-900/30 dark:border-purple-600 dark:text-purple-300"
                    : "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:border-amber-600 dark:text-amber-300"
            }
          `}
          >
            <div className="flex items-center gap-3">
              {approvalStatus === "disetujui" ? (
                <FiCheck className="text-xl" />
              ) : approvalStatus === "ditolak" ? (
                <FiXCircle className="text-xl" />
              ) : approvalStatus === "revisi" ? (
                <FiEdit className="text-xl" />
              ) : (
                <FiClock className="text-xl" />
              )}
              <div>
                <p className="font-semibold">
                  Status:{" "}
                  {approvalStatus === "disetujui"
                    ? "DISETUJUI"
                    : approvalStatus === "ditolak"
                      ? "DITOLAK"
                      : approvalStatus === "revisi"
                        ? "REVISI"
                        : "MENUNGGU"}
                </p>
                {logbook?.approvedAt && (
                  <p className="text-sm">
                    Diproses: {formatDate(logbook.approvedAt)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <FiUser className="text-slate-500 dark:text-slate-400" />
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Nama Peserta
                </p>
                <p className="font-semibold text-slate-800 dark:text-white">
                  {logbook?.user?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <FiMail className="text-slate-500 dark:text-slate-400" />
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Email
                </p>
                <p className="font-semibold text-slate-800 dark:text-white">
                  {logbook?.user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Status Kehadiran */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FiUserCheck className="text-slate-500 dark:text-slate-400" />
              <label className="font-semibold text-slate-700 dark:text-white">
                Status Kehadiran
              </label>
            </div>
            <div
              className={`
                inline-flex items-center gap-2
                px-4 py-2.5 rounded-xl border
                text-sm font-semibold
                ${
                  logbook?.status === "hadir"
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/40"
                    : logbook?.status === "tidak_hadir_keterangan"
                      ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/40"
                      : "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700/40"
                }
              `}
            >
              {logbook?.status === "hadir" ? (
                <FiUserCheck className="w-4 h-4" />
              ) : (
                <FiUserX className="w-4 h-4" />
              )}
              <span>
                {logbook?.status === "hadir"
                  ? "Hadir"
                  : logbook?.status === "tidak_hadir_keterangan"
                    ? "Tidak Hadir (Dengan Keterangan)"
                    : "Tidak Hadir (Tanpa Keterangan)"}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {logbook?.status === "hadir" ? (
              <>
                <FieldSection label="Uraian Aktivitas" value={logbook?.judul} />
                <FieldSection
                  label="Pembelajaran"
                  value={logbook?.pengalaman}
                />
                <FieldSection label="Kendala" value={logbook?.kendala} />
              </>
            ) : (
              <FieldSection
                label="Alasan Tidak Hadir"
                value={logbook?.keterangan}
              />
            )}
          </div>

          {/* Images */}
          {logbook?.files?.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FiImage className="text-slate-500 dark:text-slate-400" />
                <label className="font-semibold text-slate-700 dark:text-white">
                  Dokumentasi
                </label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {logbook.files.map((file: string, i: number) => {
                  const imageUrl = getImageUrl(file);
                  return (
                    <div
                      key={i}
                      className="relative group cursor-pointer"
                      onClick={() => setPreviewImage(imageUrl)}
                    >
                      <img
                        src={imageUrl}
                        className="w-full h-32 object-cover rounded-lg"
                        alt={`Dokumentasi ${i + 1}`}
                        onError={(e) => {
                          e.currentTarget.src = `https://via.placeholder.com/300x200?text=Gambar+Tidak+Tersedia`;
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition rounded-lg flex items-center justify-center">
                        <FiEye className="text-white opacity-0 group-hover:opacity-100 transition text-2xl" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PDF File */}
          {logbook?.pdfFile && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FiFileText className="text-slate-500 dark:text-slate-400" />
                <label className="font-semibold text-slate-700 dark:text-white">
                  Dokumen PDF
                </label>
              </div>
              <a
                href={getImageUrl(logbook.pdfFile)}
                target="_blank"
                className="flex items-center gap-4 p-4 rounded-xl border border-amber-200 dark:border-indigo-700 bg-amber-50 dark:bg-indigo-900/30 hover:shadow-md transition"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-600 dark:from-indigo-500 dark:to-violet-600 text-white">
                  <FiFileText className="text-xl" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-amber-800 dark:text-indigo-200">
                    Dokumen Pendukung
                  </p>
                  <p className="text-xs text-amber-600 dark:text-indigo-400">
                    Klik untuk melihat file
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-200 text-amber-800 dark:bg-indigo-800 dark:text-indigo-200">
                  📄 Lihat PDF
                </span>
              </a>
            </div>
          )}

          {/* Catatan Mentor */}
          {logbook?.mentorNote && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FiEdit className="text-slate-500 dark:text-slate-400" />
                <label className="font-semibold text-slate-700 dark:text-white">
                  Catatan Mentor
                </label>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                <p className="whitespace-pre-line">{logbook.mentorNote}</p>
              </div>
            </div>
          )}

          {/* Catatan Superadmin */}
          {/* <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FiEdit className="text-slate-500 dark:text-slate-400" />
              <label className="font-semibold text-slate-700 dark:text-white">
                Catatan {userRole === "superadmin" ? "Superadmin" : "Admin"}
              </label>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-[#F59E0B] dark:focus:border-indigo-500 focus:ring-2 focus:ring-[#F59E0B]/20 dark:focus:ring-indigo-500/20 outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              placeholder="Tambahkan catatan..."
            />
          </div> */}
        </div>

        {/* Footer Actions */}
        {/* <div className="px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition"
            >
              Batal
            </button>
            <button
              onClick={() => handleAction("ditolak")}
              disabled={isSubmitting}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Memproses..." : "Tolak"}
            </button>
            <button
              onClick={() => handleAction("revisi")}
              disabled={isSubmitting}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Memproses..." : "Revisi"}
            </button>
            <button
              onClick={() => handleAction("disetujui")}
              disabled={isSubmitting}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Memproses..." : "Setujui"}
            </button>
          </div>
        </div> */}
      </div>

      {/* Image Preview */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition"
          >
            <FiX className="text-white text-xl" />
          </button>
          <img
            src={previewImage}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            alt="Preview"
          />
        </div>
      )}
    </div>
  );
}

function FieldSection({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <label className="font-semibold text-slate-700 dark:text-white text-sm">
        {label}
      </label>
      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 whitespace-pre-line min-h-[80px]">
        {value || <span className="text-slate-400 dark:text-slate-500">-</span>}
      </div>
    </div>
  );
}
