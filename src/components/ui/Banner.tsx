"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type PopupPromoProps = {
  image: string;
  title: string;
  description: string;
  delay?: number;
};

const ONE_DAY = 24 * 60 * 60 * 1000; // 1 hari (ms)

export default function PopupPromo({
  image,
  title,
  description,
  delay = 1500,
}: PopupPromoProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const lastClosed = localStorage.getItem("popupClosedAt");

    // jika pernah ditutup & belum lewat 1 hari
    if (lastClosed) {
      const diff = Date.now() - Number(lastClosed);
      if (diff < ONE_DAY) return;
    }

    const timer = setTimeout(() => {
      setOpen(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  /* === HANDLE TUTUP === */
  const closePopup = () => {
    localStorage.setItem("popupClosedAt", Date.now().toString());
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* CLOSE ICON */}
        <button
          onClick={closePopup}
          className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl"
        >
          ✕
        </button>

        {/* IMAGE */}
        <div className="relative w-full h-48">
          <Image
            src={image}
            alt="Popup Image"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* CONTENT */}
        <div className="p-5 text-center">
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {description}
          </p>

          {/* BUTTON HILANGKAN 1 HARI */}
          <button
            onClick={closePopup}
            className="
              text-sm
              px-4 py-2
              rounded-lg
              bg-slate-200 dark:bg-slate-700
              text-slate-700 dark:text-slate-200
              hover:bg-slate-300 dark:hover:bg-slate-600
              transition
            "
          >
            Jangan tampilkan lagi hari ini
          </button>
        </div>
      </div>
    </div>
  );
}
