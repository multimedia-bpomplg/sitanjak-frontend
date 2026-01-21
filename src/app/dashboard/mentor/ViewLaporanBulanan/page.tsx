"use client";

import { useState, useEffect } from "react";
import {
  HiCalendar,
  HiDocumentAdd,
  HiCheckCircle,
  HiClock,
  HiExclamation,
  HiArrowLeft,
  HiChevronRight,
  HiFilter,
  HiSearch,
} from "react-icons/hi";

export default function LaporanBulananPage() {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [riwayatLaporan, setRiwayatLaporan] = useState<any[]>([]);
  const [filteredRiwayat, setFilteredRiwayat] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "view">("create");

  // Data dummy riwayat laporan
  const dummyRiwayat = [
    {
      _id: "1",
      month: "2024-12",
      status: "Disetujui",
      mentorNote: "Laporan sangat baik dan detail. Pertahankan!",
      createdAt: "2024-12-05T14:30:00Z",
      updatedAt: "2024-12-10T09:15:00Z",
      mentor: {
        name: "Budi Santoso, S.Kom",
        email: "budi.santoso@perusahaan.com",
      },
    },
    {
      _id: "2",
      month: "2024-11",
      status: "Perbaiki",
      mentorNote: "Tolong tambahkan lebih banyak detail di bagian pencapaian",
      createdAt: "2024-11-05T10:20:00Z",
      updatedAt: "2024-11-08T16:45:00Z",
      mentor: {
        name: "Budi Santoso, S.Kom",
        email: "budi.santoso@perusahaan.com",
      },
    },
    {
      _id: "3",
      month: "2024-10",
      status: "Disetujui",
      mentorNote: "Bagus, progress sesuai rencana",
      createdAt: "2024-10-05T09:15:00Z",
      updatedAt: "2024-10-07T11:30:00Z",
      mentor: {
        name: "Budi Santoso, S.Kom",
        email: "budi.santoso@perusahaan.com",
      },
    },
    {
      _id: "4",
      month: "2024-09",
      status: "Menunggu",
      mentorNote: "",
      createdAt: "2024-09-05T08:45:00Z",
      updatedAt: "2024-09-05T08:45:00Z",
      mentor: null,
    },
    {
      _id: "5",
      month: "2024-08",
      status: "Ditolak",
      mentorNote: "Format laporan tidak sesuai dengan template yang ditentukan",
      createdAt: "2024-08-05T13:20:00Z",
      updatedAt: "2024-08-07T14:10:00Z",
      mentor: {
        name: "Budi Santoso, S.Kom",
        email: "budi.santoso@perusahaan.com",
      },
    },
  ];

  useEffect(() => {
    // Simulasi fetch data
    setTimeout(() => {
      setRiwayatLaporan(dummyRiwayat);
      setFilteredRiwayat(dummyRiwayat);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter dan search
  useEffect(() => {
    let filtered = riwayatLaporan;

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.month.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.mentorNote &&
            item.mentorNote.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((item) => item.status === filterStatus);
    }

    setFilteredRiwayat(filtered);
  }, [searchTerm, filterStatus, riwayatLaporan]);

  const handleMonthSelect = (month: string) => {
    setSelectedMonth(month);

    // Cek apakah sudah ada laporan untuk bulan tersebut
    const existingLaporan = riwayatLaporan.find((item) => item.month === month);
    if (existingLaporan) {
      setModalMode("view");
    } else {
      setModalMode("create");
    }

    setShowModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Disetujui":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Menunggu":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "Perbaiki":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Ditolak":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Disetujui":
        return <HiCheckCircle className="w-4 h-4" />;
      case "Menunggu":
        return <HiClock className="w-4 h-4" />;
      case "Perbaiki":
        return <HiExclamation className="w-4 h-4" />;
      case "Ditolak":
        return <HiExclamation className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Statistics
  const stats = {
    total: riwayatLaporan.length,
    disetujui: riwayatLaporan.filter((item) => item.status === "Disetujui")
      .length,
    menunggu: riwayatLaporan.filter((item) => item.status === "Menunggu")
      .length,
    perbaiki: riwayatLaporan.filter((item) => item.status === "Perbaiki")
      .length,
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 via-white to-purple-50">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-100 rounded-xl"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-slate-100 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3 mb-2">
            <HiCalendar className="w-8 h-8 text-purple-600" />
            Laporan Bulanan Magang
          </h1>
          <p className="text-slate-600">
            Kelola dan pantau laporan bulanan kegiatan magang Anda
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Laporan"
            value={stats.total}
            color="bg-purple-100 text-purple-600"
            icon={<HiCalendar className="w-5 h-5" />}
          />
          <StatCard
            title="Disetujui"
            value={stats.disetujui}
            color="bg-emerald-100 text-emerald-600"
            icon={<HiCheckCircle className="w-5 h-5" />}
          />
          <StatCard
            title="Menunggu"
            value={stats.menunggu}
            color="bg-amber-100 text-amber-600"
            icon={<HiClock className="w-5 h-5" />}
          />
          <StatCard
            title="Perlu Perbaikan"
            value={stats.perbaiki}
            color="bg-blue-100 text-blue-600"
            icon={<HiExclamation className="w-5 h-5" />}
          />
        </div>

        {/* Month Selector Card */}
        <div className="bg-white rounded-2xl border shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                <HiDocumentAdd className="w-5 h-5 text-purple-600" />
                Buat Laporan Baru
              </h2>
              <p className="text-slate-600 mb-4">
                Pilih bulan untuk membuat atau melihat laporan bulanan
              </p>

              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Pilih Bulan Laporan
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white cursor-pointer"
                />
                <div className="absolute right-3 top-10">
                  <HiCalendar className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="lg:w-1/3">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5">
                <h3 className="font-semibold text-slate-800 mb-2">
                  📌 Informasi
                </h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5"></span>
                    Laporan dibuat setiap bulan
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5"></span>
                    Mentor akan memberikan feedback
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5"></span>
                    Status: Menunggu → Disetujui/Ditolak/Perbaiki
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => selectedMonth && handleMonthSelect(selectedMonth)}
              disabled={!selectedMonth}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                selectedMonth
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              {selectedMonth ? (
                <>
                  <HiDocumentAdd className="w-5 h-5" />
                  Lanjutkan ke Laporan
                </>
              ) : (
                "Pilih Bulan Terlebih Dahulu"
              )}
            </button>
          </div>
        </div>

        {/* Filter and Search */}
        <div className="bg-white rounded-xl border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan bulan, status, atau catatan mentor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <div className="relative">
                <HiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full sm:w-48 pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">Semua Status</option>
                  <option value="Disetujui">Disetujui</option>
                  <option value="Menunggu">Menunggu</option>
                  <option value="Perbaiki">Perbaiki</option>
                  <option value="Ditolak">Ditolak</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Riwayat Laporan */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <HiClock className="w-5 h-5 text-slate-600" />
            Riwayat Laporan Bulanan
          </h2>

          {filteredRiwayat.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                <HiDocumentAdd className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                Tidak ada laporan ditemukan
              </h3>
              <p className="text-slate-500">
                {searchTerm || filterStatus !== "all"
                  ? "Coba ubah kata kunci pencarian atau filter status"
                  : "Belum ada laporan bulanan yang dibuat"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRiwayat.map((laporan) => (
                <div
                  key={laporan._id}
                  className="bg-white rounded-xl border hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => handleMonthSelect(laporan.month)}
                >
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <div
                            className={`px-4 py-1.5 rounded-full border flex items-center gap-2 ${getStatusColor(laporan.status)}`}
                          >
                            {getStatusIcon(laporan.status)}
                            <span className="font-medium">
                              {laporan.status}
                            </span>
                          </div>
                          <span className="text-xl font-bold text-slate-800">
                            {new Date(laporan.month + "-01").toLocaleDateString(
                              "id-ID",
                              {
                                month: "long",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>

                        {laporan.mentorNote && (
                          <div className="mt-3">
                            <p className="text-sm text-slate-600 font-medium mb-1">
                              Catatan Mentor:
                            </p>
                            <p className="text-slate-700 bg-slate-50 rounded-lg p-3 border-l-4 border-purple-500">
                              "{laporan.mentorNote}"
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                          <span>Dibuat: {formatDate(laporan.createdAt)}</span>
                          <span>•</span>
                          <span>Diupdate: {formatDate(laporan.updatedAt)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {laporan.mentor && (
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-700">
                              Mentor
                            </p>
                            <p className="text-slate-600">
                              {laporan.mentor.name}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-purple-600 group-hover:text-purple-700">
                          <span className="font-medium">Lihat Detail</span>
                          <HiChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <LaporanModal
            month={selectedMonth}
            mode={modalMode}
            onClose={() => setShowModal(false)}
            data={riwayatLaporan.find((item) => item.month === selectedMonth)}
          />
        )}
      </div>
    </div>
  );
}

// Reusable Components
function StatCard({ title, value, color, icon }: any) {
  return (
    <div className="bg-white rounded-xl border p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-2">{title}</p>
          <p className="text-3xl font-bold text-slate-800">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

function LaporanModal({ month, mode, onClose, data }: any) {
  const [formData, setFormData] = useState({
    ringkasan: "",
    pencapaian: "",
    kendala: "",
    rencana: "",
  });

  useEffect(() => {
    if (mode === "view" && data) {
      // In a real app, you would fetch the full laporan data here
      setFormData({
        ringkasan: "Ringkasan kegiatan selama bulan " + month,
        pencapaian:
          "1. Mempelajari React.js dan Next.js\n2. Membuat komponen reusable\n3. Implementasi API integration",
        kendala: "Kurang familiar dengan TypeScript di awal",
        rencana: "Mempelajari state management lebih dalam",
      });
    }
  }, [mode, month, data]);

  const handleSubmit = () => {
    alert(
      `Laporan bulan ${month} berhasil ${mode === "create" ? "dibuat" : "diperbarui"}!`,
    );
    onClose();
  };

  const canEdit = mode === "create" || data?.status === "Perbaiki";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                {mode === "create" ? "📝" : "👁️"}
                {mode === "create" ? "Buat Laporan Baru" : "Detail Laporan"}
                <span className="text-lg font-normal text-slate-600">
                  {new Date(month + "-01").toLocaleDateString("id-ID", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </h2>
              <p className="text-slate-600 mt-1">
                {mode === "create"
                  ? "Isi laporan bulanan untuk periode yang dipilih"
                  : `Status: ${data?.status}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            <FormField
              label="Ringkasan Kegiatan"
              value={formData.ringkasan}
              onChange={(value) =>
                setFormData({ ...formData, ringkasan: value })
              }
              disabled={!canEdit}
              placeholder="Deskripsikan kegiatan utama yang dilakukan selama bulan ini..."
              rows={4}
            />

            <FormField
              label="Pencapaian"
              value={formData.pencapaian}
              onChange={(value) =>
                setFormData({ ...formData, pencapaian: value })
              }
              disabled={!canEdit}
              placeholder="Sebutkan pencapaian yang berhasil diraih..."
              rows={4}
            />

            <FormField
              label="Kendala"
              value={formData.kendala}
              onChange={(value) => setFormData({ ...formData, kendala: value })}
              disabled={!canEdit}
              placeholder="Jelaskan kendala atau tantangan yang dihadapi..."
              rows={4}
            />

            <FormField
              label="Rencana Bulan Depan"
              value={formData.rencana}
              onChange={(value) => setFormData({ ...formData, rencana: value })}
              disabled={!canEdit}
              placeholder="Rencana kegiatan untuk bulan berikutnya..."
              rows={4}
            />

            {data?.mentorNote && mode === "view" && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  📝 Catatan Mentor
                </h3>
                <p className="text-slate-700 italic border-l-4 border-purple-500 pl-4 py-2">
                  "{data.mentorNote}"
                </p>
                {data.mentor && (
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <p className="text-sm font-medium text-slate-700">
                      Oleh: {data.mentor.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(data.updatedAt)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-slate-50">
          <div className="flex justify-between items-center">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {mode === "view" ? "Tutup" : "Batal"}
            </button>

            {canEdit && (
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow flex items-center gap-2"
              >
                <HiDocumentAdd className="w-4 h-4" />
                {mode === "create" ? "Kirim Laporan" : "Perbarui Laporan"}
              </button>
            )}

            {mode === "view" && !canEdit && (
              <div className="text-sm text-slate-500">
                Laporan {data?.status.toLowerCase()} tidak dapat diubah
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  rows = 3,
}: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
        <span className="text-red-500 ml-1">*</span>
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={rows}
        placeholder={placeholder}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
          disabled
            ? "bg-slate-50 border-slate-300 text-slate-500 cursor-not-allowed"
            : "bg-white border-slate-300 text-slate-700"
        }`}
      />
      <div className="mt-1 text-right">
        <span className="text-xs text-slate-500">{value.length} karakter</span>
      </div>
    </div>
  );
}

// Helper function
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
