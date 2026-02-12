// dashboard/peserta/laporan-akhir/page.tsx
"use client";

import { useEffect, useState } from "react";
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

export default function LaporanAkhirPage() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPenilaianModal, setShowPenilaianModal] = useState(false);
  const [laporan, setLaporan] = useState<LaporanAkhir | null>(null);
  const [loading, setLoading] = useState(true);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : "";

  /* ================= CEK LAPORAN AKHIR ================= */
  const fetchLaporan = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporan();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-10">
      {/* ================= HEADER ================= */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          📄 Laporan Akhir Magang
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl">
          Upload laporan akhir magang dalam format PDF (maksimal 10MB). Laporan
          akhir hanya dapat diupload satu kali dan bersifat <b>final</b>.
        </p>
      </div>

      {/* ================= KONTEN ================= */}
      <div className="grid gap-6">
        {/* ===== CARD LAPORAN ===== */}
        {laporan && (
          <div
            className="
              relative overflow-hidden
              rounded-3xl
              bg-white dark:bg-slate-900
              border border-slate-200 dark:border-slate-800
              shadow-[0_20px_50px_-20px_rgba(0,0,0,0.35)]
              p-6 sm:p-8
              space-y-6
            "
          >
            {/* Accent */}
            <div
              className="
                absolute top-0 left-0 right-0 h-0.75
                bg-linear-to-r
                from-emerald-400 via-teal-400 to-cyan-400
                dark:from-indigo-500 dark:via-violet-500 dark:to-fuchsia-500
              "
            />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <span className="text-2xl">📄</span>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                      {laporan.fileName}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      {formatFileSize(laporan.fileSize)} • Dikirim pada{" "}
                      {new Date(laporan.submittedAt).toLocaleDateString(
                        "id-ID",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <span
                className={`
                  shrink-0
                  inline-flex items-center gap-1.5
                  px-4 py-2
                  rounded-full
                  text-xs font-semibold
                  border
                  ${getStatusColor(laporan.status)}
                `}
              >
                {getStatusIcon(laporan.status)} {laporan.status}
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={downloadPdf}
                className="
                  group
                  inline-flex items-center justify-center gap-2
                  px-5 py-2.5
                  rounded-full
                  text-sm font-semibold
                  text-emerald-700 dark:text-emerald-300
                  border border-emerald-300 dark:border-emerald-500
                  bg-white dark:bg-slate-900
                  hover:bg-emerald-50 dark:hover:bg-emerald-900/30
                  shadow-sm hover:shadow-md
                  transition-all
                "
              >
                <span className="group-hover:scale-110 transition">📥</span>
                Download PDF
              </button>

              {/* <button
                onClick={() =>
                  window.open(
                    `${process.env.NEXT_PUBLIC_API_URL}/laporan-akhir/view/${laporan._id}`,
                    "_blank",
                  )
                }
                className="
                  group
                  inline-flex items-center justify-center gap-2
                  px-5 py-2.5
                  rounded-full
                  text-sm font-semibold
                  text-indigo-700 dark:text-indigo-300
                  border border-indigo-300 dark:border-indigo-500
                  bg-white dark:bg-slate-900
                  hover:bg-indigo-50 dark:hover:bg-indigo-900/30
                  shadow-sm hover:shadow-md
                  transition-all
                "
              >
                <span className="group-hover:scale-110 transition">👁️</span>
                Lihat PDF
              </button> */}

              {laporan.status === "Disetujui" && (
                <button
                  onClick={() => setShowPenilaianModal(true)}
                  className="
                    group
                    inline-flex items-center justify-center gap-2
                    px-5 py-2.5
                    rounded-full
                    text-sm font-semibold
                    text-amber-700 dark:text-amber-300
                    border border-amber-300 dark:border-amber-500
                    bg-white dark:bg-slate-900
                    hover:bg-amber-50 dark:hover:bg-amber-900/30
                    shadow-sm hover:shadow-md
                    transition-all
                  "
                >
                  <span className="group-hover:scale-110 transition">⭐</span>
                  Lihat Penilaian
                </button>
              )}
            </div>

            {/* Mentor Note */}
            {laporan.mentorNote && (
              <div
                className="
                  rounded-2xl
                  border border-indigo-200 dark:border-indigo-800
                  bg-indigo-50 dark:bg-indigo-900/20
                  px-5 py-4
                  space-y-2
                "
              >
                <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
                  Catatan Mentor
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line">
                  {laporan.mentorNote}
                </p>
                {laporan.approvedAt && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Disetujui pada{" "}
                    {new Date(laporan.approvedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== CTA UPLOAD LAPORAN ===== */}
        {!laporan && (
          <div
            className="
              rounded-3xl
              border border-dashed
              border-slate-300 dark:border-slate-700
              bg-slate-50 dark:bg-slate-900
              p-10
              flex flex-col items-center justify-center
              text-center
              space-y-6
            "
          >
            <div className="text-6xl">📤</div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                Upload Laporan Akhir
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
                Silakan upload file PDF laporan akhir magang Anda. Pastikan file
                sudah sesuai dan lengkap.
              </p>
            </div>

            {/* ⚠️ WARNING */}
            <div
              className="
                inline-flex items-center gap-2
                rounded-full
                px-4 py-2
                text-xs font-semibold
                bg-amber-50 text-amber-700
                dark:bg-amber-900/30 dark:text-amber-300
                border border-amber-300 dark:border-amber-600
              "
            >
              ⚠️ Hanya dapat upload <b>satu kali</b> • Maksimal 10MB • Format
              PDF
            </div>

            {/* CTA BUTTON */}
            <button
              onClick={() => setShowUploadModal(true)}
              className="
                mt-4
                group
                inline-flex items-center gap-3
                px-8 py-4
                rounded-full
                text-sm font-bold
                transition-all
                shadow-lg hover:shadow-2xl
                hover:-translate-y-0.5

                bg-linear-to-r
                from-[#7F1D1D] via-[#B91C1C] to-[#D97706]
                text-white
                hover:from-[#991B1B] hover:via-[#DC2626] hover:to-[#F59E0B]

                dark:from-indigo-600 dark:to-violet-600
                dark:hover:from-indigo-500 dark:hover:to-violet-500
              "
            >
              <span className="text-xl group-hover:scale-110 transition">
                📎
              </span>
              Upload Laporan Akhir
            </button>

            {/* Requirements */}
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span> Format PDF
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span> Maksimal 10MB
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span> 1x upload final
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL UPLOAD ================= */}
      {showUploadModal && (
        <LaporanAkhirUploadModal
          onClose={(success) => {
            setShowUploadModal(false);
            if (success) fetchLaporan();
          }}
        />
      )}

      {/* ================= MODAL PENILAIAN ================= */}
      {showPenilaianModal && (
        <PenilaianModal onClose={() => setShowPenilaianModal(false)} />
      )}
    </div>
  );
}
