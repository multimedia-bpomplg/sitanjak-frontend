"use client";

import { useState, useEffect } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";

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
    month: "long",
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
      bg: "bg-blue-50",
      border: "border-blue-300",
      text: "text-blue-700",
      dot: "bg-blue-500",
    },
    {
      bg: "bg-indigo-50",
      border: "border-indigo-300",
      text: "text-indigo-700",
      dot: "bg-indigo-500",
    },
    {
      bg: "bg-sky-50",
      border: "border-sky-300",
      text: "text-sky-700",
      dot: "bg-sky-500",
    },
    {
      bg: "bg-emerald-50",
      border: "border-emerald-300",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    {
      bg: "bg-purple-50",
      border: "border-purple-300",
      text: "text-purple-700",
      dot: "bg-purple-500",
    },
  ];
  return colors[index % colors.length];
};

// ─── NavButton Component ─────────────────────────────────────────────────────
function NavButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="w-[38px] h-[38px] rounded-xl bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-600 hover:scale-105 transition-all duration-200 flex items-center justify-center flex-shrink-0"
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  useEffect(() => {
    setSelectedDay(null);
  }, [formasi]);

  if (!isOpen) return null;

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
        bg: "bg-blue-100",
        border: "border-blue-400",
        text: "text-blue-700",
        dot: "bg-blue-500",
      };
    } else if (status === "Belum Waktu Magang") {
      colors = {
        bg: "bg-amber-100",
        border: "border-amber-400",
        text: "text-amber-700",
        dot: "bg-amber-500",
      };
    } else if (status === "Selesai Magang") {
      colors = {
        bg: "bg-emerald-100",
        border: "border-emerald-400",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
      };
    } else {
      colors = getRangeColors(rangeIdxs[0]);
    }

    const today_ = isToday(d);
    const selected = selectedDay === d;
    const hovered = hoveredDay === d;

    // Cek posisi dalam range
    let isStart = false,
      isEnd = false,
      isMid = false;
    if (hasRange) {
      const range = internRanges[rangeIdxs[0]];
      isStart = dayKey === range.mulai;
      isEnd = dayKey === range.selesai;
      isMid = !isStart && !isEnd;
    }

    let bgClass = "";
    let textClass = "text-gray-900";
    let shadowClass = "";
    let outlineClass = "";

    if (selected) {
      // tanggal yang dipilih
      bgClass = "bg-red-600";
      textClass = "text-white";
      shadowClass = "shadow-md shadow-red-500/30";
    } else if (today_) {
      // hari ini
      outlineClass = "outline outline-2 outline-red-400";
    } else if (hovered) {
      // hover efek ringan
      bgClass = "bg-gray-100";
    }

    days.push(
      <button
        key={d}
        onClick={() => setSelectedDay(d)}
        onMouseEnter={() => setHoveredDay(d)}
        onMouseLeave={() => setHoveredDay(null)}
        className={`
          relative flex items-center justify-center w-full aspect-square
          border-none cursor-pointer text-sm font-['DM_Sans']
          transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]
          ${selected ? "scale-110" : hovered ? "scale-105" : "scale-100"}
          ${bgClass} ${textClass} ${shadowClass} ${outlineClass}
          ${selected || today_ || !isMid ? "rounded-full" : "rounded-none"}
          z-${selected || hovered ? "10" : "1"}
        `}
      >
        {d}

        {/* Today dot */}
        {today_ && !selected && (
          <span className="absolute bottom-[4px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-600 shadow-sm" />
        )}

        {/* Range dot */}
        {hasRange && !selected && !today_ && (
          <span
            className={`absolute bottom-[4px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ${colors?.dot} shadow-sm`}
          />
        )}

        {/* Multiple ranges indicator */}
        {rangeIdxs.length > 1 && !selected && (
          <span className="absolute top-[3px] right-[3px] w-[14px] h-[14px] rounded-full bg-indigo-500 text-[8px] flex items-center justify-center text-white font-bold shadow-sm">
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

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap");

        @keyframes fadeSlide {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeSlide {
          animation: fadeSlide 0.2s ease;
        }
      `}</style>

      {/* Backdrop - KLIK UNTUK TUTUP */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
      />

      {/* Modal wrapper */}
      <div className="fixed inset-0 z-51 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto bg-white rounded-[28px] w-[min(520px,96vw)] max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-8 fade-in duration-300 font-['DM_Sans']">
          {/* Top shimmer bar */}
          <div className="h-1 bg-gradient-to-r from-red-300 via-red-600 to-red-800 rounded-t-[28px] animate-[shimmer_3s_linear_infinite]" />

          <div className="p-6">
            {/* Judul Formasi */}
            {formasi && (
              <div className="text-center mb-4">
                <div className="text-[0.7rem] font-bold tracking-wider text-gray-400 uppercase mb-1">
                  Jadwal Ketersediaan
                </div>
                <div className="font-['DM_Serif_Display'] text-xl text-[#7F1D1D]">
                  {formasi.title}
                </div>
              </div>
            )}

            {/* Stats Card - ANGKA HITAM */}
            {formasi && (
              <div className="grid grid-cols-3 gap-2 mb-4 p-2 bg-gray-50 rounded-2xl">
                <div
                  className={`text-center p-2 rounded-xl ${pesertaSedangMagang > 0 ? "bg-blue-100" : ""}`}
                >
                  <div className="text-xl font-bold text-gray-900">
                    {pesertaSedangMagang}
                  </div>
                  <div className="text-[0.65rem] text-gray-600">
                    Sedang Magang
                  </div>
                </div>
                <div
                  className={`text-center p-2 rounded-xl ${pesertaAkanMagang > 0 ? "bg-amber-100" : ""}`}
                >
                  <div className="text-xl font-bold text-gray-900">
                    {pesertaAkanMagang}
                  </div>
                  <div className="text-[0.65rem] text-gray-600">
                    Akan Magang
                  </div>
                </div>
                <div
                  className={`text-center p-2 rounded-xl ${pesertaSelesaiMagang > 0 ? "bg-emerald-100" : ""}`}
                >
                  <div className="text-xl font-bold text-gray-900">
                    {pesertaSelesaiMagang}
                  </div>
                  <div className="text-[0.65rem] text-gray-600">Selesai</div>
                </div>
              </div>
            )}

            {/* Header navigasi - TANPA TANDA X */}
            <div className="flex items-center justify-between mb-5">
              <NavButton onClick={prevMonth}>
                <HiChevronLeft size={20} />
              </NavButton>

              <div className="text-center">
                <div className="font-['DM_Serif_Display'] text-2xl text-[#7F1D1D] leading-tight tracking-tight">
                  {monthName}
                </div>
                <div className="text-xs text-gray-400 font-medium tracking-wider mt-0.5">
                  {year}
                </div>
              </div>

              <NavButton onClick={nextMonth}>
                <HiChevronRight size={20} />
              </NavButton>
            </div>

            {/* Nama hari */}
            <div className="grid grid-cols-7 gap-0.5 mb-1.5">
              {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(
                (day, i) => (
                  <div
                    key={day}
                    className={`text-center text-[0.65rem] font-bold tracking-wider pb-1.5 ${
                      i === 0 ? "text-red-600" : "text-gray-300"
                    }`}
                  >
                    {day.toUpperCase()}
                  </div>
                ),
              )}
            </div>

            {/* Grid tanggal */}
            <div className="grid grid-cols-7 gap-0.5">{days}</div>

            {/* Info tanggal dipilih */}
            {selectedDay && (
              <div className="mt-3.5 animate-fadeSlide">
                {selectedRangeIdxs.length === 0 ? (
                  <div className="rounded-xl p-3 bg-gray-50 border border-gray-200 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-lg flex-shrink-0">
                      📅
                    </div>
                    <div>
                      <div className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                        {new Date(
                          currentDate.getFullYear(),
                          currentDate.getMonth(),
                          selectedDay,
                        ).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-sm font-semibold text-gray-700 mt-0.5">
                        Tidak ada peserta magang aktif
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {selectedRangeIdxs.map((ri) => {
                      const range = internRanges[ri];
                      const colors = getRangeColors(ri);
                      const isFull = range.kuotaTerisi >= range.kuotaTotal;
                      return (
                        <div
                          key={ri}
                          className={`rounded-xl p-3 ${colors.bg} border-2 ${colors.border}50 animate-fadeSlide`}
                        >
                          <div className="flex gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center text-lg flex-shrink-0`}
                            >
                              📌
                            </div>
                            <div className="flex-1">
                              <div
                                className={`text-[0.7rem] font-bold tracking-wider ${colors.text} uppercase mb-0.5`}
                              >
                                Periode Aktif · {range.durasi}
                              </div>
                              <div
                                className={`text-sm font-bold ${colors.text} leading-tight mb-1`}
                              >
                                {formatTanggal(range.mulai)} –{" "}
                                {formatTanggal(range.selesai)}
                              </div>
                              <div className="text-xs text-gray-600 leading-relaxed">
                                <span
                                  className={`font-semibold ${colors.text}`}
                                >
                                  {range.kuotaTerisi} Kuota
                                </span>{" "}
                                telah terisi di{" "}
                                <span className="font-bold">
                                  {range.fungsi}
                                </span>{" "}
                                dengan masa magang{" "}
                                <span className="font-semibold">
                                  {range.durasi}
                                </span>
                              </div>
                              {isFull && (
                                <div className="mt-1.5 inline-flex items-center gap-1 bg-red-100 text-red-600 text-[0.7rem] font-bold px-2 py-0.5 rounded-full">
                                  🚫 Kuota Penuh — Pendaftaran Ditutup
                                </div>
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

            {/* Rangkuman semua periode */}
            {internRanges.length > 0 && (
              <div className="mt-3.5 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-[0.68rem] font-bold tracking-wider text-gray-400 uppercase mb-2.5">
                  Rangkuman Periode Magang
                </div>
                <div className="flex flex-col gap-2">
                  {filteredRanges.map((range, ri) => {
                    const colors = getRangeColors(ri);
                    const isFull = range.kuotaTerisi >= range.kuotaTotal;
                    return (
                      <div key={ri} className="flex gap-2.5 items-start">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${colors.dot} mt-1 flex-shrink-0`}
                        />
                        <div className="text-xs text-gray-700 leading-relaxed">
                          <span className={`font-bold ${colors.text}`}>
                            {range.kuotaTerisi} Kuota
                          </span>{" "}
                          telah terisi di{" "}
                          <span className="font-bold">{range.fungsi}</span>{" "}
                          dengan masa magang{" "}
                          <span className="font-semibold">{range.durasi}</span>
                          <span className="block text-gray-500 text-[0.73rem]">
                            {formatTanggal(range.mulai)} –{" "}
                            {formatTanggal(range.selesai)}
                            {isFull && (
                              <span className="ml-1.5 text-red-600 font-bold">
                                · Penuh
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-2.5 pt-2.5 border-t border-gray-200 flex flex-wrap gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-[0.7rem] text-gray-500">
                      Masa Magang Aktif
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-[0.7rem] text-gray-500">
                      Akan Magang
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[0.7rem] text-gray-500">
                      Selesai Magang
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    <span className="text-[0.7rem] text-gray-500">
                      Hari Ini
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Jika tidak ada pendaftar */}
            {internRanges.length === 0 && formasi && (
              <div className="mt-3.5 p-3.5 bg-green-50 rounded-xl border border-green-200 text-center">
                <div className="text-2xl mb-1.5">✅</div>
                <div className="text-sm font-bold text-green-700">
                  Kuota Tersedia
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
                  Belum ada peserta yang mendaftar di{" "}
                  <strong>{formasi.title}</strong>.<br />
                  Sisa kuota:{" "}
                  <strong className="text-green-700">
                    {formasi.sisaKuota}
                  </strong>{" "}
                  dari {formasi.kuota} tempat.
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="my-4 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

            {/* Footer */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setCurrentDate(new Date());
                  setSelectedDay(today.getDate());
                }}
                className="bg-none border-none text-sm font-semibold text-red-600 cursor-pointer px-3 py-2 rounded-lg hover:bg-red-50 transition-colors font-['DM_Sans']"
              >
                Hari Ini
              </button>

              <button
                onClick={onClose}
                className="bg-gradient-to-r from-red-600 to-red-800 border-none rounded-xl px-5 py-2 text-sm font-semibold text-white cursor-pointer shadow-lg shadow-red-600/30 hover:shadow-xl hover:-translate-y-0.5 transition-all font-['DM_Sans']"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Global styles for shimmer animation */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
      `}</style>
    </>
  );
}
