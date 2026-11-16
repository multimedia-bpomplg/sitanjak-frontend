"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  Calendar,
  GraduationCap,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  User,
  UserCheck,
  X,
} from "lucide-react";
import type { Peserta } from "@/types/peserta";

function getInitials(name = "P"): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "P"
  );
}

function formatDateId(dateStr?: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function buildWhatsAppUrl(phone?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const normalized = digits.startsWith("0")
    ? `62${digits.slice(1)}`
    : digits.startsWith("62")
      ? digits
      : `62${digits}`;
  return `https://wa.me/${normalized}`;
}

export default function PesertaDetailModal({
  open,
  onClose,
  peserta,
}: {
  open: boolean;
  onClose: () => void;
  peserta: Peserta | null;
}) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !peserta) return null;

  const waUrl = buildWhatsAppUrl(peserta.wa);
  const asalText = peserta.asal?.nama
    ? peserta.asal.jenis
      ? `${peserta.asal.jenis} • ${peserta.asal.nama}`
      : peserta.asal.nama
    : "-";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="peserta-detail-title"
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= HEADER (TEMA BIRU SIDEBAR) ================= */}
        <div className="px-5 sm:px-6 py-5 bg-linear-to-r from-[#0284c7] via-sky-600 to-blue-700 dark:from-[#0369a1] dark:to-blue-900 text-white flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-xs flex items-center justify-center text-white font-extrabold text-base sm:text-lg shrink-0 shadow-xs">
              {getInitials(peserta.nama)}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="peserta-detail-title"
                  className="text-lg sm:text-xl font-extrabold truncate"
                >
                  {peserta.nama}
                </h2>
                {peserta.kategori && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 border border-white/25 text-white capitalize">
                    {peserta.kategori}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-sky-100 truncate mt-0.5">
                {peserta.posisi}
                {peserta.jurusan ? ` • ${peserta.jurusan}` : ""}
              </p>
              {peserta.asal?.nama && (
                <p className="inline-flex items-center gap-1.5 text-xs text-sky-100/90 mt-1 truncate max-w-full">
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{peserta.asal.nama}</span>
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail peserta"
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= QUICK CONTACT BAR ================= */}
        <div className="px-5 sm:px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 shrink-0">
          {peserta.email && (
            <a
              href={`mailto:${peserta.email}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-50 text-[#0284c7] border border-sky-200 hover:bg-sky-100 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 dark:hover:bg-sky-900/60 transition"
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="truncate max-w-56">{peserta.email}</span>
            </a>
          )}

          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-900/60 transition"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Chat WhatsApp ({peserta.wa})
            </a>
          )}
        </div>

        {/* ================= BODY ================= */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          <Section
            title="Informasi Magang"
            icon={<Briefcase className="w-4 h-4 text-[#0284c7] dark:text-sky-400" />}
          >
            <Item
              label="Posisi Penempatan"
              value={peserta.posisi}
              icon={<Briefcase className="w-3.5 h-3.5" />}
            />
            <Item
              label="Jurusan / Bidang"
              value={peserta.jurusan}
              icon={<GraduationCap className="w-3.5 h-3.5" />}
            />
            <Item
              label="Asal Institusi"
              value={asalText}
              icon={<Building2 className="w-3.5 h-3.5" />}
            />
            <Item
              label="Tanggal Mulai"
              value={formatDateId(peserta.tanggalMulaiMagang)}
              icon={<Calendar className="w-3.5 h-3.5" />}
            />
            <Item
              label="Tanggal Selesai"
              value={formatDateId(peserta.tanggalSelesaiMagang)}
              icon={<Calendar className="w-3.5 h-3.5" />}
            />
            <Item
              label="Status Magang"
              value={peserta.statusMagang || "Aktif"}
              icon={<UserCheck className="w-3.5 h-3.5" />}
            />
          </Section>

          <Section
            title="Data Diri & Kontak"
            icon={<User className="w-4 h-4 text-[#0284c7] dark:text-sky-400" />}
          >
            <Item
              label="Nama Lengkap"
              value={peserta.nama}
              icon={<User className="w-3.5 h-3.5" />}
            />
            <Item
              label="Email"
              value={peserta.email}
              icon={<Mail className="w-3.5 h-3.5" />}
            />
            <Item
              label="No. WhatsApp"
              value={peserta.wa}
              icon={<Phone className="w-3.5 h-3.5" />}
            />
            <Item label="Jenis Kelamin" value={peserta.jenisKelamin} />
            <Item label="Tempat Lahir" value={peserta.tempatLahir} />
            <Item
              label="Tanggal Lahir"
              value={formatDateId(peserta.tanggalLahir)}
            />
          </Section>

          <Section
            title="Alamat Domisili"
            icon={<MapPin className="w-4 h-4 text-[#0284c7] dark:text-sky-400" />}
          >
            <Item label="Provinsi" value={peserta.provinsi} />
            <Item label="Kota / Kabupaten" value={peserta.kota} />
            <Item label="Kecamatan" value={peserta.kecamatan} />
            <Item label="Kelurahan" value={peserta.kelurahan} />
            <Item
              label="Alamat Lengkap"
              value={peserta.alamatLengkap}
              className="sm:col-span-2"
            />
          </Section>

          <Section
            title="Mentor Pembimbing"
            icon={<UserCheck className="w-4 h-4 text-[#0284c7] dark:text-sky-400" />}
          >
            {peserta.mentor ? (
              <>
                <Item label="Nama Mentor" value={peserta.mentor.name} />
                <Item label="Email Mentor" value={peserta.mentor.email} />
                <Item label="Posisi Mentor" value={peserta.mentor.posisiMentor} />
              </>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:col-span-3">
                Belum ada data mentor
              </p>
            )}
          </Section>
        </div>

        {/* ================= FOOTER ================= */}
        <div className="px-5 sm:px-6 py-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/mentor/ViewLogbook"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-50 text-[#0284c7] border border-sky-200 hover:bg-sky-100 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 transition"
            >
              Verifikasi Logbook
            </Link>
            <Link
              href="/dashboard/mentor/ViewLaporanAkhir"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 transition"
            >
              Review Laporan Akhir
            </Link>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white shadow-xs transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= SUB-COMPONENTS ================= */

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
        {icon}
        <span>{title}</span>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {children}
      </div>
    </div>
  );
}

function Item({
  label,
  value,
  icon,
  className = "",
}: {
  label: string;
  value?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-2xs ${className}`}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-start gap-1.5 wrap-break-word">
        {icon && (
          <span className="text-[#0284c7] dark:text-sky-400 mt-0.5 shrink-0">
            {icon}
          </span>
        )}
        <span className="min-w-0 break-all sm:break-normal">{value || "-"}</span>
      </p>
    </div>
  );
}
