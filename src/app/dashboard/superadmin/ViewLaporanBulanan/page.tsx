"use client";

import { useEffect, useState } from "react";
import {
  HiDocumentText,
  HiUser,
  HiMail,
  HiCalendar,
  HiCheckCircle,
  HiXCircle,
  HiExclamationCircle,
  HiSearch,
  HiBookOpen,
  HiChevronDown,
} from "react-icons/hi";
import SuperadminLaporanBulananModal from "@/components/superadmin/SuperadminLaporanBulananModal";

type LaporanBulanan = {
  _id: string;
  month: string;
  status: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  approvedByMentor?: {
    _id: string;
    name: string;
    email: string;
  };
  mentorNote?: string;
  approvedAt?: string;
  createdAt: string;
};

type PesertaLaporan = {
  _id: string;
  name: string;
  email: string;
  totalLaporan: number;
  disetujui: number;
  perbaiki: number;
  ditolak: number;
  menunggu: number;
  laporanTerakhir?: string;
  laporanMonths: string[]; // Tambahkan field untuk menyimpan bulan-bulan laporan
};

type PesertaLaporanDetail = {
  _id: string;
  name: string;
  email: string;
  totalLaporan: number;
  disetujui: number;
  perbaiki: number;
  ditolak: number;
  menunggu: number;
  laporanTerakhir?: string;
  laporanMonths: string[];
  laporanDetails: LaporanBulanan[]; // Tambahkan field untuk detail laporan
};

