"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  FileText,
  FolderOpen,
  Globe,
  GraduationCap,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserCheck,
  X,
} from "lucide-react";
import { FormPageSkeleton } from "@/components/dashboard/skeletons";
import { showToast } from "@/components/ui/toastDashboard";

/* ================= TYPES ================= */

export type PanduanTarget =
  | "pendaftaran"
  | "peserta"
  | "mentor"
  | "admin"
  | "format-laporan-reguler"
  | "format-laporan-pkpa";

type CategoryFilter = "all" | "format" | "panduan";

export interface PanduanDoc {
  target: PanduanTarget;
  title: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  fileUrl: string;
  uploadedBy?: {
    name?: string;
    email?: string;
  } | null;
  updatedAt?: string;
  createdAt?: string;
}

type PanduanMap = Record<PanduanTarget, PanduanDoc | null>;

interface KelolaPanduanViewProps {
  role?: "admin" | "superadmin";
}

interface TargetMetaItem {
  heading: string;
  subtitle: string;
  defaultTitle: string;
  badgeLabel: string;
  fallbackDesc: string;
  category: "format" | "panduan";
  accentBar: string;
  iconBg: string;
  badgeClass: string;
}

/* ================= CONSTANTS ================= */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const TARGET_META: Record<PanduanTarget, TargetMetaItem> = {
  "format-laporan-reguler": {
    heading: "Format Laporan Akhir (Reguler)",
    subtitle:
      "Template PDF laporan akhir di halaman Perkembangan Magang peserta Reguler.",
    defaultTitle: "Format Laporan Akhir Magang (Reguler)",
    badgeLabel: "FORMAT REGULER",
    fallbackDesc: "Belum ada file PDF Format Laporan Reguler yang diunggah.",
    category: "format",
    accentBar: "from-blue-500 to-cyan-500",
    iconBg: "bg-blue-50 text-[#1D64F2] dark:bg-blue-950/60 dark:text-blue-400",
    badgeClass:
      "bg-blue-50 text-[#1D64F2] border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
  },
  "format-laporan-pkpa": {
    heading: "Format Laporan Akhir (PKPA)",
    subtitle:
      "Template PDF laporan akhir di halaman Perkembangan Magang peserta PKPA.",
    defaultTitle: "Format Laporan Akhir Magang (PKPA)",
    badgeLabel: "FORMAT PKPA",
    fallbackDesc: "Belum ada file PDF Format Laporan PKPA yang diunggah.",
    category: "format",
    accentBar: "from-violet-500 to-purple-600",
    iconBg:
      "bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400",
    badgeClass:
      "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800",
  },
  pendaftaran: {
    heading: "Panduan Pendaftaran",
    subtitle:
      "Tombol Panduan Pendaftaran di Navbar, Footer, dan halaman utama publik.",
    defaultTitle: "Buku Panduan Pendaftaran Magang",
    badgeLabel: "PUBLIK",
    fallbackDesc: "Memakai tautan bawaan Google Docs sebelum PDF diunggah.",
    category: "panduan",
    accentBar: "from-purple-500 to-fuchsia-500",
    iconBg:
      "bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400",
    badgeClass:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
  },
  peserta: {
    heading: "Panduan Peserta Magang",
    subtitle: "Menu Panduan Peserta di sidebar dan Buku Panduan akun peserta.",
    defaultTitle: "Buku Panduan Peserta Magang",
    badgeLabel: "PESERTA",
    fallbackDesc: "Memakai tautan bawaan Google Docs sebelum PDF diunggah.",
    category: "panduan",
    accentBar: "from-[#0284c7] to-blue-600",
    iconBg: "bg-sky-50 text-[#0284c7] dark:bg-sky-950/60 dark:text-sky-400",
    badgeClass:
      "bg-sky-50 text-[#0284c7] border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800",
  },
  mentor: {
    heading: "Panduan Mentor Pembimbing",
    subtitle: "Menu Panduan Mentor di sidebar dan Buku Panduan akun mentor.",
    defaultTitle: "Buku Panduan Mentor Pembimbing",
    badgeLabel: "MENTOR",
    fallbackDesc: "Memakai tautan bawaan Google Docs sebelum PDF diunggah.",
    category: "panduan",
    accentBar: "from-emerald-500 to-teal-500",
    iconBg:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
    badgeClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  },
  admin: {
    heading: "Panduan Administrator",
    subtitle: "Menu Panduan Website di sidebar dan Buku Panduan akun Admin.",
    defaultTitle: "Buku Panduan Administrator",
    badgeLabel: "ADMIN",
    fallbackDesc: "Memakai tautan bawaan Google Docs sebelum PDF diunggah.",
    category: "panduan",
    accentBar: "from-amber-500 to-orange-500",
    iconBg:
      "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  },
};

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDateTime(iso?: string): string {
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

function renderTargetIcon(target: PanduanTarget) {
  if (target === "pendaftaran") return <Globe className="w-5 h-5" />;
  if (target === "peserta") return <GraduationCap className="w-5 h-5" />;
  if (target === "mentor") return <UserCheck className="w-5 h-5" />;
  if (target === "admin") return <ShieldCheck className="w-5 h-5" />;
  return <FileText className="w-5 h-5" />;
}

/* ================= COMPONENT ================= */

export default function KelolaPanduanView({
  role = "admin",
}: KelolaPanduanViewProps) {
  const isSuperadmin = role === "superadmin";

  const allTargets = useMemo<PanduanTarget[]>(
    () =>
      isSuperadmin
        ? [
            "format-laporan-reguler",
            "format-laporan-pkpa",
            "pendaftaran",
            "peserta",
            "mentor",
            "admin",
          ]
        : [
            "format-laporan-reguler",
            "format-laporan-pkpa",
            "pendaftaran",
            "peserta",
            "mentor",
          ],
    [isSuperadmin],
  );

  const [panduan, setPanduan] = useState<PanduanMap>({
    pendaftaran: null,
    peserta: null,
    mentor: null,
    admin: null,
    "format-laporan-reguler": null,
    "format-laporan-pkpa": null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal Upload / Edit state
  const [editTarget, setEditTarget] = useState<PanduanTarget | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal Delete state
  const [deleteTarget, setDeleteTarget] = useState<PanduanTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ================= FETCH ================= */

  const fetchPanduan = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE}/panduan`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.message || "Gagal memuat data dokumen");
      }

      setPanduan({
        pendaftaran: json?.data?.pendaftaran ?? null,
        peserta: json?.data?.peserta ?? null,
        mentor: json?.data?.mentor ?? null,
        admin: json?.data?.admin ?? null,
        "format-laporan-reguler":
          json?.data?.["format-laporan-reguler"] ?? null,
        "format-laporan-pkpa": json?.data?.["format-laporan-pkpa"] ?? null,
      });
    } catch (err) {
      showToast.error(
        err instanceof Error ? err.message : "Gagal memuat data dokumen",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPanduan();
  }, [fetchPanduan]);

  /* ================= CLEANUP & ESCAPE ================= */

  useEffect(() => {
    return () => {
      if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl);
    };
  }, [editPreviewUrl]);

  const closeEditModal = useCallback(() => {
    if (uploading) return;
    if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl);
    setEditTarget(null);
    setEditTitle("");
    setEditFile(null);
    setEditPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [uploading, editPreviewUrl]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (deleteTarget && !deleting) {
        setDeleteTarget(null);
      } else if (editTarget && !uploading) {
        closeEditModal();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteTarget, deleting, editTarget, uploading, closeEditModal]);

  /* ================= STATS & FILTER ================= */

  const stats = useMemo(() => {
    const guideTargets = allTargets.filter(
      (t) => TARGET_META[t].category === "panduan",
    );
    const formatTargets = allTargets.filter(
      (t) => TARGET_META[t].category === "format",
    );
    const totalUploaded = allTargets.filter((t) => Boolean(panduan[t])).length;
    const guideUploaded = guideTargets.filter((t) =>
      Boolean(panduan[t]),
    ).length;
    const formatUploaded = formatTargets.filter((t) =>
      Boolean(panduan[t]),
    ).length;

    return {
      total: allTargets.length,
      totalUploaded,
      guideTotal: guideTargets.length,
      guideUploaded,
      formatTotal: formatTargets.length,
      formatUploaded,
      pending: allTargets.length - totalUploaded,
    };
  }, [allTargets, panduan]);

  const filteredTargets = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return allTargets.filter((target) => {
      const meta = TARGET_META[target];
      if (categoryFilter !== "all" && meta.category !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      const doc = panduan[target];
      return (
        meta.heading.toLowerCase().includes(q) ||
        meta.subtitle.toLowerCase().includes(q) ||
        meta.badgeLabel.toLowerCase().includes(q) ||
        (doc?.title || "").toLowerCase().includes(q) ||
        (doc?.originalName || "").toLowerCase().includes(q)
      );
    });
  }, [allTargets, categoryFilter, searchTerm, panduan]);

  /* ================= HANDLERS ================= */

  const openEditModal = (target: PanduanTarget) => {
    if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl);
    setEditTarget(target);
    setEditTitle(panduan[target]?.title || TARGET_META[target].defaultTitle);
    setEditFile(null);
    setEditPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.type !== "application/pdf") {
      showToast.error("Hanya file PDF yang diperbolehkan");
      e.target.value = "";
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      showToast.error("Ukuran file PDF maksimal 10 MB");
      e.target.value = "";
      return;
    }

    if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl);
    setEditFile(selected);
    setEditPreviewUrl(URL.createObjectURL(selected));
  };

  const clearSelectedFile = () => {
    if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl);
    setEditFile(null);
    setEditPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadSubmit = async () => {
    if (!editTarget) return;
    if (!editFile) {
      showToast.error("Pilih file PDF terlebih dahulu");
      return;
    }

    const meta = TARGET_META[editTarget];
    const toastId = showToast.loading(`Mengunggah ${meta.heading}...`);

    try {
      setUploading(true);
      const token = localStorage.getItem("token") || "";
      const formData = new FormData();
      formData.append("file", editFile);
      formData.append("title", editTitle.trim() || meta.defaultTitle);

      const res = await fetch(`${API_BASE}/panduan/${editTarget}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || `Gagal mengunggah ${meta.heading}`);
      }

      if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl);
      setEditTarget(null);
      setEditTitle("");
      setEditFile(null);
      setEditPreviewUrl(null);
      await fetchPanduan(true);
      window.dispatchEvent(new Event("panduan-updated"));
      showToast.updateSuccess(
        toastId,
        json?.message || `${meta.heading} berhasil diperbarui`,
      );
    } catch (err) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal mengunggah file PDF",
      );
    } finally {
      setUploading(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    const meta = TARGET_META[deleteTarget];
    const toastId = showToast.loading(`Menghapus ${meta.heading}...`);

    try {
      setDeleting(true);
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE}/panduan/${deleteTarget}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Gagal menghapus file");
      }

      setDeleteTarget(null);
      await fetchPanduan(true);
      window.dispatchEvent(new Event("panduan-updated"));
      showToast.updateSuccess(
        toastId,
        json?.message || `${meta.heading} berhasil dihapus`,
      );
    } catch (err) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal menghapus file",
      );
    } finally {
      setDeleting(false);
    }
  };

  /* ================= RENDER ================= */

  if (loading) {
    return (
      <FormPageSkeleton
        title="Kelola File Panduan & Format Laporan"
        subtitle="Memuat pengaturan dokumen sistem..."
        fieldsCount={5}
      />
    );
  }

  const editMeta = editTarget ? TARGET_META[editTarget] : null;
  const editExistingDoc = editTarget ? panduan[editTarget] : null;
  const deleteMeta = deleteTarget ? TARGET_META[deleteTarget] : null;

  return (
    <div className="space-y-6">
      {/* ================= PAGE HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Kelola File Panduan &amp; Format Laporan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isSuperadmin
              ? "Kelola PDF buku panduan (Publik, Peserta, Mentor, Admin) serta Format Laporan Akhir Magang (Reguler & PKPA)."
              : "Kelola PDF buku panduan (Publik, Peserta, Mentor) serta Format Laporan Akhir Magang (Reguler & PKPA)."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchPanduan(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-60 self-start sm:self-auto"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
          />
          Segarkan
        </button>
      </div>

      {/* ================= KPI SUMMARY CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl p-5 bg-linear-to-br from-[#0284c7] to-blue-700 text-white shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-sky-100">
                Total Dokumen PDF Aktif
              </p>
              <p className="text-3xl font-extrabold tracking-tight mt-2">
                {stats.totalUploaded}
                <span className="text-lg font-semibold text-sky-200">
                  /{stats.total}
                </span>
              </p>
              <p className="text-[11px] text-sky-100 mt-1.5">
                Dokumen resmi tersimpan di server
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <FolderOpen className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Format Laporan Magang
              </p>
              <p className="text-3xl font-extrabold text-[#1D64F2] dark:text-blue-400 tracking-tight mt-2">
                {stats.formatUploaded}
                <span className="text-lg font-semibold text-slate-400">
                  /{stats.formatTotal}
                </span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Kategori Reguler &amp; PKPA
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1D64F2] dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Buku Panduan PDF
              </p>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mt-2">
                {stats.guideUploaded}
                <span className="text-lg font-semibold text-slate-400">
                  /{stats.guideTotal}
                </span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Publik, Peserta, Mentor{isSuperadmin ? ", Admin" : ""}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Belum Diunggah / Default
              </p>
              <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight mt-2">
                {stats.pending}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Menunggu unggahan PDF khusus
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* ================= FILTER & SEARCH BAR ================= */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 p-3.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { key: "all", label: "Semua Dokumen", count: stats.total },
              {
                key: "format",
                label: "Format Laporan (PKPA & Reguler)",
                count: stats.formatTotal,
              },
              { key: "panduan", label: "Buku Panduan", count: stats.guideTotal },
            ] as Array<{ key: CategoryFilter; label: string; count: number }>
          ).map((tab) => {
            const active = categoryFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setCategoryFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition inline-flex items-center gap-1.5 cursor-pointer ${
                  active
                    ? "bg-[#0284c7] text-white shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama dokumen atau file PDF..."
            className="w-full pl-9 pr-9 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              aria-label="Hapus pencarian"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ================= COMPACT BENTO CARDS GRID ================= */}
      {filteredTargets.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-14 px-4 text-center">
          <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="font-semibold text-slate-700 dark:text-slate-200">
            Dokumen tidak ditemukan
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Coba ubah kata kunci pencarian atau pilih tab kategori lain.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTargets.map((target) => {
            const meta = TARGET_META[target];
            const doc = panduan[target];
            const activeFileUrl = doc ? `${API_BASE}${doc.fileUrl}` : null;

            return (
              <div
                key={target}
                className="group rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Subtle top accent bar */}
                  <div
                    className={`h-1.5 w-full bg-linear-to-r ${meta.accentBar}`}
                  />

                  <div className="p-4 sm:p-5 space-y-3.5">
                    {/* Top row: Icon + Badge + Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.iconBg}`}
                        >
                          {renderTargetIcon(target)}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide border ${meta.badgeClass}`}
                        >
                          {meta.badgeLabel}
                        </span>
                      </div>

                      {doc ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          PDF Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 shrink-0">
                          <BookOpen className="w-3 h-3" />
                          {meta.category === "format"
                            ? "Belum Diunggah"
                            : "Default"}
                        </span>
                      )}
                    </div>

                    {/* Title & Subtitle */}
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                        {meta.heading}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                        {meta.subtitle}
                      </p>
                    </div>

                    {/* Active File Box (compact) */}
                    {doc ? (
                      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 p-3 space-y-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                            {doc.title}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {doc.originalName} • {formatFileSize(doc.fileSize)}
                        </p>
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[10.5px] text-slate-400">
                          <span className="inline-flex items-center gap-1 truncate">
                            <Calendar className="w-3 h-3 shrink-0" />
                            {formatDateTime(doc.updatedAt)}
                          </span>
                          {doc.uploadedBy?.name && (
                            <span className="truncate max-w-[110px]">
                              {doc.uploadedBy.name}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 p-3 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {meta.fallbackDesc}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-4 sm:px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {activeFileUrl && (
                      <a
                        href={activeFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#0284c7] hover:text-[#0284c7] transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Lihat</span>
                      </a>
                    )}
                    {doc && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(target)}
                        aria-label={`Hapus ${meta.heading}`}
                        title="Hapus file PDF"
                        className="inline-flex items-center justify-center p-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => openEditModal(target)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-linear-to-r from-[#0284c7] to-blue-700 hover:from-[#0369a1] hover:to-blue-800 text-white shadow-2xs transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{doc ? "Ganti PDF" : "Unggah PDF"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= UPLOAD / REPLACE MODAL ================= */}
      {editTarget && editMeta && (
        <div
          className="fixed inset-0 z-60 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={closeEditModal}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {editExistingDoc ? "Perbarui File PDF" : "Unggah File PDF"}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${editMeta.badgeClass}`}
                  >
                    {editMeta.badgeLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {editMeta.heading}
                </p>
              </div>
              <button
                type="button"
                disabled={uploading}
                onClick={closeEditModal}
                aria-label="Tutup modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Judul Dokumen
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder={editMeta.defaultTitle}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                className="hidden"
                id="kelola-panduan-modal-file"
              />

              {!editFile ? (
                <label
                  htmlFor="kelola-panduan-modal-file"
                  className="block cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 hover:border-[#0284c7] p-5 text-center transition space-y-1.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400 flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                    Klik untuk memilih file PDF
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Format wajib PDF • Maksimal ukuran 10 MB
                  </p>
                </label>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-sky-200 dark:border-sky-800/70 bg-sky-50/60 dark:bg-sky-950/30 p-3 min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#0284c7] text-white flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {editFile.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {formatFileSize(editFile.size)} • Siap diunggah
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearSelectedFile}
                      aria-label="Batalkan pilihan file"
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {editPreviewUrl && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-48 bg-slate-100 dark:bg-slate-900">
                      <iframe
                        src={editPreviewUrl}
                        title={`Pratinjau ${editMeta.heading}`}
                        className="w-full h-full border-0"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/60 dark:bg-slate-800/30">
              <button
                type="button"
                disabled={uploading}
                onClick={closeEditModal}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!editFile || uploading}
                onClick={handleUploadSubmit}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-linear-to-r from-[#0284c7] to-blue-700 hover:from-[#0369a1] hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>
                  {uploading
                    ? "Mengunggah..."
                    : editExistingDoc
                      ? "Simpan Perubahan"
                      : "Unggah PDF"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE / RESET CONFIRM MODAL ================= */}
      {deleteTarget && deleteMeta && (
        <div
          className="fixed inset-0 z-60 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => !deleting && setDeleteTarget(null)}
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
                  Hapus {deleteMeta.heading}?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {deleteMeta.category === "format" ? (
                    <>
                      File PDF <strong>{deleteMeta.heading}</strong> akan
                      dihapus dari server dan peserta tidak dapat mengunduhnya
                      hingga file baru diunggah.
                    </>
                  ) : (
                    <>
                      File PDF panduan akan dihapus dari server dan tautan{" "}
                      <strong>{deleteMeta.heading}</strong> akan kembali
                      menggunakan tautan default.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={executeDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer disabled:opacity-60"
              >
                {deleting ? "Menghapus..." : "Ya, Hapus File"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
