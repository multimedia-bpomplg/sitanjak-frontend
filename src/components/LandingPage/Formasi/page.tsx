// components/landinpage/formasi/page.tsx
"use client";

import Link from "next/link";
import {
  HiOutlineOfficeBuilding,
  HiUsers,
  HiAcademicCap,
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

const JURUSAN_BY_TITLE: Record<string, string[]> = {
  "Fungsi Penindakan": [
    "Ilmu Hukum",
    "Hukum Pidana",
    "Kriminologi",
    "Hukum Administrasi Negara",
  ],
  "Fungsi Pengujian": [
    "Kimia",
    "Farmasi",
    "Biologi",
  ],
  "Fungsi Pemeriksaan (Inspeksi dan sertifikasi)": [
    "Farmasi",
    "Teknik Informatika",
    "Hukum",
    "Kesehatan Masyarakat",
  ],
  "Fungsi Informasi dan Komunikasi": [
    "Kesehatan Masyarakat",
    "Hukum",
    "Sistem Informasi",
  ],
  "Bagian Tata Usaha": [
    "Administrasi",
    "Akuntansi",
    "Teknik Informatika",
    "Perkantoran"
  ],
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

  // Fungsi untuk memuat data
  const loadFormasi = useCallback(async (isAutoRefresh = false) => {
    // Jika auto refresh, set status refreshing, bukan loading
    if (isAutoRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [formasiData, prediksiData] = await Promise.all([
        fetchFormasi(),
        fetchPrediksi(),
      ]);

      setFormasiList(formasiData);
      setPrediksi(prediksiData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error(err);
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
      console.log("Auto-refreshing formasi data...");
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
                const isFull = item.sisaKuota === 0;

                const jurusanList = JURUSAN_BY_TITLE[item.title] || [];

                return (
                  <div
                    key={item._id}
                    className={`
                      relative group
                      rounded-3xl
                      overflow-hidden
                      shadow-lg
                      transition-all duration-500
                      hover:-translate-y-3
                      hover:shadow-2xl
                      ${
                        isFull
                          ? "bg-linear-to-br from-red-100 via-white to-red-50"
                          : item.sisaKuota <= 2
                            ? "bg-linear-to-br from-yellow-100 via-white to-orange-50"
                            : "bg-linear-to-br from-green-100 via-white to-emerald-50"
                      }
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
                              : item.sisaKuota <= 2
                                ? "bg-yellow-400/80 text-black"
                                : "bg-green-500/80 text-white"
                          }`}
                        >
                          {isFull
                            ? "Penuh"
                            : item.sisaKuota <= 2
                              ? "Hampir Penuh"
                              : "Tersedia"}
                        </span>
                      </div>

                      {/* Lokasi */}
                      <p className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <HiOutlineOfficeBuilding className="text-red-500" />
                        Balai Besar POM Palembang
                      </p>

                      {/* ================= JURUSAN ================= */}
                      <div className="mb-5">
                        <p className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <HiAcademicCap className="text-[#7F1D1D]" />
                          Jurusan yang Diterima
                        </p>

                        {jurusanList.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {jurusanList.map((jur, idx) => (
                              <span
                                key={idx}
                                className="
                                  text-xs
                                  px-3 py-1
                                  rounded-full
                                  bg-blue-30
                                  text-blue-700
                                  border border-blue-400
                                  hover:bg-blue-200
                                  transition
                                "
                              >
                                {jur}
                              </span>
                            ))}

                            <span
                              className="
                                text-xs
                                px-3 py-1
                                rounded-full
                                bg-blue-400
                                text-white
                              "
                            >
                              Lainnya
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            Semua jurusan diperbolehkan
                          </span>
                        )}
                      </div>

                      {/* ================= SISA KUOTA ================= */}
                      <div className="text-center py-6 bg-white/30 rounded-2xl mb-6">
                        <p className="text-xs text-gray-600 mb-2 tracking-wide">
                          SISA KUOTA
                        </p>

                        <p
                          className={`text-5xl font-extrabold ${
                            isFull
                              ? "text-red-500"
                              : item.sisaKuota <= 2
                                ? "text-yellow-500"
                                : "text-green-500"
                          }`}
                        >
                          {item.sisaKuota}
                        </p>

                        <p className="text-sm text-gray-600">orang</p>
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
                            Sudah Mendaftar
                          </span>
                          <span className="font-semibold">
                            {item.jumlahPendaftar}
                          </span>
                        </div>

                        {/* 🔥 PREDIKSI */}
                        {isFull && prediksi[item.title] && (
                          <div className="mt-2 p-2 rounded-xl bg-white/60 border text-xs text-gray-700">
                            <p className="font-semibold text-[#7F1D1D]">
                              Prediksi Kuota
                            </p>

                            <p>
                              Akan tersedia{" "}
                              <b>{prediksi[item.title].slotAkanKosong}</b> slot
                            </p>

                            <p>
                              Mulai{" "}
                              <b>
                                {formatDate(prediksi[item.title].tersediaMulai)}
                              </b>
                            </p>

                            {/* Tampilkan waktu update untuk prediksi */}
                            {lastUpdated && (
                              <p className="text-[10px] text-gray-400 mt-1">
                                Update: {formatTime(lastUpdated)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Progress */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                        <div
                          className={`h-2 rounded-full ${
                            isFull
                              ? "bg-red-500"
                              : item.sisaKuota <= 2
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              (item.jumlahPendaftar / item.kuota) * 100,
                            )}%`,
                          }}
                        />
                      </div>
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
    </section>
  );
}
