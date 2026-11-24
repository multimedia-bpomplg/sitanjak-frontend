"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { HiArrowUpRight, HiCodeBracket, HiPaintBrush, HiStar } from "react-icons/hi2";

interface SocialItem {
  label: string;
  href: string;
  icon: string;
}

interface DeveloperProfile {
  name: string;
  initials: string;
  role: string;
  roleType: "code" | "design";
  bio: string;
  photo: string;
  socials: SocialItem[];
}

const TEAM_MEMBERS: DeveloperProfile[] = [
  {
    name: "Riski Abdoli",
    initials: "Abdoli",
    role: "Full Stack Developer",
    roleType: "code",
    bio: "Pengembang aplikasi web dan mobile yang berfokus pada pengembangan solusi digital yang inovatif dan efisien.",
    photo: "/images/team/abdoli.jpeg",
    socials: [
      {
        label: "GitHub Riski Abdoli",
        href: "https://github.com/riskiabdoli000/",
        icon: "/images/assets-new/sosial-media/github.png",
      },
      {
        label: "LinkedIn Riski Abdoli",
        href: "https://www.instagram.com/riskiabdoli/",
        icon: "/images/assets-new/sosial-media/linkedin.png",
      },
      {
        label: "Instagram Riski Abdoli",
        href: "https://www.linkedin.com/in/riski-abdoli/",
        icon: "/images/assets-new/sosial-media/instagram.png",
      },
    ],
  },
  {
    name: "Fatreisya Ayu Miranda",
    initials: "Tea",
    role: "UI/UX Designer",
    roleType: "design",
    bio: "Desainer UI/UX yang berfokus pada pengalaman pengguna terbaik dengan desain yang modern dan interaktif.",
    photo: "/images/team/fototea.jpg",
    socials: [
      {
        label: "GitHub Fatreisya Ayu Miranda",
        href: "https://github.com/",
        icon: "/images/assets-new/sosial-media/github.png",
      },
      {
        label: "LinkedIn Fatreisya Ayu Miranda",
        href: "https://www.linkedin.com/in/fatreisya/",
        icon: "/images/assets-new/sosial-media/linkedin.png",
      },
      {
        label: "Instagram Fatreisya Ayu Miranda",
        href: "https://www.instagram.com/fatreisyaa/",
        icon: "/images/assets-new/sosial-media/instagram.png",
      },
    ],
  },
];

/**
 * Framed developer portrait with blue abstract wave backdrop and clean fallback
 * when the image asset slot has not been populated yet.
 */
