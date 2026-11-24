"use client";

import { useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  FileSignature,
  GraduationCap,
  RotateCcw,
  Save,
  Trash2,
  User,
  UserCheck,
  X,
} from "lucide-react";
import { showToast } from "@/components/ui/toastDashboard";
import {
  downloadEvaluasiDanPernyataanPdf,
  type EvaluasiMagangPayload,
  getEvaluasiTexts,
  RATING_LEGEND,
} from "@/lib/evaluasiPdf";
import { isPkpaPeserta } from "@/lib/pesertaKategori";

export type EvaluasiStatus = "Menunggu" | "Revisi" | "Disetujui";

export interface EvaluasiRecord extends EvaluasiMagangPayload {
  _id: string;
  status: EvaluasiStatus;
  mentorNote?: string;
  reviewedByName?: string;
  reviewedAt?: string | null;
  submittedAt?: string;
}

export interface ManageEvaluasiItem {
  userId: string | null;
  nama: string;
  email: string;
  posisi: string;
  jurusan?: string;
  kategoriMagang?: string;
  asal?: { jenis: string; nama: string } | null;
  tanggalMulaiMagang?: string;
  tanggalSelesaiMagang?: string;
  statusMagang?: string;
  mentorName?: string;
  evaluasi: EvaluasiRecord | null;
}

type Props = {
  item: ManageEvaluasiItem;
  role: "mentor" | "admin" | "superadmin";
  onClose: () => void;
  onUpdated: () => void;
};

