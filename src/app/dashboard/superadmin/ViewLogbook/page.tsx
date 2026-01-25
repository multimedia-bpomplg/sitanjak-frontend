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
    // Filter logbook untuk peserta tertentu
    const pesertaLogbooks = allLogbooks.filter(
      (logbook) => logbook.user._id === pesertaId,
    );

    // Hitung summary
    const summary: LogbookSummary = {
      total: pesertaLogbooks.length,
      hadir: pesertaLogbooks.filter((l) => l.status === "hadir").length,
      tidakHadirDenganKeterangan: pesertaLogbooks.filter(
        (l) => l.status === "tidak_hadir_keterangan",
      ).length,
      tidakHadirTanpaKeterangan: pesertaLogbooks.filter(
        (l) => l.status === "tidak_hadir_tanpa_keterangan",
      ).length,
    };

    // Buat filledDates dari logbook yang ada
    const dates: Record<string, string> = {};
    pesertaLogbooks.forEach((logbook) => {
      dates[logbook.date] = logbook._id; // Simpan ID logbook untuk referensi
    });

    setLogbookSummary(summary);
    setFilledDates(dates);
  };

  const handleViewCalendar = (peserta: Peserta) => {
    setSelectedPeserta(peserta);
    loadPesertaLogbookSummary(peserta._id);
    setShowCalendarModal(true);
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
      setLogbookModalData(data);
    } catch (error) {
      console.error("Gagal mengambil detail logbook", error);
      // Fallback: coba ambil dari data yang sudah dimuat
      const fallbackLogbook = allLogbooks.find(
        (logbook) =>
          logbook.user._id === selectedPeserta._id && logbook.date === date,
      );
      if (fallbackLogbook) {
        setLogbookModalData(fallbackLogbook);
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
        <div className="rounded-2xl bg-white/80 backdrop-blur shadow-lg p-6">
          {/* Header */}
          <div className="relative mb-4 flex items-center justify-end">
            <h2 className="absolute left-4 sm:left-1/2 sm:-translate-x-1/2 text-lg font-extrabold text-slate-900">
              {currentMonth.toLocaleDateString("id-ID", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                className="h-8 w-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 transition"
              >
                ←
              </button>
              <button
                onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                className="h-8 w-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 transition"
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
                    rounded-lg
                    border p-2
                    ${
                      isFilled
                        ? "bg-emerald-50 border-emerald-400 hover:bg-emerald-100"
                        : isToday
                          ? "bg-white border-slate-300 hover:bg-slate-50"
                          : "bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200"
                    }
                    ${disabled ? "cursor-not-allowed bg-slate-50" : "cursor-pointer hover:shadow-md"}
                    transition-colors
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
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
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

  // Logbook Modal Component
  const LogbookModal = () => {
    if (!selectedDate || !selectedPeserta) return null;

    const formatDate = (dateString: string) => {
      const dateObj = new Date(dateString);
      return dateObj.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    };

    const getImageUrl = (path: string) => {
      if (!path) return "";
      if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
      }
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      return `${baseUrl.replace(/\/$/, "")}/${path}`;
    };

    if (isLoadingDetail) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-center text-slate-600">Memuat logbook...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HiCalendar className="text-xl" />
                <div>
                  <h2 className="text-lg font-bold">
                    {logbookModalData ? "Detail Logbook" : "Logbook Kosong"}
                  </h2>
                  <p className="text-sm opacity-90">
                    {selectedPeserta.name} • {formatDate(selectedDate)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedDate(null);
                  setLogbookModalData(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition"
              >
                <HiX className="text-xl" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {logbookModalData ? (
              <>
                {/* Status Approval */}
                <div className="mb-4">
                  {getApprovalBadge(logbookModalData.approvalStatus)}
                </div>

                {/* Status Kehadiran */}
                <div className="space-y-3">
                  <label className="font-semibold text-slate-700">
                    Status Kehadiran
                  </label>
                  <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-slate-50">
                    <span className="font-semibold">
                      {logbookModalData.status === "hadir"
                        ? "✅ Hadir"
                        : logbookModalData.status === "tidak_hadir_keterangan"
                          ? "ℹ Tidak Hadir (Dengan Keterangan)"
                          : "❌ Tidak Hadir (Tanpa Keterangan)"}
                    </span>
                  </div>
                </div>

                {logbookModalData.status === "hadir" && (
                  <>
                    {/* Uraian Aktivitas */}
                    <div className="space-y-3">
                      <label className="font-semibold text-slate-700">
                        Uraian Aktivitas
                      </label>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 min-h-[100px] whitespace-pre-line">
                        {logbookModalData.judul || "-"}
                      </div>
                    </div>

                    {/* Pembelajaran */}
                    <div className="space-y-3">
                      <label className="font-semibold text-slate-700">
                        Pembelajaran
                      </label>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 min-h-[100px] whitespace-pre-line">
                        {logbookModalData.pengalaman || "-"}
                      </div>
                    </div>

                    {/* Kendala */}
                    <div className="space-y-3">
                      <label className="font-semibold text-slate-700">
                        Kendala
                      </label>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 min-h-[100px] whitespace-pre-line">
                        {logbookModalData.kendala || "-"}
                      </div>
                    </div>

                    {/* Dokumentasi */}
                    {logbookModalData.files &&
                      logbookModalData.files.length > 0 && (
                        <div className="space-y-3">
                          <label className="font-semibold text-slate-700">
                            Dokumentasi
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {logbookModalData.files.map(
                              (file: string, i: number) => (
                                <div key={i} className="relative group">
                                  <img
                                    src={getImageUrl(file)}
                                    className="w-full h-32 object-cover rounded-lg border border-slate-200"
                                    alt={`Dokumentasi ${i + 1}`}
                                    onError={(e) => {
                                      e.currentTarget.src = `https://via.placeholder.com/300x200?text=Gambar+Tidak+Tersedia`;
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition rounded-lg flex items-center justify-center">
                                    <FiEye className="text-white opacity-0 group-hover:opacity-100 transition" />
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                  </>
                )}

                {logbookModalData.status !== "hadir" && (
                  <div className="space-y-3">
                    <label className="font-semibold text-slate-700">
                      Alasan Tidak Hadir
                    </label>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 min-h-[100px] whitespace-pre-line">
                      {logbookModalData.keterangan || "-"}
                    </div>
                  </div>
                )}

                {/* Catatan Mentor */}
                {logbookModalData.mentorNote && (
                  <div className="space-y-3">
                    <label className="font-semibold text-slate-700">
                      Catatan Mentor
                    </label>
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                      <p className="text-amber-800 whitespace-pre-line">
                        {logbookModalData.mentorNote}
                      </p>
                    </div>
                  </div>
                )}

                {/* Approved By */}
                {logbookModalData.approvedBy && (
                  <div className="space-y-3">
                    <label className="font-semibold text-slate-700">
                      Disetujui Oleh
                    </label>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <HiUser className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {logbookModalData.approvedBy.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {logbookModalData.approvedBy.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Created At */}
                {logbookModalData.createdAt && (
                  <div className="text-sm text-slate-500 text-right">
                    Dibuat:{" "}
                    {new Date(logbookModalData.createdAt).toLocaleDateString(
                      "id-ID",
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-10">
                <HiDocumentText className="text-5xl text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">
                  Logbook Belum Diisi
                </h3>
                <p className="text-slate-500">
                  Peserta belum mengisi logbook untuk tanggal ini
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
            <button
              onClick={() => {
                setSelectedDate(null);
                setLogbookModalData(null);
              }}
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <h1 className="text-3xl font-bold mb-2 text-slate-800">
        Logbook Peserta
      </h1>
      <p className="text-slate-600 mb-8">
        Kelola dan review logbook semua peserta magang
      </p>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari peserta berdasarkan nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-700 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b">
              <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase">
                No
              </th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase">
                Peserta
              </th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase">
                Status
              </th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase">
                Logbook
              </th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase">
                Disetujui
              </th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase">
                Menunggu
              </th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase">
                Ditolak
              </th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-10 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                </td>
              </tr>
            ) : currentItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-500">
                  {search
                    ? "Peserta tidak ditemukan"
                    : "Tidak ada data peserta"}
                </td>
              </tr>
            ) : (
              currentItems.map((p, index) => (
                <tr
                  key={p._id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-4 px-6">{indexOfFirstItem + index + 1}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <HiUser className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">{getStatusBadge(p.status)}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <HiDocumentText className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">
                        {p.totalLogbooks || 0}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <HiCheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="font-medium text-emerald-600">
                        {p.approvedLogbooks || 0}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <HiClock className="w-4 h-4 text-amber-500" />
                      <span className="font-medium text-amber-600">
                        {p.pendingLogbooks || 0}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <HiXCircle className="w-4 h-4 text-red-500" />
                      <span className="font-medium text-red-600">
                        {p.rejectedLogbooks || 0}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => handleViewCalendar(p)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={p.totalLogbooks === 0}
                    >
                      <FiEye />
                      {p.totalLogbooks === 0 ? "Belum Ada" : "Lihat Logbook"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
              border-slate-300
              bg-white
              text-[#7F1D1D]
              hover:bg-[#FFF1F2]
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
                  min-w-[38px] h-[38px]
                  rounded-lg
                  text-sm font-semibold
                  transition
                  ${
                    active
                      ? "bg-[#B91C1C] text-white shadow"
                      : `
                        bg-white
                        text-[#7F1D1D]
                        border border-slate-300
                        hover:bg-[#FFF1F2]
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
              border-slate-300
              bg-white
              text-[#7F1D1D]
              hover:bg-[#FFF1F2]
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HiCalendar className="text-xl" />
                  <div>
                    <h2 className="text-lg font-bold">Kalender Logbook</h2>
                    <p className="text-sm opacity-90">
                      {selectedPeserta.name} • {selectedPeserta.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCalendarModal(false);
                    setSelectedPeserta(null);
                    setLogbookSummary(null);
                    setFilledDates({});
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <HiX className="text-xl" />
                </button>
              </div>
            </div>

            {/* Summary Stats */}
            {logbookSummary && (
              <div className="px-6 py-4 bg-slate-50 border-b">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 border text-center">
                    <div className="text-2xl font-bold text-slate-800">
                      {logbookSummary.total}
                    </div>
                    <div className="text-sm text-slate-600">Total Logbook</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border text-center">
                    <div className="text-2xl font-bold text-emerald-600">
                      {logbookSummary.hadir}
                    </div>
                    <div className="text-sm text-slate-600">Hadir</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {logbookSummary.tidakHadirDenganKeterangan}
                    </div>
                    <div className="text-sm text-slate-600">Izin</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {logbookSummary.tidakHadirTanpaKeterangan}
                    </div>
                    <div className="text-sm text-slate-600">
                      Tanpa Keterangan
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Calendar */}
            <div className="flex-1 overflow-y-auto p-6">
              <Calendar
                onSelectDate={handleSelectDate}
                filledDates={filledDates}
              />
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => {
                  setShowCalendarModal(false);
                  setSelectedPeserta(null);
                  setLogbookSummary(null);
                  setFilledDates({});
                }}
                className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition"
              >
                Tutup Kalender
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logbook Detail Modal */}
      {selectedDate && <LogbookModal />}
    </div>
  );
}
