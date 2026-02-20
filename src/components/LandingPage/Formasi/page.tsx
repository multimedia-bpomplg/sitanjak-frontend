// components/landinpage/formasi/page.tsx
"use client";

import Link from "next/link";
import {
  HiOutlineOfficeBuilding,
  HiUsers,
  HiAcademicCap,
  HiCheckCircle,
  HiInformationCircle,
} from "react-icons/hi";
import { useEffect, useRef, useState } from "react";
import { fetchFormasi, IFormasi } from "@/services/formasiService";
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

export default function Formasi() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [formasiList, setFormasiList] = useState<IFormasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data formasi dari API
  useEffect(() => {
    const loadFormasi = async () => {
      try {
        setLoading(true);
        const data = await fetchFormasi();
        setFormasiList(data);
        setError(null);
      } catch (err) {
        console.error("Error loading formasi:", err);
        setError("Gagal memuat data formasi. Silakan coba lagi.");

        // Fallback data jika API error
        setFormasiList([
          {
            _id: "1",
            title: "Fungsi Penindakan",
            divisi: "Laboratorium Pengujian",
            kuota: 5,
            jurusan: ["Hukum", "Ilmu Hukum", "Kesehatan Masyarakat"],
            kode: "FUN-PEN",
            jumlahPendaftar: 4,
            sisaKuota: 1,
          },
          {
            _id: "2",
            title: "Fungsi Pengujian",
            divisi: "Tata Usaha",
            kuota: 5,
            jurusan: ["Kimia", "Fisika", "Farmasi", "Analis Kesehatan"],
            kode: "FUN-PEN-UJI",
            jumlahPendaftar: 3,
            sisaKuota: 2,
          },
          {
            _id: "3",
            title: "Fungsi Pemeriksaan (Inspeksi dan Sertifikasi)",
            divisi: "Sistem Informasi",
            kuota: 5,
            jurusan: [
              "Sistem Informasi",
              "Sistem Komputer",
              "Teknik Informatika",
            ],
            kode: "FUN-PEM",
            jumlahPendaftar: 5,
            sisaKuota: 0,
          },
          {
            _id: "4",
            title: "Fungsi Informasi dan Komunikasi",
            divisi: "Informasi & Komunikasi",
            kuota: 5,
            jurusan: ["Ilmu Komunikasi", "Jurnalistik", "Public Relations"],
            kode: "FUN-INFO",
            jumlahPendaftar: 2,
            sisaKuota: 3,
          },
          {
            _id: "5",
            title: "Bagian Tata Usaha",
            divisi: "Administrasi",
            kuota: 5,
            jurusan: ["Administrasi", "Akuntansi", "Manajemen"],
            kode: "BAG-TU",
            jumlahPendaftar: 1,
            sisaKuota: 4,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadFormasi();
  }, []);

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
          {error && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg max-w-2xl mx-auto">
              <p className="text-yellow-800 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* LOADING STATE */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {formasiList.map((item, i) => {
              const slug = createSlug(item.title);
              const isFull = item.sisaKuota === 0;

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

                    {/* Jurusan */}
                    {/* <div className="mb-6">
                      <p className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <HiAcademicCap className="text-blue-500" />
                        Jurusan yang diterima
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {item.jurusan.map((jur, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-white/60 backdrop-blur px-3 py-1 rounded-full shadow-sm"
                          >
                            {jur}
                          </span>
                        ))}
                      </div>
                    </div> */}

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
                        <span className="font-semibold">{item.jumlahPendaftar}</span>
                      </div>
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
                            (item.jumlahPendaftar / item.kuota) * 100
                          )}%`,
                        }}
                      />
                    </div>

                    {/* ================= CTA ================= */}
                    <Link
                      href={`/Detail-Formasi/${slug}`}
                      className={`
                        block text-center py-3 rounded-xl font-bold
                        transition-all duration-300
                        shadow-lg
                        hover:scale-[1.04]
                        hover:shadow-xl
                        ${
                          isFull
                            ? "bg-linear-to-r from-red-500 via-pink-500 to-red-600 text-white hover:shadow-[0_10px_25px_rgba(239,68,68,0.4)]"
                            : item.sisaKuota <= 2
                            ? "bg-linear-to-r from-yellow-400 via-orange-400 to-yellow-500 text-white hover:shadow-[0_10px_25px_rgba(234,179,8,0.4)]"
                            : "bg-linear-to-r from-emerald-500 via-green-500 to-teal-500 text-white hover:shadow-[0_10px_25px_rgba(16,185,129,0.4)]"
                        }
                      `}
                    >
                      Lihat Detail Formasi
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
