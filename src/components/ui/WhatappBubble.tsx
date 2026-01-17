"use client";

import { useEffect, useState } from "react";

export default function WhatsAppBubble() {
  const phone = "6288274133623"; // ✅ nomor WA tujuan
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(
    "Halo, saya ingin bertanya tentang pendaftaran magang."
  );
  const [animate, setAnimate] = useState(true);

  // 🔥 Animasi perhatian pertama kali
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimate(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const sendMessage = () => {
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    setOpen(false);
  };

  return (
    <>
      {/* ===== POPUP CHAT ===== */}
      {open && (
        <div
          className="
            fixed bottom-24 right-6 z-50
            w-72
            bg-white dark:bg-slate-900
            rounded-2xl
            shadow-2xl
            border border-slate-200 dark:border-slate-700
            p-4
            animate-fadeIn
          "
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-800 dark:text-white">
              Chat WhatsApp
            </p>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-red-500"
            >
              ✕
            </button>
          </div>

          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="
              w-full
              text-sm
              border border-slate-300 dark:border-slate-700
              rounded-lg
              px-3 py-2
              mb-3
              focus:outline-none
              focus:ring-2 focus:ring-green-500
              bg-white dark:bg-slate-800
            "
          />

          <button
            onClick={sendMessage}
            className="
              w-full
              bg-green-500 hover:bg-green-600
              text-white
              py-2
              rounded-lg
              text-sm
              font-semibold
              transition
            "
          >
            Kirim ke WhatsApp
          </button>
        </div>
      )}

      {/* ===== BUBBLE ===== */}
      <button
        onClick={() => setOpen((p) => !p)}
        className={`
          fixed bottom-6 right-6 z-40
          flex items-center gap-2
          bg-green-500 hover:bg-green-600
          text-white
          px-4 py-3
          rounded-full
          shadow-xl
          transition
          ${animate ? "scale-110 animate-bounce" : "scale-100"}
        `}
      >
        <span className="text-xl">💬</span>
        <span className="hidden sm:block text-sm font-semibold">
          Chat WhatsApp
        </span>
      </button>

      {/* ===== ANIMATION STYLE ===== */}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}
