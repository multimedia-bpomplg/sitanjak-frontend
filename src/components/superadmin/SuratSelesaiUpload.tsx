"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileCheck2,
  FileText,
  Loader2,
  Send,
  Trash2,
  Upload,
} from "lucide-react";
import { showToast } from "@/components/ui/toastDashboard";

type Props = {
  peserta: {
    nama: string;
    email: string;
    posisi?: string;
    tanggalMulaiMagang?: string;
    tanggalSelesaiMagang?: string;
  };
  onSuccess?: () => void;
};

export default function SuratSelesaiUpload({ peserta, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [checking, setChecking] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isAlreadySent, setIsAlreadySent] = useState(false);
  const [existingFile, setExistingFile] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const checkExistingSurat = async () => {
      if (!peserta?.email) {
        if (active) setChecking(false);
        return;
      }

      setChecking(true);
      try {
        const token = localStorage.getItem("token") || "";
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/surat-selesai/cek?email=${encodeURIComponent(peserta.email)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!res.ok) {
          if (active) {
            setIsAlreadySent(false);
            setExistingFile(null);
          }
          return;
        }

        const data = await res.json().catch(() => null);
        if (active) {
          if (data?.file) {
            setIsAlreadySent(true);
            setExistingFile(data.file);
          } else {
            setIsAlreadySent(false);
            setExistingFile(null);
          }
        }
      } catch {
        if (active) setIsAlreadySent(false);
      } finally {
        if (active) setChecking(false);
      }
    };

    checkExistingSurat();
    return () => {
      active = false;
    };
  }, [peserta?.email]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showConfirm && !uploading) {
        setShowConfirm(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showConfirm, uploading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }

    if (selectedFile.type !== "application/pdf") {
      setError("Hanya file berformat PDF yang diperbolehkan");
      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("Ukuran file PDF maksimal 5 MB");
      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Pilih file PDF terlebih dahulu");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("email", peserta.email);

    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/surat-selesai`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Gagal mengirim surat selesai magang");
      }

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(null);
      setPreviewUrl(null);
      setIsAlreadySent(true);
      if (data?.file) {
        setExistingFile(data.file);
      }

      showToast.success("Surat selesai magang berhasil dikirim ke peserta");
      onSuccess?.();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Gagal mengirim surat selesai";
      setError(msg);
      showToast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const clearSelectedFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center py-12 text-xs sm:text-sm text-slate-500 gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-[#0284c7]" />
        <span>Memeriksa status surat selesai magang...</span>
      </div>
    );
  }

  if (isAlreadySent) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Surat Selesai Magang Sudah Dikirim
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md">
            Surat keterangan selesai magang untuk{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {peserta.nama}
            </span>{" "}
            sudah pernah dikirimkan dan diterima peserta.
          </p>
        </div>

        {existingFile && (
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${existingFile}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0284c7] hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            Unduh Surat Selesai PDF
          </a>
        )}
      </div>
    );
  }

  const periodeText =
    peserta.tanggalMulaiMagang || peserta.tanggalSelesaiMagang
      ? `${peserta.tanggalMulaiMagang || "-"} s/d ${peserta.tanggalSelesaiMagang || "-"}`
      : "-";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400 flex items-center justify-center shrink-0">
          <FileCheck2 className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Kirim Surat Selesai Magang (PDF)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            Unggah surat keterangan selesai magang untuk{" "}
            <strong className="text-slate-700 dark:text-slate-200">
              {peserta.nama}
            </strong>
            . Surat hanya dapat dikirim 1 kali dan langsung diterima peserta.
          </p>
        </div>
      </div>

      {/* Ringkasan Penerima (Grid 2 kolom agar email & posisi tidak bertabrakan) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { label: "Nama Peserta", value: peserta.nama || "-" },
          { label: "Email Penerima", value: peserta.email || "-" },
          { label: "Posisi / Fungsi", value: peserta.posisi || "-" },
          { label: "Periode Magang", value: periodeText },
        ].map((item) => (
          <div
            key={item.label}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 min-w-0 overflow-hidden"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {item.label}
            </p>
            <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5 break-words wrap-anywhere">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Area */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        className="hidden"
        id="suratSelesaiUpload"
      />

      {!file ? (
        <label
          htmlFor="suratSelesaiUpload"
          className="block cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 hover:border-[#0284c7] p-6 text-center transition space-y-2"
        >
          <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400 flex items-center justify-center mx-auto">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
            Klik untuk memilih file Surat Selesai PDF
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Format wajib PDF, ukuran maksimal 5 MB
          </p>
        </label>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-sky-200 dark:border-sky-800/70 bg-sky-50/60 dark:bg-sky-950/30 p-3.5 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#0284c7] text-white flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                  {file.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • Siap dikirim
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={clearSelectedFile}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 transition shrink-0 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus
            </button>
          </div>

          {previewUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-60 bg-slate-100 dark:bg-slate-900">
              <iframe
                src={previewUrl}
                title="Pratinjau Surat Selesai PDF"
                className="w-full h-full border-0"
              />
            </div>
          )}
        </div>
      )}

      {/* Peringatan & Tombol Kirim */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <p className="inline-flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-300 font-medium">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Pengiriman hanya berlaku 1 kali. Pastikan dokumen benar.</span>
        </p>

        <button
          type="button"
          disabled={!file || uploading}
          onClick={() => setShowConfirm(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0284c7] hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold shadow-sm transition cursor-pointer shrink-0"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>
            {uploading ? "Mengirim..." : "Kirim Surat Selesai Magang"}
          </span>
        </button>
      </div>

      {/* Modal Konfirmasi Pengiriman */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-4"
          onClick={() => !uploading && setShowConfirm(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Konfirmasi Pengiriman Surat
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Surat selesai magang hanya dapat dikirim{" "}
                  <strong>satu kali</strong> kepada{" "}
                  <strong>{peserta.nama}</strong>. Pastikan file PDF sudah
                  benar sebelum melanjutkan.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={uploading}
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={uploading}
                onClick={() => {
                  setShowConfirm(false);
                  void handleUpload();
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#0284c7] hover:bg-sky-700 text-white shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                Ya, Kirim Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
