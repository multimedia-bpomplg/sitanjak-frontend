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
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 via-white to-indigo-50 dark:from-gray-900 dark:to-slate-900 text-gray-800 dark:text-gray-200">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold">Dashboard Admin 🛠️</h1>
        <p className="text-sm text-gray-500">
          Kontrol penuh data magang dan sistem
        </p>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {summary.map((s, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-2xl shadow-lg text-white"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${s.color}`} />
            <div className="relative p-5">
              <div className="text-3xl mb-3 opacity-90">{s.icon}</div>
              <p className="text-sm opacity-90">{s.label}</p>
              <h2 className="text-4xl font-extrabold">{s.value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TASK ADMIN */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border p-6">
          <h3 className="font-bold mb-5 flex items-center gap-2">
            ⚙️ Tugas Admin
          </h3>

          <div className="space-y-4">
            {tasks.map((t, i) => (
              <div
                key={i}
                className="
                  flex items-start gap-4 p-4
                  rounded-xl border
                  bg-gray-50 dark:bg-gray-900
                  hover:shadow-md transition
                "
              >
                <div className="text-2xl text-indigo-600">{t.icon}</div>
                <div>
                  <p className="font-semibold">{t.title}</p>
                  <p className="text-sm text-gray-500">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PENDAFTARAN TERBARU */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border p-6">
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
                      rounded-xl border p-4
                      bg-gray-50 dark:bg-gray-900
                      hover:shadow-md transition
                    "
                  >
                    <p className="font-semibold text-lg">{p.nama}</p>
                    <p className="text-sm text-gray-500">{p.posisi}</p>

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
