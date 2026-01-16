"use client";

import { useState, useEffect } from "react";
import Calendar from "@/components/logbook/Calendar";
import LogbookModal from "@/components/logbook/LogbookModal";
import LogbookSummaryBoard from "@/components/logbook/LogbookSummaryBoard";

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

  return (
    <div className="space-y-10">
      {/* ================= PAGE HEADER ================= */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
          📘 Logbook Kegiatan
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-4xl leading-relaxed">
          Catat aktivitas harian selama magang, pantau kehadiran, dan kelola laporan harian dengan rapi.
        </p>
      </div>

      {/* ================= SUMMARY BOARD ================= */}
      <div className="relative">
        <LogbookSummaryBoard {...summary} />
      </div>

      {/* ================= CALENDAR SECTION ================= */}
      <div
        className="
          rounded-3xl
          bg-white/80 dark:bg-slate-900/70
          backdrop-blur
          shadow-[0_10px_30px_-10px_rgba(0,0,0,0.15)]
          p-6 md:p-8
          space-y-4
        "
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              📅 Kalender Logbook
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Pilih tanggal untuk mengisi atau melihat logbook
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-[11px] sm:text-xs items-center gap-4 text-xs font-medium">
            {/* Sudah diisi */}
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              <span className="text-slate-700 dark:text-slate-300">
                Sudah diisi
              </span>
            </div>

            {/* Belum diisi */}
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span className="text-slate-600 dark:text-slate-400">
                Belum diisi
              </span>
            </div>
          </div>
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
