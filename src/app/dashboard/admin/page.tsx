"use client";

import { useEffect, useState } from "react";
import {
  HiUserGroup,
  HiUserAdd,
  HiClipboardList,
  HiShieldCheck,
  HiDocumentReport,
} from "react-icons/hi";

/* ================= TYPE ================= */
type Peserta = {
  nama: string;
  email: string;
  posisi: string;
  status: "Aktif" | "Selesai" | "Menunggu";
};

type Mentor = {
  nama: string;
  email: string;
};

export default function AdminDashboard() {
  const [peserta, setPeserta] = useState<Peserta[]>([]);
  const [mentor, setMentor] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [pesertaRes, mentorRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/peserta`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/mentor`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
        ]);

        const pesertaData = await pesertaRes.json();
        const mentorData = await mentorRes.json();

        setPeserta(pesertaData);
        setMentor(mentorData);
      } catch (err) {
        console.error("❌ Gagal memuat dashboard admin", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  /* ================= SUMMARY ================= */
  const totalPeserta = peserta.length;
  const pesertaAktif = peserta.filter((p) => p.status === "Aktif").length;
  const totalMentor = mentor.length;
  const menungguVerifikasi = peserta.filter(
    (p) => p.status === "Menunggu",
  ).length;

  const summary = [
    {
      label: "Total Peserta",
      value: totalPeserta,
      icon: <HiUserGroup />,
      color: "from-indigo-500 to-blue-500",
    },
    {
      label: "Peserta Aktif",
      value: pesertaAktif,
      icon: <HiShieldCheck />,
      color: "from-emerald-500 to-green-500",
    },
    {
      label: "Total Mentor",
      value: totalMentor,
      icon: <HiUserAdd />,
      color: "from-purple-500 to-fuchsia-500",
    },
    {
      label: "Menunggu Verifikasi",
      value: menungguVerifikasi,
      icon: <HiClipboardList />,
      color: "from-orange-500 to-amber-500",
    },
  ];

  /* ================= TASK ADMIN ================= */
  const tasks = [
    {
      title: "Verifikasi Pendaftaran",
      desc: "Setujui atau tolak pendaftaran peserta magang",
      icon: <HiClipboardList />,
    },
    {
      title: "Kelola Mentor",
      desc: "Tambah, edit, dan hapus akun mentor",
      icon: <HiUserAdd />,
    },
    {
      title: "Monitoring Logbook",
      desc: "Pantau seluruh logbook peserta",
      icon: <HiDocumentReport />,
    },
    {
      title: "Laporan & Statistik",
      desc: "Rekap dan analisis data magang",
      icon: <HiShieldCheck />,
    },
  ];

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        ⏳ Memuat dashboard admin...
      </div>
    );
  }

  return (
    <div
      className="
        min-h-screen p-4 sm:p-6 lg:p-10
        bg-linear-to-br
        from-slate-50 via-white to-indigo-100
        dark:from-[#0B0614] dark:via-[#120A24] dark:to-[#1E0F3D]
        text-slate-800 dark:text-slate-100
        transition-colors
      "
    >
      {/* HEADER */}
      <div className="mb-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
          Dashboard Admin 🛠️
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Kontrol penuh data magang dan sistem
        </p>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-12">
        {summary.map((s, i) => (
          <div
            key={i}
            className="
              group
              relative rounded-3xl
              bg-white/80 dark:bg-white/5
              backdrop-blur
              border border-slate-200 dark:border-slate-700
              shadow-md hover:shadow-xl
              transition-all
            "
          >
            <div
              className={`
                pointer-events-none absolute inset-0 rounded-3xl
                bg-linear-to-br ${s.color}
                opacity-0 group-hover:opacity-30 blur-xl
                transition
              `}
            />
            <div className="relative p-6 flex items-center gap-4">
              {/* ICON */}
              <div
                className="
                  w-14 h-14 sm:w-16 sm:h-16   
                  rounded-2xl
                  bg-linear-to-br from-[#7F1D1D] to-[#F59E0B]
                  dark:from-indigo-600 dark:to-violet-500
                  text-white
                  flex items-center justify-center
                  shadow-lg
                "
              >
                <span className="text-xl sm:text-2xl">
                  {s.icon}
                </span>
              </div>

              {/* TEXT */}
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {s.label}
                </p>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {s.value}
                </h2>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TASK ADMIN */}
        <div
          className="
            rounded-3xl
            bg-white/80 dark:bg-white/5
            backdrop-blur
            border border-slate-200 dark:border-slate-700
            shadow-lg
            p-6
          "
        >
          <h3 className="font-bold mb-5 flex items-center gap-2">
            ⚙️ Tugas Admin
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
            {tasks.map((t, i) => (
              <div
                key={i}
                className="
                  flex items-center gap-3
                  p-3 sm:p-4
                  rounded-2xl
                  bg-white/90 dark:bg-white/5
                  border border-slate-200 dark:border-slate-700
                  shadow-sm hover:shadow-md
                  transition
                "
              >
                <div
                  className="
                    shrink-0
                    w-10 h-10
                    rounded-xl
                    bg-linear-to-br from-[#7F1D1D] to-[#F59E0B]
                    dark:from-indigo-600 dark:to-violet-500
                    text-white
                    flex items-center justify-center
                    shadow
                  "
                >
                  {t.icon}
                </div>

                <div className="leading-tight">
                  <p className="font-semibold text-sm sm:text-base">{t.title}</p>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PENDAFTARAN TERBARU */}
        <div
          className="
            lg:col-span-2
            rounded-3xl
            bg-white/80 dark:bg-white/5
            backdrop-blur
            border border-slate-200 dark:border-slate-700
            shadow-lg
            p-6
          "
        >
          <h3 className="font-bold mb-5 flex items-center gap-2">
            🆕 Pendaftaran Terbaru
          </h3>

          {menungguVerifikasi === 0 ? (
            <p className="text-sm text-gray-500">
              🎉 Tidak ada pendaftaran baru
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {peserta
                .filter((p) => p.status === "Menunggu")
                .slice(0, 4)
                .map((p, i) => (
                  <div
                    key={i}
                    className="
                      group
                      flex flex-col gap-3
                      rounded-2xl border p-4
                      bg-white/90 dark:bg-white/5
                      backdrop-blur
                      hover:shadow-xl hover:-translate-y-1
                      transition-all
                    "
                  >
                    <p className="font-semibold text-base sm:text-lg">{p.nama}</p>
                    <p className="text-xs sm:text-sm text-slate-500">{p.posisi}</p>

                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs px-3 py-1 rounded-full bg-orange-100 text-orange-700">
                        Menunggu
                      </span>

                      <button className="text-sm font-medium text-indigo-600 hover:underline">
                        Verifikasi →
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
