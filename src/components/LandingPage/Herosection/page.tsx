"use client";

import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="w-full flex justify-center px-4 pt-12 pb-24">
      <div className="max-w-6xl w-full min-h-[70vh] flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-24 px-4 lg:px-0">
        {/* TEXT */}
        <div className="max-w-xl mt-7 space-y-6 text-center lg:text-left">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-[#7F1D1D]">
            Pendaftaran Magang <br />
            <span className="text-[#B91C1C]">Balai Besar POM di Palembang</span>
          </h1>

          <p className="text-gray-700 text-lg">
            Program magang resmi yang dirancang untuk memberikan pengalaman
            kerja nyata, meningkatkan kompetensi peserta didik dan mahasiswa,
            serta mempersiapkan generasi muda agar siap memasuki dunia kerja.
          </p>

          <Link
            href="/pendaftaran"
            className="
              inline-flex items-center justify-center
              px-8 py-3 rounded-xl
              font-semibold text-lg
              bg-linear-to-r from-[#FACC15] via-[#F59E0B] to-[#EA580C]
              text-white
              hover:scale-105 hover:shadow-lg
              transition
            "
          >
            Daftar Magang
          </Link>
        </div>

        {/* IMAGE */}
        <div className="w-full lg:w-[45%] flex justify-center">
          <Image
            src="/images/landing-page/bbpom_plg.png"
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
