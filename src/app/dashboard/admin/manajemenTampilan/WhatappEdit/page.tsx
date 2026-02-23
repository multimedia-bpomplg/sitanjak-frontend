"use client";

import { useState, useEffect } from "react";
import {
  FaWhatsapp,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPlus,
  FaHistory,
  FaPhoneAlt,
  FaUserCheck,
  FaClock,
  FaCopy,
  FaQrcode,
  FaArrowRight,
  FaCheckDouble,
  FaShieldAlt,
} from "react-icons/fa";
import { HiPhone, HiCheckCircle, HiXCircle } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import AlertPopup from "@/components/ui/AlertPopup";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Modal from "@/components/ui/Modal";
import moment from "moment";
moment.locale("id");

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

interface WhatsAppData {
  _id: string;
  phoneNumber: string;
  isActive: boolean;
  updatedBy: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface NotificationType {
  show: boolean;
  type: "success" | "error" | "warning" | "info";
  message: string;
  title?: string;
}

export default function ManajemenWhatsappPage() {
  const [whatsapps, setWhatsapps] = useState<WhatsAppData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");

  // Notification
  const [notification, setNotification] = useState<NotificationType>({
    show: false,
    type: "info",
    message: "",
  });

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Copy notification
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchWhatsapps();
  }, []);

  const fetchWhatsapps = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/whatsapp/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();

      if (result.success) {
        setWhatsapps(result.data);
      } else {
        showNotification("error", result.message || "Gagal mengambil data");
      }
    } catch (error) {
      showNotification("error", "Terjadi kesalahan saat mengambil data");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (
    type: "success" | "error" | "warning" | "info",
    message: string,
    title?: string,
  ) => {
    setNotification({ show: true, type, message, title });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const handleOpenModal = (mode: "add" | "edit", data?: WhatsAppData) => {
    setModalMode(mode);
    if (mode === "edit" && data) {
      setSelectedId(data._id);
      setPhoneNumber("0" + data.phoneNumber.substring(2));
    } else {
      setSelectedId(null);
      setPhoneNumber("");
    }
    setIsModalOpen(true);
  };

  const validatePhoneNumber = (num: string): boolean => {
    return /^08\d{8,11}$/.test(num);
  };

  const handleSubmit = async () => {
    if (!phoneNumber.trim()) {
      showNotification("warning", "Nomor WhatsApp wajib diisi");
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      showNotification(
        "warning",
        "Format nomor harus diawali 08 dan minimal 10 digit",
      );
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/whatsapp/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Gagal menyimpan nomor");
      }

      showNotification(
        "success",
        "Nomor WhatsApp berhasil diperbarui",
        "Berhasil",
      );
      setIsModalOpen(false);
      fetchWhatsapps();
    } catch (err: any) {
      showNotification("error", err.message || "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/whatsapp/${deleteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Gagal menghapus nomor");
      }

      showNotification(
        "success",
        "Nomor WhatsApp berhasil dihapus",
        "Berhasil",
      );
      setShowDeleteConfirm(false);
      fetchWhatsapps();
    } catch (err: any) {
      showNotification("error", err.message || "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
      setDeleteId(null);
    }
  };

  const formatPhoneNumber = (num: string): string => {
    return "0" + num.substring(2);
  };

  const formatDisplayNumber = (num: string): string => {
    // Format: 0812-3456-7890
    const cleaned = formatPhoneNumber(num);
    const match = cleaned.match(/^(\d{4})(\d{4})(\d{4})$/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return cleaned;
  };

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(formatPhoneNumber(num));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showNotification("success", "Nomor berhasil disalin", "Tersalin!");
  };

  const activeWhatsapp = whatsapps.find((w) => w.isActive);
  const inactiveWhatsapps = whatsapps.filter((w) => !w.isActive);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-white to-indigo-50 dark:from-[#020617] dark:via-[#0B1120] dark:to-[#1E1B4B]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-indigo-50 dark:from-[#020617] dark:via-[#0B1120] dark:to-[#1E1B4B] p-4 sm:p-6 lg:p-8">
      {/* Notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            className={`fixed top-4 left-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
              notification.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : notification.type === "error"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : notification.type === "warning"
                    ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                    : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            {notification.type === "success" ? (
              <FaCheckCircle className="text-emerald-500 text-xl" />
            ) : notification.type === "error" ? (
              <FaExclamationTriangle className="text-red-500 text-xl" />
            ) : notification.type === "warning" ? (
              <FaExclamationTriangle className="text-yellow-500 text-xl" />
            ) : (
              <FaWhatsapp className="text-blue-500 text-xl" />
            )}
            <div>
              {notification.title && (
                <p className="font-bold">{notification.title}</p>
              )}
              <p className="text-sm">{notification.message}</p>
            </div>
            <button
              onClick={() =>
                setNotification((prev) => ({ ...prev, show: false }))
              }
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <HiXCircle className="text-xl" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Copy notification */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50"
          >
            <FaCheckDouble className="text-emerald-400" />
            <span>Tersalin!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
                <FaWhatsapp className="text-3xl text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-extrabold bg-clip-text text-transparent bg-linear-to-r from-green-600 to-emerald-600">
                  Manajemen WhatsApp
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Kelola nomor WhatsApp untuk bubble chat interaktif di website
                </p>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOpenModal("add")}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <FaPlus />
            Tambah Nomor Baru
          </motion.button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 border border-green-100 dark:border-green-900/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Total Nomor
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  {whatsapps.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <FaWhatsapp className="text-2xl text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 border border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Nomor Aktif
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  {activeWhatsapp ? 1 : 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <FaCheckCircle className="text-2xl text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 border border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Riwayat
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  {inactiveWhatsapps.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FaHistory className="text-2xl text-blue-600" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Active Number Card */}
        <AnimatePresence>
          {activeWhatsapp && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative overflow-hidden rounded-2xl bg-linear-to-r from-green-500 to-emerald-600 shadow-2xl"
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-white rounded-full blur-3xl" />
                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-white rounded-full blur-3xl" />
              </div>

              <div className="relative p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <FaWhatsapp className="text-4xl text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold text-white">
                          AKTIF
                        </span>
                        <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold text-white flex items-center gap-1">
                          <FaShieldAlt className="text-xs" />
                          PRIMARY
                        </span>
                      </div>
                      <h2 className="text-3xl font-bold text-white mb-2">
                        {formatDisplayNumber(activeWhatsapp.phoneNumber)}
                      </h2>
                      <div className="flex items-center gap-4 text-white/80 text-sm">
                        <span className="flex items-center gap-1">
                          <FaUserCheck />
                          {activeWhatsapp.updatedBy?.name || "Unknown"}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaClock />
                          {moment(activeWhatsapp.updatedAt).fromNow()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopyNumber(activeWhatsapp.phoneNumber)}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-green-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  >
                    <FaCopy />
                    Salin Nomor
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <FaHistory />
                Riwayat Nomor WhatsApp
              </h3>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Total {whatsapps.length} nomor
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Nomor WhatsApp
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Diperbarui Oleh
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Terakhir Update
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {whatsapps.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                          <FaWhatsapp className="text-4xl text-green-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                          Belum ada nomor WhatsApp
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                          Tambahkan nomor WhatsApp pertama Anda untuk memulai
                        </p>
                        <button
                          onClick={() => handleOpenModal("add")}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                        >
                          <FaPlus />
                          Tambah Nomor
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  whatsapps.map((wa, index) => (
                    <motion.tr
                      key={wa._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              wa.isActive
                                ? "bg-green-100 dark:bg-green-900/30"
                                : "bg-slate-100 dark:bg-slate-800"
                            }`}
                          >
                            <FaWhatsapp
                              className={`${
                                wa.isActive
                                  ? "text-green-600"
                                  : "text-slate-400"
                              }`}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {formatDisplayNumber(wa.phoneNumber)}
                            </p>
                            <p className="text-xs text-slate-500">
                              +62{wa.phoneNumber.substring(2)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {wa.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
                            <FaCheckCircle className="text-xs" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            Tidak Aktif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                              {wa.updatedBy?.name?.charAt(0) || "U"}
                            </span>
                          </div>
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {wa.updatedBy?.name || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {moment(wa.updatedAt).format("DD MMM YYYY")}
                          </span>
                          <span className="text-xs text-slate-500">
                            {moment(wa.updatedAt).format("HH:mm")} WIB
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleOpenModal("edit", wa)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition"
                            title="Edit"
                          >
                            <FaEdit />
                          </motion.button>
                          {!wa.isActive && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteClick(wa._id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition"
                              title="Hapus"
                            >
                              <FaTrash />
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          {whatsapps.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Menampilkan {whatsapps.length} nomor
                </span>
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <FaShieldAlt className="text-green-500" />
                  Hanya satu nomor yang dapat aktif
                </span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                <FaHistory className="text-xl text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                  Informasi Sistem
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Nomor baru yang ditambahkan akan otomatis menjadi nomor aktif.
                  Nomor sebelumnya akan dinonaktifkan secara otomatis.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                <FaQrcode className="text-xl text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">
                  Format Nomor
                </h3>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  Gunakan format 08xxxxxxxxxx (minimal 10 digit). Nomor akan
                  otomatis dikonversi ke format internasional +62.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modal Add/Edit - FIXED: title as string, icon separate */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          modalMode === "add" ? "Tambah Nomor WhatsApp" : "Edit Nomor WhatsApp"
        }
      >
        <div className="space-y-6">
          {/* Icon Header */}
          <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-slate-700">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                modalMode === "add"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                  : "bg-blue-100 dark:bg-blue-900/30 text-blue-600"
              }`}
            >
              {modalMode === "add" ? <FaPlus /> : <FaEdit />}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {modalMode === "add"
                ? "Tambahkan nomor WhatsApp baru untuk bubble chat"
                : "Edit nomor WhatsApp yang sudah ada"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Nomor WhatsApp
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <FaWhatsapp className="text-green-500" />
              </div>
              <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-green-500 overflow-hidden">
                <span className="px-8 py-3 text-slate-500 text-sm bg-slate-50 dark:bg-slate-700 border-r">
                  +62
                </span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) =>
                    setPhoneNumber(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="81234567890"
                  className="w-full px-4 py-3 outline-none bg-transparent text-sm"
                  autoFocus
                />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <FaPhoneAlt className="text-xs" />
              Masukkan nomor dengan format 08xxxxxxxxxx
            </p>
          </div>

          <AnimatePresence>
            {phoneNumber && validatePhoneNumber(phoneNumber) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30">
                  <div className="flex items-center gap-3">
                    <FaCheckCircle className="text-green-500 text-xl" />
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        Preview Nomor
                      </p>
                      <p className="text-lg font-bold text-green-800 dark:text-green-200">
                        +62{phoneNumber.substring(1)}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-2"
            >
              <HiXCircle />
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 rounded-lg bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <HiCheckCircle />
                  Simpan
                  <FaArrowRight className="text-xs" />
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal - FIXED: title as string, icon separate */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Konfirmasi Hapus"
        size="sm"
      >
        <div className="text-center py-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-4"
          >
            <FaExclamationTriangle className="text-3xl text-red-600" />
          </motion.div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Hapus Nomor WhatsApp?
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Nomor yang dihapus tidak dapat dikembalikan. Apakah Anda yakin ingin
            menghapus nomor ini?
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={submitting}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Batal
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Ya, Hapus"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
