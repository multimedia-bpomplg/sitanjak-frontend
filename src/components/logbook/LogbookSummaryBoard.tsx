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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* TOTAL */}
      <SummaryCard title="Total Logbook" value={total} color="blue" icon="📘" />

      {/* HADIR */}
      <SummaryCard title="Hadir" value={hadir} color="green" icon="✅" />

      {/* TIDAK HADIR + KETERANGAN */}
      <SummaryCard
        title="Tidak Hadir (Keterangan)"
        value={tidakHadirDenganKeterangan}
        color="yellow"
        icon="📝"
      />

      {/* TIDAK HADIR TANPA KETERANGAN */}
      <SummaryCard
        title="Tidak Hadir (Tanpa Ket.)"
        value={tidakHadirTanpaKeterangan}
        color="red"
        icon="❌"
      />
    </div>
  );
}

/* ================= CARD ================= */

function SummaryCard({
  title,
  value,
  color,
  icon,
}: {
  title: string;
  value: number;
  color: "blue" | "green" | "yellow" | "red";
  icon: string;
}) {
  const colorMap = {
    blue: "from-blue-500 to-cyan-500",
    green: "from-emerald-500 to-green-500",
    yellow: "from-amber-400 to-yellow-500",
    red: "from-rose-500 to-red-500",
  };

  return (
    <div
      className="
        rounded-2xl p-5
        bg-white
        shadow-lg
        border
        flex items-center gap-4
      "
    >
      {/* ICON */}
      <div
        className={`
          w-14 h-14 rounded-xl
          flex items-center justify-center
          text-2xl text-white
          bg-gradient-to-br ${colorMap[color]}
        `}
      >
        {icon}
      </div>

      {/* TEXT */}
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
      </div>
    </div>
  );
}
