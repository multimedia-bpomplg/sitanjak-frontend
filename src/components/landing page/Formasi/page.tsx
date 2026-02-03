"use client";

import Link from "next/link";
import { HiBriefcase, HiUsers, HiAcademicCap } from "react-icons/hi";
import { useEffect, useRef, useState } from "react";

const formasiList = [
  {
    title: "Fungsi Penindakan",
    divisi: "Laboratorium Pengujian",
    kuota: "5 Orang",
    jurusan: "Hukum, dan lain-lain",
  },
  {
    title: "Fungsi Pengujian",
    divisi: "Tata Usaha",
    kuota: "5 Orang",
    jurusan: "Kimia, Fisika, dan lain-lain",
  },
  {
    title: "Fungsi Pemeriksaan (Inspeksi dan sertiffikasi )",
    divisi: "Sistem Informasi",
    kuota: "5 Orang",
    jurusan: "Sistem Informasi,Sistem Komputer, dan lain-lain",
  },
  {
    title: "Fungsi Informasi dan Komunikasi",
    divisi: "Informasi & Komunikasi",
    kuota: "5 Orang",
    jurusan: "Ilmu Komunikasi, dan lain-lain",
  },
  {
    title: "Bagian tata Usaha",
    divisi: "Informasi & Komunikasi",
    kuota: "5 Orang",
    jurusan: "Administrasi, Akuntansi, dan lian-lain",
  },
];

export default function Formasi() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  // 🔥 ANIMASI HANYA SEKALI
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setVisible(true);
          setHasAnimated(true);
          observer.disconnect(); // ⛔ STOP → ringan
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
        </div>

        {/* FORMASI GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {formasiList.map((item, i) => (
            <div
              key={i}
              style={{ transitionDelay: `${i * 120}ms` }}
              className={`
                bg-white/45 backdrop-blur-lg
                border border-white/60
                rounded-3xl p-6
                shadow-md
                transition-all duration-700 ease-out
                ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
                hover:shadow-xl hover:-translate-y-1
              `}
            >
              <h3 className="text-xl font-bold text-[#7F1D1D] mb-3">
                {item.title}
              </h3>

              <div className="space-y-2 text-gray-700 text-sm">
                <p className="flex items-center gap-2">
                  <HiBriefcase className="text-[#B91C1C]" />
                  <span>
                    <b>Divisi:</b> {item.divisi}
                  </span>
                </p>

                <p className="flex items-center gap-2">
                  <HiUsers className="text-[#FACC15]" />
                  <span>
                    <b>Kuota:</b> {item.kuota}
                  </span>
                </p>

                <p className="flex items-center gap-2">
                  <HiAcademicCap className="text-[#7F1D1D]" />
                  <span>
                    <b>Jurusan:</b> {item.jurusan}
                  </span>
                </p>
              </div>

              <Link
                href="/pendaftaran"
                className="
                  mt-6 inline-flex items-center justify-center w-full
                  py-2.5 rounded-xl font-semibold text-[#7F1D1D]
                  bg-linear-to-r from-[#FACC15] to-[#EAB308]
                  hover:opacity-90 transition
                "
              >
                Daftar Formasi
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
