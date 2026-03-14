"use client";

import { useState, useEffect } from "react";
import {
  FiX,
  FiFileText,
  FiUser,
  FiMail,
  FiCheckCircle,
  FiXCircle,
  FiStar,
  FiDownload,
  FiEye,
  FiLock,
  FiClock,
  FiEdit,
} from "react-icons/fi";
import { showToast } from "@/components/ui/toastDashboard";

type Props = {
  laporan: any;
  onClose: () => void;
  onReview?: (id: string, status: string, note: string) => Promise<void>;
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

const penilaianOptions = [
  { value: "sangat buruk", label: "Sangat Buruk", color: "rose" },
  { value: "buruk", label: "Buruk", color: "amber" },
  { value: "baik", label: "Baik", color: "blue" },
  { value: "sangat baik", label: "Sangat Baik", color: "emerald" },
];

export default function SuperadminLaporanAkhirModal({
  laporan,
  onClose,
  onReview,
}: Props) {
  const [activeTab, setActiveTab] = useState<"detail" | "review">("detail");
  const [reviewStatus, setReviewStatus] = useState(
    laporan?.status || "Menunggu",
  );
  const [reviewNote, setReviewNote] = useState(laporan?.superadminNote || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [penilaian, setPenilaian] = useState<Penilaian>({
    kehadiranDisiplin: laporan?.penilaian?.kehadiranDisiplin || "",
    sikapPerilaku: laporan?.penilaian?.sikapPerilaku || "",
    kemampuanKomunikasi: laporan?.penilaian?.kemampuanKomunikasi || "",
    inisiatifTanggungJawab: laporan?.penilaian?.inisiatifTanggungJawab || "",
    kemampuanAdaptasi: laporan?.penilaian?.kemampuanAdaptasi || "",
    pengetahuanTeknis: laporan?.penilaian?.pengetahuanTeknis || "",
    produktivitasKetepatanWaktu:
      laporan?.penilaian?.produktivitasKetepatanWaktu || "",
    kerjaSamaTim: laporan?.penilaian?.kerjaSamaTim || "",
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileUrl = (filePath: string) => {
    if (!filePath) return "";
    if (filePath.startsWith("http")) return filePath;
    return `${process.env.NEXT_PUBLIC_API_URL || window.location.origin}/${filePath}`;
  };

  // Di bagian fungsi download dan view, perbaiki endpoint:

  /* ================= DOWNLOAD PDF (SAMA SEPERTI DI MENTOR) ================= */
  const handleDownloadPdf = async () => {
    if (!laporan?._id) {
      showToast.error("ID laporan tidak ditemukan");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/laporan-akhir/download/${laporan._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error("Gagal mengunduh PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        laporan?.fileName || `Laporan_Akhir_${laporan?.user?.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      showToast.error("Gagal mengunduh PDF");
    }
  };

  /* ================= VIEW PDF (SAMA SEPERTI DI MENTOR) ================= */
  const handleViewPdf = () => {
    if (!laporan?._id) {
      showToast.error("ID laporan tidak ditemukan");
      return;
    }
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL}/superadmin/laporan-akhir/view/${laporan._id}`,
      "_blank",
    );
  };

  const handleSubmitReview = async () => {
    if (!onReview || !laporan?._id) return;

    if (!reviewNote.trim()) {
      showToast.error("Catatan review wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      await onReview(laporan._id, reviewStatus, reviewNote);
      showToast.success(
        `Laporan berhasil ${
          reviewStatus === "Disetujui"
            ? "disetujui"
            : reviewStatus === "Ditolak"
              ? "ditolak"
              : "direvisi"
        }`,
      );
      onClose();
    } catch (error) {
      showToast.error("Gagal memproses review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAlreadyReviewed = () => {
    return laporan?.status === "Disetujui" || laporan?.status === "Ditolak";
  };

  const alreadyReviewed = isAlreadyReviewed();
  const isCommentFilled = reviewNote.trim().length > 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Disetujui":
        return {
          bg: "bg-emerald-500/20 dark:bg-emerald-400/20",
          text: "text-emerald-700 dark:text-emerald-300",
          border: "border-emerald-400/40",
          icon: "text-emerald-500",
        };
      case "Ditolak":
        return {
          bg: "bg-red-500/20 dark:bg-red-400/20",
          text: "text-red-700 dark:text-red-300",
          border: "border-red-400/40",
          icon: "text-red-500",
        };
      case "Revisi":
        return {
          bg: "bg-amber-500/20 dark:bg-amber-400/20",
          text: "text-amber-700 dark:text-amber-300",
          border: "border-amber-400/40",
          icon: "text-amber-500",
        };
      default:
        return {
          bg: "bg-slate-500/20 dark:bg-indigo-400/20",
          text: "text-slate-700 dark:text-indigo-300",
          border: "border-slate-400/40 dark:border-indigo-500/30",
          icon: "text-slate-500 dark:text-indigo-400",
        };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Disetujui":
        return <FiCheckCircle className="w-5 h-5" />;
      case "Ditolak":
        return <FiXCircle className="w-5 h-5" />;
      case "Revisi":
        return <FiEdit className="w-5 h-5" />;
      default:
        return <FiClock className="w-5 h-5" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "-";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const penilaianLabels: Record<keyof Penilaian, string> = {
    kehadiranDisiplin: "Kehadiran dan Disiplin",
    sikapPerilaku: "Sikap dan Perilaku",
    kemampuanKomunikasi: "Kemampuan Komunikasi",
    inisiatifTanggungJawab: "Inisiatif dan Tanggung Jawab",
    kemampuanAdaptasi: "Kemampuan Adaptasi",
    pengetahuanTeknis: "Pengetahuan Teknis",
    produktivitasKetepatanWaktu: "Produktivitas dan Ketepatan Waktu",
    kerjaSamaTim: "Kerja Sama Tim",
  };

  return (
    <div
      className="
        fixed inset-0 z-50
        bg-black/40 dark:bg-black/70
        backdrop-blur-md
        flex items-center justify-center
        p-2 sm:p-4
      "
    >
      <div
        className="
          w-full max-w-4xl
          bg-white dark:bg-slate-900
          rounded-2xl sm:rounded-3xl
          border border-slate-200 dark:border-slate-800
          shadow-2xl
          overflow-hidden
          max-h-[95vh]
          flex flex-col
        "
      >
        {/* HEADER */}
        <div
          className="
    px-4 sm:px-6 py-4
    bg-linear-to-r
    from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
    dark:from-indigo-700 dark:to-violet-600
    text-white
    flex items-center justify-between
    gap-3
  "
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-white/20 rounded-xl shrink-0">
              <FiFileText className="text-lg" />
            </div>

            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold truncate">
                Download Laporan Akhir Peserta
              </h2>
              <p className="text-xs opacity-80 truncate">
                {laporan?.user?.name} • {formatDate(laporan?.createdAt)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/30 hover:bg-white/50 transition"
          >
            <FiX className="text-xl text-white" />
          </button>
        </div>

        {/* TABS */}
        <div className="border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("detail")}
              className={`
                py-3 font-semibold border-b-2 transition relative
                ${
                  activeTab === "detail"
                    ? "border-[#B91C1C] text-[#7F1D1D] dark:border-indigo-400 dark:text-indigo-300"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700"
                }
              `}
            >
              Detail Laporan
            </button>
            {/* <button
              onClick={() => setActiveTab("review")}
              className={`
                py-3 font-semibold border-b-2 transition relative
                ${
                  activeTab === "review"
                    ? "border-[#B91C1C] text-[#7F1D1D] dark:border-indigo-400 dark:text-indigo-300"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700"
                }
              `}
            >
              Review & Status
            </button> */}
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
          {/* ================= DETAIL TAB ================= */}
          {activeTab === "detail" && (
            <div className="space-y-6">
              {/* STATUS & FILE INFO */}
              <div
                className={`
                  rounded-2xl
                  border
                  px-5 py-4
                  backdrop-blur
                  shadow-md
                  transition
                  bg-white/80 dark:bg-indigo-950/40
                  ${getStatusColor(laporan?.status).border}
                `}
              >
                <div
                  className="
                    flex flex-col sm:flex-row
                    sm:items-center sm:justify-between
                    gap-4
                  "
                >
                  {/* LEFT - STATUS */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`
                        w-12 h-12
                        rounded-2xl
                        flex items-center justify-center
                        shadow-inner
                        ${getStatusColor(laporan?.status).bg}
                      `}
                    >
                      <span
                        className={`
                          text-xl
                          ${getStatusColor(laporan?.status).icon}
                        `}
                      >
                        {getStatusIcon(laporan?.status)}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 dark:text-indigo-300">
                        Status Laporan
                      </p>
                      <p
                        className={`
                          mt-0.5 text-sm sm:text-base font-bold
                          ${getStatusColor(laporan?.status).text}
                        `}
                      >
                        {laporan?.status === "Disetujui"
                          ? "✅ Disetujui"
                          : laporan?.status === "Ditolak"
                            ? "❌ Ditolak"
                            : laporan?.status === "Revisi"
                              ? "🔄 Perlu Revisi"
                              : "⏳ Menunggu Review"}
                      </p>
                      {laporan?.approvedAt && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {formatDate(laporan.approvedAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* RIGHT - FILE INFO */}
                  {laporan?.fileUrl && (
                    <div className="flex flex-col sm:items-end gap-1">
                      <div
                        className="
                          inline-flex items-center gap-2
                          px-3 py-1.5
                          rounded-full
                          bg-slate-100 dark:bg-white/10
                          text-slate-700 dark:text-slate-200
                          text-xs sm:text-sm
                          font-medium
                        "
                      >
                        <FiFileText className="text-sm" />
                        <span className="truncate max-w-45">
                          {laporan.fileName || "Laporan_Akhir.pdf"}
                        </span>
                      </div>

                      <div className="mt-1 me-2 text-[11px] sm:text-xs text-slate-500 flex items-center gap-2 sm:justify-end">
                        <span>
                          {laporan.fileSize
                            ? formatFileSize(laporan.fileSize)
                            : "-"}
                        </span>
                        <span>
                          {laporan.submittedAt
                            ? new Date(laporan.submittedAt).toLocaleDateString(
                                "id-ID",
                              )
                            : new Date(laporan.createdAt).toLocaleDateString(
                                "id-ID",
                              )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ✅ PDF VIEWER - SAMA SEPERTI DI MENTOR */}
              {laporan?.fileUrl && (
                <div className="space-y-4">
                  {/* ACTION BUTTONS PDF */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleDownloadPdf}
                      className="
    w-full sm:w-auto
    inline-flex items-center justify-center gap-2
    px-5 py-2.5
    rounded-xl
    text-sm font-semibold
    text-white
    bg-emerald-600 hover:bg-emerald-700
    shadow hover:shadow-lg
    transition
  "
                    >
                      <FiDownload className="w-4 h-4" />
                      Download PDF
                    </button>

                    <button
                      onClick={() => setShowPdf(!showPdf)}
                      className="
    w-full sm:w-auto
    inline-flex items-center justify-center gap-2
    px-5 py-2.5
    rounded-xl
    text-sm font-semibold
    text-slate-700 dark:text-white
    bg-slate-200 dark:bg-white/10
    hover:bg-slate-300 dark:hover:bg-white/20
    shadow hover:shadow-lg
    transition
  "
                    >
                      <FiEye className="w-4 h-4" />
                      {showPdf ? "Sembunyikan PDF" : "Preview PDF"}
                    </button>

                    {/* ===== LAMPIRAN 1 ===== */}
                    {laporan?.lampiran1Pdf && (
                      <button
                        onClick={() =>
                          window.open(
                            `${process.env.NEXT_PUBLIC_API_URL}/${laporan.lampiran1Pdf}`,
                            "_blank",
                          )
                        }
                        className="
  w-full sm:w-auto
  inline-flex items-center justify-center gap-2
  px-5 py-2.5
  rounded-xl
  text-sm font-semibold
  text-white
  bg-blue-600 hover:bg-blue-700
"
                      >
                        <FiDownload className="w-4 h-4" />
                        Download Lampiran 1
                      </button>
                    )}

                    {/* ===== LAMPIRAN 2 ===== */}
                    {laporan?.lampiran2Pdf && (
                      <button
                        onClick={() =>
                          window.open(
                            `${process.env.NEXT_PUBLIC_API_URL}/${laporan.lampiran2Pdf}`,
                            "_blank",
                          )
                        }
                        className="
  w-full sm:w-auto
  inline-flex items-center justify-center gap-2
  px-5 py-2.5
  rounded-xl
  text-sm font-semibold
  text-white
  bg-indigo-600 hover:bg-indigo-700
"
                      >
                        <FiDownload className="w-4 h-4" />
                        Download Lampiran 2
                      </button>
                    )}
                  </div>

                  {/* PDF PREVIEW - SAMA SEPERTI DI MENTOR */}
                  {showPdf && (
                    <div className="rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <iframe
                        src={`${getFileUrl(laporan.fileUrl)}#toolbar=0&navpanes=0`}
                        className="w-full h-[500px] sm:h-[600px]"
                        title="PDF Preview"
                      />
                      <div className="p-2 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                        * Gunakan tombol Download untuk menyimpan file
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard
                  icon={<FiUser />}
                  label="Nama Peserta"
                  value={laporan?.user?.name}
                />
                <InfoCard
                  icon={<FiMail />}
                  label="Email"
                  value={laporan?.user?.email}
                />
              </div>

              {/* Catatan Mentor (jika ada) */}
              {laporan?.mentorNote && (
                <div className="p-5 rounded-2xl bg-amber-50/80 dark:bg-indigo-900/40 border border-amber-200 dark:border-indigo-500/40">
                  <h3 className="font-bold text-amber-800 dark:text-indigo-300 mb-2 flex items-center gap-2">
                    <FiEdit />
                    Catatan Mentor
                  </h3>
                  <p className="whitespace-pre-line text-amber-700 dark:text-indigo-200">
                    {laporan.mentorNote}
                  </p>
                  {laporan.approvedByMentor && (
                    <p className="text-xs mt-2 text-slate-500">
                      Oleh: {laporan.approvedByMentor.name} •{" "}
                      {formatDate(laporan.approvedAt)}
                    </p>
                  )}
                </div>
              )}

              {/* Penilaian Mentor (jika ada) */}
              {laporan?.status === "Disetujui" && laporan?.penilaian && (
                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-200 mb-3 flex items-center gap-2">
                    <FiStar className="w-4 h-4" />
                    Penilaian Mentor
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(penilaianLabels).map(([key, label]) => (
                      <div
                        key={key}
                        className="flex justify-between items-center p-2 bg-white dark:bg-slate-800 rounded-lg"
                      >
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {label}:
                        </span>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                          {laporan.penilaian[key] || "-"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="text-right text-xs text-slate-400">
                <p>Dibuat: {formatDate(laporan?.createdAt)}</p>
                {laporan?.updatedAt &&
                  laporan.updatedAt !== laporan.createdAt && (
                    <p>Terakhir diupdate: {formatDate(laporan.updatedAt)}</p>
                  )}
              </div>
            </div>
          )}

          {/* ================= REVIEW TAB ================= */}
          {activeTab === "review" && (
            <div className="space-y-6">
              {/* 🔥 NOTIFIKASI SUDAH DIREVIEW */}
              {alreadyReviewed && (
                <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-indigo-100 dark:bg-indigo-800 rounded-lg">
                      <FiLock className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                    </div>
                    <div>
                      <p className="font-semibold text-indigo-800 dark:text-indigo-200">
                        Laporan Telah Direview
                      </p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-1">
                        Status:{" "}
                        {laporan?.status === "Disetujui"
                          ? "✅ Disetujui"
                          : laporan?.status === "Ditolak"
                            ? "❌ Ditolak"
                            : "🔄 Revisi"}{" "}
                        • {formatDate(laporan?.approvedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* STATUS SAAT INI */}
              <div
                className={`
                  rounded-2xl
                  border
                  px-5 py-4
                  backdrop-blur
                  shadow-md
                  transition
                  bg-white/80 dark:bg-indigo-950/40
                  ${getStatusColor(laporan?.status).border}
                `}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`
                      w-12 h-12
                      rounded-2xl
                      flex items-center justify-center
                      shadow-inner
                      ${getStatusColor(laporan?.status).bg}
                    `}
                  >
                    <span
                      className={`
                        text-xl
                        ${getStatusColor(laporan?.status).icon}
                      `}
                    >
                      {getStatusIcon(laporan?.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-indigo-300">
                      Status Saat Ini
                    </p>
                    <p
                      className={`
                        text-base font-bold
                        ${getStatusColor(laporan?.status).text}
                      `}
                    >
                      {laporan?.status === "Disetujui"
                        ? "✅ Disetujui"
                        : laporan?.status === "Ditolak"
                          ? "❌ Ditolak"
                          : laporan?.status === "Revisi"
                            ? "🔄 Perlu Revisi"
                            : "⏳ Menunggu Review"}
                    </p>
                  </div>
                </div>
              </div>

              {/* FORM REVIEW SUPERADMIN */}
              <div
                className={`
                  rounded-2xl
                  border border-slate-200 dark:border-slate-700
                  bg-white dark:bg-slate-800
                  p-4 sm:p-6
                  shadow-sm
                  ${
                    alreadyReviewed
                      ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                      : "bg-white/80 dark:bg-indigo-950/40 border-slate-200 dark:border-indigo-500/30"
                  }
                `}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`p-2 rounded-lg ${
                      alreadyReviewed
                        ? "bg-slate-200 dark:bg-slate-700"
                        : "bg-amber-100 dark:bg-indigo-500/20"
                    }`}
                  >
                    <FiStar
                      className={`w-5 h-5 ${
                        alreadyReviewed
                          ? "text-slate-500 dark:text-slate-400"
                          : "text-amber-600 dark:text-violet-300"
                      }`}
                    />
                  </div>
                  <div>
                    <h3
                      className={`font-bold ${
                        alreadyReviewed
                          ? "text-slate-600 dark:text-slate-400"
                          : "text-slate-800 dark:text-indigo-200"
                      }`}
                    >
                      Review Superadmin
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {alreadyReviewed
                        ? "Laporan ini sudah direview"
                        : "Berikan review dan status untuk laporan ini"}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* STATUS SELECTION - DISABLE JIKA SUDAH DIREVIEW */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
                      Status Review
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["Disetujui", "Ditolak", "Revisi"].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() =>
                            !alreadyReviewed && setReviewStatus(status)
                          }
                          disabled={alreadyReviewed}
                          className={`
                            px-5 py-2.5
                            rounded-xl
                            text-sm font-semibold
                            transition-all
                            ${
                              alreadyReviewed
                                ? "opacity-50 cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                                : reviewStatus === status
                                  ? status === "Disetujui"
                                    ? "bg-emerald-500 text-white shadow-lg"
                                    : status === "Ditolak"
                                      ? "bg-red-500 text-white shadow-lg"
                                      : "bg-amber-500 text-white shadow-lg"
                                  : "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                            }
                          `}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                    {alreadyReviewed && (
                      <div
                        className="
                          mt-3
                          flex items-start gap-3
                          rounded-xl
                          border border-amber-300
                          bg-amber-50
                          dark:border-amber-600
                          dark:bg-amber-900/20
                          p-3 sm:p-4
                        "
                      >
                        <div
                          className="
                            shrink-0
                            w-8 h-8
                            rounded-lg
                            bg-amber-100
                            dark:bg-amber-800/40
                            flex items-center justify-center
                            text-amber-600
                            dark:text-amber-300
                            text-sm
                          "
                        >
                          ⚠️
                        </div>

                        <div className="text-left">
                          <p className="text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-300">
                            Laporan sudah direview
                          </p>
                          <p className="text-[11px] sm:text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                            Status tidak dapat diubah karena laporan sudah
                            diproses.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* KOMENTAR - DISABLE JIKA SUDAH DIREVIEW */}
                  <div>
                    <label
                      className={`block text-sm font-semibold mb-2 ${
                        alreadyReviewed
                          ? "text-slate-500 dark:text-slate-400"
                          : "text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      Catatan Review <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={reviewNote}
                      onChange={(e) =>
                        !alreadyReviewed && setReviewNote(e.target.value)
                      }
                      disabled={alreadyReviewed}
                      rows={4}
                      className={`
                        w-full px-4 py-3
                        rounded-xl
                        bg-white dark:bg-white/5
                        border-2
                        text-slate-700 dark:text-slate-100
                        placeholder:text-slate-400
                        focus:ring-2
                        outline-none
                        transition
                        resize-none
                        ${
                          alreadyReviewed
                            ? "border-slate-300 dark:border-slate-600 opacity-70 cursor-not-allowed"
                            : "border-amber-400/70 dark:border-indigo-500/60 focus:ring-amber-300 dark:focus:ring-indigo-500/60"
                        }
                      `}
                      placeholder={
                        alreadyReviewed
                          ? "Catatan review"
                          : reviewStatus === "Disetujui"
                            ? "Tambahkan catatan persetujuan..."
                            : reviewStatus === "Ditolak"
                              ? "Berikan alasan penolakan..."
                              : "Berikan catatan untuk revisi..."
                      }
                      readOnly={alreadyReviewed}
                    />
                  </div>

                  {/* ACTION BUTTONS - HILANGKAN JIKA SUDAH DIREVIEW */}
                  {!alreadyReviewed && (
                    <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => {
                          setReviewStatus(laporan?.status || "Menunggu");
                          setReviewNote(laporan?.superadminNote || "");
                        }}
                        className="
                          px-6 py-2.5
                          rounded-xl
                          border-2 border-slate-300
                          text-slate-600 dark:text-slate-300
                          hover:bg-slate-100 dark:hover:bg-white/10
                          font-semibold
                          transition
                        "
                      >
                        Reset
                      </button>

                      <button
                        onClick={() => setShowConfirm(true)}
                        disabled={!isCommentFilled}
                        className={`
                          px-8 py-2.5
                          rounded-xl
                          font-semibold
                          shadow-md hover:shadow-xl
                          transition-all duration-300
                          ${
                            !isCommentFilled
                              ? "bg-slate-400 cursor-not-allowed text-white"
                              : reviewStatus === "Disetujui"
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : reviewStatus === "Ditolak"
                                  ? "bg-red-600 hover:bg-red-700 text-white"
                                  : "bg-amber-600 hover:bg-amber-700 text-white"
                          }
                        `}
                      >
                        {reviewStatus === "Disetujui"
                          ? "✅ Setujui Laporan"
                          : reviewStatus === "Ditolak"
                            ? "❌ Tolak Laporan"
                            : "🔄 Minta Revisi"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Tampilkan Penilaian Mentor (jika ada) */}
              {laporan?.status === "Disetujui" && laporan?.penilaian && (
                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-200 mb-3 flex items-center gap-2">
                    <FiStar className="w-4 h-4" />
                    Penilaian dari Mentor
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(penilaianLabels).map(([key, label]) => (
                      <div
                        key={key}
                        className="flex justify-between items-center p-2 bg-white dark:bg-slate-800 rounded-lg"
                      >
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {label}:
                        </span>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                          {laporan.penilaian[key] || "-"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER - Tampilkan di semua tab */}
        <div className="px-4 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="
              w-full
              px-6 py-2.5
              rounded-xl
              bg-gradient-to-r
              from-[#F59E0B] via-[#B91C1C] to-[#7F1D1D]
              hover:from-amber-400 hover:via-[#DC2626] hover:to-[#991B1B]
              dark:from-indigo-600 dark:to-violet-500
              dark:hover:from-indigo-500 dark:hover:to-violet-400
              text-white font-semibold
              shadow-md hover:shadow-xl
              transition-all
            "
          >
            Tutup
          </button>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className="
              w-full max-w-sm
              rounded-3xl
              bg-white dark:bg-slate-900
              border border-slate-200 dark:border-slate-700
              shadow-2xl
              p-6
              space-y-5
              text-center
            "
          >
            {/* ICON */}
            <div
              className={`
                mx-auto
                w-14 h-14
                rounded-2xl
                flex items-center justify-center
                text-white
                shadow-lg
                ${
                  reviewStatus === "Disetujui"
                    ? "bg-emerald-500"
                    : reviewStatus === "Ditolak"
                      ? "bg-red-500"
                      : "bg-amber-500"
                }
              `}
            >
              {reviewStatus === "Disetujui" ? (
                <FiCheckCircle className="text-2xl" />
              ) : reviewStatus === "Ditolak" ? (
                <FiXCircle className="text-2xl" />
              ) : (
                <FiEdit className="text-2xl" />
              )}
            </div>

            {/* TITLE */}
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                Konfirmasi{" "}
                {reviewStatus === "Disetujui"
                  ? "Persetujuan"
                  : reviewStatus === "Ditolak"
                    ? "Penolakan"
                    : "Revisi"}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                Apakah Anda yakin ingin{" "}
                <span
                  className={`font-semibold ${
                    reviewStatus === "Disetujui"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : reviewStatus === "Ditolak"
                        ? "text-red-600 dark:text-red-400"
                        : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {reviewStatus === "Disetujui"
                    ? "menyetujui"
                    : reviewStatus === "Ditolak"
                      ? "menolak"
                      : "meminta revisi"}
                </span>{" "}
                laporan ini?
              </p>
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="
                  w-full
                  py-2.5
                  rounded-xl
                  border
                  border-slate-300 dark:border-slate-600
                  text-slate-600 dark:text-slate-300
                  hover:bg-slate-100 dark:hover:bg-slate-800
                  font-semibold
                  transition
                "
              >
                Batal
              </button>

              <button
                onClick={() => {
                  setShowConfirm(false);
                  handleSubmitReview();
                }}
                className={`
                  w-full
                  py-2.5
                  rounded-xl
                  text-white
                  font-semibold
                  shadow-md hover:shadow-xl
                  transition
                  ${
                    reviewStatus === "Disetujui"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : reviewStatus === "Ditolak"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-amber-600 hover:bg-amber-700"
                  }
                `}
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

/* ================= COMPONENTS ================= */

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#FEF3C7]/60 dark:bg-indigo-900/40 border border-[#F59E0B]/30 dark:border-indigo-500/30">
      <div className="text-[#B91C1C] dark:text-indigo-300">{icon}</div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="font-semibold text-slate-800 dark:text-white">{value}</p>
      </div>
    </div>
  );
}
