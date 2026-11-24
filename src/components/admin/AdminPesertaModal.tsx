"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Briefcase,
  Calendar,
  FileText,
  GraduationCap,
  Mail,
  Phone,
  ShieldCheck,
  User,
  UserCheck,
  X,
} from "lucide-react";
import SuratSelesaiUpload from "@/components/superadmin/SuratSelesaiUpload";
import SertifikatUpload from "@/components/superadmin/SertifikatUpload";
import { showToast } from "@/components/ui/toastDashboard";
import { isMatchingMentorFormasi } from "@/lib/formasiMentor";
import { isPkpaPeserta } from "@/lib/pesertaKategori";

type MentorOption = {
  _id: string;
  name: string;
  email?: string;
  posisiMentor?: string;
  status?: string;
};

export type PesertaDisetujuiItem = {
  pendaftaranId: string;
  pesertaId?: string;
  nama: string;
  email: string;
  wa: string;
  posisi: string;
  jurusan?: string;
  asal?: {
    jenis?: string;
    nama?: string;
  } | null;
  jenisKelamin?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  provinsi?: string;
  kota?: string;
  kecamatan?: string;
  kelurahan?: string;
  alamatLengkap?: string;
  kategoriMagang?: "PKPA" | "Reguler";
  kategori?: string;
  mentor?: {
    _id?: string;
    name: string;
    email?: string;
    posisiMentor?: string;
  } | null;
  statusMagang?: string;
  isTerdaftar?: boolean;
  tanggalMulaiMagang: string;
  tanggalSelesaiMagang: string;
  createdAt?: string;
};

type Props = {
  peserta: PesertaDisetujuiItem;
  onClose: () => void;
  onViewLogbook: (email: string) => void;
  onViewLaporanAkhir: (email: string) => void;
  onSuratSelesaiSuccess?: () => void;
};

type TabKey = "profil" | "logbook" | "laporan" | "suratSelesai" | "sertifikat";

