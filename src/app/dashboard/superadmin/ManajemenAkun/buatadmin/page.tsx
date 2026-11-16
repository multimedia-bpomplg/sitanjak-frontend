"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Eye,
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import PaginationFooter from "@/components/dashboard/PaginationFooter";
import { TablePageSkeleton } from "@/components/dashboard/skeletons";
import { showToast } from "@/components/ui/toastDashboard";

/* ================= TYPES ================= */

type AdminAkun = {
  _id: string;
  name: string;
  email: string;
  status: "Aktif" | "Nonaktif";
  isSuperAccess: boolean;
  periode: string;
};

type FilterTab = "Semua" | "Aktif" | "Nonaktif";

/* ================= CONSTANTS & HELPERS ================= */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const ITEMS_PER_PAGE = 10;

function generateStrongPassword(length = 10): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const all = upper + lower + digits;

  let pwd =
    upper[Math.floor(Math.random() * upper.length)] +
    lower[Math.floor(Math.random() * lower.length)] +
    digits[Math.floor(Math.random() * digits.length)];

  while (pwd.length < length) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }
  return pwd;
}

function getInitials(name = "A"): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "A"
  );
}

/* ================= PAGE ================= */

export default function BuatAkunAdminSuperadminPage() {
  const [data, setData] = useState<AdminAkun[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("Semua");
  const [currentPage, setCurrentPage] = useState(1);

  /* ---------- Create Modal State ---------- */
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  /* ---------- Detail & Confirm Modals ---------- */
  const [selected, setSelected] = useState<AdminAkun | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<{
    admin: AdminAkun;
    targetStatus: "Aktif" | "Nonaktif";
  } | null>(null);
  const [confirmSuperAccess, setConfirmSuperAccess] = useState<{
    admin: AdminAkun;
    targetValue: boolean;
  } | null>(null);
  const [toggling, setToggling] = useState(false);

  /* ================= FETCH ================= */

  const fetchAdmin = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await fetch(`${API_BASE}/superadmin/admin`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result?.message || "Gagal memuat data akun admin");
      }

      const mapped: AdminAkun[] = (Array.isArray(result) ? result : []).map(
        (item: {
          _id: string;
          name: string;
          email: string;
          status?: "Aktif" | "Nonaktif";
          isSuperAccess?: boolean;
          periode?: string;
          createdAt?: string;
        }) => ({
          _id: item._id,
          name: item.name,
          email: item.email,
          status: item.status === "Nonaktif" ? "Nonaktif" : "Aktif",
          isSuperAccess: Boolean(item.isSuperAccess),
          periode:
            item.periode ||
            (item.createdAt
              ? new Date(item.createdAt).getFullYear().toString()
              : "-"),
        }),
      );

      setData(mapped);
    } catch (err) {
      showToast.error(
        err instanceof Error ? err.message : "Gagal memuat data akun admin",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmin();
  }, [fetchAdmin]);

  /* ================= QUERY PREFILL (SAFE) ================= */

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");
    const name = params.get("name");

    if (email && name) {
      setForm({
        name,
        email,
        password: generateStrongPassword(10),
      });
      setOpenCreate(true);
    }
  }, []);

  /* ================= ESCAPE KEY HANDLER ================= */

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (confirmSuperAccess && !toggling) setConfirmSuperAccess(null);
      else if (confirmToggle && !toggling) setConfirmToggle(null);
      else if (openCreate && !creating) setOpenCreate(false);
      else if (selected) setSelected(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmSuperAccess, confirmToggle, toggling, openCreate, creating, selected]);

  /* ================= STATS & FILTERING ================= */

  const stats = useMemo(() => {
    const aktif = data.filter((a) => a.status === "Aktif").length;
    const nonaktif = data.filter((a) => a.status === "Nonaktif").length;
    const superAccessCount = data.filter((a) => a.isSuperAccess).length;

    return {
      Semua: data.length,
      Aktif: aktif,
      Nonaktif: nonaktif,
      SuperAccess: superAccessCount,
    };
  }, [data]);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();

    return data.filter((item) => {
      if (filterTab !== "Semua" && item.status !== filterTab) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.periode.toLowerCase().includes(q)
      );
    });
  }, [data, search, filterTab]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredData.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, safePage]);

  /* ================= ACTIONS ================= */

  const handleOpenCreate = () => {
    setForm({
      name: "",
      email: "",
      password: generateStrongPassword(10),
    });
    setOpenCreate(true);
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      showToast.error("Nama, email, dan password wajib diisi");
      return;
    }

    try {
      setCreating(true);
      const res = await fetch(`${API_BASE}/superadmin/buat-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password.trim(),
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result?.message || "Gagal membuat akun admin");
      }

      showToast.success("Akun admin berhasil dibuat & email terkirim");
      setOpenCreate(false);
      setForm({ name: "", email: "", password: "" });
      await fetchAdmin(true);
    } catch (err) {
      showToast.error(
        err instanceof Error ? err.message : "Gagal membuat akun admin",
      );
    } finally {
      setCreating(false);
    }
  };

  const executeToggleStatus = async () => {
    if (!confirmToggle) return;
    const { admin, targetStatus } = confirmToggle;
    const actionSegment = targetStatus === "Nonaktif" ? "nonaktif" : "aktif";
    const toastId = showToast.loading(
      targetStatus === "Nonaktif"
        ? "Menonaktifkan akun admin..."
        : "Mengaktifkan akun admin...",
    );

    try {
      setToggling(true);
      const res = await fetch(
        `${API_BASE}/superadmin/admin/${admin._id}/${actionSegment}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const result = await res.json();
      if (!res.ok) {
        throw new Error(
          result?.message || "Gagal memperbarui status akun admin",
        );
      }

      setData((prev) =>
        prev.map((a) =>
          a._id === admin._id ? { ...a, status: targetStatus } : a,
        ),
      );
      setSelected((prev) =>
        prev && prev._id === admin._id
          ? { ...prev, status: targetStatus }
          : prev,
      );

      showToast.updateSuccess(
        toastId,
        targetStatus === "Nonaktif"
          ? "Akun admin berhasil dinonaktifkan"
          : "Akun admin berhasil diaktifkan",
      );
      setConfirmToggle(null);
      setSelected(null);
    } catch (err) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Terjadi kesalahan server",
      );
    } finally {
      setToggling(false);
    }
  };

  const executeToggleSuperAccess = async () => {
    if (!confirmSuperAccess) return;
    const { admin, targetValue } = confirmSuperAccess;
    const toastId = showToast.loading(
      targetValue
        ? "Mengaktifkan Super Access..."
        : "Menonaktifkan Super Access...",
    );

    try {
      setToggling(true);
      const res = await fetch(
        `${API_BASE}/superadmin/admin/${admin._id}/super-access`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ isSuperAccess: targetValue }),
        },
      );

      const result = await res.json();
      if (!res.ok) {
        throw new Error(
          result?.message || "Gagal memperbarui hak akses admin",
        );
      }

      setData((prev) =>
        prev.map((a) =>
          a._id === admin._id ? { ...a, isSuperAccess: targetValue } : a,
        ),
      );
      setSelected((prev) =>
        prev && prev._id === admin._id
          ? { ...prev, isSuperAccess: targetValue }
          : prev,
      );

      showToast.updateSuccess(
        toastId,
        result?.message ||
          `Super Access berhasil ${targetValue ? "diaktifkan" : "dinonaktifkan"}`,
      );
      setConfirmSuperAccess(null);
    } catch (err) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Terjadi kesalahan server",
      );
    } finally {
      setToggling(false);
    }
  };

  /* ================= RENDER ================= */

  if (loading) {
    return (
      <TablePageSkeleton
        title="Manajemen Akun Admin"
        subtitle="Memuat daftar akun admin sistem..."
        columnsCount={6}
        rowsCount={7}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ================= PAGE HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Manajemen Akun Admin
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Buat akun admin baru, atur status aktivasi, serta kelola izin Super
            Access
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => fetchAdmin(true)}
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
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-linear-to-r from-[#0284c7] to-blue-700 hover:from-[#0369a1] hover:to-blue-800 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Buat Akun Admin
          </button>
        </div>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Admin
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tabular-nums">
              {stats.Semua}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Seluruh admin terdaftar
            </p>
          </div>
          <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Admin Aktif
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
              {stats.Aktif}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Dapat mengakses dashboard admin
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Admin Nonaktif
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-1 tabular-nums">
              {stats.Nonaktif}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Akses akun dinonaktifkan
            </p>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            <XCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Super Access
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#0284c7] dark:text-sky-400 mt-1 tabular-nums">
              {stats.SuperAccess}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Admin dengan hak akses khusus
            </p>
          </div>
          <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ================= FILTER TABS & SEARCH ================= */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {(["Semua", "Aktif", "Nonaktif"] as FilterTab[]).map((tab) => {
              const active = filterTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setFilterTab(tab);
                    setCurrentPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    active
                      ? "bg-[#0284c7] text-white shadow-2xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700"
                  }`}
                >
                  <span>{tab}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {stats[tab]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama, email, atau periode..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
            />
          </div>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4 text-center w-12">No</th>
                <th className="py-3.5 px-4">Admin</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4 text-center">Periode</th>
                <th className="py-3.5 px-4 text-center">Super Access</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Users className="w-10 h-10 opacity-40" />
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                        Belum ada akun admin yang sesuai
                      </p>
                      <p className="text-xs">
                        Ubah filter/pencarian atau buat akun admin baru
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => (
                  <tr
                    key={item._id}
                    className="hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-400 tabular-nums">
                      {(safePage - 1) * ITEMS_PER_PAGE + idx + 1}
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => setSelected(item)}
                        className="flex items-center gap-3 text-left group cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#0284c7] to-blue-700 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition">
                          {getInitials(item.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-[#0284c7] dark:group-hover:text-sky-400 truncate max-w-52 transition">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Klik untuk detail
                          </p>
                        </div>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                      {item.email}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <Calendar className="w-3 h-3" />
                        {item.periode}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {item.isSuperAccess ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-[#0284c7] border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                          Standar
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          item.status === "Aktif"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                            : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.status === "Aktif"
                              ? "bg-emerald-500"
                              : "bg-rose-500"
                          }`}
                        />
                        {item.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelected(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-[#0284c7] border border-sky-200 dark:bg-sky-950/50 dark:hover:bg-sky-900/60 dark:text-sky-300 dark:border-sky-800 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <PaginationFooter
          currentPage={safePage}
          totalItems={filteredData.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
          itemLabel="admin"
        />
      </div>

      {/* ================= MODAL BUAT AKUN ADMIN ================= */}
      {openCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => !creating && setOpenCreate(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-linear-to-r from-[#0284c7] via-sky-600 to-blue-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5" />
                <div>
                  <h2 className="text-base font-extrabold">Buat Akun Admin</h2>
                  <p className="text-xs text-sky-100">
                    Kredensial akan dikirimkan ke email admin
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={creating}
                onClick={() => setOpenCreate(false)}
                className="p-1.5 rounded-lg hover:bg-white/15 transition disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Nama Lengkap Admin
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Email Admin
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="admin@bpom.go.id"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Password Akun
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      placeholder="Password"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm font-mono bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({ ...form, password: generateStrongPassword(10) })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-[#0284c7] border border-sky-200 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 dark:text-sky-300 dark:border-sky-800 transition cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={creating}
                onClick={() => setOpenCreate(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={creating}
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-linear-to-r from-[#0284c7] to-blue-700 hover:from-[#0369a1] hover:to-blue-800 shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {creating ? "Menyimpan..." : "Buat Akun"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DETAIL ADMIN ================= */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-linear-to-r from-[#0284c7] via-sky-600 to-blue-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                  {getInitials(selected.name)}
                </div>
                <div>
                  <h2 className="text-base font-extrabold">{selected.name}</h2>
                  <p className="text-xs text-sky-100">{selected.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg hover:bg-white/15 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Periode Terdaftar
                </p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1">
                  {selected.periode}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Hak Super Access
                  </p>
                  <p
                    className={`text-sm font-bold mt-1 ${
                      selected.isSuperAccess
                        ? "text-[#0284c7] dark:text-sky-400"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {selected.isSuperAccess ? "Aktif (Khusus)" : "Standar"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setConfirmSuperAccess({
                      admin: selected,
                      targetValue: !selected.isSuperAccess,
                    })
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selected.isSuperAccess
                      ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                      : "bg-sky-50 hover:bg-sky-100 text-[#0284c7] border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800"
                  }`}
                >
                  {selected.isSuperAccess ? (
                    <>
                      <ShieldOff className="w-3.5 h-3.5" />
                      Cabut Akses
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Beri Super Access
                    </>
                  )}
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Status Akun
                  </p>
                  <p
                    className={`text-sm font-bold mt-1 ${
                      selected.status === "Aktif"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {selected.status}
                  </p>
                </div>
                <span
                  className={`w-3 h-3 rounded-full ${
                    selected.status === "Aktif"
                      ? "bg-emerald-500"
                      : "bg-rose-500"
                  }`}
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition"
              >
                Tutup
              </button>

              {selected.status === "Aktif" ? (
                <button
                  type="button"
                  onClick={() =>
                    setConfirmToggle({
                      admin: selected,
                      targetStatus: "Nonaktif",
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  Nonaktifkan Akun
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setConfirmToggle({
                      admin: selected,
                      targetStatus: "Aktif",
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Aktifkan Akun
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= CONFIRM STATUS TOGGLE ================= */}
      {confirmToggle && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs"
          onClick={() => !toggling && setConfirmToggle(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  confirmToggle.targetStatus === "Nonaktif"
                    ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600"
                    : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600"
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {confirmToggle.targetStatus === "Nonaktif"
                    ? "Nonaktifkan Akun Admin?"
                    : "Aktifkan Akun Admin?"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Anda yakin ingin{" "}
                  {confirmToggle.targetStatus === "Nonaktif"
                    ? "menonaktifkan"
                    : "mengaktifkan kembali"}{" "}
                  akun <strong>{confirmToggle.admin.name}</strong> (
                  {confirmToggle.admin.email})?
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={toggling}
                onClick={() => setConfirmToggle(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={toggling}
                onClick={executeToggleStatus}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition cursor-pointer disabled:opacity-50 ${
                  confirmToggle.targetStatus === "Nonaktif"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {toggling
                  ? "Memproses..."
                  : confirmToggle.targetStatus === "Nonaktif"
                    ? "Ya, Nonaktifkan"
                    : "Ya, Aktifkan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CONFIRM SUPER ACCESS TOGGLE ================= */}
      {confirmSuperAccess && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs"
          onClick={() => !toggling && setConfirmSuperAccess(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl shrink-0 bg-sky-100 dark:bg-sky-950/60 text-[#0284c7]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {confirmSuperAccess.targetValue
                    ? "Aktifkan Super Access?"
                    : "Cabut Super Access?"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {confirmSuperAccess.targetValue
                    ? `Admin ${confirmSuperAccess.admin.name} akan mendapatkan izin Super Access pada akunnya.`
                    : `Admin ${confirmSuperAccess.admin.name} akan dikembalikan ke hak akses standar.`}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={toggling}
                onClick={() => setConfirmSuperAccess(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={toggling}
                onClick={executeToggleSuperAccess}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-linear-to-r from-[#0284c7] to-blue-700 hover:from-[#0369a1] hover:to-blue-800 transition cursor-pointer disabled:opacity-50"
              >
                {toggling ? "Memproses..." : "Ya, Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
