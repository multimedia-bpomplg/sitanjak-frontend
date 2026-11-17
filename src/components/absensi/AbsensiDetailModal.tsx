"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Clock,
  MapPin,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ZoomIn,
  FileText,
  UserCheck,
  Navigation,
  Loader2,
} from "lucide-react";
import { showToast } from "@/components/ui/toastDashboard";
import type { AbsensiEntry, ManageAbsensiItem, ManageRole } from "./types";

interface AbsensiDetailModalProps {
  item: ManageAbsensiItem | null;
  open: boolean;
  onClose: () => void;
  apiBase: string;
  role: ManageRole;
  onKoreksiDone: () => Promise<void> | void;
}

function resolvePhotoUrl(apiBase: string, photoPath?: string): string {
  if (!photoPath) return "";
  if (/^https?:\/\//i.test(photoPath)) return photoPath;
  const normalizedBase = apiBase.replace(/\/+$/, "");
  const normalizedPath = photoPath.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedPath}`;
}

function formatDateID(dateStr: string): string {
  if (!dateStr) return "-";
  const parsed = new Date(`${dateStr}T00:00:00+07:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTimestampID(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getScoreBadgeClass(score: number): string {
  if (score >= 100) {
    return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
  }
  if (score >= 80) {
    return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
  }
  return "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800";
}

function formatDiffLabel(type: "checkIn" | "checkOut", entry: AbsensiEntry): string {
  if (entry.diffMinutes <= 0) {
    return type === "checkIn" ? "Masuk tepat waktu (<= 08:00 WIB)" : "Pulang tepat waktu (>= 16:00 WIB)";
  }
  const jam = Math.floor(entry.diffMinutes / 60);
  const menit = entry.diffMinutes % 60;
  const durasi = jam > 0 ? `${jam} jam ${menit} menit` : `${menit} menit`;
  if (type === "checkIn") {
    return `Terlambat ${durasi} setelah 08:00 WIB`;
  }
  return `Lebih awal ${durasi} sebelum 16:00 WIB`;
}

function buildOsmEmbedUrl(lat: number, lng: number): string {
  const delta = 0.0025;
  const left = (lng - delta).toFixed(6);
  const bottom = (lat - delta).toFixed(6);
  const right = (lng + delta).toFixed(6);
  const top = (lat + delta).toFixed(6);
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lng}`;
}

export default function AbsensiDetailModal({
  item,
  open,
  onClose,
  apiBase,
  role,
  onKoreksiDone,
}: AbsensiDetailModalProps) {
  const [target, setTarget] = useState<"checkIn" | "checkOut" | "both">("checkIn");
  const [koreksiNote, setKoreksiNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [zoomedPhoto, setZoomedPhoto] = useState<{ url: string; label: string } | null>(null);

  useEffect(() => {
    if (!item || !open) return;

    const inNeed = Boolean(item.checkIn && item.checkIn.score < 100);
    const outNeed = Boolean(item.checkOut && item.checkOut.score < 100);

    if (inNeed && outNeed) setTarget("both");
    else if (inNeed) setTarget("checkIn");
    else if (outNeed) setTarget("checkOut");
    else if (item.checkIn && item.checkOut) setTarget("both");
    else if (item.checkIn) setTarget("checkIn");
    else setTarget("checkOut");

    setKoreksiNote(item.koreksiNote || "");
    setZoomedPhoto(null);
  }, [item, open]);

  if (!open || !item) return null;

  const hasCheckIn = Boolean(item.checkIn);
  const hasCheckOut = Boolean(item.checkOut);
  const isIzin = item.attendanceMode === "izin";
  const isWfh = item.attendanceMode === "wfh";
  const canCorrect = role === "mentor" && !isIzin && (hasCheckIn || hasCheckOut);

  const handleSubmitKoreksi = async (e: React.FormEvent) => {
    e.preventDefault();
    const note = koreksiNote.trim();
    if (note.length < 3) {
      showToast.error("Catatan koreksi minimal 3 karakter");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/absensi/manage/${item._id}/koreksi`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          target,
          koreksiNote: note,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Gagal menyimpan koreksi nilai");
      }

      showToast.success(data.message || "Nilai absensi berhasil dikoreksi menjadi 100%");
      await onKoreksiDone();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat koreksi";
      showToast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const renderEntryCard = (type: "checkIn" | "checkOut", entry: AbsensiEntry | null) => {
    const title = type === "checkIn" ? "Check-In (Masuk)" : "Check-Out (Pulang)";
    const photoUrl = resolvePhotoUrl(apiBase, entry?.photoPath);

    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                type === "checkIn" ? "bg-sky-500" : "bg-indigo-500"
              }`}
            />
            <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100">{title}</h4>
          </div>
          {entry ? (
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getScoreBadgeClass(
                entry.score
              )}`}
            >
              Skor {entry.score}%
            </span>
          ) : (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              Belum Absen
            </span>
          )}
        </div>

        {!entry ? (
          <div className="flex-1 min-h-[240px] rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500">
            <Clock className="w-8 h-8 mb-2 opacity-60" />
            <p className="text-sm font-medium">Peserta belum melakukan {title}</p>
          </div>
        ) : (
          <>
            {/* Photo */}
            <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-200 dark:bg-slate-800 aspect-[4/3]">
              {photoUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl}
                    alt={`${title} - ${item.namaPeserta}`}
                    className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-[1.02]"
                    onClick={() => setZoomedPhoto({ url: photoUrl, label: `${title} • ${item.namaPeserta}` })}
                  />
                  <button
                    type="button"
                    onClick={() => setZoomedPhoto({ url: photoUrl, label: `${title} • ${item.namaPeserta}` })}
                    className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/75 hover:bg-slate-900 text-white text-xs font-medium backdrop-blur-sm transition"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    Perbesar
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                  Foto tidak tersedia
                </div>
              )}
            </div>

            {/* Time & Status */}
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Waktu Tercatat
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {entry.timeWIB}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Status Ketepatan</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 text-right">
                  {entry.timeStatusLabel}
                </span>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2">
                <span>{formatDiffLabel(type, entry)}</span>
                <span className="text-[11px] text-slate-400 shrink-0">
                  Percobaan: {entry.attemptCount}x
                </span>
              </div>

              {entry.keterangan && (
                <div className="text-xs rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 px-2.5 py-2 text-amber-800 dark:text-amber-200">
                  <span className="font-semibold block mb-0.5">Keterangan Peserta:</span>
                  {entry.keterangan}
                </div>
              )}
            </div>

            {/* Location & Map */}
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    entry.location.isInsideBpom
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                      : "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                  }`}
                >
                  {entry.location.isInsideBpom ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  )}
                  {entry.location.isInsideBpom ? "Di Area BBPOM" : "Di Luar Area BBPOM"}
                </span>

                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  {Math.round(entry.location.distanceMeters)} m dari kantor (±
                  {Math.round(entry.location.accuracy)} m)
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                <span>{entry.location.address || `${entry.location.lat}, ${entry.location.lng}`}</span>
              </p>

              <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 h-40 bg-slate-100 dark:bg-slate-800">
                <iframe
                  title={`Peta ${title}`}
                  src={buildOsmEmbedUrl(entry.location.lat, entry.location.lng)}
                  className="w-full h-full border-0 pointer-events-none"
                  loading="lazy"
                />
              </div>

              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span>
                  Koordinat: {entry.location.lat.toFixed(5)}, {entry.location.lng.toFixed(5)}
                </span>
                <a
                  href={`https://www.google.com/maps?q=${entry.location.lat},${entry.location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  Buka Google Maps
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-950/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-5 py-4 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {item.namaPeserta}
                </h3>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    isIzin
                      ? "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800"
                      : isWfh
                        ? "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800"
                        : "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800"
                  }`}
                >
                  {isIzin ? "Izin" : isWfh ? "WFH" : "Masuk (WFO)"}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getScoreBadgeClass(
                    item.dailyScore
                  )}`}
                >
                  Nilai Harian: {item.dailyScore}%
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatDateID(item.date)} • {item.posisi} • {item.institusi} • Pembimbing:{" "}
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {item.mentorName}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Tutup modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-5">
            {item.koreksiNote && item.koreksiBy && (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/80 dark:bg-emerald-950/30 p-3.5 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                  <p className="font-semibold">
                    Sudah Dikoreksi Manual ke 100% oleh {item.koreksiBy.name} ({item.koreksiBy.role})
                    {item.koreksiAt ? ` • ${formatTimestampID(item.koreksiAt)}` : ""}
                  </p>
                  <p className="text-emerald-800/90 dark:text-emerald-300/90">
                    Catatan: {item.koreksiNote}
                  </p>
                </div>
              </div>
            )}

            {isWfh && (
              <div className="rounded-xl border border-indigo-200 dark:border-indigo-800/70 bg-indigo-50/70 dark:bg-indigo-950/30 p-3.5 text-xs text-indigo-900 dark:text-indigo-200">
                <span className="font-semibold">Mode Kehadiran: WFH (Work From Home)</span> — Peserta tetap diwajibkan melakukan foto &amp; absen masuk/pulang seperti biasa dari lokasi kerja masing-masing.
              </div>
            )}

            {/* Konten Utama: Panel Izin ATAU Side-by-side Check-In & Check-Out */}
            {isIzin ? (
              <div className="rounded-2xl border border-violet-200 dark:border-violet-800/70 bg-violet-50/60 dark:bg-violet-950/30 p-5 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-violet-800 dark:text-violet-200">
                    <FileText className="w-5 h-5" />
                    <h4 className="font-bold text-sm">Keterangan Izin (Tanpa Absen Foto/GPS)</h4>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                    Nilai Otomatis: 100%
                  </span>
                </div>
                {item.izinSubmittedWIB && (
                  <p className="text-xs text-violet-700/80 dark:text-violet-300/80 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Diajukan pada pukul {item.izinSubmittedWIB}
                  </p>
                )}
                <div className="rounded-xl bg-white dark:bg-slate-900 border border-violet-200/80 dark:border-violet-800/60 p-3.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed">
                  {item.izinNote || "-"}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {renderEntryCard("checkIn", item.checkIn)}
                {renderEntryCard("checkOut", item.checkOut)}
              </div>
            )}

            {/* Form Koreksi Manual */}
            {canCorrect && (
              <form
                onSubmit={handleSubmitKoreksi}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      Koreksi Nilai Kehadiran Menjadi 100%
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Khusus izin terlambat, kendala teknis, atau tugas luar kantor
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {hasCheckIn && (
                    <button
                      type="button"
                      onClick={() => setTarget("checkIn")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        target === "checkIn"
                          ? "bg-sky-600 text-white border-sky-600"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      Check-In ({item.checkIn?.score}%)
                    </button>
                  )}
                  {hasCheckOut && (
                    <button
                      type="button"
                      onClick={() => setTarget("checkOut")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        target === "checkOut"
                          ? "bg-sky-600 text-white border-sky-600"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      Check-Out ({item.checkOut?.score}%)
                    </button>
                  )}
                  {hasCheckIn && hasCheckOut && (
                    <button
                      type="button"
                      onClick={() => setTarget("both")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        target === "both"
                          ? "bg-sky-600 text-white border-sky-600"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      Keduanya (Check-In &amp; Check-Out)
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Alasan / Catatan Koreksi (Wajib)
                  </label>
                  <textarea
                    rows={2}
                    value={koreksiNote}
                    onChange={(e) => setKoreksiNote(e.target.value)}
                    placeholder="Contoh: Peserta izin terlambat karena dinas luar / kendala sinyal saat absen masuk..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || koreksiNote.trim().length < 3}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    {submitting ? "Menyimpan..." : "Simpan Koreksi ke 100%"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Zoom Foto */}
      {zoomedPhoto && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setZoomedPhoto(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between text-white mb-2">
              <span className="text-sm font-semibold">{zoomedPhoto.label}</span>
              <button
                type="button"
                onClick={() => setZoomedPhoto(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoomedPhoto.url}
              alt={zoomedPhoto.label}
              className="w-full max-h-[80vh] object-contain rounded-xl bg-slate-900"
            />
          </div>
        </div>
      )}
    </>
  );
}
