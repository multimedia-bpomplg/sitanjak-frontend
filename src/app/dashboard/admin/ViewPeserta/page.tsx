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

export default function ViewPesertaAdmin() {
  const [pesertaList, setPesertaList] = useState<Peserta[]>([]);
  const [filteredPeserta, setFilteredPeserta] = useState<Peserta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPeserta, setSelectedPeserta] = useState<Peserta | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token tidak ditemukan");
        return;
      }

      const res = await fetch(`${API_BASE}/admin/peserta/disetujui`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 403) {
        console.error("Akses ditolak ke /admin/peserta/disetujui");
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data: Peserta[] = await res.json();
      const sortedData = [...data].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setPesertaList(sortedData);
      setFilteredPeserta(sortedData);
      setPage(1);
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
      setPage(1);
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
    setPage(1);
  }, [search, pesertaList]);

  const totalPage = Math.ceil(filteredPeserta.length / itemsPerPage);
  const indexOfLastItem = page * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPeserta.slice(indexOfFirstItem, indexOfLastItem);

  const handleViewLogbook = (email: string) => {
    window.location.href = `/dashboard/admin/ViewLogbook?email=${encodeURIComponent(email)}`;
  };

  const handleViewLaporanBulanan = (email: string) => {
    window.location.href = `/dashboard/admin/ViewLaporanBulanan?email=${encodeURIComponent(email)}`;
  };

  const handleViewLaporanAkhir = (email: string) => {
    window.location.href = `/dashboard/admin/ViewLaporanAkhir?email=${encodeURIComponent(email)}`;
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-10 bg-linear-to-br from-slate-50 via-white to-indigo-100 dark:from-[#0B0614] dark:via-[#120A24] dark:to-[#1E0F3D] text-slate-800 dark:text-slate-100 transition-colors">
      <div className="mb-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-3">
          Data Peserta Disetujui
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Kelola semua peserta yang sudah disetujui
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Peserta"
          value={pesertaList.length}
          icon={<HiUser className="w-7 h-7" />}
          note="Jumlah seluruh peserta"
          color="indigo"
        />
        <StatCard
          title="Punya Mentor"
          value={pesertaList.filter((p) => p.mentor).length}
          icon={<HiAcademicCap className="w-7 h-7" />}
          note="Peserta dengan mentor aktif"
          color="emerald"
        />
        <StatCard
          title="Aktif Magang"
          value={
            pesertaList.filter(
              (p) => new Date(p.tanggalSelesaiMagang) > new Date(),
            ).length
          }
          icon={<HiCalendar className="w-7 h-7" />}
          note="Sedang menjalani magang"
          color="amber"
        />
        <StatCard
          title="Sudah Selesai"
          value={
            pesertaList.filter(
              (p) => new Date(p.tanggalSelesaiMagang) <= new Date(),
            ).length
          }
          icon={<HiBriefcase className="w-7 h-7" />}
          note="Magang telah selesai"
          color="slate"
        />
      </div>

      <div className="mb-8">
        <div className="relative">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7F1D1D] dark:text-indigo-400 w-5 h-5 z-10" />
          <input
            type="text"
            placeholder="Cari peserta berdasarkan nama, email, atau posisi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white/90 dark:bg-white/5 backdrop-blur border border-[#F59E0B]/40 dark:border-indigo-500/40 text-slate-700 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B91C1C]/60 dark:focus:ring-indigo-500/60 transition"
          />
        </div>
      </div>

      {!loading && currentItems.length === 0 ? (
        <div className="rounded-3xl bg-white/80 dark:bg-white/5 backdrop-blur border border-[#F59E0B]/30 dark:border-indigo-500/30 shadow-xl p-12 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-5 rounded-full bg-linear-to-br from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B] dark:from-indigo-600 dark:to-violet-500 flex items-center justify-center shadow-lg animate-pulse">
            <HiUser className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-[#7F1D1D] dark:text-indigo-300 mb-2">
            {search ? "Peserta tidak ditemukan" : "Belum ada data peserta"}
          </h3>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {search
              ? `Tidak ada peserta yang sesuai dengan pencarian "${search}".`
              : "Saat ini belum ada peserta yang terdaftar."}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/90 dark:bg-white/5 backdrop-blur border border-slate-200 dark:border-indigo-500/30 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-200 w-full text-sm sm:text-base">
              <thead>
                <tr className="bg-slate-50 dark:bg-indigo-500/10 border-b border-slate-200 dark:border-indigo-500/30">
                  <th className="w-[6%] py-4 px-6 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                    No
                  </th>
                  <th className="w-[22%] py-4 px-6 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                    Peserta
                  </th>
                  <th className="w-[24%] py-4 px-6 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                    Kontak
                  </th>
                  <th className="w-[16%] py-4 px-6 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                    Posisi
                  </th>
                  <th className="w-[18%] py-4 px-6 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                    Mentor
                  </th>
                  <th className="w-[14%] py-4 px-6 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-indigo-500/20">
                {currentItems.map((p, index) => (
                  <tr
                    key={p.pesertaId}
                    className="hover:bg-[#FEF3C7]/40 dark:hover:bg-indigo-500/10 transition"
                  >
                    <td className="py-4 px-6 text-center font-medium text-slate-500 dark:text-slate-300">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#7F1D1D] to-[#F59E0B] dark:from-indigo-600 dark:to-violet-500 flex items-center justify-center text-white shadow">
                          <HiUser className="w-5 h-5" />
                        </div>
                        <div className="text-left leading-tight">
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {p.nama}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {p.jurusan}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="space-y-1 text-slate-600 dark:text-slate-300">
                        <div className="flex justify-center items-center gap-2">
                          <HiMail className="w-4 h-4" />
                          <span className="truncate max-w-52">{p.email}</span>
                        </div>
                        <div className="flex justify-center items-center gap-2">
                          <HiPhone className="w-4 h-4" />
                          <span>{p.wa}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                        {p.posisi}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {p.mentor ? (
                        <div className="text-sm">
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {p.mentor.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {p.mentor.email}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-sm">
                          Belum ada mentor
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => setSelectedPeserta(p)}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-linear-to-r from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B] dark:from-indigo-600 dark:to-violet-500 shadow hover:shadow-xl hover:-translate-y-0.5 transition"
                      >
                        Lihat Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPage > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 py-5">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 dark:border-indigo-500/30 bg-white dark:bg-indigo-950 text-slate-700 dark:text-indigo-200 hover:bg-[#FFF1F2] dark:hover:bg-indigo-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Prev
              </button>
              {Array.from({ length: totalPage }).map((_, i) => {
                const active = page === i + 1;
                return (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`min-w-9.5 h-9.5 rounded-lg text-sm font-semibold transition ${active ? "bg-[#B91C1C] text-white shadow dark:bg-indigo-600" : "bg-white dark:bg-indigo-950 text-[#7F1D1D] dark:text-indigo-200 border border-slate-300 dark:border-indigo-500/30 hover:bg-[#FFF1F2] dark:hover:bg-indigo-900/40"}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
              <button
                disabled={page === totalPage}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 dark:border-indigo-500/30 bg-white dark:bg-indigo-950 text-slate-700 dark:text-indigo-200 hover:bg-[#FFF1F2] dark:hover:bg-indigo-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

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

type StatCardColor = "indigo" | "emerald" | "amber" | "slate";

type StatCardProps = {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  note: string;
  color: StatCardColor;
};

function StatCard({ title, value, icon, note, color }: StatCardProps) {
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
    <div className="group relative rounded-2xl border border-[#FCA5A5]/40 dark:border-indigo-500/30 bg-linear-to-br from-[#FFFDF8] via-[#FFF4EC] to-white dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-800 p-6 shadow-sm hover:shadow-xl transition">
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
          className={`w-14 h-14 rounded-2xl text-white flex items-center justify-center shadow group-hover:scale-110 transition ${iconColorMap[color]}`}
        >
          {icon}
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-[#FCA5A5]/40 dark:border-indigo-500/30">
        <p className="text-xs text-slate-600 dark:text-slate-300">{note}</p>
      </div>
    </div>
  );
}
