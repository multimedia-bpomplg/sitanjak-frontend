"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  GraduationCap,
  RefreshCw,
  Search,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import AdminPesertaModal, {
  PesertaDisetujuiItem,
} from "@/components/admin/AdminPesertaModal";
import PaginationFooter from "@/components/dashboard/PaginationFooter";
import { TablePageSkeleton } from "@/components/dashboard/skeletons";
import { showToast } from "@/components/ui/toastDashboard";

/* ================= TYPES & CONSTANTS ================= */

type SuratSelesaiItem = {
  email: string;
  file?: string;
  tanggalKirim?: string;
};

type FilterTab =
  | "Semua"
  | "Sedang Magang"
  | "Belum Waktu Magang"
  | "Selesai"
  | "Tanpa Mentor";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const ITEMS_PER_PAGE = 10;

function getTodayWibIso(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

function getEffectiveStatusMagang(p: PesertaDisetujuiItem): string {
  if (p.statusMagang === "Tidak Magang") return "Tidak Magang";
  if (p.tanggalMulaiMagang && p.tanggalSelesaiMagang) {
    const todayIso = getTodayWibIso();
    if (todayIso < p.tanggalMulaiMagang) return "Belum Waktu Magang";
    if (todayIso <= p.tanggalSelesaiMagang) return "Sedang Magang";
    return "Selesai";
  }
  return p.statusMagang || "Menunggu";
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "Sedang Magang":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
    case "Belum Waktu Magang":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
    case "Selesai":
      return "bg-sky-50 text-[#0284c7] border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  }
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

/* ================= COMPONENT ================= */

export default function ViewPesertaAdminPage() {
  const router = useRouter();

  const [data, setData] = useState<PesertaDisetujuiItem[]>([]);
  const [suratSelesaiMap, setSuratSelesaiMap] = useState<
    Record<string, SuratSelesaiItem>
  >({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("Semua");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedPeserta, setSelectedPeserta] =
    useState<PesertaDisetujuiItem | null>(null);

  /* ================= FETCH ================= */

  const fetchPeserta = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [resPeserta, resSurat] = await Promise.all([
        fetch(`${API_BASE}/admin/peserta/disetujui`, { headers }),
        fetch(`${API_BASE}/surat-selesai/all`, { headers }).catch(() => null),
      ]);

      if (!resPeserta.ok) {
        throw new Error("Gagal mengambil data peserta magang");
      }

      const jsonPeserta = await resPeserta.json();
      setData(Array.isArray(jsonPeserta) ? jsonPeserta : []);

      if (resSurat && resSurat.ok) {
        const jsonSurat = await resSurat.json();
        const map: Record<string, SuratSelesaiItem> = {};
        if (Array.isArray(jsonSurat)) {
          for (const item of jsonSurat) {
            if (item?.email) {
              map[item.email.trim().toLowerCase()] = item;
            }
          }
        }
        setSuratSelesaiMap(map);
      }
    } catch (err) {
      console.error("Error fetch ViewPeserta:", err);
      showToast.error("Gagal memuat data peserta magang");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPeserta();
  }, [fetchPeserta]);

  /* ================= STATS & FILTERING ================= */

  const stats = useMemo(() => {
    let sedangMagang = 0;
    let belumMulai = 0;
    let selesai = 0;
    let tanpaMentor = 0;
    let suratTerkirim = 0;

    for (const p of data) {
      const effectiveStatus = getEffectiveStatusMagang(p);
      if (effectiveStatus === "Sedang Magang") sedangMagang += 1;
      else if (effectiveStatus === "Belum Waktu Magang") belumMulai += 1;
      else if (effectiveStatus === "Selesai") selesai += 1;

      if (!p.mentor) tanpaMentor += 1;
      if (p.email && suratSelesaiMap[p.email.trim().toLowerCase()]) {
        suratTerkirim += 1;
      }
    }

    return {
      Semua: data.length,
      "Sedang Magang": sedangMagang,
      "Belum Waktu Magang": belumMulai,
      Selesai: selesai,
      "Tanpa Mentor": tanpaMentor,
      suratTerkirim,
    };
  }, [data, suratSelesaiMap]);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();

    return data.filter((p) => {
      const effectiveStatus = getEffectiveStatusMagang(p);

      if (filterTab === "Tanpa Mentor" && p.mentor) return false;
      if (
        filterTab !== "Semua" &&
        filterTab !== "Tanpa Mentor" &&
        effectiveStatus !== filterTab
      ) {
        return false;
      }

      if (!q) return true;

      return (
        p.nama?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.wa?.toLowerCase().includes(q) ||
        p.posisi?.toLowerCase().includes(q) ||
        p.jurusan?.toLowerCase().includes(q) ||
        p.mentor?.name?.toLowerCase().includes(q)
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

  /* ================= NAVIGATION HANDLERS ================= */

  const handleViewLogbook = (email: string) => {
    router.push(
      `/dashboard/admin/ViewLogbook?email=${encodeURIComponent(email)}`,
    );
  };

  const handleViewLaporanAkhir = (email: string) => {
    router.push(
      `/dashboard/admin/ViewLaporanAkhir?email=${encodeURIComponent(email)}`,
    );
  };

  /* ================= RENDER ================= */

  if (loading) {
    return (
      <TablePageSkeleton
        title="Data Peserta Magang"
        subtitle="Memuat daftar peserta magang yang telah disetujui..."
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
            Data Peserta Magang
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pantau peserta yang telah disetujui, mentor pembimbing, logbook,
            laporan akhir, dan surat selesai magang
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchPeserta(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition self-start sm:self-auto disabled:opacity-60"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl p-5 bg-linear-to-br from-[#0284c7] to-blue-700 text-white shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-sky-100">
                Total Peserta Disetujui
              </p>
              <p className="text-3xl font-extrabold tracking-tight mt-2">
                {stats.Semua}
              </p>
              <p className="text-[11px] text-sky-100 mt-1.5">
                {stats.suratTerkirim} surat selesai telah terkirim
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
                Sedang Magang
              </p>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mt-2">
                {stats["Sedang Magang"]}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Aktif melaksanakan magang
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
                Belum Mulai
              </p>
              <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight mt-2">
                {stats["Belum Waktu Magang"]}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Menunggu jadwal mulai magang
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
                Selesai / Tanpa Mentor
              </p>
              <p className="text-3xl font-extrabold text-[#0284c7] dark:text-sky-400 tracking-tight mt-2">
                {stats.Selesai}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                {stats["Tanpa Mentor"]} peserta belum memiliki mentor
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* ================= FILTER TABS & SEARCH ================= */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 p-3.5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              "Semua",
              "Sedang Magang",
              "Belum Waktu Magang",
              "Selesai",
              "Tanpa Mentor",
            ] as FilterTab[]
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
                  {stats[tab]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full xl:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari nama, email, posisi, mentor..."
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
                <th className="py-3.5 px-4">Posisi & Jurusan</th>
                <th className="py-3.5 px-4">Mentor</th>
                <th className="py-3.5 px-4">Periode & Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-14 px-4 text-center text-slate-500 dark:text-slate-400"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="font-semibold text-slate-700 dark:text-slate-200">
                        Tidak ada peserta yang sesuai
                      </p>
                      <p className="text-xs text-slate-400">
                        Ubah filter atau kata kunci pencarian untuk melihat data
                        lain.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((p, idx) => {
                  const rowNo = (safePage - 1) * ITEMS_PER_PAGE + idx + 1;
                  const effectiveStatus = getEffectiveStatusMagang(p);
                  const hasSuratSelesai = Boolean(
                    p.email && suratSelesaiMap[p.email.trim().toLowerCase()],
                  );

                  return (
                    <tr
                      key={`${p.pendaftaranId}-${p.pesertaId || p.email}-${idx}`}
                      className="hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {rowNo}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#0284c7] to-blue-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {getInitials(p.nama)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {p.nama}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {p.email}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-[11px] text-slate-400">
                                {p.wa}
                              </span>
                              {hasSuratSelesai && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                                  <FileCheck2 className="w-3 h-3" />
                                  Surat Selesai
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1 text-xs">
                          <p className="font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                            <span>{p.posisi || "-"}</span>
                          </p>
                          <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{p.jurusan || "-"}</span>
                          </p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        {p.mentor ? (
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-100">
                              {p.mentor.name}
                            </p>
                            {p.mentor.email && (
                              <p className="text-[11px] text-slate-400">
                                {p.mentor.email}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
                            Belum Ditetapkan
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5 text-xs">
                          <p className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {p.tanggalMulaiMagang || "-"} s/d{" "}
                              {p.tanggalSelesaiMagang || "-"}
                            </span>
                          </p>
                          <div>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${getStatusBadgeClass(
                                effectiveStatus,
                              )}`}
                            >
                              {effectiveStatus}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedPeserta(p)}
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
          totalItems={filteredData.length}
          itemsPerPage={ITEMS_PER_PAGE}
          itemLabel="peserta"
          onPageChange={setCurrentPage}
        />
      </div>

      {/* ================= DETAIL MODAL ================= */}
      {selectedPeserta && (
        <AdminPesertaModal
          peserta={selectedPeserta}
          onClose={() => setSelectedPeserta(null)}
          onViewLogbook={handleViewLogbook}
          onViewLaporanAkhir={handleViewLaporanAkhir}
          onSuratSelesaiSuccess={() => fetchPeserta(true)}
        />
      )}
    </div>
  );
}
