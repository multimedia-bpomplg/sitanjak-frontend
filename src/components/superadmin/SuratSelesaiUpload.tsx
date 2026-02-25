"use client";

import { useState, useRef, useEffect } from "react";
import {
  FiUpload,
  FiFile,
  FiCheckCircle,
  FiAlertCircle,
  FiDownload,
} from "react-icons/fi";

type Props = {
  peserta: any;
  onSuccess?: () => void;
};

export default function SuratSelesaiUpload({ peserta, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [checking, setChecking] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const hasCheckedRef = useRef(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Validasi tipe file PDF
    if (selectedFile.type !== "application/pdf") {
      setError("Hanya file PDF yang diperbolehkan");
      setFile(null);
      return;
    }

    // Validasi ukuran file max 5MB
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("Ukuran file maksimal 5MB");
      setFile(null);
      return;
    }

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
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/surat-selesai`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal mengirim surat");
      }

      // 🔥 LANGSUNG PINDAH KE TAMPILAN SUKSES
      setFile(null);
      setPreviewUrl(null);
      setIsAlreadySent(true);

      if (data?.file) {
        setExistingFile(data.file);
      }

      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Cek apakah surat sudah pernah dikirim
  const [isAlreadySent, setIsAlreadySent] = useState(false);
  const [existingFile, setExistingFile] = useState<string | null>(null);

  useEffect(() => {
    if (hasCheckedRef.current) return;

    const checkExistingSurat = async () => {
      setChecking(true);

      try {
        const token = localStorage.getItem("token");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/surat-selesai/cek?email=${peserta.email}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (res.status === 404) {
          setIsAlreadySent(false);
          return;
        }

        if (!res.ok) {
          setIsAlreadySent(false);
          return;
        }

        const data = await res.json();

        if (data?.file) {
          setIsAlreadySent(true);
          setExistingFile(data.file);
        } else {
          setIsAlreadySent(false);
        }

        hasCheckedRef.current = true; // 🔥 kunci supaya tidak cek ulang
      } catch {
        setIsAlreadySent(false);
      } finally {
        setChecking(false);
      }
    };

    checkExistingSurat();
  }, [peserta.email]);

  if (checking) {
    return (
      <div className="flex justify-center items-center py-12">
        <span className="text-[#92400E] dark:text-indigo-300 animate-pulse">
          Memeriksa status surat...
        </span>
      </div>
    );
  }

  if (isAlreadySent) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-indigo-900/40 flex items-center justify-center mb-4 shadow">
          <FiCheckCircle className="text-4xl text-emerald-600 dark:text-indigo-300" />
        </div>

        <h3 className="text-2xl font-bold text-[#7F1D1D] dark:text-indigo-300 mb-3">
          Surat Selesai Magang Sudah Dikirim
        </h3>

        <p className="text-amber-800 dark:text-indigo-200/80 max-w-lg mb-6">
          Surat selesai magang untuk{" "}
          <span className="font-semibold">{peserta.nama}</span> sudah pernah
          dikirim.
        </p>

        {existingFile && (
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${existingFile}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
            bg-linear-to-r from-[#7F1D1D] to-[#F59E0B]
            dark:from-indigo-600 dark:to-violet-500
            text-white font-semibold hover:shadow-lg transition"
          >
            <FiDownload />
            Download Surat
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* HEADER */}
      <div className="text-center">
        <div className="w-20 h-20 mx-auto rounded-full 
        bg-linear-to-br from-[#7F1D1D] to-[#F59E0B]
        dark:from-indigo-600 dark:to-violet-500
        flex items-center justify-center mb-4 shadow-lg">
          <FiFile className="text-3xl text-white" />
        </div>

        <h3 className="text-2xl font-bold text-[#7F1D1D] dark:text-indigo-300 mb-2">
          Kirim Surat Selesai Magang
        </h3>

       <p className="text-amber-800 dark:text-indigo-200/80 max-w-xl mx-auto">
          Upload surat keterangan selesai magang untuk{" "}
          <span className="font-semibold">{peserta.nama}</span>. Surat hanya
          dapat dikirim 1x dan akan langsung diterima oleh peserta.
        </p>
      </div>

      {/* Informasi Peserta */}
      <div className="
      border border-amber-700 dark:border-indigo-500/20 
      rounded-2xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: "Nama", value: peserta.nama },
            { label: "Email", value: peserta.email },
            { label: "Posisi", value: peserta.posisi },
            {
              label: "Periode",
              value: `${peserta.tanggalMulaiMagang} - ${peserta.tanggalSelesaiMagang}`,
            },
          ].map((item, i) => (
            <div key={i}>
              <p className="text-xs text-amber-700 dark:text-indigo-300/70">
                {item.label}
              </p>
              <p className="font-semibold text-[#7F1D1D] dark:text-indigo-200">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition
        ${
            file
              ? "border-emerald-400 dark:bg-indigo-900/30"
              : "border-amber-300 bg-amber-50/40 dark:border-indigo-500/30 dark:bg-indigo-950/30 hover:border-[#F59E0B] dark:hover:border-indigo-400"
        }`}
      >
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
            className="flex flex-col items-center cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-linear-to-br from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B] dark:from-indigo-600 dark:to-violet-500 flex items-center justify-center mb-3">
              <FiUpload className="text-2xl text-white" />
            </div>
            <p className="font-medium text-[#7F1D1D] dark:text-indigo-200">
              Klik untuk upload file PDF
            </p>
            <p className="text-xs text-amber-700 dark:text-indigo-300/70">
              Maksimal 5MB
            </p>
          </label>
        ) : (
          <div className="space-y-6">

            {/* FILE CARD */}
            <div className="
              flex flex-col sm:flex-row
              sm:items-center
              justify-between
              gap-4
              bg-amber-50 dark:bg-indigo-950/40
              border border-amber-200 dark:border-indigo-500/20
              rounded-xl
              p-4
            ">
              <div className="flex items-center gap-3 min-w-0">
                <div className="
                  w-10 h-10 shrink-0 rounded-lg
                  bg-[#7F1D1D]/10 dark:bg-indigo-600/20
                  flex items-center justify-center
                ">
                  <FiFile className="text-lg text-[#7F1D1D] dark:text-indigo-300" />
                </div>

                <div className="min-w-0">
                  <p className="font-medium text-sm text-[#7F1D1D] dark:text-indigo-200 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-indigo-300/70">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setFile(null);
                  setPreviewUrl(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="text-sm font-semibold
                  text-red-600 hover:text-red-700
                  dark:text-red-400 dark:hover:text-red-300"
              >
                Hapus
              </button>
            </div>

            {/* PREVIEW PDF */}
            {previewUrl && (
              <div>
                <p className="text-sm font-semibold mb-2 text-[#7F1D1D] dark:text-indigo-300">
                  Preview PDF
                </p>

                <div className="w-full h-75 sm:h-100 lg:h-125
                  border border-amber-200 dark:border-indigo-500/30
                  rounded-xl overflow-hidden">
                  <iframe
                    src={previewUrl}
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
          <FiAlertCircle className="text-lg shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">
          <FiCheckCircle className="text-lg shrink-0" />
          <p className="text-sm">
            ✅ Surat selesai magang berhasil dikirim ke peserta!
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!file || uploading}
          className={`w-full py-3 rounded-xl font-semibold transition
            ${
              !file || uploading
                ? "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed"
                : "bg-linear-to-r from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B] dark:from-indigo-600 dark:via-indigo-500 dark:to-violet-500 text-white hover:shadow-lg"
            }
          `}
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⚪</span>
              Mengirim...
            </span>
          ) : (
            "Kirim Surat Selesai Magang"
          )}
        </button>
      </div>

      <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
        ⚠️ Perhatian: Surat selesai magang hanya dapat dikirim SATU KALI.
        Pastikan file yang diupload sudah benar.
      </p>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="
            w-full max-w-md
            bg-white dark:bg-indigo-950
            rounded-2xl shadow-xl p-6 space-y-4
          ">
            <h3 className="text-lg font-bold text-[#7F1D1D] dark:text-indigo-300">
              Konfirmasi Pengiriman
            </h3>

            <p className="text-sm text-slate-600 dark:text-indigo-200/80">
              Surat selesai magang hanya dapat dikirim SATU KALI.
              Apakah Anda yakin ingin mengirim surat ini?
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 rounded-xl border
                  border-red-600
                  text-[#7F1D1D] dark:text-indigo-300
                  hover:bg-red-800 hover:text-white transition"
              >
                Batal
              </button>

              <button
                onClick={() => {
                  setShowConfirm(false);
                  handleUpload();
                }}
                className="flex-1 py-2 rounded-xl font-semibold
                  bg-linear-to-r from-[#7F1D1D] to-[#F59E0B]
                  dark:from-indigo-600 dark:to-violet-500
                  text-white hover:shadow-lg transition"
              >
                Ya, Kirim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
