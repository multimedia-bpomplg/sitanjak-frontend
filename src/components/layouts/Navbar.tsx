"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import { useState, useEffect } from "react";
import { HiMenu, HiX } from "react-icons/hi";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const navItems = [
  { label: "Home", id: "home" },
  { label: "Profil", id: "profil" },
  { label: "Formasi", id: "formasi" },
  { label: "Manfaat", id: "manfaat" },
  { label: "Peraturan", id: "peraturan" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [hide, setHide] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lastY, setLastY] = useState(0);
  const [activeId, setActiveId] = useState("home");

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;

      setScrolled(currentY > 20);

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
    setActiveId(id);
    const el = document.getElementById(id);
    if (!el) {
      window.location.href = id === "home" ? "/" : `/#${id}`;
      return;
    }

    const yOffset = -100;
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;

    window.scrollTo({
      top: y,
      behavior: "smooth",
    });

    setOpen(false);
  };

  return (
    <header
      className={`
        ${plusJakarta.className}
        fixed left-0 right-0 top-0
        z-100
        flex justify-center
        transition-all duration-500 ease-in-out
        ${hide ? "-translate-y-full" : "translate-y-0"}
        ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-white"}
      `}
    >
      <nav
        className="
          max-w-7xl w-full
          px-6 lg:px-12 py-4
          flex items-center justify-between
        "
      >
        {/* LOGO */}
        <button
          onClick={() => scrollToSection("home")}
          className="flex items-center gap-3 text-left focus:outline-none"
        >
          <Image
            src="/images/icons/sitanjak.png"
            alt="Sitanjak Logo"
            width={56}
            height={56}
            className="object-contain"
          />
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-wide text-[#0B1B3D] leading-none">
              SI TANJAK
            </span>
            <span className="text-[11px] font-medium tracking-[0.22em] text-[#475569] mt-1">
              BBPOM PALEMBANG
            </span>
          </div>
        </button>

        {/* MENU DESKTOP */}
        <ul className="hidden lg:flex items-center gap-8 text-[15px] font-normal">
          {navItems.map((item) => {
            const isActive = activeId === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => scrollToSection(item.id)}
                  className={`
                    relative py-1.5 transition-colors duration-200
                    ${
                      isActive
                        ? "text-[#0088FF] font-medium"
                        : "text-[#0B1B3D] hover:text-[#0088FF]"
                    }
                  `}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-[#0088FF] rounded-full" />
                  )}
                </button>
              </li>
            );
          })}

          {/* PANGGILAN PANDUAN */}
          <li>
            <a
              href="https://docs.google.com/document/d/1d43jgfTZYD1oT6ePshn8NyMfkXxPQ7aGAePx3qDJ-9I/edit?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 text-[#0B1B3D] hover:text-[#0088FF] transition-colors duration-200"
            >
              Panduan Pendaftaran
            </a>
          </li>
        </ul>

        {/* AUTH DESKTOP */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/auth/login"
            className="
              px-7 py-2 rounded-full
              border-[1.8px] border-[#0088FF]
              text-[#0B1B3D] font-bold text-sm
              hover:bg-[#0088FF]/5
              transition
            "
          >
            Login
          </Link>
          <Link
            href="/pendaftaran"
            className="
              px-7 py-2 rounded-full
              bg-[#0088FF] text-white
              font-bold text-sm
              shadow-md shadow-[#0088FF]/25
              hover:bg-[#0073E6] hover:shadow-lg
              transition
            "
          >
            Daftar
          </Link>
        </div>

        {/* MOBILE BUTTON */}
        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden text-[#0B1B3D] text-3xl focus:outline-none"
          aria-label="Toggle Menu"
        >
          {open ? <HiX /> : <HiMenu />}
        </button>
      </nav>

      {/* MOBILE MENU */}
      {open && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-t border-slate-100 px-6 py-6 shadow-xl">
          <ul className="flex flex-col space-y-4 font-normal text-[#0B1B3D]">
            {navItems.map((item) => {
              const isActive = activeId === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => scrollToSection(item.id)}
                    className={`text-left w-full py-1 transition ${
                      isActive
                        ? "text-[#0088FF] font-medium"
                        : "hover:text-[#0088FF]"
                    }`}
                  >
                    {item.label}
                  </button>
                </li>
              );
            })}

            {/* PANGGILAN PANDUAN - MOBILE */}
            <li>
              <a
                href="https://docs.google.com/document/d/1d43jgfTZYD1oT6ePshn8NyMfkXxPQ7aGAePx3qDJ-9I/edit?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="block py-1 text-left transition hover:text-[#0088FF]"
              >
                Panduan Pendaftaran
              </a>
            </li>
          </ul>

          <div className="flex gap-3 mt-6">
            <Link
              href="/auth/login"
              className="flex items-center justify-center border-[1.8px] border-[#0088FF] text-[#0B1B3D] px-4 py-2.5 rounded-full w-full hover:bg-[#0088FF]/5 transition font-bold text-sm"
            >
              Login
            </Link>

            <Link
              href="/pendaftaran"
              className="flex items-center justify-center bg-[#0088FF] text-white px-4 py-2.5 rounded-full w-full hover:bg-[#0073E6] shadow-md shadow-[#0088FF]/25 transition font-bold text-sm"
            >
              Daftar
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
