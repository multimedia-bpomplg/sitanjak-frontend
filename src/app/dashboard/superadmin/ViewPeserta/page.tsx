"use client";

import { useEffect, useState, useCallback, useRef } from "react"; // 🔥 TAMBAH useRef
import {
  HiUser,
  HiMail,
  HiPhone,
  HiBriefcase,
  HiAcademicCap,
  HiCalendar,
  HiSearch,
  HiDocumentText,
} from "react-icons/hi";
import SuperadminPesertaModal from "@/components/superadmin/SuperadminPesertaModal";

// ================ TYPES ================
type Peserta = {
  pendaftaranId: string;
  pesertaId: string;
  nama: string;
  email: string;
  wa: string;
  posisi: string;
  jurusan: string;
  kategori: string;
  statusMagang?:
    | "Menunggu"
    | "Belum Waktu Magang"
    | "Sedang Magang"
    | "Selesai Magang"
    | "Tidak Magang";
  mentor?: {
    _id: string;
    name: string;
    email: string;
  };
  isTerdaftar: boolean;
  tanggalMulaiMagang: string;
  tanggalSelesaiMagang: string;
  statusPendaftaran?: "Disetujui" | "Ditolak" | "Menunggu";
  createdAt: string;
};

type SuratSelesaiStatus = {
  [email: string]: {
    status: "Sudah Terkirim" | "Belum Ada Surat";
    file?: string;
    tanggalKirim?: string;
  };
};

