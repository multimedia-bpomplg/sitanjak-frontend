"use client";

import { useState } from "react";

export default function RiwayatPendaftaran() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    // Tidak boleh kosong
    if (!email) return alert("Masukkan email terlebih dahulu!");

    // Validasi wajib Gmail
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
        setResult(data.data);
      } else {
        alert(data.message || "Data tidak ditemukan");
        setResult(null);
      }
    } catch (error) {
      alert("Terjadi kesalahan saat mencari data!");
      console.error(error);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-5 mt-10 border rounded-lg shadow bg-white">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Cek Riwayat Pendaftaran
      </h1>

      <div className="flex gap-3">
        <input
          type="email"
          placeholder="Masukkan email Gmail..."
          className="w-full p-3 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-5 rounded hover:bg-blue-700"
        >
          {loading ? "Mencari..." : "Cari"}
        </button>
      </div>

      {result && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h2 className="font-bold text-lg mb-2">Hasil Pendaftaran</h2>

          <p>
            <strong>Nama:</strong> {result.nama}
          </p>
          <p>
            <strong>Email:</strong> {result.email}
          </p>
          <p>
            <strong>No HP:</strong> {result.nohp}
          </p>
          <p>
            <strong>Sekolah:</strong> {result.sekolah}
          </p>
          <p>
            <strong>Jurusan:</strong> {result.jurusan}
          </p>
          <p>
            <strong>Tingkat:</strong> {result.tingkat}
          </p>
          <p>
            <strong>Alamat:</strong> {result.alamat}
          </p>
          <p>
            <strong>Tanggal Mulai:</strong> {result.tanggalMulai}
          </p>
          <p>
            <strong>Tanggal Selesai:</strong> {result.tanggalSelesai}
          </p>

          <p className="mt-2">
            <strong>Status:</strong>{" "}
            <span
              className={
                result.status === "Disetujui"
                  ? "text-green-600"
                  : result.status === "Ditolak"
                  ? "text-red-600"
                  : result.status === "Sedang Diproses"
                  ? "text-orange-600"
                  : "text-gray-600"
              }
            >
              {result.status}
            </span>
          </p>

          {result.jawabanAdmin && (
            <p className="mt-2 text-blue-700">
              <strong>Jawaban Admin:</strong> {result.jawabanAdmin}
            </p>
          )}

          {result.surat && (
            <a
              href={`http://localhost:5000/uploads/${result.surat}`}
              target="_blank"
              className="text-blue-600 underline mt-2 inline-block"
            >
              Lihat Surat Pengantar
            </a>
          )}
        </div>
      )}
    </div>
  );
}
