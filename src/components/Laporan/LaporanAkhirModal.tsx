// components/Laporan/LaporanAkhirUploadModal.tsx
"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FiX, FiFile, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { showToast } from "@/components/ui/toastDashboard";

type Props = {
  onClose: (submitted?: boolean) => void;
};

export default function LaporanAkhirUploadModal({ onClose }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [agree, setAgree] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];

    // Validasi format
    if (selectedFile.type !== "application/pdf") {
      showToast.error("Hanya file PDF yang diperbolehkan");
      return;
    }

    // Validasi ukuran (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      showToast.error("Ukuran file maksimal 10MB");
      return;
    }

    setFile(selectedFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "application/pdf": [".pdf"],
      },
      maxFiles: 1,
      maxSize: 10 * 1024 * 1024,
    });

  /* ================= UPLOAD ================= */
  const handleUpload = async () => {
    if (!file || !agree) return;

    setUploading(true);
    const toastId = showToast.loading("Mengupload laporan akhir...");

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
        throw new Error(data.message || "Gagal mengupload laporan");
      }

      showToast.updateSuccess(toastId, "✅ Laporan akhir berhasil diupload!");

      setTimeout(() => {
        onClose(true);
      }, 1500);
    } catch (error: any) {
      showToast.updateError(
        toastId,
        error.message || "Terjadi kesalahan saat mengupload",
      );
    } finally {
      setUploading(false);
    }
  };

  /* ================= REMOVE FILE ================= */
  const removeFile = () => {
    setFile(null);
  };

  /* ================= FORMAT FILE SIZE ================= */
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-6">
      <div
        className="
          w-full max-w-2xl
          rounded-3xl
          bg-white dark:bg-slate-900
          shadow-2xl
          flex flex-col
          max-h-[90vh]
          overflow-hidden
        "
      >
        {/* HEADER */}
        <div
          className="
            px-5 sm:px-6 py-4
            border-b border-slate-200 dark:border-slate-800
            bg-linear-to-r
            from-[#FCA5A5] via-[#FDE68A] to-[#FFF7ED]
            dark:from-indigo-800 dark:via-indigo-700 dark:to-indigo-900
            flex items-start justify-between
          "
        >
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
              📤 Upload Laporan Akhir
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Upload file PDF laporan akhir magang Anda
            </p>
          </div>

          <button
            onClick={() => onClose()}
            className="p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-6 space-y-6">
          {/* INFO FINAL */}
          <div className="rounded-xl bg-amber-50 border border-amber-300 p-4 text-sm text-amber-700 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-200">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="text-xl shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Perhatian!</p>
                <p className="text-xs mt-1">
                  Laporan akhir hanya dapat diupload <b>satu kali</b> dan
                  bersifat final. Pastikan file PDF sudah benar dan lengkap
                  sebelum mengupload.
                </p>
              </div>
            </div>
          </div>

          {/* DROPZONE */}
          {!file ? (
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-2xl p-8
                flex flex-col items-center justify-center
                text-center cursor-pointer
                transition-all
                min-h-[200px]
                ${
                  isDragActive
                    ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                    : isDragReject
                      ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                      : "border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600"
                }
              `}
            >
              <input {...getInputProps()} />

              <div className="text-5xl mb-4">{isDragActive ? "📂" : "📎"}</div>

              <p className="text-base font-semibold text-slate-700 dark:text-slate-200">
                {isDragActive
                  ? "Lepaskan file di sini..."
                  : "Klik atau drag & drop file PDF"}
              </p>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Hanya file PDF • Maksimal 10MB
              </p>
            </div>
          ) : (
            /* FILE PREVIEW */
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-5">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-800 rounded-xl">
                  <FiFile className="text-2xl text-emerald-600 dark:text-emerald-300" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {formatFileSize(file.size)} • PDF
                  </p>
                </div>

                <button
                  onClick={removeFile}
                  className="p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition"
                >
                  <FiX />
                </button>
              </div>
            </div>
          )}

          {/* AGREEMENT */}
          {file && (
            <button
              type="button"
              onClick={() => setAgree(!agree)}
              className={`
                w-full flex items-start gap-3
                rounded-2xl border
                px-4 py-4 text-sm
                transition
                ${
                  agree
                    ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                    : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                }
              `}
            >
              <span
                className={`
                  mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center
                  ${
                    agree
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-400"
                  }
                `}
              >
                {agree && <FiCheckCircle className="w-4 h-4" />}
              </span>

              <span className="text-left text-slate-700 dark:text-slate-200">
                Saya menyatakan bahwa laporan akhir yang diupload adalah{" "}
                <b>benar</b>,<b> asli</b>, dan saya bertanggung jawab penuh atas
                isinya.
              </span>
            </button>
          )}
        </div>

        {/* FOOTER */}
        <div
          className="
            px-4 sm:px-6 py-4
            border-t border-slate-200 dark:border-slate-800
            bg-slate-50 dark:bg-slate-900
            flex flex-col-reverse sm:flex-row
            sm:items-center sm:justify-end
            gap-3
          "
        >
          <button
            onClick={() => onClose()}
            className="
              w-full sm:w-auto
              px-5 py-2.5
              rounded-full
              text-sm font-semibold
              text-red-600 dark:text-red-400
              border border-red-400 dark:border-red-500
              bg-transparent
              hover:bg-red-50 dark:hover:bg-red-900/30
              transition
            "
          >
            Batal
          </button>

          <button
            onClick={handleUpload}
            disabled={!file || !agree || uploading}
            className={`
              w-full sm:w-auto
              px-6 py-2.5
              rounded-full
              text-sm font-semibold text-white
              transition-all
              ${
                !file || !agree || uploading
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg"
              }
            `}
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Mengupload...
              </span>
            ) : (
              "🚀 Upload Laporan Akhir"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
