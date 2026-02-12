"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiCheckCircle, FiClock } from "react-icons/fi";

type Props = {
  tanggalMulai?: string;
  tanggalSelesai?: string;
  nama?: string;
  delay?: number;
};

const ONE_DAY = 24 * 60 * 60 * 1000;

export default function MagangPopup({
  tanggalMulai,
  tanggalSelesai,
  nama,
  delay = 1500,
}: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"aktif" | "selesai" | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (!tanggalSelesai) return;

    const lastHidden = localStorage.getItem("popupHideUntil");
    if (lastHidden && Date.now() < Number(lastHidden)) return;

    const today = new Date();
    const selesai = new Date(tanggalSelesai);

    if (today < selesai) {
      setMode("aktif");
    } else {
      setMode("selesai");
    }

    const timer = setTimeout(() => setOpen(true), delay);
    return () => clearTimeout(timer);
  }, [tanggalSelesai, delay]);

  const closePopup = () => setOpen(false);

  const hideForToday = () => {
    const hideUntil = Date.now() + ONE_DAY;
    localStorage.setItem("popupHideUntil", hideUntil.toString());
    setOpen(false);
  };

  if (!open || !mode) return null;

  const isSelesai = mode === "selesai";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="
          relative w-full max-w-md mx-4
          rounded-3xl
          bg-white dark:bg-slate-900
          shadow-2xl
          p-7 text-center
          animate-[scaleIn_0.35s_ease-out]
        "
      >
        {/* CLOSE */}
        <button
          onClick={closePopup}
          className="
            absolute top-4 right-4
            w-8 h-8 rounded-full
            flex items-center justify-center
            bg-slate-100 dark:bg-slate-800
            hover:text-red-500
          "
        >
          ✕
        </button>

        {/* ICON */}
        <div
          className={`
            mx-auto mb-4
            w-16 h-16
            rounded-2xl
            flex items-center justify-center
            text-white text-3xl
            ${
              isSelesai
                ? "bg-linear-to-br from-emerald-500 to-green-600"
                : "bg-linear-to-br from-amber-500 to-red-600"
            }
          `}
        >
          {isSelesai ? <FiCheckCircle /> : <FiClock />}
        </div>

        {/* TITLE */}
        <h3
          className={`
            text-xl font-extrabold mb-2
            ${
              isSelesai
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-[#7F1D1D] dark:text-indigo-300"
            }
          `}
        >
          {isSelesai
            ? "Selamat Menyelesaikan Magang 🎉"
            : "Jangan Lupa Isi Logbook 📘"}
        </h3>

        {/* DESCRIPTION */}
        {isSelesai ? (
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
            Selamat <b>{nama}</b>, Anda telah menyelesaikan masa magang.
            <br />
            <span className="text-slate-500 dark:text-slate-400">
              Periode: {tanggalMulai} – {tanggalSelesai}
            </span>
          </p>
        ) : (
          <div className="space-y-4 mb-6">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                    Pastikan Anda mengisi logbook setiap hari agar aktivitas magang
                    tercatat dengan baik.
                </p>

                {/* WARNING BOX */}
                <div
                    className="
                    px-4 py-3
                    rounded-xl
                    text-sm font-semibold
                    border
                    bg-amber-50 text-amber-800 border-amber-200
                    dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700
                    "
                >
                    ⚠️ Tidak Isi Logbook = Tidak Absen
                </div>
            </div>
        )}

        {/* BUTTON */}
        <div className="flex flex-col sm:flex-row gap-3">
            {!isSelesai && (
                <button
                onClick={() => {
                    closePopup();
                    router.push("/dashboard/peserta/isi-logbook");
                }}
                className="
                    w-full
                    py-3
                    rounded-xl
                    font-semibold
                    text-white
                    bg-linear-to-r
                    from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                    dark:from-indigo-600 dark:to-violet-500
                    hover:shadow-lg
                    transition
                "
                >
                Isi Logbook Sekarang
                </button>
            )}

            <button
                onClick={closePopup}
                className={`
                w-full
                py-3
                rounded-xl
                font-semibold
                transition
                ${
                    isSelesai
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                }
                `}
            >
                {isSelesai ? "Terima Kasih" : "Nanti Saja"}
            </button>
            </div>

        {/* HIDE */}
        <button
          onClick={hideForToday}
          className="mt-4 text-xs text-slate-500 hover:text-slate-700"
        >
          Jangan tampilkan lagi hari ini
        </button>
      </div>

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