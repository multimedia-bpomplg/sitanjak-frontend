"use client";

import { useEffect, useState } from "react";
import {
  HiUserGroup,
  HiUserAdd,
  HiClipboardList,
  HiShieldCheck,
  HiDocumentReport,
  HiCalendar,
  HiMail,
  HiPhone,
} from "react-icons/hi";
import AnnouncementBox from "@/components/AnnouncementBox";

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

type PendaftaranTerbaru = {
  _id: string;
  peserta: Array<{
    nama: string;
    email: string;
    wa: string;
    posisi: string;
    tanggalMulaiMagang: string;
    tanggalSelesaiMagang: string;
    asal?: {
      jenis: string;
      nama: string;
    };
  }>;
  kategori: string;
  status: "Menunggu" | "Sedang Diproses" | "Disetujui" | "Ditolak";
  createdAt: string;
};

export default function AdminDashboard() {
  const [peserta, setPeserta] = useState<Peserta[]>([]);
  const [mentor, setMentor] = useState<Mentor[]>([]);
  const [pendaftaranTerbaru, setPendaftaranTerbaru] = useState<
    PendaftaranTerbaru[]
  >([]);
  const [loading, setLoading] = useState(true);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");

        const [pesertaRes, mentorRes, pendaftaranRes] = await Promise.all([
          fetch(`${API_BASE}/admin/peserta`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/admin/mentor`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/admin/pendaftaran`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!pesertaRes.ok || !mentorRes.ok || !pendaftaranRes.ok) {
          throw new Error("Gagal memuat data dashboard");
        }

        const pesertaData = await pesertaRes.json();
        const mentorData = await mentorRes.json();
        const pendaftaranData = await pendaftaranRes.json();

        setPeserta(pesertaData);
        setMentor(mentorData);
        setPendaftaranTerbaru(pendaftaranData.slice(0, 6)); // Ambil 6 pendaftaran terbaru
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
  const menungguVerifikasi = pendaftaranTerbaru.filter(
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

  /* ================= TASK ADMIN (HANYA TAMPILAN) ================= */
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
      title: "Kelola Peserta",
      desc: "Kelola seluruh akun peserta magang",
      icon: <HiUserGroup />,
    },
    {
      title: "Laporan & Statistik",
      desc: "Rekap dan analisis data magang",
      icon: <HiDocumentReport />,
    },
  ];

  /* ================= FUNGSI UTILITAS ================= */
  const formatTanggal = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const hitungHariLalu = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hari ini";
    if (diffDays === 1) return "Kemarin";
    return `${diffDays} hari lalu`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Menunggu":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "Sedang Diproses":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "Disetujui":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
      case "Ditolak":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">
            Memuat dashboard admin...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-linear-to-br from-slate-50 via-white to-indigo-50 dark:from-[#0B0614] dark:via-[#120A24] dark:to-[#1E0F3D] text-slate-800 dark:text-slate-100 transition-colors">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="flex items-center gap-3 tracking-tight mb-2">
          <p className="text-3xl">📊</p>
          <span
            className="
                text-2xl sm:text-3xl lg:text-4xl
                font-extrabold leading-tight
                bg-clip-text text-transparent
                bg-linear-to-r
                from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400
              "
          >
            Dashboard Admin
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2">
          Selamat datang! Kelola semua aktivitas magang dari sini.
        </p>
      </div>

      <AnnouncementBox type="admin" />

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summary.map((s, i) => (
          <div
            key={i}
            className="group relative rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div
              className={`absolute inset-0 rounded-2xl bg-linear-to-br ${s.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
            />
            <div className="relative p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  {s.label}
                </p>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {s.value}
                </h2>
              </div>
              <div
                className={`w-12 h-12 rounded-xl bg-linear-to-br ${s.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
              >
                <span className="text-xl">{s.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* NOTIFIKASI PENTING */}
      {menungguVerifikasi > 0 && (
        <div className="mt-6 mb-6 p-4 rounded-xl bg-linear-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-700/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <span className="text-amber-600 dark:text-amber-400">!</span>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Ada {menungguVerifikasi} pendaftaran menunggu verifikasi
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Segera tinjau pendaftaran terbaru
                </p>
              </div>
            </div>
            <a
              href="/dashboard/admin/ViewPendaftaran"
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors"
            >
              Verifikasi Sekarang
            </a>
          </div>
        </div>
      )}

      {/* GRID UTAMA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PENDAFTARAN TERBARU */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur border border-slate-200 dark:border-slate-700 shadow-lg p-4 sm:p-6 h-full">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                📋 Pendaftaran Terbaru
              </h3>
              <a
                href="/dashboard/admin/ViewPendaftaran"
                className="
                  w-full sm:w-auto
                  text-center
                  inline-flex items-center justify-center gap-2
                  px-4 py-2
                  rounded-xl
                  text-sm font-semibold
                  transition-all duration-300
                  shadow-sm hover:shadow-md
                  active:scale-95

                  bg-[#FFF4EC] 
                  text-[#7F1D1D]
                  border border-[#FDE68A]
                  hover:bg-linear-to-r hover:from-[#B91C1C] hover:to-[#F59E0B]
                  hover:text-white

                  dark:bg-indigo-900/30
                  dark:text-indigo-300
                  dark:border-indigo-700/40
                  dark:hover:bg-linear-to-r
                  dark:hover:from-indigo-600
                  dark:hover:to-violet-500
                  dark:hover:text-white
                "
              >
                Lihat Semua →
              </a>
            </div>

            {pendaftaranTerbaru.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <HiUserGroup className="text-2xl text-slate-400" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Belum ada pendaftaran baru
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendaftaranTerbaru.map((pendaftaran) => (
                  <div
                    key={pendaftaran._id}
                    className="group rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 p-4 transition-all duration-300 hover:shadow-md"
                  >
                    {/* TOP INFO */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">
                          {pendaftaran.peserta[0]?.nama ||
                            "Nama tidak tersedia"}
                        </p>

                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {pendaftaran.kategori === "bersama"
                            ? "Pendaftaran Bersama"
                            : "Pendaftaran Individu"}{" "}
                          • {pendaftaran.peserta.length} peserta
                        </p>
                      </div>

                      <span
                        className={`self-start sm:self-auto text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(
                          pendaftaran.status,
                        )}`}
                      >
                        {pendaftaran.status}
                      </span>
                    </div>

                    {/* EMAIL & WA */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-3">
                      <div className="flex items-center gap-2">
                        <HiMail className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {pendaftaran.peserta[0]?.email || "-"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HiPhone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{pendaftaran.peserta[0]?.wa || "-"}</span>
                      </div>
                    </div>

                    {/* FOOTER */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <HiCalendar className="w-3 h-3" />
                        <span>{formatTanggal(pendaftaran.createdAt)}</span>
                        <span>•</span>
                        <span>{hitungHariLalu(pendaftaran.createdAt)}</span>
                      </div>

                      <a
                        href={`/dashboard/admin/ViewPendaftaran#${pendaftaran._id}`}
                        className="
                          w-full sm:w-auto
                          text-center
                          inline-flex items-center justify-center gap-1
                          px-3 py-2
                          rounded-lg
                          text-xs font-semibold
                          transition-all duration-300

                          bg-linear-to-r from-[#B91C1C] to-[#F59E0B]
                          text-white
                          border border-transparent

                          hover:bg-none
                          hover:bg-[#FEF3C7]
                          hover:text-[#7F1D1D]
                          hover:border-[#FDE68A]

                          dark:bg-linear-to-r
                          dark:from-indigo-600
                          dark:to-violet-500
                          dark:text-white

                          dark:hover:bg-none
                          dark:hover:bg-indigo-900/30
                          dark:hover:text-indigo-300
                          dark:hover:border-indigo-700/40
                        "
                      >
                        Detail →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* TUGAS CEPAT (HANYA TAMPILAN) */}
        <div>
          <div className="rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur border border-slate-200 dark:border-slate-700 shadow-lg p-6 h-full">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              ⚡ Tugas Cepat
            </h3>

            <div className="space-y-4">
              {tasks.map((task, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-white/5 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-lg bg-linear-to-br from-[#7F1D1D] to-[#F59E0B] dark:from-indigo-600 dark:to-violet-500 text-white flex items-center justify-center shadow">
                    {task.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {task.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {task.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* STATISTIK SINGKAT */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <h4 className="text-sm font-semibold mb-4">
                📈 Statistik Hari Ini
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-2xl font-bold">{menungguVerifikasi}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Menunggu
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-2xl font-bold">
                    {
                      pendaftaranTerbaru.filter((p) => p.status === "Disetujui")
                        .length
                    }
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Disetujui
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
