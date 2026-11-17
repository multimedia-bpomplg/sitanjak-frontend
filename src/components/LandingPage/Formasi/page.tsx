// components/LandingPage/Formasi/page.tsx
"use client";

const plusJakarta = { className: "font-sans" };
import {
  HiOutlineOfficeBuilding,
  HiOutlineUsers,
  HiOutlineCalendar,
  HiOutlineRefresh,
  HiOutlineBeaker,
  HiOutlineShieldCheck,
  HiOutlineSearchCircle,
  HiOutlineSpeakerphone,
  HiOutlineClipboardList,
  HiArrowRight,
  HiOutlineCheckCircle,
} from "react-icons/hi";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  fetchFormasi,
  IFormasi,
  hitungKuotaBulan,
  simulasiKuotaBulanan,
  SimulasiKuotaBulanItem,
} from "@/services/formasiService";
import CalendarPopup from "@/components/calendar/CalendarPopup";



// Fungsi untuk mendapatkan ikon sesuai nama formasi
const getFormasiIcon = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes("pengujian")) return HiOutlineBeaker;
  if (lower.includes("pemeriksaan") || lower.includes("inspeksi"))
    return HiOutlineShieldCheck;
  if (lower.includes("penindakan")) return HiOutlineSearchCircle;
  if (lower.includes("informasi") || lower.includes("komunikasi"))
    return HiOutlineSpeakerphone;
  if (lower.includes("tata usaha")) return HiOutlineClipboardList;
  return HiOutlineOfficeBuilding;
};