export default function AdminPesertaModal({
  peserta,
  onClose,
  onViewLogbook,
  onViewLaporanAkhir,
  onSuratSelesaiSuccess,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("profil");
  const [mentors, setMentors] = useState<MentorOption[]>([]);
  const [currentMentor, setCurrentMentor] = useState(peserta.mentor || null);
  const [editingMentor, setEditingMentor] = useState(false);
  const [selectedMentorId, setSelectedMentorId] = useState(
    peserta.mentor?._id || "",
  );
  const [savingMentor, setSavingMentor] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

  useEffect(() => {
    setCurrentMentor(peserta.mentor || null);
    setSelectedMentorId(peserta.mentor?._id || "");
  }, [peserta]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !API_BASE) return;
    fetch(`${API_BASE}/admin/mentor`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => {
        if (Array.isArray(list)) setMentors(list);
      })
      .catch(() => {});
  }, [API_BASE]);

  const matchingMentors = useMemo(
    () =>
      mentors.filter(
        (m) =>
          m.status?.toLowerCase() !== "nonaktif" &&
          isMatchingMentorFormasi(peserta.posisi, m.posisiMentor),
      ),
    [mentors, peserta.posisi],
  );

  const handleSaveMentor = async () => {
    if (!selectedMentorId) {
      showToast.error("Pilih mentor terlebih dahulu");
      return;
    }
    try {
      setSavingMentor(true);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/admin/pendaftaran/${peserta.pendaftaranId}/mentor-peserta`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: peserta.email,
            mentorId: selectedMentorId,
          }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || "Gagal menetapkan mentor");
      }
      const chosen = matchingMentors.find((m) => m._id === selectedMentorId);
      if (chosen) {
        setCurrentMentor({
          _id: chosen._id,
          name: chosen.name,
          email: chosen.email,
          posisiMentor: chosen.posisiMentor,
        });
      }
      setEditingMentor(false);
      showToast.success("Mentor peserta berhasil ditetapkan");
      onSuratSelesaiSuccess?.();
    } catch (err) {
      showToast.error(
        err instanceof Error ? err.message : "Gagal menetapkan mentor",
      );
    } finally {
      setSavingMentor(false);
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const initials =
    peserta.nama
      ?.split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "P";

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl max-h-[90vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-[#0284c7] to-blue-700 px-6 py-5 text-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-base font-extrabold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold truncate">
                  {peserta.nama}
                </h2>
                {isPkpaPeserta(peserta) && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 border border-white/30 text-white shrink-0">
                    PKPA
                  </span>
                )}
              </div>
              <p className="text-xs text-sky-100 truncate">
                {peserta.email} • {peserta.posisi || "-"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail peserta"
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-1.5 shrink-0">
          {(
            [
              { key: "profil", label: "Profil Peserta" },
              { key: "logbook", label: "Logbook" },
              { key: "laporan", label: "Laporan Akhir" },
              { key: "suratSelesai", label: "Surat Selesai Magang" },
              { key: "sertifikat", label: "Sertifikat Magang" },
            ] as { key: TabKey; label: string }[]
          ).map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                  active
                    ? "bg-[#0284c7] text-white shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto">
          {activeTab === "profil" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <InfoItem
                icon={<User className="w-4 h-4" />}
                label="Nama Lengkap"
                value={peserta.nama}
              />
              <InfoItem
                icon={<Mail className="w-4 h-4" />}
                label="Email"
                value={peserta.email}
              />
              <InfoItem
                icon={<Phone className="w-4 h-4" />}
                label="WhatsApp"
                value={peserta.wa}
              />
              <InfoItem
                icon={<Briefcase className="w-4 h-4" />}
                label="Posisi / Formasi"
                value={peserta.posisi}
              />
              <InfoItem
                icon={<GraduationCap className="w-4 h-4" />}
                label="Jurusan"
                value={peserta.jurusan || "-"}
              />
              <InfoItem
                icon={<ShieldCheck className="w-4 h-4" />}
                label="Status Akun"
                value={
                  peserta.isTerdaftar ? "Sudah Memiliki Akun" : "Belum Ada Akun"
                }
              />
              <div className="sm:col-span-2">
                <InfoItem
                  icon={<Calendar className="w-4 h-4" />}
                  label="Periode Magang"
                  value={`${peserta.tanggalMulaiMagang || "-"} s/d ${peserta.tanggalSelesaiMagang || "-"}`}
                />
              </div>

              <div className="sm:col-span-2 p-4 rounded-2xl border border-sky-200 dark:border-sky-800/70 bg-sky-50/70 dark:bg-sky-950/30 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#0284c7] text-white flex items-center justify-center shrink-0">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#0284c7] dark:text-sky-300">
                        Mentor Pembimbing
                      </p>
                      {currentMentor ? (
                        <>
                          <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                            {currentMentor.name}
                          </p>
                          {currentMentor.email && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {currentMentor.email}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                          Belum ditetapkan
                        </p>
                      )}
                    </div>
                  </div>

                  {!editingMentor && (
                    <button
                      type="button"
                      onClick={() => {
                        const isMatch =
                          currentMentor?._id &&
                          matchingMentors.some(
                            (m) => m._id === currentMentor._id,
                          );
                        setSelectedMentorId(isMatch ? currentMentor!._id! : "");
                        setEditingMentor(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white shadow-xs transition shrink-0"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      {currentMentor ? "Ubah Mentor" : "Tetapkan Mentor"}
                    </button>
                  )}
                </div>

                {editingMentor && (
                  <div className="pt-2 border-t border-sky-200/70 dark:border-sky-800/60 space-y-2.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Pilih Mentor (Formasi: {peserta.posisi || "-"})
                    </label>
                    <select
                      value={selectedMentorId}
                      onChange={(e) => setSelectedMentorId(e.target.value)}
                      disabled={matchingMentors.length === 0}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7] disabled:opacity-60"
                    >
                      <option value="">
                        {matchingMentors.length === 0
                          ? "-- Tidak ada mentor untuk formasi ini --"
                          : "-- Pilih Mentor --"}
                      </option>
                      {matchingMentors.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name}
                          {m.posisiMentor ? ` — ${m.posisiMentor}` : ""}
                        </option>
                      ))}
                    </select>
                    {matchingMentors.length === 0 && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400">
                        Belum ada mentor aktif yang terdaftar untuk formasi{" "}
                        <b>{peserta.posisi || "-"}</b>.
                      </p>
                    )}
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingMentor(false)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        disabled={savingMentor || matchingMentors.length === 0}
                        onClick={handleSaveMentor}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white shadow-xs transition disabled:opacity-60"
                      >
                        {savingMentor ? "Menyimpan..." : "Simpan Mentor"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "logbook" && (
            <div className="flex flex-col items-center justify-center text-center py-10">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#0284c7] to-blue-700 text-white flex items-center justify-center shadow-md mb-4">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                Logbook Aktivitas Peserta
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
                Tinjau catatan kegiatan harian peserta selama periode magang
                berlangsung.
              </p>
              <button
                type="button"
                onClick={() => onViewLogbook(peserta.email)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0284c7] hover:bg-sky-700 text-white text-sm font-semibold shadow-sm transition"
              >
                <BookOpen className="w-4 h-4" />
                Buka Logbook Peserta
              </button>
            </div>
          )}

          {activeTab === "laporan" && (
            <div className="flex flex-col items-center justify-center text-center py-10">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#0284c7] to-blue-700 text-white flex items-center justify-center shadow-md mb-4">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                Laporan Akhir Magang
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
                Periksa dokumen laporan akhir yang telah diunggah oleh peserta.
              </p>
              <button
                type="button"
                onClick={() => onViewLaporanAkhir(peserta.email)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0284c7] hover:bg-sky-700 text-white text-sm font-semibold shadow-sm transition"
              >
                <FileText className="w-4 h-4" />
                Buka Laporan Akhir
              </button>
            </div>
          )}

          {activeTab === "suratSelesai" && (
            <SuratSelesaiUpload
              peserta={peserta}
              onSuccess={() => {
                onSuratSelesaiSuccess?.();
              }}
            />
          )}

          {activeTab === "sertifikat" && (
            <SertifikatUpload
              peserta={peserta}
              onSuccess={() => {
                onSuratSelesaiSuccess?.();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
        <span className="text-[#0284c7] dark:text-sky-400">{icon}</span>
        <span>{label}</span>
      </div>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 break-words">
        {value || "-"}
      </p>
    </div>
  );
}
