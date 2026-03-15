// components/Laporan/LaporanAkhirUploadModal.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { FiX, FiFile, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { showToast } from "@/components/ui/toastDashboard";

type Props = {
  onClose: (submitted?: boolean) => void;
};

export default function LaporanAkhirUploadModal({ onClose }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [lampiran1, setLampiran1] = useState<File | null>(null);
  const [lampiran2, setLampiran2] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [agree, setAgree] = useState(false);

  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];

    if (!selectedFile) return;

    // Validasi format
    if (selectedFile.type !== "application/pdf") {
      showToast.error("Hanya file PDF yang diperbolehkan");
      return;
    }

    // Validasi ukuran (5MB)
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

  /* ================= CLEANUP PREVIEW ================= */
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  /* ================= REMOVE FILE ================= */
  const removeFile = () => {
    setFile(null);
    setAgree(false);
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    setPdfPreviewUrl(null);
  };

  /* ================= UPLOAD ================= */
  const handleUpload = async () => {
    if (!file) {
      showToast.error("Laporan akhir belum diupload");
      return;
    }

    if (!lampiran1 && !lampiran2) {
      showToast.error(
        "⚠ Minimal salah satu surat evaluasi harus diupload (BPOM atau TKPA)",
      );
      return;
    }

    if (!agree) {
      showToast.error("Silakan centang pernyataan terlebih dahulu");
      return;
    }

    setUploading(true);
    const toastId = showToast.loading("Mengupload laporan akhir...");

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);
      if (lampiran1) formData.append("lampiran1", lampiran1);
      if (lampiran2) formData.append("lampiran2", lampiran2);

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

  <div className="space-y-3">
    <label className="text-sm font-semibold">
      Lampiran 1 (Template Surat Pernyataan)
    </label>

    <input
      type="file"
      accept="application/pdf"
      onChange={(e) => setLampiran1(e.target.files?.[0] || null)}
      className="w-full border rounded-lg p-2"
    />

    <label className="text-sm font-semibold">
      Lampiran 2 (Template Form Penilaian)
    </label>

    <input
      type="file"
      accept="application/pdf"
      onChange={(e) => setLampiran2(e.target.files?.[0] || null)}
      className="w-full border rounded-lg p-2"
    />
  </div>;

  /* ================= FORMAT FILE SIZE ================= */
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-6">
      <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* HEADER */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-linear-to-r from-[#FCA5A5] via-[#FDE68A] to-[#FFF7ED] dark:from-indigo-800 dark:via-indigo-700 dark:to-indigo-900 flex items-start justify-between">
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
                  bersifat final.
                </p>
              </div>
            </div>
          </div>

          {/* DROPZONE / PREVIEW */}
          {!file ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-50
              ${
                isDragActive
                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                  : isDragReject
                    ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                    : "border-slate-300 dark:border-slate-700 hover:border-indigo-400"
              }`}
            >
              <input {...getInputProps()} />
              <div className="text-5xl mb-4">{isDragActive ? "📂" : "📑"}</div>
              <p className="text-base font-semibold text-slate-700 dark:text-slate-200">
                Klik atau drag & drop file PDF
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Hanya file PDF • Maksimal 5MB
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File info */}
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4">
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

              {/* Preview PDF */}
              {pdfPreviewUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <iframe
                    src={pdfPreviewUrl}
                    className="w-full h-62.5 sm:h-87.5 lg:h-100"
                    title="Preview PDF"
                  />
                </div>
              )}
            </div>
          )}

          {/* ================= SLOT EVALUASI ================= */}
            <div className="space-y-4">

              {/* HEADER INFO */}
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-700">
                <p className="font-semibold mb-1">
                  📋 Lampiran Evaluasi Magang
                </p>

                <p className="text-xs leading-relaxed">
                  Upload <b>salah satu</b> file evaluasi sesuai jenis magang Anda.
                </p>

                <ul className="list-disc pl-5 text-xs mt-2 space-y-1">
                  <li>Mahasiswa magang reguler → upload Evaluasi Magang Regular</li>
                  <li>Mahasiswa PKPA → upload Evaluasi PKPA</li>
                </ul>
              </div>


              {/* SLOT GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

  {/* ================= REGULAR ================= */}
  <label
    className={`
    group
    cursor-pointer
    rounded-2xl
    border
    p-5
    transition
    flex flex-col gap-3
    shadow-sm
    hover:shadow-md

    ${lampiran1
      ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
      : "border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700 hover:border-emerald-400"}
  `}
  >

    <div className="flex items-center gap-3">

      <div className="
      w-10 h-10
      flex items-center justify-center
      rounded-xl
      bg-slate-100
      dark:bg-slate-700
      text-lg
      ">
        📄
      </div>

      <div>
        <p className="font-semibold text-slate-800 dark:text-slate-100">
          Evaluasi Magang Regular
        </p>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Digunakan oleh peserta magang BPOM
        </p>
      </div>

    </div>

    <div className="
    border
    border-dashed
    rounded-xl
    px-4 py-3
    text-sm
    text-center
    text-slate-500
    dark:text-slate-400
    dark:border-slate-600
    group-hover:border-emerald-400
    transition
    ">

      {lampiran1 ? (
        <span className="text-emerald-600 font-semibold">
          ✓ {lampiran1.name}
        </span>
      ) : (
        "Klik untuk upload file PDF"
      )}

    </div>

    <input
      type="file"
      accept="application/pdf"
      onChange={(e) => setLampiran1(e.target.files?.[0] || null)}
      className="hidden"
    />

  </label>


  {/* ================= PKPA ================= */}
  <label
    className={`
    group
    cursor-pointer
    rounded-2xl
    border
    p-5
    transition
    flex flex-col gap-3
    shadow-sm
    hover:shadow-md

    ${lampiran2
      ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
      : "border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700 hover:border-indigo-400"}
  `}
  >

    <div className="flex items-center gap-3">

      <div className="
      w-10 h-10
      flex items-center justify-center
      rounded-xl
      bg-slate-100
      dark:bg-slate-700
      text-lg
      ">
        📑
      </div>

      <div>
        <p className="font-semibold text-slate-800 dark:text-slate-100">
          Evaluasi PKPA
        </p>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Digunakan oleh mahasiswa Program Profesi Apoteker
        </p>
      </div>

    </div>

    <div className="
    border
    border-dashed
    rounded-xl
    px-4 py-3
    text-sm
    text-center
    text-slate-500
    dark:text-slate-400
    dark:border-slate-600
    group-hover:border-indigo-400
    transition
    ">

      {lampiran2 ? (
        <span className="text-indigo-600 font-semibold">
          ✓ {lampiran2.name}
        </span>
      ) : (
        "Klik untuk upload file PDF"
      )}

    </div>

    <input
      type="file"
      accept="application/pdf"
      onChange={(e) => setLampiran2(e.target.files?.[0] || null)}
      className="hidden"
    />

  </label>

</div>


              {/* STATUS VALIDASI */}
              <div className="text-xs text-slate-500">

                {lampiran1 || lampiran2 ? (
                  <p className="text-emerald-600 font-semibold">
                    ✓ Lampiran evaluasi sudah siap
                  </p>
                ) : (
                  <p className="text-red-500 font-semibold">
                    ⚠ Upload minimal salah satu evaluasi
                  </p>
                )}

              </div>

            </div>

          {/* AGREEMENT */}
            <button
              type="button"
              onClick={() => setAgree(!agree)}
              className={`w-full flex items-start gap-3 rounded-2xl border px-4 py-4 text-sm transition
              ${
                agree
                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                  : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              }`}
            >
              <span
                className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center
                ${
                  agree
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-400"
                }`}
              >
                {agree && <FiCheckCircle className="w-4 h-4" />}
              </span>

              <span className="text-left text-slate-700 dark:text-slate-200">
                Saya menyatakan bahwa laporan akhir yang diupload adalah{" "}
                <b>benar</b> dan <b>asli</b>.
              </span>
            </button>
        </div>

        {/* FOOTER */}
        <div className="px-4 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
          <button
            onClick={() => onClose()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full text-sm font-semibold text-red-600 dark:text-red-400 border border-red-400 dark:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
          >
            Batal
          </button>

          <button
            onClick={() => setShowConfirm(true)}
            disabled={
              !file || (!lampiran1 && !lampiran2) || !agree || uploading
            }
            className={`w-full sm:w-auto px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all
            ${
              !file || (!lampiran1 && !lampiran2) || !agree || uploading
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg"
            }`}
          >
            🚀 Upload Laporan Akhir
          </button>
        </div>
      </div>

      {/* MODAL KONFIRMASI */}
      {showConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className="
              w-full max-w-md
              rounded-3xl
              border border-[#FCA5A5]/40 dark:border-indigo-500/30
              bg-linear-to-br
              from-[#FFF7ED] via-white to-[#FEF3C7]
              dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-800
              shadow-2xl
              overflow-hidden
              animate-[fadeIn_.2s_ease]
            "
          >
            {/* HEADER */}
            <div className="px-6 pt-6 text-center space-y-3">
              <div
                className="
                  mx-auto
                  w-14 h-14
                  rounded-2xl
                  flex items-center justify-center
                  text-white text-2xl
                  bg-linear-to-br
                  from-[#7F1D1D] to-[#F59E0B]
                  dark:from-indigo-600 dark:to-violet-500
                  shadow-md
                "
              >
                ⚠️
              </div>

              <h3 className="text-lg sm:text-xl font-extrabold text-[#7F1D1D] dark:text-white">
                Konfirmasi Upload
              </h3>

              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                Laporan akhir hanya dapat diupload <b>satu kali</b> dan tidak
                dapat diubah kembali.
              </p>
            </div>

            {/* WARNING BOX */}
            <div
              className="
                mx-6 mt-5
                rounded-xl
                border
                border-amber-300 dark:border-indigo-600
                bg-amber-50 dark:bg-indigo-900/30
                px-4 py-3
                text-xs
                text-amber-700 dark:text-indigo-200
                text-center
                font-semibold
              "
            >
              Pastikan file sudah benar sebelum melanjutkan
            </div>

            {/* BUTTONS */}
            <div className="px-6 py-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="
                  w-full
                  py-3
                  rounded-xl
                  font-semibold
                  text-sm
                  border
                  border-slate-300
                  dark:border-indigo-600
                  text-slate-700
                  dark:text-indigo-200
                  hover:bg-slate-100
                  dark:hover:bg-indigo-900/30
                  transition
                "
              >
                Cek Ulang
              </button>

              <button
                onClick={() => {
                  setShowConfirm(false);
                  handleUpload();
                }}
                className="
                  w-full
                  py-3
                  rounded-xl
                  font-bold
                  text-sm
                  text-white
                  shadow-md hover:shadow-xl
                  transition-all

                  bg-linear-to-r
                  from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                  hover:from-[#991B1B] hover:via-[#DC2626] hover:to-[#FBBF24]

                  dark:from-indigo-600 dark:to-violet-500
                  dark:hover:from-indigo-500 dark:hover:to-violet-400
                "
              >
                Ya, Upload Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