export default function Formasi() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [formasiList, setFormasiList] = useState<IFormasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediksi, setPrediksi] = useState<
    Record<string, SimulasiKuotaBulanItem[]>
  >({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedFormasi, setSelectedFormasi] = useState<IFormasi | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const loadFormasi = useCallback(async (isAutoRefresh = false) => {
    if (isAutoRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const formasiData = await fetchFormasi();

      setFormasiList(formasiData);
      setLastUpdated(new Date());

      const simulasi: Record<string, SimulasiKuotaBulanItem[]> = {};
      formasiData.forEach((f: IFormasi) => {
        simulasi[f.title] = simulasiKuotaBulanan(f, 6);
      });

      setPrediksi(simulasi);
      setError(null);
    } catch {
      setError("Gagal memuat data formasi. Silakan coba muat ulang.");
    } finally {
      if (isAutoRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadFormasi();

    intervalRef.current = setInterval(() => {
      loadFormasi(true);
    }, 300000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadFormasi]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setVisible(true);
          setHasAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [hasAnimated]);

  const handleManualRefresh = () => {
    loadFormasi(true);
  };

  // Hitung statistik ringkasan atas
  const totalBidang = formasiList.length;
  const totalDayaTampung = formasiList.reduce(
    (sum, item) => sum + hitungKuotaBulan(item).kuotaBulan,
    0,
  );
  const totalSisaBulanIni = formasiList.reduce(
    (sum, item) => sum + hitungKuotaBulan(item).sisa,
    0,
  );

  const namaBulanIni = new Date().toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  return (
    <section
      id="formasi"
      ref={sectionRef}
      className={`${plusJakarta.className} relative w-full bg-[#F8FAFC] py-16 lg:py-24 overflow-hidden`}
    >
      {/* Ornamen Latar Halus */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full bg-linear-to-b from-[#E0F2FE]/60 to-transparent blur-3xl"
      />

      <div
        className={`
          relative z-10 max-w-7xl mx-auto w-full px-6 lg:px-12
          transition-all duration-700 ease-out
          ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
        `}
      >
        {/* ================= SPLIT HEADER ================= */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-[2px] bg-[#0088FF] rounded-full" />
              <span className="text-xs font-bold tracking-[0.18em] text-[#0088FF] uppercase">
                KUOTA & BIDANG MAGANG
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl xl:text-[42px] font-extrabold text-[#0B1B3D] leading-[1.18] tracking-[-0.02em]">
              Formasi Magang{" "}
              <span className="text-[#0088FF]">BBPOM di Palembang</span>
            </h2>

            <p className="text-[#475569] text-sm sm:text-base leading-relaxed">
              Pantau ketersediaan kuota secara <i>real-time</i> dan pilih bidang
              formasi yang sesuai dengan latar belakang jurusan serta minat
              karier Anda.
            </p>
          </div>

          {/* Live Status & Tombol Refresh */}
          <div className="flex flex-wrap items-center gap-3 self-start lg:self-end">
            <div className="flex items-center gap-2.5 bg-white border border-slate-200/80 px-4 py-2 rounded-full shadow-xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-[#475569]">
                {lastUpdated
                  ? `Diperbarui ${formatTime(lastUpdated)}`
                  : "Memuat data..."}
              </span>
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-full
                bg-white hover:bg-[#F0F7FF]
                text-[#0B1B3D] hover:text-[#0088FF]
                border border-slate-200/90 hover:border-[#0088FF]/40
                text-xs font-bold shadow-xs
                transition-all duration-200
                ${refreshing ? "opacity-60 cursor-not-allowed" : ""}
              `}
            >
              <HiOutlineRefresh
                className={`w-4 h-4 text-[#0088FF] ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              <span>{refreshing ? "Memperbarui..." : "Refresh Kuota"}</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
            <p className="text-amber-800 text-sm font-medium">{error}</p>
            <button
              onClick={handleManualRefresh}
              className="text-xs font-bold text-amber-900 underline"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* ================= SUMMARY STRIP (3 MINI CARDS) ================= */}
        {!loading && formasiList.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF5FF] text-[#0088FF] flex items-center justify-center shrink-0">
                <HiOutlineOfficeBuilding className="text-2xl" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Total Bidang Formasi
                </p>
                <p className="text-2xl font-extrabold text-[#0B1B3D] mt-0.5">
                  {totalBidang}{" "}
                  <span className="text-sm font-medium text-[#64748B]">
                    Fungsi / Bagian
                  </span>
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF5FF] text-[#0088FF] flex items-center justify-center shrink-0">
                <HiOutlineUsers className="text-2xl" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Total Daya Tampung
                </p>
                <p className="text-2xl font-extrabold text-[#0B1B3D] mt-0.5">
                  {totalDayaTampung}{" "}
                  <span className="text-sm font-medium text-[#64748B]">
                    Peserta / Bulan
                  </span>
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <HiOutlineCheckCircle className="text-2xl" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Tersedia ({namaBulanIni})
                </p>
                <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">
                  {totalSisaBulanIni}{" "}
                  <span className="text-sm font-medium text-[#64748B]">
                    Kursi Kosong
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= LOADING SKELETON ================= */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-xs animate-pulse space-y-5"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-slate-200 rounded-2xl" />
                  <div className="w-24 h-6 bg-slate-200 rounded-full" />
                </div>
                <div className="h-6 bg-slate-200 rounded-lg w-3/4" />
                <div className="h-24 bg-slate-100 rounded-2xl w-full" />
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="h-14 bg-slate-100 rounded-xl" />
                  <div className="h-14 bg-slate-100 rounded-xl" />
                  <div className="h-14 bg-slate-100 rounded-xl" />
                  <div className="h-14 bg-slate-100 rounded-xl" />
                </div>
                <div className="h-11 bg-slate-200 rounded-xl w-full" />
              </div>
            ))}
          </div>
        )}

        {/* ================= FORMASI CARDS GRID ================= */}
        {!loading && (
          <>
            {/* Toast Indikator Refreshing */}
            {refreshing && (
              <div className="fixed top-24 right-6 z-50">
                <div className="bg-white border border-slate-200 rounded-full px-4 py-2 shadow-lg flex items-center gap-2.5">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#0088FF] border-t-transparent" />
                  <span className="text-xs font-bold text-[#0B1B3D]">
                    Memperbarui kuota...
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {formasiList.map((item) => {
                const IconComponent = getFormasiIcon(item.title);
                const kuotaBulanIni = hitungKuotaBulan(item);
                const terisiBulanIni = kuotaBulanIni.aktif;
                const kuotaEfektifBulanIni = kuotaBulanIni.kuotaBulan;
                const isFull = kuotaBulanIni.sisa === 0;
                const isAlmostFull = !isFull && kuotaBulanIni.sisa <= 2;
                const fillPercentage = Math.min(
                  100,
                  kuotaEfektifBulanIni > 0
                    ? (terisiBulanIni / kuotaEfektifBulanIni) * 100
                    : 0,
                );

                return (
                  <div
                    key={item._id}
                    onClick={() => {
                      setSelectedFormasi({
                        ...item,
                        statusMagang: item.statusMagang || [],
                        tanggalMulaiMagang: item.tanggalMulaiMagang || [],
                        tanggalSelesaiMagang: item.tanggalSelesaiMagang || [],
                      });
                      setCalendarOpen(true);
                    }}
                    className="
                      group relative
                      bg-white rounded-3xl
                      border border-slate-200/85
                      hover:border-[#0088FF]/50
                      p-6 flex flex-col justify-between
                      shadow-[0_4px_20px_rgba(11,27,61,0.04)]
                      hover:shadow-[0_18px_40px_rgba(0,136,255,0.12)]
                      hover:-translate-y-1.5
                      transition-all duration-300
                      cursor-pointer
                    "
                  >
                    <div>
                      {/* 1. TOP BAR: IKON & STATUS BADGE */}
                      <div className="flex items-center justify-between gap-3 mb-5">
                        <div className="w-12 h-12 rounded-2xl bg-[#EBF5FF] text-[#0088FF] group-hover:bg-[#0088FF] group-hover:text-white flex items-center justify-center transition-colors duration-300 shadow-xs">
                          <IconComponent className="text-2xl" />
                        </div>

                        <span
                          className={`
                            inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full border
                            ${
                              isFull
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : isAlmostFull
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }
                          `}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isFull
                                ? "bg-rose-500"
                                : isAlmostFull
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                            }`}
                          />
                          {isFull
                            ? "Kuota Penuh"
                            : isAlmostFull
                              ? "Hampir Penuh"
                              : "Tersedia"}
                        </span>
                      </div>

                      {/* NAMA FORMASI & LOKASI */}
                      <div className="mb-5">
                        <h3 className="text-lg font-extrabold text-[#0B1B3D] group-hover:text-[#0088FF] transition-colors leading-snug line-clamp-2 min-h-[50px]">
                          {item.title}
                        </h3>
                        <p className="flex items-center gap-1.5 text-xs font-medium text-[#64748B] mt-1">
                          <HiOutlineOfficeBuilding className="text-[#0088FF] text-sm shrink-0" />
                          <span>Balai Besar POM di Palembang</span>
                        </p>
                      </div>

                      {/* 2. PANEL UTAMA KUOTA BULAN INI */}
                      <div className="bg-[#F8FAFC] border border-slate-200/70 rounded-2xl p-4 mb-5">
                        <div className="flex items-end justify-between mb-3">
                          <div>
                            <p className="text-[11px] font-bold tracking-wider text-[#64748B] uppercase">
                              Sisa Kuota Bulan Ini
                            </p>
                            <div className="flex items-baseline gap-1.5 mt-1">
                              <span
                                className={`text-4xl font-extrabold tracking-tight leading-none ${
                                  isFull
                                    ? "text-rose-600"
                                    : isAlmostFull
                                      ? "text-amber-600"
                                      : "text-[#0B1B3D]"
                                }`}
                              >
                                {kuotaBulanIni.sisa}
                              </span>
                              <span className="text-xs font-semibold text-[#64748B]">
                                kursi tersedia
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-[11px] font-semibold text-[#64748B]">
                              Terisi / Total
                            </p>
                            <p className="text-sm font-extrabold text-[#0B1B3D] mt-0.5">
                              {terisiBulanIni}{" "}
                              <span className="text-[#94A3B8] font-normal">
                                /
                              </span>{" "}
                              {kuotaEfektifBulanIni}
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isFull
                                ? "bg-rose-500"
                                : isAlmostFull
                                  ? "bg-amber-500"
                                  : "bg-[#0088FF]"
                            }`}
                            style={{ width: `${fillPercentage}%` }}
                          />
                        </div>
                      </div>

                      {/* 3. PREDIKSI KUOTA 4 BULAN (COMPACT 2x2 MINI-GRID) */}
                      {prediksi[item.title] && (
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-[#0B1B3D]">
                              <HiOutlineCalendar className="text-[#0088FF] text-sm" />
                              Estimasi Kuota 4 Bulan Ke Depan
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {prediksi[item.title]
                              .slice(0, 4)
                              .map((p: any, idx: number) => {
                                const empty = p.sisaKuota;
                                const pFull = empty === 0;
                                const pWarn = !pFull && empty <= 2;

                                return (
                                  <div
                                    key={idx}
                                    className="bg-white border border-slate-200/80 rounded-xl px-3 py-2 flex items-center justify-between"
                                  >
                                    <span className="text-[11.5px] font-semibold text-[#475569] truncate">
                                      {p.bulanSingkat || p.bulan}
                                    </span>

                                    <span
                                      className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md shrink-0 ${
                                        pFull
                                          ? "bg-rose-50 text-rose-600"
                                          : pWarn
                                            ? "bg-amber-50 text-amber-600"
                                            : "bg-[#EBF5FF] text-[#0088FF]"
                                      }`}
                                    >
                                      {pFull ? "Penuh" : `${empty} Kursi`}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 4. CARD FOOTER: TOMBOL BUKA KALENDER */}
                    <div className="pt-3 border-t border-slate-100">
                      <div
                        className="
                          w-full py-2.5 px-4 rounded-xl
                          bg-[#F0F7FF] group-hover:bg-[#0088FF]
                          text-[#0088FF] group-hover:text-white
                          font-bold text-xs sm:text-sm
                          flex items-center justify-center gap-2
                          transition-colors duration-300
                        "
                      >
                        <HiOutlineCalendar className="text-base" />
                        <span>Lihat Kalender & Detail Jadwal</span>
                        <HiArrowRight className="text-sm group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Catatan Auto-refresh */}
            <div className="mt-10 text-center">
              <p className="text-xs font-medium text-[#64748B]">
                Klik pada salah satu kartu formasi untuk melihat detail kalender
                tanggal ketersediaan • Data diperbarui otomatis setiap 5 menit
              </p>
            </div>
          </>
        )}
      </div>

      <CalendarPopup
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        formasi={selectedFormasi}
      />
    </section>
  );
}
