"use client";

import { useState } from "react";
import {
  FiX,
  FiUser,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiBook,
  FiCalendar,
} from "react-icons/fi";

type Props = {
  peserta: any;
  onClose: () => void;
  onViewLogbook: (email: string) => void;
  onViewLaporanBulanan: (email: string) => void;
  onViewLaporanAkhir: (email: string) => void;
};

export default function SuperadminPesertaModal({
  peserta,
  onClose,
  onViewLogbook,
  onViewLaporanBulanan,
  onViewLaporanAkhir,
}: Props) {
  const [activeTab, setActiveTab] = useState<"info" | "logbook" | "laporan">(
    "info",
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FiUser className="text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Detail Peserta</h2>
                <p className="text-sm opacity-90">{peserta?.nama}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <FiX className="text-xl" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <div className="flex px-6">
            <button
              onClick={() => setActiveTab("info")}
              className={`px-4 py-3 font-medium border-b-2 transition ${activeTab === "info" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500"}`}
            >
              Informasi
            </button>
            <button
              onClick={() => setActiveTab("logbook")}
              className={`px-4 py-3 font-medium border-b-2 transition ${activeTab === "logbook" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500"}`}
            >
              Logbook
            </button>
            <button
              onClick={() => setActiveTab("laporan")}
              className={`px-4 py-3 font-medium border-b-2 transition ${activeTab === "laporan" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500"}`}
            >
              Laporan
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === "info" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoField
                icon={<FiUser />}
                label="Nama Lengkap"
                value={peserta?.nama}
              />
              <InfoField
                icon={<FiMail />}
                label="Email"
                value={peserta?.email}
              />
              <InfoField
                icon={<FiPhone />}
                label="No WhatsApp"
                value={peserta?.wa}
              />
              <InfoField
                icon={<FiBriefcase />}
                label="Posisi Magang"
                value={peserta?.posisi}
              />
              <InfoField
                icon={<FiBook />}
                label="Jurusan"
                value={peserta?.jurusan}
              />
              <InfoField
                icon={<FiCalendar />}
                label="Kategori"
                value={peserta?.kategori}
              />
              <div className="col-span-2">
                <InfoField
                  icon={<FiCalendar />}
                  label="Periode Magang"
                  value={`${peserta?.tanggalMulaiMagang} s/d ${peserta?.tanggalSelesaiMagang}`}
                />
              </div>
              {peserta?.mentor && (
                <div className="col-span-2 p-4 bg-blue-50 rounded-xl">
                  <h3 className="font-semibold text-blue-700 mb-2">Mentor</h3>
                  <p className="font-medium">{peserta.mentor.name}</p>
                  <p className="text-sm text-blue-600">
                    {peserta.mentor.email}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "logbook" && (
            <div className="text-center py-8">
              <p className="text-slate-600 mb-4">
                Lihat dan kelola logbook peserta
              </p>
              <button
                onClick={() => onViewLogbook(peserta?.email)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition"
              >
                Buka Logbook Peserta
              </button>
            </div>
          )}

          {activeTab === "laporan" && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <h3 className="font-semibold text-slate-700 mb-3">
                  Laporan Bulanan
                </h3>
                <p className="text-slate-600 mb-3">
                  Kelola laporan bulanan peserta
                </p>
                <button
                  onClick={() => onViewLaporanBulanan(peserta?.email)}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition"
                >
                  Lihat Laporan Bulanan
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <h3 className="font-semibold text-slate-700 mb-3">
                  Laporan Akhir
                </h3>
                <p className="text-slate-600 mb-3">
                  Kelola laporan akhir peserta
                </p>
                <button
                  onClick={() => onViewLaporanAkhir(peserta?.email)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition"
                >
                  Lihat Laporan Akhir
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="font-semibold">{value || "-"}</p>
    </div>
  );
}
