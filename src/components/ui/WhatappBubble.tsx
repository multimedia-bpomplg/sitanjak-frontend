"use client";

import { useEffect, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function WhatsAppBubble() {
  const [phone, setPhone] = useState("6288274133623"); // default
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(
    "Halo, saya ingin bertanya tentang pendaftaran magang.",
  );
  const [animate, setAnimate] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveWhatsapp();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimate(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const fetchActiveWhatsapp = async () => {
    try {
      const res = await fetch(`${API_BASE}/whatsapp/active`);

      if (!res.ok) throw new Error("Gagal fetch");

      const result = await res.json();

      if (result.success && result.data) {
        setPhone(result.data.phoneNumber);
      }
    } catch (error) {
      console.error("Gagal mengambil nomor WhatsApp:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => {
    if (!phone) return;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    setOpen(false);
  };

  const formatPhoneDisplay = (num: string) => {
    return num.replace(/^62/, "0");
  };

  if (loading) {
    return (
      <button
        className="
          fixed bottom-6 right-6 z-40
          w-16 h-16  
          flex items-center justify-center
          bg-green-500/50
          text-white
          rounded-full
          shadow-xl
          cursor-wait
        "
        disabled
        aria-label="Loading WhatsApp"
      >
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </button>
    );
  }

  return (
    <>
      {/* POPUP CHAT */}
      {open && (
        <div
          className="
            fixed bottom-24 right-6 z-50
            w-80
            bg-white/95 dark:bg-slate-900/95
            backdrop-blur
            rounded-2xl
            shadow-2xl
            border border-slate-200 dark:border-slate-700
            p-4
            animate-fadeIn
          "
        >
          {/* Arrow */}
          <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white dark:bg-slate-900 rotate-45 border-r border-b border-slate-200 dark:border-slate-700" />

          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                <FaWhatsapp />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  Admin Magang
                </p>
                <p className="text-xs text-slate-500">
                  {formatPhoneDisplay(phone)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-red-500 transition"
              aria-label="Tutup"
            >
              ✕
            </button>
          </div>

          {/* Textarea */}
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="
              w-full
              text-sm
              border border-slate-300 dark:border-slate-700
              rounded-xl
              px-3 py-2
              mb-3
              focus:outline-none
              focus:ring-2 focus:ring-green-500
              bg-white dark:bg-slate-800
              text-slate-800 dark:text-white
              placeholder-slate-400
              resize-none
            "
            placeholder="Ketik pesan Anda..."
          />

          {/* Send Button */}
          <button
            onClick={sendMessage}
            className="
              w-full
              flex items-center justify-center gap-2
              bg-green-500 hover:bg-green-600
              text-white
              py-2.5
              rounded-xl
              text-sm
              font-semibold
              shadow-md
              transition-all
              hover:shadow-lg
              active:scale-95
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
            disabled={!phone}
          >
            <FaWhatsapp className="text-lg" />
            Kirim ke WhatsApp
          </button>
        </div>
      )}

      {/* FLOATING BUBBLE */}
      <button
        onClick={() => setOpen((p) => !p)}
        className={`
          fixed bottom-6 right-6 z-40
          w-16 h-16  
          flex items-center justify-center
          bg-green-500 hover:bg-green-600
          text-white
          rounded-full
          shadow-xl
          transition-all
          hover:shadow-2xl
          hover:scale-110
          active:scale-95
          ${animate ? "animate-pulse" : ""}
        `}
        aria-label={open ? "Tutup chat" : "Buka chat WhatsApp"}
      >
        <FaWhatsapp className="text-4xl" />
      </button>

      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.95);
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
