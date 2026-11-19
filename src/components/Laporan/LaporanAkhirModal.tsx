// components/Laporan/LaporanAkhirModal.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  X,
  FileText,
  UploadCloud,
  Check,
  AlertCircle,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import { showToast } from "@/components/ui/toastDashboard";

type Props = {
  isPkpa?: boolean;
  onClose: (submitted?: boolean) => void;
};

export default function LaporanAkhirUploadModal({ onClose }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [agree, setAgree] = useState(false);

  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      showToast.error("Hanya file PDF yang diperbolehkan");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      showToast.error("Ukuran file maksimal 5MB");
      return;
    }

    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPdfPreviewUrl(url);
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "application/pdf": [".pdf"],
      },
      maxFiles: 1,
      maxSize: 5 * 1024 * 1024,
    });

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  const removeFile = () => {
    setFile(null);
    setAgree(false);
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    setPdfPreviewUrl(null);
  };

  const handleUpload = async () => {
    if (!file) {
      showToast.error("Laporan akhir belum diupload");
      return;
    }

    if (!agree) {
      showToast.error("Silakan centang pernyataan terlebih dahulu");
      return;
    }

    setUploading(true);
    const toastId = showToast.loading("Mengunggah laporan akhir...");

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/laporan-akhir/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal mengunggah laporan");
      }

      showToast.updateSuccess(toastId, "Laporan akhir berhasil diunggah! ✅");

      setTimeout(() => {
        onClose(true);
      }, 1200);
    } catch (error: any) {
      showToast.updateError(
        toastId,
        error.message || "Terjadi kesalahan saat mengunggah",
      );
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const canSubmit = Boolean(file) && agree && !uploading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-xs p-3 sm:p-5">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* ================= HEADER ================= */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1D64F2] dark:text-blue-400 flex items-center justify-center shrink-0">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2
                className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight"
                style={{ fontWeight: 800 }}
              >
                Unggah Laporan Akhir
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Unggah dokumen laporan akhir magang Anda dalam format PDF
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onClose()}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= BODY ================= */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5 bg-[#F8FAFC] dark:bg-slate-950/50">
          {/* INFO PERHATIAN */}
          <div className="rounded-xl bg-[#FFFBEB] dark:bg-amber-950/40 border border-[#FDE68A] dark:border-amber-800/70 p-3.5 sm:p-4 text-amber-900 dark:text-amber-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm leading-relaxed">
                <p className="font-bold" style={{ fontWeight: 700 }}>
                  Perhatian
                </p>
                <p className="text-amber-800 dark:text-amber-200/90 mt-0.5">
                  Laporan akhir hanya dapat diunggah <b>satu kali</b> dan
                  bersifat final. Pastikan dokumen sudah benar sebelum dikirim.
                </p>
              </div>
            </div>
          </div>

          {/* FILE LAPORAN AKHIR UTAMA */}
          <div className="space-y-2">
            <label
              className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200"
              style={{ fontWeight: 700 }}
            >
              Dokumen Laporan Akhir <span className="text-red-500">*</span>
            </label>

            {!file ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition bg-white dark:bg-slate-900 ${
                  isDragActive
                    ? "border-[#1D64F2] bg-blue-50/50 dark:bg-blue-950/30"
                    : isDragReject
                      ? "border-red-400 bg-red-50/50 dark:bg-red-950/20"
                      : "border-slate-300 dark:border-slate-700 hover:border-[#1D64F2] hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
                }`}
              >
                <input {...getInputProps()} />
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#1D64F2] dark:text-blue-400 flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p
                  className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200"
                  style={{ fontWeight: 700 }}
                >
                  Klik untuk memilih atau tarik file PDF ke sini
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Format wajib PDF • Ukuran maksimal 5 MB
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Selected file card */}
                <div className="rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/60 dark:bg-blue-950/30 p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#1D64F2] text-white flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate"
                        style={{ fontWeight: 700 }}
                      >
                        {file.name}
                      </p>
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatFileSize(file.size)} • Dokumen PDF Siap Diunggah
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={removeFile}
                    title="Hapus file"
                    className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* PDF Preview */}
                {pdfPreviewUrl && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white">
                    <iframe
                      src={pdfPreviewUrl}
                      className="w-full h-56 sm:h-72"
                      title="Preview Laporan Akhir PDF"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PERNYATAAN KEASLIAN */}
          {file && (
            <button
              type="button"
              onClick={() => setAgree(!agree)}
              className={`w-full flex items-start gap-3 rounded-xl border p-3.5 text-left transition ${
                agree
                  ? "border-[#1D64F2] bg-blue-50/50 dark:bg-blue-950/30"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              }`}
            >
              <span
                className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${
                  agree
                    ? "border-[#1D64F2] bg-[#1D64F2] text-white"
                    : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                }`}
              >
                {agree && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
              </span>

              <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                Saya menyatakan bahwa dokumen laporan akhir yang diunggah adalah{" "}
                <b>benar</b>, <b>lengkap</b>, dan{" "}
                <b>dapat dipertanggungjawabkan</b>.
              </span>
            </button>
          )}
        </div>

        {/* ================= FOOTER ================= */}
        <div className="px-5 sm:px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
          <button
            type="button"
            onClick={() => onClose()}
            disabled={uploading}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={!canSubmit}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#1D64F2] hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed shadow-2xs transition flex items-center justify-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>
              {uploading ? "Mengunggah..." : "Kirim Laporan Akhir"}
            </span>
          </button>
        </div>
      </div>

      {/* ================= MODAL KONFIRMASI ================= */}
      {showConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden p-5 sm:p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3
                  className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white"
                  style={{ fontWeight: 800 }}
                >
                  Konfirmasi Pengiriman
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Laporan akhir hanya dapat dikirim <b>satu kali</b> dan tidak
                  dapat diubah kembali setelah dikirim.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 px-3.5 py-2.5 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                📄 {file?.name}
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
              >
                Periksa Kembali
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowConfirm(false);
                  handleUpload();
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#1D64F2] hover:bg-blue-700 shadow-2xs transition"
              >
                Ya, Kirim Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
