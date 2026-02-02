"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  HiMenu,
  HiX,
  HiOutlineLogin,
  HiUserAdd,
  HiDownload,
} from "react-icons/hi";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [hide, setHide] = useState(false);
  const [lastY, setLastY] = useState(0);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;

      if (currentY > lastY && currentY > 80) {
        setHide(true);
      } else {
        setHide(false);
      }

      setLastY(currentY);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [lastY]);

  // ===============================
  // 🔥 FUNGSI SCROLL + ANIMASI
  // ===============================
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;

    const yOffset = -120;
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;

    window.scrollTo({
      top: y,
      behavior: "smooth",
    });

    setOpen(false);
  };

  // ===============================
  // 📥 FUNGSI DOWNLOAD PDF dari public/pdf/
  // ===============================
  const handleDownloadPanduan = () => {
    setDownloading(true);

    // Nama file PDF yang ada di public/pdf/
    const fileName = "Panduan_Pendaftaran_SIMAGGO_2024.pdf";

    // Path ke file di public folder
    const fileUrl = `/pdf/${fileName}`;

    // Membuat link untuk download
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Simulasi loading untuk UX
    setTimeout(() => {
      setDownloading(false);
    }, 500);
  };

  return (
    <header
      className={`
        fixed left-0 right-0 top-0
        z-100
        flex justify-center
        transition-transform duration-500 ease-in-out
        ${hide ? "-translate-y-[140%]" : "translate-y-4"}
      `}
    >
      <nav
        className="
          max-w-6xl w-full
          mx-4
          bg-linear-to-r from-[#D4AF37] via-[#B91C1C] to-[#7F1D1D]
          backdrop-blur-xl
          rounded-full shadow-xl
          px-6 py-3
          flex items-center justify-between
        "
      >
        {/* LOGO */}
        <div className="flex items-center gap-3">
          <Image
            src="/images/icons/sitanjak.png"
            alt="Sitanjak Logo"
            width={70}
            height={70}
            className="rounded-full"
          />
        </div>

        {/* MENU DESKTOP */}
        <ul className="hidden md:flex gap-6 text-white font-semibold">
          {[
            { label: "Home", id: "home" },
            { label: "Profil", id: "profil" },
            { label: "Formasi", id: "formasi" },
            { label: "Manfaat", id: "manfaat" },
            { label: "Peraturan", id: "peraturan" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="hover:text-[#FFE08A] hover:-translate-y-px hover:scale-105 transition"
            >
              {item.label}
            </button>
          ))}

          {/* PANGGILAN PANDUAN */}
          <a
            href="https://docs.google.com/document/d/1d43jgfTZYD1oT6ePshn8NyMfkXxPQ7aGAePx3qDJ-9I/edit?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-[#FFE08A] hover:-translate-y-px hover:scale-105 transition"
          >
            Panduan Pendaftaran
          </a>
        </ul>

        {/* AUTH */}
        <div className="hidden md:flex gap-3">
          <Link
            href="/auth/login"
            className="flex items-center gap-2 text-white/90 hover:text-[#FFE08A] transition font-semibold"
          >
            <HiOutlineLogin /> Login
          </Link>
          <Link
            href="/pendaftaran"
            className="flex items-center gap-2 bg-[#FACC15] text-[#4A2C00] px-4 py-1.5 rounded-full hover:bg-[#EAB308] hover:text-white/70 hover:shadow-md transition font-semibold"
          >
            <HiUserAdd /> Daftar
          </Link>
        </div>

        {/* MOBILE BUTTON */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-white text-3xl"
        >
          {open ? <HiX /> : <HiMenu />}
        </button>
      </nav>

      {/* MOBILE MENU */}
      {open && (
        <div className="absolute top-22.5 w-[90%] bg-linear-to-r from-[#D4AF37] via-[#B91C1C] to-[#7F1D1D] rounded-2xl p-6 text-white shadow-xl">
          <ul className="flex flex-col space-y-4 font-semibold">
            {[
              { label: "Home", id: "home" },
              { label: "Profil", id: "profil" },
              { label: "Formasi", id: "formasi" },
              { label: "Manfaat", id: "manfaat" },
              { label: "Peraturan", id: "peraturan" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-left transition hover:text-[#FFE08A] hover:pl-2"
              >
                {item.label}
              </button>
            ))}

            {/* PANGGILAN PANDUAN - MOBILE */}
            <a
              href="https://docs.google.com/document/d/1d43jgfTZYD1oT6ePshn8NyMfkXxPQ7aGAePx3qDJ-9I/edit?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-left transition hover:text-[#FFE08A] hover:pl-2"
            >
              Panduan Pendaftaran
            </a>
          </ul>

          <div className="flex space-x-3 mt-6">
            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-2 border border-white px-4 py-2 rounded-md w-full hover:bg-white hover:text-[#7F1D1D] transition font-semibold"
            >
              <HiOutlineLogin size={18} />
              Login
            </Link>

            <Link
              href="/pendaftaran"
              className="flex items-center justify-center gap-2 bg-[#FACC15] px-4 py-2 rounded-md w-full text-[#4A2C00] hover:bg-[#EAB308] hover:text-white transition font-semibold"
            >
              <HiUserAdd size={18} />
              Daftar
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
