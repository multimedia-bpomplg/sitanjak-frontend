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
                  style={{ transitionDelay: `${i * 120}ms` }}
                  className={`
                    group relative
                    bg-white/45 backdrop-blur-lg
                    border ${isFull ? "border-red-200" : "border-white/60"}
                    rounded-3xl p-6
                    shadow-md
                    transition-all duration-700 ease-out
                    ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
                    ${isFull ? "" : "hover:shadow-xl hover:-translate-y-1 cursor-pointer"}
                  `}
                >
                  {/* LINK KE HALAMAN DETAIL - Seluruh card bisa diklik */}
                  <Link
                    href={`/Detail-Formasi/${slug}`}
                    className="absolute inset-0 z-10"
                    aria-label={`Lihat detail ${item.title}`}
                    onClick={(e) => {
                      if (isFull) {
                        e.preventDefault();
                      }
                    }}
                  />

                  {/* LABEL PENUH */}
                  {isFull && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                      <span className="bg-red-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                        KUOTA PENUH
                      </span>
                    </div>
                  )}

                  {/* HOVER EFFECT INDICATOR */}
                  {!isFull && (
                    <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <HiInformationCircle className="text-[#FACC15] text-xl" />
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-[#7F1D1D] mb-3 pr-8">
                    {item.title}
                  </h3>

                  <div className="space-y-3 text-gray-700 text-sm">
                    <p className="flex items-center gap-2">
                      <HiOutlineOfficeBuilding className="text-[#B91C1C] shrink-0" />
                      <span>
                        <b>Balai Besar POM di Palembang</b>
                      </span>
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HiUsers className="text-[#FACC15] shrink-0" />
                        <span>
                          <b>Kuota:</b> {item.kuota} orang
                        </span>
                      </div>
                      <div
                        className={`flex items-center gap-2 ${isFull ? "text-red-600" : "text-green-600"}`}
                      >
                        <FaUserCheck />
                        <span className="font-semibold">
                          {isFull ? "Penuh" : `${item.sisaKuota} tersedia`}
                        </span>
                      </div>
                    </div>

                    {/* PROGRESS BAR */}
                    <div className="pt-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Pendaftar: {item.jumlahPendaftar} orang</span>
                        <span>
                          {Math.round(
                            (item.jumlahPendaftar / item.kuota) * 100,
                          )}
                          % terisi
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${isFull ? "bg-red-500" : "bg-green-500"}`}
                          style={{
                            width: `${Math.min(100, (item.jumlahPendaftar / item.kuota) * 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* INFO PESERTA */}
                    <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-2 rounded-lg">
                      <HiCheckCircle />
                      <span className="text-sm">
                        <b>{item.jumlahPendaftar} orang</b> telah mendaftar
                      </span>
                    </div>

                    {/* JURUSAN YANG DITERIMA */}
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">
                        Jurusan yang diterima:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {item.jurusan.slice(0, 3).map((jur, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-gray-100 px-2 py-1 rounded-full"
                          >
                            {jur}
                          </span>
                        ))}
                        {item.jurusan.length > 3 && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                            +{item.jurusan.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* VIEW DETAILS BUTTON (tetap ada untuk UX yang lebih baik) */}
                  {!isFull && (
                    <div className="mt-4 text-center relative z-20 pointer-events-none">
                      <span className="inline-block text-sm text-[#7F1D1D] font-semibold group-hover:underline">
                        Lihat Detail Formasi →
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
