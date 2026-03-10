// dashboard/peserta/laporan-akhir/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import LaporanAkhirUploadModal from "@/components/Laporan/LaporanAkhirModal";
import PenilaianModal from "@/components/Laporan/PenilaianModal";
import { showToast } from "@/components/ui/toastDashboard";

type LaporanAkhir = {
  _id: string;
  fileName: string;
  fileSize: number;
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
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPenilaianModal, setShowPenilaianModal] = useState(false);
  const [laporan, setLaporan] = useState<LaporanAkhir | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false); // Track if all data is loaded

  // Ref untuk mencegah popup muncul terus menerus
  const hasShownPopupRef = useRef(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : "";

  /* ================= CEK LAPORAN AKHIR ================= */
  const fetchLaporan = async () => {
    try {
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
  };

  /* ================= CEK FEEDBACK ================= */
  const checkFeedback = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/feedback/riwayat`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        // Feedback sudah diisi jika ada data
        setFeedback(data[0]);
      } else {
        setFeedback(null);
      }
    } catch (error) {
      console.error("Gagal cek feedback", error);
      setFeedback(null);
    }
  };

  // Load all data
  const loadAllData = async () => {
    setLoading(true);
    setDataLoaded(false);

    await Promise.all([fetchLaporan(), checkFeedback()]);

    setLoading(false);
    setDataLoaded(true);
  };

  // Refresh data ketika komponen mount
  useEffect(() => {
    loadAllData();
    // Reset ref ketika komponen di-mount
    hasShownPopupRef.current = false;
  }, []);

  // Single effect untuk mengelola popup - hanya berjalan ketika semua data sudah terload
  useEffect(() => {
    // Hanya proses jika data sudah lengkap terload
    if (!dataLoaded) return;

    const isFeedbackFilled = feedback !== null;

    // Log untuk debugging (bisa dihapus setelah production)
    console.log("Popup check:", {
      laporanExists: !!laporan,
      status: laporan?.status,
      isFeedbackFilled,
      hasShown: hasShownPopupRef.current,
    });

    // Kondisi popup harus muncul
    if (laporan && laporan.status === "Menunggu" && !isFeedbackFilled) {
      // Cek apakah sudah pernah ditampilkan
      if (!hasShownPopupRef.current) {
        hasShownPopupRef.current = true;
        setShowFeedbackPopup(true);
      }
    } else {
      // Jika kondisi tidak terpenuhi, pastikan popup tidak muncul
      setShowFeedbackPopup(false);
    }
  }, [dataLoaded, laporan, feedback]);

  // Effect untuk cek ulang feedback setelah user kembali dari halaman feedback
  useEffect(() => {
    const checkFeedbackOnReturn = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const fromFeedback = urlParams.get("from") === "feedback";

      if (fromFeedback) {
        // Refresh data feedback
        await checkFeedback();
        // Hapus parameter dari URL
        window.history.replaceState({}, "", "/dashboard/peserta/laporan-akhir");

        // Reset hasShownPopupRef agar popup bisa muncul lagi jika diperlukan
        hasShownPopupRef.current = false;
      }
    };

    checkFeedbackOnReturn();
  }, []);

  /* ================= DOWNLOAD PDF ================= */
  const downloadPdf = async () => {
    try {
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
    } catch (error) {
      showToast.error("Gagal mengunduh laporan");
    }
  };

  /* ================= FORMAT FILE SIZE ================= */
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  /* ================= GET STATUS COLOR ================= */
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Disetujui":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
      case "Ditolak":
        return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300";
      default:
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Disetujui":
        return "✅";
      case "Ditolak":
        return "❌";
      default:
        return "⏳";
    }
  };

  const getStatusAccent = (status: string) => {
    switch (status) {
      case "Disetujui":
        return "from-emerald-400 via-emerald-500 to-emerald-600";
      case "Ditolak":
        return "from-rose-400 via-rose-500 to-rose-600";
      default:
        return "from-amber-400 via-amber-500 to-amber-600";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ================= HEADER ================= */}
      <div className="space-y-3">
        <h1 className="flex items-center gap-3 tracking-tight mb-2">
          <span
            className="
                text-2xl sm:text-3xl lg:text-4xl
                font-extrabold leading-tight
                bg-clip-text text-transparent
                bg-linear-to-r
                from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400
              "
          >
            Laporan Akhir Magang
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl">
          Upload laporan akhir dalam format PDF (maksimal 5MB). Laporan hanya
          dapat diunggah <b>satu kali</b> dan bersifat final.
        </p>

        {/* Informasi Status Feedback (Opsional) */}
        {feedback && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
            ✅ Feedback sudah diisi
          </div>
        )}
      </div>

      {/* ================= KONTEN ================= */}
      {laporan ? (
        <div
          className="
              relative
              rounded-3xl
              bg-white dark:bg-slate-900
              border border-slate-200 dark:border-slate-800
              shadow-xl
              overflow-hidden
            "
        >
          {/* Accent bar */}
          <div
            className={`
                h-1 w-full
                bg-linear-to-r
                ${getStatusAccent(laporan.status)}
              `}
          />

          {/* File info */}
          <div className="p-5 sm:p-7 space-y-6">
            {/* HEADER FILE */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* File info */}
              <div className="flex items-start gap-4">
                <div
                  className="
                      w-12 h-12
                      rounded-2xl
                      flex items-center justify-center
                      text-xl
                      bg-slate-100 dark:bg-slate-800
                    "
                >
                  📄
                </div>

                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                    {laporan.fileName}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    {formatFileSize(laporan.fileSize)} • Dikirim{" "}
                    {new Date(laporan.submittedAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
              </div>

              {/* Status badge */}
              <span
                className={`
                    inline-flex items-center justify-center gap-2
                    px-4 py-2
                    rounded-full
                    text-xs sm:text-sm font-semibold
                    whitespace-nowrap
                    ${getStatusColor(laporan.status)}
                  `}
              >
                {getStatusIcon(laporan.status)}
                {laporan.status}
              </span>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={downloadPdf}
                className="
                    w-full sm:w-auto
                    inline-flex items-center justify-center gap-2
                    px-5 py-3
                    rounded-xl
                    text-sm font-semibold
                    text-white
                    transition-all
                    shadow-md hover:shadow-xl
                    hover:-translate-y-0.5

                    bg-linear-to-r
                    from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                    hover:from-[#991B1B] hover:via-[#DC2626] hover:to-[#FBBF24]

                    dark:from-indigo-600 dark:to-violet-500
                    dark:hover:from-indigo-500 dark:hover:to-violet-400
                  "
              >
                📥 Download PDF
              </button>

              {laporan.status === "Disetujui" && (
                <button
                  onClick={() => setShowPenilaianModal(true)}
                  className="
                      w-full sm:w-auto
                      inline-flex items-center justify-center gap-2
                      px-5 py-3
                      rounded-xl
                      text-sm font-semibold
                      border
                      border-amber-300
                      text-amber-700
                      hover:bg-amber-50
                      dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-900/20
                      transition
                    "
                >
                  ⭐ Lihat Penilaian
                </button>
              )}
            </div>

            {/* Mentor Note */}
            {laporan.mentorNote && (
              <div
                className="
                    relative
                    rounded-2xl
                    border
                    border-[#FCA5A5]/40 dark:border-indigo-500/30
                    bg-linear-to-br
                    from-[#FFF7ED] via-white to-[#FEF3C7]
                    dark:from-indigo-950 dark:via-slate-900 dark:to-indigo-900
                    p-5 sm:p-6
                    shadow-sm
                  "
              >
                {/* Judul */}
                <p className="text-xs font-semibold uppercase tracking-wide text-[#7F1D1D] dark:text-indigo-300 mb-6">
                  Timeline Review Mentor
                </p>

                <div className="relative">
                  {/* Garis timeline */}
                  <div
                    className="
                        absolute left-3 top-2 bottom-2
                        w-0.5
                        bg-linear-to-b
                        from-[#B91C1C] to-[#F59E0B]
                        dark:from-indigo-500 dark:to-violet-500
                      "
                  />

                  <div className="space-y-6">
                    {/* STEP 1 */}
                    <div className="grid grid-cols-[24px_1fr] gap-3 items-start">
                      {/* Titik */}
                      <div className="relative flex justify-center">
                        <div
                          className="
                              w-4 h-4
                              rounded-full
                              bg-emerald-500
                              ring-4 ring-white
                              dark:ring-slate-900
                            "
                        />
                      </div>

                      {/* Konten */}
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          Laporan dikirim
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(laporan.submittedAt).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      </div>
                    </div>

                    {/* STEP 2 */}
                    <div className="grid grid-cols-[24px_1fr] gap-3 items-start">
                      {/* Titik */}
                      <div className="relative flex justify-center">
                        <div
                          className="
                              w-4 h-4
                              rounded-full
                              bg-linear-to-br
                              from-[#B91C1C] to-[#F59E0B]
                              dark:from-indigo-500 dark:to-violet-500
                              ring-4 ring-white
                              dark:ring-slate-900
                            "
                        />
                      </div>

                      {/* Konten */}
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          Review mentor
                        </p>

                        <div
                          className="
                              rounded-xl
                              bg-white/80 dark:bg-white/5
                              border border-[#FED7AA] dark:border-indigo-500/30
                              px-4 py-3
                              text-sm
                              text-slate-700 dark:text-slate-200
                              leading-relaxed
                              whitespace-pre-line
                            "
                        >
                          {laporan.mentorNote}
                        </div>

                        {laporan.approvedAt && (
                          <p className="text-xs text-slate-500">
                            {laporan.status} pada{" "}
                            {new Date(laporan.approvedAt).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          className="
              relative
              rounded-3xl
              border
              border-[#FCA5A5]/40 dark:border-indigo-500/30
              bg-linear-to-br
              from-[#FFF7ED] via-white to-[#FEF3C7]
              dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-800
              shadow-xl
              p-8 sm:p-12
              text-center
              space-y-7
              overflow-hidden
            "
        >
          {/* subtle glow */}
          <div
            className="
                absolute inset-0
                bg-linear-to-br
                from-[#F97316] to-[#7F1D1D]
                dark:from-indigo-600 dark:to-violet-500
                opacity-10 blur-2xl
                pointer-events-none
              "
          />

          <div className="relative text-5xl">📤</div>

          <div className="relative space-y-2">
            <h3 className="text-xl font-bold text-[#7F1D1D] dark:text-white">
              Upload Laporan Akhir
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
              Upload file PDF laporan akhir magang. Pastikan file sudah lengkap
              sebelum dikirim.
            </p>
          </div>

          <div className="relative flex flex-col items-center gap-4 mt-2">
            {/* Warning */}
            <div
              className="
                  inline-flex flex-wrap justify-center items-center gap-2
                  rounded-full
                  px-4 py-2
                  text-xs font-semibold
                  bg-amber-50 text-amber-700
                  dark:bg-indigo-900/40 dark:text-indigo-300
                  border border-amber-300 dark:border-indigo-600
                "
            >
              ⚠️ Upload sekali • Maks 5MB • Format PDF
            </div>

            {/* Button */}
            <button
              onClick={() => setShowUploadModal(true)}
              className="
                  w-full sm:w-[320px]
                  inline-flex items-center justify-center gap-3
                  px-10 py-4
                  rounded-2xl
                  text-lg font-bold
                  text-white
                  shadow-lg hover:shadow-2xl
                  hover:-translate-y-0.5
                  transition-all

                  bg-linear-to-r
                  from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                  hover:from-[#991B1B] hover:via-[#DC2626] hover:to-[#FBBF24]

                  dark:from-indigo-600 dark:to-violet-500
                  dark:hover:from-indigo-500 dark:hover:to-violet-400
                "
            >
              Upload Laporan
            </button>
          </div>

          {/* Requirements */}
          <div className="relative pt-6 border-t border-slate-200 dark:border-indigo-700/40">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-300">
              <div>✓ Format PDF</div>
              <div>✓ Maksimal 5MB</div>
              <div>✓ Upload sekali</div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL UPLOAD ================= */}
      {showUploadModal && (
        <LaporanAkhirUploadModal
          onClose={async (success) => {
            setShowUploadModal(false);
            if (success) {
              setLoading(true);
              await Promise.all([fetchLaporan(), checkFeedback()]);
              setLoading(false);
              // Reset popup state ketika upload baru
              hasShownPopupRef.current = false;
            }
          }}
        />
      )}

      {/* ================= MODAL PENILAIAN ================= */}
      {showPenilaianModal && (
        <PenilaianModal onClose={() => setShowPenilaianModal(false)} />
      )}

      {/* ================= POPUP WAJIB FEEDBACK ================= */}
      {showFeedbackPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="text-4xl">📝</div>

            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              Isi Survei & Feedback
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              Laporan akhir Anda telah berhasil diunggah. Untuk melihat status
              laporan akhir dan nilai magang, Anda diwajibkan mengisi{" "}
              <b>Survei dan Feedback untuk BPOM</b> terlebih dahulu.
            </p>

            <button
              onClick={() => {
                // Navigasi ke halaman feedback dengan parameter return URL
                window.location.href =
                  "/dashboard/peserta/feedback?from=laporan-akhir";
              }}
              className="
                w-full
                py-3
                rounded-xl
                font-semibold
                text-white
                bg-linear-to-r
                from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                hover:from-[#991B1B] hover:via-[#DC2626] hover:to-[#FBBF24]
              "
            >
              Isi Survei Sekarang
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
