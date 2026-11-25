"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck2,
  CalendarDays,
  CalendarPlus,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { showToast } from "@/components/ui/toastDashboard";
import { useConfirm } from "@/components/ui/ConfirmProvider";

type HolidayType = "libur_nasional" | "cuti_bersama" | "khusus" | "hari_masuk";
type HolidaySource = "auto" | "manual";

interface HolidayItem {
  _id: string;
  date: string;
  name: string;
  type: HolidayType;
  originalType?: "libur_nasional" | "cuti_bersama" | null;
  source?: HolidaySource;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const TYPE_META: Record<
  HolidayType,
  { label: string; badgeClass: string }
> = {
  libur_nasional: {
    label: "Libur Nasional",
    badgeClass:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
  },
  cuti_bersama: {
    label: "Cuti Bersama",
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
  },
  khusus: {
    label: "Libur Khusus",
    badgeClass:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
  },
  hari_masuk: {
    label: "Tetap Masuk (Hari Kerja)",
    badgeClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
  },
};

function formatDisplayDate(dateIso: string): string {
  const [y, m, d] = dateIso.split("-").map(Number);
  if (!y || !m || !d) return dateIso;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("id-ID", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isAutoCalendarHoliday(item: HolidayItem): boolean {
  return (
    item.source === "auto" ||
    Boolean(item.originalType) ||
    (!item.source && item.type === "libur_nasional")
  );
}

/**
 * Halaman pengaturan Libur Hari Tertentu (Khusus / Cuti Bersama) untuk Admin & Superadmin.
 * Akhir pekan (Sabtu-Minggu) dan Libur Nasional mengikuti kalender Indonesia secara otomatis.
 */
export default function KelolaHariLiburView() {
  const confirm = useConfirm();
  const currentYear = new Date().getFullYear();

  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [showAutoCalendar, setShowAutoCalendar] = useState(false);

  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<"khusus" | "cuti_bersama" | "hari_masuk">(
    "khusus",
  );
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchHolidays = useCallback(async (year: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE}/holidays?year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Gagal memuat data hari libur");
      const json = await res.json();
      setHolidays(Array.isArray(json?.data) ? json.data : []);
    } catch (err: unknown) {
      showToast.error(
        err instanceof Error ? err.message : "Gagal memuat hari libur",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHolidays(selectedYear);
  }, [fetchHolidays, selectedYear]);

  const manualHolidays = useMemo(() => {
    const q = search.trim().toLowerCase();
    return holidays.filter((h) => {
      if (isAutoCalendarHoliday(h)) return false;
      if (!q) return true;
      return (
        h.name.toLowerCase().includes(q) ||
        h.date.toLowerCase().includes(q) ||
        TYPE_META[h.type]?.label.toLowerCase().includes(q)
      );
    });
  }, [holidays, search]);

  const autoHolidays = useMemo(() => {
    return holidays.filter((h) => isAutoCalendarHoliday(h));
  }, [holidays]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !name.trim()) {
      showToast.error("Tanggal dan keterangan hari libur wajib diisi");
      return;
    }

    setSubmitting(true);
    const toastId = showToast.loading("Menyimpan hari libur khusus...");
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE}/holidays`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ date, name: name.trim(), type }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || "Gagal menyimpan hari libur");
      }

      const savedYear = Number(date.slice(0, 4));
      showToast.updateSuccess(
        toastId,
        json?.message || "Pengaturan tanggal berhasil disimpan",
      );
      setDate("");
      setName("");
      setType("khusus");

      if (savedYear && savedYear !== selectedYear) {
        setSelectedYear(savedYear);
      } else {
        await fetchHolidays(selectedYear);
      }
    } catch (err: unknown) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal menyimpan hari libur",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncCalendar = async () => {
    setSyncing(true);
    const toastId = showToast.loading(
      `Menyinkronkan kalender libur nasional ${selectedYear}...`,
    );
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE}/holidays/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ year: selectedYear }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          json?.message || "Gagal menyinkronkan kalender libur nasional",
        );
      }
      showToast.updateSuccess(
        toastId,
        json?.message ||
          `Kalender libur nasional ${selectedYear} berhasil disinkronkan`,
      );
      await fetchHolidays(selectedYear);
    } catch (err: unknown) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal menyinkronkan kalender",
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = (item: HolidayItem) => {
    confirm({
      title: "Hapus Hari Libur",
      message: `Hapus "${item.name}" (${item.date}) dari daftar hari libur?`,
      confirmText: "Ya, Hapus",
      onConfirm: async () => {
        const toastId = showToast.loading("Menghapus hari libur...");
        try {
          const token = localStorage.getItem("token") || "";
          const res = await fetch(`${API_BASE}/holidays/${item._id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(json?.message || "Gagal menghapus hari libur");
          }
          showToast.updateSuccess(toastId, "Hari libur dihapus");
          await fetchHolidays(selectedYear);
        } catch (err: unknown) {
          showToast.updateError(
            toastId,
            err instanceof Error ? err.message : "Gagal menghapus hari libur",
          );
        }
      },
    });
  };

  const handleToggleWorkday = (item: HolidayItem) => {
    const isCurrentlyOpen = item.type === "hari_masuk";
    confirm({
      title: isCurrentlyOpen ? "Kembalikan Jadi Hari Libur" : "Buka Hari Masuk",
      message: isCurrentlyOpen
        ? `Kembalikan tanggal ${item.date} ("${item.name}") menjadi hari libur?`
        : `Jadikan tanggal ${item.date} ("${item.name}") tetap masuk? Peserta dapat mengisi absensi & logbook pada tanggal ini.`,
      confirmText: isCurrentlyOpen ? "Ya, Jadikan Libur" : "Ya, Tetap Masuk",
      onConfirm: async () => {
        setTogglingId(item._id);
        const toastId = showToast.loading("Memperbarui status tanggal...");
        try {
          const token = localStorage.getItem("token") || "";
          const res = await fetch(
            `${API_BASE}/holidays/${item._id}/toggle-workday`,
            {
              method: "PATCH",
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          const json = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(json?.message || "Gagal mengubah status tanggal");
          }
          showToast.updateSuccess(
            toastId,
            json?.message || "Status tanggal berhasil diperbarui",
          );
          await fetchHolidays(selectedYear);
        } catch (err: unknown) {
          showToast.updateError(
            toastId,
            err instanceof Error
              ? err.message
              : "Gagal mengubah status tanggal",
          );
        } finally {
          setTogglingId(null);
        }
      },
    });
  };

  const yearOptions = useMemo(() => {
    return [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
  }, [currentYear]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <CalendarDays className="w-6 h-6 text-[#1D64F2]" />
            <span>Pengaturan Hari Libur Khusus</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Atur libur untuk hari-hari tertentu saja (misal libur khusus kantor
            atau cuti bersama tambahan). Akhir pekan (Sabtu–Minggu) dan libur
            nasional sudah mengikuti kalender secara otomatis.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            aria-label="Pilih tahun kalender"
            className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#1D64F2]"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                Tahun {y}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleSyncCalendar}
            disabled={syncing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 transition disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 text-[#1D64F2] ${syncing ? "animate-spin" : ""}`} />
            <span>Sinkron Kalender</span>
          </button>
        </div>
      </div>

      {/* Info Banner Sinkronisasi Otomatis */}
      <div className="rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-[#1D64F2] dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
          <strong>Libur Nasional Otomatis Aktif:</strong> Pada hari Sabtu,
          Minggu, serta tanggal merah kalender nasional Indonesia, absensi dan
          logbook peserta otomatis ditutup, pengingat pukul 19.00 WIB tidak
          dikirim, dan tidak mengurangi skor Kehadiran &amp; Taat Jadwal. Anda
          dapat menambah <strong>libur khusus</strong> maupun membuka kembali
          tanggal libur/cuti bersama menjadi{" "}
          <strong>Tetap Masuk (Hari Kerja)</strong> jika kantor beroperasi.
        </div>
      </div>

      {/* Form Tambah Libur Khusus */}
      <form
        onSubmit={handleSave}
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4"
      >
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <CalendarPlus className="w-4 h-4 text-[#1D64F2]" />
          <span>Tambah Libur Hari Tertentu</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Tanggal
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#1D64F2]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Keterangan Libur
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Libur Khusus Kegiatan Kantor / Cuti Bersama Lokal"
              className="w-full rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#1D64F2]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Kategori
            </label>
            <select
              value={type}
              onChange={(e) =>
                setType(
                  e.target.value as "khusus" | "cuti_bersama" | "hari_masuk",
                )
              }
              className="w-full rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#1D64F2]"
            >
              <option value="khusus">Libur Khusus</option>
              <option value="cuti_bersama">Cuti Bersama</option>
              <option value="hari_masuk">Tetap Masuk (Hari Kerja)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1D64F2] hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs transition disabled:opacity-60"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Simpan Libur Khusus</span>
          </button>
        </div>
      </form>

      {/* Daftar Libur Khusus (Manual Admin/Superadmin) */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              Daftar Libur Hari Tertentu ({manualHolidays.length})
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Libur khusus atau cuti bersama tambahan yang diatur untuk tahun{" "}
              {selectedYear}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari libur khusus..."
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#1D64F2]"
              />
            </div>

            <button
              type="button"
              onClick={() => fetchHolidays(selectedYear)}
              title="Muat ulang"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Memuat daftar hari libur...
          </div>
        ) : manualHolidays.length === 0 ? (
          <div className="p-8 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Belum ada hari libur khusus tambahan untuk tahun {selectedYear}.
            Libur nasional dan akhir pekan tetap berjalan otomatis.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {manualHolidays.map((item) => {
              const meta = TYPE_META[item.type] || TYPE_META.khusus;
              return (
                <div
                  key={item._id}
                  className="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {item.name}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDisplayDate(item.date)} ({item.date})
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    title="Hapus hari libur"
                    className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Referensi Libur Nasional Otomatis (Collapsible Read-Only) */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAutoCalendar((prev) => !prev)}
          className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CalendarCheck2 className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Kalender Libur Nasional Otomatis {selectedYear} (
                {autoHolidays.length} hari)
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tersinkronisasi otomatis mengikuti kalender Indonesia (tanpa
                perlu diinput manual).
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
            <span>{showAutoCalendar ? "Sembunyikan" : "Lihat Daftar"}</span>
            {showAutoCalendar ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </span>
        </button>

        {showAutoCalendar && (
          <div className="border-t border-slate-100 dark:border-slate-800">
            {autoHolidays.length === 0 ? (
              <div className="p-6 text-center text-xs sm:text-sm text-slate-500">
                Belum ada data kalender otomatis untuk tahun {selectedYear}.
                Klik tombol <strong>Sinkron Kalender</strong> di atas untuk
                memuatnya.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {autoHolidays.map((item) => {
                  const isOpenedAsWorkday = item.type === "hari_masuk";
                  const meta = TYPE_META[item.type] || TYPE_META.libur_nasional;
                  return (
                    <div
                      key={item._id}
                      className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {item.name}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border ${meta.badgeClass}`}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDisplayDate(item.date)} ({item.date})
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={togglingId === item._id}
                        onClick={() => handleToggleWorkday(item)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold border transition shrink-0 disabled:opacity-50 ${
                          isOpenedAsWorkday
                            ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:hover:bg-rose-950 dark:text-rose-300 dark:border-rose-800"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:hover:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                        }`}
                      >
                        {togglingId === item._id
                          ? "Memproses..."
                          : isOpenedAsWorkday
                            ? "Kembalikan Jadi Libur"
                            : "Jadikan Hari Masuk"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
