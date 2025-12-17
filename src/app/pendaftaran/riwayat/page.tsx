"use client";

import { useState } from "react";

export default function RiwayatPendaftaran() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!email) return alert("Masukkan email terlebih dahulu!");
    if (!email.endsWith("@gmail.com")) {
      return alert("Email harus Gmail! Contoh: nama@gmail.com");
    }

    setLoading(true);

    try {
      const res = await fetch(
        `http://localhost:5000/api/pendaftaran/cek?email=${email}`
      );

      const data = await res.json();

      if (res.ok) {
        setResult(data);
      } else {
        alert(data.message || "Data tidak ditemukan");
        setResult(null);
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat mencari data!");
    }

    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Disetujui":
        return "bg-green-100 text-green-800";
      case "Ditolak":
        return "bg-red-100 text-red-800";
      case "Sedang Diproses":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-5 mt-10">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Cek Riwayat Pendaftaran
      </h1>

      <div className="flex gap-3 mb-6">
        <input
          type="email"
          placeholder="Masukkan email Gmail..."
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-6 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {loading ? "Mencari..." : "Cari"}
        </button>
      </div>

      {result && (
        <div className="space-y-6">
          <div className="p-4 bg-white rounded-xl shadow-md border border-gray-200">
            <h2 className="font-semibold text-xl mb-3">
              Informasi Pendaftaran
            </h2>

            <div className="flex flex-wrap gap-2 mb-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  result.status
                )}`}
              >
                {result.status}
              </span>
            </div>

            {result.jawabanAdmin && (
              <p className="mb-3 text-blue-700 font-medium">
                Jawaban Admin: {result.jawabanAdmin}
              </p>
            )}

            {result.suratPengantar && (
              <a
                href={`http://localhost:5000/uploads/${result.suratPengantar}`}
                target="_blank"
                className="inline-block mb-3 text-blue-600 underline"
              >
                Lihat Surat Pengantar
              </a>
            )}

            <h3 className="font-semibold text-lg mb-2">Peserta:</h3>
            <div className="space-y-4">
              {result.peserta.map((p: any, i: number) => (
                <div
                  key={i}
                  className="p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <p>
                    <span className="font-medium">Nama:</span> {p.nama}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span> {p.email}
                  </p>
                  <p>
                    <span className="font-medium">No HP:</span> {p.wa}
                  </p>
                  <p>
                    <span className="font-medium">Posisi:</span> {p.posisi}
                  </p>
                  <p>
                    <span className="font-medium">Alamat:</span>{" "}
                    {p.alamatLengkap}
                  </p>
                  <p>
                    <span className="font-medium">Provinsi:</span> {p.provinsi}
                  </p>
                  <p>
                    <span className="font-medium">Kota:</span> {p.kota}
                  </p>
                  <p>
                    <span className="font-medium">Kecamatan:</span>{" "}
                    {p.kecamatan}
                  </p>
                  <p>
                    <span className="font-medium">Kelurahan:</span>{" "}
                    {p.kelurahan}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
