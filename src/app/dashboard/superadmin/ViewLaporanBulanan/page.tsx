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
      const pesertaArray = Array.from(pesertaMap.values());
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
    return laporanList.filter((laporan) => laporan.user._id === pesertaId);
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
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          {/* HEADER */}
          <div className="px-6 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <HiCalendar className="text-xl" />
              <div>
                <h2 className="text-xl font-bold">Pilih Laporan Bulanan</h2>
                <div className="flex items-center gap-4 text-sm opacity-90">
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
            <button
              onClick={() => {
                setShowMonthModal(false);
                setSelectedPeserta(null);
              }}
              className="p-2 hover:bg-white/20 rounded-full transition"
            >
              <HiXCircle className="text-xl" />
            </button>
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Total Laporan: {selectedPeserta.totalLaporan}
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedPeserta.disetujui > 0 && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-700">
                    <HiCheckCircle className="w-4 h-4" />{" "}
                    {selectedPeserta.disetujui} Disetujui
                  </span>
                )}
                {selectedPeserta.perbaiki > 0 && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-700">
                    <HiExclamationCircle className="w-4 h-4" />{" "}
                    {selectedPeserta.perbaiki} Perbaiki
                  </span>
                )}
                {selectedPeserta.ditolak > 0 && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
                    <HiXCircle className="w-4 h-4" /> {selectedPeserta.ditolak}{" "}
                    Ditolak
                  </span>
                )}
                {selectedPeserta.menunggu > 0 && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                    <HiDocumentText className="w-4 h-4" />{" "}
                    {selectedPeserta.menunggu} Menunggu
                  </span>
                )}
              </div>
            </div>

            {/* LIST LAPORAN */}
            <div className="space-y-3">
              <h4 className="font-medium text-slate-700">
                Pilih Bulan Laporan:
              </h4>

              {selectedPeserta.laporanDetails.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
                  <HiDocumentText className="text-4xl text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">Belum ada laporan bulanan</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedPeserta.laporanDetails.map((laporan) => (
                    <button
                      key={laporan._id}
                      onClick={() => handleSelectLaporan(laporan)}
                      className="
                        p-4 rounded-xl border border-slate-200 
                        hover:border-indigo-300 hover:bg-indigo-50/30
                        transition-all duration-200 hover:shadow-md
                        text-left
                      "
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <HiCalendar className="w-4 h-4 text-slate-500" />
                            <span className="font-semibold text-slate-800">
                              {formatMonth(laporan.month)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Submit: {formatDate(laporan.createdAt)}
                          </p>
                        </div>
                        <div>{getStatusBadge(laporan.status)}</div>
                      </div>

                      {laporan.mentorNote && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-slate-600 mb-1">
                            Catatan Mentor:
                          </p>
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {laporan.mentorNote}
                          </p>
                        </div>
                      )}

                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                        <span>Klik untuk melihat detail</span>
                        <HiChevronDown className="w-3 h-3" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowMonthModal(false);
                  setSelectedPeserta(null);
                }}
                className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <h1 className="text-3xl font-bold mb-2 text-slate-800">
        Laporan Bulanan Peserta
      </h1>
      <p className="text-slate-600 mb-8">
        Kelola dan review laporan bulanan semua peserta
      </p>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Peserta"
          value={pesertaLaporan.length}
          icon={<HiUser />}
          color="blue"
        />
        <StatCard
          title="Total Laporan"
          value={laporanList.length}
          icon={<HiDocumentText />}
          color="indigo"
        />
        <StatCard
          title="Disetujui"
          value={laporanList.filter((l) => l.status === "Disetujui").length}
          icon={<HiCheckCircle />}
          color="emerald"
        />
        <StatCard
          title="Perlu Perbaikan"
          value={laporanList.filter((l) => l.status === "Perbaiki").length}
          icon={<HiExclamationCircle />}
          color="amber"
        />
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari peserta berdasarkan nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-700 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b">
              <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase">
                No
              </th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase">
                Peserta
              </th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase">
                Statistik Laporan
              </th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase">
                Laporan Terakhir
              </th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-10 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                </td>
              </tr>
            ) : currentItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-500">
                  {search
                    ? "Peserta tidak ditemukan"
                    : "Tidak ada data peserta"}
                </td>
              </tr>
            ) : (
              currentItems.map((peserta, index) => (
                <tr
                  key={peserta._id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-4 px-6">{indexOfFirstItem + index + 1}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <HiUser className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">
                          {peserta.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {peserta.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <HiDocumentText className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium">
                          Total:{" "}
                          <span className="text-indigo-600">
                            {peserta.totalLaporan}
                          </span>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {peserta.disetujui > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                            <HiCheckCircle className="w-3 h-3" />{" "}
                            {peserta.disetujui}
                          </span>
                        )}
                        {peserta.perbaiki > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                            <HiExclamationCircle className="w-3 h-3" />{" "}
                            {peserta.perbaiki}
                          </span>
                        )}
                        {peserta.ditolak > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
                            <HiXCircle className="w-3 h-3" /> {peserta.ditolak}
                          </span>
                        )}
                        {peserta.menunggu > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                            <HiDocumentText className="w-3 h-3" />{" "}
                            {peserta.menunggu}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {peserta.laporanMonths.length > 0 && (
                          <span>
                            {peserta.laporanMonths.length} bulan laporan
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {peserta.laporanTerakhir ? (
                      <div className="flex items-center gap-2">
                        <HiCalendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm">
                          {formatDate(peserta.laporanTerakhir)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">
                        Belum ada laporan
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => handleViewLaporan(peserta)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={peserta.totalLaporan === 0}
                    >
                      <HiBookOpen className="w-4 h-4" />
                      {peserta.totalLaporan === 0
                        ? "Belum Ada"
                        : "Lihat Laporan"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ===================== PAGINATION BUTTON ===================== */}
      {totalPage > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 py-5">
          {/* PREV */}
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="
              px-4 py-2
              rounded-lg
              text-sm font-medium
              border
              border-slate-300
              bg-white
              text-[#7F1D1D]
              hover:bg-[#FFF1F2]
              disabled:opacity-40 disabled:cursor-not-allowed
              transition
            "
          >
            Prev
          </button>

          {/* PAGE NUMBER */}
          {Array.from({ length: totalPage }).map((_, i) => {
            const active = page === i + 1;

            return (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`
                  min-w-[38px] h-[38px]
                  rounded-lg
                  text-sm font-semibold
                  transition
                  ${
                    active
                      ? "bg-[#B91C1C] text-white shadow"
                      : `
                        bg-white
                        text-[#7F1D1D]
                        border border-slate-300
                        hover:bg-[#FFF1F2]
                      `
                  }
                `}
              >
                {i + 1}
              </button>
            );
          })}

          {/* NEXT */}
          <button
            disabled={page === totalPage}
            onClick={() => setPage((p) => p + 1)}
            className="
              px-4 py-2
              rounded-lg
              text-sm font-medium
              border
              border-slate-300
              bg-white
              text-[#7F1D1D]
              hover:bg-[#FFF1F2]
              disabled:opacity-40 disabled:cursor-not-allowed
              transition
            "
          >
            Next
          </button>
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

function StatCard({ title, value, icon, color }: any) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    indigo: "bg-indigo-100 text-indigo-600",
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div className="bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  );
}
