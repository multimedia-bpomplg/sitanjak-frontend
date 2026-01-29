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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Disetujui":
        return `
          bg-emerald-100/80
          dark:bg-emerald-500/20
          border-[#F59E0B]/40
          dark:border-indigo-400/40
          text-emerald-800 dark:text-emerald-200
        `;
      case "Ditolak":
        return `
          bg-red-100/80
          dark:bg-red-500/20
          border-[#B91C1C]/40
          dark:border-indigo-400/40
          text-red-800 dark:text-red-200
        `;
      case "Perbaiki":
        return `
          bg-amber-100/80
          dark:bg-amber-500/20
          border-[#F59E0B]/40
          dark:border-indigo-400/40
          text-amber-800 dark:text-amber-200
        `;
      default:
        return `
          bg-slate-100/80
          dark:bg-indigo-950/40
          border-[#F59E0B]/30
          dark:border-indigo-500/30
          text-slate-700 dark:text-indigo-200
        `;
    }
  };

  return (
    <div className="
      fixed inset-0 z-50
      flex items-center justify-center
      bg-black/40 dark:bg-black/70
      backdrop-blur-md
      p-3 sm:p-6
    ">
      <div className="
        w-full max-w-4xl
        bg-white/90 dark:bg-indigo-950/40
        backdrop-blur
        rounded-3xl
        border border-[#F59E0B]/40
        dark:border-indigo-500/30
        shadow-2xl
        flex flex-col
        max-h-[92vh]
        overflow-hidden
      ">
        {/* ================= HEADER ================= */}
        <div className="
          px-5 sm:px-6 py-4 sm:py-5
          bg-linear-to-r
          from-[#F59E0B] via-[#B91C1C] to-[#7F1D1D]
          dark:from-indigo-600 dark:to-violet-500
          text-white
          flex items-center justify-between
        ">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <FiCalendar className="text-xl" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">
                Laporan Bulanan
              </h2>
              <p className="text-sm opacity-90">
                {laporan?.user?.name} • {laporan?.month}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* ================= BODY ================= */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-6">

          {/* STATUS */}
          <div className={`
            p-5 rounded-2xl border
            ${getStatusStyle(laporan?.status)}
          `}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {laporan?.status === "Disetujui" ? (
                  <FiCheck className="text-xl" />
                ) : laporan?.status === "Ditolak" ? (
                  <FiXCircle className="text-xl" />
                ) : (
                  <FiFileText className="text-xl" />
                )}
                <div>
                  <p className="font-bold text-base">
                    Status: {laporan?.status}
                  </p>
                  {laporan?.approvedAt && (
                    <p className="text-sm opacity-80">
                      Direview: {formatDate(laporan.approvedAt)}
                    </p>
                  )}
                </div>
              </div>

              <span className="
                px-4 py-1.5
                rounded-full
                text-xs font-semibold
                bg-white/70 dark:bg-indigo-900/40
                border border-[#F59E0B]/40
                dark:border-indigo-400/40
              ">
                Periode: {laporan?.month}
              </span>
            </div>
          </div>

          {/* USER INFO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoCard
              icon={<FiUser />}
              label="Nama Peserta"
              value={laporan?.user?.name}
            />
            <InfoCard
              icon={<FiMail />}
              label="Email"
              value={laporan?.user?.email}
            />
          </div>

          {/* CONTENT */}
          <div className="space-y-5">
            <FieldView label="Ringkasan Aktivitas" value={laporan?.ringkasan} />
            <FieldView label="Pencapaian Utama" value={laporan?.pencapaian} />
            <FieldView label="Kendala yang Dihadapi" value={laporan?.kendala} />
            <FieldView
              label="Rencana Bulan Berikutnya"
              value={laporan?.rencana}
            />
          </div>

          {/* REVIEW MENTOR */}
          {laporan?.approvedByMentor && (
            <div className="
              p-5 rounded-2xl
              bg-amber-50/80
              dark:bg-indigo-900/40
              border border-[#F59E0B]/40
              dark:border-indigo-500/40
            ">
              <h3 className="
                font-bold mb-2
                text-[#7F1D1D]
                dark:text-indigo-300
              ">
                Review Mentor
              </h3>
              <p className="font-medium">
                {laporan.approvedByMentor.name}
              </p>
              <p className="text-sm opacity-80">
                {laporan.approvedByMentor.email}
              </p>

              {laporan?.mentorNote && (
                <div className="mt-3 pt-3 border-t border-[#F59E0B]/40 dark:border-indigo-500/40">
                  <p className="text-sm font-semibold mb-1">Catatan:</p>
                  <p className="whitespace-pre-line opacity-90">
                    {laporan.mentorNote}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= FOOTER ================= */}
        <div className="
          px-5 sm:px-6 py-4
          border-t border-[#F59E0B]/30
          dark:border-indigo-500/30
          bg-white/60 dark:bg-indigo-950/30
          backdrop-blur
        ">
          <button
            onClick={onClose}
            className="
              w-full
              px-6 py-2.5
              rounded-xl
              bg-linear-to-r
              from-[#F59E0B] via-[#B91C1C] to-[#7F1D1D]
              hover:from-amber-400 hover:via-[#DC2626] hover:to-[#991B1B]
              dark:from-indigo-600 dark:to-violet-500
              dark:hover:from-indigo-500 dark:hover:to-violet-400
              text-white font-semibold
              shadow-md hover:shadow-xl
              transition-all
            "
          >
            Tutup
          </button>
        </div>

          {/* Superadmin Actions
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
          </div> */}
        </div>
      </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="
      flex items-center gap-3
      p-4 rounded-2xl
      bg-white/80 dark:bg-indigo-950/40
      border border-[#F59E0B]/30
      dark:border-indigo-500/30
    ">
      <div className="
        w-10 h-10 rounded-full
        bg-linear-to-br from-[#F59E0B] to-[#7F1D1D]
        dark:from-indigo-600 dark:to-violet-500
        flex items-center justify-center
        text-white
      ">
        {icon}
      </div>
      <div>
        <p className="text-xs opacity-70">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}

function FieldView({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <label className="
        font-bold tracking-wide
        text-[#7F1D1D]
        dark:text-indigo-300
      ">
        {label}
      </label>
      <div className="
        mt-2
        p-4 rounded-2xl
        bg-white/80 dark:bg-indigo-950/40
        border border-[#F59E0B]/30
        dark:border-indigo-500/30
        whitespace-pre-line
        text-slate-700 dark:text-slate-100
      ">
        {value || <span className="opacity-40">-</span>}
      </div>
    </div>
  );
}
