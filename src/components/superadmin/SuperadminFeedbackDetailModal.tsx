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
  FiDownload,
  FiEye,
} from "react-icons/fi";

type Props = {
  feedback: any;
  totalSurveyScore?: number;
  surveyCategory?: string;
  onClose: () => void;
};

export default function SuperadminFeedbackModal({
  feedback,
  totalSurveyScore,
  surveyCategory,
  onClose,
}: Props) {
  const [showPdf, setShowPdf] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Disetujui":
        return `
          bg-emerald-100/80
          dark:bg-emerald-500/20
          border-[#F59E0B]/40
          dark:border-indigo-400/40
          text-emerald-800 dark:text-emerald-200
        `;
      case "Ditolak":
        return `
          bg-red-100/80
          dark:bg-red-500/20
          border-[#B91C1C]/40
          dark:border-indigo-400/40
          text-red-800 dark:text-red-200
        `;
      case "Perbaiki":
        return `
          bg-amber-100/80
          dark:bg-amber-500/20
          border-[#F59E0B]/40
          dark:border-indigo-400/40
          text-amber-800 dark:text-amber-200
        `;
      default:
        return `
          bg-slate-100/80
          dark:bg-indigo-950/40
          border-[#F59E0B]/30
          dark:border-indigo-500/30
          text-slate-700 dark:text-indigo-200
        `;
    }
  };

  // Fungsi untuk mendapatkan URL file PDF
  const getFileUrl = (filePath: string) => {
    if (!filePath) return null;
    // Sesuaikan dengan base URL backend Anda
    return `${process.env.NEXT_PUBLIC_API_URL}/${filePath}`;
  };

  // Fungsi untuk membuka PDF di tab baru
  const openPdfInNewTab = (filePath: string) => {
    const url = getFileUrl(filePath);
    if (url) {
      window.open(url, "_blank");
    }
  };

  // Fungsi untuk mendownload PDF
  const downloadPdf = (filePath: string, fileName: string) => {
    const url = getFileUrl(filePath);
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "feedback-file.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div
      className="
      fixed inset-0 z-50
      flex items-center justify-center
      bg-black/40 dark:bg-black/70
      backdrop-blur-md
      p-3 sm:p-6
    "
    >
      <div
        className="
        w-full max-w-4xl
        bg-white/90 dark:bg-indigo-950/40
        backdrop-blur
        rounded-3xl
        border border-[#F59E0B]/40
        dark:border-indigo-500/30
        shadow-2xl
        flex flex-col
        max-h-[92vh]
        overflow-hidden
      "
      >
        {/* ================= HEADER ================= */}
        <div
          className="
          px-5 sm:px-6 py-4 sm:py-5
          bg-linear-to-r
          from-[#F59E0B] via-[#B91C1C] to-[#7F1D1D]
          dark:from-indigo-600 dark:to-violet-500
          text-white
          flex items-center justify-between
        "
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <FiCalendar className="text-xl" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Detail Feedback</h2>
              <p className="text-sm opacity-90">
                {feedback?.user?.name} • {feedback?.month}
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

        {/* ================= BODY ================= */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-6">
          {/* STATUS */}
          <div
            className={`
            p-5 rounded-2xl border
            ${getStatusStyle(feedback?.status)}
          `}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {feedback?.status === "Disetujui" ? (
                  <FiCheck className="text-xl" />
                ) : feedback?.status === "Ditolak" ? (
                  <FiXCircle className="text-xl" />
                ) : (
                  <FiFileText className="text-xl" />
                )}
                <div>
                  <p className="font-bold text-base">
                    Status: {feedback?.status}
                  </p>
                  {feedback?.approvedAt && (
                    <p className="text-sm opacity-80">
                      Direview: {formatDate(feedback.approvedAt)}
                    </p>
                  )}
                </div>
              </div>

              <span
                className="
                px-4 py-1.5
                rounded-full
                text-xs font-semibold
                bg-white/70 dark:bg-indigo-900/40
                border border-[#F59E0B]/40
                dark:border-indigo-400/40
              "
              >
                Periode: {feedback?.month}
              </span>
            </div>
          </div>

          {/* USER INFO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoCard
              icon={<FiUser />}
              label="Nama Peserta"
              value={feedback?.user?.name}
            />
            <InfoCard
              icon={<FiMail />}
              label="Email"
              value={feedback?.user?.email}
            />
          </div>

          {/* ================= SECTION FILE PDF ================= */}
          {feedback?.fileUrl && (
            <div className="space-y-3">
              <label className="font-bold tracking-wide text-[#7F1D1D] dark:text-indigo-300 flex items-center gap-2">
                <FiFileText className="text-lg" />
                File Pendukung
              </label>

              <div className="p-5 rounded-2xl bg-linear-to-r from-amber-50/80 to-orange-50/80 dark:from-indigo-900/30 dark:to-indigo-800/30 border border-[#F59E0B]/40 dark:border-indigo-500/40">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#F59E0B] to-[#B91C1C] dark:from-indigo-600 dark:to-violet-500 flex items-center justify-center text-white shadow-lg">
                      <FiFileText className="text-2xl" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {feedback.fileName || "File Feedback"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {feedback.fileSize
                          ? `${(feedback.fileSize / 1024).toFixed(2)} KB`
                          : "PDF Document"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setShowPdf(!showPdf)}
                      className="
                        flex-1 sm:flex-none
                        px-4 py-2.5
                        rounded-xl
                        bg-white dark:bg-indigo-950
                        border border-[#F59E0B]/40 dark:border-indigo-500/40
                        text-[#7F1D1D] dark:text-indigo-300
                        hover:bg-amber-50 dark:hover:bg-indigo-900/60
                        transition-all
                        flex items-center justify-center gap-2
                        text-sm font-medium
                      "
                    >
                      <FiEye className="text-lg" />
                      {showPdf ? "Sembunyikan" : "Pratinjau"}
                    </button>

                    <button
                      onClick={() =>
                        downloadPdf(
                          feedback.fileUrl,
                          `feedback-${feedback.month}-${feedback.user?.name}.pdf`,
                        )
                      }
                      className="
                        flex-1 sm:flex-none
                        px-4 py-2.5
                        rounded-xl
                        bg-linear-to-r from-[#F59E0B] to-[#B91C1C]
                        dark:from-indigo-600 dark:to-violet-500
                        text-white
                        hover:from-amber-400 hover:to-[#DC2626]
                        dark:hover:from-indigo-500 dark:hover:to-violet-400
                        transition-all
                        flex items-center justify-center gap-2
                        text-sm font-medium
                        shadow-md hover:shadow-lg
                      "
                    >
                      <FiDownload className="text-lg" />
                      Download
                    </button>
                  </div>
                </div>

                {/* PDF Preview */}
                {showPdf && feedback?.fileUrl && (
                  <div className="mt-4 pt-4 border-t border-[#F59E0B]/30 dark:border-indigo-500/30">
                    <div className="rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-[#F59E0B]/30 dark:border-indigo-500/30">
                      <iframe
                        src={`${getFileUrl(feedback.fileUrl)}#toolbar=0&navpanes=0`}
                        className="w-full h-100"
                        title="PDF Preview"
                      />
                    </div>
                    <p className="text-xs text-center mt-2 text-slate-500">
                      * Jika PDF tidak muncul, klik tombol Download untuk
                      melihat file
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= SURVEY RESULT ================= */}
          {typeof totalSurveyScore === "number" && (
            <div
              className="
    mt-3
    p-4
    rounded-2xl
    bg-linear-to-r
    from-emerald-50
    to-green-100
    dark:from-indigo-900/40
    dark:to-indigo-800/40
    border
    border-emerald-300
    dark:border-indigo-500/40
    flex
    justify-between
    items-center
  "
            >
              <div>
                <p className="text-sm font-semibold">Total Skor Feedback</p>
                <p className="text-xs opacity-70">
                  Kategori: {surveyCategory || "-"}
                </p>
              </div>

              <span
                className="
      text-xl
      font-bold
      px-4
      py-1
      rounded-xl
      bg-emerald-500
      text-white
      shadow
    "
              >
                {totalSurveyScore} / 20
              </span>
            </div>
          )}
          {feedback?.survey && (
            <div className="space-y-4">
              <h3
                className="
      font-bold tracking-wide
      text-[#7F1D1D]
      dark:text-indigo-300
    "
              >
                Hasil Feedback Peserta
              </h3>

              <SurveyView
                label="1. Kemudahan memahami tampilan dan navigasi website SITANJAK"
                value={feedback.survey.kepuasanMagang}
              />

              <SurveyView
                label="2. Kemudahan proses pendaftaran magang melalui website SITANJAK"
                value={feedback.survey.rekomendasiProgram}
              />

              <SurveyView
                label="3. Kemudahan menggunakan fitur logbook dan unggah laporan"
                value={feedback.survey.kemudahanProses}
              />

              <SurveyView
                label="4. Kepuasan keseluruhan penggunaan website SITANJAK"
                value={feedback.survey.peningkatanSkill}
              />
            </div>
          )}

          {/* FEEDBACK CONTENT */}
          <div className="space-y-5">
            <FieldView
              label="Feedback untuk BPOM"
              value={feedback?.feedbackBPOM}
            />
            <FieldView
              label="Feedback untuk Mentor"
              value={feedback?.feedbackMentor}
            />
          </div>

          {/* RESPONSE MENTOR */}
          {feedback?.mentorResponse && (
            <div
              className="
              p-5 rounded-2xl
              bg-amber-50/80
              dark:bg-indigo-900/40
              border border-[#F59E0B]/40
              dark:border-indigo-500/40
            "
            >
              <h3
                className="
                font-bold mb-2
                text-[#7F1D1D]
                dark:text-indigo-300
              "
              >
                Response Mentor
              </h3>

              {feedback?.mentorRespondedBy && (
                <>
                  <p className="font-medium">
                    {feedback.mentorRespondedBy.name}
                  </p>
                  <p className="text-sm opacity-80">
                    {feedback.mentorRespondedBy.email}
                  </p>
                </>
              )}

              {feedback?.mentorRespondedAt && (
                <p className="text-xs opacity-70 mt-1">
                  Direspon: {formatDate(feedback.mentorRespondedAt)}
                </p>
              )}

              <div className="mt-3 pt-3 border-t border-[#F59E0B]/40 dark:border-indigo-500/40">
                <p className="text-sm font-semibold mb-1">Response:</p>
                <p className="whitespace-pre-line opacity-90">
                  {feedback.mentorResponse}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ================= FOOTER ================= */}
        <div
          className="
          px-5 sm:px-6 py-4
          border-t border-[#F59E0B]/30
          dark:border-indigo-500/30
          bg-white/60 dark:bg-indigo-950/30
          backdrop-blur
        "
        >
          <button
            onClick={onClose}
            className="
              w-full
              px-6 py-2.5
              rounded-xl
              bg-linear-to-r
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
    </div>
  );
}

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
    <div
      className="
      flex items-center gap-3
      p-4 rounded-2xl
      bg-white/80 dark:bg-indigo-950/40
      border border-[#F59E0B]/30
      dark:border-indigo-500/30
    "
    >
      <div
        className="
        w-10 h-10 rounded-full
        bg-linear-to-br from-[#F59E0B] to-[#7F1D1D]
        dark:from-indigo-600 dark:to-violet-500
        flex items-center justify-center
        text-white
      "
      >
        {icon}
      </div>
      <div>
        <p className="text-xs opacity-70">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}

function FieldView({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <label
        className="
        font-bold tracking-wide
        text-[#7F1D1D]
        dark:text-indigo-300
      "
      >
        {label}
      </label>
      <div
        className="
        mt-2
        p-4 rounded-2xl
        bg-white/80 dark:bg-indigo-950/40
        border border-[#F59E0B]/30
        dark:border-indigo-500/30
        whitespace-pre-line
        text-slate-700 dark:text-slate-100
      "
      >
        {value || <span className="opacity-40">-</span>}
      </div>
    </div>
  );
}

// Komponen untuk menampilkan hasil survei dalam bentuk bintang
function SurveyView({ label, value }: { label: string; value: number }) {
  const labels = ["Sangat Buruk", "Buruk", "Cukup", "Baik", "Sangat Baik"];

  return (
    <div
      className="
      p-4 rounded-2xl
      bg-white/80 dark:bg-indigo-950/40
      border border-[#F59E0B]/30
      dark:border-indigo-500/30
      flex items-center justify-between
    "
    >
      <span className="font-medium">{label}</span>

      <div className="flex items-center gap-3">
        <span className="text-sm opacity-70">{labels[value - 1]}</span>

        <span
          className="
          px-3 py-1
          rounded-lg
          bg-emerald-500
          text-white
          text-sm font-bold
        "
        >
          {value}/5
        </span>
      </div>
    </div>
  );
}
