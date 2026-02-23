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
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal mengirim surat");
      }

      setSuccess(true);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onSuccess?.();

      // Reset success message setelah 5 detik
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
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
        <span className="text-slate-500 dark:text-slate-400 animate-pulse">
          Memeriksa status surat...
        </span>
      </div>
    );
  }

  if (isAlreadySent) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
          <FiCheckCircle className="text-4xl text-emerald-600 dark:text-emerald-400" />
        </div>

        <h3 className="text-xl font-bold mb-2 text-center">
          Surat Selesai Magang Sudah Dikirim
        </h3>

        <p className="text-slate-600 dark:text-slate-400 text-center max-w-md mb-6">
          Surat selesai magang untuk {peserta.nama} sudah pernah dikirimkan.
          Tidak dapat mengirim ulang surat.
        </p>

        {existingFile && (
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${existingFile}`}
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-flex items-center gap-2
              px-6 py-3 rounded-xl
              bg-slate-100 dark:bg-indigo-950
              text-slate-700 dark:text-indigo-200
              font-semibold
              border border-slate-300 dark:border-indigo-500/30
              hover:bg-slate-200 dark:hover:bg-indigo-900/40
              transition
            "
          >
            <FiDownload className="text-lg" />
            Download Surat
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
          <FiFile className="text-4xl text-amber-600 dark:text-amber-400" />
        </div>

        <h3 className="text-xl font-bold mb-2">Kirim Surat Selesai Magang</h3>

        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Upload surat keterangan selesai magang untuk{" "}
          <span className="font-semibold">{peserta.nama}</span>. Surat hanya
          dapat dikirim 1x dan akan langsung diterima oleh peserta.
        </p>
      </div>

      {/* Informasi Peserta */}
      <div className="bg-slate-50 dark:bg-indigo-950/50 rounded-2xl p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Nama</p>
            <p className="font-medium">{peserta.nama}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
            <p className="font-medium">{peserta.email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Posisi</p>
            <p className="font-medium">{peserta.posisi}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Periode
            </p>
            <p className="font-medium text-sm">
              {peserta.tanggalMulaiMagang} - {peserta.tanggalSelesaiMagang}
            </p>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-2xl p-8
          transition-all
          ${
            file
              ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10"
              : "border-slate-300 dark:border-indigo-500/30 hover:border-[#F59E0B] dark:hover:border-indigo-400"
          }
        `}
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
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-indigo-900/40 flex items-center justify-center mb-3">
              <FiUpload className="text-2xl text-slate-500 dark:text-indigo-300" />
            </div>
            <p className="font-medium mb-1">Klik untuk upload file PDF</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Maksimal 5MB, hanya PDF
            </p>
          </label>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#B91C1C]/10 flex items-center justify-center">
                <FiFile className="text-lg text-[#B91C1C]" />
              </div>
              <div>
                <p className="font-medium text-sm truncate max-w-xs">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Hapus
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
          <FiAlertCircle className="text-lg flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">
          <FiCheckCircle className="text-lg flex-shrink-0" />
          <p className="text-sm">
            ✅ Surat selesai magang berhasil dikirim ke peserta!
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`
            flex-1 py-3 px-6 rounded-xl
            font-semibold
            transition
            ${
              !file || uploading
                ? "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed"
                : "bg-linear-to-r from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B] text-white hover:shadow-lg hover:-translate-y-0.5"
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
    </div>
  );
}
