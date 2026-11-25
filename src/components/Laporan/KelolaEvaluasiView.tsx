"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileSignature,
  RefreshCw,
  RotateCcw,
  Search,
  Users,
} from "lucide-react";
import EvaluasiReviewModal, {
  type EvaluasiStatus,
  type ManageEvaluasiItem,
} from "@/components/Laporan/EvaluasiReviewModal";
import PaginationFooter from "@/components/dashboard/PaginationFooter";
import { TablePageSkeleton } from "@/components/dashboard/skeletons";
import { showToast } from "@/components/ui/toastDashboard";
import { downloadEvaluasiDanPernyataanPdf } from "@/lib/evaluasiPdf";
import { isPkpaPeserta } from "@/lib/pesertaKategori";

const ITEMS_PER_PAGE = 10;

type ManageRole = "mentor" | "admin" | "superadmin";
type FilterTab = "semua" | "menunggu" | "revisi" | "disetujui" | "belum";

type Props = {
  role: ManageRole;
};

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

function formatDateShort(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusBadge(status?: EvaluasiStatus | null): string {
  switch (status) {
    case "Disetujui":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
    case "Revisi":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800";
    case "Menunggu":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  }
}

export default function KelolaEvaluasiView({ role }: Props) {
  const isAdminScope = role === "admin" || role === "superadmin";

  const [items, setItems] = useState<ManageEvaluasiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("semua");
  const [mentorFilter, setMentorFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const [selectedItem, setSelectedItem] = useState<ManageEvaluasiItem | null>(
    null,
  );

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/evaluasi/manage`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(
          errJson?.message ||
            "Gagal memuat daftar evaluasi & surat pernyataan peserta",
        );
      }

      const json = await res.json();
      setItems(Array.isArray(json?.items) ? json.items : []);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat data dari server",
      );
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, activeFilter, mentorFilter]);

  const mentorOptions = useMemo(() => {
    const names = Array.from(
      new Set(
        items
          .map((i) => i.mentorName?.trim())
          .filter((name): name is string => Boolean(name && name !== "-")),
      ),
    );
    return names.sort((a, b) => a.localeCompare(b, "id"));
  }, [items]);

  const scopedItems = useMemo(() => {
    if (!isAdminScope || mentorFilter === "all") return items;
    return items.filter((i) => (i.mentorName || "").trim() === mentorFilter);
  }, [items, isAdminScope, mentorFilter]);

  const stats = useMemo(() => {
    return {
      totalPeserta: scopedItems.length,
      menunggu: scopedItems.filter((i) => i.evaluasi?.status === "Menunggu")
        .length,
      revisi: scopedItems.filter((i) => i.evaluasi?.status === "Revisi").length,
      disetujui: scopedItems.filter((i) => i.evaluasi?.status === "Disetujui")
        .length,
      belumMengisi: scopedItems.filter((i) => !i.evaluasi).length,
    };
  }, [scopedItems]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scopedItems.filter((item) => {
      if (activeFilter === "menunggu" && item.evaluasi?.status !== "Menunggu") {
        return false;
      }
      if (activeFilter === "revisi" && item.evaluasi?.status !== "Revisi") {
        return false;
      }
      if (
        activeFilter === "disetujui" &&
        item.evaluasi?.status !== "Disetujui"
      ) {
        return false;
      }
      if (activeFilter === "belum" && Boolean(item.evaluasi)) {
        return false;
      }
      if (!q) return true;
      return (
        item.nama.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.posisi.toLowerCase().includes(q) ||
        (item.asal?.nama || "").toLowerCase().includes(q) ||
        (item.mentorName || "").toLowerCase().includes(q)
      );
    });
  }, [scopedItems, activeFilter, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(page, totalPages);
  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, safePage]);

  const handleExportExcel = async () => {
    if (filteredItems.length === 0) {
      showToast.error("Tidak ada data untuk diekspor");
      return;
    }

    try {
      setExporting(true);
      const XLSX = await import("xlsx");
      const rows = filteredItems.map((item, idx) => {
        const ev = item.evaluasi;
        return {
          No: idx + 1,
          Nama_Peserta: item.nama,
          Email: item.email,
          Kategori: isPkpaPeserta(item) ? "PKPA" : "Reguler",
          Asal_Instansi: item.asal?.nama || "-",
          Unit_Kerja: item.posisi,
          Mentor: item.mentorName || "-",
          Status: ev ? ev.status : "Belum Mengisi",
          Fasilitator_Nama: ev?.fasilitator?.nama || "-",
          Fasilitator_Skor_1: ev?.fasilitator?.skor1 ?? "-",
          Fasilitator_Skor_2: ev?.fasilitator?.skor2 ?? "-",
          Fasilitator_Skor_3: ev?.fasilitator?.skor3 ?? "-",
          Fasilitator_Skor_4: ev?.fasilitator?.skor4 ?? "-",
          Fasilitator_Skor_5: ev?.fasilitator?.skor5 ?? "-",
          Saran_Fasilitator: ev?.fasilitator?.saran || "-",
          Penyelenggara_Skor_1: ev?.penyelenggara?.skor1 ?? "-",
          Penyelenggara_Skor_2: ev?.penyelenggara?.skor2 ?? "-",
          Penyelenggara_Skor_3: ev?.penyelenggara?.skor3 ?? "-",
          Penyelenggara_Skor_4: ev?.penyelenggara?.skor4 ?? "-",
          Penyelenggara_Skor_5: ev?.penyelenggara?.skor5 ?? "-",
          Bermanfaat: ev?.penyelenggara?.bermanfaat || "-",
          Masukan_Penyelenggara: ev?.penyelenggara?.masukan || "-",
          NIM_NISN: ev?.suratPernyataan?.nim || "-",
          Program_Pendidikan: ev?.suratPernyataan?.programPendidikan || "-",
          Catatan_Review: ev?.mentorNote || "-",
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Evaluasi & Pernyataan");
      const dateStamp = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Jakarta",
      });
      XLSX.writeFile(wb, `Rekap_Evaluasi_Surat_Pernyataan_${dateStamp}.xlsx`);
      showToast.success("Rekap Evaluasi & Surat Pernyataan berhasil diekspor");
    } catch {
      showToast.error("Gagal mengekspor data ke Excel");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <TablePageSkeleton
        title="Evaluasi & Surat Pernyataan"
        subtitle="Memuat daftar evaluasi & surat pernyataan peserta magang..."
        columnsCount={6}
        rowsCount={6}
      />
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 p-8 text-center space-y-3">
        <AlertCircle className="w-9 h-9 text-rose-500 mx-auto" />
        <p className="text-sm font-bold text-rose-800 dark:text-rose-200">
          {error}
        </p>
        <button
          type="button"
          onClick={() => fetchData()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Coba Lagi</span>
        </button>
      </div>
    );
  }

  const filterTabs: Array<{ id: FilterTab; label: string; count: number }> = [
    { id: "semua", label: "Semua", count: stats.totalPeserta },
    { id: "menunggu", label: "Menunggu", count: stats.menunggu },
    { id: "revisi", label: "Revisi", count: stats.revisi },
    { id: "disetujui", label: "Disetujui", count: stats.disetujui },
    { id: "belum", label: "Belum Mengisi", count: stats.belumMengisi },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Evaluasi &amp; Surat Pernyataan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {isAdminScope
              ? "Pantau status, unduh PDF, edit, ekspor, atau reset data Evaluasi & Surat Pernyataan peserta magang (persetujuan/revisi dilakukan oleh Mentor)."
              : "Tinjau Evaluasi & Surat Pernyataan peserta bimbingan Anda lalu berikan persetujuan atau catatan revisi."}
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 self-start lg:self-auto">
          {isAdminScope && (
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={exporting || filteredItems.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-transparent text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white whitespace-nowrap shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>{exporting ? "Mengekspor..." : "Ekspor Excel"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fetchData()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl p-5 bg-linear-to-br from-[#0284c7] to-blue-700 text-white shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-sky-100">Total Peserta</p>
              <p className="text-3xl font-extrabold tracking-tight mt-2">
                {stats.totalPeserta}
              </p>
              <p className="text-[11px] text-sky-100 mt-1.5">
                {stats.belumMengisi} belum mengisi formulir
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
                Menunggu Penindakan
              </p>
              <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight mt-2">
                {stats.menunggu}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Menunggu persetujuan mentor
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Perlu Revisi
              </p>
              <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight mt-2">
                {stats.revisi}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Dikembalikan untuk diperbaiki
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Sudah Disetujui
              </p>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mt-2">
                {stats.disetujui}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Peserta dapat mengunduh PDF
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 p-3.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {filterTabs.map((tab) => {
            const active = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {isAdminScope && mentorOptions.length > 0 && (
            <select
              value={mentorFilter}
              onChange={(e) => setMentorFilter(e.target.value)}
              className="rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40"
            >
              <option value="all">Semua Mentor</option>
              {mentorOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, instansi, unit..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40"
            />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {paginatedItems.length === 0 ? (
          <div className="py-14 px-4 text-center space-y-2">
            <FileSignature className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
              Tidak ada data peserta yang sesuai
            </p>
            <p className="text-xs text-slate-400">
              Ubah filter atau kata kunci pencarian untuk melihat data lainnya.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-800/70 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4">Peserta</th>
                  <th className="py-3.5 px-4">Asal &amp; Penempatan</th>
                  {isAdminScope && <th className="py-3.5 px-4">Mentor</th>}
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Dikirim</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedItems.map((item) => {
                  const ev = item.evaluasi;
                  const pkpa = isPkpaPeserta(item);

                  return (
                    <tr
                      key={item.email}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#0284c7] to-blue-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {getInitials(item.nama)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-slate-900 dark:text-white truncate">
                                {item.nama}
                              </p>
                              <span
                                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${
                                  pkpa
                                    ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800"
                                    : "bg-blue-50 text-[#1D64F2] border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                                }`}
                              >
                                {pkpa ? "PKPA" : "Reguler"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {item.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-xs">
                          {item.asal?.nama || "-"}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.posisi}
                        </p>
                      </td>

                      {isAdminScope && (
                        <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-200 font-medium">
                          {item.mentorName || "-"}
                        </td>
                      )}

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(
                            ev ? ev.status : null,
                          )}`}
                        >
                          {ev ? ev.status : "Belum Mengisi"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {ev ? formatDateShort(ev.submittedAt) : "-"}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {ev ? (
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {ev.status === "Disetujui" && (
                              <button
                                type="button"
                                onClick={() =>
                                  downloadEvaluasiDanPernyataanPdf(ev, {
                                    mulai: item.tanggalMulaiMagang,
                                    selesai: item.tanggalSelesaiMagang,
                                    submittedAt: ev.submittedAt,
                                    isPkpa: pkpa,
                                  })
                                }
                                title="Unduh PDF"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 transition cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">PDF</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedItem(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0284c7] hover:bg-sky-700 text-white shadow-2xs transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>
                                {isAdminScope
                                  ? "Kelola"
                                  : ev.status === "Menunggu"
                                    ? "Tindak"
                                    : "Detail"}
                              </span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Menunggu isian peserta
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <PaginationFooter
          currentPage={safePage}
          totalItems={filteredItems.length}
          itemsPerPage={ITEMS_PER_PAGE}
          itemLabel="peserta"
          onPageChange={setPage}
        />
      </div>

      {selectedItem && (
        <EvaluasiReviewModal
          item={selectedItem}
          role={role}
          onClose={() => setSelectedItem(null)}
          onUpdated={() => fetchData(true)}
        />
      )}
    </div>
  );
}
