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
} from "react-icons/fi";

type Props = {
  laporan: any;
  onClose: () => void;
};

export default function SuperadminLaporanBulananModal({
  laporan,
  onClose,
}: Props) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Disetujui":
        return "bg-emerald-50 border-emerald-200 text-emerald-800";
      case "Ditolak":
        return "bg-red-50 border-red-200 text-red-800";
      case "Perbaiki":
        return "bg-amber-50 border-amber-200 text-amber-800";
      default:
        return "bg-slate-50 border-slate-200 text-slate-800";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-600 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FiCalendar className="text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Laporan Bulanan</h2>
                <p className="text-sm opacity-90">
                  {laporan?.user?.name} • {laporan?.month}
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Status & Info */}
          <div
            className={`px-5 py-4 rounded-xl border ${getStatusColor(laporan?.status)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {laporan?.status === "Disetujui" ? (
                  <FiCheck className="text-xl" />
                ) : laporan?.status === "Ditolak" ? (
                  <FiXCircle className="text-xl" />
                ) : (
                  <FiFileText className="text-xl" />
                )}
                <div>
                  <p className="font-semibold text-lg">
                    Status: {laporan?.status}
                  </p>
                  {laporan?.approvedAt && (
                    <p className="text-sm mt-1">
                      Direview: {formatDate(laporan.approvedAt)}
                    </p>
                  )}
                </div>
              </div>
              <span className="px-3 py-1 bg-white rounded-full text-sm font-medium">
                Periode: {laporan?.month}
              </span>
            </div>
          </div>

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
            <Section label="Ringkasan Aktivitas" value={laporan?.ringkasan} />
            <Section label="Pencapaian Utama" value={laporan?.pencapaian} />
            <Section label="Kendala yang Dihadapi" value={laporan?.kendala} />
            <Section
              label="Rencana Bulan Berikutnya"
              value={laporan?.rencana}
            />
          </div>

          {/* Mentor Review */}
          {laporan?.approvedByMentor && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h3 className="font-semibold text-blue-700 mb-2">
                Review Mentor
              </h3>
              <div className="space-y-2">
                <p className="font-medium">{laporan.approvedByMentor.name}</p>
                <p className="text-sm text-blue-600">
                  {laporan.approvedByMentor.email}
                </p>
                {laporan?.mentorNote && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-sm text-blue-700">Catatan:</p>
                    <p className="mt-1 text-blue-800 whitespace-pre-line">
                      {laporan.mentorNote}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Superadmin Actions */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <h3 className="font-semibold text-slate-700 mb-3">
              Aksi Superadmin
            </h3>
            <div className="flex gap-3">
              <button className="px-5 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition">
                Simpan Catatan
              </button>
              <button className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
                Setujui
              </button>
              <button className="px-5 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition">
                Minta Revisi
              </button>
              <button className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                Tolak
              </button>
            </div>
          </div>
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
