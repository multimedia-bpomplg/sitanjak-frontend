"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  ChevronUp,
  Edit3,
  GraduationCap,
  Layers,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  HiAcademicCap,
  HiBeaker,
  HiOfficeBuilding,
  HiSearch,
  HiShieldCheck,
  HiSpeakerphone,
} from "react-icons/hi";
import PaginationFooter from "@/components/dashboard/PaginationFooter";
import { TablePageSkeleton } from "@/components/dashboard/skeletons";
import { showToast } from "@/components/ui/toastDashboard";

/* ================= TYPES ================= */

interface FungsiItem {
  _id: string;
  title: string;
  desc: string;
  jurusan: string[];
  iconName: string;
  gradient: string;
  lightBg?: string;
  border?: string;
  text?: string;
}

/* ================= CONSTANTS & HELPERS ================= */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const ITEMS_PER_PAGE = 10;

const ICON_OPTIONS = [
  { key: "HiOfficeBuilding", label: "Tata Usaha" },
  { key: "HiShieldCheck", label: "Penindakan" },
  { key: "HiBeaker", label: "Pengujian" },
  { key: "HiSearch", label: "Pemeriksaan" },
  { key: "HiSpeakerphone", label: "Komunikasi" },
  { key: "HiAcademicCap", label: "Akademik" },
];

const COLOR_THEMES = [
  {
    label: "Sky / Blue",
    gradient: "from-blue-500 to-cyan-500",
    lightBg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-700",
  },
  {
    label: "Amber",
    gradient: "from-amber-500 to-orange-500",
    lightBg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
  },
  {
    label: "Emerald",
    gradient: "from-emerald-500 to-teal-500",
    lightBg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
  },
  {
    label: "Rose",
    gradient: "from-red-500 to-rose-600",
    lightBg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
  },
  {
    label: "Purple",
    gradient: "from-purple-500 to-pink-500",
    lightBg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
  },
];

function renderFungsiIcon(iconName?: string) {
  switch (iconName?.trim()) {
    case "HiShieldCheck":
      return <HiShieldCheck className="w-5 h-5" />;
    case "HiBeaker":
      return <HiBeaker className="w-5 h-5" />;
    case "HiSearch":
      return <HiSearch className="w-5 h-5" />;
    case "HiSpeakerphone":
      return <HiSpeakerphone className="w-5 h-5" />;
    case "HiAcademicCap":
      return <HiAcademicCap className="w-5 h-5" />;
    default:
      return <HiOfficeBuilding className="w-5 h-5" />;
  }
}

/* ================= PAGE ================= */

