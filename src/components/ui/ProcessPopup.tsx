"use client";

type ProcessPopupProps = {
  open: boolean;
  title?: string;
  message: string;
  icon?: React.ReactNode;
};

export default function ProcessPopup({
  open,
  title = "Memproses",
  message,
  icon = "⏳",
}: ProcessPopupProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center">
      {/* BACKDROP */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />

      {/* CARD */}
      <div
        className="
          relative w-full max-w-sm
          rounded-3xl
          px-8 py-10
          text-center
          animate-scaleIn
          transition-colors

          bg-linear-to-br from-white via-slate-50 to-indigo-50
          border border-slate-200
          shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)]

          dark:bg-linear-to-br
          dark:from-[#020617]
          dark:via-[#0F172A]
          dark:to-[#1E1B4B]
          dark:border-slate-700
          dark:shadow-[0_30px_90px_-20px_rgba(0,0,0,0.8)]
        "
      >
        {/* LOADER */}
        <div className="relative mx-auto mb-6 w-24 h-24">
          {/* OUTER RING */}
          <div
            className="
              absolute inset-0
              rounded-full
              border-4 border-transparent
              border-t-indigo-500
              border-r-cyan-400
              animate-spin
            "
          />

          {/* INNER RING */}
          <div
            className="
              absolute inset-3
              rounded-full
              border-4 border-transparent
              border-b-emerald-500
              border-l-green-400
              animate-spin [animation-duration:1.4s]
            "
          />

          {/* CENTER */}
          <div
            className="
              absolute inset-6
              rounded-full
              flex items-center justify-center
              text-2xl
              shadow

              bg-white text-slate-700
              dark:bg-slate-800 dark:text-slate-100
            "
          >
            {icon}
          </div>
        </div>

        {/* TEXT */}
        <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
          {title}
        </h3>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {message}
        </p>
      </div>
    </div>
  );
}