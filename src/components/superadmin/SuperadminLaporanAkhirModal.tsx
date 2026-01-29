"use client";

import { useState } from "react";
import {
  FiX,
  FiFileText,
  FiUser,
  FiMail,
  FiCalendar,
  FiCheck,
  FiXCircle,
  FiEdit,
} from "react-icons/fi";

type Props = {
  laporan: any;
  onClose: () => void;
};

export default function SuperadminLaporanAkhirModal({
  laporan,
  onClose,
}: Props) {
  const [activeTab, setActiveTab] = useState<"detail" | "review">("detail");

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className="
          w-full max-w-5xl
          bg-white/90 dark:bg-indigo-950/40
          backdrop-blur
          rounded-3xl
          shadow-2xl
          flex flex-col
          max-h-[92vh]
          overflow-hidden
          border border-[#F59E0B]/30 dark:border-indigo-500/30
        "
      >
        {/* ================= HEADER ================= */}
        <div
          className="
            px-6 py-5
            bg-linear-to-r
            from-[#F59E0B] via-[#B91C1C] to-[#7F1D1D]
            dark:from-indigo-600 dark:to-violet-500
            text-white
          "
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <FiFileText className="text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Laporan Akhir Magang</h2>
                <p className="text-sm opacity-90">
                  {laporan?.user?.name} •{" "}
                  {formatDate(laporan?.createdAt)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition"
            >
              <FiX className="text-xl" />
            </button>
          </div>
        </div>

        {/* ================= TABS ================= */}
        <div className="border-b border-[#F59E0B]/30 dark:border-indigo-500/30">
          <div className="flex px-6">
            <button
              onClick={() => setActiveTab("detail")}
              className={`
                px-4 py-3 font-semibold border-b-2 transition
                ${
                  activeTab === "detail"
                    ? "border-[#B91C1C] text-[#7F1D1D] dark:border-indigo-400 dark:text-indigo-300"
                    : "border-transparent text-slate-500 dark:text-slate-400"
                }
              `}
            >
              Detail Laporan
            </button>
            <button
              onClick={() => setActiveTab("review")}
              className={`
                px-4 py-3 font-semibold border-b-2 transition
                ${
                  activeTab === "review"
                    ? "border-[#B91C1C] text-[#7F1D1D] dark:border-indigo-400 dark:text-indigo-300"
                    : "border-transparent text-slate-500 dark:text-slate-400"
                }
              `}
            >
              Review & Status
            </button>
          </div>
        </div>

        {/* ================= BODY ================= */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ================= DETAIL TAB ================= */}
          {activeTab === "detail" && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className="
                    flex items-center gap-3 p-4 rounded-2xl
                    bg-[#FEF3C7]/60 dark:bg-indigo-900/40
                    border border-[#F59E0B]/30 dark:border-indigo-500/30
                  "
                >
                  <FiUser className="text-[#B91C1C] dark:text-indigo-300" />
                  <div>
                    <p className="text-xs text-slate-500">Nama Peserta</p>
                    <p className="font-semibold">{laporan?.user?.name}</p>
                  </div>
                </div>

                <div
                  className="
                    flex items-center gap-3 p-4 rounded-2xl
                    bg-[#FEF3C7]/60 dark:bg-indigo-900/40
                    border border-[#F59E0B]/30 dark:border-indigo-500/30
                  "
                >
                  <FiMail className="text-[#B91C1C] dark:text-indigo-300" />
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="font-semibold">{laporan?.user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-5">
                <Section label="Judul Laporan" value={laporan?.judul} />
                <Section label="Ringkasan Kegiatan" value={laporan?.ringkasan} />
                <Section label="Hasil & Pencapaian" value={laporan?.hasil} />
                <Section label="Kendala" value={laporan?.kendala} />
                <Section label="Kesimpulan" value={laporan?.kesimpulan} />
                <Section label="Saran" value={laporan?.saran} />
              </div>
            </div>
          )}

          {/* ================= REVIEW TAB ================= */}
          {activeTab === "review" && (
            <div className="space-y-6">
              {/* Status */}
              <div
                className={`
                  px-5 py-4 rounded-2xl border
                  ${
                    laporan?.status === "Disetujui"
                      ? "bg-emerald-100/70 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-400/40"
                      : laporan?.status === "Ditolak"
                        ? "bg-red-100/70 text-red-800 border-red-300 dark:bg-red-500/20 dark:text-red-200 dark:border-red-400/40"
                        : laporan?.status === "Revisi"
                          ? "bg-amber-100/70 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-400/40"
                          : "bg-slate-100 text-slate-800 border-slate-300 dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-500/30"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  {laporan?.status === "Disetujui" ? (
                    <FiCheck className="text-xl" />
                  ) : laporan?.status === "Ditolak" ? (
                    <FiXCircle className="text-xl" />
                  ) : (
                    <FiEdit className="text-xl" />
                  )}
                  <div>
                    <p className="font-semibold text-lg">
                      Status: {laporan?.status}
                    </p>
                    {laporan?.approvedAt && (
                      <p className="text-sm mt-1">
                        Tanggal Approve:{" "}
                        {formatDate(laporan.approvedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Mentor */}
              {laporan?.approvedByMentor && (
                <div
                  className="
                    p-4 rounded-2xl
                    bg-linear-to-r from-[#FEF3C7] to-[#FDE68A]
                    dark:from-indigo-900/40 dark:to-indigo-800/40
                    border border-[#F59E0B]/40 dark:border-indigo-500/30
                  "
                >
                  <h3 className="font-semibold text-[#7F1D1D] dark:text-indigo-200 mb-2">
                    Disetujui oleh Mentor
                  </h3>
                  <p className="font-medium">
                    {laporan.approvedByMentor.name}
                  </p>
                  <p className="text-sm opacity-80">
                    {laporan.approvedByMentor.email}
                  </p>

                  {laporan?.mentorNote && (
                    <div className="mt-3 pt-3 border-t border-[#F59E0B]/30 dark:border-indigo-500/30">
                      <p className="text-sm font-semibold mb-1">
                        Catatan Mentor:
                      </p>
                      <p className="whitespace-pre-line">
                        {laporan.mentorNote}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Review Form (LOGIC TIDAK DIUBAH) */}
              <div
                className="
                  p-5 rounded-2xl
                  bg-white/80 dark:bg-indigo-950/40
                  border border-[#F59E0B]/30 dark:border-indigo-500/30
                "
              >
                <h3 className="font-semibold mb-3 text-[#7F1D1D] dark:text-indigo-300">
                  Review Superadmin
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Status Review
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {["Disetujui", "Ditolak", "Revisi"].map((status) => (
                        <button
                          key={status}
                          className={`px-4 py-2 rounded-xl font-semibold transition ${
                            laporan?.status === status
                              ? status === "Disetujui"
                                ? "bg-emerald-500 text-white"
                                : status === "Ditolak"
                                  ? "bg-red-500 text-white"
                                  : "bg-amber-500 text-white"
                              : "bg-slate-100 dark:bg-indigo-900/40 text-slate-700 dark:text-indigo-200 hover:bg-slate-200 dark:hover:bg-indigo-800"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Catatan
                    </label>
                    <textarea
                      rows={3}
                      className="
                        w-full px-4 py-2.5 rounded-xl
                        bg-white/90 dark:bg-indigo-950/40
                        border border-[#F59E0B]/40 dark:border-indigo-500/40
                        text-slate-700 dark:text-slate-100
                        focus:ring-2 focus:ring-[#B91C1C]/60
                        dark:focus:ring-indigo-500/60
                        outline-none transition
                      "
                      placeholder="Tambahkan catatan review..."
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      className="
                        px-5 py-2.5 rounded-xl
                        border border-[#F59E0B]/40
                        text-[#7F1D1D]
                        hover:bg-[#FEF3C7]
                        dark:border-indigo-500/30
                        dark:text-indigo-200
                        dark:hover:bg-indigo-900/40
                        transition
                      "
                    >
                      Simpan Catatan
                    </button>

                    <button
                      className="
                        px-5 py-2.5 rounded-xl
                        bg-linear-to-r from-[#F59E0B] via-[#B91C1C] to-[#7F1D1D]
                        hover:from-amber-400 hover:via-[#DC2626] hover:to-[#991B1B]
                        dark:from-indigo-600 dark:to-violet-500
                        dark:hover:from-indigo-500 dark:hover:to-violet-400
                        text-white font-semibold
                        shadow-md hover:shadow-xl
                        transition-all
                      "
                    >
                      Finalisasi Review
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= SECTION COMPONENT ================= */

function Section({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <label
        className="
          text-sm font-bold tracking-wide
          text-[#7F1D1D]
          dark:text-indigo-300
        "
      >
        {label}
      </label>

      <div
        className="
          mt-2
          p-4 sm:p-5
          rounded-2xl
          whitespace-pre-line
          leading-relaxed
          bg-white/80 dark:bg-indigo-950/40
          border border-[#F59E0B]/30 dark:border-indigo-500/30
          text-slate-700 dark:text-slate-100
          shadow-sm
        "
      >
        {value || <span className="text-slate-400">-</span>}
      </div>
    </div>
  );
}