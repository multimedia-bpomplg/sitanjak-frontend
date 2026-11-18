"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Eye,
  GraduationCap,
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import PaginationFooter from "@/components/dashboard/PaginationFooter";
import { TablePageSkeleton } from "@/components/dashboard/skeletons";
import { showToast } from "@/components/ui/toastDashboard";
import { isPkpaPeserta } from "@/lib/pesertaKategori";

/* ================= TYPES ================= */

type PesertaAkun = {
  _id: string;
  name: string;
  email: string;
  status: "Aktif" | "Nonaktif";
  periode: string;
  jurusan?: string;
  statusMagang?: string;
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

function getInitials(name = "P"): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "P"
  );
}

/* ================= PAGE ================= */

export default function BuatAkunPesertaAdminPage() {
  const router = useRouter();

  const [data, setData] = useState<PesertaAkun[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("Semua");
  const [currentPage, setCurrentPage] = useState(1);

  /* ---------- Create Modal State ---------- */
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [returnToUrl, setReturnToUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  /* ---------- Detail & Confirm Status Toggle ---------- */
  const [selected, setSelected] = useState<PesertaAkun | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<{
    peserta: PesertaAkun;
    targetStatus: "Aktif" | "Nonaktif";
  } | null>(null);
  const [toggling, setToggling] = useState(false);

  /* ================= FETCH ================= */

  const fetchPeserta = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await fetch(`${API_BASE}/admin/peserta`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result?.message || "Gagal memuat data akun peserta");
      }

      const mapped: PesertaAkun[] = (Array.isArray(result) ? result : []).map(
        (item: {
          _id: string;
          name: string;
          email: string;
          status?: "Aktif" | "Nonaktif";
          periode?: string;
          jurusan?: string;
          statusMagang?: string;
          createdAt?: string;
        }) => ({
          _id: item._id,
          name: item.name,
          email: item.email,
          status: item.status === "Nonaktif" ? "Nonaktif" : "Aktif",
          periode:
            item.periode ||
            (item.createdAt
              ? new Date(item.createdAt).getFullYear().toString()
              : "-"),
          jurusan: item.jurusan || "-",
          statusMagang: item.statusMagang || "-",
        }),
      );

      setData(mapped);
    } catch (err) {
      showToast.error(
        err instanceof Error ? err.message : "Gagal memuat data peserta",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPeserta();
  }, [fetchPeserta]);

  /* ================= QUERY PREFILL (SAFE) ================= */

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");
    const name = params.get("name");
    const returnTo = params.get("returnTo");

    if (returnTo) setReturnToUrl(returnTo);

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
      if (confirmToggle) setConfirmToggle(null);
      else if (openCreate && !creating) setOpenCreate(false);
      else if (selected) setSelected(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmToggle, openCreate, creating, selected]);

  /* ================= STATS & FILTERING ================= */

  const stats = useMemo(() => {
    const aktif = data.filter((p) => p.status === "Aktif").length;
    const nonaktif = data.filter((p) => p.status === "Nonaktif").length;

    return {
      Semua: data.length,
      Aktif: aktif,
      Nonaktif: nonaktif,
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
        (item.jurusan && item.jurusan.toLowerCase().includes(q))
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
      const res = await fetch(`${API_BASE}/admin/buat-peserta`, {
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
        throw new Error(result?.message || "Gagal membuat akun peserta");
      }

      showToast.success("Akun peserta berhasil dibuat & email terkirim");
      setOpenCreate(false);
      setForm({ name: "", email: "", password: "" });

      if (returnToUrl) {
        router.push(returnToUrl);
      } else {
        await fetchPeserta(true);
      }
    } catch (err) {
      showToast.error(
        err instanceof Error ? err.message : "Gagal membuat akun peserta",
      );
    } finally {
      setCreating(false);
    }
  };

  const executeToggleStatus = async () => {
    if (!confirmToggle) return;
    const { peserta, targetStatus } = confirmToggle;
    const actionSegment = targetStatus === "Nonaktif" ? "nonaktif" : "aktif";
    const toastId = showToast.loading(
      targetStatus === "Nonaktif"
        ? "Menonaktifkan akun peserta..."
        : "Mengaktifkan akun peserta...",
    );

    try {
      setToggling(true);
      const res = await fetch(
        `${API_BASE}/admin/peserta/${peserta._id}/${actionSegment}`,
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
          result?.message || "Gagal memperbarui status akun peserta",
        );
      }

      setData((prev) =>
        prev.map((p) =>
          p._id === peserta._id ? { ...p, status: targetStatus } : p,
        ),
      );
      setSelected((prev) =>
        prev && prev._id === peserta._id
          ? { ...prev, status: targetStatus }
          : prev,
      );

      showToast.updateSuccess(
        toastId,
        targetStatus === "Nonaktif"
          ? "Akun peserta berhasil dinonaktifkan"
          : "Akun peserta berhasil diaktifkan",
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

  /* ================= RENDER ================= */

  if (loading) {
    return (
      <TablePageSkeleton
        title="Manajemen Akun Peserta"
        subtitle="Memuat daftar akun peserta magang..."
        columnsCount={5}
        rowsCount={8}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Manajemen Akun Peserta
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola akun login peserta magang, aktif/nonaktifkan akses, dan buat
            akun manual bila diperlukan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fetchPeserta(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-60"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Tambah Akun Peserta
          </button>
        </div>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl p-5 bg-linear-to-br from-[#0284c7] to-blue-700 text-white shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-sky-100">
                Total Akun Peserta
              </p>
              <p className="text-3xl font-extrabold tracking-tight mt-2">
                {stats.Semua}
              </p>
              <p className="text-[11px] text-sky-100 mt-1.5">
                Akun terdaftar dalam sistem
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Akun Aktif
              </p>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mt-2">
                {stats.Aktif}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Dapat mengakses portal peserta
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Akun Nonaktif
              </p>
              <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight mt-2">
                {stats.Nonaktif}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Akses login dinonaktifkan
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* ================= FILTER & SEARCH ================= */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 p-3.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
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
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition inline-flex items-center gap-1.5 ${
                  active
                    ? "bg-[#0284c7] text-white shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {stats[tab]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari nama, email, atau jurusan..."
            className="w-full pl-9 pr-9 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
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

      {/* ================= TABLE ================= */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Peserta</th>
                <th className="py-3.5 px-4">Jurusan & Periode</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-14 px-4 text-center text-slate-500 dark:text-slate-400"
                  >
                    <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-200">
                      Tidak ada akun peserta yang sesuai
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((p, idx) => {
                  const rowNo = (safePage - 1) * ITEMS_PER_PAGE + idx + 1;
                  return (
                    <tr
                      key={p._id}
                      className="hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {rowNo}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#0284c7] to-blue-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {getInitials(p.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-slate-900 dark:text-white truncate">
                                {p.name}
                              </p>
                              {isPkpaPeserta(p) && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800 shrink-0">
                                  PKPA
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {p.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <div className="space-y-1">
                          <p className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
                            <GraduationCap className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                            <span>{p.jurusan || "-"}</span>
                          </p>
                          <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span>Periode {p.periode}</span>
                          </p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {p.status === "Aktif" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800">
                            <XCircle className="w-3.5 h-3.5" />
                            Nonaktif
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelected(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white shadow-xs transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Kelola
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <PaginationFooter
          currentPage={safePage}
          totalItems={filteredData.length}
          itemsPerPage={ITEMS_PER_PAGE}
          itemLabel="akun peserta"
          onPageChange={setCurrentPage}
        />
      </div>

      {/* ================= MODAL CREATE PESERTA ================= */}
      {openCreate && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !creating) setOpenCreate(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="bg-linear-to-r from-[#0284c7] to-blue-700 px-5 py-4 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">Buat Akun Peserta Baru</h3>
              <button
                type="button"
                disabled={creating}
                onClick={() => setOpenCreate(false)}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Lengkap Peserta
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nama peserta"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Peserta
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@peserta.com"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#0284c7]" />
                    Password Awal
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({ ...form, password: generateStrongPassword(10) })
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0284c7] hover:underline"
                  >
                    <Sparkles className="w-3 h-3" />
                    Generate Acak
                  </button>
                </div>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="Minimal 8 karakter (huruf & angka)"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={creating}
                  onClick={() => setOpenCreate(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={creating}
                  onClick={handleCreate}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white shadow-xs transition disabled:opacity-60"
                >
                  {creating ? "Menyimpan..." : "Buat Akun Peserta"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DETAIL AKUN ================= */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="bg-linear-to-r from-[#0284c7] to-blue-700 px-5 py-4 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">Detail Akun Peserta</h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-sm">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-400">Nama</p>
                <p className="font-bold text-slate-900 dark:text-white">
                  {selected.name}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-400">Email</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {selected.email}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-400">Jurusan & Periode</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {selected.jurusan || "-"} • Periode {selected.periode}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  Status Akun
                </span>
                <span
                  className={`text-xs font-bold ${
                    selected.status === "Aktif"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {selected.status}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Tutup
                </button>
                {selected.status === "Aktif" ? (
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmToggle({
                        peserta: selected,
                        targetStatus: "Nonaktif",
                      })
                    }
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition"
                  >
                    Nonaktifkan Akun
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmToggle({
                        peserta: selected,
                        targetStatus: "Aktif",
                      })
                    }
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
                  >
                    Aktifkan Akun
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= CONFIRM STATUS TOGGLE ================= */}
      {confirmToggle && (
        <div className="fixed inset-0 z-60 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  confirmToggle.targetStatus === "Nonaktif"
                    ? "bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
                    : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {confirmToggle.targetStatus === "Nonaktif"
                    ? "Nonaktifkan Akun Peserta?"
                    : "Aktifkan Akun Peserta?"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                  Apakah Anda yakin ingin mengubah status akun{" "}
                  <strong className="text-slate-900 dark:text-white">
                    {confirmToggle.peserta.name}
                  </strong>{" "}
                  menjadi <strong>{confirmToggle.targetStatus}</strong>?
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={toggling}
                onClick={() => setConfirmToggle(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={toggling}
                onClick={executeToggleStatus}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs disabled:opacity-60 ${
                  confirmToggle.targetStatus === "Nonaktif"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {toggling ? "Memproses..." : "Ya, Lanjutkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
