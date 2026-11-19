"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { FormPageSkeleton } from "@/components/dashboard/skeletons";
import { showToast } from "@/components/ui/toastDashboard";

interface HeroSettingData {
  isCustom: boolean;
  fileName: string | null;
  originalName: string;
  fileSize: number;
  imageUrl: string | null;
  defaultPath: string;
  updatedBy?: {
    name?: string;
    email?: string;
  } | null;
  updatedAt?: string | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const DEFAULT_HERO_IMAGE = "/images/assets-new/orang_landingpage.png";

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "-";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDateTime(iso?: string | null): string {
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

export default function KelolaHeroImageView() {
  const [setting, setSetting] = useState<HeroSettingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSetting = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await fetch(`${API_BASE}/hero-setting`);
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(
          json?.message || "Gagal memuat pengaturan gambar hero",
        );
      }

      setSetting(json.data);
    } catch (err) {
      showToast.error(
        err instanceof Error
          ? err.message
          : "Gagal memuat pengaturan gambar hero",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSetting();
  }, [fetchSetting]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showResetModal && !resetting) {
        setShowResetModal(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showResetModal, resetting]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      showToast.error("Format gambar harus PNG, JPG, atau WebP");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast.error("Ukuran gambar hero maksimal 5 MB");
      e.target.value = "";
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearSelectedFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showToast.error("Pilih file gambar terlebih dahulu");
      return;
    }

