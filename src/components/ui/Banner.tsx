"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Announcement = {
  _id: string;
  title: string;
  subtitle?: string;
  content: string;
  image?: string;
};

const ONE_DAY = 24 * 60 * 60 * 1000; // 1 hari (ms)

export default function PopupPromo() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Announcement | null>(null);

  useEffect(() => {
    const initPopup = async () => {
      // cek localStorage dulu
      const lastHidden = localStorage.getItem("popupHideUntil");

      if (lastHidden && Date.now() < Number(lastHidden)) {
        return; // ❗ STOP, jangan fetch, jangan buka
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/announcements/type/landing`, // Perbaiki endpoint
        );

        if (!res.ok) throw new Error("Gagal fetch");

        const result = await res.json();

        if (result.length > 0) {
          setData(result[0]);

          // delay popup
          setTimeout(() => {
            setOpen(true);
          }, 1500);
        }
      } catch (err) {
        console.log("Gagal load banner");
      }
    };

    initPopup();
  }, []);

  // 🚫 Jangan tampilkan hari ini
  const hideForToday = () => {
    const hideUntil = Date.now() + ONE_DAY;
    localStorage.setItem("popupHideUntil", hideUntil.toString());
    setOpen(false);
  };

  const closePopup = () => {
    setOpen(false);
  };

  if (!open || !data) return null;

  const imageUrl = data.image
    ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/announcements/${data.image}`
    : "/images/cards/popup_sitanjak.png"; // fallback image

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {/* CARD */}
      <div
        className="
          relative
          w-full max-w-[520px]
          mx-4 sm:mx-6
          rounded-3xl
          overflow-hidden
          bg-white dark:bg-slate-900
          shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)]
          animate-[scaleIn_0.35s_ease-out]
        "
      >
        {/* CLOSE */}
        <button
          onClick={closePopup}
          className="
            absolute top-4 right-4 z-10
            w-9 h-9 rounded-full
            flex items-center justify-center
            bg-white/80 dark:bg-slate-800/80
            text-gray-700 dark:text-gray-200
            hover:text-red-600
            hover:scale-110
            transition
          "
          aria-label="Tutup"
        >
          ✕
        </button>

        {/* IMAGE HEADER */}
        <div className="relative w-full aspect-video bg-black">
          <Image
            src={imageUrl}
            alt={data.title}
            fill
            sizes="(max-width: 520px) 100vw, 520px"
            className="object-contain"
            priority
            onError={(e) => {
              // Fallback jika gambar gagal load
              (e.target as HTMLImageElement).src =
                "/images/cards/popup_sitanjak.png";
            }}
          />

          {/* GRADIENT */}
          <div
            className="
              absolute inset-0
              bg-linear-to-t
              from-black/30 via-black/10 to-transparent
            "
          />

          {/* BADGE */}
          <div
            className="
              absolute bottom-4 left-4
              px-4 py-1.5
              rounded-full
              text-xs font-bold
              bg-linear-to-r from-[#FACC15] to-[#F59E0B]
              text-[#7F1D1D]
              shadow-lg
            "
          >
            🎉 {data.subtitle || "INFO PENTING"}
          </div>
        </div>

        {/* CONTENT */}
        <div className="px-6 py-7 text-center mx-auto max-w-[460px]">
          <h3 className="text-2xl font-extrabold text-[#7F1D1D] mb-3">
            {data.title}
          </h3>

          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
            {data.content}
          </p>

          {/* CTA */}
          <button
            onClick={closePopup}
            className="
              w-full
              py-3 rounded-xl
              font-bold text-sm
              text-white
              bg-linear-to-r from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
              hover:shadow-xl
              hover:-translate-y-0.5
              transition-all
            "
          >
            🚀 Saya Mengerti
          </button>

          {/* SECONDARY */}
          <button
            onClick={hideForToday}
            className="
              mt-4 text-xs
              text-slate-500 hover:text-[#7F1D1D]
              transition
            "
          >
            Jangan tampilkan lagi hari ini
          </button>
        </div>
      </div>

      {/* KEYFRAMES */}
      <style jsx>{`
        @keyframes scaleIn {
          0% {
            opacity: 0;
            transform: scale(0.92);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
