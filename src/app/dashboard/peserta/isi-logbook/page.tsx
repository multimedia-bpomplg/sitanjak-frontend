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
    <div className="space-y-8">
      <LogbookSummaryBoard {...summary} />

      <Calendar
        filledDates={filledDates}
        onSelectDate={(date, isFilled) => {
          setSelectedDate(date);
          setModalMode(isFilled ? "view" : "create");
        }}
      />

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
