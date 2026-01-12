"use client";

import { useEffect, useState } from "react";
import LaporanBulananModal from "@/components/Laporan/LaporanBulananModal";

export default function LaporanBulananPage() {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "view">("create");
  const [showModal, setShowModal] = useState(false);
  const [riwayat, setRiwayat] = useState<any[]>([]);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : "";

  /* ================= RIWAYAT ================= */
  const fetchRiwayat = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/laporan-bulanan/riwayat`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setRiwayat(data);
    } catch {
      console.error("Gagal memuat riwayat laporan bulanan");
    }
  };

  useEffect(() => {
    fetchRiwayat();
  }, []);

  /* ================= CEK ================= */
  const checkLaporan = async (month: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/laporan-bulanan/${month}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setModalMode(res.ok ? "view" : "create");
      setShowModal(true);
    } catch {
      setModalMode("create");
      setShowModal(true);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Laporan Bulanan</h1>
        <p className="text-sm text-slate-500">
          Isi dan lihat laporan bulanan kegiatan magang
        </p>
      </div>

      {/* PILIH BULAN */}
      <div className="bg-white rounded-2xl shadow p-6 max-w-md">
        <label className="block text-sm font-semibold mb-2">
          Pilih Bulan Laporan
        </label>

        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-indigo-500"
        />

        <button
          disabled={!selectedMonth}
          onClick={() => checkLaporan(selectedMonth)}
          className={`mt-4 w-full py-2.5 rounded-xl font-semibold text-white ${
            !selectedMonth
              ? "bg-slate-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          Lihat / Isi Laporan
        </button>
      </div>

      {/* RIWAYAT */}
      {riwayat.length > 0 && (
        <div className="space-y-3">
          {riwayat.map((item) => (
            <button
              key={item.month}
              onClick={() => {
                setSelectedMonth(item.month);
                setModalMode("view");
                setShowModal(true);
              }}
              className="w-full text-left border rounded-xl p-4 hover:bg-slate-50"
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold">{item.month}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <span className="text-xs font-semibold">
                  {item.approvedByMentor ? "Disetujui" : "Menunggu"}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* MODAL */}
      {showModal && selectedMonth && (
        <LaporanBulananModal
          month={selectedMonth}
          mode={modalMode}
          onClose={(submitted) => {
            setShowModal(false);
            if (submitted) fetchRiwayat();
          }}
        />
      )}
    </div>
  );
}
