// dashboard/peserta/isi-logbook/page.tsx - Tambahkan tombol
"use client";

import { useState, useEffect } from "react";
import Calendar from "@/components/logbook/Calendar";
import LogbookModal from "@/components/logbook/LogbookModal";
import LogbookSummaryBoard from "@/components/logbook/LogbookSummaryBoard";
import { FiDownload } from "react-icons/fi";
import { showToast } from "@/components/ui/toastDashboard";

export default function IsiLogbookPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "view">("create");
  const [filledDates, setFilledDates] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState({
    total: 0,
    hadir: 0,
    tidakHadirDenganKeterangan: 0,
    tidakHadirTanpaKeterangan: 0,
  });
  const [isDownloading, setIsDownloading] = useState(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : "";

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const refreshAll = async () => {
    try {
      const [datesRes, summaryRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/logbook/filled-dates`, {
          headers,
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/logbook/summary`, {
          headers,
        }),
      ]);

      const datesJson = await datesRes.json();
      const summaryJson = await summaryRes.json();

      setFilledDates(datesJson);
      setSummary(summaryJson);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // Fungsi untuk download semua logbook
  const handleDownloadAll = async () => {
    if (summary.total === 0) {
      showToast.error("Belum ada logbook untuk diunduh");
      return;
    }

    setIsDownloading(true);
    const toastId = showToast.loading("Menyiapkan PDF logbook...");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/logbook/download/pdf`,
        {
          headers,
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Belum ada logbook yang diisi");
        }
        throw new Error("Gagal mengunduh logbook");
      }

      // Buat blob dari response
      const blob = await response.blob();

      // Buat URL untuk blob
      const url = window.URL.createObjectURL(blob);

      // Buat link untuk download
      const a = document.createElement("a");
      a.href = url;
      a.download = `logbook-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Bersihkan URL
      window.URL.revokeObjectURL(url);

      showToast.updateSuccess(toastId, "PDF logbook berhasil diunduh! ✅");
    } catch (error: any) {
      console.error("Download error:", error);
      showToast.updateError(
        toastId,
        error.message || "Gagal mengunduh logbook",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* ================= PAGE HEADER ================= */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
              📘 Logbook Kegiatan
            </h1>
            <p className="text-slate-600 dark:text-slate-400 max-w-4xl leading-relaxed">
              Catat aktivitas harian selama magang, pantau kehadiran, dan kelola
              laporan harian dengan rapi.
            </p>
          </div>
        </div>
      </div>

      {/* ================= SUMMARY BOARD ================= */}
      <div className="relative">
        <LogbookSummaryBoard {...summary} />
      </div>

      {/* ================= CALENDAR SECTION ================= */}
      <div
        className="
          rounded-3xl
          border border-[#FCA5A5]/40 dark:border-indigo-500/30
          bg-linear-to-br
          from-[#FFFDF8] via-[#FFF1E8] to-white
          dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-800
          backdrop-blur
          shadow-[0_10px_30px_-10px_rgba(0,0,0,0.15)]
          p-6 md:p-8
          space-y-6
        "
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* JUDUL */}
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#7F1D1D] dark:text-white">
              📅 Kalender Logbook
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Pilih tanggal untuk mengisi atau melihat logbook
            </p>
          </div>

          {/* ACTION DOWNLOAD */}
          <button
            onClick={handleDownloadAll}
            disabled={isDownloading || summary.total === 0}
            className={`
              group
              w-full lg:w-auto
              flex items-center justify-center gap-3
              px-6 py-3
              rounded-2xl
              font-semibold text-sm
              transition-all duration-300

              ${
                summary.total === 0 || isDownloading
                  ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                  : `
                    bg-linear-to-r
                    from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                    dark:from-indigo-600 dark:via-indigo-500 dark:to-violet-500
                    text-white
                    shadow-lg
                    hover:shadow-xl
                    hover:scale-[1.02]
                  `
              }
            `}
          >
            <div
              className="
                w-9 h-9
                rounded-xl
                bg-white/20
                flex items-center justify-center
                backdrop-blur
              "
            >
              <FiDownload
                className={`text-lg ${isDownloading ? "animate-spin" : ""}`}
              />
            </div>

            <div className="text-left leading-tight">
              <p className="text-sm font-bold">
                {isDownloading ? "Menyiapkan PDF..." : "Download Logbook"}
              </p>
              <p className="text-[11px] opacity-80">
                Unduh semua logbook dalam satu file PDF
              </p>
            </div>
          </button>
        </div>

        <Calendar
          filledDates={filledDates}
          onSelectDate={(date, isFilled) => {
            setSelectedDate(date);
            setModalMode(isFilled ? "view" : "create");
          }}
        />
      </div>

      {/* ================= MODAL ================= */}
      {selectedDate && (
        <LogbookModal
          date={selectedDate}
          mode={modalMode}
          onClose={() => {
            setSelectedDate(null);
            refreshAll();
          }}
        />
      )}
    </div>
  );
}
