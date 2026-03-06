"use client";

import { useEffect, useState } from "react";
import {
  HiDocumentText,
  HiUser,
  HiMail,
  HiCalendar,
  HiCheckCircle,
  HiXCircle,
  HiExclamationCircle,
  HiClock,
  HiSearch,
  HiBookOpen,
  HiChevronDown,
  HiX,
  HiInformationCircle,
  HiOutlineEye,
  HiDownload, // ✅ TAMBAHKAN
} from "react-icons/hi";
import { FiFileText, FiDownload } from "react-icons/fi"; // ✅ TAMBAHKAN
import SuperadminLaporanAkhirModal from "@/components/superadmin/SuperadminLaporanAkhirModal";
import { showToast } from "@/components/ui/toastDashboard";

type LaporanAkhir = {
  _id: string;
  judul: string;
  status: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  approvedByMentor?: {
    _id: string;
    name: string;
    email: string;
  };
  mentorNote?: string;
  approvedAt?: string;
  createdAt: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  penilaian?: any;
};

type PesertaLaporan = {
  _id: string;
  name: string;
  email: string;
  hasLaporan: boolean;
  status?: string;
  judul?: string;
  createdAt?: string;
  laporanId?: string;
};

export default function ViewLaporanAkhirSuperadmin() {
  const [laporanList, setLaporanList] = useState<LaporanAkhir[]>([]);
  const [pesertaLaporan, setPesertaLaporan] = useState<PesertaLaporan[]>([]);
  const [filteredPeserta, setFilteredPeserta] = useState<PesertaLaporan[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState({ pdf: false, excel: false }); // ✅ STATE DOWNLOAD
  const [search, setSearch] = useState("");
  const [selectedLaporan, setSelectedLaporan] = useState<LaporanAkhir | null>(
    null,
  );
  const [showLaporanModal, setShowLaporanModal] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/laporan-akhir`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      const data = await res.json();
      setLaporanList(data);
    } catch (error) {
      console.error("Gagal memuat laporan akhir", error);
    } finally {
      setLoading(false);
    }
  };

  // Transform data untuk ditampilkan di tabel
  useEffect(() => {
    const pesertaMap = new Map<string, PesertaLaporan>();

    laporanList.forEach((laporan: LaporanAkhir) => {
      if (!laporan?.user?._id) return;

      const userId = laporan.user._id;

      if (!pesertaMap.has(userId)) {
        pesertaMap.set(userId, {
          _id: userId,
          name: laporan.user.name,
          email: laporan.user.email,
          hasLaporan: true,
          status: laporan.status,
          judul: laporan.judul,
          createdAt: laporan.createdAt,
          laporanId: laporan._id,
        });
      }
    });

    // Convert map to array
    const pesertaArray = Array.from(pesertaMap.values());

    // Sort by createdAt (terbaru di atas)
    pesertaArray.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime(),
    );

    setPesertaLaporan(pesertaArray);
    setFilteredPeserta(pesertaArray);
    setPage(1);
  }, [laporanList]);

  const handleViewLaporan = (peserta: PesertaLaporan) => {
    if (peserta.hasLaporan && peserta.laporanId) {
      const laporan = laporanList.find((l) => l._id === peserta.laporanId);
      if (laporan) {
        setSelectedLaporan(laporan);
        setShowLaporanModal(true);
      }
    }
  };

  /* ================= DOWNLOAD ALL LAPORAN PDF ================= */
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
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/laporan-akhir/download-all-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            laporanList,
            totalPeserta: pesertaLaporan.length,
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
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showToast.updateSuccess(toastId, "Laporan PDF berhasil diunduh");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      showToast.updateError(toastId, "Gagal mengunduh PDF");
    } finally {
      setDownloading((prev) => ({ ...prev, pdf: false }));
    }
  };

  /* ================= DOWNLOAD ALL LAPORAN EXCEL ================= */
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
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/laporan-akhir/download-all-excel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            laporanList,
            pesertaLaporan,
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
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showToast.updateSuccess(toastId, "Laporan Excel berhasil diunduh");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      showToast.updateError(toastId, "Gagal mengunduh Excel");
    } finally {
      setDownloading((prev) => ({ ...prev, excel: false }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredPeserta(pesertaLaporan);
      setPage(1);
      return;
    }

    const query = search.toLowerCase();
    const filtered = pesertaLaporan.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query) ||
        (p.judul && p.judul.toLowerCase().includes(query)),
    );
    setFilteredPeserta(filtered);
    setPage(1);
  }, [search, pesertaLaporan]);

  // Calculate pagination
  const totalPage = Math.ceil(filteredPeserta.length / itemsPerPage);
  const indexOfLastItem = page * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPeserta.slice(indexOfFirstItem, indexOfLastItem);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Disetujui":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <HiCheckCircle className="w-3.5 h-3.5" /> Disetujui
          </span>
        );
      case "Ditolak":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <HiXCircle className="w-3.5 h-3.5" /> Ditolak
          </span>
        );
      case "Revisi":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <HiExclamationCircle className="w-3.5 h-3.5" /> Revisi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <HiClock className="w-3.5 h-3.5" /> Menunggu
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

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
      {/* HEADER SECTION */}
      <div className="mb-8">
        <div className="mb-6">
          <h1 className="flex items-center gap-3 tracking-tight mb-2">
            <p className="text-3xl">📋</p>
            <span
              className="
                text-2xl sm:text-3xl lg:text-4xl
                font-extrabold leading-tight
                bg-clip-text text-transparent
                bg-linear-to-r
                from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400
              "
            >
              Laporan Akhir Peserta
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
            Kelola dan review laporan akhir semua peserta magang. Pantau status
            dan berikan feedback.
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Peserta"
            value={pesertaLaporan.length}
            icon={<HiUser className="w-7 h-7" />}
            note="Peserta dengan laporan"
            color="indigo"
          />

          <StatCard
            title="Perlu Review"
            value={
              laporanList.filter(
                (l) => l.status === "Menunggu" || l.status === "Revisi",
              ).length
            }
            icon={<HiExclamationCircle className="w-7 h-7" />}
            note="Menunggu tindakan"
            color="amber"
          />

          <StatCard
            title="Disetujui"
            value={laporanList.filter((l) => l.status === "Disetujui").length}
            icon={<HiCheckCircle className="w-7 h-7" />}
            note="Laporan approved"
            color="emerald"
          />

          <StatCard
            title="Ditolak"
            value={laporanList.filter((l) => l.status === "Ditolak").length}
            icon={<HiXCircle className="w-7 h-7" />}
            note="Laporan ditolak"
            color="slate"
          />
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="mb-1">
        <div className="relative">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7F1D1D] dark:text-indigo-400 w-5 h-5 z-10" />
          <input
            type="text"
            placeholder="Cari peserta berdasarkan nama, email, atau judul laporan..."
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

        <div className="mt-2 ms-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
          {filteredPeserta.length} peserta ditemukan
        </div>
      </div>

      {/* ACTION BUTTONS (KANAN) */}
      <div className="flex justify-end mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* DOWNLOAD PDF */}
          <button
            onClick={handleDownloadAllPDF}
            disabled={downloading.pdf || laporanList.length === 0}
            className="
              inline-flex items-center justify-center gap-2
              px-5 py-2.5
              rounded-xl
              text-sm font-semibold
              text-white
              bg-linear-to-r from-red-500 to-red-600
              hover:from-red-600 hover:to-red-700
              shadow-md hover:shadow-lg
              transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {downloading.pdf ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>Menyiapkan...</span>
              </>
            ) : (
              <>
                <FiFileText className="w-4 h-4" />
                <span>Download PDF</span>
              </>
            )}
          </button>

          {/* DOWNLOAD EXCEL */}
          <button
            onClick={handleDownloadAllExcel}
            disabled={downloading.excel || laporanList.length === 0}
            className="
              inline-flex items-center justify-center gap-2
              px-5 py-2.5
              rounded-xl
              text-sm font-semibold
              text-white
              bg-linear-to-r from-emerald-500 to-green-600
              hover:from-emerald-600 hover:to-green-700
              shadow-md hover:shadow-lg
              transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {downloading.excel ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>Menyiapkan...</span>
              </>
            ) : (
              <>
                <FiDownload className="w-4 h-4" />
                <span>Download Excel</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ===================== TABLE ===================== */}
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
        {/* ================= HEADER (DESKTOP ONLY) ================= */}
        <div className="hidden md:block">
          <div
            className="
              bg-slate-50 dark:bg-indigo-500/10
              border-b border-slate-200 dark:border-indigo-500/30
            "
          >
            <div className="grid grid-cols-12 px-6 py-4">
              {["No", "Peserta", "Status", "Tanggal", "Aksi"].map((h, i) => (
                <div
                  key={i}
                  className={`
                    ${
                      i === 0
                        ? "col-span-1"
                        : i === 1
                          ? "col-span-5"
                          : i === 4
                            ? "col-span-2"
                            : "col-span-2"
                    }
                    text-center
                    text-xs font-semibold uppercase
                    text-slate-600 dark:text-indigo-200
                  `}
                >
                  {h}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= BODY ================= */}
        <div className="divide-y divide-slate-100 dark:divide-indigo-500/20">
          {loading ? (
            <div className="py-20 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-300">
                Memuat data laporan...
              </p>
            </div>
          ) : currentItems.length === 0 ? (
            /* ================= EMPTY STATE ================= */
            <div className="py-20 text-center">
              <HiDocumentText className="text-4xl text-slate-300 dark:text-indigo-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-100 mb-2">
                {search ? "Peserta tidak ditemukan" : "Belum ada laporan"}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {search
                  ? "Coba gunakan kata kunci lain"
                  : "Peserta belum mengumpulkan laporan"}
              </p>
            </div>
          ) : (
            <>
              {/* ================= DESKTOP VIEW ================= */}
              <div className="hidden md:block">
                {currentItems.map((peserta, index) => (
                  <div
                    key={peserta._id}
                    className="
                      px-6 py-4
                      hover:bg-[#FEF3C7]/40 dark:hover:bg-indigo-500/10
                      transition
                    "
                  >
                    <div className="grid grid-cols-12 items-center text-center">
                      {/* NO */}
                      <div className="col-span-1 font-medium text-slate-500 dark:text-slate-300">
                        {indexOfFirstItem + index + 1}
                      </div>

                      {/* PESERTA */}
                      <div className="col-span-5 flex justify-center">
                        <div className="flex items-center gap-3 justify-center">
                          <div
                            className="
                              w-10 h-10 rounded-full
                              bg-linear-to-br from-[#7F1D1D] to-[#F59E0B]
                              dark:from-indigo-600 dark:to-violet-500
                              flex items-center justify-center
                              text-white shadow
                            "
                          >
                            <HiUser className="w-5 h-5" />
                          </div>
                          <div className="text-center leading-tight">
                            <p className="font-medium text-slate-800 dark:text-slate-100 truncate">
                              {peserta.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {peserta.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* STATUS */}
                      <div className="col-span-2 flex justify-center">
                        {peserta.hasLaporan && peserta.status ? (
                          getStatusBadge(peserta.status)
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </div>

                      {/* TANGGAL */}
                      <div className="col-span-2 flex justify-center">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          {peserta.createdAt ? (
                            <>
                              <HiCalendar className="w-4 h-4" />
                              {formatDate(peserta.createdAt)}
                            </>
                          ) : (
                            "-"
                          )}
                        </div>
                      </div>

                      {/* AKSI */}
                      <div className="col-span-2 flex justify-center">
                        <button
                          onClick={() => handleViewLaporan(peserta)}
                          disabled={!peserta.hasLaporan}
                          className="
                            inline-flex items-center gap-2
                            px-4 py-2 rounded-xl
                            text-sm font-semibold text-white
                            bg-linear-to-r from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                            dark:from-indigo-600 dark:to-violet-500
                            shadow hover:shadow-xl
                            hover:-translate-y-0.5 transition
                            disabled:opacity-40 disabled:cursor-not-allowed
                          "
                        >
                          <HiOutlineEye className="w-4 h-4" />
                          Lihat
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ================= MOBILE VIEW ================= */}
              <div className="md:hidden">
                {currentItems.map((peserta, index) => (
                  <div
                    key={peserta._id}
                    className="
                      p-4
                      border-b border-slate-100 dark:border-indigo-500/20
                      hover:bg-[#FEF3C7]/40 dark:hover:bg-indigo-500/10
                      transition
                    "
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                          <div
                            className="
                              w-10 h-10 rounded-full
                              bg-linear-to-br from-[#7F1D1D] to-[#F59E0B]
                              dark:from-indigo-600 dark:to-violet-500
                              flex items-center justify-center text-white
                            "
                          >
                            <HiUser className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-100">
                              {peserta.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {peserta.email}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400">
                          #{indexOfFirstItem + index + 1}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Status</p>
                          {peserta.status
                            ? getStatusBadge(peserta.status)
                            : "-"}
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Tanggal</p>
                          {peserta.createdAt
                            ? formatDate(peserta.createdAt)
                            : "-"}
                        </div>
                      </div>

                      <button
                        onClick={() => handleViewLaporan(peserta)}
                        disabled={!peserta.hasLaporan}
                        className="
                          w-full mt-2
                          px-4 py-2.5 rounded-xl
                          text-sm font-semibold text-white
                          bg-linear-to-r from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                          dark:from-indigo-600 dark:to-violet-500
                          shadow hover:shadow-xl
                          transition disabled:opacity-40
                        "
                      >
                        Lihat Detail
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ================= PAGINATION ================= */}
      {totalPage > 1 && (
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* INFO JUMLAH DATA */}
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Menampilkan{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {indexOfFirstItem + 1}
              </span>{" "}
              –{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {Math.min(indexOfLastItem, filteredPeserta.length)}
              </span>{" "}
              dari{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {filteredPeserta.length}
              </span>{" "}
              peserta
            </div>

            {/* BUTTONS */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {/* PREV */}
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="
                  px-4 py-2.5
                  rounded-xl
                  text-sm font-medium
                  border border-slate-300 dark:border-indigo-500/30
                  bg-white dark:bg-indigo-950
                  text-slate-700 dark:text-indigo-200
                  hover:bg-[#FFF1F2] dark:hover:bg-indigo-900/40
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition
                  flex items-center gap-2
                  shadow-sm hover:shadow
                "
              >
                <HiChevronDown className="w-4 h-4 rotate-90" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              {/* PAGE NUMBER */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPage }).map((_, i) => {
                  const pageNumber = i + 1;
                  const active = page === pageNumber;

                  return (
                    <button
                      key={i}
                      onClick={() => setPage(pageNumber)}
                      className={`
                        min-w-9.5 h-9.5
                        rounded-xl
                        text-sm font-semibold
                        transition
                        ${
                          active
                            ? `
                              bg-linear-to-r from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                              text-white shadow-lg
                              dark:from-indigo-600 dark:to-violet-500
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
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              {/* NEXT */}
              <button
                disabled={page === totalPage}
                onClick={() => setPage((p) => p + 1)}
                className="
                  px-4 py-2.5
                  rounded-xl
                  text-sm font-medium
                  border border-slate-300 dark:border-indigo-500/30
                  bg-white dark:bg-indigo-950
                  text-slate-700 dark:text-indigo-200
                  hover:bg-[#FFF1F2] dark:hover:bg-indigo-900/40
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition
                  flex items-center gap-2
                  shadow-sm hover:shadow
                "
              >
                <span className="hidden sm:inline">Next</span>
                <HiChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL - LANGSUNG TAMPILKAN SUPERADMINLAPORANAKHIRMODAL */}
      {showLaporanModal && selectedLaporan && (
        <SuperadminLaporanAkhirModal
          laporan={selectedLaporan}
          onClose={() => {
            setShowLaporanModal(false);
            setSelectedLaporan(null);
          }}
          onReview={async (id, status, note) => {
            // Implementasi review jika diperlukan
            console.log("Review:", id, status, note);
          }}
        />
      )}
    </div>
  );
}

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
      {/* TOP */}
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

      {/* FOOTER */}
      <div className="mt-4 pt-4 border-t border-[#FCA5A5]/40 dark:border-indigo-500/30">
        <p className="text-xs text-slate-600 dark:text-slate-300">{note}</p>
      </div>
    </div>
  );
}
