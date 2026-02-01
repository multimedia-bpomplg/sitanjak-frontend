// app/dashboard/admin/ManajemenTampilan/LayoutUtama/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  HiPhotograph,
  HiPencil,
  HiTrash,
  HiCheck,
  HiX,
  HiPlus,
  HiEye,
  HiEyeOff,
  HiRefresh,
  HiTemplate,
  HiChartBar,
  HiBriefcase,
  HiAcademicCap,
  HiClipboardList,
} from "react-icons/hi";
import { showToast } from "@/components/ui/toastDashboard";
import { useConfirm } from "@/components/ui/ConfirmProvider";

interface SectionItem {
  id: string;
  sectionType: string;
  title: string;
  subtitle: string;
  description: string;
  images: string[];
  content: Record<string, any>;
  isActive: boolean;
  order: number;
  updatedAt: string;
}

export default function LayoutUtamaPage() {
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<SectionItem | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    content: "{}",
    isActive: true,
    order: 0,
    images: [] as File[],
  });

  const confirm = useConfirm();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  // Section types with icons
  const sectionTypes = [
    {
      type: "hero",
      label: "Hero Section",
      icon: HiTemplate,
      color: "from-red-500 to-amber-500",
    },
    {
      type: "statistik",
      label: "Statistik",
      icon: HiChartBar,
      color: "from-emerald-500 to-teal-500",
    },
    {
      type: "formasi",
      label: "Formasi",
      icon: HiBriefcase,
      color: "from-blue-500 to-indigo-500",
    },
    {
      type: "manfaat",
      label: "Manfaat",
      icon: HiAcademicCap,
      color: "from-purple-500 to-pink-500",
    },
    {
      type: "peraturan",
      label: "Peraturan",
      icon: HiClipboardList,
      color: "from-amber-500 to-orange-500",
    },
  ];

  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/landing/sections`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setSections(data);
      } else {
        throw new Error("Gagal memuat data");
      }
    } catch (error) {
      console.error("Gagal memuat data section:", error);
      showToast.error("Gagal memuat data layout");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle edit section
  const handleEdit = (section: SectionItem) => {
    setSelectedSection(section);
    setForm({
      title: section.title,
      subtitle: section.subtitle || "",
      description: section.description,
      content: JSON.stringify(section.content, null, 2),
      isActive: section.isActive,
      order: section.order,
      images: [],
    });
    setIsModalOpen(true);
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!selectedSection) return;

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("subtitle", form.subtitle);
    formData.append("description", form.description);
    formData.append("content", form.content);
    formData.append("isActive", String(form.isActive));
    formData.append("order", String(form.order));

    form.images.forEach((file) => {
      formData.append("images", file);
    });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/api/landing/sections/${selectedSection.id}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Gagal menyimpan perubahan");
      }

      showToast.success("Section berhasil diperbarui");
      setIsModalOpen(false);
      setSelectedSection(null);
      loadData();
    } catch (error: any) {
      showToast.error(error.message || "Terjadi kesalahan");
    }
  };

  // Toggle active status
  const handleToggleActive = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/landing/sections/${id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Gagal mengubah status");
      }

      showToast.success(result.message);
      loadData();
    } catch (error: any) {
      showToast.error(error.message || "Terjadi kesalahan");
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => file.size <= 5 * 1024 * 1024);

    if (validFiles.length !== files.length) {
      showToast.warning("Beberapa file melebihi 5MB");
    }

    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ...validFiles],
    }));
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Get section icon
  const getSectionIcon = (type: string) => {
    const section = sectionTypes.find((s) => s.type === type);
    return section ? section.icon : HiTemplate;
  };

  // Get section color
  const getSectionColor = (type: string) => {
    const section = sectionTypes.find((s) => s.type === type);
    return section ? section.color : "from-gray-500 to-gray-700";
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-[#020617] dark:via-[#020617] dark:to-[#1E1B4B] text-slate-800 dark:text-slate-100 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Layout Utama Landing Page
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola konten dan tampilan setiap section pada halaman utama
          </p>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-300 dark:hover:bg-slate-700 transition"
        >
          <HiRefresh className="text-lg" />
          Refresh Data
        </button>
      </div>

      {/* Section List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sectionTypes.map((sectionType) => {
          const section = sections.find(
            (s) => s.sectionType === sectionType.type,
          );
          const Icon = sectionType.icon;

          return (
            <div
              key={sectionType.type}
              className="bg-white/90 dark:bg-white/5 backdrop-blur border border-slate-200 dark:border-indigo-500/30 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
            >
              {/* Section Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-r ${sectionType.color} flex items-center justify-center text-white`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">
                      {sectionType.label}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {section
                        ? "Terakhir diubah: " +
                          new Date(section.updatedAt).toLocaleDateString(
                            "id-ID",
                          )
                        : "Belum diatur"}
                    </p>
                  </div>
                </div>

                {section && (
                  <button
                    onClick={() => handleToggleActive(section.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      section.isActive
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {section.isActive ? "Aktif" : "Nonaktif"}
                  </button>
                )}
              </div>

              {/* Section Preview */}
              <div className="mb-4">
                {section ? (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                      {section.title}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {section.description}
                    </p>
                    {section.images.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {section.images.slice(0, 2).map((img, idx) => (
                          <div key={idx} className="relative">
                            <img
                              src={`${API_BASE}${img}`}
                              alt={`Preview ${idx + 1}`}
                              className="w-16 h-16 rounded-lg object-cover"
                              onClick={() =>
                                setPreviewImage(`${API_BASE}${img}`)
                              }
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Belum ada konten
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Klik Edit untuk menambahkan
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (section) {
                      handleEdit(section);
                    } else {
                      // Create new section
                      const newSection: SectionItem = {
                        id: "new",
                        sectionType: sectionType.type,
                        title: sectionType.label,
                        subtitle: "",
                        description: "Deskripsi untuk " + sectionType.label,
                        images: [],
                        content: {},
                        isActive: true,
                        order: sections.length + 1,
                        updatedAt: new Date().toISOString(),
                      };
                      handleEdit(newSection);
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/40 transition font-medium"
                >
                  <HiPencil className="inline-block w-4 h-4 mr-1" />
                  {section ? "Edit" : "Buat"}
                </button>

                {section && (
                  <button
                    onClick={() => {
                      if (section.images.length > 0) {
                        setPreviewImage(`${API_BASE}${section.images[0]}`);
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    disabled={section.images.length === 0}
                  >
                    <HiPhotograph className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {isModalOpen && selectedSection && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-r ${getSectionColor(selectedSection.sectionType)} flex items-center justify-center text-white`}
                  >
                    {(() => {
                      const Icon = getSectionIcon(selectedSection.sectionType);
                      return <Icon className="w-5 h-5" />;
                    })()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                      Edit{" "}
                      {
                        sectionTypes.find(
                          (s) => s.type === selectedSection.sectionType,
                        )?.label
                      }
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Ubah konten dan gambar untuk section ini
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedSection(null);
                  }}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <HiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-6">
              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Judul Utama *
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    placeholder="Contoh: Pendaftaran Magang"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Subjudul
                  </label>
                  <input
                    type="text"
                    value={form.subtitle}
                    onChange={(e) =>
                      setForm({ ...form, subtitle: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    placeholder="Contoh: Balai Besar POM Palembang"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Deskripsi *
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  placeholder="Deskripsi lengkap untuk section ini..."
                />
              </div>

              {/* Content (JSON) */}
              <div>
                <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Konten Tambahan (JSON)
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                  rows={6}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition font-mono text-sm"
                  placeholder='{"key": "value"}'
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Gunakan format JSON untuk data tambahan seperti statistik,
                  daftar formasi, dll.
                </p>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Upload Gambar (Max 5MB per file)
                </label>

                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center">
                  <HiPhotograph className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Klik untuk upload gambar
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-block px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    Pilih File
                  </label>
                </div>

                {/* Preview Images */}
                {form.images.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {form.images.length} file baru dipilih
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {form.images.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Existing Images */}
                {selectedSection.images.length > 0 &&
                  selectedSection.id !== "new" && (
                    <div className="mt-6">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        Gambar yang sudah ada
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {selectedSection.images.map((img, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={`${API_BASE}${img}`}
                              alt={`Existing ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                              onClick={() =>
                                setPreviewImage(`${API_BASE}${img}`)
                              }
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                              <button
                                onClick={() =>
                                  setPreviewImage(`${API_BASE}${img}`)
                                }
                                className="px-3 py-1 bg-white/80 text-black rounded text-xs"
                              >
                                Lihat
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* Active Status & Order */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <label
                    htmlFor="isActive"
                    className="text-sm text-slate-700 dark:text-slate-300"
                  >
                    Tampilkan section ini di website
                  </label>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Urutan Tampil
                  </label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) =>
                      setForm({ ...form, order: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-6">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedSection(null);
                  }}
                  className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Batal
                </button>

                <button
                  onClick={handleSubmit}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] via-[#B91C1C] to-[#7F1D1D] dark:from-indigo-600 dark:via-violet-600 dark:to-indigo-800 text-white font-semibold shadow-lg hover:opacity-90 transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition"
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
