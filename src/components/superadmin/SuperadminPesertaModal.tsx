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
  FiBookOpen,
  FiFileText,
  FiFile,
} from "react-icons/fi";
import SuratSelesaiUpload from "./SuratSelesaiUpload";

type Props = {
  peserta: any;
  onClose: () => void;
  onViewLogbook: (email: string) => void;
  onViewLaporanBulanan: (email: string) => void;
  onViewLaporanAkhir: (email: string) => void;
  onSuratSelesaiSuccess?: () => void;
};

export default function SuperadminPesertaModal({
  peserta,
  onClose,
  onViewLogbook,
  onViewLaporanBulanan,
  onViewLaporanAkhir,
}: Props) {
  const [activeTab, setActiveTab] = useState<
    "info" | "logbook" | "laporan" | "suratSelesai"
  >("info");

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="
          w-full max-w-5xl
          bg-white/90 dark:bg-white/5
          backdrop-blur
          rounded-3xl
          shadow-2xl
          overflow-hidden
          flex flex-col
          max-h-[92vh]
        "
      >
        {/* ================= HEADER ================= */}
        <div
          className="
            px-6 py-5
            bg-linear-to-r
            from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
            dark:from-indigo-600 dark:to-violet-600
            text-white
          "
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <FiUser className="text-2xl" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold">Detail Peserta</h2>
                <p className="text-sm opacity-90">{peserta?.nama}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <FiX className="text-2xl" />
            </button>
          </div>
        </div>

        {/* ================= TABS ================= */}
        <div className="px-6 pt-4">
          <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-indigo-950 p-1.5 rounded-2xl">
            <TabButton
              active={activeTab === "info"}
              onClick={() => setActiveTab("info")}
            >
              Informasi
            </TabButton>
            <TabButton
              active={activeTab === "logbook"}
              onClick={() => setActiveTab("logbook")}
            >
              Logbook
            </TabButton>
            <TabButton
              active={activeTab === "laporan"}
              onClick={() => setActiveTab("laporan")}
            >
              Laporan
            </TabButton>
            <TabButton
              active={activeTab === "suratSelesai"}
              onClick={() => setActiveTab("suratSelesai")}
            >
              <span className="flex items-center gap-2">
                <FiFile className="text-sm" />
                Kirim Surat Selesai
              </span>
            </TabButton>
          </div>
        </div>

        {/* ================= BODY ================= */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ---------- INFO ---------- */}
          {activeTab === "info" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InfoCard icon={<FiUser />} label="Nama" value={peserta?.nama} />
              <InfoCard
                icon={<FiMail />}
                label="Email"
                value={peserta?.email}
              />
              <InfoCard
                icon={<FiPhone />}
                label="WhatsApp"
                value={peserta?.wa}
              />
              <InfoCard
                icon={<FiBriefcase />}
                label="Posisi"
                value={peserta?.posisi}
              />
              <InfoCard
                icon={<FiBook />}
                label="Jurusan"
                value={peserta?.jurusan}
              />
              <InfoCard
                icon={<FiCalendar />}
                label="Kategori"
                value={peserta?.kategori}
              />

              <div className="md:col-span-2">
                <InfoCard
                  icon={<FiCalendar />}
                  label="Periode Magang"
                  value={`${peserta?.tanggalMulaiMagang} – ${peserta?.tanggalSelesaiMagang}`}
                />
              </div>

              {peserta?.mentor && (
                <div
                  className="
                    md:col-span-2
                    p-5 rounded-2xl
                    bg-linear-to-r
                    from-[#FFF1F2] to-[#FEF3C7]
                    dark:from-indigo-900/40 dark:to-violet-900/40
                    border border-[#FCA5A5]/40 dark:border-indigo-500/30
                  "
                >
                  <p className="text-sm font-semibold text-[#7F1D1D] dark:text-indigo-300 mb-1">
                    Mentor
                  </p>
                  <p className="font-bold text-slate-800 dark:text-white">
                    {peserta.mentor.name}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {peserta.mentor.email}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ---------- LOGBOOK ---------- */}
          {activeTab === "logbook" && (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <div
                className="
                  w-16 h-16 rounded-full
                  bg-linear-to-br from-[#7F1D1D] to-[#F59E0B]
                  dark:from-indigo-600 dark:to-violet-500
                  flex items-center justify-center
                  text-white mb-4
                  shadow-lg
                "
              >
                <FiBookOpen className="text-2xl" />
              </div>
              <h3 className="text-lg font-bold mb-2">Logbook Peserta</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">
                Lihat seluruh aktivitas harian peserta selama magang.
              </p>
              <button
                onClick={() => onViewLogbook(peserta?.email)}
                className="
                  px-6 py-3 rounded-xl
                  bg-linear-to-r from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                  dark:from-indigo-600 dark:to-violet-500
                  text-white font-semibold
                  shadow hover:shadow-xl
                  transition hover:-translate-y-0.5
                "
              >
                Buka Logbook
              </button>
            </div>
          )}

          {/* ---------- LAPORAN ---------- */}
          {activeTab === "laporan" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ActionCard
                title="Laporan Bulanan"
                desc="Monitoring perkembangan bulanan peserta."
                icon={<FiFileText />}
                color="amber"
                onClick={() => onViewLaporanBulanan(peserta?.email)}
                label="Lihat Laporan Bulanan"
              />

              <ActionCard
                title="Laporan Akhir"
                desc="Ringkasan akhir hasil magang peserta."
                icon={<FiBookOpen />}
                color="emerald"
                onClick={() => onViewLaporanAkhir(peserta?.email)}
                label="Lihat Laporan Akhir"
              />
            </div>
          )}

          {/* ---------- SURAT SELESAI MAGANG ---------- */}
          {activeTab === "suratSelesai" && (
            <SuratSelesaiUpload
              peserta={peserta}
              onSuccess={() => {
                // Optional: refresh data atau notifikasi
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= SMALL COMPONENTS ================= */

function TabButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-xl text-sm font-semibold transition
        ${
          active
            ? `
              bg-white dark:bg-indigo-600
              text-[#7F1D1D] dark:text-white
              shadow
            `
            : `
              text-slate-500 dark:text-slate-300
              hover:bg-white/60 dark:hover:bg-indigo-900/40
            `
        }
      `}
    >
      {children}
    </button>
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
    <div
      className="
        p-4 rounded-2xl
        border border-[#FCA5A5]/40 dark:border-indigo-500/30
        bg-white/80 dark:bg-indigo-950
        backdrop-blur
        hover:shadow-md transition
      "
    >
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300 text-sm mb-1">
        {icon}
        {label}
      </div>
      <p className="font-semibold text-slate-800 dark:text-white">
        {value || "-"}
      </p>
    </div>
  );
}

function ActionCard({
  title,
  desc,
  icon,
  onClick,
  label,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: "amber" | "emerald";
  onClick: () => void;
  label: string;
}) {
  return (
    <div
      className="
        p-6 rounded-2xl
        bg-white/80 dark:bg-indigo-950
        border border-slate-200 dark:border-indigo-500/30
        shadow hover:shadow-xl
        transition flex flex-col
      "
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="
            w-10 h-10 rounded-xl
            bg-linear-to-br from-[#7F1D1D] to-[#F59E0B]
            dark:from-indigo-600 dark:to-violet-500
            flex items-center justify-center
            text-white
          "
        >
          {icon}
        </div>
        <h3 className="font-bold text-lg">{title}</h3>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">{desc}</p>
      <button
        onClick={onClick}
        className="
          mt-auto
          px-5 py-2.5 rounded-xl
          bg-linear-to-r from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
          dark:from-indigo-600 dark:to-violet-500
          text-white font-semibold
          hover:shadow-xl transition
        "
      >
        {label}
      </button>
    </div>
  );
}