export default function ViewLaporanBulananSuperadmin() {
  const [laporanList, setLaporanList] = useState<LaporanBulanan[]>([]);
  const [pesertaLaporan, setPesertaLaporan] = useState<PesertaLaporan[]>([]);
  const [filteredPeserta, setFilteredPeserta] = useState<PesertaLaporan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPeserta, setSelectedPeserta] =
    useState<PesertaLaporanDetail | null>(null);
  const [selectedLaporan, setSelectedLaporan] = useState<LaporanBulanan | null>(
    null,
  );
  const [showMonthModal, setShowMonthModal] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/laporan-bulanan`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      const data = await res.json();
      setLaporanList(data);

      // Group laporan by peserta
      const pesertaMap = new Map<string, PesertaLaporan>();
      const pesertaLaporanMap = new Map<string, LaporanBulanan[]>();

      data.forEach((laporan: LaporanBulanan) => {
        if (!laporan.user || !laporan.user._id) {
          console.warn("Laporan tanpa user:", laporan);
          return; // ⛔ skip data rusak
        }

        const userId = laporan.user._id;

        // Map untuk detail laporan
        if (!pesertaLaporanMap.has(userId)) {
          pesertaLaporanMap.set(userId, []);
        }
        pesertaLaporanMap.get(userId)!.push(laporan);

        // Map untuk summary
        if (!pesertaMap.has(userId)) {
          pesertaMap.set(userId, {
            _id: userId,
            name: laporan.user.name,
            email: laporan.user.email,
            totalLaporan: 0,
            disetujui: 0,
            perbaiki: 0,
            ditolak: 0,
            menunggu: 0,
            laporanTerakhir: "",
            laporanMonths: [],
          });
        }

        const peserta = pesertaMap.get(userId)!;
        peserta.totalLaporan++;

        switch (laporan.status) {
          case "Disetujui":
            peserta.disetujui++;
            break;
          case "Perbaiki":
            peserta.perbaiki++;
            break;
          case "Ditolak":
            peserta.ditolak++;
            break;
          default:
            peserta.menunggu++;
            break;
        }

        // Tambahkan bulan ke array
        if (!peserta.laporanMonths.includes(laporan.month)) {
          peserta.laporanMonths.push(laporan.month);
        }

        // Set laporan terakhir
        if (
          !peserta.laporanTerakhir ||
          laporan.createdAt > peserta.laporanTerakhir
        ) {
          peserta.laporanTerakhir = laporan.createdAt;
        }
      });

      // Sort months untuk setiap peserta
      pesertaMap.forEach((peserta) => {
        peserta.laporanMonths.sort((a, b) => {
          const [yearA, monthA] = a.split("-").map(Number);
          const [yearB, monthB] = b.split("-").map(Number);

          if (yearA !== yearB) return yearB - yearA; // Tahun lebih baru duluan
          return monthB - monthA; // Bulan lebih baru duluan
        });
      });

      // Convert map to array
      const pesertaArray = Array.from(pesertaMap.values()).sort(
        (a, b) =>
          new Date(b.laporanTerakhir || 0).getTime() -
          new Date(a.laporanTerakhir || 0).getTime()
      );

      setPesertaLaporan(pesertaArray);
      setFilteredPeserta(pesertaArray);
      setPage(1); // Reset ke halaman pertama saat data baru dimuat
    } catch (error) {
      console.error("Gagal memuat laporan bulanan", error);
    } finally {
      setLoading(false);
    }
  };

  const getLaporanByPeserta = (pesertaId: string) => {
    return laporanList.filter(
      (laporan) => laporan.user && laporan.user._id === pesertaId
    );
  };

  const handleViewLaporan = async (peserta: PesertaLaporan) => {
    // Ambil detail laporan untuk peserta ini
    const laporanDetails = getLaporanByPeserta(peserta._id);

    const pesertaDetail: PesertaLaporanDetail = {
      ...peserta,
      laporanDetails: laporanDetails.sort((a, b) => {
        // Sort by month descending
        const [yearA, monthA] = a.month.split("-").map(Number);
        const [yearB, monthB] = b.month.split("-").map(Number);

        if (yearA !== yearB) return yearB - yearA;
        return monthB - monthA;
      }),
    };

    setSelectedPeserta(pesertaDetail);
    setShowMonthModal(true);
  };

  const handleSelectLaporan = (laporan: LaporanBulanan) => {
    setSelectedLaporan(laporan);
    setShowMonthModal(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredPeserta(pesertaLaporan);
      setPage(1); // Reset ke halaman pertama saat pencarian diubah
      return;
    }

    const query = search.toLowerCase();
    const filtered = pesertaLaporan.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query),
    );
    setFilteredPeserta(filtered);
    setPage(1); // Reset ke halaman pertama saat pencarian diubah
  }, [search, pesertaLaporan]);

  // Calculate pagination
  const totalPage = Math.ceil(filteredPeserta.length / itemsPerPage);
  const indexOfLastItem = page * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPeserta.slice(indexOfFirstItem, indexOfLastItem);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Disetujui":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
            <HiCheckCircle /> Disetujui
          </span>
        );
      case "Ditolak":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            <HiXCircle /> Ditolak
          </span>
        );
      case "Perbaiki":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
            <HiExclamationCircle /> Perbaiki
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
            <HiDocumentText /> Menunggu
          </span>
        );
    }
  };

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split("-");
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString(
      "id-ID",
      {
        month: "long",
        year: "numeric",
      },
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Modal untuk pilih bulan
  const MonthSelectionModal = () => {
    if (!selectedPeserta) return null;

    return (
      <div className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/40 dark:bg-black/70
        backdrop-blur-md
        p-3 sm:p-6
      ">
        <div className="
          w-full max-w-3xl
          bg-white/90 dark:bg-indigo-950/40
          backdrop-blur
          rounded-3xl
          border border-[#F59E0B]/40
          dark:border-indigo-500/30
          shadow-2xl
          overflow-hidden
          flex flex-col
          max-h-[92vh]
        ">
          {/* ================= HEADER ================= */}
          <div className="
            px-5 sm:px-6 py-4 sm:py-5
            bg-linear-to-r
            from-[#F59E0B] via-[#B91C1C] to-[#7F1D1D]
            dark:from-indigo-600 dark:to-violet-500
            text-white
            flex items-center justify-between
          ">
            {/* LEFT */}
            <div className="flex items-center gap-3">
              <HiCalendar className="text-xl" />
              <div>
                <h2 className="text-lg sm:text-xl font-bold">
                  Pilih Laporan Bulanan
                </h2>
                <div className="flex flex-wrap gap-x-4 text-xs sm:text-sm opacity-90">
                  <div className="flex items-center gap-1">
                    <HiUser />
                    <span>{selectedPeserta.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <HiMail />
                    <span>{selectedPeserta.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <button
              onClick={() => {
                setShowMonthModal(false);
                setSelectedPeserta(null);
              }}
              className="
                p-2 rounded-full
                hover:bg-white/20
                transition
              "
            >
              <HiXCircle className="text-xl" />
            </button>
          </div>

          {/* ================= BODY ================= */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-6 modal-scroll">

            {/* SUMMARY */}
            <div>
              <h3 className="
                text-sm sm:text-base font-bold
                text-[#7F1D1D]
                dark:text-indigo-300
                mb-2
              ">
                Ringkasan Laporan
              </h3>

              <div className="flex flex-wrap gap-2">
                <span className="
                  inline-flex items-center gap-1
                  px-3 py-1.5
                  rounded-full text-xs font-semibold
                  bg-emerald-100 text-emerald-700
                  dark:bg-emerald-500/20 dark:text-emerald-200
                ">
                  <HiCheckCircle /> {selectedPeserta.disetujui} Disetujui
                </span>

                <span className="
                  inline-flex items-center gap-1
                  px-3 py-1.5
                  rounded-full text-xs font-semibold
                  bg-amber-100 text-amber-700
                  dark:bg-amber-500/20 dark:text-amber-200
                ">
                  <HiExclamationCircle /> {selectedPeserta.perbaiki} Perbaiki
                </span>

                <span className="
                  inline-flex items-center gap-1
                  px-3 py-1.5
                  rounded-full text-xs font-semibold
                  bg-red-100 text-red-700
                  dark:bg-red-500/20 dark:text-red-200
                ">
                  <HiXCircle /> {selectedPeserta.ditolak} Ditolak
                </span>

                <span className="
                  inline-flex items-center gap-1
                  px-3 py-1.5
                  rounded-full text-xs font-semibold
                  bg-blue-100 text-blue-700
                  dark:bg-indigo-500/20 dark:text-indigo-200
                ">
                  <HiDocumentText /> {selectedPeserta.menunggu} Menunggu
                </span>
              </div>
            </div>

            {/* LIST */}
            <div className="space-y-3">
              <h4 className="
                text-sm font-bold
                text-[#7F1D1D]
                dark:text-indigo-300
              ">
                Pilih Bulan Laporan
              </h4>

              {selectedPeserta.laporanDetails.length === 0 ? (
                <div className="
                  text-center py-10
                  rounded-2xl
                  bg-white/80 dark:bg-indigo-950/40
                  border border-slate-200 dark:border-indigo-500/30
                ">
                  <HiDocumentText className="text-4xl text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-300">
                    Belum ada laporan bulanan
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedPeserta.laporanDetails.map((laporan) => (
                    <button
                      key={laporan._id}
                      onClick={() => handleSelectLaporan(laporan)}
                      className="
                        group
                        p-4
                        rounded-2xl
                        text-left
                        bg-white/80 dark:bg-indigo-950/40
                        border border-slate-200 dark:border-indigo-500/30
                        hover:border-[#F59E0B] dark:hover:border-indigo-400
                        hover:shadow-lg
                        transition-all
                      "
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <HiCalendar className="w-4 h-4 text-slate-500 dark:text-indigo-300" />
                            <span className="font-semibold">
                              {formatMonth(laporan.month)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Submit: {formatDate(laporan.createdAt)}
                          </p>
                        </div>
                        <div>{getStatusBadge(laporan.status)}</div>
                      </div>

                      {laporan.mentorNote && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          <span className="font-semibold">Catatan:</span>{" "}
                          {laporan.mentorNote}
                        </p>
                      )}

                      <div className="
                        mt-3 flex items-center gap-2
                        text-xs text-slate-400
                        group-hover:text-[#7F1D1D]
                        dark:group-hover:text-indigo-300
                        transition
                      ">
                        <span>Klik untuk detail</span>
                        <HiChevronDown className="w-3 h-3" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ================= FOOTER ================= */}
          <div className="
            px-5 sm:px-6 py-4
            border-t border-[#F59E0B]/30
            dark:border-indigo-500/30
            bg-white/60 dark:bg-indigo-950/30
            backdrop-blur
          ">
            <button
              onClick={() => {
                setShowMonthModal(false);
                setSelectedPeserta(null);
              }}
              className="
                w-full
                px-6 py-2.5
                rounded-xl
                bg-linear-to-r
                from-[#F59E0B] via-[#B91C1C] to-[#7F1D1D]
                hover:from-amber-400 hover:via-[#DC2626] hover:to-[#991B1B]
                dark:from-indigo-600 dark:to-violet-500
                dark:hover:from-indigo-500 dark:hover:to-violet-400
                text-white font-semibold
                shadow-md hover:shadow-xl
                transition-all
              "
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
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
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-3">
          Laporan Bulanan Peserta
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Kelola dan review laporan bulanan semua peserta
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Peserta"
          value={pesertaLaporan.length}
          icon={<HiUser className="w-7 h-7" />}
          note="Jumlah seluruh peserta"
          color="indigo"
        />

        <StatCard
          title="Total Laporan"
          value={laporanList.length}
          icon={<HiDocumentText className="w-7 h-7" />}
          note="Jumlah laporan bulanan"
          color="slate"
        />

        <StatCard
          title="Disetujui"
          value={laporanList.filter((l) => l.status === "Disetujui").length}
          icon={<HiCheckCircle className="w-7 h-7" />}
          note="Laporan telah disetujui"
          color="emerald"
        />

        <StatCard
          title="Perlu Perbaikan"
          value={laporanList.filter((l) => l.status === "Perbaiki").length}
          icon={<HiExclamationCircle className="w-7 h-7" />}
          note="Laporan perlu revisi"
          color="amber"
        />
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7F1D1D] dark:text-indigo-400 w-5 h-5 z-10" />
          <input
            type="text"
            placeholder="Cari peserta berdasarkan nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
      </div>

      {/* ===================== TABLE ===================== */}
      {!loading && currentItems.length === 0 ? (
        /* ================= EMPTY STATE ================= */
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
            {search ? "Peserta tidak ditemukan" : "Belum ada data peserta"}
          </h3>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {search
              ? `Tidak ada peserta yang sesuai dengan pencarian "${search}".`
              : "Saat ini belum ada data peserta."}
          </p>
        </div>
      ) : (
        /* ================= TABLE WRAPPER ================= */
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
            <table className="min-w-200 w-full text-sm sm:text-base">
              {/* ================= HEAD ================= */}
              <thead>
                <tr
                  className="
                    bg-slate-50 dark:bg-indigo-500/10
                    border-b border-slate-200 dark:border-indigo-500/30
                  "
                >
                  <th className="w-[6%] py-4 px-6 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                    No
                  </th>
                  <th className="w-[24%] py-4 px-6 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                    Peserta
                  </th>
                  <th className="w-[26%] py-4 px-6 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                    Statistik Laporan
                  </th>
                  <th className="w-[18%] py-4 px-6 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                    Laporan Terakhir
                  </th>
                  <th className="w-[16%] py-4 px-6 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                    Aksi
                  </th>
                </tr>
              </thead>

              {/* ================= BODY ================= */}
              <tbody className="divide-y divide-slate-100 dark:divide-indigo-500/20">
                {currentItems.map((peserta, index) => (
                  <tr
                    key={peserta._id}
                    className="hover:bg-[#FEF3C7]/40 dark:hover:bg-indigo-500/10 transition"
                  >
                    {/* NO */}
                    <td className="py-4 px-6 text-center font-medium text-slate-500 dark:text-slate-300">
                      {indexOfFirstItem + index + 1}
                    </td>

                    {/* PESERTA */}
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-3">
                        <div
                          className="
                            w-10 h-10
                            rounded-full
                            bg-linear-to-br from-[#7F1D1D] to-[#F59E0B]
                            dark:from-indigo-600 dark:to-violet-500
                            flex items-center justify-center
                            text-white shadow
                          "
                        >
                          <HiUser className="w-5 h-5" />
                        </div>
                        <div className="text-left leading-tight">
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {peserta.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {peserta.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* STATISTIK */}
                    <td className="py-4 px-6">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-center gap-2">
                          <HiDocumentText className="w-4 h-4 text-slate-400" />
                          <span>
                            Total:{" "}
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                              {peserta.totalLaporan}
                            </span>
                          </span>
                        </div>

                        <div className="flex justify-center flex-wrap gap-2">
                          {peserta.disetujui > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                              <HiCheckCircle className="w-3 h-3" />
                              {peserta.disetujui}
                            </span>
                          )}
                          {peserta.perbaiki > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                              <HiExclamationCircle className="w-3 h-3" />
                              {peserta.perbaiki}
                            </span>
                          )}
                          {peserta.ditolak > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
                              <HiXCircle className="w-3 h-3" />
                              {peserta.ditolak}
                            </span>
                          )}
                          {peserta.menunggu > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                              <HiDocumentText className="w-3 h-3" />
                              {peserta.menunggu}
                            </span>
                          )}
                        </div>

                        {peserta.laporanMonths.length > 0 && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                            {peserta.laporanMonths.length} bulan laporan
                          </p>
                        )}
                      </div>
                    </td>

                    {/* LAPORAN TERAKHIR */}
                    <td className="py-4 px-6 text-center">
                      {peserta.laporanTerakhir ? (
                        <div className="flex justify-center items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <HiCalendar className="w-4 h-4" />
                          {formatDate(peserta.laporanTerakhir)}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400 italic">
                          Belum ada laporan
                        </span>
                      )}
                    </td>

                    {/* AKSI */}
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleViewLaporan(peserta)}
                        disabled={peserta.totalLaporan === 0}
                        className="
                          inline-flex items-center gap-2
                          px-4 py-2
                          rounded-xl
                          text-sm font-semibold
                          text-white
                          bg-linear-to-r from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                          dark:from-indigo-600 dark:to-violet-500
                          shadow hover:shadow-xl
                          hover:-translate-y-0.5
                          transition
                          disabled:opacity-50 disabled:cursor-not-allowed
                        "
                      >
                        <HiBookOpen className="w-4 h-4" />
                        {peserta.totalLaporan === 0 ? "Belum Ada" : "Lihat Laporan"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ================= PAGINATION ================= */}
          {totalPage > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 py-5">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="
                  px-4 py-2 rounded-lg text-sm font-medium
                  border border-slate-300 dark:border-indigo-500/30
                  bg-white dark:bg-indigo-950
                  text-slate-700 dark:text-indigo-200
                  hover:bg-[#FFF1F2] dark:hover:bg-indigo-900/40
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition
                "
              >
                Prev
              </button>

              {Array.from({ length: totalPage }).map((_, i) => {
                const active = page === i + 1;
                return (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`
                      min-w-9.5 h-9.5 rounded-lg text-sm font-semibold transition
                      ${
                        active
                          ? "bg-[#B91C1C] text-white shadow dark:bg-indigo-600"
                          : `
                            bg-white dark:bg-indigo-950
                            text-[#7F1D1D] dark:text-indigo-200
                            border border-slate-300 dark:border-indigo-500/30
                            hover:bg-[#FFF1F2] dark:hover:bg-indigo-900/40
                          `
                      }
                    `}
                  >
                    {i + 1}
                  </button>
                );
              })}

              <button
                disabled={page === totalPage}
                onClick={() => setPage((p) => p + 1)}
                className="
                  px-4 py-2 rounded-lg text-sm font-medium
                  border border-slate-300 dark:border-indigo-500/30
                  bg-white dark:bg-indigo-950
                  text-slate-700 dark:text-indigo-200
                  hover:bg-[#FFF1F2] dark:hover:bg-indigo-900/40
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition
                "
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Info jumlah data */}
      <div className="text-center mt-2 text-sm text-slate-500">
        {filteredPeserta.length <= itemsPerPage ? (
          <span>Menampilkan semua {filteredPeserta.length} peserta</span>
        ) : (
          <span>
            Menampilkan {indexOfFirstItem + 1}-
            {Math.min(indexOfLastItem, filteredPeserta.length)} dari{" "}
            {filteredPeserta.length} peserta
          </span>
        )}
      </div>

      {/* Modal Pilih Bulan */}
      {showMonthModal && <MonthSelectionModal />}

      {/* Modal Detail Laporan */}
      {selectedLaporan && selectedPeserta && (
        <SuperadminLaporanBulananModal
          laporan={selectedLaporan}
          onClose={() => {
            setSelectedLaporan(null);
            setSelectedPeserta(null);
          }}
        />
      )}
    </div>
  );
}

type StatCardColor = "indigo" | "emerald" | "amber" | "slate";

type StatCardProps = {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  note: string;
  color: StatCardColor;
};

function StatCard({
  title,
  value,
  icon,
  note,
  color,
}: StatCardProps) {
  const iconColorMap: Record<StatCardColor, string> = {
    indigo: "bg-[#B91C1C]/90 dark:bg-indigo-600",
    emerald: "bg-emerald-500 dark:bg-emerald-600",
    amber: "bg-amber-500 dark:bg-violet-500",
    slate: "bg-slate-500 dark:bg-indigo-700",
  };

  const textColorMap: Record<StatCardColor, string> = {
    indigo: "text-[#7F1D1D] dark:text-white",
    emerald: "text-[#7F1D1D] dark:text-white",
    amber: "text-[#7F1D1D] dark:text-white",
    slate: "text-[#7F1D1D] dark:text-white",
  };

  return (
    <div
      className="
        group relative
        rounded-2xl
        border border-[#FCA5A5]/40 dark:border-indigo-500/30
        bg-linear-to-br
        from-[#FFFDF8] via-[#FFF4EC] to-white
        dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-800
        p-6
        shadow-sm hover:shadow-xl
        transition
      "
    >
      {/* TOP */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#7F1D1D] dark:text-indigo-300">
            {title}
          </p>
          <p className={`text-4xl font-extrabold mt-1 ${textColorMap[color]}`}>
            {value}
          </p>
        </div>

        <div
          className={`
            w-14 h-14 rounded-2xl
            text-white
            flex items-center justify-center
            shadow
            group-hover:scale-110 transition
            ${iconColorMap[color]}
          `}
        >
          {icon}
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-4 pt-4 border-t border-[#FCA5A5]/40 dark:border-indigo-500/30">
        <p className="text-xs text-slate-600 dark:text-slate-300">
          {note}
        </p>
      </div>
    </div>
  );
}