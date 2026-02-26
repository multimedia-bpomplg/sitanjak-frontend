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
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { showToast } from "@/components/ui/toastDashboard";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function InformasiFungsiAdmin() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>({
    title: "",
    desc: "",
    jurusan: [],
    iconName: "HiOfficeBuilding",
    gradient: "from-amber-500 to-orange-500",
    lightBg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [jurusanInput, setJurusanInput] = useState("");
  const [jurusanList, setJurusanList] = useState<string[]>([]);
  const [descError, setDescError] = useState("");

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

  const confirm = useConfirm();

  /* ========== FUNGSI JURUSAN ========== */
  const addJurusan = () => {
    if (!jurusanInput.trim()) {
      showToast.error("Jurusan tidak boleh kosong");
      return;
    }

    if (jurusanList.includes(jurusanInput.trim())) {
      showToast.error("Jurusan sudah ada");
      return;
    }

    setJurusanList([...jurusanList, jurusanInput.trim()]);
    setJurusanInput("");

    showToast.success("Jurusan ditambahkan");
  };

  const removeJurusan = (index: number) => {
    setJurusanList(jurusanList.filter((_, i) => i !== index));
  };

  /* LOAD DATA */
  const fetchData = async (showLoading = false) => {
    let toastId: any;

    try {
      if (showLoading) {
        toastId = showToast.loading("Memuat data...");
      }

      setLoading(true);

      const res = await fetch(`${API}/informasi-fungsi`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Gagal memuat data");

      const json = await res.json();
      setData(json.data || json);

      if (showLoading) {
        showToast.updateSuccess(toastId, "Data berhasil dimuat");
      }
    } catch (error) {
      console.error(error);
      showToast.error("Gagal memuat data");
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

    if (form.desc.trim().length < 20) {
      setDescError("Deskripsi minimal 20 karakter");

      showToast.error(
        "Deskripsi terlalu pendek. Minimal 20 karakter agar lebih informatif."
      );

      return;
    }

    const payload = {
      ...form,
      jurusan: jurusanList,
    };

    const toastId = showToast.loading(
      editingId ? "Mengupdate data..." : "Menyimpan data..."
    );

    try {
      const res = await fetch(
        editingId
          ? `${API}/informasi-fungsi/${editingId}`
          : `${API}/informasi-fungsi`,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Gagal menyimpan data");

      showToast.updateSuccess(
        toastId,
        editingId
          ? "Data berhasil diperbarui 🎉"
          : "Data berhasil ditambahkan 🎉"
      );

      // Reset form
      setForm({
        title: "",
        desc: "",
        jurusan: [],
        iconName: "HiOfficeBuilding",
        gradient: "from-amber-500 to-orange-500",
        lightBg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-700",
      });

      setJurusanList([]);
      setJurusanInput("");
      setEditingId(null);
      setShowModal(false);

      fetchData();
    } catch (error) {
      console.error(error);
      showToast.updateError(toastId, "Terjadi kesalahan saat menyimpan");
    }
  };

  /* DELETE */
  const handleDelete = async (id: string) => {
    confirm({
      title: "Hapus Data?",
      message:
        "Data yang dihapus tidak dapat dikembalikan. Apakah Anda yakin ingin melanjutkan?",
      onConfirm: async () => {
        const toastId = showToast.loading("Menghapus data...");

        try {
          const res = await fetch(`${API}/informasi-fungsi/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!res.ok) throw new Error("Gagal menghapus");

          showToast.updateSuccess(toastId, "Data berhasil dihapus 🗑");

          fetchData();
        } catch (error) {
          console.error(error);
          showToast.updateError(toastId, "Gagal menghapus data");
        }
      },
    });
  };

  /* EDIT */
  const handleEdit = (item: any) => {
    setForm({
      title: item.title,
      desc: item.desc || item.desc,
      jurusan: item.jurusan,
      iconName: item.iconName || "HiOfficeBuilding",
      gradient: item.gradient || "from-amber-500 to-orange-500",
      lightBg: item.lightBg || "bg-amber-50",
      border: item.border || "border-amber-200",
      text: item.text || "text-amber-700",
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
      gradient: "from-amber-500 to-orange-500",
      lightBg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-700",
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
      item.desc?.toLowerCase().includes(search.toLowerCase()) ||
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
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="
          group
          rounded-2xl sm:rounded-3xl
          border border-[#FCA5A5]/30 dark:border-indigo-500/30
          bg-linear-to-br
          from-white via-[#FFFDF8] to-[#FFF4EC]
          dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-800
          backdrop-blur
          shadow-sm hover:shadow-lg
          transition
        "
      >
        <div className="p-4 sm:p-6">
        <div className="flex gap-3 sm:gap-4">

            {/* ICON */}
            <div
              className={`
                w-10 h-10 sm:w-12 sm:h-12
                shrink-0
                rounded-xl
                bg-linear-to-br ${item.gradient}
                text-white
                flex items-center justify-center
                text-base sm:text-lg
                shadow
              `}
            >
              {IconComponent}
            </div>

            {/* CONTENT */}
            <div className="flex-1 min-w-0">

              {/* HEADER ROW */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">

                {/* Title & Desc */}
                <div className="min-w-0">
                  <h3 className="
                    text-base sm:text-lg font-bold
                    text-[#7F1D1D] dark:text-indigo-200
                    wrap-break-words
                  ">
                    {item.title}
                  </h3>

                  {item.desc && (
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                      {item.desc}
                    </p>
                  )}
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-1 mt-1 sm:mt-0 shrink-0">

                  <button
                    onClick={() => handleEdit(item)}
                    className="p-1.5 sm:p-2 rounded-lg text-blue-600 dark:text-indigo-300 hover:bg-blue-50 dark:hover:bg-indigo-900/40 transition"
                  >
                    <HiPencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(item._id)}
                    className="p-1.5 sm:p-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition"
                  >
                    <HiTrash className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : item._id)
                    }
                    className="p-1.5 sm:p-2 rounded-lg text-slate-400 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-indigo-900/40 transition"
                  >
                    {isExpanded ? (
                      <HiOutlineChevronUp className="w-4 h-4" />
                    ) : (
                      <HiOutlineChevronDown className="w-4 h-4" />
                    )}
                  </button>

                </div>
              </div>

              {/* EXPANDED SECTION */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-4 border-t border-[#FCA5A5]/30 dark:border-indigo-500/30">
                      <p className="text-xs font-semibold mb-3 text-[#7F1D1D] dark:text-indigo-300">
                        Jurusan yang Diterima:
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {item.jurusan?.map((j: string, i: number) => (
                          <span
                            key={i}
                            className="
                              px-2.5 py-1
                              text-[11px] sm:text-xs
                              rounded-full
                              bg-[#FFF4EC]
                              text-[#7F1D1D]
                              border border-[#FCA5A5]/40
                              dark:bg-indigo-900/50
                              dark:text-indigo-200
                              dark:border-indigo-500/40
                            "
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
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 dark:from-[#0B0614] dark:via-[#120A24] dark:to-[#1E0F3D] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
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
              Manajemen Informasi Fungsi
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2">
              Kelola informasi fungsi yang ditampilkan di halaman utama
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData()}
              className="
                inline-flex items-center gap-2
                px-4 py-2
                rounded-lg
                bg-linear-to-r
                from-[#F59E0B] to-[#B91C1C]
                dark:from-indigo-600 dark:to-indigo-800
                text-white font-semibold text-sm
                shadow-md shadow-[#B91C1C]/30
                dark:shadow-indigo-600/30
                hover:scale-[1.03]
                transition
              "
              title="Refresh"
            >
              <HiOutlineRefresh className="w-4 h-4" />
            </button>
            <button
              onClick={openCreateModal}
              className="
                inline-flex items-center gap-2
                px-5 py-2
                rounded-lg
                bg-linear-to-r
                from-[#7F1D1D] to-[#B91C1C]
                dark:from-indigo-700 dark:to-indigo-600
                text-white font-semibold text-sm
                shadow-md shadow-[#7F1D1D]/30
                dark:shadow-indigo-600/30
                hover:scale-[1.03]
                transition
              "
            >
              <HiPlus className="w-4 h-4" />
              Tambah Baru
            </button>
          </div>
        </div>

        {/* ===================== STATS ===================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">

          {/* Total Fungsi */}
          <div
            className="
              group relative
              rounded-2xl
              border border-[#FCA5A5]/40 dark:border-indigo-500/30
              bg-linear-to-br
              from-[#FFFDF8] via-[#FFF4EC] to-white
              dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-800
              p-6
              shadow-sm hover:shadow-xl
              transition
            "
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#7F1D1D] dark:text-indigo-300">
                  Total Fungsi
                </p>
                <p className="text-4xl font-extrabold mt-1 text-[#7F1D1D] dark:text-white">
                  {data.length}
                </p>
              </div>

              <div
                className="
                  w-14 h-14 rounded-2xl
                  bg-[#B91C1C]/90 dark:bg-indigo-600
                  text-white
                  flex items-center justify-center
                  shadow
                  group-hover:scale-110 transition
                "
              >
                <HiOfficeBuilding className="w-7 h-7" />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#FCA5A5]/40 dark:border-indigo-500/30">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Jumlah seluruh fungsi yang tersedia
              </p>
            </div>
          </div>

          {/* Total Jurusan */}
          <div
            className="
              group relative
              rounded-2xl
              border border-[#FCA5A5]/40 dark:border-indigo-500/30
              bg-linear-to-br
              from-[#FFFDF8] via-[#FFF4EC] to-white
              dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-800
              p-6
              shadow-sm hover:shadow-xl
              transition
            "
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#7F1D1D] dark:text-indigo-300">
                  Total Jurusan
                </p>
                <p className="text-4xl font-extrabold mt-1 text-[#7F1D1D] dark:text-white">
                  {data.reduce((acc, item) => acc + (item.jurusan?.length || 0), 0)}
                </p>
              </div>

              <div
                className="
                  w-14 h-14 rounded-2xl
                  bg-amber-500 dark:bg-violet-500
                  text-white
                  flex items-center justify-center
                  shadow
                  group-hover:scale-110 transition
                "
              >
                <HiAcademicCap className="w-7 h-7" />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#FCA5A5]/40 dark:border-indigo-500/30">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Total jurusan yang tersedia
              </p>
            </div>
          </div>
        </div>



        {/* ===================== SEARCH BAR ===================== */}
        <div className="mb-2">
          <div className="relative">
            <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7F1D1D] dark:text-indigo-400 w-5 h-5 z-10" />
            <input
              type="text"
              placeholder="Cari berdasarkan judul, deskripsi, atau jurusan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
                w-full pl-11 pr-10 py-3
                rounded-2xl
                bg-white/90 dark:bg-white/5
                backdrop-blur
                border border-[#F59E0B]/40 dark:border-indigo-500/40
                text-slate-700 dark:text-slate-100
                placeholder:text-slate-400
                focus:outline-none focus:ring-2
                focus:ring-[#B91C1C]/60 dark:focus:ring-indigo-500/60
                transition
              "
            />
          </div>

          <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Total {filteredData.length} dari {data.length} data
          </div>
        </div>

        {/* Data List */}
        {loading ? (
          <div className="grid gap-4 sm:gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="
                  rounded-2xl
                  border border-[#FCA5A5]/30 dark:border-indigo-500/30
                  bg-linear-to-br
                  from-[#FFFDF8] via-white to-[#FFF4EC]
                  dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-800
                  p-4 sm:p-5
                  animate-pulse
                "
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-200 dark:bg-indigo-700 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 sm:w-40 bg-slate-200 dark:bg-indigo-700 rounded-full" />
                    <div className="h-3 w-full bg-slate-200 dark:bg-indigo-700 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredData.length === 0 ? (
          <div
            className="
              text-center
              py-14 sm:py-20
              px-4 sm:px-6
              rounded-3xl
              border border-[#FCA5A5]/30 dark:border-indigo-500/30
              bg-linear-to-br
              from-[#FFFDF8] via-white to-[#FFF4EC]
              dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-800
              shadow-sm
            "
          >
            <div
              className="
                w-16 h-16 sm:w-20 sm:h-20
                mx-auto mb-5 sm:mb-6
                rounded-2xl
                flex items-center justify-center
                bg-linear-to-br
                from-[#F59E0B] to-[#B91C1C]
                dark:from-indigo-600 dark:to-indigo-700
                text-white shadow-lg
              "
            >
              <HiAcademicCap className="text-2xl sm:text-3xl" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#7F1D1D] dark:text-indigo-200 mb-2">
              {search ? "Data tidak ditemukan" : "Belum ada data"}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
              {search
                ? "Coba gunakan kata kunci lain"
                : "Klik tombol 'Tambah Baru' untuk menambahkan data"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5">
            <AnimatePresence>
              {filteredData.map((item) => (
                <PreviewCard key={item._id} item={item} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Footer Info */}
        <div className="
          mt-8 text-center text-sm
          text-slate-600 dark:text-slate-300
        ">
          <span className="font-semibold text-[#7F1D1D] dark:text-indigo-300">
            {filteredData.length}
          </span>{" "}
          dari{" "}
          <span className="font-semibold">
            {data.length}
          </span>{" "}
          data ditampilkan
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
              className="fixed inset-0 bg-black/40 backdrop-blur-md z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-10 pointer-events-none"
            >
              <div
                className="
                  pointer-events-auto
                  w-full max-w-5xl
                  max-h-[92vh] overflow-y-auto
                  rounded-3xl
                  border border-[#FCA5A5]/30 dark:border-indigo-500/30
                  bg-white/90 dark:bg-indigo-950/80
                  backdrop-blur-xl
                  shadow-2xl
                  transition
                "
              >
                {/* Modal Header */}
                <div
                  className="
                    sticky top-0 z-10
                    px-5 sm:px-8 py-5
                    border-b border-[#FCA5A5]/30 dark:border-indigo-500/30
                    bg-linear-to-r
                    from-[#FFF4EC] via-white to-[#FFFDF8]
                    dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-800
                    backdrop-blur
                  "
                >
                  <div className="flex items-start justify-between gap-4">
                    
                    {/* Left Content */}
                    <div className="space-y-2">

                      {/* Badge kecil */}
                      <div className="
                        inline-flex items-center
                        px-3 py-1
                        rounded-full
                        text-xs font-semibold tracking-wide
                        bg-[#FDE8E8] text-[#B91C1C]
                        dark:bg-indigo-900/50 dark:text-indigo-300
                      ">
                        {editingId ? "MODE EDIT" : "MODE CREATE"}
                      </div>

                      {/* Title */}
                      <h2
                        className="
                          text-lg sm:text-2xl font-extrabold leading-snug
                          bg-linear-to-r
                          from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                          dark:from-indigo-300 dark:via-violet-300 dark:to-purple-400
                          bg-clip-text text-transparent
                        "
                      >
                        {editingId
                          ? "Edit Informasi Fungsi"
                          : "Tambah Informasi Fungsi Baru"}
                      </h2>

                      {/* Subtitle */}
                      <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md">
                        {editingId
                          ? "Ubah data informasi fungsi yang sudah ada."
                          : "Isi form berikut untuk menambahkan fungsi baru."}
                      </p>
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={() => setShowModal(false)}
                      className="
                        flex items-center justify-center
                        w-10 h-10
                        rounded-xl
                        bg-white/60 
                        hover:bg-red-50 
                        text-red-600 
                        shadow-sm
                        transition
                      "
                    >
                      <HiX className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="px-6 py-6 sm:px-8 sm:py-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Judul Fungsi <span className="text-red-500">*</span>
                        </label>
                        <input
                          placeholder="Contoh: Bagian Tata Usaha"
                          className="
                            w-full
                            px-4 py-3
                            rounded-2xl
                            border border-[#FCA5A5]/40 dark:border-indigo-500/40
                            bg-white/80 dark:bg-white/5
                            backdrop-blur
                            text-slate-700 dark:text-slate-100
                            placeholder:text-slate-400
                            focus:outline-none
                            focus:ring-2 focus:ring-[#B91C1C]/50 dark:focus:ring-indigo-500/50
                            transition
                          "
                          value={form.title}
                          onChange={(e) =>
                            setForm({ ...form, title: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Deskripsi <span className="text-red-500">*</span>
                        </label>

                        <textarea
                          placeholder="Jelaskan tugas dan fungsi..."
                          rows={4}
                          className={`
                            w-full
                            px-4 py-3
                            rounded-2xl
                            border
                            ${descError
                              ? "border-rose-500 focus:ring-rose-500/50"
                              : "border-[#FCA5A5]/40 dark:border-indigo-500/40 focus:ring-[#B91C1C]/50 dark:focus:ring-indigo-500/50"}
                            bg-white/80 dark:bg-white/5
                            backdrop-blur
                            text-slate-700 dark:text-slate-100
                            placeholder:text-slate-400
                            focus:outline-none
                            focus:ring-2
                            transition
                          `}
                          value={form.desc}
                          onChange={(e) => {
                            const value = e.target.value;
                            setForm({ ...form, desc: value });

                            if (value.trim().length < 20) {
                              setDescError("Deskripsi minimal 20 karakter");
                            } else {
                              setDescError("");
                            }
                          }}
                          required
                        />

                        {/* Character Counter */}
                        <div className="flex justify-between mt-1 text-xs">
                          <span
                            className={`${
                              descError ? "text-rose-500" : "text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {descError || "Minimal 20 karakter agar deskripsi lebih jelas."}
                          </span>

                          <span
                            className={`${
                              form.desc.length < 20
                                ? "text-rose-500"
                                : "text-emerald-500"
                            }`}
                          >
                            {form.desc.length}/20
                          </span>
                        </div>
                      </div>

                      {/* JURUSAN SECTION */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Jurusan <span className="text-red-500">*</span>
                        </label>

                        {/* Input + Button */}
                        <div className="flex gap-2">
                          <input
                            placeholder="Masukkan jurusan..."
                            className="
                            w-full
                            px-4 py-3
                            rounded-2xl
                            border border-[#FCA5A5]/40 dark:border-indigo-500/40
                            bg-white/80 dark:bg-white/5
                            backdrop-blur
                            text-slate-700 dark:text-slate-100
                            placeholder:text-slate-400
                            focus:outline-none
                            focus:ring-2 focus:ring-[#B91C1C]/50 dark:focus:ring-indigo-500/50
                            transition
                          "
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
                                className="
                                  flex items-center gap-2
                                  px-3 py-1.5
                                  rounded-full
                                  text-xs font-medium
                                  bg-[#FFF4EC] text-[#7F1D1D]
                                  border border-[#FCA5A5]/40
                                  dark:bg-indigo-900/50
                                  dark:text-indigo-200
                                  dark:border-indigo-500/40
                                  transition
                                "
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
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Pilih Icon
                        </label>
                        <select
                          className="
                            w-full px-4 py-3
                            rounded-xl
                            border border-[#FCA5A5]/40 dark:border-indigo-500/40
                            bg-white dark:bg-[#1E293B]
                            text-slate-700 dark:text-white
                            focus:ring-2 focus:ring-red-500/50 dark:focus:ring-indigo-500/50
                            transition
                          "
                          value={form.iconName}
                          onChange={(e) =>
                            setForm({ ...form, iconName: e.target.value })
                          }
                        >
                          <option value="HiOfficeBuilding">Tata Usaha</option>
                          <option value="HiShieldCheck">Penindakan</option>
                          <option value="HiBeaker">Pengujian</option>
                          <option value="HiSearch">Pemeriksaan</option>
                          <option value="HiSpeakerphone">Komunikasi</option>
                          <option value="HiAcademicCap">Akademik</option>
                        </select>
                      </div>

                      {/* Color Preview */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Preview Warna
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            className="
                              w-full px-4 py-3
                              rounded-xl
                              border border-[#FCA5A5]/40 dark:border-indigo-500/40
                              bg-white dark:bg-[#1E293B]
                              text-slate-700 dark:text-white
                              focus:ring-2 focus:ring-red-500/50 dark:focus:ring-indigo-500/50
                              transition
                            "
                            value={form.gradient}
                            onChange={(e) =>
                              setForm({ ...form, gradient: e.target.value })
                            }
                          >
                            <option value="from-amber-500 to-orange-500">Amber</option>
                            <option value="from-red-500 to-rose-600">Red</option>
                            <option value="from-blue-500 to-cyan-500">Blue</option>
                            <option value="from-emerald-500 to-teal-500">Emerald</option>
                            <option value="from-purple-500 to-pink-500">Purple</option>
                          </select>
                        </div>
                      </div>

                      {/* Live Preview Card */}
                      <div className="
                        mt-6
                        p-5
                        rounded-2xl
                        border border-[#FCA5A5]/30 dark:border-indigo-500/30
                        bg-white/70 dark:bg-indigo-900/50
                        backdrop-blur
                      ">
                        <p className="text-xs font-medium text-slate-500 dark:text-white mb-3">
                          Live Preview:
                        </p>
                        <div className="
                          flex items-center gap-4
                          p-4
                          rounded-xl
                          bg-white dark:bg-indigo-950/70
                          shadow-sm
                        ">
                          <div
                            className={`w-10 h-10 rounded-xl bg-linear-to-br ${form.gradient} text-white flex items-center justify-center text-lg`}
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
                          <p className="mt-2 text-xs text-slate-600 dark:text-white">
                            <span className="font-medium">Judul:</span>{" "}
                            {form.title}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="
                    flex flex-col sm:flex-row
                    items-stretch sm:items-center
                    justify-end
                    gap-3
                    mt-10 pt-6
                    border-t border-[#FCA5A5]/30 dark:border-indigo-500/30
                  ">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="
                        px-6 py-3
                        rounded-xl
                        border border-[#FCA5A5]/40 dark:border-indigo-500/40
                        text-[#7F1D1D] dark:text-indigo-200
                        hover:bg-[#FFF4EC] dark:hover:bg-indigo-900/40
                        transition
                      "
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={jurusanList.length === 0 || form.desc.trim().length < 20}
                      className={`
                        px-6 py-3
                        rounded-xl
                        bg-linear-to-r
                        from-[#B91C1C] to-[#F59E0B]
                        dark:from-indigo-600 dark:to-indigo-700
                        text-white font-semibold
                        shadow-lg shadow-[#B91C1C]/30 dark:shadow-indigo-600/30
                        hover:scale-[1.02]
                        transition
                        ${jurusanList.length === 0 || form.desc.trim().length < 20
                          ? "opacity-50 cursor-not-allowed"
                          : ""}
                      `}
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
