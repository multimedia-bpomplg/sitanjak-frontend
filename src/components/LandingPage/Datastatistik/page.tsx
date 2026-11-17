"use client";

import { plusJakarta, caveat } from '@/lib/font';
import {
  HiOutlineBriefcase,
  HiOutlineUsers,
  HiOutlineCheckCircle,
  HiOutlineUserGroup,
} from "react-icons/hi";
import { useEffect, useRef, useState } from "react";
import { fetchFormasi, IFormasi } from "@/services/formasiService";



export default function Statistik() {
  const sectionRef = useRef<HTMLDivElement | null>(null);

  const [formasiList, setFormasiList] = useState<IFormasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [counts, setCounts] = useState<number[]>([0, 0, 0, 0]);

  // =====================================
  // FETCH DATA
  // =====================================
  useEffect(() => {
    const loadData = async () => {
      try {
        const formasiData = await fetchFormasi();
        setFormasiList(formasiData);
      } catch (err) {
        console.error("Gagal load statistik:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // =====================================
  // HITUNG DATA
  // =====================================
  const totalKuota = formasiList.reduce((a, b) => a + b.kuota, 0);
  const totalPendaftar = formasiList.reduce((a, b) => a + b.jumlahPendaftar, 0);
  const sedangMagang = formasiList.reduce(
    (a, b) => a + (b.kuota - b.sisaKuota),
    0,
  );
  const selesaiMagang = formasiList.reduce(
    (a, b) => a + (b.jumlahSelesaiMagang || 0),
    0,
  );

  // =====================================
  // DATA UI
  // =====================================
  const stats = [
    {
      label: "Total Kuota Magang",
      sub: "Daya tampung seluruh fungsi",
      value: totalKuota,
      iconBg: "bg-[#EBF5FF] text-[#0088FF]",
      barColor: "bg-[#0088FF]",
      icon: HiOutlineBriefcase,
    },
    {
      label: "Total Pendaftar",
      sub: "Pelajar & mahasiswa terdaftar",
      value: totalPendaftar,
      iconBg: "bg-indigo-50 text-indigo-600",
      barColor: "bg-indigo-500",
      icon: HiOutlineUsers,
    },
    {
      label: "Peserta Sedang Magang",
      sub: "Peserta aktif periode berjalan",
      value: sedangMagang,
      iconBg: "bg-sky-50 text-sky-600",
      barColor: "bg-sky-500",
      icon: HiOutlineUserGroup,
    },
    {
      label: "Peserta Selesai Magang",
      sub: "Alumni yang telah lulus program",
      value: selesaiMagang,
      iconBg: "bg-emerald-50 text-emerald-600",
      barColor: "bg-emerald-500",
      icon: HiOutlineCheckCircle,
    },
  ];

  // =====================================
  // ANIMASI COUNT-UP
  // =====================================
  useEffect(() => {
    if (loading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          runCountUp();
          setHasAnimated(true);
        }
      },
      { threshold: 0.25 },
    );

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, [loading, hasAnimated, totalKuota, totalPendaftar, sedangMagang, selesaiMagang]);

  const runCountUp = () => {
    const targetValues = [
      totalKuota,
      totalPendaftar,
      sedangMagang,
      selesaiMagang,
    ];

    targetValues.forEach((targetValue, index) => {
      let start: number | null = null;
      const duration = 1200;

      const animate = (time: number) => {
        if (!start) start = time;

        const progress = Math.min((time - start) / duration, 1);
        const current = Math.floor(progress * targetValue);

        setCounts((prev) => {
          const copy = [...prev];
          copy[index] = current;
          return copy;
        });

        if (progress < 1) requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    });
  };

  // =====================================
  // UI
  // =====================================
  return (
    <section
      id="statistik"
      ref={sectionRef}
      className={`${plusJakarta.className} relative w-full py-12 lg:py-20 px-4 sm:px-6 lg:px-12 bg-white`}
    >
      <div className="max-w-7xl mx-auto w-full">
        {/* Container Banner Navy & Biru Modern */}
        <div className="relative overflow-hidden rounded-[32px] bg-linear-to-br from-[#071531] via-[#0B1B3D] to-[#08306B] px-6 sm:px-10 lg:px-14 py-12 lg:py-16 shadow-[0_24px_60px_rgba(11,27,61,0.16)]">
          {/* Dekorasi Cahaya Biru Halus */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#0088FF]/25 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-sky-400/15 blur-3xl"
          />

          {/* ================= HEADER ================= */}
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="w-7 h-[2px] bg-[#38BDF8] rounded-full" />
                <span className="text-xs font-bold tracking-[0.18em] text-[#38BDF8] uppercase">
                  CAPAIAN & DATA PROGRAM
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  Real-Time
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-[-0.02em]">
                Statistik Program Magang{" "}
                <span className="text-[#38BDF8]">SI TANJAK</span>
              </h2>
            </div>

            <p className="text-slate-300 text-sm sm:text-base max-w-md leading-relaxed">
              Ringkasan partisipasi pelajar dan mahasiswa dalam program magang
              resmi di Balai Besar POM di Palembang.
            </p>
          </div>

          {/* ================= LOADING SKELETON ================= */}
          {loading && (
            <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white/10 border border-white/15 rounded-2xl p-4 sm:p-6 space-y-4"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-2xl" />
                  <div className="h-7 sm:h-8 bg-white/20 rounded w-1/2" />
                  <div className="h-4 bg-white/15 rounded w-3/4" />
                </div>
              ))}
            </div>
          )}

          {/* ================= STATISTIK CARDS ================= */}
          {!loading && (
            <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {stats.map((item, i) => {
                const IconComponent = item.icon;
                const progressWidth =
                  item.value === 0
                    ? 0
                    : Math.min(100, (counts[i] / item.value) * 100);

                return (
                  <div
                    key={i}
                    className="
                      group relative
                      bg-white rounded-2xl p-4 sm:p-6
                      border border-white/80
                      shadow-lg
                      hover:-translate-y-1.5 hover:shadow-2xl
                      transition-all duration-300
                      flex flex-col justify-between
                    "
                  >
                    <div>
                      {/* Top Row: Icon & Live Dot */}
                      <div className="flex items-center justify-between mb-3.5 sm:mb-5">
                        <div
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${item.iconBg} flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}
                        >
                          <IconComponent className="text-xl sm:text-2xl" />
                        </div>

                        <span className="hidden sm:inline text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
                          Data Aktif
                        </span>
                      </div>

                      {/* Angka Utama */}
                      <div className="flex items-baseline gap-1 sm:gap-1.5">
                        <h3 className="text-2xl sm:text-4xl font-extrabold text-[#0B1B3D] tracking-tight">
                          {counts[i]}
                        </h3>
                        <span className="text-[11px] sm:text-xs font-semibold text-[#64748B]">
                          Orang
                        </span>
                      </div>

                      {/* Label & Sublabel */}
                      <p className="text-xs sm:text-sm font-extrabold text-[#0B1B3D] mt-1.5 sm:mt-2 leading-snug">
                        {item.label}
                      </p>
                      <p className="text-[11px] sm:text-xs text-[#64748B] mt-0.5 leading-snug">
                        {item.sub}
                      </p>
                    </div>

                    {/* Progress Indicator */}
                    <div className="mt-5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${item.barColor}`}
                        style={{ width: `${progressWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
