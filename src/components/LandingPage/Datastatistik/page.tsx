"use client";

import { HiBriefcase, HiUsers, HiCheckCircle } from "react-icons/hi";

import { FaUserCheck } from "react-icons/fa";

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

  // Total Kuota
  const totalKuota = formasiList.reduce((a, b) => a + b.kuota, 0);

  // Semua pendaftar
  const totalPendaftar = formasiList.reduce((a, b) => a + b.jumlahPendaftar, 0);

  // Peserta sedang magang (kuota terisi)
  const sedangMagang = formasiList.reduce(
    (a, b) => a + (b.kuota - b.sisaKuota),
    0,
  );

  // Peserta selesai magang (data asli dari backend)
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
      value: totalKuota,
      color: "from-[#FACC15] to-[#EAB308]",
      icon: HiBriefcase,
    },
    {
      label: "Jumlah Pendaftar ",
      value: totalPendaftar,
      color: "from-[#B91C1C] to-[#7F1D1D]",
      icon: HiUsers,
    },
    {
      label: "Peserta Sedang Magang",
      value: sedangMagang,
      color: "from-[#84CC16] to-[#365314]",
      icon: FaUserCheck,
    },
    {
      label: "Peserta Selesai Magang",
      value: selesaiMagang,
      color: "from-[#F97316] to-[#9A3412]",
      icon: HiCheckCircle,
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
      { threshold: 0.3 },
    );

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, [loading, hasAnimated, stats]);

  const runCountUp = () => {
    stats.forEach((item, index) => {
      let start: number | null = null;
      const duration = 1200;

      const animate = (time: number) => {
        if (!start) start = time;

        const progress = Math.min((time - start) / duration, 1);

        const current = Math.floor(progress * item.value);

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
      className="w-full flex justify-center px-4 mt-28"
    >
      <div className="max-w-6xl w-full px-6 lg:px-14 py-16">
        {/* ================= HEADER ================= */}
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-[#7F1D1D]">
              Statistik Program Magang
            </h2>

            {/* Badge */}
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Real-Time
            </span>
          </div>

          <p className="text-gray-600 mt-4 max-w-2xl mx-auto leading-relaxed">
            Ringkasan data program magang Balai Besar POM Palembang berdasarkan
            formasi aktif dan pendaftar terbaru.
          </p>
        </div>

        {/* ================= LOADING ================= */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white/70 border border-white/60 rounded-3xl p-6 shadow"
              >
                <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4"></div>

                <div className="h-6 bg-gray-200 rounded w-2/3 mb-2"></div>

                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        )}

        {/* ================= STATISTIK ================= */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((item, i) => (
              <div
                key={i}
                className="
                      relative
                      bg-white/60 backdrop-blur-xl
                      border border-white/70
                      rounded-3xl p-6
                      shadow-md
                      hover:shadow-xl
                      hover:-translate-y-1
                      transition-all duration-300
                      overflow-hidden
                      group
                    "
              >
                {/* Background Effect */}
                <div
                  className="
                        absolute inset-0 opacity-0
                        group-hover:opacity-100
                        bg-linear-to-r from-white/10 to-white/30
                        transition
                      "
                />

                {/* Icon */}
                <div
                  className={`
                        relative z-10
                        w-14 h-14
                        flex items-center justify-center
                        rounded-2xl
                        bg-linear-to-r ${item.color}
                        text-white
                        shadow-lg
                        mb-4
                      `}
                >
                  <item.icon size={26} />
                </div>

                {/* Value */}
                <h3 className="relative z-10 text-3xl font-extrabold text-[#7F1D1D]">
                  {counts[i]}
                </h3>

                {/* Label */}
                <p className="relative z-10 text-gray-600 mt-1 text-sm">
                  {item.label}
                </p>

                {/* Progress */}
                <div className="mt-4 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-linear-to-r ${item.color}`}
                    style={{
                      width: `${
                        item.value === 0
                          ? 0
                          : Math.min(100, (counts[i] / item.value) * 100)
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
