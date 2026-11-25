"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  HardDrive,
  Image as ImageIcon,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { TablePageSkeleton } from "@/components/dashboard/skeletons";
import { showToast } from "@/components/ui/toastDashboard";

/* ================= TYPES ================= */

export interface GalleryItemData {
  _id: string;
  title: string;
  fileName: string | null;
  originalName: string;
  fileSize: number;
  imageUrl: string;
  defaultPath: string | null;
  isCustomFile: boolean;
  order: number;
  isActive: boolean;
  updatedBy?: {
    name?: string;
    email?: string;
  } | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface CompressionResult {
  file: File;
  previewUrl: string;
  originalBytes: number;
  compressedBytes: number;
  width: number;
  height: number;
  savedPercent: number;
}

type StatusFilter = "all" | "active" | "inactive";

/* ================= CONSTANTS & HELPERS ================= */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const TARGET_MAX_BYTES = 120 * 1024; // Target kompresi <= 120 KB agar ringan di website
const MAX_DIMENSION_PX = 1280; // Resolusi maksimal 1280px (tajam & hemat ukuran)

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
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

export function resolveGalleryImageSrc(item: {
  imageUrl?: string | null;
  defaultPath?: string | null;
}): string {
  const raw = item.imageUrl || item.defaultPath || "";
  if (!raw) return "/images/assets-new/galery/1.jpg";
  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("blob:")
  ) {
    return raw;
  }
  if (raw.startsWith("/uploads/")) {
    return `${API_BASE}${raw}`;
  }
  return raw;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Gagal mengompresi gambar"));
      },
      mimeType,
      quality,
    );
  });
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Gagal membaca file gambar"));
    };
    img.src = objectUrl;
  });
}

/**
 * Kompresi otomatis bertingkat di sisi browser menjadi WebP/JPEG <= 120 KB
 * agar loading section Gallery di Landing Page sangat ringan & cepat.
 */
async function compressGalleryImageFile(
  sourceFile: File,
  maxBytes = TARGET_MAX_BYTES,
): Promise<CompressionResult> {
  const img = await loadImageElement(sourceFile);
  const srcW = img.naturalWidth || img.width || 800;
  const srcH = img.naturalHeight || img.height || 600;

  let targetW = srcW;
  let targetH = srcH;
  if (targetW > MAX_DIMENSION_PX || targetH > MAX_DIMENSION_PX) {
    const ratio = Math.min(MAX_DIMENSION_PX / targetW, MAX_DIMENSION_PX / targetH);
    targetW = Math.max(320, Math.round(targetW * ratio));
    targetH = Math.max(240, Math.round(targetH * ratio));
  }

  let workingCanvas = document.createElement("canvas");
  workingCanvas.width = targetW;
  workingCanvas.height = targetH;
  const ctx = workingCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Browser tidak mendukung pemrosesan kanvas gambar");
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, targetW, targetH);

  // Gunakan WebP sebagai prioritas (fallback ke JPEG jika browser tidak encode WebP)
  const testWebp = await canvasToBlob(workingCanvas, "image/webp", 0.8);
  const outputMime =
    testWebp.type === "image/webp" ? "image/webp" : "image/jpeg";
  const outputExt = outputMime === "image/webp" ? ".webp" : ".jpg";

  const qualities = [0.82, 0.74, 0.66, 0.58, 0.5, 0.42, 0.34, 0.28];
  let bestBlob: Blob = testWebp;

  for (let pass = 0; pass < 3; pass++) {
    for (const q of qualities) {
      const blob = await canvasToBlob(workingCanvas, outputMime, q);
      bestBlob = blob;
      if (blob.size <= maxBytes) {
        const baseName =
          sourceFile.name.replace(/\.[^/.]+$/, "").trim() || "galeri";
        const compressedFile = new File([blob], `${baseName}${outputExt}`, {
          type: outputMime,
          lastModified: Date.now(),
        });
        const savedPercent =
          sourceFile.size > blob.size
            ? Math.round(((sourceFile.size - blob.size) / sourceFile.size) * 100)
            : 0;
        return {
          file: compressedFile,
          previewUrl: URL.createObjectURL(compressedFile),
          originalBytes: sourceFile.size,
          compressedBytes: compressedFile.size,
          width: workingCanvas.width,
          height: workingCanvas.height,
          savedPercent,
        };
      }
    }

    // Jika masih di atas batas target, perkecil dimensi 82% lalu ulangi
    const nextW = Math.max(360, Math.round(workingCanvas.width * 0.82));
    const nextH = Math.max(270, Math.round(workingCanvas.height * 0.82));
    const downCanvas = document.createElement("canvas");
    downCanvas.width = nextW;
    downCanvas.height = nextH;
    const downCtx = downCanvas.getContext("2d");
    if (!downCtx) break;
    downCtx.imageSmoothingEnabled = true;
    downCtx.imageSmoothingQuality = "high";
    downCtx.drawImage(workingCanvas, 0, 0, nextW, nextH);
    workingCanvas = downCanvas;
  }

  const baseName = sourceFile.name.replace(/\.[^/.]+$/, "").trim() || "galeri";
  const fallbackFile = new File([bestBlob], `${baseName}${outputExt}`, {
    type: outputMime,
    lastModified: Date.now(),
  });
  const savedPercent =
    sourceFile.size > fallbackFile.size
      ? Math.round(
          ((sourceFile.size - fallbackFile.size) / sourceFile.size) * 100,
        )
      : 0;

  return {
    file: fallbackFile,
    previewUrl: URL.createObjectURL(fallbackFile),
    originalBytes: sourceFile.size,
    compressedBytes: fallbackFile.size,
    width: workingCanvas.width,
    height: workingCanvas.height,
    savedPercent,
  };
}

