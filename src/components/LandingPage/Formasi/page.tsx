// components/landinpage/formasi/page.tsx
"use client";

import Link from "next/link";
import {
  HiOutlineOfficeBuilding,
  HiUsers,
  HiCalendar,
  HiCheckCircle,
  HiInformationCircle,
  HiRefresh,
} from "react-icons/hi";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  fetchFormasi,
  IFormasi,
  fetchPrediksi,
} from "@/services/formasiService";
import { FaUserCheck } from "react-icons/fa";
import CalendarPopup from "@/components/calendar/CalendarPopup";

// Fungsi untuk membuat slug yang konsisten (lowercase)
const createSlug = (title: string): string => {
  const slugMap: { [key: string]: string } = {
    "Fungsi Penindakan": "penindakan",
    "Fungsi Pengujian": "pengujian",
    "Fungsi Pemeriksaan (Inspeksi dan Sertifikasi)": "pemeriksaan",
    "Fungsi Informasi dan Komunikasi": "infokom",
    "Bagian Tata Usaha": "tata-usaha",
  };

  return slugMap[title] || title.toLowerCase().replace(/\s+/g, "-");
};

export default function Formasi() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [formasiList, setFormasiList] = useState<IFormasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediksi, setPrediksi] = useState<any>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedFormasi, setSelectedFormasi] = useState<IFormasi | null>(null);

  // Ref untuk menyimpan interval
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  function simulasiKuotaBulanan(formasi: IFormasi) {
    const kuota = formasi.kuota;

    const mulaiList = formasi.tanggalMulaiMagang || [];
    const selesaiList = formasi.tanggalSelesaiMagang || [];

    const hasil: {
      bulan: string;
      aktif: number;
      sisaKuota: number;
    }[] = [];

    const sekarang = new Date();

    for (let i = 0; i < 6; i++) {
      const bulanStart = new Date(
        sekarang.getFullYear(),
        sekarang.getMonth() + i,
        1,
      );

      const bulanEnd = new Date(
        sekarang.getFullYear(),
        sekarang.getMonth() + i + 1,
        0,
      );

      const aktif = mulaiList.reduce((acc, mulai, idx) => {
        const start = new Date(mulai);
        const end = new Date(selesaiList[idx]);

        const overlap = start <= bulanEnd && end >= bulanStart;

        return overlap ? acc + 1 : acc;
      }, 0);

      hasil.push({
        bulan: bulanStart.toLocaleDateString("id-ID", {
          month: "long",
          year: "numeric",
        }),
        aktif,
        sisaKuota: Math.max(0, kuota - aktif),
      });
    }

    return hasil;
  }

  function hitungPrediksiKuota(formasi: IFormasi) {
    const kuota = formasi.kuota;

    const mulaiList = formasi.tanggalMulaiMagang || [];
    const selesaiList = formasi.tanggalSelesaiMagang || [];

    const sekarang = new Date();

    const hasil: any[] = [];

    for (let i = 0; i < 6; i++) {
      const bulan = new Date(
        sekarang.getFullYear(),
        sekarang.getMonth() + i,
        1,
      );

      const aktif = mulaiList.reduce((total, mulai, idx) => {
        const start = new Date(mulai);
        const end = new Date(selesaiList[idx]);

        if (bulan >= start && bulan <= end) {
          return total + 1;
        }

        return total;
      }, 0);

      hasil.push({
        bulan: bulan.toLocaleDateString("id-ID", {
          month: "long",
          year: "numeric",
        }),
        aktif,
        sisaKuota: Math.max(0, kuota - aktif),
      });
    }

    return hasil;
  }

  // Fungsi untuk memuat data
  const loadFormasi = useCallback(async (isAutoRefresh = false) => {
    // Jika auto refresh, set status refreshing, bukan loading
    if (isAutoRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const formasiData = await fetchFormasi();

      setFormasiList(formasiData);
      setLastUpdated(new Date());

      // 🔥 hitung prediksi kuota otomatis
      const simulasi: Record<string, any> = {};

      formasiData.forEach((f: IFormasi) => {
        simulasi[f.title] = simulasiKuotaBulanan(f);
      });

      setPrediksi(simulasi);

      // 🔥 DATA TAMBAHAN FORMASI (tidak ditampilkan di UI)
      formasiData.forEach((f: IFormasi) => {});
      setError(null);
    } catch (err) {
      setError("Gagal memuat data");
    } finally {
      if (isAutoRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  // Setup auto refresh setiap 5 menit
  useEffect(() => {
    // Load data pertama kali
    loadFormasi();

    // Setup interval untuk refresh setiap 5 menit (300000 ms)
    intervalRef.current = setInterval(() => {
      loadFormasi(true);
    }, 300000); // 5 menit = 300000 ms

    // Cleanup interval saat komponen unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadFormasi]);

  // 🔥 ANIMASI HANYA SEKALI
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setVisible(true);
          setHasAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [hasAnimated]);

  // Handler untuk refresh manual
  const handleManualRefresh = () => {
    loadFormasi(true);
  };

  function getKuotaBulanIni(formasi: IFormasi) {
    const kuota = formasi.kuota;

    const mulaiList = formasi.tanggalMulaiMagang || [];
    const selesaiList = formasi.tanggalSelesaiMagang || [];

    const sekarang = new Date();

    const awalBulan = new Date(sekarang.getFullYear(), sekarang.getMonth(), 1);
    const akhirBulan = new Date(
      sekarang.getFullYear(),
      sekarang.getMonth() + 1,
      0,
    );

    const aktif = mulaiList.reduce((total, mulai, idx) => {
      const start = new Date(mulai);
      const end = new Date(selesaiList[idx]);

      const overlap = start <= akhirBulan && end >= awalBulan;

      return overlap ? total + 1 : total;
    }, 0);

    return {
      aktif,
      sisaKuota: Math.max(0, kuota - aktif),
    };
  }

  function getPendaftarBulanIni(formasi: IFormasi) {
    const mulaiList = formasi.tanggalMulaiMagang || [];
    const selesaiList = formasi.tanggalSelesaiMagang || [];

    const sekarang = new Date();

    const awalBulan = new Date(sekarang.getFullYear(), sekarang.getMonth(), 1);
    const akhirBulan = new Date(
      sekarang.getFullYear(),
      sekarang.getMonth() + 1,
      0,
    );

    const jumlah = mulaiList.reduce((total, mulai, idx) => {
      const start = new Date(mulai);
      const end = new Date(selesaiList[idx]);

      const overlap = start <= akhirBulan && end >= awalBulan;

      return overlap ? total + 1 : total;
    }, 0);

    return jumlah;
  }

  return (
    <section
      id="formasi"
      ref={sectionRef}
      className="w-full flex justify-center px-4 mt-13"
    >
      <div
        className={`
                max-w-6xl w-full
                px-8 lg:px-14 py-10
                transition-all duration-700 ease-out
                ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
              `}
      >
        {/* HEADER */}
        <div
          className={`
                  text-center mb-8
                  transition-all duration-700 delay-100
                  ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
                `}
        >
          <h2 className="text-3xl lg:text-4xl font-extrabold text-[#7F1D1D]">
            Formasi Magang
          </h2>
          <p className="text-gray-700 mt-3 max-w-2xl mx-auto">
            Berikut adalah daftar formasi magang yang tersedia di Balai Besar
            POM Palembang. Pilih formasi sesuai dengan jurusan dan minat Anda.
          </p>

          {/* Status Bar */}
          <div className="mt-4 flex items-center justify-center gap-4 text-sm">
            {lastUpdated && (
              <div className="text-gray-500">
                Terakhir diperbarui: {formatTime(lastUpdated)}
              </div>
            )}
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className={`
                      flex items-center gap-2 px-3 py-1 rounded-full
                      bg-white/80 hover:bg-white
                      text-[#7F1D1D] border border-[#7F1D1D]/20
                      transition-all duration-300
                      ${refreshing ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}
                    `}
            >
              <HiRefresh
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Memperbarui..." : "Refresh"}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg max-w-2xl mx-auto">
              <p className="text-yellow-800 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* LOADING STATE (hanya untuk loading pertama) */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-white/45 backdrop-blur-lg border border-white/60 rounded-3xl p-6 shadow-md animate-pulse"
              >
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded-xl mt-6"></div>
              </div>
            ))}
          </div>
        )}

        {/* FORMASI GRID */}
        {!loading && (
          <>
            {/* Overlay refreshing */}
            {refreshing && (
              <div className="fixed top-4 right-4 z-50">
                <div className="bg-white/90 backdrop-blur rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#7F1D1D]"></div>
                  <span className="text-sm text-gray-600">
                    Memperbarui data...
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {formasiList.map((item, i) => {
                const slug = createSlug(item.title);
                const kuotaBulanIni = getKuotaBulanIni(item);
                const isFull = kuotaBulanIni.sisaKuota === 0;

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
                    className={`
          relative group
          rounded-3xl
          overflow-hidden
          shadow-lg
          transition-all duration-500
          hover:-translate-y-3
          hover:shadow-2xl
          cursor-pointer
        `}
                  >
                    {/* Soft Gradient Glow */}
                    <div className="absolute inset-0 bg-linear-to-br from-red-200/20 to-transparent opacity-0 group-hover:opacity-100 transition duration-500" />

                    <div className="relative p-6">
                      {/* ================= HEADER ================= */}
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-[#7F1D1D]">
                          {item.title}
                        </h3>

                        <span
                          className={`text-xs px-3 py-1 rounded-full backdrop-blur-md font-semibold
                                ${
                                  isFull
                                    ? "bg-red-500/80 text-white"
                                    : kuotaBulanIni.sisaKuota <= 2
                                      ? "bg-yellow-400/80 text-black"
                                      : "bg-green-500/80 text-white"
                                }`}
                        >
                          {isFull
                            ? "Penuh"
                            : kuotaBulanIni.sisaKuota <= 2
                              ? "Hampir Penuh"
                              : "Tersedia"}
                        </span>
                      </div>

                      {/* Lokasi */}
                      <p className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <HiOutlineOfficeBuilding className="text-red-500" />
                        Balai Besar POM Palembang
                      </p>

                      {/* ================= SISA KUOTA ================= */}
                      <p className="text-xs text-gray-600 text-center mb-2 tracking-wide">
                        SISA KUOTA BULAN{" "}
                        {new Date()
                          .toLocaleDateString("id-ID", { month: "long" })
                          .toUpperCase()}
                      </p>

                      <div className="flex flex-col items-center justify-center my-4">
                        <p
                          className={`text-6xl font-extrabold tracking-tight ${
                            isFull
                              ? "text-red-500"
                              : kuotaBulanIni.sisaKuota <= 2
                                ? "text-yellow-500"
                                : "text-green-500"
                          }`}
                        >
                          {kuotaBulanIni.sisaKuota}
                        </p>

                        <p className="text-sm text-gray-500 mt-1">orang</p>
                      </div>

                      {/* ================= INFO ================= */}
                      <div className="text-sm text-gray-700 space-y-3 mb-4">
                        <div className="flex justify-between">
                          <span className="flex items-center gap-1">
                            <HiUsers className="text-yellow-500" />
                            Total Kuota
                          </span>
                          <span className="font-semibold">{item.kuota}</span>
                        </div>

                        <div className="flex justify-between">
                          <span className="flex items-center gap-1">
                            <FaUserCheck className="text-blue-500" />
                            Sudah Magang Bulan Ini
                          </span>
                          <span className="font-semibold">
                            {getPendaftarBulanIni(item)}
                          </span>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                        <div
                          className={`h-2 rounded-full ${
                            isFull
                              ? "bg-red-500"
                              : kuotaBulanIni.sisaKuota <= 2
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              (getPendaftarBulanIni(item) / item.kuota) * 100,
                            )}%`,
                          }}
                        />
                      </div>

                      {/* 🔥 PREDIKSI */}
                      {prediksi[item.title] && (
                        <div
                          className={`
                          mt-4
                          rounded-2xl
                          shadow-md
                          p-4
                          relative
                          overflow-hidden
                          ${
                            isFull
                              ? "bg-linear-to-br from-red-50 via-white to-red-100 border border-red-200"
                              : kuotaBulanIni.sisaKuota <= 2
                                ? "bg-linear-to-br from-yellow-50 via-white to-yellow-100 border border-yellow-200"
                                : "bg-linear-to-br from-green-50 via-white to-green-100 border border-green-200"
                          }
                        `}
                        >
                          {/* Accent Line */}
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-1 ${
                              isFull
                                ? "bg-linear-to-b from-red-500 to-red-700"
                                : kuotaBulanIni.sisaKuota <= 2
                                  ? "bg-linear-to-b from-yellow-400 to-yellow-600"
                                  : "bg-linear-to-b from-green-400 to-green-600"
                            }`}
                          />

                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div
                              className={`p-2 rounded-xl ${
                                isFull
                                  ? "bg-red-100"
                                  : kuotaBulanIni.sisaKuota <= 2
                                    ? "bg-yellow-100"
                                    : "bg-green-100"
                              }`}
                            >
                              <HiCalendar
                                className={`w-4 h-4 ${
                                  isFull
                                    ? "text-red-600"
                                    : kuotaBulanIni.sisaKuota <= 2
                                      ? "text-yellow-600"
                                      : "text-green-600"
                                }`}
                              />
                            </div>

                            {/* Content */}
                            <div className="flex-1 text-sm space-y-2">
                              <p className="font-bold text-[#7F1D1D]">
                                Prediksi Kuota
                              </p>

                              {prediksi[item.title]
                                ?.slice(0, 4)
                                .map((p: any, i: number) => {
                                  const totalKuota = item.kuota;
                                  const filled = p.aktif;
                                  const empty = p.sisaKuota;

                                  return (
                                    <div key={i} className="space-y-1 py-2">
                                      {/* Header */}
                                      <div className="flex justify-between items-center text-sm">
                                        <span className="font-medium text-gray-700">
                                          {p.bulan}
                                        </span>

                                        <span className="font-semibold text-green-600">
                                          {empty} Orang
                                        </span>
                                      </div>

                                      {/* Orang visual */}
                                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                        <div
                                          className={`h-2 rounded-full ${
                                            p.sisaKuota === 0
                                              ? "bg-red-500"
                                              : p.sisaKuota <= 2
                                                ? "bg-yellow-500"
                                                : "bg-green-500"
                                          }`}
                                          style={{
                                            width: `${Math.min(
                                              100,
                                              (p.aktif / item.kuota) * 100,
                                            )}%`,
                                          }}
                                        />
                                      </div>

                                      {/* Info */}
                                      <div className="text-xs text-gray-500">
                                        {filled} terisi • {empty} tersedia
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Auto-refresh indicator */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-400">
                Data diperbarui secara otomatis setiap 5 menit
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
