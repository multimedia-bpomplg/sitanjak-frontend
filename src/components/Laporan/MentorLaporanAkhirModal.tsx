"use client";

import { FiX, FiFileText, FiAward } from "react-icons/fi";

type Props = {
  peserta: {
    nama: string;
    email: string;
    posisi: string;
  };
  onClose: () => void;
};

export default function LaporanAkhirModal({ peserta, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex justify-between">
          <div className="flex items-center gap-3">
            <FiAward />
            <div>
              <h2 className="text-xl font-bold">Laporan Akhir</h2>
              <p className="text-sm opacity-90">{peserta.nama}</p>
            </div>
          </div>
          <button onClick={onClose}>
            <FiX className="text-xl" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-5">
          <Field
            label="Ringkasan Program Magang"
            value="Ringkasan keseluruhan kegiatan selama magang."
          />
          <Field
            label="Kontribusi Utama"
            value="Pengembangan fitur dan perbaikan sistem."
          />
          <Field
            label="Pencapaian Akhir"
            value="Aplikasi berjalan stabil dan siap produksi."
          />
          <Field
            label="Evaluasi Diri"
            value="Meningkatkan kemampuan teknis dan komunikasi."
          />
          <Field
            label="Kesimpulan & Saran"
            value="Program sangat bermanfaat dan relevan."
          />
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t bg-slate-50 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 font-semibold text-slate-700">
        <FiFileText />
        {label}
      </div>
      <div className="p-4 bg-slate-50 border rounded-xl whitespace-pre-line">
        {value}
      </div>
    </div>
  );
}
