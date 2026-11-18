"use client";

import Link from "next/link";
import { plusJakarta, caveat } from '@/lib/font';
import {
  HiOutlineClipboardCheck,
  HiOutlineClock,
  HiOutlineDocumentText,
  HiOutlineUserGroup,
  HiOutlineExclamationCircle,
  HiOutlineShieldCheck,
  HiOutlineBookOpen,
  HiArrowRight,
} from "react-icons/hi";
import { useEffect, useRef, useState } from "react";



const DEFAULT_PANDUAN_PENDAFTARAN =
  "https://docs.google.com/document/d/1d43jgfTZYD1oT6ePshn8NyMfkXxPQ7aGAePx3qDJ-9I/edit?usp=sharing";

const peraturanList = [
  {
    step: "01",
    tag: "Administrasi",
    title: "Persyaratan Umum",
    desc: "Peserta merupakan mahasiswa atau siswa aktif dari sekolah maupun perguruan tinggi di seluruh Indonesia yang memiliki surat pengantar resmi dari institusi pendidikan.",
    icon: HiOutlineClipboardCheck,
    isWarning: false,
  },
  {
    step: "02",
    tag: "Periode",
    title: "Durasi Pelaksanaan Magang",
    desc: "Pelaksanaan kegiatan magang berlangsung minimal 1 bulan dan maksimal 6 bulan sesuai dengan ketersediaan kuota serta jadwal yang disetujui oleh instansi.",
    icon: HiOutlineClock,
    isWarning: false,
  },
  {
    step: "03",
    tag: "Kode Etik",
    title: "Kehadiran & Kedisiplinan",
    desc: "Peserta wajib mematuhi jam kerja operasional, mengenakan pakaian rapi/seragam sesuai ketentuan, serta menjaga etika dan kerahasiaan data instansi.",
    icon: HiOutlineUserGroup,
    isWarning: false,
  },
  {
    step: "04",
    tag: "Evaluasi",
    title: "Laporan & Penilaian Akhir",
    desc: "Peserta diwajibkan menyusun laporan akhir kegiatan magang dan mengikuti sesi evaluasi bersama pembimbing lapangan sebelum memperoleh sertifikat/surat selesai magang.",
    icon: HiOutlineDocumentText,
    isWarning: false,
  },
  {
    step: "05",
    tag: "Ketegasan",
    title: "Sanksi & Pembatalan",
    desc: "Pelanggaran terhadap tata tertib, ketidakhadiran tanpa keterangan, atau penyalahgunaan wewenang dapat mengakibatkan teguran tertulis hingga pembatalan status magang.",
    icon: HiOutlineExclamationCircle,
    isWarning: true,
  },
];

