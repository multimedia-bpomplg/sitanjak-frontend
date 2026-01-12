"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  HiMail,
  HiSearch,
  HiUserGroup,
  HiPhone,
  HiBriefcase,
  HiLocationMarker,
  HiArrowLeft,
  HiOfficeBuilding,
} from "react-icons/hi";

export default function RiwayatPendaftaranPeserta() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [popup, setPopup] = useState<{
    show: boolean;
    type: "error" | "warning" | "success";
    message: string;
  }>({
    show: false,
    type: "success",
    message: "",
  });

  /* ================= SEARCH ================= */
  const handleSearch = async () => {
    if (!email) {
      return setPopup({
        show: true,
        type: "warning",
        message: "Masukkan email terlebih dahulu",
      });
    }

    if (!email.endsWith("@gmail.com")) {
      return setPopup({
        show: true,
        type: "warning",
        message: "Email harus menggunakan Gmail",
      });
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/pendaftaran/cek?email=${email}`
      );

      const data = await res.json();

      if (!res.ok) {
        setResult(null);
        setPopup({
          show: true,
          type: "error",
          message: data.message || "Data pendaftaran tidak ditemukan",
        });
      } else {
        setResult(data);
        setPopup({
          show: true,
          type: "success",
          message: "Data pendaftaran berhasil ditemukan",
        });
      }
    } catch {
      setPopup({
        show: true,
        type: "error",
        message: "Terjadi kesalahan saat mengambil data",
      });
    }

    setLoading(false);
  };

  /* ================= STATUS BADGE ================= */
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 py-16 px-4">
      {/* BACK */}
      <div className="mb-10 max-w-4xl mx-auto">
        <Link
          href="/peserta/dashboard"
          className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-white border shadow hover:bg-blue-50 transition"
        >
          <HiArrowLeft />
          Kembali ke Dashboard
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-blue-900">
            Riwayat Pendaftaran Magang
          </h1>
          <p className="text-gray-600 mt-3">
            Gunakan email yang sama saat mendaftar
          </p>
        </div>

        {/* SEARCH */}
        <div className="bg-white rounded-2xl shadow p-6 mb-10">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="email"
              placeholder="nama@gmail.com"
              className="flex-1 px-4 py-3 rounded-xl border"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button
              onClick={handleSearch}
              className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold"
            >
              {loading ? "Mencari..." : "Cari Data"}
            </button>
          </div>
        </div>

        {/* RESULT */}
        {result && (
          <div className="bg-white rounded-3xl shadow-xl p-8 space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Informasi Pendaftaran</h2>
              <span
                className={`px-4 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(
                  result.status
                )}`}
              >
                {result.status}
              </span>
            </div>

            {/* PESERTA */}
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <HiUserGroup /> Data Peserta
              </h3>

              <div className="grid sm:grid-cols-2 gap-6">
                {result.peserta.map((p: any, i: number) => (
                  <div
                    key={i}
                    className="rounded-2xl border p-5 bg-gray-50 space-y-2"
                  >
                    <p className="font-bold text-lg">{p.nama}</p>
                    <p className="text-sm">{p.email}</p>
                    <p className="text-sm">{p.wa}</p>
                    <p className="text-sm">{p.posisi}</p>
                    <p className="text-sm text-gray-600">
                      {p.alamatLengkap}, {p.kota}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
