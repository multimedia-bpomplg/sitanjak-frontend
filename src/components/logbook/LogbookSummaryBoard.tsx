"use client";

type SummaryProps = {
  total: number;
  hadir: number;
  tidakHadirDenganKeterangan: number;
  tidakHadirTanpaKeterangan: number;
};

export default function LogbookSummaryBoard({
  total,
  hadir,
  tidakHadirDenganKeterangan,
  tidakHadirTanpaKeterangan,
}: SummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* TOTAL */}
      <SummaryCard
        title="Total Logbook"
        value={total}
        subtitle="Seluruh catatan"
        variant="blue"
        icon="📘"
      />

      {/* HADIR */}
      <SummaryCard
        title="Hadir"
        value={hadir}
        subtitle="Kehadiran valid"
        variant="green"
        icon="✅"
      />

      {/* TIDAK HADIR + KETERANGAN */}
      <SummaryCard
        title="Tidak Hadir (Keterangan)"
        value={tidakHadirDenganKeterangan}
        subtitle="Dengan keterangan"
        variant="amber"
        icon="📝"
      />

      {/* TIDAK HADIR TANPA KETERANGAN */}
      <SummaryCard
        title="Tidak Hadir (Tanpa Ket.)"
        value={tidakHadirTanpaKeterangan}
        subtitle="Perlu perhatian"
        variant="red"
        icon="❌"
      />
    </div>
  );
}

/* ================= CARD ================= */

function SummaryCard({
  title,
  subtitle,
  value,
  variant,
  icon,
}: {
  title: string;
  subtitle: string;
  value: number;
  variant: "blue" | "green" | "amber" | "red";
  icon: string;
}) {
  const styles = {
    blue: {
      border: "border-blue-400/40",
      accent: "from-blue-500 to-cyan-500",
      text: "text-blue-600 dark:text-blue-400",
      ring: "ring-blue-500/20",
    },
    green: {
      border: "border-emerald-400/40",
      accent: "from-emerald-500 to-green-500",
      text: "text-emerald-600 dark:text-emerald-400",
      ring: "ring-emerald-500/20",
    },
    amber: {
      border: "border-amber-400/40",
      accent: "from-amber-400 to-yellow-500",
      text: "text-amber-600 dark:text-amber-400",
      ring: "ring-amber-400/30",
    },
    red: {
      border: "border-rose-400/40",
      accent: "from-rose-500 to-red-500",
      text: "text-rose-600 dark:text-rose-400",
      ring: "ring-rose-500/20",
    },
  };

  return (
    <div
      className={`
        group relative overflow-hidden
        rounded-3xl p-5 sm:p-6
        bg-white/80 dark:bg-slate-900/70
        backdrop-blur
        border border-slate-200/60 dark:border-slate-800
        ring-1 ${styles[variant].ring}
        shadow-[0_12px_40px_-18px_rgba(0,0,0,0.2)]
        dark:shadow-[0_20px_60px_-25px_rgba(0,0,0,0.8)]
        transition-all duration-300
        hover:-translate-y-1 hover:shadow-xl
      `}
    >
      {/* ===== ACCENT TOP (MELENGKUNG) ===== */}
      <div
        className={`
          pointer-events-none
          absolute inset-0
          rounded-3xl
          mask-[linear-gradient(to_bottom,black,black_12%,transparent_12%)]
          bg-linear-to-r ${styles[variant].accent}
        `}
      />

      <div className="relative flex items-center gap-4">
        {/* ===== ICON (PREMIUM BORDER) ===== */}
        <div
          className={`
            h-14 w-14 sm:h-16 sm:w-16
            rounded-2xl
            flex items-center justify-center
            text-2xl sm:text-3xl
            bg-white/70 dark:bg-slate-800/60
            border ${styles[variant].border}
            ${styles[variant].text}
            shadow-sm
            transition-all
            group-hover:scale-105
          `}
        >
          {icon}
        </div>

        {/* ===== TEXT ===== */}
        <div className="flex-1">
          <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <div className="flex items-end gap-2 mt-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              {value}
            </span>
            <span
              className={`text-xs sm:text-sm font-medium ${styles[variant].text}`}
            >
              data
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