export default function Peraturan() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [panduanHref, setPanduanHref] = useState(DEFAULT_PANDUAN_PENDAFTARAN);

  useEffect(() => {
    let active = true;
    const loadPublicPanduan = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
        if (!apiUrl) return;
        const res = await fetch(`${apiUrl}/panduan/public`);
        if (!res.ok) return;
        const json = await res.json().catch(() => null);
        const doc = json?.data?.pendaftaran;
        if (active) {
          setPanduanHref(
            doc?.fileUrl
              ? `${apiUrl}${doc.fileUrl}`
              : DEFAULT_PANDUAN_PENDAFTARAN,
          );
        }
      } catch {
        // Fallback ke URL default
      }
    };
    void loadPublicPanduan();
    return () => {
      active = false;
    };
  }, []);

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

  return (
    <section
      id="peraturan"
      ref={sectionRef}
      className={`${plusJakarta.className} relative w-full bg-white py-16 lg:py-24 overflow-hidden`}
    >
      {/* Ornamen Latar Halus */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 right-[-10%] w-96 h-96 rounded-full bg-[#EBF5FF]/70 blur-3xl"
      />

      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-12 lg:gap-14">
          {/* ================= KOLOM KIRI: HEADER & PANDUAN CARD (STICKY DI DESKTOP) ================= */}
          <div
            className={`
              w-full lg:w-[40%] lg:sticky lg:top-28 space-y-6
              transition-all duration-700 ease-out
              ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}
            `}
          >
            <div className="space-y-3">
              <div className="inline-flex items-center gap-3">
                <span className="w-8 h-[2px] bg-[#0088FF] rounded-full" />
                <span className="text-xs font-bold tracking-[0.18em] text-[#0088FF] uppercase">
                  TATA TERTIB & KETENTUAN
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl xl:text-[42px] font-extrabold text-[#0B1B3D] leading-[1.16] tracking-[-0.02em]">
                Peraturan Program{" "}
                <span className="text-[#0088FF]">Magang BBPOM</span>
              </h2>

              <p className="text-[#475569] text-sm sm:text-base leading-relaxed">
                Demi menciptakan lingkungan pembelajaran yang kondusif, aman,
                dan profesional, seluruh peserta magang wajib memahami serta
                mematuhi ketentuan yang berlaku di Balai Besar POM di Palembang.
              </p>
            </div>

            {/* Kartu Ringkasan Komitmen & Panduan (Navy Box) */}
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#071531] via-[#0B1B3D] to-[#08306B] p-6 sm:p-7 text-white shadow-[0_20px_50px_rgba(11,27,61,0.16)]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#0088FF]/25 blur-2xl"
              />

              <div className="relative z-10 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-[#38BDF8] shrink-0">
                    <HiOutlineShieldCheck className="text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      Komitmen Peserta Magang
                    </h3>
                    <p className="text-xs text-slate-300">
                      Standar Integritas BBPOM di Palembang
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  Pastikan Anda telah menyiapkan berkas pengajuan dan membaca
                  dokumen panduan resmi sebelum melakukan pendaftaran akun
                  magang.
                </p>

                <div className="pt-1 flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3">
                  <Link
                    href="/pendaftaran"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0088FF] hover:bg-[#0073E6] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#0088FF]/25 transition-all"
                  >
                    <span>Daftar Magang</span>
                    <HiArrowRight className="text-sm" />
                  </Link>

                  <a
                    href={panduanHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs sm:text-sm font-bold transition-all"
                  >
                    <HiOutlineBookOpen className="text-base text-[#38BDF8]" />
                    <span>Panduan Lengkap</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* ================= KOLOM KANAN: TIMELINE 5 PERATURAN ================= */}
          <div className="w-full lg:w-[60%]">
            <div className="relative">
              {/* Garis Vertikal Timeline */}
              <div
                aria-hidden="true"
                className="hidden sm:block absolute left-6 top-6 bottom-6 w-[2px] bg-linear-to-b from-[#0088FF] via-[#38BDF8] to-slate-200"
              />

              <div className="space-y-5">
                {peraturanList.map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <div
                      key={index}
                      style={{ transitionDelay: `${index * 100}ms` }}
                      className={`
                        relative sm:pl-18
                        transition-all duration-500 ease-out
                        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
                      `}
                    >
                      {/* Node Nomor Timeline (Desktop/Tablet) */}
                      <div
                        className={`
                          hidden sm:flex
                          absolute left-0 top-6
                          w-12 h-12 rounded-2xl
                          items-center justify-center
                          font-extrabold text-sm
                          shadow-md transition-transform duration-300
                          ${
                            item.isWarning
                              ? "bg-rose-500 text-white shadow-rose-500/25 ring-4 ring-rose-50"
                              : "bg-[#0088FF] text-white shadow-[#0088FF]/25 ring-4 ring-[#EBF5FF]"
                          }
                        `}
                      >
                        {item.step}
                      </div>

                      {/* Card Peraturan */}
                      <div
                        className={`
                          group rounded-3xl p-6
                          bg-white border
                          shadow-[0_4px_20px_rgba(11,27,61,0.04)]
                          hover:shadow-[0_18px_40px_rgba(0,136,255,0.10)]
                          hover:-translate-y-1
                          transition-all duration-300
                          ${
                            item.isWarning
                              ? "border-rose-200/90 hover:border-rose-400"
                              : "border-slate-200/85 hover:border-[#0088FF]/50"
                          }
                        `}
                      >
                        <div className="flex items-start gap-4">
                          {/* Ikon di dalam Kartu */}
                          <div
                            className={`
                              w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-300
                              ${
                                item.isWarning
                                  ? "bg-rose-50 text-rose-600 group-hover:bg-rose-500 group-hover:text-white"
                                  : "bg-[#EBF5FF] text-[#0088FF] group-hover:bg-[#0088FF] group-hover:text-white"
                              }
                            `}
                          >
                            <IconComponent className="text-2xl" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                              <h3 className="text-base sm:text-lg font-extrabold text-[#0B1B3D]">
                                {item.title}
                              </h3>

                              <span
                                className={`
                                  text-[11px] font-bold px-3 py-0.5 rounded-full
                                  ${
                                    item.isWarning
                                      ? "bg-rose-50 text-rose-600 border border-rose-200"
                                      : "bg-[#F0F7FF] text-[#0088FF] border border-[#D6EEFF]"
                                  }
                                `}
                              >
                                {item.tag}
                              </span>
                            </div>

                            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footnote Kepatuhan */}
            <div className="mt-7 sm:ml-18 rounded-2xl bg-[#F0F7FF] border border-[#D6EEFF] p-4 flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#0088FF] text-white flex items-center justify-center shrink-0">
                <HiOutlineShieldCheck className="text-xl" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-[#0B1B3D] leading-relaxed">
                Dengan mendaftar dan mengikuti program magang ini, peserta
                dianggap telah membaca, memahami, serta menyetujui seluruh
                peraturan yang berlaku.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