    const toastId = showToast.loading("Mengunggah gambar hero landing page...");
    try {
      setUploading(true);
      const token = localStorage.getItem("token") || "";
      const formData = new FormData();
      formData.append("image", selectedFile);

      const res = await fetch(`${API_BASE}/hero-setting`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Gagal mengunggah gambar hero");
      }

      clearSelectedFile();
      await fetchSetting(true);
      showToast.updateSuccess(
        toastId,
        json?.message || "Gambar hero landing page berhasil diperbarui",
      );
    } catch (err) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal mengunggah gambar hero",
      );
    } finally {
      setUploading(false);
    }
  };

  const executeReset = async () => {
    const toastId = showToast.loading(
      "Mengembalikan gambar hero ke default...",
    );
    try {
      setResetting(true);
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE}/hero-setting`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(
          json?.message || "Gagal mengembalikan gambar hero ke default",
        );
      }

      setShowResetModal(false);
      await fetchSetting(true);
      showToast.updateSuccess(
        toastId,
        json?.message || "Gambar hero dikembalikan ke default",
      );
    } catch (err) {
      showToast.updateError(
        toastId,
        err instanceof Error
          ? err.message
          : "Gagal mengembalikan gambar hero ke default",
      );
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <FormPageSkeleton
        title="Kelola Gambar Hero Landing"
        subtitle="Memuat pengaturan gambar section hero..."
        fieldsCount={4}
      />
    );
  }

  const activeImageSrc =
    setting?.isCustom && setting?.imageUrl
      ? `${API_BASE}${setting.imageUrl}`
      : DEFAULT_HERO_IMAGE;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Kelola Gambar Hero Landing Page
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Atur gambar utama yang tampil pada section Hero halaman depan (secara
            default menggunakan <code>orang_landingpage.png</code>).
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchSetting(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-60 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
          />
          <span>Segarkan</span>
        </button>
      </div>

      {/* CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT CARD: GAMBAR HERO AKTIF */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <div className="h-1.5 w-full bg-linear-to-r from-[#0284c7] to-blue-600" />
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    Gambar Hero Aktif Saat Ini
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pratinjau langsung tampilan pada Landing Page
                  </p>
                </div>
              </div>

              {setting?.isCustom ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Gambar Kustom Aktif
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-[#1D64F2] border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
                  <Sparkles className="w-3.5 h-3.5" />
                  Default (orang_landingpage.png)
                </span>
              )}
            </div>

            {/* Preview Frame */}
            <div className="rounded-2xl bg-linear-to-br from-[#D6EEFF] via-[#E3F3FF] to-[#CBE8FF] border border-sky-200/80 dark:border-slate-700 p-6 pb-0 flex items-end justify-center min-h-[300px] overflow-hidden">
              <img
                src={activeImageSrc}
                alt="Gambar Hero Landing Page Aktif"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.endsWith(DEFAULT_HERO_IMAGE)) {
                    target.src = DEFAULT_HERO_IMAGE;
                  }
                }}
                className="max-h-72 w-auto object-contain object-bottom drop-shadow-[0_16px_28px_rgba(11,27,61,0.14)]"
              />
            </div>

            {/* Metadata + Reset Button */}
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400">
                  Nama File:
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-[220px]">
                  {setting?.isCustom
                    ? setting.originalName
                    : "orang_landingpage.png (Bawaan)"}
                </span>
              </div>

              {setting?.isCustom && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 dark:text-slate-400">
                      Ukuran File:
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {formatFileSize(setting.fileSize)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      Diperbarui:
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {formatDateTime(setting.updatedAt)}
                      {setting.updatedBy?.name
                        ? ` (${setting.updatedBy.name})`
                        : ""}
                    </span>
                  </div>
                </>
              )}
            </div>

            {setting?.isCustom && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Kembalikan ke Default (orang_landingpage.png)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT CARD: UNGGAH GAMBAR HERO BARU */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <div className="h-1.5 w-full bg-linear-to-r from-emerald-500 to-teal-500" />
          <div className="p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                {setting?.isCustom
                  ? "Ganti Gambar Hero Landing Page"
                  : "Unggah Gambar Hero Kustom"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Disarankan menggunakan gambar berformat <b>PNG</b> transparan
                dengan rasio vertikal/potret (±650×740 px) agar menyatu rapi
                dengan latar hero.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
              onChange={handleFileChange}
              className="hidden"
              id="hero-image-upload-input"
            />

            {!selectedFile ? (
              <label
                htmlFor="hero-image-upload-input"
                className="block cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 hover:border-[#0284c7] p-8 text-center transition space-y-2"
              >
                <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                  Klik untuk memilih gambar hero baru
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Format PNG, JPG, atau WebP • Maksimal ukuran 5 MB
                </p>
              </label>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-sky-200 dark:border-sky-800/70 bg-sky-50/60 dark:bg-sky-950/30 p-3 min-w-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#0284c7] text-white flex items-center justify-center shrink-0">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {formatFileSize(selectedFile.size)} • Siap diunggah
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelectedFile}
                    aria-label="Batalkan pilihan gambar"
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {previewUrl && (
                  <div className="rounded-2xl bg-linear-to-br from-[#D6EEFF] via-[#E3F3FF] to-[#CBE8FF] border border-sky-200/80 dark:border-slate-700 p-5 pb-0 flex items-end justify-center min-h-[240px] overflow-hidden">
                    <img
                      src={previewUrl}
                      alt="Pratinjau Gambar Hero Baru"
                      className="max-h-60 w-auto object-contain object-bottom drop-shadow-[0_16px_28px_rgba(11,27,61,0.14)]"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              {selectedFile && (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={clearSelectedFile}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
              )}
              <button
                type="button"
                disabled={!selectedFile || uploading}
                onClick={handleUpload}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-[#0284c7] to-blue-700 hover:from-[#0369a1] hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>
                  {uploading ? "Mengunggah..." : "Simpan Gambar Hero"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RESET CONFIRMATION MODAL */}
      {showResetModal && (
        <div
          className="fixed inset-0 z-60 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => !resetting && setShowResetModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Kembalikan Gambar Hero ke Default?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Gambar hero kustom akan dihapus dari server dan landing page
                  akan kembali menggunakan gambar bawaan{" "}
                  <strong>orang_landingpage.png</strong>.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={resetting}
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={resetting}
                onClick={executeReset}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer disabled:opacity-60"
              >
                {resetting ? "Memproses..." : "Ya, Pakai Default"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
