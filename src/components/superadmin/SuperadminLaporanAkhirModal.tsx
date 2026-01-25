"use client";

import { useState } from "react";
import {
  FiX,
  FiFileText,
  FiUser,
  FiMail,
  FiCalendar,
  FiCheck,
  FiXCircle,
  FiEdit,
} from "react-icons/fi";

type Props = {
  laporan: any;
  onClose: () => void;
};

export default function SuperadminLaporanAkhirModal({
  laporan,
  onClose,
}: Props) {
  const [activeTab, setActiveTab] = useState<"detail" | "review">("detail");

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FiFileText className="text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Laporan Akhir Magang</h2>
                <p className="text-sm opacity-90">
                  {laporan?.user?.name} • {formatDate(laporan?.createdAt)}
                </p>
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
              onClick={() => setActiveTab("detail")}
              className={`px-4 py-3 font-medium border-b-2 transition ${activeTab === "detail" ? "border-emerald-600 text-emerald-600" : "border-transparent text-slate-500"}`}
            >
              Detail Laporan
            </button>
            <button
              onClick={() => setActiveTab("review")}
              className={`px-4 py-3 font-medium border-b-2 transition ${activeTab === "review" ? "border-emerald-600 text-emerald-600" : "border-transparent text-slate-500"}`}
            >
              Review & Status
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === "detail" && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <FiUser className="text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-500">Nama Peserta</p>
                    <p className="font-semibold">{laporan?.user?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <FiMail className="text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="font-semibold">{laporan?.user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Laporan Content */}
              <div className="space-y-4">
                <Section label="Judul Laporan" value={laporan?.judul} />
                <Section
                  label="Ringkasan Kegiatan"
                  value={laporan?.ringkasan}
                />
                <Section label="Hasil & Pencapaian" value={laporan?.hasil} />
                <Section label="Kendala" value={laporan?.kendala} />
                <Section label="Kesimpulan" value={laporan?.kesimpulan} />
                <Section label="Saran" value={laporan?.saran} />
              </div>
            </div>
          )}

          {activeTab === "review" && (
            <div className="space-y-6">
              {/* Status */}
              <div
                className={`
                px-5 py-4 rounded-xl border
                ${
                  laporan?.status === "Disetujui"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : laporan?.status === "Ditolak"
                      ? "border-red-300 bg-red-50 text-red-800"
                      : laporan?.status === "Revisi"
                        ? "border-amber-300 bg-amber-50 text-amber-800"
                        : "border-slate-300 bg-slate-50 text-slate-800"
                }
              `}
              >
                <div className="flex items-center gap-3">
                  {laporan?.status === "Disetujui" ? (
                    <FiCheck className="text-xl" />
                  ) : laporan?.status === "Ditolak" ? (
                    <FiXCircle className="text-xl" />
                  ) : (
                    <FiEdit className="text-xl" />
                  )}
                  <div>
                    <p className="font-semibold text-lg">
                      Status: {laporan?.status}
                    </p>
                    {laporan?.approvedAt && (
                      <p className="text-sm mt-1">
                        Tanggal Approve: {formatDate(laporan.approvedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Mentor Approval */}
              {laporan?.approvedByMentor && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h3 className="font-semibold text-blue-700 mb-2">
                    Disetujui oleh Mentor
                  </h3>
                  <p className="font-medium">{laporan.approvedByMentor.name}</p>
                  <p className="text-sm text-blue-600">
                    {laporan.approvedByMentor.email}
                  </p>
                  {laporan?.mentorNote && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-sm text-blue-700">Catatan Mentor:</p>
                      <p className="mt-1 text-blue-800">{laporan.mentorNote}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Review Form */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <h3 className="font-semibold text-slate-700 mb-3">
                  Review Superadmin
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Status Review
                    </label>
                    <div className="flex gap-2">
                      {["Disetujui", "Ditolak", "Revisi"].map((status) => (
                        <button
                          key={status}
                          className={`px-4 py-2 rounded-lg font-medium transition ${
                            laporan?.status === status
                              ? status === "Disetujui"
                                ? "bg-emerald-500 text-white"
                                : status === "Ditolak"
                                  ? "bg-red-500 text-white"
                                  : "bg-amber-500 text-white"
                              : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Catatan
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                      placeholder="Tambahkan catatan review..."
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button className="px-5 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition">
                      Simpan Catatan
                    </button>
                    <button className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
                      Finalisasi Review
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <label className="font-semibold text-slate-700">{label}</label>
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 whitespace-pre-line">
        {value || <span className="text-slate-400">-</span>}
      </div>
    </div>
  );
}
