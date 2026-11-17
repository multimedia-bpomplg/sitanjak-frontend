"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { plusJakarta, caveat } from '@/lib/font';
import {
  HiChevronLeft,
  HiChevronRight,
  HiX,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineUserGroup,
  HiArrowRight,
} from "react-icons/hi";



// ─── Types ────────────────────────────────────────────────────────────────────

interface InternRange {
  nama: string;
  fungsi: string;
  mulai: string;
  selesai: string;
  kuotaTerisi: number;
  kuotaTotal: number;
  durasi: string;
  statusMagang: string;
}

interface CalendarPopupProps {
  isOpen: boolean;
  onClose: () => void;
  formasi?: {
    title: string;
    kuota: number;
    jumlahPendaftar: number;
    sisaKuota: number;
    jumlahSelesaiMagang?: number;

    statusMagang?: string[];
    tanggalMulaiMagang?: string[];
    tanggalSelesaiMagang?: string[];
  } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEventKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseDate(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatTanggal(str: string): string {
  const d = parseDate(str);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function hitungDurasi(mulai: string, selesai: string): string {
  const start = parseDate(mulai);
  const end = parseDate(selesai);
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 7) return `${diffDays} Hari`;
  if (diffDays < 30) return `${Math.round(diffDays / 7)} Minggu`;
  const months = Math.round(diffDays / 30);
  return `${months} Bulan`;
}

function isSedangMagang(
  statusMagang: string,
  tanggalMulai: string,
  tanggalSelesai: string,
): boolean {
  const sekarang = new Date();
  const mulai = parseDate(tanggalMulai);
  const selesai = parseDate(tanggalSelesai);

  return (
    (statusMagang === "Sedang Magang" ||
      statusMagang === "Belum Waktu Magang") &&
    sekarang >= mulai &&
    sekarang <= selesai
  );
}

// ─── Warna Tailwind Classes ───────────────────────────────────────────────────
const getRangeColors = (index: number) => {
  const colors = [
    {
      bg: "bg-[#EBF5FF]",
      border: "border-[#0088FF]/30",
      text: "text-[#0088FF]",
      dot: "bg-[#0088FF]",
    },
    {
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      text: "text-indigo-600",
      dot: "bg-indigo-500",
    },
    {
      bg: "bg-sky-50",
      border: "border-sky-200",
      text: "text-sky-600",
      dot: "bg-sky-500",
    },
    {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-600",
      dot: "bg-emerald-500",
    },
    {
      bg: "bg-violet-50",
      border: "border-violet-200",
      text: "text-violet-600",
      dot: "bg-violet-500",
    },
  ];
  return colors[index % colors.length];
};

// ─── NavButton Component ─────────────────────────────────────────────────────
function NavButton({
  onClick,
  children,
  label,
}: {
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-[#EBF5FF] text-[#475569] hover:text-[#0088FF] transition-all duration-200 flex items-center justify-center shrink-0"
    >
      {children}
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function CalendarPopup({
  isOpen,
  onClose,
  formasi,
}: CalendarPopupProps) {
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSelectedDay(null);
  }, [formasi]);

  // Kunci scroll halaman saat modal terbuka + dukung tombol ESC
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const today = new Date();

  // Bangun daftar range dari data pendaftar formasi
  const internRanges: InternRange[] = (() => {
    if (!formasi?.tanggalMulaiMagang) return [];

    const groups: Record<string, InternRange> = {};

    formasi.tanggalMulaiMagang.forEach((mulai, idx) => {
      const selesai = formasi?.tanggalSelesaiMagang?.[idx] ?? mulai;
      const status = formasi?.statusMagang?.[idx] ?? "Menunggu";

      const key = `${mulai}_${selesai}`;

      if (!groups[key]) {
        groups[key] = {
          nama: "Kelompok",
          fungsi: formasi.title,
          mulai,
          selesai,
          kuotaTerisi: 0,
          kuotaTotal: formasi.kuota,
          durasi: hitungDurasi(mulai, selesai),
          statusMagang: status,
        };
      }

      groups[key].kuotaTerisi += 1;
    });

    return Object.values(groups);
  })();

  // Hitung statistik
  const sekarang = new Date();
  const pesertaSedangMagang = internRanges.filter((range) =>
    isSedangMagang(range.statusMagang, range.mulai, range.selesai),
  ).length;

  const pesertaAkanMagang = internRanges.filter(
    (range) =>
      range.statusMagang === "Belum Waktu Magang" &&
      parseDate(range.mulai) > sekarang,
  ).length;

  const pesertaSelesaiMagang = internRanges.filter(
    (range) => range.statusMagang === "Selesai Magang",
  ).length;

  // Cek range untuk tanggal tertentu
  function getRangesForDate(dateKey: string): number[] {
    return internRanges.reduce<number[]>((acc, range, idx) => {
      const start = parseDate(range.mulai);
      const end = parseDate(range.selesai);
      const cur = parseDate(dateKey);
      if (cur >= start && cur <= end) acc.push(idx);
      return acc;
    }, []);
  }

  // Kalender
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  ).getDate();

  const firstDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  ).getDay();

  const monthName = currentDate.toLocaleString("id-ID", { month: "long" });
  const year = currentDate.getFullYear();

  const prevMonth = () => {
    setSelectedDay(null);
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setSelectedDay(null);
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const isToday = (d: number) =>
    d === today.getDate() &&
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getFullYear() === today.getFullYear();

  // Info untuk tanggal yang dipilih
  const selectedKey = selectedDay
    ? getEventKey(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        selectedDay,
      )
    : null;
  const selectedRangeIdxs = selectedKey ? getRangesForDate(selectedKey) : [];

  // Build day cells
  const days: React.ReactNode[] = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`e${i}`} className="aspect-square" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dayKey = getEventKey(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      d,
    );
    const rangeIdxs = getRangesForDate(dayKey);
    const hasRange = rangeIdxs.length > 0;
    const status = internRanges[rangeIdxs[0]]?.statusMagang;

    let colors;
    if (status === "Sedang Magang") {
      colors = {
        bg: "bg-[#EBF5FF]",
        border: "border-[#0088FF]/40",
        text: "text-[#0088FF]",
        dot: "bg-[#0088FF]",
      };
    } else if (status === "Belum Waktu Magang") {
      colors = {
        bg: "bg-amber-50",
        border: "border-amber-300",
        text: "text-amber-700",
        dot: "bg-amber-500",
      };
    } else if (status === "Selesai Magang") {
      colors = {
        bg: "bg-emerald-50",
        border: "border-emerald-300",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
      };
    } else {
      colors = getRangeColors(rangeIdxs[0]);
    }

    const today_ = isToday(d);
    const selected = selectedDay === d;
    const hovered = hoveredDay === d;

    let bgClass = "";
    let textClass = "text-[#0B1B3D] font-semibold";
    let shadowClass = "";
    let outlineClass = "";

    if (selected) {
      bgClass = "bg-[#0088FF]";
      textClass = "text-white font-bold";
      shadowClass = "shadow-md shadow-[#0088FF]/30";
    } else if (today_) {
      bgClass = "bg-[#EBF5FF]";
      textClass = "text-[#0088FF] font-extrabold";
      outlineClass = "ring-2 ring-[#0088FF]";
    } else if (hasRange) {
      bgClass = "bg-slate-50 hover:bg-[#EBF5FF]/60";
    } else if (hovered) {
      bgClass = "bg-slate-100";
    }

    days.push(
      <button
        key={d}
        type="button"
        onClick={() => setSelectedDay(d)}
        onMouseEnter={() => setHoveredDay(d)}
        onMouseLeave={() => setHoveredDay(null)}
        className={`
          relative flex items-center justify-center w-full aspect-square
          rounded-xl cursor-pointer text-xs sm:text-sm
          transition-all duration-200
          ${selected ? "scale-105 z-10" : "scale-100"}
          ${bgClass} ${textClass} ${shadowClass} ${outlineClass}
        `}
      >
        {d}

        {/* Today dot */}
        {today_ && !selected && (
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#0088FF]" />
        )}

        {/* Range dot */}
        {hasRange && !selected && !today_ && (
          <span
            className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${colors?.dot}`}
          />
        )}

        {/* Multiple ranges indicator */}
        {rangeIdxs.length > 1 && !selected && (
          <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#0088FF] text-[8px] flex items-center justify-center text-white font-bold">
            {rangeIdxs.length}
          </span>
        )}
      </button>,
    );
  }

  const filteredRanges = internRanges.filter((range) => {
    const start = parseDate(range.mulai);
    const end = parseDate(range.selesai);

    const monthStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );

    const monthEnd = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
    );

    return start <= monthEnd && end >= monthStart;
  });

  // Render menggunakan Portal langsung ke document.body agar berada di atas SEMUA elemen (Navbar, WhatsApp, dll)
  return createPortal(
    <div
      className={`${plusJakarta.className} fixed inset-0 z-99999 flex items-center justify-center p-4 sm:p-6`}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#0B1B3D]/60 backdrop-blur-xs transition-opacity cursor-pointer"
      />

      {/* Modal Container */}
      <div className="relative z-10 bg-white rounded-3xl w-full max-w-[540px] max-h-[90vh] flex flex-col overflow-hidden shadow-[0_24px_60px_rgba(11,27,61,0.28)] border border-slate-100">
        {/* ================= MODAL HEADER ================= */}
        <div className="bg-linear-to-r from-[#0B1B3D] via-[#0F295A] to-[#0088FF] px-6 py-5 text-white flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-bold tracking-wider uppercase mb-2">
              <HiOutlineCalendar className="text-xs" />
              <span>Jadwal & Ketersediaan Kuota</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold leading-snug">
              {formasi?.title || "Kalender Formasi"}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Modal"
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors shrink-0 mt-0.5"
          >
            <HiX className="text-lg" />
          </button>
        </div>

        {/* ================= MODAL BODY (SCROLLABLE) ================= */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-5 flex-1">
          {/* Statistik Ringkas (3 Kartu Kecil) */}
          {formasi && (
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-[#F0F7FF] border border-[#D6EEFF] rounded-2xl p-3 text-center">
                <p className="text-xl font-extrabold text-[#0088FF]">
                  {pesertaSedangMagang}
                </p>
                <p className="text-[11px] font-semibold text-[#475569] mt-0.5">
                  Sedang Magang
                </p>
              </div>

              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 text-center">
                <p className="text-xl font-extrabold text-amber-600">
                  {pesertaAkanMagang}
                </p>
                <p className="text-[11px] font-semibold text-[#475569] mt-0.5">
                  Akan Magang
                </p>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 text-center">
                <p className="text-xl font-extrabold text-emerald-600">
                  {pesertaSelesaiMagang}
                </p>
                <p className="text-[11px] font-semibold text-[#475569] mt-0.5">
                  Selesai Magang
                </p>
              </div>
            </div>
          )}

          {/* Box Kalender */}
          <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-4">
            {/* Navigasi Bulan & Tahun */}
            <div className="flex items-center justify-between mb-4">
              <NavButton onClick={prevMonth} label="Bulan Sebelumnya">
                <HiChevronLeft size={20} />
              </NavButton>

              <div className="text-center">
                <h4 className="text-base sm:text-lg font-extrabold text-[#0B1B3D] capitalize">
                  {monthName} {year}
                </h4>
                <p className="text-[11px] text-[#64748B] font-medium">
                  Klik tanggal untuk melihat detail periode
                </p>
              </div>

              <NavButton onClick={nextMonth} label="Bulan Berikutnya">
                <HiChevronRight size={20} />
              </NavButton>
            </div>

            {/* Header Hari */}
            <div className="grid grid-cols-7 gap-1 mb-1.5">
              {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(
                (day, i) => (
                  <div
                    key={day}
                    className={`text-center text-[11px] font-extrabold tracking-wider py-1 ${
                      i === 0 ? "text-rose-500" : "text-[#64748B]"
                    }`}
                  >
                    {day.toUpperCase()}
                  </div>
                ),
              )}
            </div>

            {/* Grid Tanggal */}
            <div className="grid grid-cols-7 gap-1">{days}</div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-slate-200/70 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] font-medium text-[#475569]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0088FF]" />
                <span>Sedang Magang</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Akan Magang</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Selesai</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full ring-2 ring-[#0088FF] bg-[#EBF5FF]" />
                <span>Hari Ini</span>
              </div>
            </div>
          </div>

          {/* Info Tanggal yang Dipilih */}
          {selectedDay && (
            <div className="space-y-2.5">
              {selectedRangeIdxs.length === 0 ? (
                <div className="rounded-2xl p-3.5 bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EBF5FF] text-[#0088FF] flex items-center justify-center shrink-0">
                    <HiOutlineCalendar className="text-xl" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold tracking-wider text-[#64748B] uppercase">
                      {new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth(),
                        selectedDay,
                      ).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-sm font-bold text-[#0B1B3D] mt-0.5">
                      Tidak ada kelompok magang aktif pada tanggal ini
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedRangeIdxs.map((ri) => {
                    const range = internRanges[ri];
                    const colors = getRangeColors(ri);
                    const isFull = range.kuotaTerisi >= range.kuotaTotal;
                    return (
                      <div
                        key={ri}
                        className={`rounded-2xl p-4 ${colors.bg} border ${colors.border}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white text-[#0088FF] flex items-center justify-center shrink-0 shadow-xs">
                            <HiOutlineClock className="text-lg" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-[11px] font-extrabold tracking-wider ${colors.text} uppercase`}
                              >
                                Periode Magang · {range.durasi}
                              </span>
                              <span className="text-xs font-extrabold text-[#0B1B3D] bg-white px-2.5 py-0.5 rounded-full border border-slate-200/60">
                                {range.kuotaTerisi} Peserta
                              </span>
                            </div>

                            <p className="text-sm font-extrabold text-[#0B1B3D] mt-1">
                              {formatTanggal(range.mulai)} –{" "}
                              {formatTanggal(range.selesai)}
                            </p>

                            <p className="text-xs text-[#475569] mt-1">
                              Sebanyak{" "}
                              <strong className="text-[#0B1B3D]">
                                {range.kuotaTerisi} kuota
                              </strong>{" "}
                              terjadwal pada{" "}
                              <strong className="text-[#0B1B3D]">
                                {range.fungsi}
                              </strong>
                              .
                            </p>

                            {isFull && (
                              <span className="mt-2 inline-flex items-center gap-1 bg-rose-100 text-rose-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                                Kuota Periode Ini Penuh
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Rangkuman Periode Bulan Ini */}
          {internRanges.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
              <div className="flex items-center gap-2 mb-3">
                <HiOutlineUserGroup className="text-[#0088FF] text-base" />
                <h5 className="text-xs font-extrabold tracking-wider text-[#0B1B3D] uppercase">
                  Rangkuman Periode Bulan {monthName}
                </h5>
              </div>

              {filteredRanges.length === 0 ? (
                <p className="text-xs text-[#64748B]">
                  Belum ada jadwal peserta magang pada bulan {monthName} {year}.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {filteredRanges.map((range, ri) => {
                    const colors = getRangeColors(ri);
                    const isFull = range.kuotaTerisi >= range.kuotaTotal;
                    return (
                      <div
                        key={ri}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-100"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${colors.dot} shrink-0`}
                          />
                          <div className="truncate">
                            <p className="text-xs font-bold text-[#0B1B3D] truncate">
                              {formatTanggal(range.mulai)} –{" "}
                              {formatTanggal(range.selesai)}
                            </p>
                            <p className="text-[11px] text-[#64748B]">
                              Durasi {range.durasi}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-xs font-extrabold px-2.5 py-1 rounded-lg shrink-0 ${
                            isFull
                              ? "bg-rose-50 text-rose-600"
                              : "bg-[#EBF5FF] text-[#0088FF]"
                          }`}
                        >
                          {range.kuotaTerisi} Orang
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            formasi && (
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-center">
                <p className="text-sm font-extrabold text-emerald-700">
                  Seluruh Kuota Tersedia
                </p>
                <p className="text-xs text-[#475569] mt-1">
                  Belum ada jadwal terisi di <strong>{formasi.title}</strong>.
                  Tersedia penuh <strong>{formasi.kuota} kursi</strong>.
                </p>
              </div>
            )
          )}
        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-t border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setCurrentDate(new Date());
              setSelectedDay(today.getDate());
            }}
            className="text-xs sm:text-sm font-bold text-[#0088FF] hover:bg-[#EBF5FF] px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Ke Hari Ini
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs sm:text-sm font-bold text-[#475569] transition-colors cursor-pointer"
            >
              Tutup
            </button>

            <Link
              href="/pendaftaran"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0088FF] hover:bg-[#0073E6] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#0088FF]/25 transition-all"
            >
              <span>Daftar Sekarang</span>
              <HiArrowRight className="text-sm" />
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
