"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { plusJakarta, caveat } from '@/lib/font';
import {
  HiOutlineShieldCheck,
  HiOutlineBeaker,
  HiOutlineAcademicCap,
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
} from "react-icons/hi";





const tabs = [
  { key: "profil", label: "Profil" },
  { key: "visi", label: "Visi & Misi" },
  { key: "tugas", label: "Tugas & Fungsi" },
];

const highlightItems = [
  {
    title: "Pengawasan Terpadu",
    desc: "Mengawal keamanan, mutu, dan khasiat Obat serta Makanan di masyarakat.",
    icon: HiOutlineShieldCheck,
  },
  {
    title: "Laboratorium Modern",
    desc: "Fasilitas pengujian kimia, mikrobiologi, dan molekuler berstandar tinggi.",
    icon: HiOutlineBeaker,
  },
  {
    title: "Edukasi & Pembinaan",
    desc: "Wadah pembelajaran nyata bagi mahasiswa dan siswa magang akademik.",
    icon: HiOutlineAcademicCap,
  },
  {
    title: "SDM Profesional",
    desc: "Didukung pengawas farmasi dan pangan ahli yang siap membimbing.",
    icon: HiOutlineUserGroup,
  },
];

export default function ProfilPage() {
  const [activeTab, setActiveTab] = useState("profil");

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
      { threshold: 0.2 },
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [hasAnimated]);

  return (
    <section
      id="profil"
      ref={sectionRef}
      className={`${plusJakarta.className} relative w-full overflow-hidden bg-white py-16 lg:py-24`}
    >
      {/* Aksen Lingkaran Halus di Sudut Kanan Bawah */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-[#EBF5FF]/80 blur-2xl"
      />

      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-14 lg:gap-12">
        {/* ================= KOLOM KIRI: KOLASE 2 GAMBAR GEDUNG & ORNAMEN ================= */}
        <div
          className={`
            w-full lg:w-[52%] relative
            transition-all duration-700 ease-out
            ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}
          `}
        >
          <div className="relative w-full max-w-[600px] mx-auto">
            {/* Blok Latar Biru Muda di Kiri Atas (Belakang Kiri Gambar Utama) */}
            <div
              aria-hidden="true"
              className="hidden sm:block absolute -left-3 top-12 w-16 h-56 bg-[#EBF5FF] rounded-l-3xl z-0"
            />

            {/* Garis Outline Dekoratif di Kanan Gambar Utama */}
            <div
              aria-hidden="true"
              className="hidden sm:block absolute right-[10%] top-[16%] w-20 h-36 rounded-tr-2xl border-t-[1.5px] border-r-[1.5px] border-[#0088FF]/45 z-0"
            />

            {/* Blok Latar Biru Muda di Kanan Tengah/Bawah (Belakang Kanan Gambar Kedua) */}
            <div
              aria-hidden="true"
              className="hidden sm:block absolute -right-2 top-[38%] w-32 h-48 bg-[#EBF5FF] rounded-3xl z-0"
            />

            {/* GAMBAR 1 (UTAMA - KIRI ATAS BESAR) */}
            <div className="relative z-10 w-[86%] sm:w-[82%] mr-auto">
              <div className="relative h-[240px] sm:h-[310px] w-full overflow-hidden rounded-3xl shadow-[0_18px_45px_rgba(11,27,61,0.12)]">
                <Image
                  src="/images/assets-new/gedung-bpom2.png"
                  alt="Gedung BBPOM di Palembang"
                  fill
                  className="object-cover object-center hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 1024px) 90vw, 45vw"
                />
              </div>
            </div>

            {/* BARIS BAWAH: TEKS SCRIPT (KIRI BAWAH) + GARIS L + GAMBAR 2 (KANAN BAWAH OVERLAP) */}
            <div className="relative z-20 flex flex-col-reverse sm:flex-row items-start sm:items-end justify-between -mt-12 sm:-mt-20 gap-6">
              {/* AKSEN KIRI BAWAH: TULISAN SCRIPT & GARIS MIRING (SEMBUNYIKAN DI MOBILE) */}
              <div className="hidden sm:flex w-full sm:w-[38%] pl-4 sm:pl-6 pb-2 items-center sm:items-start justify-between sm:flex-col gap-3">
                <div className="relative -rotate-12">
                  <p
                    className={`${caveat.className} text-2xl sm:text-[29px] font-bold text-[#0B1B3D] leading-[1.02]`}
                  >
                    Aman. <br />
                    <span className="ml-2">Bermutu.</span> <br />
                    <span className="ml-5">Berdaya Saing.</span>
                  </p>
                  {/* Garis Miring Biru di Bawah Teks Script */}
                  <span className="block mt-2 ml-3 w-32 h-[2px] bg-[#0088FF] rounded-full -rotate-6" />
                </div>
              </div>

              {/* Garis Outline L Penghubung antara Gambar 1 dan Gambar 2 */}
              <div
                aria-hidden="true"
                className="hidden sm:block absolute left-[34%] bottom-[26%] w-16 h-20 rounded-bl-2xl border-b-[1.5px] border-l-[1.5px] border-[#0088FF]/45 z-10 pointer-events-none"
              />

              {/* GAMBAR 2 (KANAN BAWAH OVERLAPPING) */}
              <div className="w-[75%] sm:w-[56%] ml-auto mr-2 sm:mr-4 rounded-3xl border-[4px] border-white bg-white shadow-[0_18px_40px_rgba(11,27,61,0.14)] overflow-hidden">
                <div className="relative h-[160px] sm:h-[190px] w-full overflow-hidden rounded-2xl">
                  <Image
                    src="/images/assets-new/gedung-bpom.jpg"
                    alt="Tampak Atas BBPOM di Palembang"
                    fill
                    className="object-cover object-center hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 1024px) 70vw, 30vw"
                  />
                </div>
              </div>
            </div>

            {/* CAPTION GARIS BAWAH (SEMBUNYIKAN DI MOBILE) */}
            <div className="hidden sm:flex mt-7 items-center justify-start gap-3 pl-2 sm:pl-4">
              <span className="w-8 h-[2px] bg-[#0088FF] rounded-full" />
              <p className="text-[11px] font-semibold tracking-[0.22em] text-[#64748B] uppercase">
                UNIT PELAKSANA TEKNIS BADAN POM RI
              </p>
            </div>
          </div>
        </div>

        {/* ================= KOLOM KANAN: TEKS, TABS & POIN INFORMASI ================= */}
        <div
          className={`
            w-full lg:w-[48%] space-y-6
            transition-all duration-700 delay-150 ease-out
            ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}
          `}
        >
          {/* Overline Tag */}
          <div className="flex items-center gap-3">
            <span className="w-8 h-[2px] bg-[#0088FF] rounded-full" />
            <span className="text-xs font-bold tracking-[0.18em] text-[#0B1B3D] uppercase">
              BALAI BESAR POM DI PALEMBANG
            </span>
          </div>

          {/* Judul Utama 2 Warna */}
          <h2 className="text-3xl sm:text-4xl xl:text-[42px] font-extrabold text-[#0B1B3D] leading-[1.18] tracking-[-0.02em]">
            Balai Besar Pengawas Obat <br />
            <span className="text-[#0088FF]">dan Makanan di Palembang</span>
          </h2>

          {/* Navigasi Tabs (Profil, Visi & Misi, Tugas & Fungsi) */}
          <div className="flex items-center gap-2 sm:gap-3 pt-1 border-b border-slate-200 pb-3">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200
                    ${
                      isActive
                        ? "bg-[#0088FF] text-white shadow-md shadow-[#0088FF]/25"
                        : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] hover:text-[#0B1B3D]"
                    }
                  `}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ================= ISI KONTEN SESUAI TAB ================= */}
          {activeTab === "profil" && (
            <div className="space-y-6">
              <p className="text-[#475569] text-sm sm:text-[15.5px] leading-relaxed">
                Balai Besar Pengawas Obat dan Makanan (BBPOM) di Palembang
                merupakan Unit Pelaksana Teknis Badan POM yang bertugas
                melaksanakan pengawasan Obat dan Makanan untuk menjamin
                keamanan, mutu, dan manfaat produk, sekaligus menyediakan wadah
                pembelajaran profesional melalui program magang{" "}
                <span className="font-bold text-[#0088FF]">SI TANJAK</span>.
              </p>

              {/* Grid 2x2 Poin Ber-Ikon Bulat (Persis Seperti Gambar Referensi) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6 pt-1">
                {highlightItems.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-full bg-[#EBF5FF] text-[#0088FF] flex items-center justify-center shrink-0">
                        <Icon className="text-2xl" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-[#0B1B3D] leading-snug">
                          {item.title}
                        </h3>
                        <p className="text-xs text-[#64748B] leading-relaxed mt-1">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "visi" && (
            <div className="space-y-5 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
              {/* Visi Card */}
              <div className="bg-[#F0F7FF] border border-[#D6EEFF] rounded-2xl p-4 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#0088FF] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <HiOutlineShieldCheck className="text-xl" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0088FF] uppercase tracking-wider">
                    Visi Badan POM
                  </h3>
                  <p className="text-sm text-[#0B1B3D] font-medium leading-relaxed mt-1">
                    Terwujudnya Sediaan Farmasi dan Pangan Olahan yang aman,
                    bermutu, dan berdaya saing dalam mendukung masyarakat sehat
                    dan sejahtera bersama Indonesia Maju menuju Indonesia Emas
                    2045.
                  </p>
                </div>
              </div>

              {/* Misi List */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-[#0B1B3D] uppercase tracking-wider">
                  Misi Badan POM
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    "Meningkatkan efektivitas pengawasan Sediaan Farmasi dan Pangan Olahan serta penindakan kejahatan melalui kolaborasi pemerintah, pelaku usaha, dan masyarakat.",
                    "Memfasilitasi percepatan pengembangan dunia usaha Sediaan Farmasi dan Pangan Olahan termasuk UMKM guna membangun struktur ekonomi yang produktif dan berdaya saing.",
                    "Meningkatkan kapasitas masyarakat di bidang Sediaan Farmasi dan Pangan Olahan dengan mengembangkan kemitraan bersama seluruh pemangku kepentingan.",
                    "Pengelolaan pemerintahan yang bersih, efektif, dan terpercaya untuk memberikan pelayanan publik yang prima.",
                  ].map((misi, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 bg-[#F8FAFC] rounded-xl p-3 border border-slate-100"
                    >
                      <div className="w-7 h-7 rounded-full bg-[#EBF5FF] text-[#0088FF] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                        {misi}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "tugas" && (
            <div className="space-y-4 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                Berdasarkan{" "}
                <span className="font-bold text-[#0B1B3D]">
                  Peraturan Badan POM Nomor 19 Tahun 2023
                </span>{" "}
                tentang Organisasi dan Tata Kerja Unit Pelaksana Teknis di
                Lingkungan Badan POM:
              </p>

              {/* Tugas Pokok */}
              <div className="bg-[#F0F7FF] border border-[#D6EEFF] rounded-2xl p-4">
                <h4 className="text-sm font-extrabold text-[#0088FF] mb-1">
                  Tugas Pokok
                </h4>
                <p className="text-xs sm:text-sm text-[#0B1B3D] leading-relaxed">
                  Melaksanakan tugas teknis operasional di bidang pengawasan
                  Obat dan Makanan pada wilayah kerja masing-masing sesuai
                  dengan ketentuan peraturan perundang-undangan.
                </p>
              </div>

              {/* Fungsi Utama */}
              <div className="space-y-2.5">
                <h4 className="text-sm font-extrabold text-[#0B1B3D]">
                  Fungsi Utama
                </h4>
                <div className="space-y-2">
                  {[
                    "Penyusunan rencana, program, dan anggaran di bidang pengawasan Obat dan Makanan;",
                    "Pelaksanaan pemeriksaan fasilitas produksi Obat dan Makanan;",
                    "Pelaksanaan pemeriksaan fasilitas distribusi Obat dan Makanan dan fasilitas pelayanan kefarmasian;",
                    "Pelaksanaan sertifikasi produk dan fasilitas produksi dan distribusi Obat dan Makanan;",
                    "Pelaksanaan sampling Obat dan Makanan;",
                    "Pelaksanaan pemantauan label dan iklan Obat dan Makanan;",
                    "Pelaksanaan pengujian rutin Obat dan Makanan;",
                    "Pelaksanaan pengujian Obat dan Makanan dalam rangka investigasi dan penyidikan;",
                    "Pelaksanaan cegah tangkal, intelijen, dan penyidikan terhadap pelanggaran ketentuan peraturan perundang-undangan;",
                    "Pelaksanaan pemantauan peredaran Obat dan Makanan melalui siber;",
                    "Pengelolaan komunikasi, informasi, edukasi, dan pengaduan masyarakat;",
                    "Pelaksanaan kerja sama di bidang pengawasan Obat dan Makanan;",
                    "Pelaksanaan pemantauan, evaluasi, dan pelaporan di bidang pengawasan Obat dan Makanan;",
                    "Pelaksanaan urusan tata usaha dan rumah tangga; dan",
                    "Pelaksanaan fungsi lain yang diberikan oleh Kepala Badan.",
                  ].map((fungsi, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 text-xs sm:text-sm text-[#475569]"
                    >
                      <HiOutlineCheckCircle className="text-[#0088FF] text-base shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{fungsi}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