/* ================= MAIN COMPONENT ================= */

export default function KelolaGaleriView() {
  const [items, setItems] = useState<GalleryItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Modal Form (Tambah / Edit)
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItemData | null>(null);
  const [titleInput, setTitleInput] = useState("");
  const [orderInput, setOrderInput] = useState<number>(1);
  const [isActiveInput, setIsActiveInput] = useState<boolean>(true);
  const [compressionData, setCompressionData] =
    useState<CompressionResult | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal Hapus
  const [deleteTarget, setDeleteTarget] = useState<GalleryItemData | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  // Modal Reset Default
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Lightbox Preview
  const [previewLightbox, setPreviewLightbox] =
    useState<GalleryItemData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchGalleryItems = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await fetch(`${API_BASE}/gallery`);
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Gagal memuat data galeri");
      }

      setItems(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      showToast.error(
        err instanceof Error ? err.message : "Gagal memuat data galeri",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchGalleryItems();
  }, [fetchGalleryItems]);

  useEffect(() => {
    return () => {
      if (compressionData?.previewUrl) {
        URL.revokeObjectURL(compressionData.previewUrl);
      }
    };
  }, [compressionData]);

  const clearSelectedCompression = () => {
    if (compressionData?.previewUrl) {
      URL.revokeObjectURL(compressionData.previewUrl);
    }
    setCompressionData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openCreateModal = () => {
    clearSelectedCompression();
    const maxOrder = items.reduce(
      (acc, cur) => (cur.order > acc ? cur.order : acc),
      0,
    );
    const nextOrder = maxOrder + 1;
    setEditingItem(null);
    setTitleInput(
      `Dokumentasi Kegiatan Magang SI TANJAK ${String(nextOrder).padStart(2, "0")}`,
    );
    setOrderInput(nextOrder);
    setIsActiveInput(true);
    setShowFormModal(true);
  };

  const openEditModal = (item: GalleryItemData) => {
    clearSelectedCompression();
    setEditingItem(item);
    setTitleInput(item.title);
    setOrderInput(item.order);
    setIsActiveInput(item.isActive);
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    if (saving || compressing) return;
    clearSelectedCompression();
    setShowFormModal(false);
    setEditingItem(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(rawFile.type)) {
      showToast.error("Format gambar harus PNG, JPG, atau WebP");
      e.target.value = "";
      return;
    }

    if (rawFile.size > 15 * 1024 * 1024) {
      showToast.error("Ukuran gambar mentah maksimal 15 MB");
      e.target.value = "";
      return;
    }

    try {
      setCompressing(true);
      clearSelectedCompression();
      const result = await compressGalleryImageFile(rawFile);
      setCompressionData(result);
    } catch (err) {
      showToast.error(
        err instanceof Error ? err.message : "Gagal mengompresi gambar",
      );
      e.target.value = "";
    } finally {
      setCompressing(false);
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = titleInput.trim();
    if (!trimmedTitle) {
      showToast.error("Judul dokumentasi galeri wajib diisi");
      return;
    }

    if (!editingItem && !compressionData?.file) {
      showToast.error("Pilih file gambar galeri terlebih dahulu");
      return;
    }

    const isReplacingImage = Boolean(editingItem && compressionData?.file);
    const toastId = showToast.loading(
      editingItem
        ? isReplacingImage
          ? "Mengganti gambar terkompresi & menghapus file lama..."
          : "Menyimpan perubahan data galeri..."
        : "Mengunggah gambar galeri terkompresi...",
    );

    try {
      setSaving(true);
      const token = localStorage.getItem("token") || "";
      const formData = new FormData();
      formData.append("title", trimmedTitle);
      formData.append("order", String(Math.max(1, Number(orderInput) || 1)));
      formData.append("isActive", String(isActiveInput));
      if (compressionData?.file) {
        formData.append("image", compressionData.file);
      }

      const url = editingItem
        ? `${API_BASE}/gallery/${editingItem._id}`
        : `${API_BASE}/gallery`;
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Gagal menyimpan data galeri");
      }

      clearSelectedCompression();
      setShowFormModal(false);
      setEditingItem(null);
      await fetchGalleryItems(true);
      showToast.updateSuccess(
        toastId,
        json?.message || "Data galeri berhasil disimpan",
      );
    } catch (err) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal menyimpan data galeri",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: GalleryItemData) => {
    const toastId = showToast.loading("Mengubah status tampil gambar...");
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE}/gallery/${item._id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Gagal mengubah status gambar");
      }

      await fetchGalleryItems(true);
      showToast.updateSuccess(
        toastId,
        json?.message || "Status gambar diperbarui",
      );
    } catch (err) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal mengubah status gambar",
      );
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    const toastId = showToast.loading(
      "Menghapus gambar galeri & file penyimpanan...",
    );
    try {
      setDeleting(true);
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE}/gallery/${deleteTarget._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Gagal menghapus gambar galeri");
      }

      setDeleteTarget(null);
      await fetchGalleryItems(true);
      showToast.updateSuccess(
        toastId,
        json?.message || "Gambar galeri beserta filenya berhasil dihapus",
      );
    } catch (err) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal menghapus gambar galeri",
      );
    } finally {
      setDeleting(false);
    }
  };

  const executeResetDefault = async () => {
    const toastId = showToast.loading(
      "Mengembalikan 11 foto bawaan & membersihkan file kustom lama...",
    );
    try {
      setResetting(true);
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE}/gallery/reset-default`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Gagal mereset galeri ke default");
      }

      setShowResetModal(false);
      await fetchGalleryItems(true);
      showToast.updateSuccess(
        toastId,
        json?.message || "Galeri berhasil dikembalikan ke 11 foto default",
      );
    } catch (err) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal mereset galeri ke default",
      );
    } finally {
      setResetting(false);
    }
  };

  /* ================= STATS & FILTERING ================= */

  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((i) => i.isActive).length;
    const inactive = total - active;
    const totalBytes = items.reduce((acc, cur) => acc + (cur.fileSize || 0), 0);
    return { total, active, inactive, totalBytes };
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter === "active" && !item.isActive) return false;
      if (statusFilter === "inactive" && item.isActive) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        (item.originalName && item.originalName.toLowerCase().includes(q)) ||
        String(item.order).includes(q)
      );
    });
  }, [items, searchTerm, statusFilter]);

  if (loading) {
    return (
      <TablePageSkeleton
        title="Kelola Galeri Dokumentasi Landing Page"
        subtitle="Memuat daftar foto galeri & informasi ukuran penyimpanan..."
        rowsCount={6}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Kelola Galeri Dokumentasi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tambah, ubah, ganti, atau hapus foto pada section{" "}
            <b>Galeri Dokumentasi</b> Landing Page. Setiap gambar otomatis
            dikompresi (&le;120 KB) dan file lama otomatis dihapus saat diganti.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => fetchGalleryItems(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>Segarkan</span>
          </button>

          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset 11 Foto Default</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0284c7] hover:bg-sky-700 text-white shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Gambar Galeri</span>
          </button>
        </div>
      </div>

      {/* ================= SUMMARY STATS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400 flex items-center justify-center shrink-0">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Total Foto Galeri
            </p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">
              {stats.total} Foto
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Ditampilkan (Aktif)
            </p>
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {stats.active} Foto
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
            <EyeOff className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Disembunyikan
            </p>
            <p className="text-xl font-extrabold text-slate-700 dark:text-slate-200">
              {stats.inactive} Foto
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1D64F2] dark:text-blue-400 flex items-center justify-center shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Total Penyimpanan
            </p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">
              {formatFileSize(stats.totalBytes)}
            </p>
          </div>
        </div>
      </div>

      {/* ================= FILTER & SEARCH BAR ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              { key: "all", label: `Semua (${stats.total})` },
              { key: "active", label: `Aktif (${stats.active})` },
              { key: "inactive", label: `Nonaktif (${stats.inactive})` },
            ] as { key: StatusFilter; label: string }[]
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === tab.key
                  ? "bg-[#0284c7] text-white shadow-2xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari judul atau nama file..."
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ================= GALLERY CARDS GRID ================= */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] flex items-center justify-center mx-auto">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Belum ada gambar galeri yang sesuai
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tambahkan foto dokumentasi baru atau ubah kata kunci pencarian.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const imgSrc = resolveGalleryImageSrc(item);
            return (
              <div
                key={item._id}
                className={`group rounded-2xl border bg-white dark:bg-slate-900 overflow-hidden shadow-2xs transition hover:shadow-md flex flex-col ${
                  item.isActive
                    ? "border-slate-200/90 dark:border-slate-800"
                    : "border-slate-200/60 dark:border-slate-800/60 opacity-75"
                }`}
              >
                {/* Image Thumbnail */}
                <div className="relative aspect-4/3 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img
                    src={imgSrc}
                    alt={item.title}
                    onClick={() => setPreviewLightbox(item)}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (
                        item.defaultPath &&
                        !target.src.endsWith(item.defaultPath)
                      ) {
                        target.src = item.defaultPath;
                      }
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                  />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-2 pointer-events-none">
                    <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold bg-slate-900/80 text-white backdrop-blur-xs">
                      #{String(item.order).padStart(2, "0")}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-xs ${
                        item.isActive
                          ? "bg-emerald-500/90 text-white"
                          : "bg-slate-700/90 text-slate-200"
                      }`}
                    >
                      {item.isActive ? "Aktif" : "Disembunyikan"}
                    </span>
                  </div>

                  {/* Bottom File Size Badge */}
                  <div className="absolute bottom-2.5 right-2.5 pointer-events-none">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/75 text-sky-200 backdrop-blur-xs">
                      <Zap className="w-3 h-3 text-amber-400" />
                      {formatFileSize(item.fileSize)}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                      {item.title}
                    </h3>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                      <p className="truncate">
                        File:{" "}
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {item.originalName}
                        </span>
                      </p>
                      <p className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>{formatDateTime(item.updatedAt)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-sky-50 hover:bg-sky-100 text-[#0284c7] dark:bg-sky-950/50 dark:text-sky-300 dark:hover:bg-sky-900/60 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit / Ganti</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      title={
                        item.isActive
                          ? "Sembunyikan dari Landing Page"
                          : "Tampilkan di Landing Page"
                      }
                      className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      {item.isActive ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      title="Hapus gambar & file penyimpanan"
                      className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL CREATE / EDIT ================= */}
      {showFormModal && (
        <div
          onClick={closeFormModal}
          className="fixed inset-0 z-120 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden my-8"
          >
            <div className="h-1.5 w-full bg-linear-to-r from-[#0284c7] to-blue-600" />

            <form onSubmit={handleSaveForm} className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                    {editingItem
                      ? "Edit & Ganti Gambar Galeri"
                      : "Tambah Gambar Galeri Baru"}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {editingItem
                      ? "Jika Anda mengunggah gambar pengganti, file gambar lama akan otomatis dihapus dari penyimpanan."
                      : "Gambar yang diunggah wajib dan otomatis dikompresi (≤120 KB) agar website tetap ringan."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeFormModal}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Input Judul */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Judul / Keterangan Dokumentasi
                </label>
                <input
                  type="text"
                  required
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="Contoh: Dokumentasi Kegiatan Laboratorium Pengujian"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                />
              </div>

              {/* Urutan & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                    Urutan Tampil
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={orderInput}
                    onChange={(e) =>
                      setOrderInput(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                    Status di Landing Page
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsActiveInput((p) => !p)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                      isActiveInput
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                        : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    <span>
                      {isActiveInput
                        ? "Aktif (Ditampilkan)"
                        : "Nonaktif (Disembunyikan)"}
                    </span>
                    {isActiveInput ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* File Upload + Automatic Compression */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  {editingItem
                    ? "Ganti File Gambar (Opsional — File lama otomatis terhapus)"
                    : "Pilih File Gambar (Wajib — Otomatis Dikompresi)"}
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                  onChange={handleFileChange}
                  className="hidden"
                  id="gallery-image-upload-input"
                />

                {compressing ? (
                  <div className="rounded-2xl border-2 border-dashed border-sky-300 dark:border-sky-700 bg-sky-50/50 dark:bg-sky-950/30 p-6 text-center space-y-2">
                    <Loader2 className="w-6 h-6 text-[#0284c7] animate-spin mx-auto" />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Sedang mengompresi ukuran gambar secara otomatis...
                    </p>
                  </div>
                ) : !compressionData ? (
                  <div className="space-y-2.5">
                    {editingItem && (
                      <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-2.5">
                        <img
                          src={resolveGalleryImageSrc(editingItem)}
                          alt={editingItem.title}
                          className="w-16 h-12 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">
                            Gambar Saat Ini: {editingItem.originalName}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Ukuran: {formatFileSize(editingItem.fileSize)}
                          </p>
                        </div>
                      </div>
                    )}

                    <label
                      htmlFor="gallery-image-upload-input"
                      className="block cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 hover:border-[#0284c7] p-5 text-center transition space-y-1.5"
                    >
                      <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400 flex items-center justify-center mx-auto">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {editingItem
                          ? "Klik untuk memilih gambar pengganti baru"
                          : "Klik untuk memilih foto dokumentasi"}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        PNG, JPG, atau WebP • Otomatis dikompresi ke &le;120 KB
                      </p>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {/* Compression Report Banner */}
                    <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/40 p-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200 truncate">
                            Terkompresi: {formatFileSize(compressionData.compressedBytes)}
                            {compressionData.savedPercent > 0
                              ? ` (Hemat ${compressionData.savedPercent}%)`
                              : ""}
                          </p>
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-300/90">
                            Asli: {formatFileSize(compressionData.originalBytes)}{" "}
                            • Resolusi {compressionData.width}&times;
                            {compressionData.height} px
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={clearSelectedCompression}
                        title="Ganti pilihan file"
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition cursor-pointer shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Preview Image */}
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 h-44 flex items-center justify-center">
                      <img
                        src={compressionData.previewUrl}
                        alt="Pratinjau Hasil Kompresi"
                        className="max-h-full w-auto object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={saving}
                  onClick={closeFormModal}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving || compressing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0284c7] hover:bg-sky-700 text-white shadow-xs transition disabled:opacity-60 cursor-pointer"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {editingItem ? "Simpan Perubahan" : "Unggah ke Galeri"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS ================= */}
      {deleteTarget && (
        <div
          onClick={() => !deleting && setDeleteTarget(null)}
          className="fixed inset-0 z-120 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-6 space-y-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Hapus Gambar Galeri?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Gambar <b>&ldquo;{deleteTarget.title}&rdquo;</b> akan dihapus
                  dari section Galeri beserta file fisiknya (
                  <code>{deleteTarget.fileName || deleteTarget.originalName}</code>
                  ) di penyimpanan server.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={executeDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition disabled:opacity-60 cursor-pointer"
              >
                {deleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Ya, Hapus Permanen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI RESET DEFAULT ================= */}
      {showResetModal && (
        <div
          onClick={() => !resetting && setShowResetModal(false)}
          className="fixed inset-0 z-120 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-6 space-y-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Kembalikan ke 11 Foto Default?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Seluruh file gambar kustom yang pernah diunggah akan dihapus
                  dari penyimpanan server dan daftar galeri dikembalikan ke 11
                  foto dokumentasi bawaan.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={resetting}
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={resetting}
                onClick={executeResetDefault}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition disabled:opacity-60 cursor-pointer"
              >
                {resetting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                <span>Ya, Reset ke Default</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= LIGHTBOX PREVIEW ================= */}
      {previewLightbox && (
        <div
          onClick={() => setPreviewLightbox(null)}
          className="fixed inset-0 z-130 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-4 sm:p-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full flex flex-col items-center gap-3"
          >
            <div className="w-full flex items-center justify-between text-white">
              <div>
                <p className="text-sm font-bold">{previewLightbox.title}</p>
                <p className="text-xs text-slate-300">
                  {previewLightbox.originalName} •{" "}
                  {formatFileSize(previewLightbox.fileSize)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewLightbox(null)}
                className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full max-h-[75vh] rounded-2xl overflow-hidden bg-slate-900 border border-white/10 flex items-center justify-center p-2">
              <img
                src={resolveGalleryImageSrc(previewLightbox)}
                alt={previewLightbox.title}
                className="max-h-[70vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
