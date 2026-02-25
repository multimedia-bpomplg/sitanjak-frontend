"use client";

import { useEffect, useState } from "react";
import {
  HiPlus,
  HiTrash,
  HiPencil,
  HiAcademicCap,
  HiOfficeBuilding,
  HiShieldCheck,
  HiBeaker,
  HiSearch,
  HiSpeakerphone,
  HiEye,
  HiEyeOff,
  HiOutlineRefresh,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiX,
} from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function InformasiFungsiAdmin() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>({
    title: "",
    desc: "",
    jurusan: [],
    iconName: "HiOfficeBuilding",
    gradientFrom: "from-amber-500",
    gradientTo: "to-orange-500",
    lightBg: "bg-amber-50",
    border: "border-amber-200",
    textColor: "text-amber-700",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [jurusanInput, setJurusanInput] = useState("");
  const [jurusanList, setJurusanList] = useState<string[]>([]);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : "";

  // Icons mapping untuk preview
  const iconMap: any = {
    HiOfficeBuilding: <HiOfficeBuilding />,
    HiShieldCheck: <HiShieldCheck />,
    HiBeaker: <HiBeaker />,
    HiSearch: <HiSearch />,
    HiSpeakerphone: <HiSpeakerphone />,
    HiAcademicCap: <HiAcademicCap />,
  };

  /* ========== FUNGSI JURUSAN ========== */
  const addJurusan = () => {
    if (!jurusanInput.trim()) return;
    if (jurusanList.includes(jurusanInput.trim())) return;

    setJurusanList([...jurusanList, jurusanInput.trim()]);
    setJurusanInput("");
  };

  const removeJurusan = (index: number) => {
    setJurusanList(jurusanList.filter((_, i) => i !== index));
  };

  /* LOAD DATA */
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/informasi-fungsi`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      setData(json.data || json);
    } catch (error) {
      console.error("Gagal memuat data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* CREATE / UPDATE */
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const payload = {
      ...form,
      jurusan: jurusanList,
    };

    if (editingId) {
      // UPDATE
      await fetch(`${API}/informasi-fungsi/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    } else {
      // CREATE
      await fetch(`${API}/informasi-fungsi`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    }

    // Reset form
    setForm({
      title: "",
      desc: "",
      jurusan: [],
      iconName: "HiOfficeBuilding",
      gradientFrom: "from-amber-500",
      gradientTo: "to-orange-500",
      lightBg: "bg-amber-50",
      border: "border-amber-200",
      textColor: "text-amber-700",
    });
    setJurusanList([]);
    setJurusanInput("");
    setEditingId(null);
    setShowModal(false);
    fetchData();
  };

  /* DELETE */
  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

    await fetch(`${API}/informasi-fungsi/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    fetchData();
  };

  /* EDIT */
  const handleEdit = (item: any) => {
    setForm({
      title: item.title,
      desc: item.description || item.desc,
      jurusan: item.jurusan,
      iconName: item.iconName || "HiOfficeBuilding",
      gradientFrom: item.gradientFrom || "from-amber-500",
      gradientTo: item.gradientTo || "to-orange-500",
      lightBg: item.lightBg || "bg-amber-50",
      border: item.border || "border-amber-200",
      textColor: item.textColor || "text-amber-700",
    });
    setJurusanList(item.jurusan || []);
    setEditingId(item._id);
    setShowModal(true);
  };

  /* RESET FORM */
  const resetForm = () => {
    setForm({
      title: "",
      desc: "",
      jurusan: [],
      iconName: "HiOfficeBuilding",
      gradientFrom: "from-amber-500",
      gradientTo: "to-orange-500",
      lightBg: "bg-amber-50",
      border: "border-amber-200",
      textColor: "text-amber-700",
    });
    setJurusanList([]);
    setJurusanInput("");
    setEditingId(null);
  };

  /* OPEN CREATE MODAL */
  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  // Filter data berdasarkan pencarian
  const filteredData = data.filter(
    (item) =>
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase()) ||
      item.jurusan?.some((j: string) =>
        j.toLowerCase().includes(search.toLowerCase()),
      ),
  );

  // Preview Card Component
  const PreviewCard = ({ item }: { item: any }) => {
    const iconKey = item.iconName?.trim() || "HiOfficeBuilding";
    const IconComponent = iconMap[iconKey] || <HiOfficeBuilding />;
    const isExpanded = expandedId === item._id;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        className={`bg-white rounded-xl shadow-sm border ${item.border} overflow-hidden hover:shadow-md transition-all`}
      >
        <div className="p-4">
          <div className="flex items-start gap-4">
            {/* Icon Preview */}
            <div
              className={`w-12 h-12 rounded-xl bg-linear-to-br ${item.gradientFrom} ${item.gradientTo} text-white flex items-center justify-center text-xl shadow-lg shrink-0`}
            >
              {IconComponent}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-800">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit"
                  >
                    <HiPencil />
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Hapus"
                  >
                    <HiTrash />
                  </button>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item._id)}
                    className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition"
                  >
                    {isExpanded ? (
                      <HiOutlineChevronUp />
                    ) : (
                      <HiOutlineChevronDown />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs font-medium text-slate-500 mb-2">
                        Jurusan yang Diterima:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {item.jurusan?.map((j: string, i: number) => (
                          <span
                            key={i}
                            className={`px-2 py-1 bg-white text-xs ${item.textColor} rounded-lg border ${item.border}`}
                          >
                            {j}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-linear-to-br from-slate-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black mb-2">
              <span className="bg-clip-text text-transparent bg-linear-to-r from-red-700 to-orange-500">
                Manajemen Informasi Fungsi
              </span>
            </h1>
            <p className="text-slate-600">
              Kelola informasi fungsi yang ditampilkan di halaman utama
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData()}
              className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              title="Refresh"
            >
              <HiOutlineRefresh className="text-slate-600" />
            </button>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-red-600 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <HiPlus />
              Tambah Baru
            </button>
          </div>
        </div>

        {/* Stats Cards - KUOTA DAN DURASI TELAH DIHAPUS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Total Fungsi</p>
            <p className="text-3xl font-bold text-slate-800">{data.length}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Total Jurusan</p>
            <p className="text-3xl font-bold text-slate-800">
              {data.reduce((acc, item) => acc + (item.jurusan?.length || 0), 0)}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari berdasarkan judul, deskripsi, atau jurusan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Data List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 animate-pulse"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-4 w-48 bg-slate-200 rounded-full mb-2" />
                    <div className="h-3 w-full bg-slate-200 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <HiAcademicCap className="text-3xl text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              {search ? "Data tidak ditemukan" : "Belum ada data"}
            </h3>
            <p className="text-sm text-slate-500">
              {search
                ? "Coba gunakan kata kunci lain"
                : "Klik tombol 'Tambah Baru' untuk menambahkan data"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredData.map((item) => (
                <PreviewCard key={item._id} item={item} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-slate-500">
          Total {filteredData.length} dari {data.length} data
        </div>
      </div>

      {/* MODAL CREATE/EDIT */}
      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-4 md:inset-10 z-50 flex items-center justify-center pointer-events-none"
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto pointer-events-auto">
                {/* Modal Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                      {editingId
                        ? "Edit Informasi Fungsi"
                        : "Tambah Informasi Fungsi Baru"}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      {editingId
                        ? "Ubah data informasi fungsi yang sudah ada"
                        : "Isi form berikut untuk menambahkan fungsi baru"}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition"
                  >
                    <HiX className="text-xl text-slate-500" />
                  </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Judul Fungsi <span className="text-red-500">*</span>
                        </label>
                        <input
                          placeholder="Contoh: Bagian Tata Usaha"
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50"
                          value={form.title}
                          onChange={(e) =>
                            setForm({ ...form, title: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Deskripsi <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          placeholder="Jelaskan tugas dan fungsi..."
                          rows={4}
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50"
                          value={form.desc}
                          onChange={(e) =>
                            setForm({ ...form, desc: e.target.value })
                          }
                          required
                        />
                      </div>

                      {/* JURUSAN SECTION */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Jurusan <span className="text-red-500">*</span>
                        </label>

                        {/* Input + Button */}
                        <div className="flex gap-2">
                          <input
                            placeholder="Masukkan jurusan..."
                            className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/50"
                            value={jurusanInput}
                            onChange={(e) => setJurusanInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addJurusan();
                              }
                            }}
                          />

                          <button
                            type="button"
                            onClick={addJurusan}
                            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
                          >
                            Masukkan
                          </button>
                        </div>

                        {/* List Jurusan */}
                        {jurusanList.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {jurusanList.map((j, i) => (
                              <span
                                key={i}
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-xs border border-red-200"
                              >
                                {j}

                                <button
                                  type="button"
                                  onClick={() => removeJurusan(i)}
                                  className="hover:text-red-900 font-bold"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Info tambahan */}
                        {jurusanList.length === 0 && (
                          <p className="text-xs text-amber-600 mt-1">
                            * Minimal 1 jurusan harus ditambahkan
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Pilih Icon
                        </label>
                        <select
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50"
                          value={form.iconName}
                          onChange={(e) =>
                            setForm({ ...form, iconName: e.target.value })
                          }
                        >
                          <option value="HiOfficeBuilding">Kantor</option>
                          <option value="HiShieldCheck">Penindakan</option>
                          <option value="HiBeaker">Pengujian</option>
                          <option value="HiSearch">Pemeriksaan</option>
                          <option value="HiSpeakerphone">Komunikasi</option>
                          <option value="HiAcademicCap">Akademik</option>
                        </select>
                      </div>

                      {/* Color Preview */}
                      {/* <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                          Preview Warna
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            className="px-3 py-2 text-xs border border-slate-200 rounded-lg"
                            value={form.gradientFrom}
                            onChange={(e) =>
                              setForm({ ...form, gradientFrom: e.target.value })
                            }
                          >
                            <option value="from-amber-500">Amber</option>
                            <option value="from-red-500">Red</option>
                            <option value="from-blue-500">Blue</option>
                            <option value="from-emerald-500">Emerald</option>
                            <option value="from-purple-500">Purple</option>
                          </select>
                          <select
                            className="px-3 py-2 text-xs border border-slate-200 rounded-lg"
                            value={form.gradientTo}
                            onChange={(e) =>
                              setForm({ ...form, gradientTo: e.target.value })
                            }
                          >
                            <option value="to-orange-500">Orange</option>
                            <option value="to-rose-600">Rose</option>
                            <option value="to-cyan-500">Cyan</option>
                            <option value="to-teal-500">Teal</option>
                            <option value="to-pink-500">Pink</option>
                          </select>
                        </div>
                      </div> */}

                      {/* Live Preview Card */}
                      <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-xs font-medium text-slate-500 mb-3">
                          Live Preview:
                        </p>
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                          <div
                            className={`w-10 h-10 rounded-xl bg-linear-to-br ${form.gradientFrom} ${form.gradientTo} text-white flex items-center justify-center text-lg`}
                          >
                            {iconMap[form.iconName] || <HiOfficeBuilding />}
                          </div>
                          <div className="flex-1">
                            <div className="h-3 w-32 bg-slate-200 rounded-full mb-2" />
                            <div className="flex gap-2">
                              <div
                                className={`h-2 w-16 ${form.lightBg || "bg-amber-50"} rounded-full`}
                              />
                              <div
                                className={`h-2 w-16 border ${form.border || "border-amber-200"} rounded-full`}
                              />
                            </div>
                          </div>
                        </div>
                        {form.title && (
                          <p className="mt-2 text-xs text-slate-600">
                            <span className="font-medium">Judul:</span>{" "}
                            {form.title}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-6 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={jurusanList.length === 0}
                      className={`px-6 py-2 bg-linear-to-r from-red-600 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg transition ${
                        jurusanList.length === 0
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {editingId ? "Update Data" : "Simpan Data"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
