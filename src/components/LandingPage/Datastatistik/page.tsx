"use client";

import {
  HiBriefcase,
  HiUserGroup,
  HiCheckCircle,
  HiXCircle,
  HiClipboardList,
} from "react-icons/hi";
import { useEffect, useRef, useState } from "react";

const stats = [
  {
    label: "Total Lowongan Dibuka",
    value: 12,
    icon: HiBriefcase,
    color: "from-[#FACC15] to-[#EAB308]",
  },
  {
    label: "Sedang Magang",
    value: 18,
    icon: HiUserGroup,
    color: "from-[#B91C1C] to-[#7F1D1D]",
  },
  {
    label: "Selesai Magang",
    value: 42,
    icon: HiCheckCircle,
    color: "from-[#84CC16] to-[#365314]",
  },

  {
    label: "Total Pendaftar",
    value: 75,
    icon: HiClipboardList,
    color: "from-[#F97316] to-[#9A3412]",
  },
];

export default function Statistik() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [counts, setCounts] = useState<(number | string)[]>(stats.map(() => 0));

  // 🔥 OBSERVER — JALAN SEKALI SAJA
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          runCountUp();
          setHasAnimated(true);
          observer.disconnect(); // ⛔ STOP
        }
      },
      { threshold: 0.3 },
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAnimated]);

  // 🔢 COUNT UP FUNCTION
  const runCountUp = () => {
    stats.forEach((item, index) => {
      const endValue = item.value; // 🔥 number only

      let startTime: number | null = null;
      const duration = 1200;

      const animate = (time: number) => {
        if (!startTime) startTime = time;
        const progress = Math.min((time - startTime) / duration, 1);
        const current = Math.floor(progress * endValue);

        setCounts((prev) => {
          const updated = [...prev];
          updated[index] = current;
          return updated;
        });

        if (progress < 1) requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    });
  };

  return (
    <section
      id="statistik"
      ref={sectionRef}
      className="w-full flex justify-center px-4 mt-24"
    >
      <div
        className="
          max-w-6xl w-full
          px-8 lg:px-14 py-14
        "
      >
        {/* HEADER */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-[#7F1D1D]">
            Statistik Program Magang
          </h2>
          <p className="text-gray-700 mt-3 max-w-2xl mx-auto">
            Ringkasan data pelaksanaan program magang di Balai Besar POM
            Palembang sebagai bentuk transparansi dan informasi publik.
          </p>
        </div>

        {/* GRID STATISTIK */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((item, index) => (
            <div
              key={index}
              className="
                bg-white/45 backdrop-blur-lg
                border border-white/60
                rounded-3xl p-6
                shadow-md
                hover:shadow-xl hover:-translate-y-1
                transition-all duration-300
              "
            >
              <div
                className={`
                  w-14 h-14 flex items-center justify-center
                  rounded-2xl mb-4
                  bg-linear-to-r ${item.color}
                  text-white shadow-lg
                  ring-2 ring-[#FDE68A]/40
                `}
              >
                <item.icon size={28} />
              </div>

              <h3 className="text-3xl font-extrabold text-[#7F1D1D]">
                {counts[index]}
              </h3>

              <p className="text-gray-700 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
