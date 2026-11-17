"use client";

import Image from "next/image";
import Link from "next/link";
import { plusJakarta, caveat } from '@/lib/font';
import { motion } from "framer-motion";
import {
  HiArrowRight,
  HiOutlineBadgeCheck,
  HiOutlineBriefcase,
  HiOutlineChartBar,
} from "react-icons/hi";



const featureCards = [
  {
    title: "Sertifikat Resmi",
    desc: "Dapatkan sertifikat resmi",
    icon: HiOutlineBadgeCheck,
    offsetClass: "lg:translate-x-0",
  },
  {
    title: "Pengalaman Kerja",
    desc: "Pengalaman kerja nyata",
    icon: HiOutlineBriefcase,
    offsetClass: "lg:translate-x-5",
  },
  {
    title: "Skill Upgrade",
    desc: "Tingkatkan skill Anda.",
    icon: HiOutlineChartBar,
    offsetClass: "lg:translate-x-1",
  },
];

export default function HeroSection() {
  return (
    <section
      className={`${plusJakarta.className} relative w-full overflow-hidden bg-white pt-4 lg:pt-8 pb-12 lg:pb-0`}
    >
      {/* BACKGROUND BLOB BIRU MUDA (KANAN) */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          hidden lg:block
          absolute
          top-2 right-[-10%]
          w-[63%] h-[120%]
          rounded-tl-[460px] rounded-bl-[300px]
          bg-linear-to-br from-[#D6EEFF] via-[#E3F3FF] to-[#CBE8FF]
          z-0
        "
      />

      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 lg:px-12 flex flex-col lg:flex-row items-center lg:items-stretch justify-between gap-12 lg:gap-4">
        {/* ================= KOLOM KIRI: TEKS & CTA ================= */}
        <div className="w-full lg:w-[44%] space-y-5 text-center lg:text-left py-4 lg:py-20 flex flex-col justify-center">
          <p className="text-[#0088FF] font-semibold text-base sm:text-[19px] tracking-[-0.01em]">
            Program Magang Resmi BBPOM di Palembang
          </p>

          <h1 className="text-4xl sm:text-5xl xl:text-[54px] font-extrabold text-[#0B1B3D] leading-[1.15] tracking-[-0.025em]">
            Pendaftaran Magang <br />
            Balai Besar POM <br />
            <span className="text-[#0088FF]">di Palembang</span>
          </h1>

          <p className="text-[#334155] font-normal text-base sm:text-[17px] leading-[1.7] max-w-xl mx-auto lg:mx-0">
            Program magang resmi yang dirancang untuk memberikan pengalaman
            kerja nyata, meningkatkan kompetensi <br /> peserta didik dan mahasiswa.
          </p>

          <div className="pt-2">
            <Link
              href="/pendaftaran"
              className="
                inline-flex items-center justify-center gap-3
                px-9 py-4 rounded-full
                font-bold text-lg
                bg-[#0088FF] text-white
                shadow-lg shadow-[#0088FF]/30
                hover:bg-[#0073E6] hover:scale-105 hover:shadow-xl
                transition-all duration-300
              "
            >
              <span>Daftar Magang</span>
              <HiArrowRight className="text-xl" />
            </Link>
          </div>
        </div>

        {/* ================= KOLOM KANAN: GAMBAR & FLOATING CARDS ================= */}
        <div className="relative w-full lg:w-[56%] flex flex-col lg:flex-row items-center justify-center lg:items-end min-h-[480px] lg:min-h-[600px] pt-6 lg:pt-14">
          {/* BLOB MOBILE/TABLET */}
          <div
            aria-hidden="true"
            className="
              lg:hidden
              absolute top-6 inset-x-0 mx-auto
              w-[92%] h-[360px] sm:h-[420px]
              rounded-[48px]
              bg-linear-to-br from-[#D6EEFF] via-[#E3F3FF] to-[#CBE8FF]
              z-0
            "
          />

          {/* ORNAMEN AKSEN (DROPLET / PETAL SHAPES) */}
          {/* Bulatan/Tetesan Biru Kanan Atas */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute top-12 right-24 w-11 h-11 bg-[#0088FF] rounded-full rounded-bl-md -rotate-12 z-10"
          />
          {/* Kelopak Kuning di belakang tengah */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute top-[48%] left-[52%] w-6 h-6 bg-[#F59E0B] rounded-tl-full rounded-br-full rotate-45 z-10"
          />
          {/* Kelopak Kuning di bawah kartu ke-2 */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute bottom-[70%] right-6 w-7 h-5 bg-[#F59E0B] rounded-tl-full rounded-br-full -rotate-12 z-10"
          />
          {/* Kelopak Kuning di paling bawah kanan */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute bottom-4 right-14 w-7 h-5 bg-[#F59E0B] rounded-tl-full rounded-br-full rotate-6 z-10"
          />

          {/* GAMBAR KARAKTER UTAMA - Diturunkan & diperbesar agar ter-crop rapi di batas bawah seperti referensi */}
          <div className="relative z-10 w-[320px] sm:w-[390px] lg:w-[480px] xl:w-[520px] lg:-ml-10 shrink-0 flex items-end justify-center lg:-mb-18 xl:-mb-22">
            <Image
              src="/images/assets-new/orang_landingpage.png"
              alt="Peserta Magang BBPOM Palembang"
              width={650}
              height={740}
              className="w-full h-auto object-contain object-bottom drop-shadow-[0_16px_28px_rgba(11,27,61,0.12)]"
              priority
            />
          </div>

          {/* 3 FLOATING FEATURE CARDS */}
          <div className="relative z-20 w-full max-w-md lg:max-w-[295px] xl:max-w-[315px] lg:-ml-20 lg:mb-28 xl:mb-42 mt-6 lg:mt-0 flex flex-col gap-4 sm:gap-12">
            {featureCards.map((card, idx) => {
              const IconComponent = card.icon;
              const floatParams = [
                { y: [0, -7, 0], duration: 3.6, delay: 0 },
                { y: [0, -10, 0], duration: 4.2, delay: 0.5 },
                { y: [0, -6, 0], duration: 3.8, delay: 1.0 },
              ][idx] || { y: [0, -8, 0], duration: 4, delay: 0 };

              return (
                <div key={idx} className={card.offsetClass}>
                  <motion.div
                    animate={{
                      y: floatParams.y,
                    }}
                    transition={{
                      duration: floatParams.duration,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: floatParams.delay,
                    }}
                    whileHover={{ scale: 1.03 }}
                    className="
                      bg-white
                      rounded-2xl
                      px-4 py-2.5 sm:py-3
                      shadow-[0_12px_32px_rgba(0,136,255,0.12)]
                      hover:shadow-[0_16px_36px_rgba(0,136,255,0.22)]
                      border border-white
                      flex items-center gap-3.5
                      cursor-default
                      transition-shadow duration-300
                    "
                  >
                    <div className="w-10 h-10 rounded-full bg-[#0088FF] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#0088FF]/25">
                      <IconComponent className="text-xl" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-extrabold text-[#0B1B3D] text-[14px] leading-tight">
                        {card.title}
                      </h3>
                      <p className="text-[11.5px] text-[#475569] leading-snug mt-0.5">
                        {card.desc}
                      </p>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
