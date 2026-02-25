"use client";

import { useState, useEffect } from "react";
import {
  FaBullhorn,
  FaPlus,
  FaTrash,
  FaEdit,
  FaSave,
  FaImage,
  FaTimes,
  FaCheckCircle,
  FaExclamationCircle,
  FaEye,
  FaEyeSlash,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "@/components/ui/toastDashboard";

/* ========================
   TYPE
======================== */

type AnnouncementType = "landing" | "peserta" | "mentor" | "admin";

interface Announcement {
  _id: string;
  title: string;
  subtitle?: string;
  content: string;
  type: AnnouncementType;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ========================
   COMPONENT
======================== */

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function PengumumanPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<AnnouncementType | "all">(
    "all",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Form states
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<AnnouncementType>("landing");
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    id: string | null;
  }>({
    show: false,
    id: null,
  });

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/announcements`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Gagal mengambil data");

      const data = await res.json();
      setAnnouncements(data);
    } catch (err) {
      console.error(err);
      showToast.error("Gagal memuat data pengumuman");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setSubtitle("");
    setContent("");
    setType("landing");
    setIsActive(true);
    setEditId(null);
    setImageFile(null);
    setImagePreview(null);
    setUploadProgress(0);
  };

  const getTypeLabel = (type: AnnouncementType) => {
    const map = {
      landing: "Landing Page",
      peserta: "Peserta",
      mentor: "Mentor",
      admin: "Admin",
    };
    return map[type];
  };

  const getTypeColor = (type: AnnouncementType) => {
    const map = {
      landing: "bg-purple-100 text-purple-700 border-purple-200",
      peserta: "bg-blue-100 text-blue-700 border-blue-200",
      mentor: "bg-green-100 text-green-700 border-green-200",
      admin: "bg-orange-100 text-orange-700 border-orange-200",
    };
    return map[type];
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi ukuran file (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast.error("Ukuran gambar maksimal 2MB");
      return;
    }

    // Validasi tipe file
    if (!file.type.startsWith("image/")) {
      showToast.error("File harus berupa gambar");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));

    // Simulasi upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 50);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showToast.error("Judul wajib diisi");
      return;
    }
    if (!content.trim()) {
      showToast.error("Konten wajib diisi");
      return;
    }
    if (type === "landing" && !subtitle.trim()) {
      showToast.error("Sub judul landing page wajib diisi");
      return;
    }

    const toastId = showToast.loading(
      editId ? "Memperbarui pengumuman..." : "Menyimpan pengumuman..."
    );

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      formData.append("title", title);
      formData.append("content", content);
      formData.append("type", type);
      formData.append("isActive", String(isActive));

      if (type === "landing" && subtitle) {
        formData.append("subtitle", subtitle);
      }

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await fetch(
        editId
          ? `${API_BASE}/announcements/${editId}`
          : `${API_BASE}/announcements`,
        {
          method: editId ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!res.ok) throw new Error();

      showToast.updateSuccess(
        toastId,
        editId
          ? "Pengumuman berhasil diperbarui"
          : "Pengumuman berhasil ditambahkan"
      );

      resetForm();
      setShowForm(false);
      fetchData();
    } catch (err) {
      showToast.updateError(toastId, "Gagal menyimpan pengumuman");
    }
  };

  const handleDelete = (id: string) => {
    setConfirmModal({ show: true, id });
  };

  const confirmDelete = async () => {
    if (!confirmModal.id) return;

    const toastId = showToast.loading("Menghapus pengumuman...");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/announcements/${confirmModal.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error();

      showToast.updateSuccess(toastId, "Pengumuman berhasil dihapus");
      fetchData();
    } catch (err) {
      showToast.updateError(toastId, "Gagal menghapus pengumuman");
    } finally {
      setConfirmModal({ show: false, id: null });
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const toastId = showToast.loading("Memperbarui status...");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/announcements/${id}/toggle`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error();

      showToast.updateSuccess(
        toastId,
        `Pengumuman ${currentActive ? "dinonaktifkan" : "diaktifkan"}`
      );

      fetchData();
    } catch (err) {
      showToast.updateError(toastId, "Gagal mengubah status pengumuman");
    }
  };

  const handleEdit = (data: Announcement) => {
    setEditId(data._id);
    setTitle(data.title || "");
    setSubtitle(data.subtitle || "");
    setContent(data.content || "");
    setType(data.type);
    setIsActive(data.isActive);
    setImagePreview(
      data.image ? `${API_BASE}/uploads/announcements/${data.image}` : null,
    );
    setShowForm(true);
  };

  // Filter announcements
  const filteredAnnouncements = announcements.filter((a) => {
    const matchesType = selectedType === "all" || a.type === selectedType;
    const matchesSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage);
  const paginatedAnnouncements = filteredAnnouncements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 dark:from-[#0B0614] dark:via-[#120A24] dark:to-[#1E0F3D] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="
              text-3xl lg:text-4xl 
              font-extrabold 
              leading-tight
              bg-clip-text text-transparent 
              bg-linear-to-r 
              from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
              dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400
            ">
              Manajemen Pengumuman
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Kelola dan publikasikan pengumuman untuk semua pengguna
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3
              bg-linear-to-r 
              from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
              dark:from-indigo-600 dark:to-violet-500
              text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all
            "
          >
            <FaPlus />
            Tambah Pengumuman
          </motion.button>
        </motion.div>

        {/* Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-4 border border-gray-100 dark:border-gray-800"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Cari pengumuman..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="
                  w-full px-4 py-2 rounded-xl border transition-all

                  bg-white/80 border-[#FACC15]/50
                  focus:ring-2 focus:ring-[#B91C1C]
                  focus:border-transparent

                  dark:bg-indigo-900/40
                  dark:border-indigo-700
                  dark:text-white
                  dark:placeholder-indigo-300
                  dark:focus:ring-indigo-400
                "
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["all", "landing", "peserta", "mentor", "admin"].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t as any)}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all 
                    ${
                      selectedType === t
                        ? `
                            bg-linear-to-r
                            from-[#7F1D1D]
                            to-[#B91C1C]
                            text-white
                            shadow-md
                            dark:from-indigo-500
                            dark:to-purple-500
                          `
                        : `
                            bg-white/60
                            text-[#7F1D1D]
                            border border-[#FACC15]/40
                            hover:bg-[#FDE68A]/60

                            dark:bg-indigo-900/40
                            dark:text-indigo-200
                            dark:border-indigo-700
                            dark:hover:bg-indigo-800/50
                          `
                    }
                  `}
                >
                  {t === "all" ? "Semua" : getTypeLabel(t as AnnouncementType)}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="
                w-full
                max-w-4xl
                mx-auto
                rounded-2xl shadow-xl overflow-hidden border transition-all

                bg-white dark:bg-slate-900
                border-gray-200 dark:border-gray-800
              "
            >
              <div className="
                px-4 sm:px-6 py-4
                bg-linear-to-r
                from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]

                dark:from-indigo-600
                dark:via-indigo-500
                dark:to-purple-500
              ">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {editId ? <FaEdit /> : <FaPlus />}
                  {editId ? "Edit Pengumuman" : "Tambah Pengumuman Baru"}
                </h3>
              </div>

              <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-8">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-[#7F1D1D] dark:text-indigo-200 mb-2">
                    Gambar Banner <b>(OPSIONAL)</b>
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="
                        relative flex flex-col items-center justify-center
                        w-full
                        h-40 sm:h-48 md:h-56
                        rounded-xl cursor-pointer transition-colors overflow-hidden
                        border-2 border-dashed
                        border-[#FACC15]/60 hover:border-[#B91C1C]
                        dark:border-indigo-700 dark:hover:border-indigo-400
                      "
                    >
                      {imagePreview ? (
                        <>
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          {uploadProgress < 100 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <div className="w-32 h-2 bg-white/30 rounded-full overflow-hidden">
                                <div
                                  className="
                                    h-full
                                    bg-linear-to-r
                                    from-[#B91C1C] to-[#F59E0B]
                                    dark:from-indigo-400 dark:to-purple-400
                                    transition-all
                                  "
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center">
                          <FaImage className="mx-auto text-4xl text-gray-400 dark:text-indigo-300 mb-2" />
                          <p className="text-sm text-gray-600 dark:text-indigo-200">
                            Klik untuk upload gambar
                          </p>
                          <p className="text-xs text-gray-400 dark:text-indigo-300 mt-1">
                            PNG, JPG, GIF max 2MB
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-[#7F1D1D] dark:text-indigo-200 mb-2">
                    Judul Pengumuman
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Pembukaan Magang Gelombang 2"
                    className="
                      w-full px-4 py-3 rounded-xl border transition-all

                      bg-white/80 border-[#FACC15]/50
                      focus:ring-2 focus:ring-[#B91C1C]
                      focus:border-transparent

                      dark:bg-indigo-900/40
                      dark:border-indigo-700
                      dark:text-white
                      dark:placeholder-indigo-300
                      dark:focus:ring-indigo-400
                    "
                  />
                </div>

                {/* Type and Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#7F1D1D] dark:text-indigo-200 mb-2">
                      Target Pengguna
                    </label>
                    <select
                      value={type}
                      onChange={(e) =>
                        setType(e.target.value as AnnouncementType)
                      }
                      className="
                        w-full px-4 py-3 rounded-xl border transition-all

                        bg-white/80 border-[#FACC15]/50
                        focus:ring-2 focus:ring-[#B91C1C]

                        dark:bg-indigo-900/40
                        dark:border-indigo-700
                        dark:text-white
                        dark:focus:ring-indigo-400
                      "
                    >
                      <option value="landing">Landing Page</option>
                      <option value="peserta">Peserta</option>
                      <option value="mentor">Mentor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#7F1D1D] dark:text-indigo-200 mb-2">
                      Status
                    </label>
                    <div className="flex items-center gap-6 mt-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={isActive}
                          onChange={() => setIsActive(true)}
                          className="w-4 h-4 text-[#B91C1C] dark:text-indigo-400"
                        />
                        <span className="text-sm text-gray-700 dark:text-indigo-200">
                          Aktif
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={!isActive}
                          onChange={() => setIsActive(false)}
                          className="w-4 h-4 text-[#B91C1C] dark:text-indigo-400"
                        />
                        <span className="text-sm text-gray-700 dark:text-indigo-200">
                          Nonaktif
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Subtitle (khusus landing) */}
                {type === "landing" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                  >
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sub Judul (Landing Page)
                    </label>
                    <input
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="Contoh: Pendaftaran Magang 2026 Dibuka"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-purple-50 dark:bg-purple-900/20 focus:ring-2 focus:ring-[#B91C1C] focus:border-transparent transition"
                    />
                  </motion.div>
                )}

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-[#7F1D1D] dark:text-indigo-200 mb-2">
                    Isi Pengumuman
                  </label>
                  <textarea
                    rows={5}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Tulis isi pengumuman di sini..."
                    className="
                      w-full px-4 py-3 rounded-xl border transition-all resize-none

                      bg-white/80 border-[#FACC15]/50
                      focus:ring-2 focus:ring-[#B91C1C]

                      dark:bg-indigo-900/40
                      dark:border-indigo-700
                      dark:text-white
                      dark:placeholder-indigo-300
                      dark:focus:ring-indigo-400
                    "
                  />
                </div>

                {/* Form Actions */}
                <div className="
                  flex flex-col sm:flex-row
                  justify-end
                  gap-3
                  pt-6
                  border-t border-gray-200 dark:border-gray-800
                ">
                  <button
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                    className="
                      w-full sm:w-auto
                      px-6 py-3 rounded-xl border transition-all

                      border-gray-300 dark:border-gray-700
                      text-gray-700 dark:text-gray-300
                      hover:bg-gray-100 dark:hover:bg-gray-800
                    "
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSave}
                    className="
                      w-full sm:w-auto
                      flex items-center justify-center gap-2
                      px-8 py-3 rounded-xl font-semibold text-white shadow-lg
                      transition-all

                      bg-linear-to-r
                      from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                      hover:from-[#991B1B]
                      hover:via-[#DC2626]
                      hover:to-[#FBBF24]

                      dark:from-indigo-600
                      dark:via-indigo-500
                      dark:to-purple-500
                      dark:hover:from-indigo-500
                      dark:hover:via-purple-500
                      dark:hover:to-fuchsia-500
                    "
                  >
                    <FaSave />
                    {editId ? "Update" : "Simpan"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Announcements Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B91C1C]"></div>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedAnnouncements.length === 0 ? (
                <div className="col-span-full text-center py-20">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                    <FaBullhorn className="text-3xl text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Belum ada pengumuman
                  </h3>
                  <p className="text-sm text-gray-500">
                    {searchTerm || selectedType !== "all"
                      ? "Tidak ada pengumuman yang sesuai dengan filter"
                      : "Klik tombol Tambah Pengumuman untuk membuat pengumuman pertama"}
                  </p>
                </div>
              ) : (
                paginatedAnnouncements.map((a, index) => (
                  <motion.div
                    key={a._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative bg-white dark:bg-slate-900 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Status Badge */}
                    <div
                      className={`absolute top-4 right-4 z-20 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold shadow-md backdrop-blur-sm ${
                        a.isActive
                          ? "bg-emerald-500/90 text-white"
                          : "bg-gray-500/90 text-white"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                      {a.isActive ? "Aktif" : "Nonaktif"}
                    </div>

                    {/* Image */}
                    {a.image && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={`${API_BASE}/uploads/announcements/${a.image}`}
                          alt={a.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/images/placeholder.jpg";
                          }}
                        />
                      </div>
                    )}

                    <div className="p-5 space-y-3">
                      {/* Type Badge */}
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(a.type)}`}
                      >
                        <FaBullhorn className="text-xs" />
                        {getTypeLabel(a.type)}
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-2">
                        {a.title}
                      </h3>

                      {/* Subtitle (if landing) */}
                      {a.type === "landing" && a.subtitle && (
                        <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                          {a.subtitle}
                        </p>
                      )}

                      {/* Content Preview */}
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {a.content}
                      </p>

                      {/* Date */}
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <FaCalendarAlt />
                        <span>{formatDate(a.createdAt)}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <button
                          onClick={() => handleToggleActive(a._id, a.isActive)}
                          className={`p-2 rounded-lg transition ${
                            a.isActive
                              ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                              : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                          }`}
                          title={a.isActive ? "Nonaktifkan" : "Aktifkan"}
                        >
                          {a.isActive ? <FaEye /> : <FaEyeSlash />}
                        </button>
                        <button
                          onClick={() => handleEdit(a)}
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(a._id)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                          title="Hapus"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <FaChevronLeft />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg font-medium transition ${
                        currentPage === page
                          ? "bg-linear-to-r from-[#7F1D1D] to-[#B91C1C] text-white"
                          : "border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <FaChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ================= CONFIRM DELETE MODAL ================= */}
      <AnimatePresence>
        {confirmModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            {/* BACKDROP */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setConfirmModal({ show: false, id: null })}
            />

            {/* MODAL CARD */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="
                relative w-full max-w-md rounded-2xl shadow-2xl border
                bg-white border-[#FACC15]/40
                dark:bg-slate-900 dark:border-indigo-700
                p-6 sm:p-8
              "
            >
              {/* ICON */}
              <div className="
                mx-auto mb-4
                w-16 h-16 rounded-full flex items-center justify-center
                bg-linear-to-br from-[#7F1D1D] to-[#F59E0B]
                dark:from-indigo-500 dark:to-purple-500
                text-white text-2xl
              ">
                <FaExclamationCircle />
              </div>

              {/* TEXT */}
              <h3 className="text-lg sm:text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
                Hapus Pengumuman?
              </h3>

              <p className="text-sm text-center text-gray-600 dark:text-indigo-200 mb-6">
                Tindakan ini tidak dapat dibatalkan.  
                Apakah Anda yakin ingin menghapus pengumuman ini?
              </p>

              {/* BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() =>
                    setConfirmModal({ show: false, id: null })
                  }
                  className="
                    w-full
                    px-4 py-3 rounded-xl border font-medium transition-all

                    border-gray-300 text-gray-700
                    hover:bg-gray-100

                    dark:border-indigo-700
                    dark:text-indigo-200
                    dark:hover:bg-indigo-800/40
                  "
                >
                  Batal
                </button>

                <button
                  onClick={confirmDelete}
                  className="
                    w-full
                    px-4 py-3 rounded-xl font-semibold text-white transition-all shadow-lg

                    bg-linear-to-r
                    from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                    hover:from-[#991B1B]
                    hover:via-[#DC2626]
                    hover:to-[#FBBF24]

                    dark:from-indigo-600
                    dark:via-indigo-500
                    dark:to-purple-500
                    dark:hover:from-indigo-500
                    dark:hover:via-purple-500
                    dark:hover:to-fuchsia-500
                  "
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
