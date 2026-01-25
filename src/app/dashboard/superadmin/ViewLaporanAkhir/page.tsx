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
  HiClock,
  HiSearch,
  HiBookOpen,
  HiChevronDown,
  HiX,
  HiInformationCircle,
  HiOutlineEye,
} from "react-icons/hi";
import SuperadminLaporanAkhirModal from "@/components/superadmin/SuperadminLaporanAkhirModal";

type LaporanAkhir = {
  _id: string;
  judul: string;
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
  hasLaporan: boolean;
  status?: string;
  judul?: string;
  createdAt?: string;
  laporanId?: string;
};

export default function ViewLaporanAkhirSuperadmin() {
  const [laporanList, setLaporanList] = useState<LaporanAkhir[]>([]);
  const [pesertaLaporan, setPesertaLaporan] = useState<PesertaLaporan[]>([]);
  const [filteredPeserta, setFilteredPeserta] = useState<PesertaLaporan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPeserta, setSelectedPeserta] = useState<PesertaLaporan | null>(
    null,
  );
  const [selectedLaporan, setSelectedLaporan] = useState<LaporanAkhir | null>(
    null,
  );
  const [showLaporanModal, setShowLaporanModal] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/laporan-akhir`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      const data = await res.json();
      setLaporanList(data);

      // Group peserta yang punya laporan akhir
      const pesertaMap = new Map<string, PesertaLaporan>();

      data.forEach((laporan: LaporanAkhir) => {
        const userId = laporan.user._id;

        if (!pesertaMap.has(userId)) {
          pesertaMap.set(userId, {
            _id: userId,
            name: laporan.user.name,
            email: laporan.user.email,
            hasLaporan: true,
            status: laporan.status,
            judul: laporan.judul,
            createdAt: laporan.createdAt,
            laporanId: laporan._id,
          });
        }
      });

      // Convert map to array
      const pesertaArray = Array.from(pesertaMap.values());

      // Sort by name
      pesertaArray.sort((a, b) => a.name.localeCompare(b.name));

      setPesertaLaporan(pesertaArray);
      setFilteredPeserta(pesertaArray);
      setPage(1); // Reset ke halaman pertama saat data baru dimuat
    } catch (error) {
      console.error("Gagal memuat laporan akhir", error);
    } finally {
      setLoading(false);
    }
  };

  const getLaporanByPeserta = (pesertaId: string) => {
    return laporanList.find((laporan) => laporan.user._id === pesertaId);
  };

  const handleViewLaporan = (peserta: PesertaLaporan) => {
    setSelectedPeserta(peserta);

    if (peserta.hasLaporan && peserta.laporanId) {
      const laporan = laporanList.find((l) => l._id === peserta.laporanId);
      if (laporan) {
        setSelectedLaporan(laporan);
        setShowLaporanModal(true);
      }
    }
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
        p.email.toLowerCase().includes(query) ||
        (p.judul && p.judul.toLowerCase().includes(query)),
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <HiCheckCircle className="w-3.5 h-3.5" /> Disetujui
          </span>
        );
      case "Ditolak":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <HiXCircle className="w-3.5 h-3.5" /> Ditolak
          </span>
        );
      case "Revisi":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <HiExclamationCircle className="w-3.5 h-3.5" /> Revisi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <HiClock className="w-3.5 h-3.5" /> Menunggu
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Modal untuk detail laporan
  const LaporanDetailModal = () => {
    if (!selectedPeserta || !selectedLaporan) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-4xl bg-white rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          {/* HEADER */}
          <div className="px-6 py-5 bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <HiDocumentText className="text-2xl" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold truncate">
                      Laporan Akhir
                    </h2>
                    <div className="hidden sm:block">
                      {getStatusBadge(selectedLaporan.status)}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm opacity-90">
                      <HiUser className="w-4 h-4" />
                      <span className="truncate">{selectedPeserta.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm opacity-90">
                      <HiMail className="w-4 h-4" />
                      <span className="truncate">{selectedPeserta.email}</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowLaporanModal(false);
                  setSelectedPeserta(null);
                  setSelectedLaporan(null);
                }}
                className="p-2 hover:bg-white/20 rounded-full transition flex-shrink-0"
              >
                <HiX className="text-xl" />
              </button>
            </div>
            <div className="block sm:hidden mt-4">
              {getStatusBadge(selectedLaporan.status)}
            </div>
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* JUDUL DAN TANGGAL */}
            <div className="mb-8">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <HiInformationCircle className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-slate-800">
                    Judul Laporan
                  </h3>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-slate-800 font-medium">
                    {selectedLaporan.judul}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <HiCalendar className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">
                      Dikirim
                    </span>
                  </div>
                  <p className="text-slate-800 font-semibold">
                    {formatDate(selectedLaporan.createdAt)}
                  </p>
                </div>

                {selectedLaporan.approvedAt && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <HiCheckCircle className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-700">
                        Direview
                      </span>
                    </div>
                    <p className="text-slate-800 font-semibold">
                      {formatDate(selectedLaporan.approvedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* INFO MENTOR */}
            {selectedLaporan.approvedByMentor && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <HiUser className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-semibold text-slate-800">
                    Disetujui Oleh
                  </h4>
                </div>
                <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {selectedLaporan.approvedByMentor.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">
                        {selectedLaporan.approvedByMentor.name}
                      </p>
                      <p className="text-sm text-slate-600">
                        {selectedLaporan.approvedByMentor.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CATATAN MENTOR */}
            {selectedLaporan.mentorNote && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <HiDocumentText className="w-5 h-5 text-amber-600" />
                  <h4 className="font-semibold text-slate-800">
                    Catatan Mentor
                  </h4>
                </div>
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-amber-800 whitespace-pre-line leading-relaxed">
                      {selectedLaporan.mentorNote}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowLaporanModal(false);
                    setSelectedPeserta(null);
                    setSelectedLaporan(null);
                  }}
                  className="flex-1 px-4 py-3.5 border border-slate-300 bg-white text-slate-700 rounded-xl font-medium transition hover:bg-slate-50 hover:border-slate-400 active:scale-[0.98]"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    setShowLaporanModal(false);
                    // Open the main detail modal
                  }}
                  className="flex-1 px-4 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium transition hover:from-indigo-700 hover:to-purple-700 active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <HiOutlineEye className="w-5 h-5" />
                  Lihat Detail Lengkap
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* HEADER SECTION */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
              📋 Laporan Akhir Peserta
            </h1>
            <p className="text-slate-600 max-w-3xl">
              Kelola dan review laporan akhir semua peserta magang. Pantau
              status dan berikan feedback.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span>Disetujui</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span>Revisi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span>Ditolak</span>
            </div>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Peserta"
            value={pesertaLaporan.length}
            icon={<HiUser />}
            color="blue"
            subtitle="Peserta dengan laporan"
          />
          <StatCard
            title="Disetujui"
            value={laporanList.filter((l) => l.status === "Disetujui").length}
            icon={<HiCheckCircle />}
            color="emerald"
            subtitle="Laporan approved"
          />
          <StatCard
            title="Perlu Review"
            value={
              laporanList.filter(
                (l) => l.status === "Menunggu" || l.status === "Revisi",
              ).length
            }
            icon={<HiExclamationCircle />}
            color="amber"
            subtitle="Menunggu tindakan"
          />
          <StatCard
            title="Ditolak"
            value={laporanList.filter((l) => l.status === "Ditolak").length}
            icon={<HiXCircle />}
            color="red"
            subtitle="Laporan ditolak"
          />
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="mb-8">
        <div className="relative">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari peserta berdasarkan nama, email, atau judul laporan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-700 placeholder-slate-400 text-sm md:text-base shadow-sm"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
            {filteredPeserta.length} peserta ditemukan
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* TABLE HEADER - Responsive */}
        <div className="hidden md:block">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
            <div className="grid grid-cols-12 px-6 py-4">
              <div className="col-span-1 text-xs font-semibold text-slate-600 uppercase">
                No
              </div>
              <div className="col-span-3 text-xs font-semibold text-slate-600 uppercase">
                Peserta
              </div>
              <div className="col-span-3 text-xs font-semibold text-slate-600 uppercase">
                Judul Laporan
              </div>
              <div className="col-span-2 text-xs font-semibold text-slate-600 uppercase">
                Status
              </div>
              <div className="col-span-2 text-xs font-semibold text-slate-600 uppercase">
                Tanggal
              </div>
              <div className="col-span-1 text-xs font-semibold text-slate-600 uppercase">
                Aksi
              </div>
            </div>
          </div>
        </div>

        {/* TABLE BODY */}
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="py-20 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Memuat data laporan...</p>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="py-20 text-center">
              <HiDocumentText className="text-4xl text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                {search ? "Peserta tidak ditemukan" : "Belum ada laporan"}
              </h3>
              <p className="text-slate-500 max-w-md mx-auto">
                {search
                  ? "Coba gunakan kata kunci lain atau hapus pencarian"
                  : "Peserta belum mengumpulkan laporan akhir"}
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP VIEW */}
              <div className="hidden md:block">
                {currentItems.map((peserta, index) => (
                  <div
                    key={peserta._id}
                    className="px-6 py-4 hover:bg-slate-50/70 transition-colors duration-200"
                  >
                    <div className="grid grid-cols-12 items-center">
                      <div className="col-span-1">
                        <span className="text-slate-700 font-medium">
                          {indexOfFirstItem + index + 1}
                        </span>
                      </div>
                      <div className="col-span-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                            <HiUser className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 truncate">
                              {peserta.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {peserta.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-3">
                        {peserta.hasLaporan ? (
                          <div>
                            <p className="font-medium text-slate-800 truncate">
                              {peserta.judul}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              ID: {peserta.laporanId?.slice(-8)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">
                            Belum mengumpulkan
                          </span>
                        )}
                      </div>
                      <div className="col-span-2">
                        {peserta.hasLaporan && peserta.status ? (
                          getStatusBadge(peserta.status)
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </div>
                      <div className="col-span-2">
                        {peserta.hasLaporan && peserta.createdAt ? (
                          <div className="flex items-center gap-2">
                            <HiCalendar className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-700">
                              {formatDate(peserta.createdAt)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </div>
                      <div className="col-span-1">
                        <button
                          onClick={() => handleViewLaporan(peserta)}
                          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 text-sm font-medium flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                          disabled={!peserta.hasLaporan}
                          title={
                            peserta.hasLaporan
                              ? "Lihat detail laporan"
                              : "Belum ada laporan"
                          }
                        >
                          <HiOutlineEye className="w-4 h-4" />
                          <span className="hidden lg:inline">
                            {peserta.hasLaporan ? "Lihat" : "-"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* MOBILE VIEW */}
              <div className="md:hidden">
                {currentItems.map((peserta, index) => (
                  <div
                    key={peserta._id}
                    className="p-4 hover:bg-slate-50/70 transition-colors duration-200 border-b border-slate-100 last:border-b-0"
                  >
                    <div className="space-y-4">
                      {/* HEADER */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <HiUser className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">
                              {peserta.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {peserta.email}
                            </p>
                          </div>
                        </div>
                        <span className="text-slate-400 text-sm font-medium">
                          #{indexOfFirstItem + index + 1}
                        </span>
                      </div>

                      {/* CONTENT */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">
                            Judul Laporan
                          </p>
                          {peserta.hasLaporan ? (
                            <p className="text-slate-800 font-medium">
                              {peserta.judul}
                            </p>
                          ) : (
                            <span className="text-slate-400 italic">
                              Belum mengumpulkan
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs font-medium text-slate-500 mb-1">
                              Status
                            </p>
                            {peserta.hasLaporan && peserta.status ? (
                              getStatusBadge(peserta.status)
                            ) : (
                              <span className="text-slate-400 text-sm">-</span>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500 mb-1">
                              Tanggal
                            </p>
                            {peserta.hasLaporan && peserta.createdAt ? (
                              <div className="flex items-center gap-2">
                                <HiCalendar className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-sm text-slate-700">
                                  {formatDate(peserta.createdAt)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">-</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ACTION */}
                      <div className="pt-2">
                        <button
                          onClick={() => handleViewLaporan(peserta)}
                          className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                          disabled={!peserta.hasLaporan}
                        >
                          <HiOutlineEye className="w-4 h-4" />
                          {peserta.hasLaporan
                            ? "Lihat Detail Laporan"
                            : "Belum Ada Laporan"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* PAGINATION */}
      {totalPage > 1 && (
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-600">
              Menampilkan{" "}
              <span className="font-semibold text-slate-800">
                {indexOfFirstItem + 1}
              </span>{" "}
              -{" "}
              <span className="font-semibold text-slate-800">
                {Math.min(indexOfLastItem, filteredPeserta.length)}
              </span>{" "}
              dari{" "}
              <span className="font-semibold text-slate-800">
                {filteredPeserta.length}
              </span>{" "}
              peserta
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {/* PREV */}
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="
                  px-4 py-2.5
                  rounded-xl
                  text-sm font-medium
                  border
                  border-slate-300
                  bg-white
                  text-slate-700
                  hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white
                  transition-all duration-200
                  flex items-center gap-2
                  shadow-sm hover:shadow
                "
              >
                <HiChevronDown className="w-4 h-4 rotate-90" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              {/* PAGE NUMBER */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPage, 5) }).map((_, i) => {
                  const pageNumber = i + 1;
                  const active = page === pageNumber;

                  return (
                    <button
                      key={i}
                      onClick={() => setPage(pageNumber)}
                      className={`
                        w-10 h-10
                        rounded-xl
                        text-sm font-semibold
                        transition-all duration-200
                        ${
                          active
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                            : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400"
                        }
                      `}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                {totalPage > 5 && (
                  <span className="px-2 text-slate-500">...</span>
                )}
              </div>

              {/* NEXT */}
              <button
                disabled={page === totalPage}
                onClick={() => setPage((p) => p + 1)}
                className="
                  px-4 py-2.5
                  rounded-xl
                  text-sm font-medium
                  border
                  border-slate-300
                  bg-white
                  text-slate-700
                  hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white
                  transition-all duration-200
                  flex items-center gap-2
                  shadow-sm hover:shadow
                "
              >
                <span className="hidden sm:inline">Next</span>
                <HiChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showLaporanModal && <LaporanDetailModal />}
      {selectedLaporan && !showLaporanModal && (
        <SuperadminLaporanAkhirModal
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

function StatCard({ title, value, icon, color, subtitle }: any) {
  const colorClasses = {
    blue: "from-blue-500 to-indigo-500",
    emerald: "from-emerald-500 to-green-500",
    amber: "from-amber-500 to-orange-500",
    red: "from-red-500 to-rose-500",
  };

  const bgClasses = {
    blue: "bg-blue-50 border-blue-100",
    emerald: "bg-emerald-50 border-emerald-100",
    amber: "bg-amber-50 border-amber-100",
    red: "bg-red-50 border-red-100",
  };

  return (
    <div
      className={`p-5 rounded-2xl border ${bgClasses[color]} transition-all duration-300 hover:scale-[1.02] hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <p className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">
            {value}
          </p>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div
          className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
