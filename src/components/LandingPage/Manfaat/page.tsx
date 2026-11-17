"use client";

import Image from "next/image";
import Link from "next/link";
import { plusJakarta, caveat } from '@/lib/font';
import {
  HiOutlineBriefcase,
  HiOutlineAcademicCap,
  HiOutlineBadgeCheck,
  HiOutlineUserGroup,
  HiOutlineTrendingUp,
  HiOutlineSparkles,
  HiOutlineCheckCircle,
  HiArrowRight,
} from "react-icons/hi";
import { useEffect, useRef, useState } from "react";



const manfaatList = [
  {
    title: "Pengalaman Kerja Nyata",
    desc: "Terlibat langsung dalam ekosistem kerja profesional pengawasan Obat dan Makanan sesuai bidang kompetensi.",
    icon: HiOutlineBriefcase,
  },
  {
    title: "Pengembangan Kompetensi",
    desc: "Mengasah kemampuan teknis laboratorium maupun manajerial serta soft skill standar instansi pemerintah.",
    icon: HiOutlineAcademicCap,
  },
  {
    title: "Sertifikat & Surat Resmi",
    desc: "Memperoleh surat keterangan selesai magang resmi dari BBPOM di Palembang sebagai portofolio kredibel.",
    icon: HiOutlineBadgeCheck,
  },
  {
    title: "Bimbingan Mentor Ahli",
    desc: "Didampingi langsung oleh Pengawas Farmasi dan Makanan (PFM) serta praktisi berpengalaman.",
    icon: HiOutlineUserGroup,
  },
  {
    title: "Peningkatan Daya Saing",
    desc: "Menjadi nilai tambah unggul pada CV untuk menghadapi seleksi dunia kerja maupun studi lanjut.",
    icon: HiOutlineTrendingUp,
  },
  {
    title: "Jejaring Profesional",
    desc: "Memperluas relasi dengan aparatur profesional dan rekan mahasiswa/pelajar dari berbagai institusi.",
    icon: HiOutlineSparkles,
  },
];

