"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarPlus,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { showToast } from "@/components/ui/toastDashboard";
import { useConfirm } from "@/components/ui/ConfirmProvider";

type HolidayType = "libur_nasional" | "cuti_bersama" | "khusus";

interface HolidayItem {
  _id: string;
  date: string;
  name: string;
  type: HolidayType;
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

/**
 * Halaman pengelolaan Tanggal Merah / Hari Libur Nasional & Cuti Bersama.
 * Digunakan oleh cron reminder absen pulang jam 19.00 WIB agar tidak mengirim pengingat saat hari libur.
 */
export default function KelolaHariLiburView() {
  const confirm = useConfirm();
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [search, setSearch] = useState("");

  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<HolidayType>("libur_nasional");

  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE}/holidays`, {
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
    fetchHolidays();
  }, [fetchHolidays]);

  const filteredHolidays = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return holidays;
    return holidays.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.date.toLowerCase().includes(q) ||
        TYPE_META[h.type]?.label.toLowerCase().includes(q),
    );
  }, [holidays, search]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !name.trim()) {
      showToast.error("Tanggal dan keterangan hari libur wajib diisi");
      return;
    }

    setSubmitting(true);
    const toastId = showToast.loading("Menyimpan hari libur...");
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

      showToast.updateSuccess(toastId, "Hari libur berhasil disimpan");
      setDate("");
      setName("");
      setType("libur_nasional");
      await fetchHolidays();
    } catch (err: unknown) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal menyimpan hari libur",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSeed2026 = async () => {
    setSeeding(true);
    const toastId = showToast.loading("Memuat libur nasional 2026...");
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE}/holidays/seed-2026`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || "Gagal sinkronisasi libur 2026");
      }
      showToast.updateSuccess(
        toastId,
        json?.message || "Daftar libur nasional 2026 diperbarui",
      );
      await fetchHolidays();
    } catch (err: unknown) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal memuat libur 2026",
      );
    } finally {
      setSeeding(false);
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
          await fetchHolidays();
        } catch (err: unknown) {
          showToast.updateError(
            toastId,
            err instanceof Error ? err.message : "Gagal menghapus hari libur",
          );
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <CalendarDays className="w-6 h-6 text-[#1D64F2]" />
            <span>Hari Libur Nasional &amp; Cuti Bersama</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Daftar tanggal merah digunakan untuk menonaktifkan pengingat absensi
            pukul 19.00 WIB otomatis di hari libur (selain Sabtu &amp; Minggu).
          </p>
        </div>

        <button
          type="button"
          onClick={handleSeed2026}
          disabled={seeding}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 transition disabled:opacity-60 shrink-0"
        >
          {seeding ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 text-amber-500" />
          )}
          <span>Muat Libur Nasional 2026</span>
        </button>
      </div>

      {/* Form Tambah / Update */}
      <form
        onSubmit={handleSave}
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4"
      >
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <CalendarPlus className="w-4 h-4 text-[#1D64F2]" />
          <span>Tambah atau Perbarui Tanggal Libur</span>
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
              placeholder="Contoh: Cuti Bersama Idulfitri"
              className="w-full rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#1D64F2]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Kategori
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as HolidayType)}
              className="w-full rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#1D64F2]"
            >
              <option value="libur_nasional">Libur Nasional</option>
              <option value="cuti_bersama">Cuti Bersama</option>
              <option value="khusus">Libur Khusus</option>
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
            <span>Simpan Hari Libur</span>
          </button>
        </div>
      </form>

      {/* List */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            Daftar Hari Libur ({filteredHolidays.length})
          </p>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari tanggal atau nama..."
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#1D64F2]"
              />
            </div>

            <button
              type="button"
              onClick={fetchHolidays}
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
        ) : filteredHolidays.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Belum ada data hari libur yang sesuai.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredHolidays.map((item) => {
              const meta = TYPE_META[item.type] || TYPE_META.libur_nasional;
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
    </div>
  );
}
