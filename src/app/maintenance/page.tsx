"use client";

import { useEffect, useState } from "react";
import { HiOutlineClock, HiShieldExclamation } from "react-icons/hi";
import { useRouter } from "next/navigation";

export default function MaintenancePage() {
  const router = useRouter();

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  /* ===============================
      FETCH STATUS DARI BACKEND
  =============================== */
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/maintenance/status`,
        );
        const data = await res.json();

        if (!data.isActive) {
          // Jika sudah tidak maintenance, redirect ke home
          router.push("/");
          return;
        }

        if (data.endTime) {
          const end = new Date(data.endTime).getTime();
          setEndTime(end);
          setTimeLeft(end - Date.now());
        }
      } catch (error) {
        console.error("Gagal fetch maintenance status");
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [router]);

  /* ===============================
      COUNTDOWN TIMER
  =============================== */
  useEffect(() => {
    if (!endTime) return;

    const timer = setInterval(() => {
      const remaining = endTime - Date.now();

      if (remaining <= 0) {
        clearInterval(timer);
        router.push("/"); // Auto redirect jika selesai
      }

      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, router]);

  const formatTime = (ms: number) => {
    if (ms <= 0) return "00 : 00 : 00 : 00";

    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    return `${days.toString().padStart(2, "0")} : 
            ${hours.toString().padStart(2, "0")} : 
            ${minutes.toString().padStart(2, "0")} : 
            ${seconds.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading maintenance status...
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-linear-to-br from-[#FFF8F2] via-[#FFF1E6] to-[#FFE4C7]">

      {/* Animated Background Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-125 h-125 bg-[#7F1D1D]/10 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-125 h-125 bg-[#F59E0B]/20 rounded-full blur-[140px] animate-pulse" />
      </div>

      <div className="relative z-10 flex flex-col lg:grid lg:grid-cols-2 min-h-screen">

        {/* ================= LEFT CONTENT ================= */}
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">

          {/* Premium Glass Card */}
          <div className="
            w-full max-w-md
            bg-white/70
            backdrop-blur-2xl
            rounded-3xl
            border border-white/60
            shadow-[0_25px_70px_-20px_rgba(0,0,0,0.25)]
            px-8 py-12
          ">

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="
                w-20 h-20
                rounded-2xl
                bg-linear-to-br
                from-[#7F1D1D]
                via-[#B91C1C]
                to-[#F59E0B]
                flex items-center justify-center
                shadow-lg
              ">
                <HiShieldExclamation className="text-4xl text-white" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-linear-to-r from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B] bg-clip-text text-transparent">
              Website Sedang Maintenance
            </h1>

            <p className="mt-4 text-gray-600 text-sm sm:text-base leading-relaxed">
              Kami sedang melakukan peningkatan sistem untuk memberikan pengalaman
              yang lebih stabil, cepat, dan aman.
            </p>

            {/* Countdown */}
            <div className="mt-10">

              <div className="flex justify-center items-center gap-2 text-[#B91C1C] mb-4 text-sm">
                <HiOutlineClock />
                <span>Perkiraan selesai dalam:</span>
              </div>

              <div className="
                inline-block
                text-xl sm:text-2xl md:text-3xl
                font-mono
                tracking-widest
                px-8 py-5
                rounded-2xl
                bg-linear-to-r
                from-[#7F1D1D]
                via-[#B91C1C]
                to-[#F59E0B]
                text-white
                shadow-[0_0_30px_rgba(245,158,11,0.4)]
                transition-all
              ">
                {formatTime(timeLeft)}
              </div>

              <p className="mt-3 text-xs text-gray-500">
                Format: Hari : Jam : Menit : Detik
              </p>
            </div>

            {/* Footer */}
            <p className="mt-10 text-xs text-gray-500">
              © {new Date().getFullYear()} SITANJAK • System Maintenance
            </p>

          </div>
        </div>

        {/* ================= RIGHT IMAGE (DESKTOP) ================= */}
        <div
          className="
            hidden lg:block
            relative
            w-full
            min-h-screen
          "
        >
          <img
            src="/images/maintenance/maintanancepage.png"
            alt="Maintenance"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

      </div>
    </div>
  );
}
