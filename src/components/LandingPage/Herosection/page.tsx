// components/landing page/HeroSection.tsx (Updated)
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        const res = await fetch(`${API_BASE}/landing/layout/hero`);
        if (res.ok) {
          const layoutData = await res.json();
          setData(layoutData);
        }
      } catch (error) {
        console.error("Gagal memuat data hero:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHeroData();
  }, []);

  if (loading || !data || !data.isActive) {
    // Fallback ke default
    return (
      <section className="w-full flex justify-center px-4 pt-12 pb-24">
        <div className="max-w-6xl w-full min-h-[70vh] flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-24 px-4 lg:px-0">
          {/* Default content */}
          <div className="max-w-xl mt-7 space-y-6 text-center lg:text-left">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-[#7F1D1D]">
              Pendaftaran Magang <br />
              <span className="text-[#B91C1C]">Balai Besar POM di Palembang</span>
            </h1>
            <p className="text-gray-700 text-lg">
              Program magang resmi yang dirancang untuk memberikan pengalaman kerja nyata, 
              meningkatkan kompetensi peserta didik dan mahasiswa, 
              serta mempersiapkan generasi muda agar siap memasuki dunia kerja.
            </p>
            <Link
              href="/pendaftaran"
              className="inline-flex items-center justify-center px-8 py-3 rounded-xl font-semibold text-lg bg-linear-to-r from-[#FACC15] via-[#F59E0B] to-[#EA580C] text-white hover:scale-105 hover:shadow-lg transition"
            >
              Daftar Magang
            </Link>
          </div>

          <div className="w-full lg:w-[45%] flex justify-center">
            <Image
              src="/images/landing page/bbpom_plg.png"
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

  // Menggunakan data dari database
  return (
    <section className="w-full flex justify-center px-4 pt-12 pb-24">
      <div className="max-w-6xl w-full min-h-[70vh] flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-24 px-4 lg:px-0">
        {/* Content dari database */}
        <div className="max-w-xl space-y-6 text-center lg:text-left">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-[#7F1D1D]">
            {data.title || "Pendaftaran Magang"}
          </h1>
          <p className="text-gray-700 text-lg">{data.description}</p>
          <Link
            href="/pendaftaran"
            className="inline-flex items-center justify-center px-8 py-3 rounded-xl font-semibold text-lg bg-linear-to-r from-[#FACC15] via-[#F59E0B] to-[#EA580C] text-white hover:scale-105 hover:shadow-lg transition"
          >
            Daftar Magang
          </Link>
        </div>

        <div className="w-full lg:w-[45%] flex justify-center">
          {data.images && data.images.length > 0 ? (
            <Image
              src={data.images[0]}
              alt="Ilustrasi Magang"
              width={500}
              height={500}
              className="object-contain drop-shadow-xl"
              priority
            />
          ) : (
            <Image
              src="/images/landing page/heroPage.png"
              alt="Ilustrasi Magang"
              width={500}
              height={500}
              className="object-contain drop-shadow-xl"
              priority
            />
          )}
        </div>
      </div>
    </section>
  );
}
