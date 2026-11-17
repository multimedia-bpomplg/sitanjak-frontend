"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Layers,
  Plus,
  RefreshCw,
  Save,
  SlidersHorizontal,
  Trash2,
  Users,
} from "lucide-react";
import {
  deleteKuotaBulanan,
  fetchFormasi,
  formatMonthKeyLabel,
  getMonthKeyFromDate,
  hitungKuotaBulan,
  IFormasi,
  simulasiKuotaBulanan,
  updateKuotaFormasi,
  upsertKuotaBulanan,
} from "@/services/formasiService";
import { TablePageSkeleton } from "@/components/dashboard/skeletons";
import { showToast } from "@/components/ui/toastDashboard";

const NAMA_BULAN = [
  { value: "01", label: "Januari" },
  { value: "02", label: "Februari" },
  { value: "03", label: "Maret" },
  { value: "04", label: "April" },
  { value: "05", label: "Mei" },
  { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },
  { value: "08", label: "Agustus" },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

export default function KelolaKuotaFormasiView() {
  const [formasiList, setFormasiList] = useState<IFormasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Draft input kuota standar per formasiId
  const [defaultDraft, setDefaultDraft] = useState<Record<string, string>>({});
  const [savingDefaultId, setSavingDefaultId] = useState<string | null>(null);

  // Draft input penyesuaian bulanan per formasiId
  const now = useMemo(() => new Date(), []);
  const defaultBulan = String(now.getMonth() + 1).padStart(2, "0");
  const defaultTahun = String(now.getFullYear());
  const tahunOptions = useMemo(() => {
    const y = now.getFullYear();
    return [y - 1, y, y + 1, y + 2].map(String);
  }, [now]);

  const [bulanDraft, setBulanDraft] = useState<
    Record<string, { bulan: string; tahun: string; kuota: string }>
  >({});
  const [savingBulananId, setSavingBulananId] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const data = await fetchFormasi();
        setFormasiList(data);

        const nextDefault: Record<string, string> = {};
        const nextBulan: Record<
          string,
          { bulan: string; tahun: string; kuota: string }
        > = {};

        data.forEach((item) => {
          const base = item.kuotaDefault ?? item.kuota;
          nextDefault[item._id] = String(base);
          nextBulan[item._id] = {
            bulan: bulanDraft[item._id]?.bulan || defaultBulan,
            tahun: bulanDraft[item._id]?.tahun || defaultTahun,
            kuota: bulanDraft[item._id]?.kuota || String(base),
          };
        });

        setDefaultDraft(nextDefault);
        setBulanDraft(nextBulan);
      } catch (err: any) {
        showToast.error(
          err?.response?.data?.message || "Gagal memuat data formasi",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [defaultBulan, defaultTahun],
  );

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  const handleSaveDefault = async (item: IFormasi) => {
    const raw = defaultDraft[item._id];
    const nilai = Number(raw);
    if (raw === "" || !Number.isInteger(nilai) || nilai < 0) {
      showToast.error("Kuota standar harus berupa angka bulat >= 0");
      return;
    }

    try {
      setSavingDefaultId(item._id);
      await updateKuotaFormasi(item._id, { kuota: nilai });
      showToast.success(`Kuota standar "${item.title}" diubah menjadi ${nilai}`);
      await loadData(true);
    } catch (err: any) {
      showToast.error(
        err?.response?.data?.message || "Gagal memperbarui kuota standar",
      );
    } finally {
      setSavingDefaultId(null);
    }
  };

  const handleSaveBulanan = async (item: IFormasi) => {
    const draft = bulanDraft[item._id];
    if (!draft) return;

    const monthKey = `${draft.tahun}-${draft.bulan}`;
    const nilai = Number(draft.kuota);

    if (draft.kuota === "" || !Number.isInteger(nilai) || nilai < 0) {
      showToast.error("Kuota bulanan harus berupa angka bulat >= 0");
      return;
    }

    try {
      setSavingBulananId(item._id);
      await upsertKuotaBulanan(item._id, monthKey, nilai);
      showToast.success(
        `Kuota "${item.title}" untuk ${formatMonthKeyLabel(monthKey)} diatur menjadi ${nilai} kursi`,
      );
      await loadData(true);
    } catch (err: any) {
      showToast.error(
        err?.response?.data?.message || "Gagal menyimpan kuota bulanan",
      );
    } finally {
      setSavingBulananId(null);
    }
  };

  const handleDeleteBulanan = async (item: IFormasi, monthKey: string) => {
    const key = `${item._id}_${monthKey}`;
    try {
      setDeletingKey(key);
      await deleteKuotaBulanan(item._id, monthKey);
      showToast.success(
        `Penyesuaian ${formatMonthKeyLabel(monthKey)} dihapus (kembali ke kuota standar)`,
      );
      await loadData(true);
    } catch (err: any) {
      showToast.error(
        err?.response?.data?.message || "Gagal menghapus penyesuaian kuota",
      );
    } finally {
      setDeletingKey(null);
    }
  };

  const currentMonthKey = getMonthKeyFromDate(now);
  const currentMonthLabel = formatMonthKeyLabel(currentMonthKey, "long");

  const summary = useMemo(() => {
    const totalFormasi = formasiList.length;
    const totalStandar = formasiList.reduce(
      (sum, f) => sum + (f.kuotaDefault ?? f.kuota ?? 0),
      0,
    );
    const totalBulanIni = formasiList.reduce(
      (sum, f) => sum + hitungKuotaBulan(f, now).kuotaBulan,
      0,
    );
    const totalOverride = formasiList.reduce(
      (sum, f) => sum + (f.kuotaBulanan?.length || 0),
      0,
    );
    return { totalFormasi, totalStandar, totalBulanIni, totalOverride };
  }, [formasiList, now]);

  if (loading) {
    return <TablePageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Kelola Kuota Formasi
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Atur kuota standar setiap formasi serta penyesuaian kuota khusus
            untuk bulan tertentu tanpa mengubah bulan lainnya.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors self-start sm:self-auto disabled:opacity-60"
        >
          <RefreshCw
            className={`w-4 h-4 text-[#0284c7] ${refreshing ? "animate-spin" : ""}`}
          />
          <span>{refreshing ? "Memperbarui..." : "Refresh Data"}</span>
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Formasi
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {summary.totalFormasi} Bidang
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Kuota Standar Total
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {summary.totalStandar} Kursi
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Kuota {currentMonthLabel}
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {summary.totalBulanIni} Kursi
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Penyesuaian Khusus
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {summary.totalOverride} Bulan
            </p>
          </div>
        </div>
      </div>

      {/* FORMASI LIST */}
      <div className="space-y-5">
        {formasiList.map((item) => {
          const kuotaStandar = item.kuotaDefault ?? item.kuota ?? 0;
          const infoBulanIni = hitungKuotaBulan(item, now);
          const simulasi4Bulan = simulasiKuotaBulanan(item, 4);
          const overrides = item.kuotaBulanan || [];
          const hasOverrideThisMonth = overrides.some(
            (o) => o.bulan === currentMonthKey,
          );
          const draft = bulanDraft[item._id] || {
            bulan: defaultBulan,
            tahun: defaultTahun,
            kuota: String(kuotaStandar),
          };

          return (
            <div
              key={item._id}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5"
            >
              {/* TOP ROW: TITLE & CURRENT MONTH STATUS */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </h2>
                    {hasOverrideThisMonth && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        Penyesuaian Aktif Bulan Ini
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Kuota {currentMonthLabel}:{" "}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {infoBulanIni.aktif} terisi
                    </strong>{" "}
                    dari{" "}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {infoBulanIni.kuotaBulan} kursi
                    </strong>{" "}
                    (Sisa:{" "}
                    <strong
                      className={
                        infoBulanIni.sisa === 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }
                    >
                      {infoBulanIni.sisa}
                    </strong>
                    )
                  </p>
                </div>

                {/* KUOTA STANDAR CONTROL */}
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 rounded-xl px-3 py-2 self-start md:self-auto">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    Kuota Standar:
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={defaultDraft[item._id] ?? ""}
                    onChange={(e) =>
                      setDefaultDraft((prev) => ({
                        ...prev,
                        [item._id]: e.target.value,
                      }))
                    }
                    className="w-16 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white text-center"
                  />
                  <button
                    type="button"
                    disabled={savingDefaultId === item._id}
                    onClick={() => handleSaveDefault(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>
                      {savingDefaultId === item._id ? "Menyimpan..." : "Simpan"}
                    </span>
                  </button>
                </div>
              </div>

              {/* PREVIEW 4 BULAN KE DEPAN */}
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#0284c7]" />
                  <span>Preview Kuota 4 Bulan Ke Depan</span>
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {simulasi4Bulan.map((sim) => {
                    const isCustom = overrides.some(
                      (o) => o.bulan === sim.monthKey,
                    );
                    return (
                      <div
                        key={sim.monthKey}
                        className={`rounded-xl border px-3 py-2.5 ${
                          isCustom
                            ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/70"
                            : "bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/70"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            {sim.bulanSingkat}
                          </span>
                          {isCustom && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                              Khusus
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Terisi{" "}
                          <strong className="text-slate-800 dark:text-slate-100">
                            {sim.aktif}
                          </strong>{" "}
                          / {sim.kuotaBulan} · Sisa{" "}
                          <strong
                            className={
                              sim.sisaKuota === 0
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-emerald-600 dark:text-emerald-400"
                            }
                          >
                            {sim.sisaKuota}
                          </strong>
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PENYESUAIAN KUOTA PER BULAN */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                {/* Form Tambah / Ubah Override */}
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 p-4 space-y-3">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-[#0284c7]" />
                    <span>Atur Kuota Khusus Bulan Tertentu</span>
                  </p>
                  <div className="flex flex-wrap items-end gap-2.5">
                    <div className="flex-1 min-w-[120px]">
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Bulan
                      </label>
                      <select
                        value={draft.bulan}
                        onChange={(e) =>
                          setBulanDraft((prev) => ({
                            ...prev,
                            [item._id]: { ...draft, bulan: e.target.value },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-100"
                      >
                        {NAMA_BULAN.map((b) => (
                          <option key={b.value} value={b.value}>
                            {b.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-24">
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Tahun
                      </label>
                      <select
                        value={draft.tahun}
                        onChange={(e) =>
                          setBulanDraft((prev) => ({
                            ...prev,
                            [item._id]: { ...draft, tahun: e.target.value },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-100"
                      >
                        {tahunOptions.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-24">
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Kuota
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={draft.kuota}
                        onChange={(e) =>
                          setBulanDraft((prev) => ({
                            ...prev,
                            [item._id]: { ...draft, kuota: e.target.value },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white text-center"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={savingBulananId === item._id}
                      onClick={() => handleSaveBulanan(item)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        {savingBulananId === item._id
                          ? "Menyimpan..."
                          : "Terapkan"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Daftar Penyesuaian Aktif */}
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 p-4 space-y-2.5">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Daftar Penyesuaian Bulan Khusus ({overrides.length})
                  </p>
                  {overrides.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Semua bulan menggunakan kuota standar ({kuotaStandar}{" "}
                      kursi).
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {overrides.map((ov) => {
                        const isDel =
                          deletingKey === `${item._id}_${ov.bulan}`;
                        return (
                          <div
                            key={ov.bulan}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-xs"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                const [y, m] = ov.bulan.split("-");
                                setBulanDraft((prev) => ({
                                  ...prev,
                                  [item._id]: {
                                    tahun: y,
                                    bulan: m,
                                    kuota: String(ov.kuota),
                                  },
                                }));
                              }}
                              className="font-semibold text-slate-800 dark:text-slate-100 hover:text-[#0284c7] transition-colors"
                              title="Klik untuk edit di form"
                            >
                              {formatMonthKeyLabel(ov.bulan, "long")}:{" "}
                              <span className="text-amber-600 dark:text-amber-400 font-bold">
                                {ov.kuota} kursi
                              </span>
                            </button>
                            <button
                              type="button"
                              disabled={isDel}
                              onClick={() =>
                                handleDeleteBulanan(item, ov.bulan)
                              }
                              aria-label={`Hapus penyesuaian ${ov.bulan}`}
                              className="p-0.5 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors disabled:opacity-50"
                              title="Hapus & kembali ke kuota standar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
