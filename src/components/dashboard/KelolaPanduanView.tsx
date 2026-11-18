"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe,
  GraduationCap,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
  UserCheck,
  X,
} from "lucide-react";
import { FormPageSkeleton } from "@/components/dashboard/skeletons";
import { showToast } from "@/components/ui/toastDashboard";

/* ================= TYPES ================= */

export type PanduanTarget = "pendaftaran" | "peserta" | "mentor" | "admin";

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

interface CardLocalState {
  title: string;
  file: File | null;
  previewUrl: string | null;
  uploading: boolean;
}

interface KelolaPanduanViewProps {
  role?: "admin" | "superadmin";
}

/* ================= CONSTANTS ================= */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const TARGET_META: Record<
  PanduanTarget,
  {
    heading: string;
    subtitle: string;
    defaultTitle: string;
    badgeLabel: string;
    fallbackDesc: string;
  }
> = {
  pendaftaran: {
    heading: "Panduan Pendaftaran (Landing Page)",
    subtitle:
      "Ditampilkan pada tombol Panduan Pendaftaran di Navbar, Footer, dan halaman utama publik.",
    defaultTitle: "Buku Panduan Pendaftaran Magang",
    badgeLabel: "PUBLIK / LANDING",
    fallbackDesc: "Tautan bawaan Google Docs saat file PDF belum diunggah.",
  },
  peserta: {
    heading: "Panduan Peserta Magang",
    subtitle:
      "Ditampilkan pada menu Panduan Peserta di sidebar dan Buku Panduan akun peserta.",
    defaultTitle: "Buku Panduan Peserta Magang",
    badgeLabel: "PESERTA",
    fallbackDesc: "Tautan bawaan Google Docs saat file PDF belum diunggah.",
  },
  mentor: {
    heading: "Panduan Mentor Pembimbing",
    subtitle:
      "Ditampilkan pada menu Panduan Mentor di sidebar dan Buku Panduan akun mentor.",
    defaultTitle: "Buku Panduan Mentor Pembimbing",
    badgeLabel: "MENTOR",
    fallbackDesc: "Tautan bawaan Google Docs saat file PDF belum diunggah.",
  },
  admin: {
    heading: "Panduan Administrator Sistem",
    subtitle:
      "Ditampilkan pada menu Panduan Website di sidebar dan Buku Panduan akun Admin.",
    defaultTitle: "Buku Panduan Administrator",
    badgeLabel: "ADMIN",
    fallbackDesc: "Tautan bawaan Google Docs saat file PDF belum diunggah.",
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

/* ================= COMPONENT ================= */

export default function KelolaPanduanView({
  role = "admin",
}: KelolaPanduanViewProps) {
  const isSuperadmin = role === "superadmin";

  const availableTargets = useMemo<PanduanTarget[]>(
    () =>
      isSuperadmin
        ? ["pendaftaran", "peserta", "mentor", "admin"]
        : ["pendaftaran", "peserta", "mentor"],
    [isSuperadmin],
  );

  const [panduan, setPanduan] = useState<PanduanMap>({
    pendaftaran: null,
    peserta: null,
    mentor: null,
    admin: null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [cards, setCards] = useState<Record<PanduanTarget, CardLocalState>>({
    pendaftaran: {
      title: TARGET_META.pendaftaran.defaultTitle,
      file: null,
      previewUrl: null,
      uploading: false,
    },
    peserta: {
      title: TARGET_META.peserta.defaultTitle,
      file: null,
      previewUrl: null,
      uploading: false,
    },
    mentor: {
      title: TARGET_META.mentor.defaultTitle,
      file: null,
      previewUrl: null,
      uploading: false,
    },
    admin: {
      title: TARGET_META.admin.defaultTitle,
      file: null,
      previewUrl: null,
      uploading: false,
    },
  });

  const [deleteTarget, setDeleteTarget] = useState<PanduanTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const pendaftaranInputRef = useRef<HTMLInputElement>(null);
  const pesertaInputRef = useRef<HTMLInputElement>(null);
  const mentorInputRef = useRef<HTMLInputElement>(null);
  const adminInputRef = useRef<HTMLInputElement>(null);

  const getInputRef = (target: PanduanTarget) => {
    if (target === "pendaftaran") return pendaftaranInputRef;
    if (target === "peserta") return pesertaInputRef;
    if (target === "mentor") return mentorInputRef;
    return adminInputRef;
  };

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
        throw new Error(json?.message || "Gagal memuat data panduan");
      }

      const data: PanduanMap = {
        pendaftaran: json?.data?.pendaftaran ?? null,
        peserta: json?.data?.peserta ?? null,
        mentor: json?.data?.mentor ?? null,
        admin: json?.data?.admin ?? null,
      };
      setPanduan(data);
      setCards((prev) => ({
        pendaftaran: {
          ...prev.pendaftaran,
          title:
            data.pendaftaran?.title || TARGET_META.pendaftaran.defaultTitle,
        },
        peserta: {
          ...prev.peserta,
          title: data.peserta?.title || TARGET_META.peserta.defaultTitle,
        },
        mentor: {
          ...prev.mentor,
          title: data.mentor?.title || TARGET_META.mentor.defaultTitle,
        },
        admin: {
          ...prev.admin,
          title: data.admin?.title || TARGET_META.admin.defaultTitle,
        },
      }));
    } catch (err) {
      showToast.error(
        err instanceof Error ? err.message : "Gagal memuat data panduan",
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
      if (cards.pendaftaran.previewUrl) {
        URL.revokeObjectURL(cards.pendaftaran.previewUrl);
      }
      if (cards.peserta.previewUrl) URL.revokeObjectURL(cards.peserta.previewUrl);
      if (cards.mentor.previewUrl) URL.revokeObjectURL(cards.mentor.previewUrl);
      if (cards.admin.previewUrl) URL.revokeObjectURL(cards.admin.previewUrl);
    };
  }, [
    cards.pendaftaran.previewUrl,
    cards.peserta.previewUrl,
    cards.mentor.previewUrl,
    cards.admin.previewUrl,
  ]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && deleteTarget && !deleting) {
        setDeleteTarget(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteTarget, deleting]);

  /* ================= HANDLERS ================= */

  const handleFileChange = (
    target: PanduanTarget,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
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

    setCards((prev) => {
      if (prev[target].previewUrl) {
        URL.revokeObjectURL(prev[target].previewUrl!);
      }
      return {
        ...prev,
        [target]: {
          ...prev[target],
          file: selected,
          previewUrl: URL.createObjectURL(selected),
        },
      };
    });
  };

  const clearSelectedFile = (target: PanduanTarget) => {
    setCards((prev) => {
      if (prev[target].previewUrl) {
        URL.revokeObjectURL(prev[target].previewUrl!);
      }
      return {
        ...prev,
        [target]: {
          ...prev[target],
          file: null,
          previewUrl: null,
        },
      };
    });
    const refEl = getInputRef(target).current;
    if (refEl) refEl.value = "";
  };

  const handleUpload = async (target: PanduanTarget) => {
    const state = cards[target];
    if (!state.file) {
      showToast.error("Pilih file PDF panduan terlebih dahulu");
      return;
    }

    const toastId = showToast.loading(`Mengunggah file panduan ${target}...`);

    try {
      setCards((prev) => ({
        ...prev,
        [target]: { ...prev[target], uploading: true },
      }));

      const token = localStorage.getItem("token") || "";
      const formData = new FormData();
      formData.append("file", state.file);
      formData.append(
        "title",
        state.title.trim() || TARGET_META[target].defaultTitle,
      );

      const res = await fetch(`${API_BASE}/panduan/${target}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || `Gagal mengunggah panduan ${target}`);
      }

      clearSelectedFile(target);
      await fetchPanduan(true);
      window.dispatchEvent(new Event("panduan-updated"));
      showToast.updateSuccess(
        toastId,
        json?.message || `Panduan ${target} berhasil diperbarui`,
      );
    } catch (err) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal mengunggah panduan",
      );
    } finally {
      setCards((prev) => ({
        ...prev,
        [target]: { ...prev[target], uploading: false },
      }));
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    const toastId = showToast.loading(`Menghapus panduan ${deleteTarget}...`);

    try {
      setDeleting(true);
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE}/panduan/${deleteTarget}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Gagal menghapus panduan");
      }

      setDeleteTarget(null);
      await fetchPanduan(true);
      window.dispatchEvent(new Event("panduan-updated"));
      showToast.updateSuccess(
        toastId,
        json?.message || "Panduan dikembalikan ke tautan default",
      );
    } catch (err) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal menghapus panduan",
      );
    } finally {
      setDeleting(false);
    }
  };

  /* ================= RENDER ================= */

  if (loading) {
    return (
      <FormPageSkeleton
        title="Kelola File Panduan"
        subtitle="Memuat pengaturan dokumen panduan..."
        fieldsCount={4}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ================= PAGE HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Kelola File Panduan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isSuperadmin
              ? "Unggah buku panduan PDF resmi untuk Landing Page (Pendaftaran), Peserta Magang, Mentor Pembimbing, dan Administrator."
              : "Unggah buku panduan PDF resmi untuk Landing Page (Pendaftaran), Peserta Magang, dan Mentor Pembimbing."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchPanduan(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
          />
          Segarkan
        </button>
      </div>

      {/* ================= GUIDE CARDS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {availableTargets.map((target) => {
          const meta = TARGET_META[target];
          const doc = panduan[target];
          const state = cards[target];
          const activeFileUrl = doc ? `${API_BASE}${doc.fileUrl}` : null;

          return (
            <div
              key={target}
              className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden"
            >
              {/* Card Header */}
              <div className="px-5 sm:px-6 py-4 bg-linear-to-r from-[#0284c7] via-sky-600 to-blue-700 text-white flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-white/20 shrink-0">
                    {target === "pendaftaran" ? (
                      <Globe className="w-5 h-5" />
                    ) : target === "peserta" ? (
                      <GraduationCap className="w-5 h-5" />
                    ) : target === "mentor" ? (
                      <UserCheck className="w-5 h-5" />
                    ) : (
                      <ShieldCheck className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-extrabold">{meta.heading}</h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                        {meta.badgeLabel}
                      </span>
                    </div>
                    <p className="text-xs text-sky-100 mt-0.5 leading-relaxed">
                      {meta.subtitle}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                {/* Active Document Status Box */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Status Dokumen Saat Ini
                    </span>
                    {doc ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        PDF Terunggah
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
                        <BookOpen className="w-3.5 h-3.5" />
                        Tautan Default
                      </span>
                    )}
                  </div>

                  {doc ? (
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-[#0284c7] shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900 dark:text-white wrap-anywhere">
                            {doc.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {doc.originalName} • {formatFileSize(doc.fileSize)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Diperbarui: {formatDateTime(doc.updatedAt)}
                        </span>
                        {doc.uploadedBy?.name && (
                          <span>Oleh: {doc.uploadedBy.name}</span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {activeFileUrl && (
                          <a
                            href={activeFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white shadow-2xs transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Lihat PDF Aktif
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(target)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Hapus &amp; Pakai Default
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {meta.fallbackDesc} Unggah file PDF di bawah untuk
                      menggantikannya dengan dokumen panduan resmi.
                    </p>
                  )}
                </div>

                {/* Title Input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Judul Dokumen Panduan
                  </label>
                  <input
                    type="text"
                    value={state.title}
                    onChange={(e) =>
                      setCards((prev) => ({
                        ...prev,
                        [target]: { ...prev[target], title: e.target.value },
                      }))
                    }
                    placeholder={meta.defaultTitle}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                  />
                </div>

                {/* Upload Dropzone / Preview */}
                <input
                  ref={getInputRef(target)}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => handleFileChange(target, e)}
                  className="hidden"
                  id={`panduan-upload-${target}`}
                />

                {!state.file ? (
                  <label
                    htmlFor={`panduan-upload-${target}`}
                    className="block cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 hover:border-[#0284c7] p-6 text-center transition space-y-2"
                  >
                    <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400 flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                      {doc
                        ? "Pilih file PDF baru untuk mengganti panduan"
                        : "Klik untuk memilih file Panduan PDF"}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Format wajib PDF • Maksimal ukuran 10 MB
                    </p>
                  </label>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-sky-200 dark:border-sky-800/70 bg-sky-50/60 dark:bg-sky-950/30 p-3.5 min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-[#0284c7] text-white flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {state.file.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {formatFileSize(state.file.size)} • Siap diunggah
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => clearSelectedFile(target)}
                        aria-label="Batalkan pilihan file"
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {state.previewUrl && (
                      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-56 bg-slate-100 dark:bg-slate-900">
                        <iframe
                          src={state.previewUrl}
                          title={`Pratinjau ${meta.heading}`}
                          className="w-full h-full border-0"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    disabled={!state.file || state.uploading}
                    onClick={() => handleUpload(target)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-[#0284c7] to-blue-700 hover:from-[#0369a1] hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
                  >
                    {state.uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>
                      {state.uploading
                        ? "Mengunggah..."
                        : doc
                          ? "Perbarui File Panduan"
                          : "Simpan File Panduan"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= DELETE / RESET CONFIRM MODAL ================= */}
      {deleteTarget && (
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
                  Hapus File Panduan{" "}
                  {deleteTarget === "pendaftaran"
                    ? "Pendaftaran"
                    : deleteTarget === "peserta"
                      ? "Peserta"
                      : deleteTarget === "mentor"
                        ? "Mentor"
                        : "Admin"}
                  ?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  File PDF panduan akan dihapus dari server dan tautan{" "}
                  <strong>
                    {deleteTarget === "pendaftaran"
                      ? "Panduan Pendaftaran (Landing Page)"
                      : deleteTarget === "peserta"
                        ? "Panduan Peserta"
                        : deleteTarget === "mentor"
                          ? "Panduan Mentor"
                          : "Panduan Website Admin"}
                  </strong>{" "}
                  akan kembali menggunakan tautan default.
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
