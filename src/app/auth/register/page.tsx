"use client";

import { useState } from "react";
import Link from "next/link";

export default function PendaftaranPage() {
  const [form, setForm] = useState({
    nama: "",
    email: "",
    nohp: "",
    sekolah: "",
    jurusan: "",
    tingkat: "",
    alamat: "",
    tanggalMulai: "",
    tanggalSelesai: "",
  });

  const [surat, setSurat] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    if (new Date(form.tanggalMulai) >= new Date(form.tanggalSelesai)) {
      alert("Tanggal mulai harus sebelum tanggal selesai.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value);
    });

    if (surat) {
      formData.append("surat", surat);
    }

    try {
      const res = await fetch("http://localhost:5000/api/pendaftaran", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ Pendaftaran berhasil dikirim!");
        // Reset form setelah sukses
        setForm({
          nama: "",
          email: "",
          nohp: "",
          sekolah: "",
          jurusan: "",
          tingkat: "",
          alamat: "",
          tanggalMulai: "",
          tanggalSelesai: "",
        });
        setSurat(null);
      } else {
        throw new Error(data.message || "Gagal mengirim pendaftaran.");
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat mengirim data.");
      console.error(err);
      alert("❌ " + (err.message || "Gagal mengirim pendaftaran."));
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const validTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
      ];
      if (!validTypes.includes(file.type)) {
        alert("Hanya file PDF atau gambar (JPG/PNG) yang diperbolehkan.");
        e.target.value = ""; // reset input
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        alert("Ukuran file maksimal 5 MB.");
        e.target.value = "";
        return;
      }
    }
    setSurat(file);
  };

  return (
    <div className="max-w-xl mx-auto p-5 mt-10 border rounded-lg shadow-xl bg-white">
      <h1 className="text-2xl font-bold mb-5 text-center text-gray-800">
        Form Pendaftaran Magang BPOM
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          type="text"
          placeholder="Nama Lengkap"
          className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-300 outline-none"
          value={form.nama}
          onChange={(e) => setForm({ ...form, nama: e.target.value })}
          required
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-300 outline-none"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <input
          type="text"
          placeholder="Nomor HP"
          className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-300 outline-none"
          value={form.nohp}
          onChange={(e) => setForm({ ...form, nohp: e.target.value })}
          required
        />

        <input
          type="text"
          placeholder="Asal Sekolah / Universitas"
          className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-300 outline-none"
          value={form.sekolah}
          onChange={(e) => setForm({ ...form, sekolah: e.target.value })}
          required
        />

        <input
          type="text"
          placeholder="Jurusan"
          className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-300 outline-none"
          value={form.jurusan}
          onChange={(e) => setForm({ ...form, jurusan: e.target.value })}
          required
        />

        <input
          type="text"
          placeholder="Tingkat (SMA/SMK/D3/S1)"
          className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-300 outline-none"
          value={form.tingkat}
          onChange={(e) => setForm({ ...form, tingkat: e.target.value })}
          required
        />

        <textarea
          placeholder="Alamat Lengkap"
          className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-300 outline-none"
          rows={3}
          value={form.alamat}
          onChange={(e) => setForm({ ...form, alamat: e.target.value })}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Tanggal Mulai
            </label>
            <input
              type="date"
              className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-300 outline-none"
              value={form.tanggalMulai}
              onChange={(e) =>
                setForm({ ...form, tanggalMulai: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Tanggal Selesai
            </label>
            <input
              type="date"
              className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-300 outline-none"
              value={form.tanggalSelesai}
              onChange={(e) =>
                setForm({ ...form, tanggalSelesai: e.target.value })
              }
              required
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">
            Upload Surat Pengantar (PDF/JPG/PNG, max 5 MB)
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="w-full p-2 border rounded mt-1 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            onChange={handleFileChange}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded font-semibold text-white transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Mengirim..." : "Kirim Pendaftaran"}
        </button>
      </form>

      {/* Button Cek Riwayat */}
      <div className="mt-8 text-center">
        <Link
          href="/auth/register/riwayat"
          className="inline-block bg-green-600 text-white px-6 py-3 rounded font-semibold hover:bg-green-700 transition shadow"
        >
          📋 Cek Riwayat Pendaftaran
        </Link>
      </div>
    </div>
  );
}