export default function InformasiFungsiSuperadminPage() {
  const [data, setData] = useState<FungsiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  /* ---------- Form Modal ---------- */
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    desc: "",
    iconName: "HiOfficeBuilding",
    gradient: "from-blue-500 to-cyan-500",
    lightBg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-700",
  });
  const [jurusanInput, setJurusanInput] = useState("");
  const [jurusanList, setJurusanList] = useState<string[]>([]);

  /* ---------- Delete Modal ---------- */
  const [deleteTarget, setDeleteTarget] = useState<FungsiItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ================= FETCH ================= */

  const fetchData = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/informasi-fungsi`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Gagal memuat informasi fungsi");
      const json = await res.json();
      const rows = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
          ? json.data
          : [];
      setData(rows);
    } catch (err) {
      showToast.error(
        err instanceof Error ? err.message : "Gagal memuat informasi fungsi",
      );
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
      else if (showModal && !saving) setShowModal(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteTarget, deleting, showModal, saving]);

  /* ================= FILTERING & PAGINATION ================= */

  const stats = useMemo(() => {
    const totalJurusan = data.reduce(
      (acc, item) => acc + (item.jurusan?.length || 0),
      0,
    );
    return {
      totalFungsi: data.length,
      totalJurusan,
    };
  }, [data]);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (item) =>
        item.title?.toLowerCase().includes(q) ||
        item.desc?.toLowerCase().includes(q) ||
        item.jurusan?.some((j) => j.toLowerCase().includes(q)),
    );
  }, [data, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredData.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, safePage]);

  /* ================= FORM HANDLERS ================= */

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      title: "",
      desc: "",
      iconName: "HiOfficeBuilding",
      gradient: "from-blue-500 to-cyan-500",
      lightBg: "bg-sky-50",
      border: "border-sky-200",
      text: "text-sky-700",
    });
    setJurusanList([]);
    setJurusanInput("");
    setShowModal(true);
  };

  const openEditModal = (item: FungsiItem) => {
    setEditingId(item._id);
    setForm({
      title: item.title || "",
      desc: item.desc || "",
      iconName: item.iconName || "HiOfficeBuilding",
      gradient: item.gradient || "from-blue-500 to-cyan-500",
      lightBg: item.lightBg || "bg-sky-50",
      border: item.border || "border-sky-200",
      text: item.text || "text-sky-700",
    });
    setJurusanList(Array.isArray(item.jurusan) ? item.jurusan : []);
    setJurusanInput("");
    setShowModal(true);
  };

  const addJurusan = () => {
    const clean = jurusanInput.trim();
    if (!clean) {
      showToast.error("Nama jurusan tidak boleh kosong");
      return;
    }
    if (jurusanList.some((j) => j.toLowerCase() === clean.toLowerCase())) {
      showToast.error("Jurusan sudah ada dalam daftar");
      return;
    }
    setJurusanList((prev) => [...prev, clean]);
    setJurusanInput("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast.error("Judul fungsi wajib diisi");
      return;
    }
    if (form.desc.trim().length < 20) {
      showToast.error("Deskripsi minimal 20 karakter");
      return;
    }
    if (jurusanList.length === 0) {
      showToast.error("Tambahkan minimal 1 jurusan yang diterima");
      return;
    }

    const token = localStorage.getItem("token");
    const toastId = showToast.loading(
      editingId ? "Memperbarui informasi fungsi..." : "Menyimpan informasi fungsi...",
    );

    try {
      setSaving(true);
      const res = await fetch(
        editingId
          ? `${API_BASE}/informasi-fungsi/${editingId}`
          : `${API_BASE}/informasi-fungsi`,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...form,
            title: form.title.trim(),
            desc: form.desc.trim(),
            jurusan: jurusanList,
          }),
        },
      );

      if (!res.ok) throw new Error("Gagal menyimpan informasi fungsi");

      showToast.updateSuccess(
        toastId,
        editingId
          ? "Informasi fungsi berhasil diperbarui"
          : "Informasi fungsi berhasil ditambahkan",
      );
      setShowModal(false);
      await fetchData(true);
    } catch (err) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal menyimpan data",
      );
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    const token = localStorage.getItem("token");
    const toastId = showToast.loading("Menghapus informasi fungsi...");

    try {
      setDeleting(true);
      const res = await fetch(
        `${API_BASE}/informasi-fungsi/${deleteTarget._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error("Gagal menghapus data");

      showToast.updateSuccess(toastId, "Informasi fungsi berhasil dihapus");
      setDeleteTarget(null);
      await fetchData(true);
    } catch (err) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal menghapus data",
      );
    } finally {
      setDeleting(false);
    }
  };

  /* ================= RENDER ================= */

  if (loading) {
    return (
      <TablePageSkeleton
        title="Manajemen Informasi Fungsi"
        subtitle="Memuat daftar fungsi dan jurusan penerima magang..."
        columnsCount={4}
        rowsCount={5}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ================= PAGE HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Manajemen Informasi Fungsi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola informasi fungsi kerja BPOM dan daftar jurusan yang ditampilkan
            pada halaman utama
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Segarkan
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-linear-to-r from-[#0284c7] to-blue-700 hover:from-[#0369a1] hover:to-blue-800 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Fungsi Baru
          </button>
        </div>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Fungsi Terdaftar
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tabular-nums">
              {stats.totalFungsi}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Unit fungsi pada halaman publik
            </p>
          </div>
          <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Entri Jurusan
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#0284c7] dark:text-sky-400 mt-1 tabular-nums">
              {stats.totalJurusan}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Cakupan program studi penerima
            </p>
          </div>
          <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ================= SEARCH BAR ================= */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari fungsi berdasarkan judul, deskripsi, atau jurusan..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ================= CARDS GRID (KOTAK PERSEGI) ================= */}
      {paginatedData.length === 0 ? (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-14 px-4 text-center">
          <Layers className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="font-semibold text-slate-700 dark:text-slate-200">
            {search ? "Informasi fungsi tidak ditemukan" : "Belum ada data fungsi"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {search
              ? "Coba kata kunci lain"
              : "Klik Tambah Fungsi Baru untuk mulai mengisi informasi fungsi"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginatedData.map((item) => {
            const isExpanded = expandedId === item._id;
            return (
              <div
                key={item._id}
                className="rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-md transition flex flex-col justify-between overflow-hidden min-w-0 min-h-60"
              >
                <div className="p-5 space-y-3 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`w-11 h-11 rounded-lg bg-linear-to-br ${item.gradient || "from-blue-500 to-cyan-500"} text-white flex items-center justify-center shrink-0 shadow-xs`}
                    >
                      {renderFungsiIcon(item.iconName)}
                    </div>

                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-sky-50 text-[#0284c7] border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 shrink-0">
                      {item.jurusan?.length || 0} Jurusan
                    </span>
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white wrap-anywhere line-clamp-2">
                      {item.title}
                    </h3>
                    <p
                      className={`text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed wrap-anywhere ${
                        isExpanded ? "" : "line-clamp-3"
                      }`}
                    >
                      {item.desc}
                    </p>
                  </div>

                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Jurusan yang Diterima
                      </p>
                      <div className="flex flex-wrap gap-1.5 min-w-0">
                        {(item.jurusan || []).map((j, i) => (
                          <span
                            key={`${j}-${i}`}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-50 text-[#0284c7] border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 wrap-anywhere max-w-full"
                          >
                            {j}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : item._id)
                    }
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <span>{isExpanded ? "Tutup Detail" : "Lihat Detail"}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      aria-label="Edit fungsi"
                      className="p-2 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0284c7] dark:bg-sky-950/60 dark:text-sky-300 transition cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      aria-label="Hapus fungsi"
                      className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
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
          totalItems={filteredData.length}
          itemsPerPage={ITEMS_PER_PAGE}
          itemLabel="fungsi"
          onPageChange={setCurrentPage}
        />
      </div>

      {/* ================= CREATE / EDIT MODAL ================= */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) setShowModal(false);
          }}
        >
          <div className="w-full max-w-3xl max-h-[92vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-linear-to-r from-[#0284c7] to-blue-700 text-white flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold">
                  {editingId
                    ? "Edit Informasi Fungsi"
                    : "Tambah Informasi Fungsi Baru"}
                </h2>
                <p className="text-xs text-sky-100">
                  Data ini ditampilkan di section Informasi Fungsi halaman utama
                </p>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      Judul Fungsi <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                      placeholder="Contoh: Bagian Tata Usaha"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        Deskripsi Tugas <span className="text-rose-500">*</span>
                      </label>
                      <span
                        className={`text-xs font-semibold ${
                          form.desc.trim().length < 20
                            ? "text-rose-500"
                            : "text-emerald-600"
                        }`}
                      >
                        {form.desc.trim().length}/20 min
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      value={form.desc}
                      onChange={(e) =>
                        setForm({ ...form, desc: e.target.value })
                      }
                      placeholder="Jelaskan ruang lingkup tugas dan kegiatan magang..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      Jurusan Diterima <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={jurusanInput}
                        onChange={(e) => setJurusanInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addJurusan();
                          }
                        }}
                        placeholder="Contoh: Farmasi, Teknik Informatika"
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                      />
                      <button
                        type="button"
                        onClick={addJurusan}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0284c7] hover:bg-sky-700 text-white transition cursor-pointer"
                      >
                        Tambah
                      </button>
                    </div>

                    {jurusanList.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {jurusanList.map((j, i) => (
                          <span
                            key={`${j}-${i}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-[#0284c7] border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800"
                          >
                            {j}
                            <button
                              type="button"
                              onClick={() =>
                                setJurusanList((prev) =>
                                  prev.filter((_, idx) => idx !== i),
                                )
                              }
                              className="hover:text-rose-600 font-bold cursor-pointer"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      Ikon Kartu
                    </label>
                    <select
                      value={form.iconName}
                      onChange={(e) =>
                        setForm({ ...form, iconName: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                    >
                      {ICON_OPTIONS.map((opt) => (
                        <option key={opt.key} value={opt.key}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      Tema Warna Aksen
                    </label>
                    <select
                      value={form.gradient}
                      onChange={(e) => {
                        const preset = COLOR_THEMES.find(
                          (t) => t.gradient === e.target.value,
                        );
                        setForm({
                          ...form,
                          gradient: e.target.value,
                          lightBg: preset?.lightBg || form.lightBg,
                          border: preset?.border || form.border,
                          text: preset?.text || form.text,
                        });
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                    >
                      {COLOR_THEMES.map((theme) => (
                        <option key={theme.gradient} value={theme.gradient}>
                          {theme.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 space-y-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Pratinjau Kartu Landing
                    </p>
                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xs">
                      <div
                        className={`w-10 h-10 rounded-xl bg-linear-to-br ${form.gradient} text-white flex items-center justify-center shrink-0`}
                      >
                        {renderFungsiIcon(form.iconName)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {form.title || "Judul Fungsi"}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {jurusanList.length} jurusan terdaftar
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#0284c7] hover:bg-sky-700 text-white shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving
                    ? "Menyimpan..."
                    : editingId
                      ? "Perbarui Fungsi"
                      : "Simpan Fungsi"}
                </button>
              </div>
            </form>
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
                  Hapus Informasi Fungsi?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                  Data fungsi{" "}
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
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={executeDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer disabled:opacity-60"
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
