"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  FileText,
  ClipboardCheck,
  ChevronRight,
  Download,
  Award,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import LaporanAkhirUploadModal from "@/components/Laporan/LaporanAkhirModal";
import PenilaianModal from "@/components/Laporan/PenilaianModal";
import FeedbackModal from "@/components/Laporan/FeedbackModal";
import { showToast } from "@/components/ui/toastDashboard";
import { PesertaDashboardSkeleton } from "@/components/dashboard/skeletons";

type LaporanAkhir = {
  _id: string;
  fileName: string;
  fileSize: number;
  fileLampiran1Name?: string;
  fileLampiran2Name?: string;
  status: string;
  submittedAt: string;
  approvedByMentor?: any;
  approvedAt?: string;
  mentorNote?: string;
};

type Feedback = {
  _id: string;
  month: string;
  status: string;
  createdAt: string;
  mentorResponse?: string;
  mentorRespondedAt?: string;
  mentorRespondedBy?: {
    name: string;
    email: string;
  };
};

export default function LaporanAkhirPage() {
  const [laporan, setLaporan] = useState<LaporanAkhir | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Accordion expand state for cards
  const [openLaporanSection, setOpenLaporanSection] = useState(false);
  const [openSurveiSection, setOpenSurveiSection] = useState(false);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPenilaianModal, setShowPenilaianModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackModalMode, setFeedbackModalMode] = useState<"create" | "view">(
    "create",
  );
  const [selectedMonth, setSelectedMonth] = useState("");
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);

  const hasShownPopupRef = useRef(false);

  const fetchLaporan = useCallback(async () => {
    try {
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/laporan-akhir`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.status === 404) {
        setLaporan(null);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setLaporan(data);
      }
    } catch (error) {
      console.error("Gagal mengambil laporan akhir", error);
    }
  }, []);

  const checkFeedback = useCallback(async () => {
    try {
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/feedback/riwayat`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setFeedback(data[0]);
      } else {
        setFeedback(null);
      }
    } catch (error) {
      console.error("Gagal cek feedback", error);
      setFeedback(null);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setDataLoaded(false);
    await Promise.all([fetchLaporan(), checkFeedback()]);
    setLoading(false);
    setDataLoaded(true);
  }, [fetchLaporan, checkFeedback]);

  useEffect(() => {
    loadAllData();
    hasShownPopupRef.current = false;
  }, [loadAllData]);

  // Prompt to fill feedback if laporan is uploaded and feedback is not yet filled
  useEffect(() => {
    if (!dataLoaded) return;
    const isFeedbackFilled = feedback !== null;

    if (laporan && laporan.status === "Menunggu" && !isFeedbackFilled) {
      if (!hasShownPopupRef.current) {
        hasShownPopupRef.current = true;
        setShowFeedbackPopup(true);
      }
    } else {
      setShowFeedbackPopup(false);
    }
  }, [dataLoaded, laporan, feedback]);

  const handleOpenFeedbackModal = () => {
    if (feedback) {
      setSelectedMonth(feedback.month);
      setFeedbackModalMode("view");
    } else {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      setSelectedMonth(month);
      setFeedbackModalMode("create");
    }
    setShowFeedbackModal(true);
  };

  const downloadPdf = async () => {
    try {
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/laporan-akhir/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error("Gagal mengunduh");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = laporan?.fileName || "Laporan_Akhir.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showToast.error("Gagal mengunduh laporan");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Disetujui":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
      case "Ditolak":
        return "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
    }
  };

  if (loading) {
    return <PesertaDashboardSkeleton />;
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ================= 1. HEADER ================= */}
      <div className="pt-1">
        <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Perkembangan Magang
        </h1>
        <p className="text-xs sm:text-base text-slate-500 dark:text-slate-400 mt-1">
          Lihat laporan akhir, evaluasi penilaian mentor, dan survei program
          Anda.
        </p>
      </div>

      {/* ================= 2. CHEVRON CARDS LIST ================= */}
      <div className="space-y-3.5 sm:space-y-4">
        {/* CARD 1: LAPORAN AKHIR & EVALUASI */}
        <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs overflow-hidden">
          <button
            type="button"
            onClick={() => setOpenLaporanSection((v) => !v)}
            className="w-full p-4 sm:p-5 text-left hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 sm:gap-3.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1D64F2] dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Laporan Akhir & Evaluasi
                </span>
              </div>
              <ChevronRight
                className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-400 transition-transform duration-200 ${
                  openLaporanSection ? "rotate-90" : ""
                }`}
              />
            </div>

            <div className="mt-3 sm:mt-3.5 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-700/70 flex items-center justify-between gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5 truncate">
                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
                <span className="truncate">
                  {laporan
                    ? `Laporan Akhir (${laporan.status})`
                    : "Penilaian Mentor & Unggah Laporan Akhir"}
                </span>
              </div>
              {laporan && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border shrink-0 ${getStatusBadge(
                    laporan.status,
                  )}`}
                >
                  {laporan.status}
                </span>
              )}
            </div>
          </button>

          {/* Expanded Laporan Akhir Content */}
          {openLaporanSection && (
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2.5 border-t border-slate-100 dark:border-slate-700/70 space-y-4 bg-slate-50/40 dark:bg-slate-800/40">
              {/* Template Survei Links */}
              <div className="space-y-2">
                <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Dokumen Template Survei BBPOM:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <a
                    href="https://docs.google.com/document/d/1YXq6zUrCv4OdKhV5m5ZoAZPzQ54vS02KG-5nb59U1yI/edit?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-[#1D64F2] hover:text-[#1D64F2] flex items-center justify-between gap-2 transition"
                  >
                    <span>Template Survei Regular</span>
                    <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-slate-400" />
                  </a>
                  <a
                    href="https://docs.google.com/document/d/1rZq-AMlUVEh9uk4jucyh09eopL87Bauis47OqT22i5M/edit?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-[#1D64F2] hover:text-[#1D64F2] flex items-center justify-between gap-2 transition"
                  >
                    <span>Template Survei TKPA</span>
                    <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-slate-400" />
                  </a>
                </div>
              </div>

              {laporan ? (
                <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-4 space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {laporan.fileName}
                      </p>
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatFileSize(laporan.fileSize)} • Dikirim{" "}
                        {new Date(laporan.submittedAt).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold border shrink-0 ${getStatusBadge(
                        laporan.status,
                      )}`}
                    >
                      {laporan.status}
                    </span>
                  </div>

                  {/* Catatan Mentor */}
                  {laporan.mentorNote && (
                    <div className="rounded-xl bg-[#FFFBEB] dark:bg-amber-950/40 border border-[#FDE68A] dark:border-amber-800/70 p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
                        <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
                        <span>Catatan Review Mentor</span>
                      </div>
                      <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-100 pl-5 whitespace-pre-line break-words [overflow-wrap:anywhere]">
                        {laporan.mentorNote}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={downloadPdf}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs sm:text-sm font-bold transition"
                    >
                      <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Unduh PDF</span>
                    </button>

                    {laporan.status === "Disetujui" && (
                      <button
                        type="button"
                        onClick={() => setShowPenilaianModal(true)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#1D64F2] hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition"
                      >
                        <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Lihat Penilaian</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-4 sm:p-5 text-center space-y-3">
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Unggah laporan akhir magang dalam format PDF (maksimal 5MB).
                    Laporan hanya dapat diunggah <b>1 kali</b> dan bersifat
                    final.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(true)}
                    className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#1D64F2] hover:bg-blue-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 shadow-xs transition"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Unggah Laporan Akhir</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CARD 2: SURVEI */}
        <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs overflow-hidden">
          <button
            type="button"
            onClick={() => {
              if (!feedback) {
                handleOpenFeedbackModal();
              } else {
                setOpenSurveiSection((v) => !v);
              }
            }}
            className="w-full p-4 sm:p-5 text-left hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 sm:gap-3.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Survei
                </span>
              </div>
              <ChevronRight
                className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-400 transition-transform duration-200 ${
                  openSurveiSection ? "rotate-90" : ""
                }`}
              />
            </div>

            <div className="mt-3 sm:mt-3.5 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-700/70 flex items-center justify-between gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                {feedback ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                    <span>
                      Sudah dikirim •{" "}
                      {feedback.mentorResponse
                        ? "Sudah direspon Mentor"
                        : "Menunggu respon Mentor"}
                    </span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
                    <span>Belum diisi • Ketuk untuk mengisi survei program</span>
                  </>
                )}
              </div>
            </div>
          </button>

          {/* Expanded Survei Detail when already filled */}
          {feedback && openSurveiSection && (
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2.5 border-t border-slate-100 dark:border-slate-700/70 space-y-3 bg-slate-50/40 dark:bg-slate-800/40">
              <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-500">Periode Survei</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {feedback.month}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-500">Tanggal Kirim</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {new Date(feedback.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {feedback.mentorResponse && (
                  <div className="rounded-xl bg-[#FFFBEB] dark:bg-amber-950/40 border border-[#FDE68A] dark:border-amber-800/70 p-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
                      <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
                      <span>
                        Tanggapan Mentor (
                        {feedback.mentorRespondedBy?.name || "Mentor"})
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-100 pl-5 whitespace-pre-line break-words [overflow-wrap:anywhere]">
                      {feedback.mentorResponse}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleOpenFeedbackModal}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs sm:text-sm font-bold transition"
                >
                  Lihat Detail Isian Survei
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL UPLOAD LAPORAN AKHIR ================= */}
      {showUploadModal && (
        <LaporanAkhirUploadModal
          onClose={async (success) => {
            setShowUploadModal(false);
            if (success) {
              setLoading(true);
              await Promise.all([fetchLaporan(), checkFeedback()]);
              setLoading(false);
              hasShownPopupRef.current = false;
            }
          }}
        />
      )}

      {/* ================= MODAL PENILAIAN MENTOR ================= */}
      {showPenilaianModal && (
        <PenilaianModal onClose={() => setShowPenilaianModal(false)} />
      )}

      {/* ================= MODAL FEEDBACK / SURVEI ================= */}
      {showFeedbackModal && selectedMonth && (
        <FeedbackModal
          month={selectedMonth}
          mode={feedbackModalMode}
          onClose={(submitted) => {
            setShowFeedbackModal(false);
            if (submitted) {
              checkFeedback();
              setShowFeedbackPopup(false);
            }
          }}
        />
      )}

      {/* ================= POPUP WAJIB SURVEI ================= */}
      {showFeedbackPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <ClipboardCheck className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Isi Survei & Feedback
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Laporan akhir Anda telah berhasil diunggah. Silakan lengkapi{" "}
                <b>Survei dan Feedback Program</b> untuk melihat status review
                dan nilai akhir magang Anda.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowFeedbackPopup(false);
                  handleOpenFeedbackModal();
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-[#1D64F2] hover:bg-blue-700 transition"
              >
                Isi Survei Sekarang
              </button>
              <button
                type="button"
                onClick={() => setShowFeedbackPopup(false)}
                className="w-full py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
