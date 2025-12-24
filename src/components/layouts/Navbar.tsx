"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { HiMenu, HiX, HiOutlineLogin, HiUserAdd } from "react-icons/hi";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [hide, setHide] = useState(false);
  const [lastY, setLastY] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;

      // Scroll ke bawah → sembunyikan
      if (currentY > lastY && currentY > 80) {
        setHide(true);
      }
      // Scroll ke atas → tampilkan
      else {
        setHide(false);
      }

      setLastY(currentY);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [lastY]);

  return (
    <header
      className={`
        fixed left-0 right-0 top-0
        z-[100]
        flex justify-center
        transition-transform duration-500 ease-in-out
        ${hide ? "-translate-y-[140%]" : "translate-y-4"}
      `}
    >
      <nav
        className="
          max-w-6xl w-full
          mx-4
          bg-gradient-to-r from-blue-500 via-cyan-600 to-emerald-500
          backdrop-blur-xl
          rounded-full shadow-xl
          px-6 py-3
          flex items-center justify-between
        "
      >
        {/* LOGO */}
        <Image
          src="/images/icons/SIMAGGO.png"
          alt="SIMAGGO Logo"
          width={70}
          height={70}
          className="rounded-full"
        />

        {/* MENU DESKTOP */}
        <ul className="hidden md:flex gap-6 text-white font-semibold">
          {[
            { label: "Home", href: "/#home" },
            { label: "Profil", href: "/#profil" },
            { label: "Formasi", href: "/#formasi" },
            { label: "Manfaat", href: "/#manfaat" },
            { label: "Peraturan", href: "/#peraturan" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-blue-900 hover:scale-105 transition"
            >
              {item.label}
            </Link>
          ))}
        </ul>

        {/* AUTH */}
        <div className="hidden md:flex gap-3">
          <Link href="/auth/login" className="flex items-center gap-2 text-white/90 hover:text-blue-900 transition font-semibold">
            <HiOutlineLogin /> Login
          </Link>
          <Link
            href="/pendaftaran"
            className="flex items-center gap-2 bg-emerald-300/90 text-blue-900 px-4 py-1.5 rounded-md hover:bg-white hover:text-blue-700 hover:shadow-md transition font-semibold"
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
        <div className="absolute top-[90px] w-[90%] bg-gradient-to-b from-blue-500/95 via-teal-400/95 to-emerald-300/95 rounded-2xl p-6 text-white shadow-xl">
          <ul className="flex flex-col space-y-4 font-semibold">
            {[
              { label: "Home", href: "/#home" },
              { label: "Profil", href: "/#profil" },
              { label: "Formasi", href: "/#formasi" },
              { label: "Manfaat", href: "/#manfaat" },
              { label: "Peraturan", href: "/#peraturan" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="transition hover:text-blue-900 hover:pl-2"
              >
                {item.label}
              </Link>
            ))}
          </ul>

          <div className="flex space-x-3 mt-6">
            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-2 border border-white px-4 py-2 rounded-md w-full hover:bg-white hover:text-blue-600 transition font-semibold">
                <HiOutlineLogin size={18} />
                Login
            </Link>

            <Link
              href="/pendaftaran"
              className="flex items-center justify-center gap-2 bg-white px-4 py-2 rounded-md w-full text-blue-700 hover:bg-blue-700 hover:text-white transition font-semibold">
                <HiUserAdd size={18}/>
                Daftar
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}