export default function Manfaat() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setVisible(true);
          setHasAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [hasAnimated]);

  return (
    <section
      id="manfaat"
      ref={sectionRef}
      className={`${plusJakarta.className} relative w-full bg-[#F8FAFC] py-16 lg:py-24 overflow-hidden`}
    >
      {/* Ornamen Latar Halus */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-12 -left-24 w-80 h-80 rounded-full bg-[#E0F2FE]/70 blur-3xl"
      />

      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-10">
          {/* ================= KOLOM KIRI: VISUAL KARAKTER & FLOATING BADGES ================= */}
          <div
            className={`
              w-full lg:w-[44%] flex flex-col gap-6
              transition-all duration-700 ease-out
              ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}
            `}
          >
            {/* Header Kiri (Tampil Rapat di Atas Karakter) */}
            <div className="space-y-3 text-center lg:text-left">
              <div className="inline-flex items-center gap-3">
                <span className="w-8 h-[2px] bg-[#0088FF] rounded-full" />
                <span className="text-xs font-bold tracking-[0.18em] text-[#0088FF] uppercase">
                  KEUNGGULAN PROGRAM
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl xl:text-[42px] font-extrabold text-[#0B1B3D] leading-[1.16] tracking-[-0.02em]">
                Manfaat Magang di{" "}
                <span className="text-[#0088FF]">BBPOM Palembang</span>
              </h2>

              <p className="text-[#475569] text-sm sm:text-base leading-relaxed max-w-lg mx-auto lg:mx-0">
                Program magang dirancang untuk memberikan dampak nyata bagi
                perkembangan keahlian, kesiapan karier, dan wawasan profesional
                Anda.
              </p>
            </div>

            {/* Platform Visual Karakter */}
            <div className="relative w-full max-w-[480px] mx-auto lg:mx-0">
              {/* Background Arch / Card Biru Muda */}
              <div className="relative overflow-hidden rounded-[36px] bg-linear-to-br from-[#D4EEFF] via-[#E5F4FF] to-[#C6E6FF] pt-8 px-4 border border-white shadow-[0_20px_50px_rgba(0,136,255,0.12)]">
                {/* Dekorasi Lingkaran Concentric di Belakang Karakter */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-12 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full border border-white/60 bg-white/25"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-24 left-1/2 -translate-x-1/2 w-52 h-52 rounded-full bg-[#0088FF]/10 blur-xl"
                />

                {/* Aksen Ornamen Kelopak Kecil */}
                <div
                  aria-hidden="true"
                  className="absolute top-7 left-7 w-7 h-7 rounded-full rounded-bl-sm bg-[#0088FF] -rotate-12"
                />
                <div
                  aria-hidden="true"
                  className="absolute top-14 right-8 w-5 h-5 rounded-tl-full rounded-br-full bg-[#F59E0B] rotate-12"
                />

                {/* Gambar Karakter (Menunjuk ke Kanan) */}
                <div className="relative z-10 flex items-end justify-center -mx-2">
                  <Image
                    src="/images/assets-new/karakter-manfaat.png"
                    alt="Manfaat Program Magang BBPOM Palembang"
                    width={580}
                    height={520}
                    className="w-full h-auto object-contain object-bottom drop-shadow-[0_14px_24px_rgba(11,27,61,0.14)] scale-105 origin-bottom"
                  />
                </div>
              </div>

              {/* Floating Badge Kiri Bawah */}
              <div className="hidden sm:flex absolute -bottom-5 left-5 z-20 bg-white rounded-2xl px-4 py-3 shadow-[0_12px_30px_rgba(11,27,61,0.12)] border border-slate-100 items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <HiOutlineCheckCircle className="text-2xl" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-[#0B1B3D]">
                    100% Praktik Terarah
                  </p>
                  <p className="text-[11px] text-[#64748B]">
                    Kurikulum magang terstruktur
                  </p>
                </div>
              </div>

              {/* Floating CTA Pill Kanan Bawah */}
              <Link
                href="/pendaftaran"
                className="hidden sm:inline-flex absolute -bottom-5 right-5 z-20 bg-[#0088FF] hover:bg-[#0073E6] text-white rounded-2xl px-5 py-3.5 shadow-lg shadow-[#0088FF]/30 items-center gap-2 text-xs font-bold transition-all hover:scale-105"
              >
                <span>Gabung Sekarang</span>
                <HiArrowRight className="text-sm" />
              </Link>
            </div>
          </div>

          {/* ================= KOLOM KANAN: GRID 6 KARTU MANFAAT (2 KOLOM x 3 BARIS) ================= */}
          <div className="w-full lg:w-[56%] flex items-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
              {manfaatList.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={index}
                    style={{ transitionDelay: `${index * 90}ms` }}
                    className={`
                      group relative
                      bg-white rounded-3xl p-6
                      border border-slate-200/85
                      hover:border-[#0088FF]/50
                      shadow-[0_4px_20px_rgba(11,27,61,0.04)]
                      hover:shadow-[0_18px_40px_rgba(0,136,255,0.12)]
                      hover:-translate-y-1.5
                      transition-all duration-500 ease-out
                      flex flex-col justify-between
                      ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
                    `}
                  >
                    <div>
                      {/* Top Row: Icon & Number */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#EBF5FF] text-[#0088FF] group-hover:bg-[#0088FF] group-hover:text-white flex items-center justify-center transition-colors duration-300 shadow-xs">
                          <IconComponent className="text-2xl" />
                        </div>

                        <span className="text-xs font-extrabold text-slate-300 group-hover:text-[#0088FF]/40 transition-colors">
                          0{index + 1}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base sm:text-[17px] font-extrabold text-[#0B1B3D] group-hover:text-[#0088FF] transition-colors mb-2 leading-snug">
                        {item.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs sm:text-[13.5px] text-[#475569] leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    {/* Bottom Accent Line on Hover */}
                    <div className="mt-4 h-1 w-10 group-hover:w-full bg-[#EBF5FF] group-hover:bg-[#0088FF] rounded-full transition-all duration-300" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