function formatDateIndo(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getScoreLabel(score: number): string {
  return RATING_LEGEND.find((r) => r.score === score)?.label || "-";
}

function getStatusBadgeClass(status?: EvaluasiStatus): string {
  switch (status) {
    case "Disetujui":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
    case "Revisi":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800";
    default:
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
  }
}

export default function EvaluasiReviewModal({
  item,
  role,
  onClose,
  onUpdated,
}: Props) {
  const ev = item.evaluasi;
  const isAdminScope = role === "admin" || role === "superadmin";
  const isPkpa = isPkpaPeserta(item);
  const texts = getEvaluasiTexts(isPkpa);

  const [mentorNote, setMentorNote] = useState(ev?.mentorNote || "");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Admin edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editFas, setEditFas] = useState(() => ({
    nama: ev?.fasilitator?.nama || "",
    judulMateri: ev?.fasilitator?.judulMateri || "",
    skor1: ev?.fasilitator?.skor1 || 5,
    skor2: ev?.fasilitator?.skor2 || 5,
    skor3: ev?.fasilitator?.skor3 || 5,
    skor4: ev?.fasilitator?.skor4 || 5,
    skor5: ev?.fasilitator?.skor5 || 5,
    adaSaran: ev?.fasilitator?.adaSaran || ("Ya" as "Ya" | "Tidak"),
    saran: ev?.fasilitator?.saran || "",
  }));
  const [editPen, setEditPen] = useState(() => ({
    skor1: ev?.penyelenggara?.skor1 || 5,
    skor2: ev?.penyelenggara?.skor2 || 5,
    skor3: ev?.penyelenggara?.skor3 || 5,
    skor4: ev?.penyelenggara?.skor4 || 5,
    skor5: ev?.penyelenggara?.skor5 || 5,
    bermanfaat: ev?.penyelenggara?.bermanfaat || ("Ya" as "Ya" | "Tidak"),
    alasanBermanfaat: ev?.penyelenggara?.alasanBermanfaat || "",
    adaMasukan: ev?.penyelenggara?.adaMasukan || ("Ya" as "Ya" | "Tidak"),
    masukan: ev?.penyelenggara?.masukan || "",
  }));
  const [editSp, setEditSp] = useState(() => ({
    nama: ev?.suratPernyataan?.nama || "",
    nim: ev?.suratPernyataan?.nim || "",
    programPendidikan: ev?.suratPernyataan?.programPendidikan || "",
    universitas: ev?.suratPernyataan?.universitas || "",
    tanggalSurat: ev?.suratPernyataan?.tanggalSurat || "",
    ttdImage: ev?.suratPernyataan?.ttdImage || "",
  }));

  if (!ev) return null;

  const handleReview = async (targetStatus: "Disetujui" | "Revisi") => {
    if (targetStatus === "Revisi" && !mentorNote.trim()) {
      showToast.error(
        "Mohon isi catatan revisi agar peserta tahu bagian yang harus diperbaiki.",
      );
      return;
    }

    const toastId = showToast.loading(
      targetStatus === "Disetujui"
        ? "Menyetujui Evaluasi & Surat Pernyataan..."
        : "Mengirim permintaan revisi...",
    );

    try {
      setSubmittingReview(true);
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/evaluasi/${ev._id}/review`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: targetStatus,
            mentorNote: mentorNote.trim(),
          }),
        },
      );

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || "Gagal memproses penindakan");
      }

      showToast.updateSuccess(
        toastId,
        json?.message ||
          (targetStatus === "Disetujui"
            ? "Evaluasi & Surat Pernyataan disetujui"
            : "Permintaan revisi dikirim"),
      );
      onUpdated();
      onClose();
    } catch (err: unknown) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal memproses penindakan",
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAdminSaveEdit = async () => {
    if (!editFas.nama.trim()) {
      showToast.error("Nama fasilitator/pembimbing wajib diisi");
      return;
    }
    if (editFas.adaSaran === "Ya" && !editFas.saran.trim()) {
      showToast.error("Mohon isi saran fasilitator/pembimbing");
      return;
    }
    if (editPen.adaMasukan === "Ya" && !editPen.masukan.trim()) {
      showToast.error("Mohon isi masukan penyelenggara");
      return;
    }
    if (
      !editSp.nama.trim() ||
      !editSp.nim.trim() ||
      !editSp.programPendidikan.trim() ||
      !editSp.universitas.trim() ||
      !editSp.tanggalSurat.trim()
    ) {
      showToast.error("Lengkapi seluruh isian Surat Pernyataan");
      return;
    }

    const toastId = showToast.loading("Menyimpan perubahan data evaluasi...");
    try {
      setSavingEdit(true);
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/evaluasi/${ev._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fasilitator: {
              ...editFas,
              nama: editFas.nama.trim(),
              judulMateri: editFas.judulMateri.trim(),
              saran: editFas.adaSaran === "Ya" ? editFas.saran.trim() : "",
            },
            penyelenggara: {
              ...editPen,
              alasanBermanfaat: editPen.alasanBermanfaat.trim(),
              masukan: editPen.adaMasukan === "Ya" ? editPen.masukan.trim() : "",
            },
            suratPernyataan: {
              ...editSp,
              nama: editSp.nama.trim(),
              nim: editSp.nim.trim(),
              programPendidikan: editSp.programPendidikan.trim(),
              universitas: editSp.universitas.trim(),
              tanggalSurat: editSp.tanggalSurat.trim(),
            },
          }),
        },
      );

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || "Gagal memperbarui data evaluasi");
      }

      showToast.updateSuccess(
        toastId,
        json?.message || "Data evaluasi berhasil diperbarui",
      );
      onUpdated();
      onClose();
    } catch (err: unknown) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal memperbarui data",
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAdminDelete = async () => {
    const toastId = showToast.loading("Menghapus data evaluasi...");
    try {
      setDeleting(true);
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/evaluasi/${ev._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || "Gagal menghapus data evaluasi");
      }

      showToast.updateSuccess(
        toastId,
        json?.message || "Data evaluasi berhasil dihapus",
      );
      onUpdated();
      onClose();
    } catch (err: unknown) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal menghapus data",
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      await downloadEvaluasiDanPernyataanPdf(ev, {
        mulai: item.tanggalMulaiMagang,
        selesai: item.tanggalSelesaiMagang,
        submittedAt: ev.submittedAt,
        isPkpa,
      });
      showToast.success("File PDF berhasil diunduh");
    } catch {
      showToast.error("Gagal membuat file PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const fasScoresList = [
    ev.fasilitator.skor1,
    ev.fasilitator.skor2,
    ev.fasilitator.skor3,
    ev.fasilitator.skor4,
    ev.fasilitator.skor5,
  ];
  const penScoresList = [
    ev.penyelenggara.skor1,
    ev.penyelenggara.skor2,
    ev.penyelenggara.skor3,
    ev.penyelenggara.skor4,
    ev.penyelenggara.skor5,
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <FileSignature className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  Evaluasi &amp; Surat Pernyataan
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isPkpa
                      ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800"
                      : "bg-blue-50 text-[#1D64F2] border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                  }`}
                >
                  {isPkpa ? "PKPA" : "Reguler"}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(
                    ev.status,
                  )}`}
                >
                  {ev.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {item.nama} ({item.email}) •{" "}
                {item.asal?.nama || ev.suratPernyataan.universitas || "-"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={downloadingPdf}
              onClick={handleDownloadPdf}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingPdf ? "Memproses..." : "Unduh PDF"}</span>
            </button>

            {isAdminScope && (
              <button
                type="button"
                onClick={() => setIsEditing((v) => !v)}
                className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  isEditing
                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? "Mode Tinjau" : "Edit Data"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup modal"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Info Ringkas Peserta */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-[#0284c7] shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-slate-400 text-[11px]">Peserta</p>
                <p className="font-bold text-slate-900 dark:text-white truncate">
                  {item.nama}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <GraduationCap className="w-4 h-4 text-[#0284c7] shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-slate-400 text-[11px]">Unit &amp; Periode</p>
                <p className="font-bold text-slate-900 dark:text-white truncate">
                  {item.posisi}
                </p>
                <p className="text-[11px] text-slate-500">
                  {formatDateIndo(item.tanggalMulaiMagang)} –{" "}
                  {formatDateIndo(item.tanggalSelesaiMagang)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-[#0284c7] shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-slate-400 text-[11px]">Dikirim / Ditindak</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Kirim: {formatDateIndo(ev.submittedAt)}
                </p>
                {ev.reviewedAt && (
                  <p className="text-[11px] text-slate-500 truncate">
                    {ev.status} oleh {ev.reviewedByName || "Pembimbing"} (
                    {formatDateIndo(ev.reviewedAt)})
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Mobile quick action buttons */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              type="button"
              disabled={downloadingPdf}
              onClick={handleDownloadPdf}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingPdf ? "Memproses..." : "Unduh PDF"}</span>
            </button>
            {isAdminScope && (
              <button
                type="button"
                onClick={() => setIsEditing((v) => !v)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? "Mode Tinjau" : "Edit Data"}</span>
              </button>
            )}
          </div>

          {!isEditing ? (
            <>
              {/* VIEW MODE */}
              {/* A. Evaluasi Fasilitator */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <UserCheck className="w-4 h-4 text-[#1D64F2]" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    a. Evaluasi Fasilitator / Pembimbing
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
                    <span className="text-slate-400">Nama Pembimbing:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {ev.fasilitator.nama}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
                    <span className="text-slate-400">Judul Materi:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {ev.fasilitator.judulMateri || "-"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {texts.fasilitatorQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/30 px-3 py-2 text-xs"
                    >
                      <span className="text-slate-700 dark:text-slate-200">
                        <b>{idx + 1}.</b> {q}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#1D64F2] border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 font-bold shrink-0 whitespace-nowrap">
                        {fasScoresList[idx]} ({getScoreLabel(fasScoresList[idx])})
                      </span>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 px-3 py-2 text-xs space-y-1">
                  <p className="font-semibold text-slate-700 dark:text-slate-200">
                    Ada saran/masukan untuk fasilitator?{" "}
                    <span className="font-bold text-[#1D64F2]">
                      {ev.fasilitator.adaSaran}
                    </span>
                  </p>
                  {ev.fasilitator.adaSaran === "Ya" && (
                    <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line">
                      {ev.fasilitator.saran || "-"}
                    </p>
                  )}
                </div>
              </div>

              {/* B. Evaluasi Penyelenggara */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    b. Evaluasi Penyelenggara
                  </h3>
                </div>
                <div className="space-y-2">
                  {texts.penyelenggaraQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/30 px-3 py-2 text-xs"
                    >
                      <span className="text-slate-700 dark:text-slate-200">
                        <b>{idx + 1}.</b> {q}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-bold shrink-0 whitespace-nowrap">
                        {penScoresList[idx]} ({getScoreLabel(penScoresList[idx])})
                      </span>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 px-3 py-2 text-xs space-y-1.5">
                  <div>
                    <p className="text-slate-700 dark:text-slate-200">
                      Bermanfaat?{" "}
                      <b className="text-emerald-600">
                        {ev.penyelenggara.bermanfaat}
                      </b>
                    </p>
                    {ev.penyelenggara.alasanBermanfaat && (
                      <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line mt-0.5">
                        {ev.penyelenggara.alasanBermanfaat}
                      </p>
                    )}
                  </div>
                  <div className="pt-1 border-t border-slate-200/70 dark:border-slate-700/60">
                    <p className="text-slate-700 dark:text-slate-200">
                      Ada masukan penyelenggara?{" "}
                      <b className="text-emerald-600">
                        {ev.penyelenggara.adaMasukan}
                      </b>
                    </p>
                    {ev.penyelenggara.adaMasukan === "Ya" && (
                      <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line mt-0.5">
                        {ev.penyelenggara.masukan || "-"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* C. Surat Pernyataan */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <FileSignature className="w-4 h-4 text-violet-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    c. Surat Pernyataan
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
                    <span className="text-slate-400">Nama:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-100">
                      {ev.suratPernyataan.nama}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
                    <span className="text-slate-400">NIM / NISN:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-100">
                      {ev.suratPernyataan.nim}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
                    <span className="text-slate-400">Program Pendidikan:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-100">
                      {ev.suratPernyataan.programPendidikan}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
                    <span className="text-slate-400">Universitas / Sekolah:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-100">
                      {ev.suratPernyataan.universitas}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
                    <span className="text-slate-400">Tanggal Surat:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-100">
                      {formatDateIndo(ev.suratPernyataan.tanggalSurat)}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
                    <span className="text-slate-400">Tanda Tangan (PNG):</span>
                    {ev.suratPernyataan.ttdImage ? (
                      <div className="mt-1 bg-white rounded-lg border border-slate-200 p-2 inline-block">
                        <img
                          src={ev.suratPernyataan.ttdImage}
                          alt="TTD Peserta"
                          className="max-h-14 w-auto object-contain"
                        />
                      </div>
                    ) : (
                      <p className="font-medium text-slate-500 mt-0.5">
                        Belum diunggah
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ADMIN/SUPERADMIN EDIT MODE */
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/20 p-3 text-xs text-amber-800 dark:text-amber-300">
                Mode Edit Admin / Superadmin: ubah data isian lalu klik{" "}
                <b>Simpan Perubahan</b> (status persetujuan/revisi hanya dapat
                ditindak oleh Mentor pembimbing).
              </div>

              {/* Edit Fasilitator */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  a. Fasilitator / Pembimbing
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">Nama Pembimbing</label>
                    <input
                      type="text"
                      value={editFas.nama}
                      onChange={(e) =>
                        setEditFas((p) => ({ ...p, nama: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Judul Materi</label>
                    <input
                      type="text"
                      value={editFas.judulMateri}
                      onChange={(e) =>
                        setEditFas((p) => ({ ...p, judulMateri: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2 text-xs">
                  {(["skor1", "skor2", "skor3", "skor4", "skor5"] as const).map(
                    (k, idx) => (
                      <div key={k}>
                        <label className="block text-[11px] font-semibold mb-1">
                          Skor {idx + 1}
                        </label>
                        <select
                          value={editFas[k]}
                          onChange={(e) =>
                            setEditFas((p) => ({
                              ...p,
                              [k]: Number(e.target.value),
                            }))
                          }
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5"
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>
                    ),
                  )}
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Ada saran?</span>
                    {(["Ya", "Tidak"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setEditFas((p) => ({ ...p, adaSaran: opt }))
                        }
                        className={`px-3 py-1 rounded-lg font-bold border ${
                          editFas.adaSaran === opt
                            ? "bg-[#1D64F2] text-white border-[#1D64F2]"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {editFas.adaSaran === "Ya" && (
                    <textarea
                      rows={2}
                      value={editFas.saran}
                      onChange={(e) =>
                        setEditFas((p) => ({ ...p, saran: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                    />
                  )}
                </div>
              </div>

              {/* Edit Penyelenggara */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  b. Penyelenggara
                </h4>
                <div className="grid grid-cols-5 gap-2 text-xs">
                  {(["skor1", "skor2", "skor3", "skor4", "skor5"] as const).map(
                    (k, idx) => (
                      <div key={k}>
                        <label className="block text-[11px] font-semibold mb-1">
                          Skor {idx + 1}
                        </label>
                        <select
                          value={editPen[k]}
                          onChange={(e) =>
                            setEditPen((p) => ({
                              ...p,
                              [k]: Number(e.target.value),
                            }))
                          }
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5"
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>
                    ),
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Bermanfaat?</span>
                    {(["Ya", "Tidak"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setEditPen((p) => ({ ...p, bermanfaat: opt }))
                        }
                        className={`px-3 py-1 rounded-lg font-bold border ${
                          editPen.bermanfaat === opt
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Ada masukan?</span>
                    {(["Ya", "Tidak"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setEditPen((p) => ({ ...p, adaMasukan: opt }))
                        }
                        className={`px-3 py-1 rounded-lg font-bold border ${
                          editPen.adaMasukan === opt
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">
                    Penjelasan kebermanfaatan
                  </label>
                  <textarea
                    rows={2}
                    value={editPen.alasanBermanfaat}
                    onChange={(e) =>
                      setEditPen((p) => ({
                        ...p,
                        alasanBermanfaat: e.target.value,
                      }))
                    }
                    placeholder="Manfaat / alasan..."
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                  />
                </div>
                {editPen.adaMasukan === "Ya" && (
                  <div>
                    <label className="block text-[11px] font-semibold mb-1">
                      Masukan untuk penyelenggara
                    </label>
                    <textarea
                      rows={2}
                      value={editPen.masukan}
                      onChange={(e) =>
                        setEditPen((p) => ({ ...p, masukan: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Edit Surat Pernyataan */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 text-xs">
                <h4 className="font-bold uppercase tracking-wider text-slate-500">
                  c. Surat Pernyataan
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Nama</label>
                    <input
                      type="text"
                      value={editSp.nama}
                      onChange={(e) =>
                        setEditSp((p) => ({ ...p, nama: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">NIM / NISN</label>
                    <input
                      type="text"
                      value={editSp.nim}
                      onChange={(e) =>
                        setEditSp((p) => ({ ...p, nim: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">
                      Program Pendidikan
                    </label>
                    <input
                      type="text"
                      value={editSp.programPendidikan}
                      onChange={(e) =>
                        setEditSp((p) => ({
                          ...p,
                          programPendidikan: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">
                      Universitas
                    </label>
                    <input
                      type="text"
                      value={editSp.universitas}
                      onChange={(e) =>
                        setEditSp((p) => ({
                          ...p,
                          universitas: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">
                      Tanggal Surat
                    </label>
                    <input
                      type="date"
                      value={editSp.tanggalSurat}
                      onChange={(e) =>
                        setEditSp((p) => ({
                          ...p,
                          tanggalSurat: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CATATAN PENINDAKAN: Hanya Mentor yang bisa menindak; Admin melihat catatan jika ada */}
          {!isAdminScope ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 bg-slate-50/50 dark:bg-slate-800/30">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-100">
                Catatan Penindakan / Revisi{" "}
                <span className="font-normal text-slate-500">
                  (Wajib diisi bila meminta revisi ke peserta)
                </span>
              </label>
              <textarea
                rows={2}
                value={mentorNote}
                onChange={(e) => setMentorNote(e.target.value)}
                placeholder="Tuliskan catatan persetujuan atau detail bagian yang perlu direvisi peserta..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#0284c7]"
              />
            </div>
          ) : ev.mentorNote ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/70 dark:bg-slate-800/40 text-xs space-y-1">
              <p className="font-bold text-slate-700 dark:text-slate-200">
                Catatan Mentor Pembimbing:
              </p>
              <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line">
                {ev.mentorNote}
              </p>
            </div>
          ) : null}

          {confirmDelete && isAdminScope && (
            <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2 text-xs text-rose-800 dark:text-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>
                  Yakin ingin menghapus data evaluasi ini? Peserta dapat mengisi
                  kembali dari awal setelah dihapus.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleAdminDelete}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {deleting ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2.5">
          <div>
            {isAdminScope && !confirmDelete && (
              <button
                type="button"
                disabled={submittingReview || savingEdit || deleting}
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus / Reset Data</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isAdminScope ? (
              isEditing ? (
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={handleAdminSaveEdit}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#0284c7] hover:bg-sky-700 text-white shadow-2xs transition cursor-pointer disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingEdit ? "Menyimpan..." : "Simpan Perubahan"}</span>
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Persetujuan/revisi hanya dapat dilakukan oleh Mentor pembimbing.
                  </span>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              )
            ) : (
              <>
                <button
                  type="button"
                  disabled={submittingReview}
                  onClick={() => handleReview("Revisi")}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 transition cursor-pointer disabled:opacity-60"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Minta Revisi</span>
                </button>

                <button
                  type="button"
                  disabled={submittingReview}
                  onClick={() => handleReview("Disetujui")}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition cursor-pointer disabled:opacity-60"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {ev.status === "Disetujui"
                      ? "Perbarui Persetujuan"
                      : "Setujui Evaluasi"}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
