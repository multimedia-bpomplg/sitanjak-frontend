"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { HiCheckCircle } from "react-icons/hi";

const tabs = [
  { key: "profil", label: "Profil" },
  { key: "tugas", label: "Tugas & Fungsi" },
  { key: "visi", label: "Visi & Misi" },
];

export default function ProfilPage() {
  const [activeTab, setActiveTab] = useState("tugas");

  // 🔥 ANIMASI SEKALI SAJA
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
      { threshold: 0.25 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [hasAnimated]);

  return (
    <section
      id="profil"
      ref={sectionRef}
      className="w-full flex justify-center px-4 pt-6 pb-16"
    >
      <div
        className={`
          max-w-6xl w-full 
          flex flex-col lg:flex-row items-center justify-between
          gap-8 lg:gap-16
          px-4 lg:px-0
          transition-all duration-700 ease-out
          ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
        `}
      >
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row gap-10 items-center">
          {/* TEXT */}
          <div
            className={`
              flex-1
              transition-all duration-700 delay-100
              ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}
            `}
          >
            <h1 className="text-3xl lg:text-4xl font-extrabold text-[#7F1D1D] leading-tight">
              Balai Besar Pengawas Obat dan Makanan
              <span className="block text-[#B91C1C]">
                di Palembang
              </span>
            </h1>

            {/* TABS */}
            <div className="mt-6 border-b border-[#FDE68A] flex gap-8">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    relative pb-3 text-sm font-semibold transition-colors
                    ${
                      activeTab === tab.key
                        ? "text-[#7F1D1D]"
                        : "text-gray-500 hover:text-[#7F1D1D]"
                    }
                  `}
                >
                  {tab.label}

                  {/* UNDERLINE */}
                  {activeTab === tab.key && (
                    <span className="absolute left-0 -bottom-px w-full h-0.5 bg-[#7F1D1D] rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* CONTENT */}
            <div className="mt-6 text-gray-700 leading-relaxed">
              {activeTab === "profil" && (
                <p>
                  Balai Besar Pengawas Obat dan Makanan (BBPOM) di Palembang
                  merupakan Unit Pelaksana Teknis Badan POM yang bertugas
                  melaksanakan pengawasan Obat dan Makanan untuk menjamin
                  keamanan, mutu, dan manfaat produk.
                </p>
              )}

              {activeTab === "tugas" && (
                <ul className="space-y-3">
                  {[
                    "Penyusunan rencana, program, dan anggaran di bidang pengawasan Obat dan Makanan",
                    "Pemeriksaan fasilitas produksi Obat dan Makanan",
                    "Pemeriksaan fasilitas distribusi dan pelayanan kefarmasian",
                    "Sertifikasi produk dan fasilitas produksi serta distribusi",
                    "Sampling dan pengujian Obat dan Makanan",
                    "Pemantauan label dan iklan",
                    "Investigasi dan penyidikan",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <HiCheckCircle className="text-[#B91C1C] mt-1" size={18} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {activeTab === "visi" && (
                <div className="space-y-4">
                  <p>
                    <strong className="text-[#7F1D1D]">Visi:</strong>{" "}
                    Terwujudnya Obat dan Makanan yang aman, bermutu, dan berdaya saing
                    untuk meningkatkan kualitas hidup masyarakat.
                  </p>
                  <p>
                    <strong className="text-[#7F1D1D]">Misi:</strong>{" "}
                    Meningkatkan sistem pengawasan Obat dan Makanan yang efektif,
                    transparan, dan terpercaya.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* IMAGE */}
          <div
            className={`
              flex-1 flex justify-center
              transition-all duration-700 delay-200
              ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}
            `}
          >
            <Image
              src="/images/landing page/foto profil.png"
              alt="Ilustrasi Profil"
              width={420}
              height={420}
              className="object-contain drop-shadow-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}