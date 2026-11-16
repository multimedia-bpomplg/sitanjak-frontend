"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Edit3,
  History,
  MessageCircle,
  Phone,
  Plus,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserCheck,
  Wifi,
  X,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { QRCodeSVG } from "qrcode.react";
import PaginationFooter from "@/components/dashboard/PaginationFooter";
import { TablePageSkeleton } from "@/components/dashboard/skeletons";
import { showToast } from "@/components/ui/toastDashboard";

/* ================= TYPES ================= */

interface WhatsAppData {
  _id: string;
  phoneNumber: string;
  isActive: boolean;
  groupId?: string;
  groupName?: string;
  updatedBy?: {
    name?: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface GroupData {
  id: string;
  name: string;
  participants: number;
}

/* ================= CONSTANTS & HELPERS ================= */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const ITEMS_PER_PAGE = 10;

function formatLocalNumber(num = ""): string {
  if (!num) return "-";
  return num.startsWith("62") ? `0${num.substring(2)}` : num;
}

function formatDisplayNumber(num = ""): string {
  const cleaned = formatLocalNumber(num);
  const match = cleaned.match(/^(\d{4})(\d{4})(\d{3,5})$/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : cleaned;
}

function formatInternational(num = ""): string {
  const local = formatLocalNumber(num);
  return local.startsWith("0") ? `+62${local.substring(1)}` : `+62${local}`;
}

function validatePhoneNumber(num: string): boolean {
  return /^08\d{8,11}$/.test(num);
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ================= PAGE ================= */

export default function ManajemenWhatsappSuperadminPage() {
  const [whatsapps, setWhatsapps] = useState<WhatsAppData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  /* ---------- QR & Connection ---------- */
  const [qr, setQr] = useState<string | null>(null);
  const [waStatus, setWaStatus] = useState<string>("disconnected");
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string>("");
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  /* ---------- Add/Edit Modal ---------- */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [phoneNumber, setPhoneNumber] = useState("");

  /* ---------- Delete Modal ---------- */
  const [deleteTarget, setDeleteTarget] = useState<WhatsAppData | null>(null);

  /* ================= FETCH ================= */

  const fetchWhatsapps = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/whatsapp/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();

      if (!res.ok || !result?.success) {
        throw new Error(result?.message || "Gagal mengambil data WhatsApp");
      }

      const list: WhatsAppData[] = Array.isArray(result.data) ? result.data : [];
      setWhatsapps(list);
      const active = list.find((w) => w.isActive);
      setActiveGroupId(active?.groupId || "");
    } catch (err) {
      showToast.error(
        err instanceof Error ? err.message : "Gagal memuat data WhatsApp",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchQR = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/whatsapp/qr`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result?.success) {
        setQr(result.qr ?? null);
        setWaStatus(result.status || "disconnected");
      }
    } catch {
      // Silent poll error
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/whatsapp/groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result?.success && Array.isArray(result.data)) {
        setGroups(result.data);
      }
    } catch {
      // Silent group error
    }
  }, []);

  useEffect(() => {
    fetchWhatsapps();
  }, [fetchWhatsapps]);

  useEffect(() => {
    fetchQR();
    const interval = setInterval(() => {
      if (waStatus !== "connected") {
        fetchQR();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [waStatus, fetchQR]);

  useEffect(() => {
    if (waStatus === "connected") {
      fetchGroups();
    }
  }, [waStatus, fetchGroups]);

  /* ================= ESCAPE KEY HANDLER ================= */

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || submitting) return;
      if (deleteTarget) setDeleteTarget(null);
      else if (isModalOpen) setIsModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteTarget, isModalOpen, submitting]);

  /* ================= DERIVED STATE ================= */

  const activeWhatsapp = useMemo(
    () => whatsapps.find((w) => w.isActive) || null,
    [whatsapps],
  );
  const inactiveWhatsapps = useMemo(
    () => whatsapps.filter((w) => !w.isActive),
    [whatsapps],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(whatsapps.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);

  const paginatedWhatsapps = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return whatsapps.slice(start, start + ITEMS_PER_PAGE);
  }, [whatsapps, safePage]);

  /* ================= HANDLERS ================= */

  const openModal = (mode: "add" | "edit", item?: WhatsAppData) => {
    setModalMode(mode);
    setPhoneNumber(
      mode === "edit" && item ? formatLocalNumber(item.phoneNumber) : "",
    );
    setIsModalOpen(true);
  };

  const handleSavePhone = async () => {
    if (!phoneNumber.trim()) {
      showToast.error("Nomor WhatsApp wajib diisi");
      return;
    }
    if (!validatePhoneNumber(phoneNumber)) {
      showToast.error(
        "Format nomor harus diawali 08 dan terdiri dari 10–13 digit",
      );
      return;
    }

    const toastId = showToast.loading("Menyimpan nomor WhatsApp...");
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
        throw new Error(result?.message || "Gagal menyimpan nomor");
      }

      showToast.updateSuccess(toastId, "Nomor WhatsApp berhasil diperbarui");
      setIsModalOpen(false);
      await fetchWhatsapps(true);
    } catch (err) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal menyimpan nomor",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const toastId = showToast.loading("Menghapus nomor WhatsApp...");

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/whatsapp/${deleteTarget._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result?.message || "Gagal menghapus nomor");
      }

      showToast.updateSuccess(toastId, "Nomor WhatsApp berhasil dihapus");
      setDeleteTarget(null);
      await fetchWhatsapps(true);
    } catch (err) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal menghapus nomor",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReconnect = async () => {
    const toastId = showToast.loading("Menghubungkan ulang sesi WhatsApp...");
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE}/whatsapp/reconnect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchQR();
      showToast.updateSuccess(toastId, "Permintaan koneksi ulang dikirim");
    } catch {
      showToast.updateError(toastId, "Gagal menghubungkan ulang WhatsApp");
    }
  };

  const handleSelectGroup = async (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    const toastId = showToast.loading("Menyimpan grup WhatsApp...");
    try {
      setIsSavingGroup(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/whatsapp/set-group`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupId: group.id,
          groupName: group.name,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result?.success) {
        throw new Error(result?.message || "Gagal memilih grup");
      }

      setActiveGroupId(group.id);
      setWhatsapps((prev) =>
        prev.map((w) =>
          w.isActive ? { ...w, groupId: group.id, groupName: group.name } : w,
        ),
      );
      showToast.updateSuccess(toastId, `Grup "${group.name}" berhasil dipilih`);
    } catch (err) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal memilih grup",
      );
    } finally {
      setIsSavingGroup(false);
    }
  };

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(formatLocalNumber(num));
    showToast.success("Nomor WhatsApp disalin ke clipboard");
  };

  /* ================= RENDER ================= */

  if (loading) {
    return (
      <TablePageSkeleton
        title="Manajemen WhatsApp"
        subtitle="Memuat daftar nomor WhatsApp dan status koneksi gateway..."
        columnsCount={6}
        rowsCount={6}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ================= PAGE HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Manajemen WhatsApp
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola nomor WhatsApp bubble chat website, grup notifikasi, dan
            koneksi gateway QR
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => fetchWhatsapps(true)}
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
            onClick={() => openModal("add")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-linear-to-r from-[#0284c7] to-blue-700 hover:from-[#0369a1] hover:to-blue-800 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Nomor Baru
          </button>
        </div>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Nomor
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tabular-nums">
              {whatsapps.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Nomor yang pernah dikonfigurasi
            </p>
          </div>
          <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400">
            <MessageCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Nomor Aktif
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
              {activeWhatsapp ? 1 : 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Digunakan pada landing page
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Riwayat Nonaktif
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#0284c7] dark:text-sky-400 mt-1 tabular-nums">
              {inactiveWhatsapps.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Arsip nomor sebelumnya
            </p>
          </div>
          <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400">
            <History className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ================= ACTIVE WHATSAPP CARD ================= */}
      {activeWhatsapp && (
        <div className="rounded-2xl p-6 bg-linear-to-r from-emerald-600 to-teal-600 text-white shadow-sm space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <FaWhatsapp className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-wider">
                    AKTIF • PRIMARY
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {formatDisplayNumber(activeWhatsapp.phoneNumber)}
                </h2>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-white/85 mt-2">
                  <span className="inline-flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    Diperbarui oleh: {activeWhatsapp.updatedBy?.name || "System"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDateTime(activeWhatsapp.updatedAt)}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopyNumber(activeWhatsapp.phoneNumber)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-700 hover:bg-emerald-50 text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer shrink-0"
            >
              <Copy className="w-4 h-4" />
              Salin Nomor
            </button>
          </div>

          {groups.length > 0 && waStatus === "connected" && (
            <div className="rounded-xl bg-white/15 p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-white">
                  Grup Notifikasi WhatsApp Aktif
                </label>
                {isSavingGroup && (
                  <span className="text-xs text-white/80">Menyimpan...</span>
                )}
              </div>
              <select
                value={activeGroupId}
                onChange={(e) => handleSelectGroup(e.target.value)}
                disabled={isSavingGroup}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none"
              >
                <option value="">-- Pilih Grup WhatsApp --</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.participants} anggota)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* ================= TABLE + QR LAYOUT ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#0284c7]" />
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                Riwayat Nomor WhatsApp
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {whatsapps.length} nomor
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4">Nomor WhatsApp</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4">Grup</th>
                  <th className="py-3.5 px-4">Diperbarui Oleh</th>
                  <th className="py-3.5 px-4">Update Terakhir</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedWhatsapps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <MessageCircle className="w-9 h-9 opacity-40" />
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                          Belum ada nomor WhatsApp tersimpan
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedWhatsapps.map((wa) => (
                    <tr
                      key={wa._id}
                      className="hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              wa.isActive
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                                : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                            }`}
                          >
                            <Phone className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
                              {formatDisplayNumber(wa.phoneNumber)}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {formatInternational(wa.phoneNumber)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            wa.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                              : "bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                          }`}
                        >
                          {wa.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300 max-w-36 truncate">
                        {wa.groupName || "-"}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                        {wa.updatedBy?.name || "Unknown"}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                        {formatDateTime(wa.updatedAt)}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openModal("edit", wa)}
                            aria-label="Edit nomor WhatsApp"
                            className="p-2 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0284c7] dark:bg-sky-950/60 dark:text-sky-300 transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {!wa.isActive && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(wa)}
                              aria-label="Hapus nomor WhatsApp"
                              className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <PaginationFooter
            currentPage={safePage}
            totalItems={whatsapps.length}
            itemsPerPage={ITEMS_PER_PAGE}
            itemLabel="nomor"
            onPageChange={setCurrentPage}
          />
        </div>

        {/* QR CONNECTION SECTION */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#0284c7]" />
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                Koneksi Gateway
              </h3>
            </div>
            <button
              type="button"
              onClick={handleReconnect}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0284c7] hover:bg-sky-700 text-white transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reconnect
            </button>
          </div>

          {waStatus === "connected" ? (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                  WhatsApp Terhubung
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Gateway siap mengirim notifikasi sistem
                </p>
              </div>
            </div>
          ) : qr ? (
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <QRCodeSVG
                  value={qr}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Pindai QR ini melalui perangkat tertaut di aplikasi WhatsApp
                Admin
              </p>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              Menunggu QR code dari gateway WhatsApp...
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/60 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#0284c7] shrink-0 mt-0.5" />
            <span>
              Hanya satu nomor utama yang dapat aktif pada satu waktu. Nomor
              baru otomatis menggantikan nomor aktif sebelumnya.
            </span>
          </div>
        </div>
      </div>

      {/* ================= ADD / EDIT MODAL ================= */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => !submitting && setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-linear-to-r from-[#0284c7] to-blue-700 text-white flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold">
                  {modalMode === "add"
                    ? "Tambah Nomor WhatsApp"
                    : "Edit Nomor WhatsApp"}
                </h2>
                <p className="text-xs text-sky-100">
                  Gunakan format awalan 08 (10–13 digit)
                </p>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/15"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Nomor WhatsApp
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) =>
                    setPhoneNumber(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="081234567890"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                  autoFocus
                />
              </div>

              {phoneNumber && validatePhoneNumber(phoneNumber) && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                      Pratinjau Format Internasional
                    </p>
                    <p className="text-sm font-extrabold text-emerald-800 dark:text-emerald-200">
                      +62{phoneNumber.substring(1)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSavePhone}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#0284c7] hover:bg-sky-700 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {submitting ? "Menyimpan..." : "Simpan Nomor"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRM MODAL ================= */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-60 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => !submitting && setDeleteTarget(null)}
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
                  Hapus Nomor WhatsApp?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                  Nomor{" "}
                  <strong className="text-slate-900 dark:text-white">
                    {formatDisplayNumber(deleteTarget.phoneNumber)}
                  </strong>{" "}
                  akan dihapus permanen dari riwayat sistem.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer disabled:opacity-60"
              >
                {submitting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