// ================ MAIN COMPONENT ================
export default function ViewPesertaSuperadmin() {
  // 🔥 ABORT CONTROLLER UNTUK CLEANUP
  const abortControllerRef = useRef<AbortController | null>(null);

  const [pesertaList, setPesertaList] = useState<Peserta[]>([]);
  const [filteredPeserta, setFilteredPeserta] = useState<Peserta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPeserta, setSelectedPeserta] = useState<Peserta | null>(null);
  const [suratSelesaiStatus, setSuratSelesaiStatus] =
    useState<SuratSelesaiStatus>({});
  const [loadingSurat, setLoadingSurat] = useState(false);
  const [error, setError] = useState<string | null>(null); // 🔥 TAMBAH ERROR STATE

  // Pagination state
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // 🔥 AMBIL TOKEN DENGAN SAFE CHECK
  const getToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  };

  // 🔥 FETCH SEMUA DATA SURAT SELESAI
  const fetchAllSuratSelesai = useCallback(async (signal?: AbortSignal) => {
    try {
      const token = getToken();
      if (!token) {
        console.warn("Token tidak ditemukan");
        return {};
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/surat-selesai/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal, // 🔥 PASANG ABORT SIGNAL
        },
      );

      if (!res.ok) {
        throw new Error(`Gagal fetch surat: ${res.status}`);
      }

      const data = await res.json();

      // Konversi ke object dengan key email
      const statusMap: SuratSelesaiStatus = {};

      if (Array.isArray(data)) {
        data.forEach((surat: any) => {
          if (surat?.email) {
            statusMap[surat.email] = {
              status: "Sudah Terkirim",
              file: surat.file,
              tanggalKirim: surat.tanggalKirim,
            };
          }
        });
      }

      return statusMap;
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Fetch surat dibatalkan");
        return {};
      }
      console.error("Gagal fetch data surat selesai", err);
      return {};
    }
  }, []);

  // 🔥 FETCH DATA PESERTA
  const fetchPeserta = useCallback(async (signal?: AbortSignal) => {
    try {
      const token = getToken();
      if (!token) {
        throw new Error("Token tidak ditemukan");
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/peserta/disetujui`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal,
        },
      );

      if (!res.ok) {
        throw new Error(`Gagal fetch peserta: ${res.status}`);
      }

      const data: Peserta[] = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Fetch peserta dibatalkan");
        return [];
      }
      throw err;
    }
  }, []);

  // 🔥 LOAD DATA UTAMA
  const loadData = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    setLoadingSurat(true);
    setError(null);

    try {
      // 🔥 FETCH PESERTA DAN SURAT SELESAI BERSAMAAN
      const [pesertaData, suratStatusMap] = await Promise.all([
        fetchPeserta(signal),
        fetchAllSuratSelesai(signal),
      ]);

      // Set surat status
      setSuratSelesaiStatus(suratStatusMap);

      // SORT DARI TERBARU KE TERLAMA
      const sortedData = [...pesertaData].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );

      setPesertaList(sortedData);
      setFilteredPeserta(sortedData);
      setPage(1);
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Gagal memuat data peserta", error);
        setError(error.message || "Gagal memuat data");
      }
    } finally {
      setLoading(false);
      setLoadingSurat(false);
    }
  }, [fetchPeserta, fetchAllSuratSelesai]);

  // 🔥 CLEANUP EFFECT
  useEffect(() => {
    loadData();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadData]);

  // 🔥 SEARCH EFFECT
  useEffect(() => {
    if (!search.trim()) {
      setFilteredPeserta(pesertaList);
      setPage(1);
      return;
    }

    const query = search.toLowerCase();
    const filtered = pesertaList.filter(
      (p) =>
        p.nama?.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query) ||
        p.posisi?.toLowerCase().includes(query) ||
        p.jurusan?.toLowerCase().includes(query),
    );
    setFilteredPeserta(filtered);
    setPage(1);
  }, [search, pesertaList]);

  // Calculate pagination
  const totalPage = Math.ceil(filteredPeserta.length / itemsPerPage);
  const indexOfLastItem = page * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPeserta.slice(indexOfFirstItem, indexOfLastItem);

  // ================ HANDLERS ================
  const handleViewLogbook = (email: string) => {
    window.location.href = `/dashboard/superadmin/ViewLogbook?email=${encodeURIComponent(email)}`;
  };

  const handleViewLaporanBulanan = (email: string) => {
    window.location.href = `/dashboard/superadmin/ViewLaporanBulanan?email=${encodeURIComponent(email)}`;
  };

  const handleViewLaporanAkhir = (email: string) => {
    window.location.href = `/dashboard/superadmin/ViewLaporanAkhir?email=${encodeURIComponent(email)}`;
  };

  // 🔥 HANDLER UNTUK REFRESH DATA
  const handleSuratSelesaiSuccess = () => {
    loadData();
  };

  // ================ RENDER ================
  return (
    <div
      className="
        min-h-screen p-4 sm:p-6 lg:p-10
        bg-linear-to-br
        from-slate-50 via-white to-indigo-100
        dark:from-[#0B0614] dark:via-[#120A24] dark:to-[#1E0F3D]
        text-slate-800 dark:text-slate-100
        transition-colors
      "
    >
      {/* HEADER */}
      <div className="mb-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-3">
          Data Peserta Disetujui
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Kelola semua peserta yang sudah disetujui
        </p>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
          <p className="text-sm">Error: {error}</p>
          <button
            onClick={() => loadData()}
            className="mt-2 text-sm font-semibold underline hover:no-underline"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Total Peserta"
          value={pesertaList.length}
          icon={<HiUser className="w-7 h-7" />}
          note="Jumlah seluruh peserta"
          color="indigo"
        />

        <StatCard
          title="Punya Mentor"
          value={pesertaList.filter((p) => p.mentor).length}
          icon={<HiAcademicCap className="w-7 h-7" />}
          note="Peserta dengan mentor aktif"
          color="emerald"
        />

        <StatCard
          title="Aktif Magang"
          value={
            pesertaList.filter(
              (p) =>
                p.statusMagang === "Sedang Magang" ||
                p.statusMagang === "Belum Waktu Magang",
            ).length
          }
          icon={<HiCalendar className="w-7 h-7" />}
          note="Sedang / akan menjalani magang"
          color="amber"
        />

        <StatCard
          title="Sudah Selesai"
          value={
            pesertaList.filter((p) => p.statusMagang === "Selesai Magang")
              .length
          }
          icon={<HiBriefcase className="w-7 h-7" />}
          note="Magang telah selesai"
          color="slate"
        />

        <StatCard
          title="Surat Terkirim"
          value={Object.keys(suratSelesaiStatus).length}
          icon={<HiDocumentText className="w-7 h-7" />}
          note="Surat selesai magang terkirim"
          color="emerald"
        />
      </div>

      {/* SEARCH BAR */}
      <div className="mb-8">
        <div className="relative">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7F1D1D] dark:text-indigo-400 w-5 h-5 z-10" />
          <input
            type="text"
            placeholder="Cari peserta berdasarkan nama, email, atau posisi..."
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
      </div>

      {/* TABLE */}
      {!loading && currentItems.length === 0 ? (
        <div
          className="
            rounded-3xl
            bg-white/80 dark:bg-white/5
            backdrop-blur
            border border-[#F59E0B]/30 dark:border-indigo-500/30
            shadow-xl
            p-12 text-center
          "
        >
          <div
            className="
              w-16 h-16 sm:w-20 sm:h-20
              mx-auto mb-5
              rounded-full
              bg-linear-to-br
              from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
              dark:from-indigo-600 dark:to-violet-500
              flex items-center justify-center
              shadow-lg
              animate-pulse
            "
          >
            <HiUser className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-[#7F1D1D] dark:text-indigo-300 mb-2">
            {search ? "Peserta tidak ditemukan" : "Belum ada data peserta"}
          </h3>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {search
              ? `Tidak ada peserta yang sesuai dengan pencarian "${search}".`
              : "Saat ini belum ada peserta yang terdaftar."}
          </p>
        </div>
      ) : (
        <div
          className="
            rounded-2xl
            bg-white/90 dark:bg-white/5
            backdrop-blur
            border border-slate-200 dark:border-indigo-500/30
            shadow-lg
            overflow-hidden
          "
        >
          {/* LOADING OVERLAY */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B91C1C] dark:border-indigo-400"></div>
            </div>
          )}

          {!loading && (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-200 w-full text-sm sm:text-base">
                  <thead>
                    <tr
                      className="
                        bg-slate-50 dark:bg-indigo-500/10
                        border-b border-slate-200 dark:border-indigo-500/30
                      "
                    >
                      <th className="w-[5%] py-4 px-6 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                        No
                      </th>
                      <th className="w-[18%] py-4 px-6 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                        Peserta
                      </th>
                      <th className="w-[18%] py-4 px-6 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                        Kontak
                      </th>
                      <th className="w-[12%] py-4 px-6 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                        Posisi
                      </th>
                      <th className="w-[14%] py-4 px-6 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                        Mentor
                      </th>
                      <th className="w-[12%] py-4 px-6 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                        Status Magang
                      </th>
                      <th className="w-[12%] py-4 px-6 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                        Status Surat
                      </th>
                      <th className="w-[9%] py-4 px-6 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                        Aksi
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-indigo-500/20">
                    {currentItems.map((p, index) => {
                      const suratStatus =
                        suratSelesaiStatus[p.email]?.status ||
                        "Belum Ada Surat";

                      return (
                        <tr
                          key={p.pesertaId || index}
                          className="hover:bg-[#FEF3C7]/40 dark:hover:bg-indigo-500/10 transition"
                        >
                          <td className="py-4 px-6 text-center font-medium text-slate-500 dark:text-slate-300">
                            {indexOfFirstItem + index + 1}
                          </td>

                          <td className="py-4 px-6">
                            <div className="flex items-center justify-center gap-3">
                              <div
                                className="
                                  w-10 h-10
                                  rounded-full
                                  bg-linear-to-br from-[#7F1D1D] to-[#F59E0B]
                                  dark:from-indigo-600 dark:to-violet-500
                                  flex items-center justify-center
                                  text-white shadow
                                "
                              >
                                <HiUser className="w-5 h-5" />
                              </div>
                              <div className="text-left leading-tight">
                                <p className="font-medium text-slate-800 dark:text-slate-100">
                                  {p.nama || "-"}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {p.jurusan || "-"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-6 text-center">
                            <div className="space-y-1 text-slate-600 dark:text-slate-300">
                              <div className="flex justify-center items-center gap-2">
                                <HiMail className="w-4 h-4" />
                                <span className="truncate max-w-52">
                                  {p.email || "-"}
                                </span>
                              </div>
                              <div className="flex justify-center items-center gap-2">
                                <HiPhone className="w-4 h-4" />
                                <span>{p.wa || "-"}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-6 text-center">
                            <span
                              className="
                                inline-flex items-center gap-2
                                px-3 py-1.5 rounded-full
                                text-xs font-semibold
                                bg-blue-50 text-blue-700
                                dark:bg-indigo-500/20 dark:text-indigo-200
                              "
                            >
                              {p.posisi || "-"}
                            </span>
                          </td>

                          <td className="py-4 px-6 text-center">
                            {p.mentor ? (
                              <div className="text-sm">
                                <p className="font-medium text-slate-800 dark:text-slate-100">
                                  {p.mentor.name || "-"}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {p.mentor.email || "-"}
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-sm">
                                Belum ada mentor
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-6 text-center">
                            <StatusMagangBadge
                              status={p.statusMagang || "Menunggu"}
                            />
                          </td>

                          <td className="py-4 px-6 text-center">
                            {loadingSurat ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                <span className="animate-pulse">Memuat...</span>
                              </span>
                            ) : (
                              <SuratSelesaiBadge status={suratStatus} />
                            )}
                          </td>

                          <td className="py-4 px-6 text-center">
                            <button
                              onClick={() => setSelectedPeserta(p)}
                              className="
                                inline-flex items-center justify-center
                                px-4 py-2
                                rounded-xl
                                text-sm font-semibold
                                text-white
                                bg-linear-to-r from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                                dark:from-indigo-600 dark:to-violet-500
                                shadow hover:shadow-xl
                                hover:-translate-y-0.5
                                transition
                              "
                            >
                              Lihat Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              {totalPage > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-2 py-5">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="
                      px-4 py-2
                      rounded-lg
                      text-sm font-medium
                      border
                      border-slate-300 dark:border-indigo-500/30
                      bg-white dark:bg-indigo-950
                      text-slate-700 dark:text-indigo-200
                      hover:bg-[#FFF1F2] dark:hover:bg-indigo-900/40
                      disabled:opacity-40 disabled:cursor-not-allowed
                      transition
                    "
                  >
                    Prev
                  </button>

                  {Array.from({ length: Math.min(totalPage, 5) }).map(
                    (_, i) => {
                      let pageNum = i + 1;
                      if (totalPage > 5) {
                        if (page > 3) {
                          pageNum = page - 3 + i;
                        }
                      }

                      if (pageNum > totalPage) return null;

                      const active = page === pageNum;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`
                          min-w-9.5 h-9.5 px-3
                          rounded-lg
                          text-sm font-semibold
                          transition
                          ${
                            active
                              ? `
                                bg-[#B91C1C] text-white shadow
                                dark:bg-indigo-600
                              `
                              : `
                                bg-white dark:bg-indigo-950
                                text-[#7F1D1D] dark:text-indigo-200
                                border border-slate-300 dark:border-indigo-500/30
                                hover:bg-[#FFF1F2] dark:hover:bg-indigo-900/40
                              `
                          }
                        `}
                        >
                          {pageNum}
                        </button>
                      );
                    },
                  )}

                  <button
                    disabled={page === totalPage}
                    onClick={() => setPage((p) => p + 1)}
                    className="
                      px-4 py-2
                      rounded-lg
                      text-sm font-medium
                      border
                      border-slate-300 dark:border-indigo-500/30
                      bg-white dark:bg-indigo-950
                      text-slate-700 dark:text-indigo-200
                      hover:bg-[#FFF1F2] dark:hover:bg-indigo-900/40
                      disabled:opacity-40 disabled:cursor-not-allowed
                      transition
                    "
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Modal */}
      {selectedPeserta && (
        <SuperadminPesertaModal
          peserta={selectedPeserta}
          onClose={() => setSelectedPeserta(null)}
          onViewLogbook={handleViewLogbook}
          onViewLaporanBulanan={handleViewLaporanBulanan}
          onViewLaporanAkhir={handleViewLaporanAkhir}
          onSuratSelesaiSuccess={handleSuratSelesaiSuccess}
        />
      )}
    </div>
  );
}

// ================ STAT CARD COMPONENT ================
type StatCardColor = "indigo" | "emerald" | "amber" | "slate";

type StatCardProps = {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  note: string;
  color: StatCardColor;
};

function StatCard({ title, value, icon, note, color }: StatCardProps) {
  const iconColorMap: Record<StatCardColor, string> = {
    indigo: "bg-[#B91C1C]/90 dark:bg-indigo-600",
    emerald: "bg-emerald-500 dark:bg-emerald-600",
    amber: "bg-amber-500 dark:bg-violet-500",
    slate: "bg-slate-500 dark:bg-indigo-700",
  };

  const textColorMap: Record<StatCardColor, string> = {
    indigo: "text-[#7F1D1D] dark:text-white",
    emerald: "text-[#7F1D1D] dark:text-white",
    amber: "text-[#7F1D1D] dark:text-white",
    slate: "text-[#7F1D1D] dark:text-white",
  };

  return (
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
            {title}
          </p>
          <p className={`text-4xl font-extrabold mt-1 ${textColorMap[color]}`}>
            {value}
          </p>
        </div>

        <div
          className={`
            w-14 h-14 rounded-2xl
            text-white
            flex items-center justify-center
            shadow
            group-hover:scale-110 transition
            ${iconColorMap[color]}
          `}
        >
          {icon}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[#FCA5A5]/40 dark:border-indigo-500/30">
        <p className="text-xs text-slate-600 dark:text-slate-300">{note}</p>
      </div>
    </div>
  );
}

// ================ STATUS MAGANG BADGE ================
function StatusMagangBadge({ status }: { status: string }) {
  switch (status) {
    case "Belum Waktu Magang":
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
          Belum Waktu Magang
        </span>
      );
    case "Sedang Magang":
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          Sedang Magang
        </span>
      );
    case "Tidak Magang":
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          Tidak Magang
        </span>
      );
    case "Selesai Magang":
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          Selesai
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
          Menunggu
        </span>
      );
  }
}

// ================ SURAT SELESAI BADGE ================
function SuratSelesaiBadge({ status }: { status: string }) {
  if (status === "Sudah Terkirim") {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
        <HiDocumentText className="w-3 h-3" />
        Surat Terkirim
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
      <HiDocumentText className="w-3 h-3" />
      Belum Ada Surat
    </span>
  );
}
