"use client";

import { useState } from "react";
import Image from "next/image";
import { HiCheckCircle } from "react-icons/hi";

const tabs = [
  { key: "profil", label: "Profil" },
  { key: "tugas", label: "Tugas & Fungsi" },
  { key: "visi", label: "Visi & Misi" },
];

export default function ProfilPage() {
  const [activeTab, setActiveTab] = useState("tugas");

  return (
    <section id="profil" className="w-full flex justify-center px-4 mt-16">
      <div
        className="
          max-w-6xl w-full
          bg-gradient-to-br
          from-blue-100/30 via-cyan-100/30 to-emerald-100/30
          backdrop-blur-xl
          rounded-3xl shadow-xl
          px-8 lg:px-14 py-12
        "
      >
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row gap-10 items-center">
          {/* TEXT */}
          <div className="flex-1">
            <h1 className="text-3xl lg:text-4xl font-extrabold text-blue-900 leading-tight">
              Balai Besar Pengawas Obat dan Makanan
              <span className="block text-cyan-700">
                di Palembang
              </span>
            </h1>

            {/* TABS */}
            <div className="flex gap-6 mt-6 border-b border-blue-200">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    pb-2 font-semibold transition
                    ${
                      activeTab === tab.key
                        ? "text-blue-700 border-b-2 border-blue-600"
                        : "text-gray-500 hover:text-blue-600"
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* CONTENT */}
            <div className="mt-6 text-gray-700 leading-relaxed">
              {activeTab === "profil" && (
                <p>
                  Balai Besar Pengawas Obat dan Makanan (BBPOM) di Bandar Lampung
                  merupakan Unit Pelaksana Teknis Badan POM yang bertugas
                  melaksanakan pengawasan Obat dan Makanan di wilayah Provinsi
                  Lampung untuk menjamin keamanan, mutu, dan manfaat produk.
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
                      <HiCheckCircle className="text-blue-600 mt-1" size={18} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {activeTab === "visi" && (
                <div className="space-y-4">
                  <p>
                    <strong>Visi:</strong> Terwujudnya Obat dan Makanan yang aman,
                    bermutu, dan berdaya saing untuk meningkatkan kualitas hidup
                    masyarakat.
                  </p>
                  <p>
                    <strong>Misi:</strong> Meningkatkan sistem pengawasan Obat
                    dan Makanan yang efektif, transparan, dan terpercaya.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* IMAGE */}
          <div className="flex-1 flex justify-center">
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