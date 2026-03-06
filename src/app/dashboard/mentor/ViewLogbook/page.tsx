"use client";

import { useEffect, useState } from "react";
import {
  HiUser,
  HiBriefcase,
  HiSearch,
  HiArrowLeft,
  HiCalendar,
  HiUsers,
} from "react-icons/hi";
import { MdEmail } from "react-icons/md";
import Calendar from "@/components/logbook/Calendar";
import MentorLogbookModal from "@/components/logbook/MentorLogbookModal";
import { showToast } from "@/components/ui/toastDashboard";

/* ================= TYPE ================= */
type Peserta = {
  _id?: string;
  id?: string;
  nama: string;
  email: string;
  posisi: string;
  kategori?: string;
};

type FilledDateType = {
  _id: string;
  status: "hadir" | "tidak_hadir_keterangan" | "tidak_hadir_tanpa_keterangan";
  approvalStatus: "menunggu" | "disetujui" | "ditolak" | "revisi";
};

export default function ViewLogbookMentor() {
  const [peserta, setPeserta] = useState<Peserta[]>([]);
  const [filteredPeserta, setFilteredPeserta] = useState<Peserta[]>([]);
  const [selectedPeserta, setSelectedPeserta] = useState<Peserta | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filledDates, setFilledDates] = useState<
    Record<string, FilledDateType>
  >({});

  /* =================Summaryboard Mentor================= */
  const summary = Object.values(filledDates).reduce(
    (acc, item) => {
      acc.total++;

      if (item.approvalStatus === "disetujui") {
        if (item.status === "hadir") acc.hadir++;
        if (item.status === "tidak_hadir_keterangan") acc.izin++;
        if (item.status === "tidak_hadir_tanpa_keterangan")
          acc.tanpaKeterangan++;
      }

      if (item.approvalStatus === "ditolak") acc.ditolak++;
      if (item.approvalStatus === "revisi") acc.revisi++;

      return acc;
    },
    {
      total: 0,
      hadir: 0,
      izin: 0,
      tanpaKeterangan: 0,
      ditolak: 0,
      revisi: 0,
    },
  );

  /* ================= FETCH PESERTA BIMBINGAN ================= */
  useEffect(() => {
    const fetchPeserta = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/mentor/peserta`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        if (!res.ok) {
          throw new Error("Gagal fetch peserta");
        }

        const data = await res.json();
        console.log("DATA PESERTA RAW:", data);

        const transformedData = data.map((p: any, index: number) => ({
          ...p,
          _id: p._id || p.id || `temp-${p.email}-${index}`,
          email: p.email || `unknown-${index}@example.com`,
          kategori: p.kategori || "Magang", // Default value jika tidak ada
        }));

        console.log("DATA PESERTA TRANSFORMED:", transformedData);
        setPeserta(transformedData);
        setFilteredPeserta(transformedData);
      } catch (err) {
        console.error("FETCH PESERTA ERROR:", err);
        showToast.error("Gagal memuat data peserta");
        setPeserta([]);
        setFilteredPeserta([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPeserta();
  }, []);

  /* ================= HANDLE SEARCH ================= */
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPeserta(peserta);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = peserta.filter(
      (p) =>
        p.nama.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query) ||
        p.posisi.toLowerCase().includes(query) ||
        (p.kategori && p.kategori.toLowerCase().includes(query)),
    );
    setFilteredPeserta(filtered);
  }, [searchQuery, peserta]);

  /* ================= FETCH FILLED DATES ================= */
  const loadCalendar = async (email: string) => {
    console.log("LOAD CALENDAR EMAIL:", email);

    if (!email) {
      showToast.error("Email peserta tidak valid");
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/logbook/mentor/peserta/email/${email}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error("Gagal fetch logbook");
      }

      const data = await res.json();
      console.log("LOGBOOK DATA:", data);

      // Format data untuk Calendar component
      const map: Record<string, FilledDateType> = {};

      data.forEach((l: any) => {
        map[l.date] = {
          _id: l._id, // WAJIB
          status: l.status,
          approvalStatus: l.approvalStatus || "menunggu",
        };
      });

      // PERBAIKAN: setFilledDates bukan setFiledDates
      setFilledDates(map);
    } catch (err) {
      console.error("LOAD CALENDAR ERROR:", err);
      showToast.error("Gagal memuat logbook peserta");
    }
  };

  /* ================= GET USER ID BY EMAIL ================= */
  const getUserIdByEmail = async (email: string): Promise<string | null> => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/by-email/${email}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (res.ok) {
        const user = await res.json();
        return user._id;
      }
      return null;
    } catch (error) {
      console.error("Error getting user ID:", error);
      return null;
    }
  };

  /* ================= HANDLE VIEW LOGBOOK ================= */
  const handleViewLogbook = async (p: Peserta) => {
    console.log("HANDLE VIEW LOGBOOK FOR:", p);

    let userId = p._id;

    if (!userId || userId.includes("temp-")) {
      const loadingToast = showToast.loading("Mengambil data peserta...");

      setTimeout(async () => {
        try {
          const fetchedUserId = await getUserIdByEmail(p.email);

          if (!fetchedUserId) {
            showToast.updateError(
              loadingToast,
              "Tidak dapat menemukan ID peserta",
            );
            return;
          }

          userId = fetchedUserId;
          const updatedPeserta = { ...p, _id: userId };
          setSelectedPeserta(updatedPeserta);
          showToast.updateSuccess(
            loadingToast,
            "Data peserta berhasil diambil",
          );

          await loadCalendar(p.email);
        } catch (error) {
          showToast.updateError(loadingToast, "Gagal mengambil data peserta");
        }
      }, 0);
    } else {
      setSelectedPeserta(p);
      await loadCalendar(p.email);
    }
  };

  /* ================= RENDER LOADING ================= */
  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-linear-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-6 text-lg text-slate-600 font-medium">
            Memuat data peserta...
          </p>
          <p className="mt-2 text-sm text-slate-500">Harap tunggu sebentar</p>
        </div>
      </div>
    );
  }

  /* ================= DOWNLOAD PDF ================= */
  const handleDownloadLogbook = async (p: Peserta) => {
    try {
      let userId = p._id;

      /* ===== JIKA ID MASIH TEMP, CARI DARI EMAIL ===== */
      if (!userId || userId.includes("temp-")) {
        const loadingToast = showToast.loading("Mengambil data peserta...");

        const fetchedUserId = await getUserIdByEmail(p.email);

        if (!fetchedUserId) {
          showToast.updateError(loadingToast, "Gagal menemukan ID peserta");
          return;
        }

        userId = fetchedUserId;

        showToast.updateSuccess(loadingToast, "Data peserta ditemukan");
      }

      setDownloadingId(userId);

      /* ===== DOWNLOAD ===== */
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/logbook/mentor/${userId}/download/pdf`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error("Gagal download");
      }

      const blob = await res.blob();

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `logbook-${p.nama}.pdf`;

      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showToast.success("Logbook berhasil diunduh");
    } catch (err) {
      console.error("[DOWNLOAD ERROR]", err);
      showToast.error("Gagal download logbook");
    } finally {
      setDownloadingId(null);
    }
  };

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
        <h1 className="flex items-center gap-3 tracking-tight mb-2">
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
            Logbook Peserta
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Kelola dan pantau logbook peserta magang Anda
        </p>
      </div>

      {!selectedPeserta ? (
        <>
          {/* ================= STATISTICS CARDS ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {/* ===== CARD 1 ===== */}
            <div
              className="
                  group
                  relative
                  rounded-2xl
                  border border-[#FCA5A5]/40 dark:border-indigo-500/30
                  bg-linear-to-br
                  from-[#FFFDF8] via-[#FFF4EC] to-white
                  dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-800
                  p-6
                  shadow-sm
                  hover:shadow-xl
                  transition
                "
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#7F1D1D] dark:text-indigo-300">
                    Total Peserta
                  </p>
                  <p className="text-4xl font-extrabold text-[#7F1D1D] dark:text-white mt-1">
                    {peserta.length}
                  </p>
                </div>
                <div
                  className="
                      w-14 h-14
                      rounded-2xl
                      bg-[#B91C1C]/90 dark:bg-indigo-600
                      text-white
                      flex items-center justify-center
                      shadow
                      group-hover:scale-110 transition
                    "
                >
                  <HiUsers className="w-7 h-7" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#FCA5A5]/40 dark:border-indigo-500/30">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Jumlah peserta bimbingan aktif
                </p>
              </div>
            </div>

            {/* ===== CARD 2 ===== */}
            <div
              className="
                  group
                  relative
                  rounded-2xl
                  border border-[#FCA5A5]/40 dark:border-indigo-500/30
                  bg-linear-to-br
                  from-[#FFFDF8] via-[#FFF4EC] to-white
                  dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-800
                  p-6
                  shadow-sm
                  hover:shadow-xl
                  transition
                "
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#7F1D1D] dark:text-indigo-300">
                    Sedang Dipantau
                  </p>
                  <p className="text-4xl font-extrabold text-[#7F1D1D] dark:text-white mt-1">
                    {filteredPeserta.length}
                  </p>
                </div>
                <div
                  className="
                      w-14 h-14
                      rounded-2xl
                      bg-amber-500 dark:bg-violet-500
                      text-white
                      flex items-center justify-center
                      shadow
                      group-hover:scale-110 transition
                    "
                >
                  <HiUser className="w-7 h-7" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#FCA5A5]/40 dark:border-indigo-500/30">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Hasil pencarian: "{searchQuery || "Semua peserta"}"
                </p>
              </div>
            </div>

            {/* ===== CARD 3 ===== */}
            <div
              className="
                  group
                  relative
                  rounded-2xl
                  border border-[#FCA5A5]/40 dark:border-indigo-500/30
                  bg-linear-to-br
                  from-[#FFFDF8] via-[#FFF4EC] to-white
                  dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-800
                  p-6
                  shadow-sm
                  hover:shadow-xl
                  transition
                "
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#7F1D1D] dark:text-indigo-300">
                    Posisi Tersedia
                  </p>
                  <p className="text-4xl font-extrabold text-[#7F1D1D] dark:text-white mt-1">
                    {[...new Set(peserta.map((p) => p.posisi))].length}
                  </p>
                </div>
                <div
                  className="
                      w-14 h-14
                      rounded-2xl
                      bg-[#F97316] dark:bg-indigo-700
                      text-white
                      flex items-center justify-center
                      shadow
                      group-hover:scale-110 transition
                    "
                >
                  <HiBriefcase className="w-7 h-7" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#FCA5A5]/40 dark:border-indigo-500/30">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Berbagai posisi magang
                </p>
              </div>
            </div>
          </div>

          {/* ================= SEARCH BAR ================= */}
          <div className="mb-8">
            <div className="relative">
              <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7F1D1D] dark:text-indigo-400 w-5 h-5 z-10" />
              <input
                type="text"
                placeholder="Cari peserta berdasarkan nama, email, posisi, atau kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                    w-full pl-11 pr-10 py-3
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
            </div>
            <div className="mt-2 flex flex-wrap justify-between text-sm text-slate-500">
              <p>
                Menampilkan {filteredPeserta.length} dari {peserta.length}{" "}
                peserta
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="
                      text-[#7F1D1D] dark:text-indigo-300
                      hover:underline
                      font-semibold
                    "
                >
                  Reset pencarian
                </button>
              )}
            </div>
          </div>

          {/* ================= TABLE PESERTA ================= */}
          {filteredPeserta.length === 0 ? (
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
              <div
                className="
                    w-16 h-16 sm:w-20 sm:h-20
                    mx-auto mb-5
                    rounded-full
                    bg-linear-to-br
                    from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                    dark:from-indigo-600 dark:to-violet-500
                    flex items-center justify-center
                    shadow-lg
                    animate-pulse
                  "
              >
                <HiUser className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#7F1D1D] dark:text-indigo-300 mb-2">
                {searchQuery
                  ? "Peserta tidak ditemukan"
                  : "Belum ada peserta bimbingan"}
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                {searchQuery
                  ? `Tidak ada peserta yang sesuai dengan pencarian "${searchQuery}". Coba dengan kata kunci lain.`
                  : "Saat ini belum ada peserta yang ditugaskan untuk bimbingan Anda."}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="
                      inline-flex items-center justify-center
                      px-5 sm:px-6 py-2.5 sm:py-3
                      rounded-xl
                      text-sm font-semibold
                      text-white
                      bg-linear-to-r from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                      dark:from-indigo-600 dark:to-violet-500
                      shadow hover:shadow-lg hover:-translate-y-0.5
                      transition
                    "
                >
                  Tampilkan Semua Peserta
                </button>
              )}
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
                        Aksi
                      </th>
                    </tr>
                  </thead>

                  {/* ================= BODY ================= */}
                  <tbody className="divide-y divide-slate-100 dark:divide-indigo-500/20">
                    {filteredPeserta.map((p, i) => (
                      <tr
                        key={p.email}
                        className="hover:bg-[#FEF3C7]/40 dark:hover:bg-indigo-500/10 transition"
                      >
                        <td className="py-4 px-6 text-center font-medium text-slate-500 dark:text-slate-300">
                          {i + 1}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center items-center gap-3">
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
                            <div className="text-left leading-tight">
                              <p className="font-medium text-slate-800 dark:text-slate-100">
                                {p.nama}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Peserta Magang
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center items-center gap-2 text-slate-600 dark:text-slate-300">
                            <MdEmail className="w-4 h-4" />
                            <span className="truncate max-w-50">{p.email}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center">
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                              {p.posisi}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center">
                            <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                              {p.kategori}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          <div
                            className="
                                flex flex-col sm:flex-row
                                items-stretch sm:items-center
                                justify-center
                                gap-2 sm:gap-3
                              "
                          >
                            {/* LIHAT */}
                            <button
                              onClick={() => handleViewLogbook(p)}
                              className="
                                  w-full sm:w-auto
                                  group
                                  inline-flex items-center justify-center gap-2
                                  px-4 sm:px-5 py-2.5
                                  rounded-xl
                                  text-xs sm:text-sm font-semibold
                                  text-white

                                  bg-linear-to-r from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                                  hover:from-[#991B1B] hover:via-[#DC2626] hover:to-[#FBBF24]

                                  dark:from-indigo-600 dark:to-violet-500
                                  dark:hover:from-indigo-500 dark:hover:to-violet-400

                                  shadow-md hover:shadow-xl
                                  transition
                                "
                            >
                              <HiCalendar className="w-4 h-4" />
                              Lihat
                            </button>

                            {/* DOWNLOAD */}
                            <button
                              onClick={() => handleDownloadLogbook(p)}
                              disabled={downloadingId === p._id}
                              className="
                                  w-full sm:w-auto
                                  group
                                  inline-flex items-center justify-center gap-2
                                  px-4 sm:px-5 py-2.5
                                  rounded-xl
                                  text-xs sm:text-sm font-semibold
                                  text-white

                                  bg-emerald-600 hover:bg-emerald-700
                                  disabled:opacity-50

                                  shadow-md hover:shadow-xl
                                  transition
                                "
                            >
                              📄{" "}
                              {downloadingId === p._id ? "Loading..." : "PDF"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* ================= CALENDAR VIEW ================= */}
          <div className="mb-6">
            <button
              onClick={() => {
                setSelectedPeserta(null);
                setSelectedDate(null);
                setFilledDates({});
              }}
              className="
                  inline-flex items-center gap-2
                  px-4 py-2 text-sm font-semibold
                  rounded-xl
                  bg-[#FFF1F2] text-[#7F1D1D]
                  hover:bg-[#FEE2E2]
                  dark:bg-indigo-500/20 dark:text-indigo-300
                  dark:hover:bg-indigo-500/30
                  transition
                "
            >
              <HiArrowLeft className="w-4 h-4" />
              Kembali
            </button>
          </div>

          <div
            className="
                relative
                rounded-3xl
                border border-[#FCA5A5]/40 dark:border-indigo-500/30
                bg-linear-to-br
                from-[#FFFDF8] via-[#FFF1E8] to-white
                dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-800
                p-4 sm:p-6 lg:p-8
                shadow-md hover:shadow-xl
                transition
                mb-8
              "
          >
            {/* ===== HEADER ===== */}
            <div
              className="
                  flex flex-col gap-4
                  sm:flex-row sm:items-center sm:justify-between
                  mb-6
                "
            >
              {/* LEFT */}
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#7F1D1D] dark:text-white">
                  Logbook
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {selectedPeserta.nama}
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <MdEmail className="w-4 h-4" />
                    {selectedPeserta.email}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <HiBriefcase className="w-4 h-4" />
                    {selectedPeserta.posisi}
                  </div>
                </div>
              </div>

              {/* RIGHT COUNTER */}
              <div
                className="
                    flex items-center gap-3
                    px-4 py-3
                    rounded-2xl
                    bg-[#FFF1F2]
                    dark:bg-indigo-500/20
                    border border-[#FCA5A5]/40 dark:border-indigo-500/30
                  "
              >
                <div
                  className="
                      w-10 h-10
                      rounded-xl
                      bg-linear-to-br from-[#7F1D1D] to-[#F59E0B]
                      dark:from-indigo-600 dark:to-violet-500
                      text-white
                      flex items-center justify-center
                      font-bold
                      shadow
                    "
                >
                  {Object.keys(filledDates).length}
                </div>
                <div className="leading-tight">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Total Logbook
                  </p>
                  <p className="text-sm font-semibold text-[#7F1D1D] dark:text-indigo-300">
                    Hari Terisi
                  </p>
                </div>
              </div>
            </div>

            {/* ===== SUMMARY BOARD ===== */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <SummaryCard
                icon="📘"
                title="Total Logbook"
                value={summary.total}
                desc="Seluruh catatan"
              />

              <SummaryCard
                icon="✅"
                title="Hadir"
                value={summary.hadir}
                desc="Kehadiran valid"
                color="text-emerald-600"
              />

              <SummaryCard
                icon="📝"
                title="Tidak Hadir (Ket.)"
                value={summary.izin}
                desc="Dengan keterangan"
                color="text-blue-600"
              />

              <SummaryCard
                icon="❌"
                title="Tanpa Keterangan"
                value={summary.tanpaKeterangan}
                desc="Perlu perhatian"
                color="text-red-600"
              />

              <SummaryCard
                icon="⛔"
                title="Ditolak"
                value={summary.ditolak}
                desc="Ditolak mentor"
                color="text-rose-600"
              />

              <SummaryCard
                icon="✏️"
                title="Revisi"
                value={summary.revisi}
                desc="Perlu revisi"
                color="text-purple-600"
              />
            </div>

            {/* ===== CALENDAR WRAPPER ===== */}
            <div
              className="
                  rounded-2xl
                  bg-white/80 dark:bg-white/5
                  backdrop-blur
                  border border-[#FCA5A5]/30 dark:border-indigo-500/30
                  p-3 sm:p-4
                "
            >
              <Calendar
                filledDates={filledDates}
                onSelectDate={(date) => setSelectedDate(date)}
              />
            </div>
          </div>
        </>
      )}

      {/* ================= MODAL ================= */}
      {selectedDate && selectedPeserta && (
        <MentorLogbookModal
          date={selectedDate}
          pesertaId={selectedPeserta._id || ""}
          pesertaNama={selectedPeserta.nama}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  desc,
  color = "text-slate-800",
}: {
  icon: string;
  title: string;
  value: number;
  desc: string;
  color?: string;
}) {
  return (
    <div
      className="
      rounded-2xl p-4 text-center
      bg-white dark:bg-indigo-900/40
      border border-slate-200 dark:border-indigo-500/30
      shadow-sm
    "
    >
      <div className="text-xl mb-1">{icon}</div>

      <div className={`text-2xl font-bold ${color}`}>{value}</div>

      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        {title}
      </div>

      <div className="text-xs text-slate-500 dark:text-slate-400">{desc}</div>
    </div>
  );
}
