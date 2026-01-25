"use client";

import { useEffect, useState } from "react";
import {
  HiUser,
  HiMail,
  HiPhone,
  HiBriefcase,
  HiAcademicCap,
  HiCalendar,
  HiSearch,
} from "react-icons/hi";
import SuperadminPesertaModal from "@/components/superadmin/SuperadminPesertaModal";

type Peserta = {
  pendaftaranId: string;
  pesertaId: string;
  nama: string;
  email: string;
  wa: string;
  posisi: string;
  jurusan: string;
  kategori: string;
  mentor?: {
    _id: string;
    name: string;
    email: string;
  };
  isTerdaftar: boolean;
  tanggalMulaiMagang: string;
  tanggalSelesaiMagang: string;
  createdAt: string;
};

export default function ViewPesertaSuperadmin() {
  const [pesertaList, setPesertaList] = useState<Peserta[]>([]);
  const [filteredPeserta, setFilteredPeserta] = useState<Peserta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPeserta, setSelectedPeserta] = useState<Peserta | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/peserta/disetujui`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      const data = await res.json();
      setPesertaList(data);
      setFilteredPeserta(data);
      setPage(1); // Reset ke halaman pertama saat data baru dimuat
    } catch (error) {
      console.error("Gagal memuat data peserta", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredPeserta(pesertaList);
      setPage(1); // Reset ke halaman pertama saat pencarian diubah
      return;
    }

    const query = search.toLowerCase();
    const filtered = pesertaList.filter(
      (p) =>
        p.nama.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query) ||
        p.posisi.toLowerCase().includes(query) ||
        p.jurusan?.toLowerCase().includes(query),
    );
    setFilteredPeserta(filtered);
    setPage(1); // Reset ke halaman pertama saat pencarian diubah
  }, [search, pesertaList]);

  // Calculate pagination
  const totalPage = Math.ceil(filteredPeserta.length / itemsPerPage);
  const indexOfLastItem = page * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPeserta.slice(indexOfFirstItem, indexOfLastItem);

  const handleViewLogbook = (email: string) => {
    window.location.href = `/dashboard/superadmin/ViewLogbook?email=${encodeURIComponent(email)}`;
  };

  const handleViewLaporanBulanan = (email: string) => {
    window.location.href = `/dashboard/superadmin/ViewLaporanBulanan?email=${encodeURIComponent(email)}`;
  };

  const handleViewLaporanAkhir = (email: string) => {
    window.location.href = `/dashboard/superadmin/ViewLaporanAkhir?email=${encodeURIComponent(email)}`;
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <h1 className="text-3xl font-bold mb-2 text-slate-800">
        Data Peserta Disetujui
      </h1>
      <p className="text-slate-600 mb-8">
        Kelola semua peserta yang sudah disetujui
      </p>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Peserta"
          value={pesertaList.length}
          icon={<HiUser />}
          color="blue"
        />
        <StatCard
          title="Punya Mentor"
          value={pesertaList.filter((p) => p.mentor).length}
          icon={<HiAcademicCap />}
          color="emerald"
        />
        <StatCard
          title="Aktif Magang"
          value={
            pesertaList.filter(
              (p) => new Date(p.tanggalSelesaiMagang) > new Date(),
            ).length
          }
          icon={<HiCalendar />}
          color="amber"
        />
        <StatCard
          title="Sudah Selesai"
          value={
            pesertaList.filter(
              (p) => new Date(p.tanggalSelesaiMagang) <= new Date(),
            ).length
          }
          icon={<HiBriefcase />}
          color="purple"
        />
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari peserta berdasarkan nama, email, atau posisi..."
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
                Kontak
              </th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase">
                Posisi
              </th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase">
                Mentor
              </th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                </td>
              </tr>
            ) : currentItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-500">
                  {search
                    ? "Peserta tidak ditemukan"
                    : "Tidak ada data peserta"}
                </td>
              </tr>
            ) : (
              currentItems.map((p, index) => (
                <tr
                  key={p.pesertaId}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-4 px-6">{indexOfFirstItem + index + 1}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <HiUser className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{p.nama}</p>
                        <p className="text-xs text-slate-500">{p.jurusan}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <HiMail className="w-4 h-4 text-slate-400" />
                        <span className="text-sm">{p.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HiPhone className="w-4 h-4 text-slate-400" />
                        <span className="text-sm">{p.wa}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <HiBriefcase className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{p.posisi}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {p.mentor ? (
                      <div>
                        <p className="font-medium">{p.mentor.name}</p>
                        <p className="text-xs text-slate-500">
                          {p.mentor.email}
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">
                        Belum ada mentor
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => setSelectedPeserta(p)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition text-sm font-medium"
                    >
                      Lihat Detail
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

      {/* Modal */}
      {selectedPeserta && (
        <SuperadminPesertaModal
          peserta={selectedPeserta}
          onClose={() => setSelectedPeserta(null)}
          onViewLogbook={handleViewLogbook}
          onViewLaporanBulanan={handleViewLaporanBulanan}
          onViewLaporanAkhir={handleViewLaporanAkhir}
        />
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    purple: "bg-purple-100 text-purple-600",
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
