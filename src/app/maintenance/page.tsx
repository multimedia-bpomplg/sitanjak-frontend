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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute w-[600px] h-[600px] bg-red-700/20 rounded-full blur-3xl animate-pulse" />

      <div className="relative z-10 text-center max-w-2xl px-6">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-red-800/30 rounded-3xl flex items-center justify-center shadow-xl">
            <HiShieldExclamation className="text-red-500 text-5xl" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide">
          Website Sedang Maintenance
        </h1>

        <p className="mt-4 text-gray-400 text-lg">
          Kami sedang melakukan peningkatan sistem untuk memberikan pengalaman
          yang lebih baik.
        </p>

        {/* Countdown */}
        <div className="mt-10">
          <div className="flex justify-center items-center gap-3 text-red-400 text-lg mb-4">
            <HiOutlineClock />
            <span>Perkiraan selesai dalam:</span>
          </div>

          <div className="text-3xl md:text-5xl font-mono tracking-widest bg-black/40 px-8 py-6 rounded-2xl border border-red-800 shadow-lg">
            {formatTime(timeLeft)}
          </div>

          <p className="mt-3 text-sm text-gray-500">
            Format: Hari : Jam : Menit : Detik
          </p>
        </div>

        {/* Footer */}
        <div className="mt-12 text-xs text-gray-600">
          © {new Date().getFullYear()} SITANJAK • System Maintenance
        </div>
      </div>
    </div>
  );
}
