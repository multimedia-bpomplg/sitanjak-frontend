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

const ONE_DAY = 24 * 60 * 60 * 1000;

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
          `${process.env.NEXT_PUBLIC_API_URL}/announcements/landing`,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      {/* CARD */}
      <div
        className="
          relative w-full max-w-md mx-4
          rounded-3xl overflow-hidden
          bg-white/90 dark:bg-slate-900/90
          backdrop-blur-xl
          shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]
          animate-[scaleIn_0.4s_ease-out]
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
            hover:text-sky-600
            hover:scale-110
            transition
          "
          aria-label="Tutup"
        >
          ✕
        </button>

        {/* IMAGE HEADER */}
        <div className="relative h-52">
          <Image
            src={imageUrl}
            alt={data.title}
            fill
            sizes="(max-width: 520px) 100vw, 520px"
            className="object-cover"
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
              bg-linear-to-r from-sky-500 to-blue-600
              text-white
              shadow-lg
            "
          >
          {data.subtitle || "INFO PENTING"}
          </div>
        </div>

        {/* CONTENT */}
        <div className="px-6 py-7 text-center">
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3">
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
              bg-linear-to-r from-[#0284c7] via-sky-600 to-blue-700 dark:from-[#0369a1] dark:to-blue-800
              hover:shadow-xl hover:shadow-sky-500/25
              hover:-translate-y-0.5
              transition-all
            "
          >
          Saya Mengerti
          </button>

          {/* SECONDARY */}
          <button
            onClick={hideForToday}
            className="
              mt-4 text-xs
              text-slate-500 hover:text-sky-600
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
