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

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* ================= HEADER ================= */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Data Pendaftaran</h1>
        <p className="text-slate-600 mt-2">
          Kelola data peserta yang terdaftar dalam program magang
        </p>
      </div>

      {/* ================= STATISTICS CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Jumlah Peserta
              </p>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                {data.length}
              </p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-xl">
              <HiUsers className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-slate-500">
              Total peserta yang terdaftar
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Terkoneksi Mentor
              </p>
              <p className="text-3xl font-bold text-emerald-600 mt-2">
                {connectedToMentor}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <HiCheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-slate-500">
              Peserta sudah mendapatkan mentor
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Belum Mentor</p>
              <p className="text-3xl font-bold text-rose-600 mt-2">
                {noMentor}
              </p>
            </div>
            <div className="p-3 bg-rose-100 rounded-xl">
              <HiXCircle className="w-8 h-8 text-rose-600" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-slate-500">Menunggu penugasan mentor</p>
          </div>
        </div>
      </div>

      {/* ================= SEARCH AND ACTION BAR ================= */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <HiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari peserta berdasarkan nama, email, atau posisi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-700 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="mt-2 flex justify-between text-sm text-slate-500">
          <p>
            Menampilkan {filteredData.length} dari {data.length} peserta
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Reset pencarian
            </button>
          )}
        </div>
      </div>

      {/* ================= TABLE ================= */}
      {loading ? (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-6 text-lg text-slate-600 font-medium">
            Memuat data peserta...
          </p>
          <p className="mt-2 text-sm text-slate-500">Harap tunggu sebentar</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
            <HiUsers className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">
            {searchQuery
              ? "Peserta tidak ditemukan"
              : "Belum ada peserta terdaftar"}
          </h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            {searchQuery
              ? `Tidak ada peserta yang sesuai dengan pencarian "${searchQuery}". Coba dengan kata kunci lain.`
              : "Belum ada peserta yang mendaftar dalam program magang."}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              Tampilkan Semua Peserta
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    No
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Peserta
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Kontak
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Posisi
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((p, i) => (
                  <tr
                    key={`${p.email}-${i}`}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-4 px-6 text-center text-slate-500 font-medium">
                      {i + 1}
                    </td>
                    <td className="py-4 px-6">
                      <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => {
                          setSelectedPeserta(p);
                          setOpenModal(true);
                        }}
                      >
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                          <HiUser className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 group-hover:text-indigo-700 transition-colors">
                            {p.nama}
                          </p>
                          <p className="text-xs text-slate-500">
                            Klik untuk detail
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-slate-600">
                        <MdEmail className="w-4 h-4" />
                        <span className="text-sm truncate max-w-[200px]">
                          {p.email}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        <HiBriefcase className="w-3 h-3" />
                        {p.posisi}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {p.kategori || "Bersama"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
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
    <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
      Disetujui
    </span>
  );
}
