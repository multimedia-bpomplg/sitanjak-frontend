"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Megaphone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import PaginationFooter from "@/components/dashboard/PaginationFooter";
import { TablePageSkeleton } from "@/components/dashboard/skeletons";
import { showToast } from "@/components/ui/toastDashboard";

/* ================= TYPES ================= */

type AnnouncementType = "landing" | "peserta" | "mentor" | "admin";
type FilterType = "all" | AnnouncementType;

type Announcement = {
  _id: string;
  title: string;
  subtitle?: string;
  content: string;
  type: AnnouncementType;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/* ================= CONSTANTS & HELPERS ================= */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const ITEMS_PER_PAGE = 10;

const TYPE_LABELS: Record<AnnouncementType, string> = {
  landing: "Landing Page",
  peserta: "Peserta",
  mentor: "Mentor",
  admin: "Admin",
};

function getTypeBadgeClass(type: AnnouncementType) {
  switch (type) {
    case "landing":
      return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800";
    case "peserta":
      return "bg-sky-50 text-[#0284c7] border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800";
    case "mentor":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
    case "admin":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
  }
}

function getBannerImageUrl(image?: string): string | null {
  if (!image) return null;
  if (image.startsWith("http") || image.startsWith("blob:")) return image;
  return `${API_BASE}/uploads/announcements/${image.replace(/^\/+/, "")}`;
}

/* ================= PAGE ================= */

export default function ManajemenTampilanBannerSuperadminPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedType, setSelectedType] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  /* ---------- Form Modal State ---------- */
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<AnnouncementType>("landing");
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  /* ---------- Delete Confirm State ---------- */
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ================= FETCH ================= */

  const fetchData = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/announcements`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Gagal mengambil data pengumuman");

      const data = await res.json();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch {
      showToast.error("Gagal memuat data pengumuman");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ================= ESCAPE KEY HANDLER ================= */

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (deleteTarget && !deleting) setDeleteTarget(null);
      else if (showForm && !saving) setShowForm(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteTarget, deleting, showForm, saving]);

  /* ================= STATS & FILTERING ================= */

  const stats = useMemo(() => {
    return {
      total: announcements.length,
      active: announcements.filter((a) => a.isActive).length,
      inactive: announcements.filter((a) => !a.isActive).length,
      landing: announcements.filter((a) => a.type === "landing").length,
      peserta: announcements.filter((a) => a.type === "peserta").length,
      mentor: announcements.filter((a) => a.type === "mentor").length,
      admin: announcements.filter((a) => a.type === "admin").length,
    };
  }, [announcements]);

  const filteredAnnouncements = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return announcements.filter((a) => {
      if (selectedType !== "all" && a.type !== selectedType) return false;
      if (!q) return true;
      return (
        a.title?.toLowerCase().includes(q) ||
        a.subtitle?.toLowerCase().includes(q) ||
        a.content?.toLowerCase().includes(q)
      );
    });
  }, [announcements, selectedType, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAnnouncements.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);

  const paginatedAnnouncements = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredAnnouncements.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAnnouncements, safePage]);

  /* ================= FORM HANDLERS ================= */

  const resetForm = () => {
    setEditId(null);
    setTitle("");
    setSubtitle("");
    setContent("");
    setType("landing");
    setIsActive(true);
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(false);
  };

  const openCreateModal = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditModal = (item: Announcement) => {
    setEditId(item._id);
    setTitle(item.title || "");
    setSubtitle(item.subtitle || "");
    setContent(item.content || "");
    setType(item.type);
    setIsActive(item.isActive);
    setImageFile(null);
    setImagePreview(getBannerImageUrl(item.image));
    setRemoveImage(false);
    setShowForm(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast.error("File harus berupa gambar (JPG/PNG/WebP)");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast.error("Ukuran gambar maksimal 2MB");
      e.target.value = "";
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showToast.error("Judul pengumuman wajib diisi");
      return;
    }
    if (!content.trim()) {
      showToast.error("Isi pengumuman wajib diisi");
      return;
    }
    if (type === "landing" && !subtitle.trim()) {
      showToast.error("Sub judul wajib diisi untuk tipe Landing Page");
      return;
    }

    const toastId = showToast.loading(
      editId ? "Memperbarui pengumuman..." : "Menyimpan pengumuman...",
    );

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();

      formData.append("title", title.trim());
      formData.append("content", content.trim());
      formData.append("type", type);
      formData.append("isActive", String(isActive));

      if (type === "landing" && subtitle.trim()) {
        formData.append("subtitle", subtitle.trim());
      }
      if (imageFile) {
        formData.append("image", imageFile);
      } else if (editId && removeImage) {
        formData.append("removeImage", "true");
      }

      const res = await fetch(
        editId
          ? `${API_BASE}/announcements/${editId}`
          : `${API_BASE}/announcements`,
        {
          method: editId ? "PUT" : "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      if (!res.ok) throw new Error("Gagal menyimpan pengumuman");

      showToast.updateSuccess(
        toastId,
        editId
          ? "Pengumuman berhasil diperbarui"
          : "Pengumuman berhasil ditambahkan",
      );
      setShowForm(false);
      resetForm();
      await fetchData(true);
    } catch {
      showToast.updateError(toastId, "Gagal menyimpan pengumuman");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: Announcement) => {
    const toastId = showToast.loading("Memperbarui status...");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/announcements/${item._id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error();

      showToast.updateSuccess(
        toastId,
        item.isActive
          ? "Pengumuman dinonaktifkan"
          : "Pengumuman diaktifkan",
      );
      await fetchData(true);
    } catch {
      showToast.updateError(toastId, "Gagal mengubah status pengumuman");
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    const toastId = showToast.loading("Menghapus pengumuman...");

    try {
      setDeleting(true);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/announcements/${deleteTarget._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error();

      showToast.updateSuccess(toastId, "Pengumuman berhasil dihapus");
      setDeleteTarget(null);
      await fetchData(true);
    } catch {
      showToast.updateError(toastId, "Gagal menghapus pengumuman");
    } finally {
      setDeleting(false);
    }
  };

  /* ================= RENDER ================= */

  if (loading) {
    return (
      <TablePageSkeleton
        title="Manajemen Tampilan & Pengumuman"
        subtitle="Memuat daftar banner dan pengumuman sistem..."
        columnsCount={5}
        rowsCount={6}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Manajemen Tampilan &amp; Pengumuman
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola banner landing page serta kotak pengumuman aktif untuk
            peserta, mentor, dan admin
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-60"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Segarkan
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-linear-to-r from-[#0284c7] to-blue-700 hover:from-[#0369a1] hover:to-blue-800 text-white shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Pengumuman
          </button>
        </div>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl p-5 bg-linear-to-br from-[#0284c7] to-blue-700 text-white shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-sky-100">
                Total Pengumuman
              </p>
              <p className="text-3xl font-extrabold tracking-tight mt-2">
                {stats.total}
              </p>
              <p className="text-[11px] text-sky-100 mt-1.5">
                Semua kanal publik &amp; dashboard
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Sedang Aktif
              </p>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mt-2">
                {stats.active}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Ditampilkan ke pengguna
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Nonaktif / Arsip
              </p>
              <p className="text-3xl font-extrabold text-slate-700 dark:text-slate-200 tracking-tight mt-2">
                {stats.inactive}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Disembunyikan sementara
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Banner Landing Page
              </p>
              <p className="text-3xl font-extrabold text-[#0284c7] dark:text-sky-400 tracking-tight mt-2">
                {stats.landing}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                {stats.peserta} peserta • {stats.mentor} mentor • {stats.admin}{" "}
                admin
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400 flex items-center justify-center shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* ================= FILTER & SEARCH ================= */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 p-3.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { key: "all", label: "Semua", count: stats.total },
              { key: "landing", label: "Landing Page", count: stats.landing },
              { key: "peserta", label: "Peserta", count: stats.peserta },
              { key: "mentor", label: "Mentor", count: stats.mentor },
              { key: "admin", label: "Admin", count: stats.admin },
            ] as Array<{ key: FilterType; label: string; count: number }>
          ).map((tab) => {
            const active = selectedType === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setSelectedType(tab.key);
                  setCurrentPage(1);
                }}
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

        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari judul atau konten pengumuman..."
            className="w-full pl-9 pr-9 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setCurrentPage(1);
              }}
              aria-label="Hapus pencarian"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ================= ANNOUNCEMENTS GRID ================= */}
      {paginatedAnnouncements.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-14 px-4 text-center">
          <Megaphone className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="font-semibold text-slate-700 dark:text-slate-200">
            Belum ada pengumuman yang sesuai
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Klik &ldquo;Tambah Pengumuman&rdquo; untuk membuat banner atau info
            baru.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginatedAnnouncements.map((item) => {
            const imgUrl = getBannerImageUrl(item.image);

            return (
              <div
                key={item._id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {imgUrl && (
                    <div className="h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden border-b border-slate-100 dark:border-slate-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${getTypeBadgeClass(
                          item.type,
                        )}`}
                      >
                        {TYPE_LABELS[item.type]}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${
                          item.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                            : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                        }`}
                      >
                        {item.isActive ? (
                          <>
                            <Eye className="w-3 h-3" /> Aktif
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" /> Nonaktif
                          </>
                        )}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h3>
                      {item.subtitle && (
                        <p className="text-xs font-medium text-[#0284c7] dark:text-sky-400 mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-3 whitespace-pre-line">
                      {item.content}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(item.createdAt).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      {item.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      aria-label="Edit pengumuman"
                      className="p-2 rounded-xl bg-sky-50 text-[#0284c7] hover:bg-sky-100 dark:bg-sky-950/50 dark:text-sky-300 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      aria-label="Hapus pengumuman"
                      className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-400 transition cursor-pointer"
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

      {/* ================= PAGINATION ================= */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <PaginationFooter
          currentPage={safePage}
          totalItems={filteredAnnouncements.length}
          itemsPerPage={ITEMS_PER_PAGE}
          itemLabel="pengumuman"
          onPageChange={setCurrentPage}
        />
      </div>

      {/* ================= MODAL CREATE / EDIT ================= */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) setShowForm(false);
          }}
        >
          <div className="w-full max-w-2xl max-h-[92vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-linear-to-r from-[#0284c7] to-blue-700 px-6 py-4 text-white flex items-center justify-between shrink-0">
              <h2 className="text-base sm:text-lg font-bold">
                {editId ? "Edit Pengumuman" : "Tambah Pengumuman Baru"}
              </h2>
              <button
                type="button"
                disabled={saving}
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Target Tampilan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={type}
                    onChange={(e) =>
                      setType(e.target.value as AnnouncementType)
                    }
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                  >
                    <option value="landing">Landing Page</option>
                    <option value="peserta">Dashboard Peserta</option>
                    <option value="mentor">Dashboard Mentor</option>
                    <option value="admin">Dashboard Admin</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 w-full cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 accent-[#0284c7]"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Tampilkan langsung (Aktif)
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Judul Pengumuman <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Pembukaan Magang Periode Baru"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                />
              </div>

              {type === "landing" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Sub Judul Banner Landing{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Contoh: Pendaftaran Batch 2 Dibuka Hingga 30 Juni"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Isi Pengumuman <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tuliskan detail informasi atau pengumuman..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Gambar Banner (Opsional, maks. 2MB)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-[#0284c7] bg-sky-50/60 dark:bg-sky-950/30 text-[#0284c7] dark:text-sky-300 text-xs font-semibold cursor-pointer hover:bg-sky-100/70 transition">
                    <Upload className="w-4 h-4" />
                    <span>{imageFile ? imageFile.name : "Pilih Gambar"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        if (editId) setRemoveImage(true);
                      }}
                      className="text-xs font-semibold text-rose-600 hover:underline"
                    >
                      {editId && !imageFile ? "Hapus gambar" : "Hapus pratinjau"}
                    </button>
                  )}
                </div>

                {imagePreview && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-48">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Pratinjau banner"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Menyimpan..." : "Simpan Pengumuman"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= CONFIRM DELETE ================= */}
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
                  Hapus Pengumuman?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                  Pengumuman{" "}
                  <strong className="text-slate-900 dark:text-white">
                    {deleteTarget.title}
                  </strong>{" "}
                  akan dihapus permanen dari sistem.
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
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs disabled:opacity-60 cursor-pointer"
              >
                {deleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
