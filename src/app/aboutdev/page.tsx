"use client";

import { FaLinkedin, FaGithub } from "react-icons/fa";
import Link from "next/link";
import { HiArrowLeft } from "react-icons/hi";

export default function TentangKami() {
  const team = [
    {
      name: "Nama Developer 1",
      photo:
        "https://images.unsplash.com/photo-1603415526960-f7e0328a5f58?q=80&w=400",
      headline: "Berperan dalam pengembangan dan optimalisasi fitur sistem untuk mendukung pengelolaan Program Magang.",
      linkedin: "https://linkedin.com/in/username1",
      github: "https://github.com/username1",
    },
    {
      name: "Nama Developer 2",
      photo:
        "https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=400",
      headline: "Berkontribusi dalam perancangan dan pengembangan antarmuka sistem SITANJAK.",
      linkedin: "https://linkedin.com/in/username2",
      github: "https://github.com/username2",
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-linear-to-br from-[#FFF8F2] via-[#FFF1E6] to-[#FFE4C7] px-6 py-20">

      {/* Soft Glow Background */}
      <div className="absolute -top-40 -left-40 w-125 h-125 bg-[#7F1D1D]/10 rounded-full blur-[140px]" />
      <div className="absolute -bottom-40 -right-40 w-125 h-125 bg-[#F59E0B]/20 rounded-full blur-[140px]" />

      {/* BUTTON KEMBALI */}
      <Link
        href="/"
        className="
          absolute top-6 left-6 z-20
          inline-flex items-center gap-2
          px-4 py-2
          rounded-xl
          bg-white/80 backdrop-blur-md
          border border-[#7F1D1D]/20
          text-[#7F1D1D]
          font-medium text-sm
          shadow-md
          hover:bg-[#7F1D1D]
          hover:text-white
          hover:shadow-lg
          transition-all duration-300
        "
      >
        <HiArrowLeft className="text-lg" />
        Kembali ke Beranda
      </Link>

      {/* HEADER */}
      <div className="relative text-center mb-20">
        <h1 className="
          text-4xl md:text-5xl
          font-extrabold
          leading-tight
          pt-2
          bg-linear-to-r
          from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
          bg-clip-text text-transparent
        ">
          Tim Pengembang Sistem
        </h1>
        <p className="mt-6 text-gray-600 max-w-2xl mx-auto leading-relaxed text-base md:text-lg">
          SITANJAK dikembangkan untuk menghadirkan sistem pengelolaan Program Magang
          yang terstruktur, transparan, dan berbasis digital.
        </p>

        <p className="mt-4 text-gray-500 max-w-2xl mx-auto leading-relaxed text-sm md:text-base">
          Pengembangan sistem ini dilakukan oleh tim pengembang yang berfokus pada
          kualitas implementasi, serta kemudahan penggunaan bagi seluruh pengguna.
        </p>
      </div>

      {/* TEAM GRID */}
      <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-12">

        {team.map((dev, i) => (
          <div
            key={i}
            className="
              group
              relative
              rounded-3xl
              bg-white/70
              backdrop-blur-2xl
              border border-white/60
              shadow-[0_25px_70px_-20px_rgba(0,0,0,0.25)]
              p-10
              transition-all duration-500
              hover:-translate-y-4
              hover:shadow-[0_35px_90px_-15px_rgba(0,0,0,0.35)]
            "
          >

            {/* Hover Glow */}
            <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-[#FACC15]/20 to-[#7F1D1D]/20 opacity-0 group-hover:opacity-100 transition duration-500" />

            <div className="relative text-center">

              {/* Avatar */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <img
                    src={dev.photo}
                    alt={dev.name}
                    className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl"
                  />
                  <div className="absolute inset-0 rounded-full bg-linear-to-tr from-[#7F1D1D]/20 to-[#F59E0B]/20 blur-md opacity-0 group-hover:opacity-100 transition duration-500" />
                </div>
              </div>

              {/* Name */}
              <h2 className="text-2xl font-bold text-[#7F1D1D]">
                {dev.name}
              </h2>

              {/* Headline */}
              <p className="mt-4 text-gray-600 text-sm md:text-base leading-relaxed">
                {dev.headline}
              </p>

              {/* Divider */}
              <div className="w-16 h-1 mx-auto bg-linear-to-r from-[#7F1D1D] to-[#F59E0B] rounded-full my-6" />

              {/* Social Links */}
              <div className="flex justify-center gap-4">
                <a
                  href={dev.linkedin}
                  target="_blank"
                  className="
                    flex items-center gap-2
                    px-5 py-2.5
                    rounded-xl
                    bg-[#0077B5]
                    text-white
                    font-medium
                    shadow-md
                    hover:scale-105
                    transition
                  "
                >
                  <FaLinkedin />
                  LinkedIn
                </a>

                <a
                  href={dev.github}
                  target="_blank"
                  className="
                    flex items-center gap-2
                    px-5 py-2.5
                    rounded-xl
                    bg-[#24292F]
                    text-white
                    font-medium
                    shadow-md
                    hover:scale-105
                    transition
                  "
                >
                  <FaGithub />
                  GitHub
                </a>
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div className="relative mt-24 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} SITANJAK - Sistem Informasi Tahapan dan Jangkauan Magang Akademik
      </div>
    </div>
  );
}