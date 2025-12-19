"use client";

import {
  HiBriefcase,
  HiAcademicCap,
  HiBadgeCheck,
  HiUserGroup,
  HiTrendingUp,
  HiSparkles,
} from "react-icons/hi";
import { useEffect, useRef, useState } from "react";

const manfaatList = [
  {
    title: "Pengalaman Kerja Nyata",
    desc: "Mahasiswa memperoleh pengalaman langsung di lingkungan kerja profesional sesuai bidangnya.",
    icon: HiBriefcase,
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Pengembangan Kompetensi",
    desc: "Meningkatkan kemampuan teknis dan soft skill yang dibutuhkan di dunia kerja.",
    icon: HiAcademicCap,
    color: "from-cyan-500 to-emerald-500",
  },
  {
    title: "Sertifikat Magang",
    desc: "Peserta yang menyelesaikan magang akan mendapatkan sertifikat resmi dari instansi.",
    icon: HiBadgeCheck,
    color: "from-emerald-500 to-teal-400",
  },
  {
    title: "Pembimbing Profesional",
    desc: "Didampingi oleh pembimbing berpengalaman selama pelaksanaan magang.",
    icon: HiUserGroup,
    color: "from-indigo-500 to-blue-500",
  },
  {
    title: "Peningkatan Daya Saing",
    desc: "Menjadi nilai tambah dalam dunia kerja dan meningkatkan daya saing lulusan.",
    icon: HiTrendingUp,
    color: "from-emerald-400 to-lime-400",
  },
  {
    title: "Relasi & Jaringan",
    desc: "Memperluas relasi profesional yang bermanfaat untuk karier di masa depan.",
    icon: HiSparkles,
    color: "from-pink-500 to-rose-500",
  },
];

export default function Manfaat() {
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
          observer.disconnect(); // ⛔ stop observer → ringan
        }
      },
      { threshold: 0.25 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [hasAnimated]);

  return (
    <section
      id="manfaat"
      ref={sectionRef}
      className="w-full flex justify-center px-4 mt-24"
    >
      <div
        className={`
          max-w-6xl w-full
          bg-gradient-to-br from-blue-100/30 via-cyan-100/30 to-emerald-100/30
          backdrop-blur-xl rounded-3xl shadow-xl
          px-8 lg:px-14 py-14
          transition-all duration-700 ease-out
          ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
        `}
      >
        {/* HEADER */}
        <div
          className={`
            text-center mb-12
            transition-all duration-700 delay-100
            ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
          `}
        >
          <h2 className="text-3xl lg:text-4xl font-extrabold text-blue-900">
            Manfaat Program Magang
          </h2>
          <p className="text-gray-700 mt-3 max-w-2xl mx-auto">
            Program magang ini dirancang untuk memberikan manfaat maksimal bagi
            mahasiswa dan instansi.
          </p>
        </div>

        {/* GRID MANFAAT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {manfaatList.map((item, index) => (
            <div
              key={index}
              style={{ transitionDelay: `${index * 120}ms` }}
              className={`
                bg-white/40 backdrop-blur-lg
                border border-white/50
                rounded-3xl p-6
                shadow-md
                transition-all duration-700 ease-out
                ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
                hover:shadow-xl hover:-translate-y-1
              `}
            >
              <div
                className={`
                  w-14 h-14 flex items-center justify-center
                  rounded-2xl mb-4
                  bg-gradient-to-r ${item.color}
                  text-white shadow-lg
                `}
              >
                <item.icon size={28} />
              </div>

              <h3 className="text-xl font-bold text-blue-800 mb-2">
                {item.title}
              </h3>

              <p className="text-gray-700 text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}