function DeveloperPortrait({
  src,
  alt,
  initials,
}: {
  src: string;
  alt: string;
  initials: string;
}) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative w-44 h-48 sm:w-[180px] sm:h-[200px] lg:w-[176px] lg:h-[196px] shrink-0 rounded-[20px] overflow-hidden bg-gradient-to-br from-[#0B84FF] via-[#0565E8] to-[#0041A8] shadow-inner select-none">
      {/* Decorative inner waves */}
      <svg
        viewBox="0 0 200 220"
        fill="none"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <path
          d="M-10 140 C40 105, 110 165, 210 120 L210 230 L-10 230 Z"
          fill="#003E9C"
          fillOpacity="0.45"
        />
        <path
          d="M-10 165 C55 135, 130 190, 210 150 L210 230 L-10 230 Z"
          fill="#2CA2FF"
          fillOpacity="0.28"
        />
        <circle cx="165" cy="34" r="38" fill="#60B6FF" fillOpacity="0.16" />
      </svg>

      {!hasError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className="relative z-10 w-full h-full object-cover object-top"
        />
      ) : (
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-white/95 px-3 text-center">
          <div className="w-16 h-16 rounded-full bg-white/15 border border-white/30 backdrop-blur-sm flex items-center justify-center text-xl font-bold tracking-wider shadow-md">
            {initials}
          </div>
          <span className="mt-2.5 text-[11px] font-medium text-sky-100/90 leading-tight">
            Slot Foto
          </span>
          <span className="text-[10px] text-sky-200/75 break-all mt-0.5">
            {src}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Second-generation developer showcase page (`/aboutdev-v2`) featuring
 * SITANJAK branding, modern blue-accented developer cards, and layered wave footer.
 */
export default function AboutDevV2Page() {
  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col bg-gradient-to-b from-[#F4F8FF] via-white to-[#EDF4FF] text-[#0B1B3D] relative overflow-x-hidden">
      {/* Subtle geometric background accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* Top-left diagonal ribbons */}
        <div className="hidden sm:block absolute top-14 -left-24 w-72 h-24 bg-gradient-to-r from-[#0A57C7] to-[#2E8EFF] -rotate-[38deg] opacity-90" />
        <div className="hidden sm:block absolute top-24 -left-16 w-72 h-16 bg-gradient-to-r from-[#66B2FF]/45 to-transparent -rotate-[38deg]" />

        {/* Top-right diagonal ribbons */}
        <div className="hidden sm:block absolute top-12 -right-24 w-72 h-24 bg-gradient-to-l from-[#0A57C7] to-[#2E8EFF] rotate-[38deg] opacity-90" />
        <div className="hidden sm:block absolute top-24 -right-16 w-72 h-16 bg-gradient-to-l from-[#66B2FF]/45 to-transparent rotate-[38deg]" />

        {/* Left & right dot-grid matrices */}
        <div
          className="hidden md:block absolute top-44 left-10 lg:left-24 w-28 h-16 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(#9BC4FA 2px, transparent 2px)",
            backgroundSize: "14px 14px",
          }}
        />
        <div
          className="hidden md:block absolute top-48 right-10 lg:right-24 w-28 h-16 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(#9BC4FA 2px, transparent 2px)",
            backgroundSize: "14px 14px",
          }}
        />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-20 shrink-0 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-[0_2px_12px_rgba(11,27,61,0.04)]">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0 group">
            <Image
              src="/images/icons/sitanjak.png"
              alt="Logo SITANJAK"
              width={42}
              height={42}
              className="w-8 h-8 sm:w-[42px] sm:h-[42px] shrink-0 object-contain transition-transform duration-200 group-hover:scale-105"
              priority
            />
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] sm:text-lg font-extrabold tracking-wide text-[#0B1B3D] leading-none whitespace-nowrap">
                SI TANJAK
              </span>
              <span className="text-[8.5px] sm:text-[11px] font-medium tracking-[0.08em] sm:tracking-[0.2em] text-[#475569] mt-0.5 sm:mt-1 whitespace-nowrap">
                BBPOM PALEMBANG
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2 rounded-full bg-[#0D3B6E] hover:bg-[#0066E0] text-white text-[11px] sm:text-sm font-semibold shadow-sm hover:shadow transition-all duration-200"
          >
            <HiArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </header>

      {/* Main Showcase Content */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-4 flex flex-col justify-center">
        {/* Hero Header */}
        <section className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl lg:text-[38px] font-extrabold tracking-tight text-[#0B1B3D]">
            Tim <span className="text-[#0B6BFF]">Pengembang</span>
          </h1>
          <p className="mt-2.5 lg:mt-2 text-sm sm:text-base text-[#475569] leading-relaxed px-2">
            Dibalik inovasi dan teknologi, terdapat tim pengembang yang selalu
            berkomitmen untuk memberikan solusi terbaik.
          </p>

          {/* Divider with code icon */}
          <div className="mt-4 lg:mt-3.5 flex items-center justify-center gap-3">
            <span className="h-px w-16 sm:w-24 bg-gradient-to-r from-transparent to-[#7FB5FA]" />
            <HiCodeBracket className="w-5 h-5 text-[#0B6BFF]" />
            <span className="h-px w-16 sm:w-24 bg-gradient-to-l from-transparent to-[#7FB5FA]" />
          </div>
        </section>

        {/* Developer Cards Grid */}
        <section
          aria-label="Profil Tim Pengembang"
          className="mt-8 lg:mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-7"
        >
          {TEAM_MEMBERS.map((member) => (
            <article
              key={member.name}
              className="bg-white/95 rounded-[24px] p-5 shadow-[0_14px_40px_-10px_rgba(11,107,255,0.14)] border border-blue-100/80 flex flex-col sm:flex-row items-center gap-5 sm:gap-6 hover:-translate-y-1 hover:shadow-[0_18px_46px_-10px_rgba(11,107,255,0.2)] transition-all duration-300"
            >
              <DeveloperPortrait
                src={member.photo}
                alt={`Foto ${member.name}`}
                initials={member.initials}
              />

              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1B3D] tracking-tight">
                  {member.name}
                </h2>

                <div className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#0B7BFF] to-[#0057D9] text-white text-xs font-semibold shadow-sm">
                  {member.roleType === "code" ? (
                    <HiCodeBracket className="w-3.5 h-3.5" />
                  ) : (
                    <HiPaintBrush className="w-3.5 h-3.5" />
                  )}
                  <span>{member.role}</span>
                </div>

                <p className="mt-3 text-[13px] sm:text-sm text-[#475569] leading-relaxed">
                  {member.bio}
                </p>

                <div className="mt-4 flex items-center justify-center sm:justify-start gap-3">
                  {member.socials.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      title={social.label}
                      className="w-9 h-9 rounded-xl overflow-hidden shadow-sm hover:scale-110 hover:shadow-md transition-all duration-200 flex items-center justify-center bg-white"
                    >
                      <Image
                        src={social.icon}
                        alt={social.label}
                        width={36}
                        height={36}
                        className="w-full h-full object-contain"
                      />
                    </a>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* Bottom Statement */}
        <section className="mt-10 lg:mt-6 pb-4 lg:pb-0 text-center max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-16 sm:w-24 bg-gradient-to-r from-transparent to-[#7FB5FA]" />
            <HiStar className="w-5 h-5 text-[#0B6BFF]" />
            <span className="h-px w-16 sm:w-24 bg-gradient-to-l from-transparent to-[#7FB5FA]" />
          </div>

          <h3 className="mt-4 text-lg sm:text-xl font-extrabold text-[#0B1B3D]">
            Bersama, Membangun Solusi{" "}
            <span className="text-[#0B6BFF]">Lebih Baik</span>
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm text-[#475569]">
            Dengan kolaborasi dan semangat inovasi, kami berkomitmen untuk
            menghadirkan teknologi yang bermanfaat.
          </p>
        </section>
      </main>
    </div>
  );
}
