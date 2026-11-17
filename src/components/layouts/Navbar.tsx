"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { plusJakarta, caveat } from '@/lib/font';
import { useState, useEffect } from "react";
import { HiMenu, HiX } from "react-icons/hi";



const navItems = [
  { label: "Home", id: "home" },
  { label: "Profil", id: "profil" },
  { label: "Formasi", id: "formasi" },
  { label: "Manfaat", id: "manfaat" },
  { label: "Peraturan", id: "peraturan" },
];

export default function Navbar() {
  const pathname = usePathname();
  const isPendaftaran = pathname === "/pendaftaran" || pathname?.startsWith("/pendaftaran/");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState("home");

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 20);

      if (isPendaftaran) return;

      // Scroll spy untuk otomatis update menu aktif saat di-scroll
      const sectionIds = ["peraturan", "manfaat", "formasi", "profil", "home"];
      for (const sId of sectionIds) {
        if (sId === "home") {
          if (scrollY < 300) {
            setActiveId("home");
            break;
          }
        } else {
          const el = document.getElementById(sId);
          if (el) {
            let top = 0;
            let current: HTMLElement | null = el as HTMLElement;
            while (current) {
              top += current.offsetTop;
              current = current.offsetParent as HTMLElement | null;
            }
            if (scrollY >= top - 150) {
              setActiveId(sId);
              break;
            }
          }
        }
      }
    };

    // Deteksi hash URL saat komponen mount / redirect dari halaman lain (misal /#profil)
    const handleHashAndInit = () => {
      if (typeof window === "undefined") return;

      const hash = window.location.hash.replace("#", "");
      if (hash && ["profil", "formasi", "manfaat", "peraturan", "home"].includes(hash)) {
        setActiveId(hash);
        setTimeout(() => {
          const el = document.getElementById(hash);
          if (el) {
            let top = 0;
            let current: HTMLElement | null = el as HTMLElement;
            while (current) {
              top += current.offsetTop;
              current = current.offsetParent as HTMLElement | null;
            }
            const targetY = top || (el.getBoundingClientRect().top + window.scrollY);
            window.scrollTo({
              top: targetY,
              behavior: "smooth",
            });
          }
        }, 100);
      } else {
        onScroll();
      }
    };

    handleHashAndInit();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("hashchange", handleHashAndInit);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hashchange", handleHashAndInit);
    };
  }, [pathname, isPendaftaran]);

  // ===============================
  // 🔥 FUNGSI SCROLL + ANIMASI
  // ===============================
  const scrollToSection = (id: string) => {
    setActiveId(id);

    if (id === "home") {
      if (pathname !== "/") {
        window.location.href = "/";
        return;
      }
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      setOpen(false);
      return;
    }

    const el = document.getElementById(id);
    if (!el) {
      window.location.href = `/#${id}`;
      return;
    }

    // Hitung posisi absolut elemen dari atas dokumen (bebas distorsi CSS transform)
    let top = 0;
    let current: HTMLElement | null = el as HTMLElement;
    while (current) {
      top += current.offsetTop;
      current = current.offsetParent as HTMLElement | null;
    }

    const targetY = top || (el.getBoundingClientRect().top + window.scrollY);

    window.scrollTo({
      top: targetY,
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
        transition-all duration-300 ease-in-out
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
            const isActive = !isPendaftaran && activeId === item.id;
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
              w-28 py-2 rounded-full
              border-[1.8px] border-[#0088FF]
              text-[#0B1B3D] font-bold text-sm
              flex items-center justify-center
              hover:bg-[#0088FF]/5
              transition
            "
          >
            Login
          </Link>
          {isPendaftaran ? (
            <Link
              href="/"
              className="
                w-28 py-2 rounded-full
                border-[1.8px] border-[#0088FF]
                bg-[#0088FF] text-white
                font-bold text-sm
                flex items-center justify-center
                shadow-md shadow-[#0088FF]/25
                hover:bg-[#0073E6] hover:border-[#0073E6] hover:shadow-lg
                transition
              "
            >
              Home
            </Link>
          ) : (
            <Link
              href="/pendaftaran"
              className="
                w-28 py-2 rounded-full
                border-[1.8px] border-[#0088FF]
                bg-[#0088FF] text-white
                font-bold text-sm
                flex items-center justify-center
                shadow-md shadow-[#0088FF]/25
                hover:bg-[#0073E6] hover:border-[#0073E6] hover:shadow-lg
                transition
              "
            >
              Daftar
            </Link>
          )}
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
              const isActive = !isPendaftaran && activeId === item.id;
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

            {isPendaftaran ? (
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center border-[1.8px] border-[#0088FF] bg-[#0088FF] text-white px-4 py-2.5 rounded-full w-full hover:bg-[#0073E6] hover:border-[#0073E6] shadow-md shadow-[#0088FF]/25 transition font-bold text-sm"
              >
                Home
              </Link>
            ) : (
              <Link
                href="/pendaftaran"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center border-[1.8px] border-[#0088FF] bg-[#0088FF] text-white px-4 py-2.5 rounded-full w-full hover:bg-[#0073E6] hover:border-[#0073E6] shadow-md shadow-[#0088FF]/25 transition font-bold text-sm"
              >
                Daftar
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
