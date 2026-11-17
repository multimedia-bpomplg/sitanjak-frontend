"use client";

import { useState, useRef, useEffect } from "react";
import {
  Award,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { showToast } from "@/components/ui/toastDashboard";

type Props = {
  peserta: {
    nama: string;
    email: string;
  };
  onSuccess?: () => void;
};

type ExistingSertifikat = {
  file?: string;
  nomorSertifikat?: string;
  tanggalKirim?: string;
} | null;

export default function SertifikatUpload({ peserta, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [nomorSertifikat, setNomorSertifikat] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [existingData, setExistingData] = useState<ExistingSertifikat>(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    const checkExisting = async () => {
      if (!peserta?.email) {
        setChecking(false);
        return;
      }
      setChecking(true);
      try {
        const token = localStorage.getItem("token") || "";
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/sertifikat/cek?email=${encodeURIComponent(peserta.email)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!res.ok) {
          if (active) setExistingData(null);
          return;
        }
        const json = await res.json().catch(() => null);
        if (active) {
          setExistingData(json?.file ? json : null);
          if (json?.nomorSertifikat) {
            setNomorSertifikat(json.nomorSertifikat);
          }
        }
      } catch {
        if (active) setExistingData(null);
      } finally {
        if (active) setChecking(false);
      }
    };

    checkExisting();
    return () => {
      active = false;
    };
  }, [peserta?.email]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    if (selected.type !== "application/pdf") {
      setError("Hanya file berformat PDF yang diperbolehkan");
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError("Ukuran file PDF maksimal 5 MB");
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Silakan pilih file sertifikat PDF terlebih dahulu");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token") || "";
      const formData = new FormData();
      formData.append("file", file);
      formData.append("email", peserta.email);
      if (nomorSertifikat.trim()) {
        formData.append("nomorSertifikat", nomorSertifikat.trim());
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sertifikat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Gagal mengunggah sertifikat");
      }

      setExistingData(data?.data || { file: data?.file, nomorSertifikat });
      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setIsReplacing(false);
      showToast.success(data?.message || "Sertifikat magang berhasil diunggah");
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.message || "Terjadi kesalahan saat mengunggah sertifikat";
      setError(msg);
      showToast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadExisting = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/sertifikat/download?email=${encodeURIComponent(peserta.email)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Gagal mengunduh sertifikat");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Sertifikat_${(peserta.nama || "Peserta").replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showToast.error("Gagal mengunduh file sertifikat");
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center py-12 text-xs sm:text-sm text-slate-500 gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-[#0284c7]" />
        <span>Memeriksa status sertifikat magang...</span>
      </div>
    );
  }

  if (existingData?.file && !isReplacing) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Sertifikat Magang Sudah Dikirim
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md">
            Sertifikat PDF untuk <b>{peserta.nama}</b> sudah tersimpan dan siap
            diunduh peserta setelah syarat laporan &amp; survei terpenuhi.
          </p>
          {existingData.nomorSertifikat && (
            <p className="text-xs font-semibold text-sky-700 dark:text-sky-300 pt-1">
              Nomor Sertifikat: {existingData.nomorSertifikat}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleDownloadExisting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0284c7] hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            Unduh Sertifikat PDF
          </button>

          <button
            type="button"
            onClick={() => setIsReplacing(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition"
          >
            <RefreshCw className="w-4 h-4" />
            Ganti / Unggah Ulang PDF
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {isReplacing ? "Perbarui File Sertifikat Magang" : "Unggah Sertifikat Magang (PDF)"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Format wajib PDF, ukuran maksimal 5 MB.
            </p>
          </div>
        </div>

        {isReplacing && (
          <button
            type="button"
            onClick={() => {
              setIsReplacing(false);
              setFile(null);
              setPreviewUrl(null);
              setError(null);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
          >
            Batal
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Nomor Sertifikat (Opsional)
        </label>
        <input
          type="text"
          value={nomorSertifikat}
          onChange={(e) => setNomorSertifikat(e.target.value)}
          placeholder="Contoh: B-KP.04.01/BBPOM-PLG/2026/001"
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
        />
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 hover:border-[#0284c7] p-6 text-center transition space-y-2"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400 flex items-center justify-center mx-auto">
          {file ? <FileText className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
        </div>
        <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
          {file ? file.name : "Klik untuk memilih file Sertifikat PDF"}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {file
            ? `${(file.size / 1024).toFixed(1)} KB • Siap diunggah`
            : "Maksimal 5 MB (.pdf)"}
        </p>
      </div>

      {previewUrl && (
        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-56 bg-slate-100 dark:bg-slate-900">
          <iframe
            src={previewUrl}
            title="Pratinjau Sertifikat PDF"
            className="w-full h-full border-0"
          />
        </div>
      )}

      <div className="flex justify-end pt-1">
        <button
          type="button"
          disabled={!file || uploading}
          onClick={handleUpload}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0284c7] hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold shadow-sm transition"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          <span>{uploading ? "Mengunggah..." : "Kirim Sertifikat PDF"}</span>
        </button>
      </div>
    </div>
  );
}
