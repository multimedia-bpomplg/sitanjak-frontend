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
} from "react-icons/fi";
import { showToast } from "@/components/ui/toastDashboard";

type Props = {
  logbook: any;
  onClose: () => void;
  onApprove: (id: string, status: string, note: string) => Promise<void>;
};

export default function SuperadminLogbookModal({
  logbook,
  onClose,
  onApprove,
}: Props) {
  const [mentorNote, setMentorNote] = useState(logbook?.mentorNote || "");
  const [approvalStatus, setApprovalStatus] = useState(
    logbook?.approvalStatus || "menunggu",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
    });
  };

  const handleApprove = async (status: "disetujui" | "ditolak") => {
    if (!logbook?._id) return;

    setIsSubmitting(true);
    try {
      await onApprove(logbook._id, status, mentorNote);
      showToast.success(
        `Logbook berhasil ${status === "disetujui" ? "disetujui" : "ditolak"}`,
      );
      onClose();
    } catch (error) {
      showToast.error("Gagal memproses logbook");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FiCalendar className="text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Detail Logbook</h2>
                <p className="text-sm opacity-90">
                  {logbook?.user?.name} • {formatDate(logbook?.date)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <FiX className="text-xl" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Status Badge */}
          <div
            className={`
            px-4 py-3 rounded-xl border
            ${
              logbook?.approvalStatus === "disetujui"
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : logbook?.approvalStatus === "ditolak"
                  ? "border-red-300 bg-red-50 text-red-800"
                  : "border-amber-300 bg-amber-50 text-amber-800"
            }
          `}
          >
            <div className="flex items-center gap-3">
              {logbook?.approvalStatus === "disetujui" ? (
                <FiCheck className="text-xl" />
              ) : logbook?.approvalStatus === "ditolak" ? (
                <FiXCircle className="text-xl" />
              ) : (
                <FiClock className="text-xl" />
              )}
              <div>
                <p className="font-semibold">
                  Status: {logbook?.approvalStatus?.toUpperCase()}
                </p>
                {logbook?.approvedAt && (
                  <p className="text-sm">
                    Diproses:{" "}
                    {new Date(logbook.approvedAt).toLocaleDateString("id-ID")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <FiUser className="text-slate-500" />
              <div>
                <p className="text-sm text-slate-500">Nama Peserta</p>
                <p className="font-semibold">{logbook?.user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <FiMail className="text-slate-500" />
              <div>
                <p className="text-sm text-slate-500">Email</p>
                <p className="font-semibold">{logbook?.user?.email}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <FieldSection label="Judul Kegiatan" value={logbook?.judul} />
            <FieldSection label="Pengalaman" value={logbook?.pengalaman} />
            <FieldSection label="Kendala" value={logbook?.kendala} />
            <FieldSection label="Keterangan" value={logbook?.keterangan} />
          </div>

          {/* Images */}
          {logbook?.files?.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FiImage className="text-slate-500" />
                <label className="font-semibold text-slate-700">
                  Dokumentasi
                </label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {logbook.files.map((file: string, i: number) => (
                  <div
                    key={i}
                    className="relative group cursor-pointer"
                    onClick={() => setPreviewImage(getImageUrl(file))}
                  >
                    <img
                      src={getImageUrl(file)}
                      className="w-full h-32 object-cover rounded-lg"
                      alt={`Dokumentasi ${i + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Catatan */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FiEdit className="text-slate-500" />
              <label className="font-semibold text-slate-700">Catatan</label>
            </div>
            <textarea
              value={mentorNote}
              onChange={(e) => setMentorNote(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
              placeholder="Tambahkan catatan..."
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-5 border-t border-slate-200 bg-slate-50">
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={() => handleApprove("ditolak")}
              disabled={isSubmitting}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Memproses..." : "Tolak"}
            </button>
            <button
              onClick={() => handleApprove("disetujui")}
              disabled={isSubmitting}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Memproses..." : "Setujui"}
            </button>
          </div>
        </div>
      </div>

      {/* Image Preview */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center"
          onClick={() => setPreviewImage(null)}
        >
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
      <label className="font-semibold text-slate-700">{label}</label>
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
        {value || <span className="text-slate-400">-</span>}
      </div>
    </div>
  );
}
