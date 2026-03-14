"use client";

import { useEffect, useState } from "react";
import {
  HiX,
  HiUser,
  HiMail,
  HiCalendar,
  HiCheckCircle,
  HiXCircle,
  HiClock,
  HiSearch,
  HiDocumentText,
} from "react-icons/hi";
import { FiEye } from "react-icons/fi";
import SuperadminLogbookModal from "@/components/superadmin/SuperadminLogbookModal";

type Peserta = {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  totalLogbooks: number;
  approvedLogbooks: number;
  pendingLogbooks: number;
  rejectedLogbooks: number;
};

type Logbook = {
  _id: string;
  date: string;
  status: string;
  judul: string;
  approvalStatus: "menunggu" | "disetujui" | "ditolak";
  user: {
    _id: string;
    name: string;
    email: string;
  };
};

type LogbookSummary = {
  total: number;
  hadir: number;
  tidakHadirDenganKeterangan: number;
  tidakHadirTanpaKeterangan: number;
  ditolakMentor: number;
};

export default function ViewLogbookSuperadmin() {
  const [peserta, setPeserta] = useState<Peserta[]>([]);
  const [filteredPeserta, setFilteredPeserta] = useState<Peserta[]>([]);
  const [allLogbooks, setAllLogbooks] = useState<Logbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPeserta, setSelectedPeserta] = useState<Peserta | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [logbookSummary, setLogbookSummary] = useState<LogbookSummary | null>(
    null,
  );
  const [filledDates, setFilledDates] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [logbookModalData, setLogbookModalData] = useState<any>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // State untuk modal superadmin
  const [showSuperadminModal, setShowSuperadminModal] = useState(false);
  const [selectedLogbook, setSelectedLogbook] = useState<any>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Load all data
  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch semua logbook untuk mendapatkan data peserta
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/logbook`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      const logbooksData = await res.json();
      setAllLogbooks(logbooksData);

      // Ekstrak data peserta unik dari logbook
      const pesertaMap = new Map();
      const pesertaWithStats: Peserta[] = [];

      logbooksData.forEach((logbook: Logbook) => {
        // ✅ CEK USER DULU
        if (!logbook.user || !logbook.user._id) {
          console.warn("Logbook tanpa user:", logbook);
          return; // skip data rusak
        }

        const userId = logbook.user._id;

        if (!pesertaMap.has(userId)) {
          pesertaMap.set(userId, {
            _id: userId,
            name: logbook.user.name,
            email: logbook.user.email,
            role: "peserta",
            status: "active",
            totalLogbooks: 0,
            approvedLogbooks: 0,
            pendingLogbooks: 0,
            rejectedLogbooks: 0,
          });
        }

        const peserta = pesertaMap.get(userId);
        peserta.totalLogbooks++;

        switch (logbook.approvalStatus) {
          case "disetujui":
            peserta.approvedLogbooks++;
            break;
          case "menunggu":
            peserta.pendingLogbooks++;
            break;
          case "ditolak":
            peserta.rejectedLogbooks++;
            break;
        }
      });

      // Konversi map ke array
      pesertaMap.forEach((peserta) => {
        pesertaWithStats.push(peserta);
      });

      // 👉 SORT DI SINI
      pesertaWithStats.sort((a, b) => {
        if (b.pendingLogbooks !== a.pendingLogbooks) {
          return b.pendingLogbooks - a.pendingLogbooks;
        }
        if (b.totalLogbooks !== a.totalLogbooks) {
          return b.totalLogbooks - a.totalLogbooks;
        }
        return a.name.localeCompare(b.name);
      });

      // Baru set ke state
      setPeserta(pesertaWithStats);
      setFilteredPeserta(pesertaWithStats);
      setPage(1); // Reset ke halaman pertama saat data baru dimuat
    } catch (error) {
      console.error("Gagal memuat data", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPesertaLogbookSummary = (pesertaId: string) => {
    const pesertaLogbooks = allLogbooks.filter(
      (logbook) => logbook.user && logbook.user._id === pesertaId,
    );
    const summary: LogbookSummary = {
      total: pesertaLogbooks.length,

      hadir: pesertaLogbooks.filter((l) => l.status === "hadir").length,

      tidakHadirDenganKeterangan: pesertaLogbooks.filter(
        (l) => l.status === "tidak_hadir_keterangan",
      ).length,

      tidakHadirTanpaKeterangan: pesertaLogbooks.filter(
        (l) => l.status === "tidak_hadir_tanpa_keterangan",
      ).length,

      ditolakMentor: pesertaLogbooks.filter(
        (l) => l.approvalStatus === "ditolak",
      ).length,
    };

    const dates: Record<string, string> = {};

    pesertaLogbooks.forEach((logbook) => {
      dates[logbook.date] = logbook._id;
    });

    setLogbookSummary(summary);
    setFilledDates(dates);
  };

  const handleViewCalendar = (peserta: Peserta) => {
    setSelectedPeserta(peserta);
    loadPesertaLogbookSummary(peserta._id);
    setShowCalendarModal(true);
  };

  /* ================= HANDLE SUPERADMIN ACTION ================= */
  const handleSuperadminAction = async (
    id: string,
    status: string,
    note: string,
  ) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/logbook/${id}/approve`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            approvalStatus: status,
            mentorNote: note,
          }),
        },
      );

      if (!res.ok) throw new Error("Gagal memproses logbook");

      // Refresh data
      await loadData();
      setShowSuperadminModal(false);
      setSelectedLogbook(null);
      setSelectedDate(null);
    } catch (error) {
      console.error("Gagal memproses logbook:", error);
      alert("Gagal memproses logbook");
    }
  };

  /* ================= DOWNLOAD PDF (ADMIN/SUPERADMIN) ================= */
  const handleDownloadPDF = async (userId: string, name: string) => {
    try {
      setDownloadingId(userId);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/logbook/admin/${userId}/download/pdf`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error("Gagal download PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `logbook-${name}.pdf`;

      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[DOWNLOAD ADMIN PDF]", err);
      alert("Gagal download PDF logbook");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSelectDate = async (date: string, isFilled: boolean) => {
    if (!selectedPeserta) return;

    setSelectedDate(date);
    setIsLoadingDetail(true);

    try {
      // Gunakan endpoint yang sama seperti mentor
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/logbook/mentor/peserta/${selectedPeserta._id}/date/${date}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (res.status === 404) {
        // Logbook belum diisi
        setLogbookModalData(null);
        return;
      }

      if (!res.ok) throw new Error("Gagal mengambil logbook");

      const data = await res.json();

      // ✅ SET DATA UNTUK MODAL SUPERADMIN
      setSelectedLogbook(data);
      setShowSuperadminModal(true);
    } catch (error) {
      console.error("Gagal mengambil detail logbook", error);
      // Fallback: coba ambil dari data yang sudah dimuat
      const fallbackLogbook = allLogbooks.find(
        (logbook) =>
          logbook.user &&
          logbook.user._id === selectedPeserta._id &&
          logbook.date === date,
      );
      if (fallbackLogbook) {
        setSelectedLogbook(fallbackLogbook);
        setShowSuperadminModal(true);
      } else {
        setLogbookModalData(null);
      }
    } finally {
      setIsLoadingDetail(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredPeserta(peserta);
      setPage(1); // Reset ke halaman pertama saat pencarian diubah
      return;
    }

    const query = search.toLowerCase();
    const filtered = peserta.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query),
    );
    setFilteredPeserta(filtered);
    setPage(1); // Reset ke halaman pertama saat pencarian diubah
  }, [search, peserta]);

  // Calculate pagination
  const totalPage = Math.ceil(filteredPeserta.length / itemsPerPage);
  const indexOfLastItem = page * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPeserta.slice(indexOfFirstItem, indexOfLastItem);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
            <HiCheckCircle /> Aktif
          </span>
        );
      case "inactive":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            <HiXCircle /> Nonaktif
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
            <HiClock /> Menunggu
          </span>
        );
    }
  };

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case "disetujui":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
            <HiCheckCircle /> Disetujui
          </span>
        );
      case "ditolak":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            <HiXCircle /> Ditolak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
            <HiClock /> Menunggu
          </span>
        );
    }
  };

  // Calendar Component
  const Calendar = ({
    onSelectDate,
    filledDates,
  }: {
    onSelectDate: (date: string, isFilled: boolean) => void;
    filledDates: Record<string, string>;
  }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [holidays, setHolidays] = useState<Record<string, string>>({});

    useEffect(() => {
      const fetchHolidays = async () => {
        try {
          const res = await fetch("https://api-harilibur.vercel.app/api");
          const data = await res.json();
          const mapped: Record<string, string> = {};
          data.forEach((item: any) => {
            if (item.is_national_holiday) {
              mapped[item.holiday_date] = item.holiday_name;
            }
          });
          setHolidays(mapped);
        } catch (error) {
          console.error("Failed to fetch holidays", error);
        }
      };
      fetchHolidays();
    }, []);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDate = new Date(year, month + 1, 0).getDate();
    const startDay = (firstDay.getDay() + 6) % 7;

    const days: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= lastDate; i++) {
      days.push(new Date(year, month, i));
    }

    const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

    return (
      <div className="w-full max-w-4xl mx-auto">
        <div
          className="
            rounded-2xl
            bg-white/80 dark:bg-indigo-950/50
            backdrop-blur
            shadow-lg
            p-6
            text-slate-800 dark:text-slate-100
          "
        >
          {/* Header */}
          <div className="mb-4 grid grid-cols-3 items-center">
            {/* KIRI (kosong biar center beneran) */}
            <div />

            {/* TENGAH */}
            <h2 className="text-center text-lg font-extrabold text-slate-900 dark:text-white">
              {currentMonth.toLocaleDateString("id-ID", {
                month: "long",
                year: "numeric",
              })}
            </h2>

            {/* KANAN */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                className="
                    w-9 h-9
                    rounded-full
                    flex items-center justify-center
                    bg-slate-200/70 dark:bg-indigo-900/60
                    hover:bg-slate-300 dark:hover:bg-indigo-800
                    transition
                  "
              >
                ←
              </button>

              <button
                onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                className="
                    w-9 h-9
                    rounded-full
                    flex items-center justify-center
                    bg-slate-200/70 dark:bg-indigo-900/60
                    hover:bg-slate-300 dark:hover:bg-indigo-800
                    transition
                  "
              >
                →
              </button>
            </div>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 text-center text-sm font-semibold text-slate-500 mb-2">
            {dayNames.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((date, idx) => {
              if (!date) return <div key={idx} />;

              const isoDate = date.toLocaleDateString("en-CA");
              const isSunday = date.getDay() === 0;
              const isHoliday = Boolean(holidays[isoDate]);
              const isFilled = Boolean(filledDates?.[isoDate]);
              const isToday = date.getTime() === today.getTime();

              const disabled = isSunday || isHoliday;

              return (
                <button
                  key={idx}
                  disabled={disabled}
                  onClick={() => onSelectDate(isoDate, isFilled)}
                  className={`
                      relative aspect-square
                      rounded-xl
                      border p-2
                      text-sm font-semibold
                      transition-all
                      ${
                        isFilled
                          ? "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-400 dark:border-emerald-400 text-emerald-800 dark:text-emerald-200"
                          : isToday
                            ? "bg-white dark:bg-indigo-800/40 border-slate-300 dark:border-indigo-400 text-slate-800 dark:text-white"
                            : "bg-slate-100 dark:bg-indigo-950/60 border-slate-200 dark:border-indigo-700 text-slate-400 dark:text-indigo-300"
                      }
                      ${
                        disabled
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:scale-[1.04] hover:shadow-md"
                      }
                    `}
                >
                  <div className="text-sm font-bold">{date.getDate()}</div>

                  {isHoliday && (
                    <span className="text-[8px] text-red-600 absolute bottom-1 left-1 right-1 truncate">
                      Libur
                    </span>
                  )}

                  {isSunday && !isHoliday && (
                    <span className="text-[8px] text-red-500 absolute bottom-1 left-1 right-1 truncate">
                      Minggu
                    </span>
                  )}

                  {isFilled && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
                  )}

                  {!isFilled && isToday && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600 dark:text-indigo-200">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Sudah diisi</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-300" />
              <span>Belum diisi</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500" />
              <span>Hari ini</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ================= STATISTICS ================= */
  const totalPeserta = peserta.length;

  const totalLogbook = peserta.reduce((sum, p) => sum + p.totalLogbooks, 0);

  const totalApproved = peserta.reduce((sum, p) => sum + p.approvedLogbooks, 0);

  const totalPending = peserta.reduce((sum, p) => sum + p.pendingLogbooks, 0);

  const totalRejected = peserta.reduce((sum, p) => sum + p.rejectedLogbooks, 0);

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
        <h1 className="flex items-center gap-3 tracking-tight mb-2">
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
            Logbook Peserta
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Kelola dan review logbook semua peserta magang
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Total Peserta"
          value={totalPeserta}
          icon={<HiUser className="w-7 h-7" />}
          note="Peserta dengan logbook"
          color="indigo"
        />

        <StatCard
          title="Total Logbook"
          value={totalLogbook}
          icon={<HiDocumentText className="w-7 h-7" />}
          note="Seluruh logbook terkirim"
          color="blue"
        />

        <StatCard
          title="Disetujui"
          value={totalApproved}
          icon={<HiCheckCircle className="w-7 h-7" />}
          note="Logbook disetujui"
          color="emerald"
        />

        <StatCard
          title="Menunggu"
          value={totalPending}
          icon={<HiClock className="w-7 h-7" />}
          note="Menunggu persetujuan"
          color="amber"
        />

        <StatCard
          title="Ditolak"
          value={totalRejected}
          icon={<HiXCircle className="w-7 h-7" />}
          note="Logbook ditolak"
          color="slate"
        />
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7F1D1D] dark:text-indigo-400 w-5 h-5 z-10" />
          <input
            type="text"
            placeholder="Cari peserta berdasarkan nama atau email..."
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm sm:text-base">
            {/* ================= HEAD ================= */}
            <thead>
              <tr
                className="
                    bg-slate-50 dark:bg-indigo-500/10
                    border-b border-slate-200 dark:border-indigo-500/30
                  "
              >
                {[
                  "No",
                  "Peserta",
                  "Status",
                  "Logbook",
                  "Disetujui",
                  "Menunggu",
                  "Ditolak",
                  "Aksi",
                ].map((h) => (
                  <th
                    key={h}
                    className="
                        py-4 px-6
                        text-center
                        text-xs font-semibold uppercase
                        text-slate-600 dark:text-indigo-200
                      "
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            {/* ================= BODY ================= */}
            <tbody className="divide-y divide-slate-100 dark:divide-indigo-500/20">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto" />
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-14 text-center text-slate-500 dark:text-slate-400"
                  >
                    {search
                      ? "Peserta tidak ditemukan"
                      : "Tidak ada data peserta"}
                  </td>
                </tr>
              ) : (
                currentItems.map((p, index) => (
                  <tr
                    key={p._id}
                    className="hover:bg-[#FEF3C7]/40 dark:hover:bg-indigo-500/10 transition"
                  >
                    {/* NO */}
                    <td className="py-4 px-6 text-center font-medium text-slate-500">
                      {indexOfFirstItem + index + 1}
                    </td>

                    {/* PESERTA */}
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-3">
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
                        <div className="text-left leading-tight">
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {p.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {p.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="py-4 px-6 text-center">
                      {getStatusBadge(p.status)}
                    </td>

                    {/* TOTAL LOGBOOK */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <HiDocumentText className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold">
                          {p.totalLogbooks || 0}
                        </span>
                      </div>
                    </td>

                    {/* DISETUJUI */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center items-center gap-2 text-emerald-600">
                        <HiCheckCircle className="w-4 h-4" />
                        <span className="font-semibold">
                          {p.approvedLogbooks || 0}
                        </span>
                      </div>
                    </td>

                    {/* MENUNGGU */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center items-center gap-2 text-amber-600">
                        <HiClock className="w-4 h-4" />
                        <span className="font-semibold">
                          {p.pendingLogbooks || 0}
                        </span>
                      </div>
                    </td>

                    {/* DITOLAK */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center items-center gap-2 text-red-600">
                        <HiXCircle className="w-4 h-4" />
                        <span className="font-semibold">
                          {p.rejectedLogbooks || 0}
                        </span>
                      </div>
                    </td>

                    {/* AKSI */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center gap-2 flex-wrap">
                        {/* LIHAT */}
                        <button
                          onClick={() => handleViewCalendar(p)}
                          disabled={p.totalLogbooks === 0}
                          className="
                              inline-flex items-center gap-2
                              px-3 py-2
                              rounded-lg
                              text-sm font-semibold
                              text-white
                              bg-linear-to-r from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                              dark:from-indigo-600 dark:to-violet-500
                              shadow
                              hover:shadow-xl
                              transition
                              disabled:opacity-50
                            "
                        >
                          <FiEye />
                          Lihat
                        </button>

                        {/* DOWNLOAD */}
                        <button
                          onClick={() => handleDownloadPDF(p._id, p.name)}
                          disabled={
                            p.totalLogbooks === 0 || downloadingId === p._id
                          }
                          className="
                              inline-flex items-center gap-2
                              px-3 py-2
                              rounded-lg
                              text-sm font-semibold
                              text-white
                              bg-emerald-600 hover:bg-emerald-700
                              shadow
                              transition
                              disabled:opacity-50
                            "
                        >
                          {downloadingId === p._id ? "..." : "PDF"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================== PAGINATION BUTTON ===================== */}
      {totalPage > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 py-5">
          {/* PREV */}
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

          {/* PAGE NUMBER */}
          {Array.from({ length: totalPage }).map((_, i) => {
            const active = page === i + 1;

            return (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`
                    min-w-9.5 h-9.5
                    rounded-lg
                    text-sm font-semibold
                    transition
                    ${
                      active
                        ? `
                          bg-[#B91C1C] text-white shadow
                          dark:bg-indigo-600 dark:text-white
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
                {i + 1}
              </button>
            );
          })}

          {/* NEXT */}
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

      {/* Calendar Modal */}
      {showCalendarModal && selectedPeserta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-md p-3 sm:p-6">
          <div
            className="
              w-full max-w-5xl
              bg-white/90 dark:bg-indigo-950/40
              backdrop-blur
              rounded-3xl
              border border-slate-200 dark:border-indigo-500/30
              shadow-2xl
              flex flex-col
              max-h-[92vh]
              overflow-hidden
            "
          >
            {/* Header */}
            <div
              className="
                px-5 sm:px-6 py-4 sm:py-5
                bg-linear-to-r
                from-[#F59E0B] via-[#B91C1C] to-[#7F1D1D]
                dark:from-indigo-600 dark:to-violet-500
                text-white
                flex items-center justify-between
              "
            >
              {/* LEFT */}
              <div className="flex items-center gap-3">
                <HiCalendar className="text-xl" />
                <div>
                  <h2 className="text-lg font-bold">Kalender Logbook</h2>
                  <p className="text-sm opacity-90">
                    {selectedPeserta.name} • {selectedPeserta.email}
                  </p>
                </div>
              </div>

              {/* RIGHT */}
              <button
                onClick={() => {
                  setShowCalendarModal(false);
                  setSelectedPeserta(null);
                  setLogbookSummary(null);
                  setFilledDates({});
                }}
                className="
                    p-2
                    rounded-full
                    hover:bg-white/20
                    transition
                  "
              >
                <HiX className="text-xl" />
              </button>
            </div>

            {/* Summary Stats */}
            {logbookSummary && (
              <div
                className="
      px-5 sm:px-6 py-5
      border-b border-slate-200 dark:border-indigo-500/30
      bg-slate-50/80 dark:bg-indigo-950/30
    "
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {/* Total Logbook */}
                  <div className="rounded-2xl p-4 text-center bg-white dark:bg-indigo-900/40 border border-slate-200 dark:border-indigo-500/30 shadow-sm">
                    <div className="text-xl mb-1">📘</div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-white">
                      {logbookSummary.total}
                    </div>
                    <div className="text-sm font-semibold">Total Logbook</div>
                    <div className="text-xs text-slate-500">
                      Seluruh catatan
                    </div>
                  </div>

                  {/* Hadir */}
                  <div className="rounded-2xl p-4 text-center bg-white dark:bg-indigo-900/40 border border-slate-200 dark:border-indigo-500/30 shadow-sm">
                    <div className="text-xl mb-1">✅</div>
                    <div className="text-2xl font-bold text-emerald-600">
                      {logbookSummary.hadir}
                    </div>
                    <div className="text-sm font-semibold">Hadir</div>
                    <div className="text-xs text-slate-500">
                      Kehadiran valid
                    </div>
                  </div>

                  {/* Tidak Hadir Dengan Keterangan */}
                  <div className="rounded-2xl p-4 text-center bg-white dark:bg-indigo-900/40 border border-slate-200 dark:border-indigo-500/30 shadow-sm">
                    <div className="text-xl mb-1">📝</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {logbookSummary.tidakHadirDenganKeterangan}
                    </div>
                    <div className="text-sm font-semibold">
                      Tidak Hadir (Keterangan)
                    </div>
                    <div className="text-xs text-slate-500">
                      Dengan keterangan
                    </div>
                  </div>

                  {/* Tanpa Keterangan */}
                  <div className="rounded-2xl p-4 text-center bg-white dark:bg-indigo-900/40 border border-slate-200 dark:border-indigo-500/30 shadow-sm">
                    <div className="text-xl mb-1">❌</div>
                    <div className="text-2xl font-bold text-red-600">
                      {logbookSummary.tidakHadirTanpaKeterangan}
                    </div>
                    <div className="text-sm font-semibold">
                      Tidak Hadir (Tanpa Ket.)
                    </div>
                    <div className="text-xs text-slate-500">
                      Perlu perhatian
                    </div>
                  </div>

                  {/* Ditolak Mentor */}
                  <div className="rounded-2xl p-4 text-center bg-white dark:bg-indigo-900/40 border border-slate-200 dark:border-indigo-500/30 shadow-sm">
                    <div className="text-xl mb-1">⛔</div>
                    <div className="text-2xl font-bold text-amber-600">
                      {logbookSummary.ditolakMentor}
                    </div>
                    <div className="text-sm font-semibold">Ditolak Mentor</div>
                    <div className="text-xs text-slate-500">Perlu revisi</div>
                  </div>
                </div>
              </div>
            )}

            {/* Calendar */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div
                className="
                  rounded-2xl
                  bg-white dark:bg-indigo-950/40
                  border border-slate-200 dark:border-indigo-500/30
                  p-3 sm:p-4
                "
              >
                <Calendar
                  onSelectDate={handleSelectDate}
                  filledDates={filledDates}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-indigo-500/30">
              <button
                onClick={() => {
                  setShowCalendarModal(false);
                  setSelectedPeserta(null);
                  setLogbookSummary(null);
                  setFilledDates({});
                }}
                className="
                    w-full
                    px-6 py-2.5
                    rounded-xl
                    bg-linear-to-r from-[#F59E0B] via-[#B91C1C] to-[#7F1D1D]
                    hover:from-amber-400 hover:via-[#DC2626] hover:to-[#991B1B]
                    dark:bg-linear-to-r dark:from-indigo-600 dark:to-violet-500
                    dark:hover:from-indigo-500 dark:hover:to-violet-400
                    text-white font-semibold
                    shadow-md hover:shadow-xl
                    transition-all
                  "
              >
                Tutup Kalender
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Superadmin Logbook Detail Modal */}
      {showSuperadminModal && selectedLogbook && (
        <SuperadminLogbookModal
          logbook={selectedLogbook}
          onClose={() => {
            setShowSuperadminModal(false);
            setSelectedLogbook(null);
            setSelectedDate(null);
          }}
          onAction={handleSuperadminAction}
          userRole="superadmin"
          userName="Superadmin"
        />
      )}
    </div>
  );
}

type StatCardColor = "indigo" | "emerald" | "amber" | "slate" | "blue";

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
    blue: "bg-blue-500 dark:bg-blue-600",
  };

  const textColorMap: Record<StatCardColor, string> = {
    indigo: "text-[#7F1D1D] dark:text-white",
    emerald: "text-[#7F1D1D] dark:text-white",
    amber: "text-[#7F1D1D] dark:text-white",
    slate: "text-[#7F1D1D] dark:text-white",
    blue: "text-[#7F1D1D] dark:text-white",
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
