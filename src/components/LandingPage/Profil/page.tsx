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
                <div className="space-y-6 text-gray-700 leading-relaxed">
                  {/* Dasar Hukum */}
                  <p>
                    Berdasarkan <span className="font-semibold">
                      Peraturan Badan POM Nomor 19 Tahun 2023
                    </span>{" "}
                    tentang Organisasi dan Tata Kerja Unit Pelaksana Teknis di Lingkungan Badan
                    Pengawas Obat dan Makanan:
                  </p>

                  {/* TUGAS */}
                  <div>
                    <h4 className="text-lg font-bold text-[#7F1D1D] mb-2">
                      Tugas
                    </h4>
                    <p>
                      Melaksanakan tugas teknis operasional di bidang pengawasan Obat dan
                      Makanan pada wilayah kerja masing-masing sesuai dengan ketentuan
                      peraturan perundang-undangan.
                    </p>
                  </div>

                  {/* FUNGSI */}
                  <div>
                    <h4 className="text-lg font-bold text-[#7F1D1D] mb-3">
                      Fungsi
                    </h4>

                    <ol className="space-y-3 list-decimal list-inside">
                      <li>Penyusunan rencana, program, dan anggaran di bidang pengawasan Obat dan Makanan;</li>
                      <li>Pelaksanaan pemeriksaan fasilitas produksi Obat dan Makanan;</li>
                      <li>Pelaksanaan pemeriksaan fasilitas distribusi Obat dan Makanan dan fasilitas pelayanan kefarmasian;</li>
                      <li>Pelaksanaan sertifikasi produk dan fasilitas produksi dan distribusi Obat dan Makanan;</li>
                      <li>Pelaksanaan sampling Obat dan Makanan;</li>
                      <li>Pelaksanaan pemantauan label dan iklan Obat dan Makanan;</li>
                      <li>Pelaksanaan pengujian rutin Obat dan Makanan;</li>
                      <li>Pelaksanaan pengujian Obat dan Makanan dalam rangka investigasi dan penyidikan;</li>
                      <li>
                        Pelaksanaan cegah tangkal, intelijen, dan penyidikan terhadap pelanggaran
                        ketentuan peraturan perundang-undangan di bidang pengawasan Obat dan Makanan;
                      </li>
                      <li>Pelaksanaan pemantauan peredaran Obat dan Makanan melalui siber;</li>
                      <li>
                        Pengelolaan komunikasi, informasi, edukasi, dan pengaduan masyarakat di bidang
                        pengawasan Obat dan Makanan;
                      </li>
                      <li>Pelaksanaan kerja sama di bidang pengawasan Obat dan Makanan;</li>
                      <li>Pelaksanaan pemantauan, evaluasi, dan pelaporan di bidang pengawasan Obat dan Makanan;</li>
                      <li>Pelaksanaan urusan tata usaha dan rumah tangga; dan</li>
                      <li>Pelaksanaan fungsi lain yang diberikan oleh Kepala Badan.</li>
                    </ol>
                  </div>
                </div>
              )}

              {activeTab === "visi" && (
                <div className="space-y-6 text-gray-700 leading-relaxed">
                  {/* VISI */}
                  <div>
                    <h4 className="text-lg font-bold text-[#7F1D1D] mb-2">
                      Visi
                    </h4>
                    <p>
                      Terwujudnya Sediaan Farmasi dan Pangan Olahan yang aman, bermutu, dan
                      berdaya saing dalam mendukung masyarakat sehat dan sejahtera bersama
                      Indonesia Maju menuju Indonesia Emas 2045.
                    </p>
                  </div>

                  {/* MISI */}
                  <div>
                    <h4 className="text-lg font-bold text-[#7F1D1D] mb-3">
                      Misi
                    </h4>

                    <ol className="space-y-3 list-decimal list-inside">
                      <li>
                        Meningkatkan efektivitas pengawasan Sediaan Farmasi dan Pangan Olahan
                        serta penindakan kejahatan Sediaan Farmasi dan Pangan Olahan melalui
                        kolaborasi pemerintah, pelaku usaha, dan masyarakat;
                      </li>
                      <li>
                        Memfasilitasi percepatan pengembangan dunia usaha Sediaan Farmasi dan
                        Pangan Olahan termasuk UMKM dalam rangka membangun struktur ekonomi
                        yang produktif dan berdaya saing;
                      </li>
                      <li>
                        Meningkatkan kapasitas masyarakat di bidang Sediaan Farmasi dan Pangan
                        Olahan dengan mengembangkan kemitraan bersama seluruh pemangku
                        kepentingan;
                      </li>
                      <li>
                        Pengelolaan pemerintahan yang bersih, efektif, dan terpercaya untuk
                        memberikan pelayanan publik yang prima di bidang Sediaan Farmasi dan
                        Pangan Olahan.
                      </li>
                    </ol>
                  </div>
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