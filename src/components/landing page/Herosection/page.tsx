"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function HeroSection() {
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
      { threshold: 0.3 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [hasAnimated]);

  return (
    <section
      id="home"
      ref={sectionRef}
      className="w-full flex justify-center px-4"
    >
      <div
        className={`
          max-w-6xl w-full min-h-[70vh]
          flex flex-col lg:flex-row items-center justify-between
          gap-12 lg:gap-24
          px-8 lg:px-14 py-14
          bg-gradient-to-br from-blue-100/30 via-cyan-100/30 to-emerald-100/30
          backdrop-blur-xl rounded-3xl shadow-xl
          transition-all duration-700 ease-out
          ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
        `}
      >
        {/* LEFT */}
        <div
          className={`
            max-w-xl space-y-6 text-center lg:text-left
            transition-all duration-700 delay-100
            ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}
          `}
        >
          <h1 className="text-4xl lg:text-5xl font-extrabold text-blue-900">
            Pendaftaran Magang <br />
            <span className="text-cyan-700">
              Balai Besar POM Palembang
            </span>
          </h1>

          <p className="text-gray-700 text-lg">
            Program magang resmi yang dirancang untuk memberikan pengalaman nyata,
            meningkatkan kompetensi, serta membangun generasi muda siap kerja.
          </p>

          <Link
            href="/pendaftaran"
            className="
              inline-flex items-center justify-center
              px-8 py-3 rounded-xl
              text-white font-semibold text-lg
              bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-500
              hover:scale-105 transition
            "
          >
            Daftar Magang
          </Link>
        </div>

        {/* RIGHT */}
        <div
          className={`
            w-full lg:w-[45%] flex justify-center
            transition-all duration-700 delay-200
            ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}
          `}
        >
          <Image
            src="/images/landing page/heroPage.png"
            alt="Ilustrasi Magang"
            width={500}
            height={500}
            className="object-contain drop-shadow-xl"
            priority
          />
        </div>
      </div>
    </section>
  );
}