"use client";

import { useEffect, useState } from "react";
import LaporanAkhirModal from "@/components/Laporan/LaporanAkhirModal";

type LaporanAkhir = {
  judul: string;
  createdAt: string;
  approvedByMentor?: boolean;
};

export default function LaporanAkhirPage() {
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<"create" | "view">("create");
  const [laporan, setLaporan] = useState<LaporanAkhir | null>(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : "";

  /* ================= CEK LAPORAN AKHIR ================= */
  const fetchLaporan = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/laporan-akhir`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) return;

      const data = await res.json();
      setLaporan(data);
      setMode("view");
    } catch {
      console.error("Gagal mengambil laporan akhir");
    }
  };

  useEffect(() => {
    fetchLaporan();
  }, []);

  const downloadPdf = () => {
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL}/laporan-akhir/pdf`,
      "_blank"
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Laporan Akhir Magang
        </h1>
        <p className="text-sm text-slate-500">
          Laporan akhir hanya dapat diisi satu kali dan bersifat final
        </p>
      </div>

      {/* RIWAYAT */}
      {laporan && (
        <div className="rounded-2xl border bg-white shadow p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {laporan.judul}
              </h2>
              <p className="text-sm text-slate-500">
                Dikirim pada{" "}
                {new Date(laporan.createdAt).toLocaleDateString("id-ID")}
              </p>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
              FINAL
            </span>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
            >
              👁 Lihat Detail
            </button>

            <button
              onClick={downloadPdf}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
            >
              ⬇️ Download PDF
            </button>
          </div>

          {laporan.approvedByMentor && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-3 text-sm text-emerald-700">
              ✅ Laporan akhir telah disetujui oleh mentor
            </div>
          )}
        </div>
      )}

      {/* TOMBOL ISI */}
      {!laporan && (
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
        >
          ✍️ Isi Laporan Akhir
        </button>
      )}

      {/* MODAL */}
      {showModal && (
        <LaporanAkhirModal
          mode={mode}
          onClose={(success) => {
            setShowModal(false);
            if (success) fetchLaporan();
          }}
        />
      )}
    </div>
  );
}
