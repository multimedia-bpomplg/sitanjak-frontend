"use client";

import { useEffect, useState } from "react";

/* ===================== TYPE ===================== */
type Pendaftaran = {
  id: number;
  nama: string;
  email: string;
  posisi: string;
  asal: string;
  tanggal: string;
  status: "Pending" | "Diterima" | "Ditolak";
};

/* ===================== KONSTANTA ===================== */
const PAGE_SIZE = 10;

export default function ViewPendaftaranPage() {
  const [data, setData] = useState<Pendaftaran[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

  /* ===================== LOAD DATA (DUMMY) ===================== */
  useEffect(() => {
    const dummyData: Pendaftaran[] = Array.from({ length: 21 }, (_, index) => ({
      id: index + 1,
      nama: `Peserta ${index + 1}`,
      email: `peserta${index + 1}@gmail.com`,
      posisi:
        index % 3 === 0
          ? "IT / Programmer"
          : index % 3 === 1
          ? "Desain Grafis"
          : "Administrasi",
      asal: "Universitas Bina Darma",
      tanggal: "2025-12-10",
      status:
        index % 3 === 0 ? "Pending" : index % 3 === 1 ? "Diterima" : "Ditolak",
    }));

    setData(dummyData);
  }, []);

  /* ===================== SEARCH FILTER ===================== */
  const filteredData = data.filter(
    (item) =>
      item.nama.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase()) ||
      item.posisi.toLowerCase().includes(search.toLowerCase()) ||
      item.asal.toLowerCase().includes(search.toLowerCase())
  );

  /* ===================== PAGINATION ===================== */
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const currentData = filteredData.slice(startIndex, startIndex + PAGE_SIZE);

  /* ===================== SUMMARY ===================== */
  const totalPendaftar = data.length;

  const jumlahPerPosisi = data.reduce<Record<string, number>>((acc, item) => {
    acc[item.posisi] = (acc[item.posisi] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* ===================== HEADER ===================== */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Data Pendaftaran
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Daftar peserta yang telah melakukan pendaftaran
        </p>
      </div>

      {/* ===================== SUMMARY CARD ===================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 border rounded-lg p-3 shadow-sm">
          <p className="text-xs text-gray-500">Jumlah Pendaftar</p>
          <h2 className="text-lg font-semibold text-blue-600">
            {totalPendaftar} Orang
          </h2>
        </div>

        {Object.entries(jumlahPerPosisi).map(([posisi, jumlah]) => (
          <div
            key={posisi}
            className="bg-white dark:bg-gray-800 border rounded-lg p-3 shadow-sm"
          >
            <p className="text-xs text-gray-500 truncate">{posisi}</p>
            <h2 className="text-lg font-semibold text-green-600">
              {jumlah} Org
            </h2>
          </div>
        ))}
      </div>

      {/* ===================== SEARCH BAR ===================== */}
      <div className="bg-white dark:bg-gray-800 border rounded-lg p-3 shadow-sm">
        <input
          type="text"
          placeholder="Cari nama, email, posisi, atau asal..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-72 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* ===================== TABLE ===================== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">No</th>
                <th className="px-4 py-3 text-left">Nama</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Posisi</th>
                <th className="px-4 py-3 text-left">Asal</th>
                <th className="px-4 py-3 text-left">Tanggal</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {currentData.map((item, index) => (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{startIndex + index + 1}</td>
                  <td className="px-4 py-3 font-medium">{item.nama}</td>
                  <td className="px-4 py-3">{item.email}</td>
                  <td className="px-4 py-3">{item.posisi}</td>
                  <td className="px-4 py-3">{item.asal}</td>
                  <td className="px-4 py-3">{item.tanggal}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold
                        ${
                          item.status === "Diterima"
                            ? "bg-green-100 text-green-700"
                            : item.status === "Ditolak"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center space-x-2">
                    <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded">
                      Detail
                    </button>
                    <button className="px-3 py-1 text-xs bg-red-600 text-white rounded">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}

              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-gray-500">
                    Data tidak ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ===================== PAGINATION ===================== */}
        {filteredData.length > PAGE_SIZE && (
          <div className="flex justify-between px-4 py-3 border-t">
            <span className="text-sm text-gray-500">
              Halaman {currentPage} dari {totalPages}
            </span>

            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                ◀ Sebelumnya
              </button>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Selanjutnya ▶
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
