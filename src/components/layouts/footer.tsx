"use client";

import Image from "next/image";
import Link from "next/link";
import { FaFacebookF, FaInstagram, FaYoutube, FaGlobe } from "react-icons/fa";
import { HiHome, HiUser, HiClipboardList, HiGift, HiDocumentText } from "react-icons/hi";

export default function Footer() {
  return (
    <footer className="w-full flex justify-center mt-20 px-4 pb-6">
      
      {/* FOOTER CARD */}
      <div
        className="
          max-w-6xl w-full
          bg-gradient-to-r from-[#D4AF37] via-[#B91C1C] to-[#7F1D1D]
          text-white
          rounded-3xl shadow-xl
          px-10 py-10
        "
      >

        {/* TOP SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">

          {/* LOGO WEBSITE */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <Image
              src="/images/icons/sitanjak.png"
              alt="Logo Website"
              width={130}
              height={130}
            />

            <p className="text-md font-bold mt-3">Sistem Informasi Tahapan dan Jangkauan Magang Akademik</p>

            <div className="flex items-center gap-2 mt-3">
              <Image
                src="/images/footer/indonesia.png"
                alt="Icon Info"
                width={45}
                height={45}
                className="opacity-90"
              />
              <h4 className="text-sm text-white/80">
                Menghubungkan Potensi, Membangun Masa Depan.
              </h4>
            </div>
          </div>

          {/* NAVIGATION */}
          <div className="flex flex-col items-center">
            <h3 className="font-bold text-lg mb-3 tracking-wide">Navigasi</h3>

            <ul className="space-y-2 text-white/90 text-base">
              {[
                { label: "Home", href: "/", icon: HiHome },
                { label: "Profil", href: "/profil", icon: HiUser },
                { label: "Formasi", href: "/formasi", icon: HiClipboardList },
                { label: "Manfaat", href: "/manfaat", icon: HiGift },
                { label: "Peraturan", href: "/peraturan", icon: HiDocumentText },
              ].map((menu, i) => (
                <li key={i}>
                  <Link
                    href={menu.href}
                    className="
                      flex items-center gap-2 
                      hover:text-[#FACC15]
                      hover:pl-1 
                      transition font-medium
                    "
                  >
                    <menu.icon size={18} className="hover:bg-[#FACC15]/30" />
                    {menu.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* LOGO INSTANSI + SOSIAL MEDIA */}
          <div className="flex flex-col items-center md:items-end text-center md:text-right">
            <Image
              src="/images/footer/BPOM.png"
              alt="Logo Instansi"
              width={100}
              height={100}
              className="drop-shadow-[0_6px_14px_rgba(0,0,0,0.45)]"
            />

            <h3 className="text-xl font-bold mt-3">Balai Besar POM Palembang</h3>
            <p className="text-sm text-white/80 mt-1">
              Jl. Pangeran Ratu, 5 Ulu, Seberang Ulu I, Kota Palembang, Sumatera Selatan 30254.
            </p>

            {/* Social Media */}
            <div className="flex space-x-3 mt-4">
              <a
                href="https://palembang.pom.go.id/"
                target="_blank"
                className="p-2 bg-white/20 rounded-full hover:bg-white/40 backdrop-blur-sm transition"
              >
                <FaGlobe size={18} />
              </a>

              <a
                href="https://www.facebook.com/bpom.plg/"
                target="_blank"
                className="p-2 bg-white/20 rounded-full hover:bg-white/40 backdrop-blur-sm transition"
              >
                <FaFacebookF size={18} />
              </a>

              <a
                href="https://www.instagram.com/bpom.palembang/"
                target="_blank"
                className="p-2 bg-white/20 rounded-full hover:bg-white/40 backdrop-blur-sm transition"
              >
                <FaInstagram size={18} />
              </a>

              <a
                href="https://www.youtube.com/@bbpom_palembang"
                target="_blank"
                className="p-2 bg-white/20 rounded-full hover:bg-white/40 backdrop-blur-sm transition"
              >
                <FaYoutube size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* GARIS PEMBATAS */}
        <div className="w-full h-px bg-white/30 my-8"></div>

        {/* BOTTOM SECTION */}
        <div className="text-center text-white/80 text-sm">
          © {new Date().getFullYear()} SIMAGGO – Semua Hak Dilindungi.
        </div>
      </div>
    </footer>
  );
}