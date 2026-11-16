"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Search,
  X,
  XCircle,
} from "lucide-react";
import AdminLaporanAkhirModal, {
  type AdminLaporanAkhirItem,
} from "@/components/admin/AdminLaporanAkhirModal";
import PaginationFooter from "@/components/dashboard/PaginationFooter";
import { TablePageSkeleton } from "@/components/dashboard/skeletons";
import { showToast } from "@/components/ui/toastDashboard";

/* ================= TYPES ================= */

type FilterTab = "Semua" | "Menunggu" | "Disetujui" | "Revisi" | "Ditolak";

/* ================= CONSTANTS ================= */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const ITEMS_PER_PAGE = 10;

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

function getStatusBadge(status: string) {
  switch (status) {
    case "Disetujui":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
    case "Ditolak":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800";
    case "Revisi":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
    default:
      return "bg-sky-50 text-[#0284c7] border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800";
  }
}

/* ================= COMPONENT ================= */

export default function ViewLaporanAkhirSuperadminPage() {
  const [laporanList, setLaporanList] = useState<AdminLaporanAkhirItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState({ pdf: false, excel: false });

  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("Semua");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedLaporan, setSelectedLaporan] =
    useState<AdminLaporanAkhirItem | null>(null);

  const deepLinkHandledRef = useRef(false);

  /* ================= FETCH ================= */

  const loadData = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/superadmin/laporan-akhir`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Gagal memuat laporan akhir");
      }

      const json = await res.json();
      setLaporanList(Array.isArray(json) ? json : []);
    } catch {
      showToast.error("Gagal memuat data laporan akhir");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ================= DEEP LINK ?email= ================= */

  useEffect(() => {
    if (deepLinkHandledRef.current || laporanList.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email")?.trim().toLowerCase();
    if (!emailParam) {
      deepLinkHandledRef.current = true;
      return;
    }

    deepLinkHandledRef.current = true;
    setSearch(emailParam);
    const match = laporanList.find(
      (l) => l.user?.email?.trim().toLowerCase() === emailParam,
    );
    if (match) {
      setSelectedLaporan(match);
    }
  }, [laporanList]);

  /* ================= STATS & FILTERING ================= */

  const stats = useMemo(() => {
    const counts: Record<FilterTab, number> = {
      Semua: laporanList.length,
      Menunggu: 0,
      Disetujui: 0,
      Revisi: 0,
      Ditolak: 0,
    };
    let ratedCount = 0;

    for (const item of laporanList) {
      if (item.status === "Disetujui") counts.Disetujui += 1;
      else if (item.status === "Revisi") counts.Revisi += 1;
      else if (item.status === "Ditolak") counts.Ditolak += 1;
      else counts.Menunggu += 1;

      if (item.penilaian && Object.values(item.penilaian).some(Boolean)) {
        ratedCount += 1;
      }
    }

    return { counts, ratedCount };
  }, [laporanList]);

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();

    return laporanList.filter((item) => {
      if (filterTab !== "Semua") {
        const normalized =
          item.status === "Disetujui" ||
          item.status === "Revisi" ||
          item.status === "Ditolak"
            ? item.status
            : "Menunggu";
        if (normalized !== filterTab) return false;
      }

      if (!q) return true;
      return (
        item.user?.name?.toLowerCase().includes(q) ||
        item.user?.email?.toLowerCase().includes(q) ||
        item.judul?.toLowerCase().includes(q) ||
        item.approvedByMentor?.name?.toLowerCase().includes(q)
      );
    });
  }, [laporanList, search, filterTab]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredList.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);

  const paginatedList = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredList.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredList, safePage]);

  /* ================= EXPORTS ================= */

  const handleDownloadAllPDF = async () => {
    if (laporanList.length === 0) {
      showToast.error("Tidak ada laporan untuk diunduh");
      return;
    }

    setDownloading((prev) => ({ ...prev, pdf: true }));
    const toastId = showToast.loading("Menyiapkan laporan PDF...");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/superadmin/laporan-akhir/download-all-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            laporanList,
            totalPeserta: laporanList.length,
            date: new Date().toISOString(),
          }),
        },
      );

      if (!res.ok) throw new Error("Gagal mengunduh PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laporan-akhir-all-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      showToast.updateSuccess(toastId, "Laporan PDF berhasil diunduh");
    } catch {
      showToast.updateError(toastId, "Gagal mengunduh PDF");
    } finally {
      setDownloading((prev) => ({ ...prev, pdf: false }));
    }
  };

  const handleDownloadAllExcel = async () => {
    if (laporanList.length === 0) {
      showToast.error("Tidak ada laporan untuk diunduh");
      return;
    }

    setDownloading((prev) => ({ ...prev, excel: true }));
    const toastId = showToast.loading("Menyiapkan laporan Excel...");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/superadmin/laporan-akhir/download-all-excel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            laporanList,
            pesertaLaporan: laporanList.map((l) => ({
              _id: l.user?._id || l._id,
              name: l.user?.name || "-",
              email: l.user?.email || "-",
              status: l.status,
              judul: l.judul,
              createdAt: l.createdAt,
            })),
            date: new Date().toISOString(),
          }),
        },
      );

      if (!res.ok) throw new Error("Gagal mengunduh Excel");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laporan-akhir-all-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      showToast.updateSuccess(toastId, "Laporan Excel berhasil diunduh");
    } catch {
      showToast.updateError(toastId, "Gagal mengunduh Excel");
    } finally {
      setDownloading((prev) => ({ ...prev, excel: false }));
    }
  };

  /* ================= RENDER ================= */

  if (loading) {
    return (
      <TablePageSkeleton
        title="Laporan Akhir Peserta"
        subtitle="Memuat daftar laporan akhir dan penilaian mentor..."
        columnsCount={6}
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
            Laporan Akhir Peserta
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tinjau dokumen laporan akhir magang, hasil penilaian mentor, serta
            ekspor rekapitulasi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-60"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <button
            type="button"
            disabled={downloading.excel}
            onClick={handleDownloadAllExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition disabled:opacity-60"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            {downloading.excel ? "Menyiapkan..." : "Rekap Excel"}
          </button>

          <button
            type="button"
            disabled={downloading.pdf}
            onClick={handleDownloadAllPDF}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white shadow-xs transition disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5" />
            {downloading.pdf ? "Menyiapkan..." : "Rekap PDF"}
          </button>
        </div>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl p-5 bg-linear-to-br from-[#0284c7] to-blue-700 text-white shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-sky-100">
                Total Laporan Akhir
              </p>
              <p className="text-3xl font-extrabold tracking-tight mt-2">
                {stats.counts.Semua}
              </p>
              <p className="text-[11px] text-sky-100 mt-1.5">
                {stats.ratedCount} laporan sudah memiliki penilaian
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Menunggu Review Mentor
              </p>
              <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight mt-2">
                {stats.counts.Menunggu}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Belum disetujui atau ditolak
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
                Disetujui
              </p>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mt-2">
                {stats.counts.Disetujui}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Laporan akhir diterima
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Revisi / Ditolak
              </p>
              <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight mt-2">
                {stats.counts.Revisi + stats.counts.Ditolak}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                {stats.counts.Revisi} revisi • {stats.counts.Ditolak} ditolak
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
          {(
            ["Semua", "Menunggu", "Disetujui", "Revisi", "Ditolak"] as FilterTab[]
          ).map((tab) => {
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
                  {stats.counts[tab]}
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
            placeholder="Cari nama peserta, judul, atau mentor..."
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
                <th className="py-3.5 px-4">Judul Laporan</th>
                <th className="py-3.5 px-4">Tanggal Unggah</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {paginatedList.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-14 px-4 text-center text-slate-500 dark:text-slate-400"
                  >
                    <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-200">
                      Tidak ada laporan akhir yang sesuai
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedList.map((item, idx) => {
                  const rowNo = (safePage - 1) * ITEMS_PER_PAGE + idx + 1;
                  const hasPenilaian = Boolean(
                    item.penilaian &&
                      Object.values(item.penilaian).some(Boolean),
                  );

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {rowNo}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#0284c7] to-blue-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {getInitials(item.user?.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {item.user?.name || "Tanpa Nama"}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {item.user?.email || "-"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {item.judul ||
                            item.fileName ||
                            "Laporan Akhir Magang"}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span>
                            Mentor:{" "}
                            {item.approvedByMentor?.name || "Belum direview"}
                          </span>
                          {hasPenilaian && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 font-semibold">
                              Sudah Dinilai
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                        {new Date(item.createdAt).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${getStatusBadge(
                            item.status,
                          )}`}
                        >
                          {item.status || "Menunggu"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedLaporan(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white shadow-xs transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detail
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
          totalItems={filteredList.length}
          itemsPerPage={ITEMS_PER_PAGE}
          itemLabel="laporan akhir"
          onPageChange={setCurrentPage}
        />
      </div>

      {/* ================= MODAL ================= */}
      {selectedLaporan && (
        <AdminLaporanAkhirModal
          laporan={selectedLaporan}
          onClose={() => setSelectedLaporan(null)}
        />
      )}
    </div>
  );
}
