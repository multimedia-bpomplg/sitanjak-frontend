"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaFacebookF, FaInstagram, FaYoutube, FaGlobe } from "react-icons/fa";
import {
  HiHome,
  HiUser,
  HiClipboardList,
  HiGift,
  HiDocumentText,
  HiPhone,
  HiMail,
  HiExternalLink,
  HiHeart,
  HiShieldCheck,
} from "react-icons/hi";

const plusJakarta = { className: "font-sans" };
const DEFAULT_PANDUAN_PENDAFTARAN =
  "https://docs.google.com/document/d/1d43jgfTZYD1oT6ePshn8NyMfkXxPQ7aGAePx3qDJ-9I/edit?usp=sharing";

export default function Footer() {
  const currentYear = new Date().getFullYear();
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
    const onUpdated = () => {
      void loadPublicPanduan();
    };
    window.addEventListener("panduan-updated", onUpdated);
    return () => {
      active = false;
      window.removeEventListener("panduan-updated", onUpdated);
    };
  }, []);

  const navigationMenus = [
    { label: "Home", href: "/#home", icon: HiHome },
    { label: "Profil", href: "/#profil", icon: HiUser },
    { label: "Formasi", href: "/#formasi", icon: HiClipboardList },
    { label: "Manfaat", href: "/#manfaat", icon: HiGift },
    { label: "Peraturan", href: "/#peraturan", icon: HiDocumentText },
    {
      label: "Panduan",
      href: panduanHref,
      icon: HiExternalLink,
      external: true,
    },
  ];

  const socialLinks = [
    {
      icon: FaGlobe,
      href: "https://palembang.pom.go.id/",
      label: "Website Resmi BPOM Palembang",
    },
    {
      icon: FaFacebookF,
      href: "https://www.facebook.com/bpom.plg/",
      label: "Facebook BBPOM Palembang",
    },
    {
      icon: FaInstagram,
      href: "https://www.instagram.com/bpom.palembang/",
      label: "Instagram @bpom.palembang",
    },
    {
      icon: FaYoutube,
      href: "https://www.youtube.com/@bbpom_palembang",
      label: "YouTube BBPOM Palembang",
    },
  ];

  return (
    <footer
      className={`${plusJakarta.className} w-full mt-12 sm:mt-16 relative overflow-hidden bg-linear-to-br from-[#071531] via-[#0B1B3D] to-[#08306B] text-white border-t border-sky-400/20 shadow-xl`}
    >
      {/* ================= AMBIENT LIGHTING ================= */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#0088FF]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-sky-400/15 blur-3xl" />

      {/* ================= CONTAINER ================= */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
        
        {/* ================= 3 COLUMNS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6 lg:gap-8 items-start">
          
          {/* KOLOM 1: SITANJAK BRAND */}
          <div className="md:col-span-12 lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/#home"
                className="inline-block transition-transform hover:scale-105 shrink-0"
              >
                <Image
                  src="/images/icons/sitanjak.png"
                  alt="Logo SITANJAK"
                  width={56}
                  height={56}
                  priority
                  className="h-12 w-auto object-contain drop-shadow-xs"
                />
              </Link>
              <div className="flex flex-col items-center sm:items-start">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#0088FF]/20 border border-sky-400/30 text-sky-300">
                  <HiShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                  Portal Magang Resmi
                </span>
                <h2 className="text-sm font-bold text-white mt-1 leading-snug">
                  Sistem Informasi Tahapan dan Jangkauan Magang Akademik
                </h2>
              </div>
            </div>

            <p className="text-xs text-slate-300 italic mt-2 text-center lg:text-left">
              &ldquo;Menghubungkan Potensi, Membangun Masa Depan.&rdquo;
            </p>
          </div>

          {/* DIVIDER MOBILE 1 */}
          <div className="w-full h-px bg-white/10 md:hidden" />

          {/* KOLOM 2: NAVIGASI CEPAT */}
          <div className="md:col-span-5 lg:col-span-3 flex flex-col items-center md:items-start w-full">
            <h3 className="font-bold text-xs uppercase tracking-wider text-sky-300 mb-2.5 self-center md:self-start">
              Jelajahi
            </h3>

            {/* Grid 3 Kolom di Mobile, 2 Kolom di Tablet/Desktop */}
            <ul className="grid grid-cols-3 sm:grid-cols-2 gap-2 w-full text-xs">
              {navigationMenus.map((menu, i) => (
                <li key={i}>
                  {menu.external ? (
                    <a
                      href={menu.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="
                        flex items-center justify-center md:justify-start gap-1.5
                        px-2 py-1.5 rounded-lg
                        bg-white/5 md:bg-transparent hover:bg-white/15 md:hover:bg-transparent
                        text-white/90 hover:text-sky-300
                        transition-colors font-medium text-center md:text-left
                      "
                    >
                      <menu.icon size={13} className="shrink-0 text-[#38BDF8]" />
                      <span className="truncate">{menu.label}</span>
                    </a>
                  ) : (
                    <Link
                      href={menu.href}
                      className="
                        flex items-center justify-center md:justify-start gap-1.5
                        px-2 py-1.5 rounded-lg
                        bg-white/5 md:bg-transparent hover:bg-white/15 md:hover:bg-transparent
                        text-white/90 hover:text-sky-300
                        transition-colors font-medium text-center md:text-left
                      "
                    >
                      <menu.icon size={13} className="shrink-0 text-[#38BDF8]" />
                      <span className="truncate">{menu.label}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* DIVIDER MOBILE 2 */}
          <div className="w-full h-px bg-white/10 md:hidden" />

          {/* KOLOM 3: INSTANSI & KONTAK */}
          <div className="md:col-span-7 lg:col-span-4 flex flex-col items-center md:items-end text-center md:text-right w-full">
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-xl bg-white border border-white/20 shrink-0">
                <Image
                  src="/images/footer/BPOM.png"
                  alt="Logo Badan POM"
                  width={36}
                  height={36}
                  className="h-8 w-8 object-contain"
                />
              </div>
              <div className="text-left md:text-right">
                <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">
                  Balai Besar POM di Palembang
                </h3>
                <p className="text-[11px] text-slate-300">
                  Jl. Pangeran Ratu, 5 Ulu, Kota Palembang 30254
                </p>
              </div>
            </div>

            {/* Kontak Ringkas (Telepon & Email) */}
            <div className="mt-2.5 flex flex-wrap items-center justify-center md:justify-end gap-2 text-xs text-white/90">
              <a
                href="tel:0711510195"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#0088FF]/30 border border-white/10 transition-colors"
              >
                <HiPhone className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                <span>(0711) 510195</span>
              </a>
              <a
                href="mailto:bpom_palembang@pom.go.id"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#0088FF]/30 border border-white/10 transition-colors"
              >
                <HiMail className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                <span>bpom_palembang@pom.go.id</span>
              </a>
            </div>

            {/* Social Media Buttons (Touch Friendly) */}
            <div className="flex items-center gap-2 mt-3 justify-center md:justify-end">
              {socialLinks.map((soc, idx) => (
                <a
                  key={idx}
                  href={soc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={soc.label}
                  title={soc.label}
                  className="
                    w-8 h-8 rounded-lg bg-white/10 hover:bg-[#0088FF] hover:text-white
                    border border-white/15 hover:border-[#38BDF8]
                    text-white backdrop-blur-md
                    flex items-center justify-center
                    hover:scale-105 active:scale-95
                    transition-all duration-150
                  "
                >
                  <soc.icon size={14} />
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* ================= DIVIDER ================= */}
        <div className="w-full h-px bg-white/15 my-4 sm:my-5" />

        {/* ================= BOTTOM BAR ================= */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11px] sm:text-xs text-slate-300">
          <p className="text-center sm:text-left leading-relaxed">
            © {currentYear} <span className="font-semibold text-white">SITANJAK V2.0</span> • BBPOM di Palembang. Hak Cipta Dilindungi.
          </p>

          <Link
            href="/aboutdev"
            className="
              inline-flex items-center gap-1.5 px-3 py-1 rounded-full
              bg-white/10 hover:bg-[#0088FF]/30 border border-white/15
              text-white/90 hover:text-sky-200
              transition-colors group
            "
          >
            <span>Dikembangkan oleh</span>
            <strong className="font-semibold underline">Tim Pengembang</strong>
            <HiHeart className="w-3 h-3 text-rose-400 group-hover:scale-125 transition-transform" />
          </Link>
        </div>

      </div>
    </footer>
  );
}
