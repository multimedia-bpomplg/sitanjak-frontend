"use client";

import { useEffect, useState } from "react";
import {
  HiDocumentText,
  HiUser,
  HiBriefcase,
  HiSearch,
  HiUsers,
  HiCheckCircle,
  HiXCircle,
} from "react-icons/hi";
import { MdEmail } from "react-icons/md";
import PesertaDetailModal from "@/components/peserta/PesertaDetailModal";

/* ================= TYPE ================= */
type Peserta = {
  nama: string;
  email: string;
  posisi: string;
  mentor?: {
    name: string;
    email: string;
  };
  kategori?: string;
};

export default function ViewPendaftaranUI() {
  const [data, setData] = useState<Peserta[]>([]);
  const [filteredData, setFilteredData] = useState<Peserta[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedPeserta, setSelectedPeserta] = useState<Peserta | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  /* ================= FETCH PESERTA TERKONEKSI MENTOR ================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/mentor/peserta`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!res.ok) throw new Error("Gagal mengambil data");

        const json = await res.json();
        setData(json);
        setFilteredData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* ================= HANDLE SEARCH ================= */
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredData(data);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = data.filter(
      (p) =>
        p.nama.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query) ||
        p.posisi.toLowerCase().includes(query),
    );
    setFilteredData(filtered);
  }, [searchQuery, data]);

  /* ================= STATISTICS ================= */
  const connectedToMentor = data.filter((p) => p.mentor).length;
  const noMentor = data.length - connectedToMentor;

  const statCards = [
    {
      title: "Jumlah Peserta",
      value: data.length,
      desc: "Total peserta yang terdaftar",
      icon: <HiUsers />,
    },
    {
      title: "Terkoneksi Mentor",
      value: connectedToMentor,
      desc: "Peserta sudah mendapatkan mentor",
      icon: <HiCheckCircle />,
    },
    {
      title: "Belum Mentor",
      value: noMentor,
      desc: "Menunggu penugasan mentor",
      icon: <HiXCircle />,
    },
  ];

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
      {/* ================= HEADER ================= */}
      <div className="mb-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">Data Pendaftaran</h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Kelola data peserta yang terdaftar dalam program magang
        </p>
      </div>

      {/* ================= STATISTICS CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="
              group relative overflow-hidden
              rounded-3xl
              bg-white/80 dark:bg-white/5
              backdrop-blur
              border border-[#F59E0B]/30 dark:border-indigo-500/30
              shadow-md hover:shadow-xl
              transition-all
            "
          >
            {/* glow */}
            <div
              className="
                absolute inset-0 rounded-3xl
                bg-linear-to-br from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                dark:from-indigo-600 dark:to-violet-500
                opacity-0 group-hover:opacity-20 blur-xl
                transition
              "
            />

            <div className="relative p-5 sm:p-6 flex items-center justify-between">
              {/* TEXT */}
              <div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {card.title}
                </p>
                <p className="text-3xl sm:text-4xl font-extrabold mt-1 text-slate-900 dark:text-white">
                  {card.value}
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {card.desc}
                </p>
              </div>

              {/* ICON */}
              <div
                className="
                  shrink-0
                  w-12 h-12 sm:w-14 sm:h-14
                  rounded-2xl
                  bg-linear-to-br from-[#7F1D1D] to-[#F59E0B]
                  dark:from-indigo-600 dark:to-violet-500
                  flex items-center justify-center
                  text-white text-xl sm:text-2xl
                  shadow-lg
                "
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ================= SEARCH AND ACTION BAR ================= */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7F1D1D] dark:text-indigo-400 w-5 h-5 z-10" />
            <input
              type="text"
              placeholder="Cari peserta berdasarkan nama, email, atau posisi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full pl-11 sm:pl-12 pr-10 py-3
                rounded-2xl
                bg-white/90 dark:bg-white/5
                backdrop-blur
                border border-[#F59E0B]/40 dark:border-indigo-500/40
                text-slate-700 dark:text-slate-100
                placeholder:text-slate-400
                focus:outline-none focus:ring-2
                focus:ring-[#B91C1C]/60 dark:focus:ring-indigo-500/60
                transition
              "
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="
                  absolute right-4 top-1/2 -translate-y-1/2
                  text-slate-400
                  hover:text-rose-600
                  transition
                "
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between text-sm">
          <span
            className="
              inline-flex items-center gap-1
              px-3 py-1 rounded-full
              bg-[#FEF3C7] text-[#7F1D1D]
              dark:bg-indigo-500/20 dark:text-indigo-300
              font-semibold
            "
          >
            Menampilkan {filteredData.length} dari {data.length} peserta
          </span>

          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="
                w-fit
                inline-flex items-center gap-1
                px-3 py-1 rounded-full
                text-xs sm:text-sm
                bg-linear-to-r from-[#7F1D1D] to-[#F59E0B]
                dark:from-indigo-600 dark:to-violet-500
                text-white font-bold
                shadow hover:shadow-lg
                transition
              "
            >
              Reset pencarian
              <span className="group-hover:translate-x-1 transition">↺</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= TABLE ================= */}
      {loading ? (
        <div
          className="
            rounded-3xl
            bg-white/80 dark:bg-white/5
            backdrop-blur
            border border-[#F59E0B]/30 dark:border-indigo-500/30
            shadow-xl
            p-12 text-center
          "
        >
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto" />
          <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 font-medium">
            Memuat data peserta...
          </p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="bg-white dark:bg-white/5 rounded-2xl border p-12 text-center">
          <h3 className="text-xl font-semibold">Peserta tidak ditemukan</h3>
        </div>
      ) : (
        <div
          className="
            rounded-2xl
            bg-white/90 dark:bg-white/5
            backdrop-blur
            border border-slate-200 dark:border-indigo-500/30
            shadow-lg
            overflow-hidden
          "
        >
          <div className="overflow-x-auto">
            <table className="min-w-225 w-full text-sm sm:text-base">
              {/* ================= HEAD ================= */}
              <thead>
                <tr className="bg-slate-50 dark:bg-indigo-500/10 border-b border-slate-200 dark:border-indigo-500/30">
                  <th className="w-[8%] py-4 px-6 text-center text-xs font-semibold text-slate-600 dark:text-indigo-200 uppercase">
                    No
                  </th>
                  <th className="w-[22%] py-4 px-6 text-center text-xs font-semibold text-slate-600 dark:text-indigo-200 uppercase">
                    Peserta
                  </th>
                  <th className="w-[22%] py-4 px-6 text-center text-xs font-semibold text-slate-600 dark:text-indigo-200 uppercase">
                    Email
                  </th>
                  <th className="w-[16%] py-4 px-6 text-center text-xs font-semibold text-slate-600 dark:text-indigo-200 uppercase">
                    Posisi
                  </th>
                  <th className="w-[14%] py-4 px-6 text-center text-xs font-semibold text-slate-600 dark:text-indigo-200 uppercase">
                    Kategori
                  </th>
                  <th className="w-[18%] py-4 px-6 text-center text-xs font-semibold text-slate-600 dark:text-indigo-200 uppercase">
                    Status
                  </th>
                </tr>
              </thead>

              {/* ================= BODY ================= */}
              <tbody className="divide-y divide-slate-100 dark:divide-indigo-500/20">
                {filteredData.map((p, i) => (
                  <tr
                    key={`${p.email}-${i}`}
                    className="hover:bg-[#FEF3C7]/40 dark:hover:bg-indigo-500/10 transition"
                  >
                    {/* NO */}
                    <td className="py-4 px-6 text-center font-medium text-slate-500 dark:text-slate-300">
                      {i + 1}
                    </td>

                    {/* PESERTA */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center">
                        <div
                          onClick={() => {
                            setSelectedPeserta(p);
                            setOpenModal(true);
                          }}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <div
                            className="
                              shrink-0 w-10 h-10 min-w-10 min-h-10
                              rounded-full
                              bg-linear-to-br from-[#7F1D1D] to-[#F59E0B]
                              dark:from-indigo-600 dark:to-violet-500
                              flex items-center justify-center
                              text-white shadow
                              group-hover:scale-110 transition
                            "
                          >
                            <HiUser className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-slate-800 dark:text-slate-100">
                              {p.nama}
                            </p>
                            <p className="text-xs text-[#7F1D1D]">
                              Klik untuk lihat detail
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* KONTAK */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center items-center gap-2 text-slate-600 dark:text-slate-300">
                        <MdEmail className="w-4 h-4" />
                        <span className="truncate max-w-50">
                          {p.email}
                        </span>
                      </div>
                    </td>

                    {/* POSISI */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                          <HiBriefcase className="w-3 h-3" />
                          {p.posisi}
                        </span>
                      </div>
                    </td>

                    {/* KATEGORI */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center">
                        <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200">
                          {p.kategori || "Bersama"}
                        </span>
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <StatusBadge />
                        {p.mentor ? (
                          <span className="text-xs text-emerald-600">
                            ✓ Terkoneksi mentor
                          </span>
                        ) : (
                          <span className="text-xs text-amber-600">
                            ⏳ Menunggu mentor
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL ================= */}
      <PesertaDetailModal
        open={openModal}
        peserta={selectedPeserta}
        onClose={() => {
          setOpenModal(false);
          setSelectedPeserta(null);
        }}
      />
    </div>
  );
}

/* ================= COMPONENTS ================= */

function StatusBadge() {
  return (
    <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
      Disetujui
    </span>
  );
}
