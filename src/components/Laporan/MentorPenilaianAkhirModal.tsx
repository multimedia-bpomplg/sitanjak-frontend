"use client";

import { useMemo, useState } from "react";
import {
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Lock,
  Save,
  ScanFace,
  User,
  X,
} from "lucide-react";
import { showToast } from "@/components/ui/toastDashboard";

export type AspectScoreData = {
  nilai: number;
  keterangan: string;
};

export type ExistingPenilaianAkhir = {
  _id?: string;
  kehadiranTaatJadwal?: AspectScoreData;
  sikapKerja?: AspectScoreData;
  penguasaanMateri?: AspectScoreData;
  praktikKerja?: AspectScoreData;
  inisiatifKomunikasi?: AspectScoreData;
  nilaiRataRata?: number;
  keteranganRataRata?: string;
  kesan?: string;
  saran?: string;
  penilaiNama?: string;
  penilaiNip?: string;
  tanggalPenilaian?: string;
};

export type PesertaPenilaianItem = {
  userId: string | null;
  nama: string;
  email: string;
  posisi: string;
  jurusan?: string;
  asal?: { jenis: string; nama: string } | null;
  tanggalMulaiMagang?: string;
  tanggalSelesaiMagang?: string;
  statusMagang?: string;
  mentorName?: string;
  absensiRef?: {
    totalHari: number;
    totalHariKerja?: number;
    tidakAbsen?: number;
    cutoffEndIso?: string | null;
    averageScore: number | null;
  };
  penilaianAkhir?: ExistingPenilaianAkhir | null;
};

type AspectKey =
  | "kehadiranTaatJadwal"
  | "sikapKerja"
  | "penguasaanMateri"
  | "praktikKerja"
  | "inisiatifKomunikasi";

type FormAspectState = Record<
  AspectKey,
  {
    nilai: string;
    keterangan: string;
  }
>;

type Props = {
  peserta: PesertaPenilaianItem;
  readOnly?: boolean;
  onClose: () => void;
  onSaved: () => void;
};

const STANDARD_PREDIKATS = new Set([
  "",
  "Sangat Baik",
  "Baik",
  "Cukup",
  "Kurang",
]);

function getPredikat(nilai: number): string {
  if (nilai >= 91) return "Sangat Baik";
  if (nilai >= 76) return "Baik";
  if (nilai >= 61) return "Cukup";
  return "Kurang";
}

function getPredikatBadgeClass(predikat: string): string {
  switch (predikat) {
    case "Sangat Baik":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
    case "Baik":
      return "bg-blue-50 text-[#1D64F2] border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800";
    case "Cukup":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
    case "Kurang":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  }
}

function formatDateIndo(dateStr?: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildInitialAspects(
  existing?: ExistingPenilaianAkhir | null,
  absensiAverageScore?: number | null,
): FormAspectState {
  const initField = (item?: AspectScoreData) => ({
    nilai:
      typeof item?.nilai === "number" && !Number.isNaN(item.nilai)
        ? String(item.nilai)
        : "",
    keterangan: item?.keterangan || "",
  });

  const lockedAttendanceScore =
    typeof absensiAverageScore === "number" &&
    !Number.isNaN(absensiAverageScore)
      ? Math.round(absensiAverageScore)
      : typeof existing?.kehadiranTaatJadwal?.nilai === "number" &&
          !Number.isNaN(existing.kehadiranTaatJadwal.nilai)
        ? existing.kehadiranTaatJadwal.nilai
        : 0;

  return {
    kehadiranTaatJadwal: {
      nilai: String(lockedAttendanceScore),
      keterangan: getPredikat(lockedAttendanceScore),
    },
    sikapKerja: initField(existing?.sikapKerja),
    penguasaanMateri: initField(existing?.penguasaanMateri),
    praktikKerja: initField(existing?.praktikKerja),
    inisiatifKomunikasi: initField(existing?.inisiatifKomunikasi),
  };
}

export default function MentorPenilaianAkhirModal({
  peserta,
  readOnly = false,
  onClose,
  onSaved,
}: Props) {
  const existing = peserta.penilaianAkhir;
  const [aspects, setAspects] = useState<FormAspectState>(() =>
    buildInitialAspects(existing, peserta.absensiRef?.averageScore),
  );
  const [kesan, setKesan] = useState(existing?.kesan || "");
  const [saran, setSaran] = useState(existing?.saran || "");
  const [penilaiNip, setPenilaiNip] = useState(existing?.penilaiNip || "");
  const [saving, setSaving] = useState(false);

  const handleScoreChange = (key: AspectKey, rawVal: string) => {
    if (key === "kehadiranTaatJadwal") return;
    // Izinkan angka desimal/bulat hingga 100
    if (rawVal !== "" && !/^\d{0,3}(\.\d{0,2})?$/.test(rawVal)) {
      return;
    }
    const numeric = rawVal === "" ? NaN : Number(rawVal);
    if (!Number.isNaN(numeric) && numeric > 100) {
      return;
    }

    setAspects((prev) => {
      const currentKet = prev[key].keterangan.trim();
      let nextKet = prev[key].keterangan;
      if (rawVal === "") {
        if (STANDARD_PREDIKATS.has(currentKet)) nextKet = "";
      } else if (!Number.isNaN(numeric) && STANDARD_PREDIKATS.has(currentKet)) {
        nextKet = getPredikat(numeric);
      }
      return {
        ...prev,
        [key]: {
          nilai: rawVal,
          keterangan: nextKet,
        },
      };
    });
  };

  const handleKetChange = (key: AspectKey, val: string) => {
    if (key === "kehadiranTaatJadwal") return;
    setAspects((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        keterangan: val,
      },
    }));
  };

  const summaryCalc = useMemo(() => {
    const keys: AspectKey[] = [
      "kehadiranTaatJadwal",
      "sikapKerja",
      "penguasaanMateri",
      "praktikKerja",
      "inisiatifKomunikasi",
    ];
    const parsedValues = keys
      .map((k) =>
        aspects[k].nilai === "" ? NaN : Number(aspects[k].nilai),
      )
      .filter((v) => Number.isFinite(v) && v >= 0 && v <= 100);

    const isComplete = parsedValues.length === 5;
    const rataRata =
      parsedValues.length > 0
        ? Number(
            (
              parsedValues.reduce((acc, v) => acc + v, 0) / parsedValues.length
            ).toFixed(2),
          )
        : null;
    const predikat = rataRata !== null ? getPredikat(rataRata) : "";
    return { isComplete, rataRata, predikat };
  }, [aspects]);

  const handleSubmit = async () => {
    if (!peserta.userId) {
      showToast.error(
        "Akun user peserta belum tertaut. Pastikan peserta sudah aktif.",
      );
      return;
    }

    const keys: Array<{ key: AspectKey; label: string }> = [
      { key: "kehadiranTaatJadwal", label: "1.A Kehadiran dan Taat Jadwal" },
      { key: "sikapKerja", label: "1.B Sikap Kerja" },
      { key: "penguasaanMateri", label: "2.A Penguasaan Materi" },
      { key: "praktikKerja", label: "2.B Praktik Kerja" },
      {
        key: "inisiatifKomunikasi",
        label: "2.C Inisiatif dan Hubungan Kerja/Komunikasi",
      },
    ];

    for (const item of keys) {
      const valStr = aspects[item.key].nilai.trim();
      const num = valStr === "" ? NaN : Number(valStr);
      if (!Number.isFinite(num) || num < 0 || num > 100) {
        showToast.error(
          `Mohon isi nilai valid (0–100) pada komponen ${item.label}.`,
        );
        return;
      }
    }

    setSaving(true);
    const toastId = showToast.loading("Menyimpan Penilaian Akhir Magang...");

    try {
      const token = localStorage.getItem("token") ?? "";
      const payload = {
        kehadiranTaatJadwal: {
          nilai: Number(aspects.kehadiranTaatJadwal.nilai),
          keterangan: aspects.kehadiranTaatJadwal.keterangan.trim(),
        },
        sikapKerja: {
          nilai: Number(aspects.sikapKerja.nilai),
          keterangan: aspects.sikapKerja.keterangan.trim(),
        },
        penguasaanMateri: {
          nilai: Number(aspects.penguasaanMateri.nilai),
          keterangan: aspects.penguasaanMateri.keterangan.trim(),
        },
        praktikKerja: {
          nilai: Number(aspects.praktikKerja.nilai),
          keterangan: aspects.praktikKerja.keterangan.trim(),
        },
        inisiatifKomunikasi: {
          nilai: Number(aspects.inisiatifKomunikasi.nilai),
          keterangan: aspects.inisiatifKomunikasi.keterangan.trim(),
        },
        keteranganRataRata: summaryCalc.predikat,
        kesan: kesan.trim(),
        saran: saran.trim(),
        penilaiNip: penilaiNip.trim(),
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/penilaian-akhir/mentor/${peserta.userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Gagal menyimpan penilaian akhir");
      }

      showToast.updateSuccess(
        toastId,
        data?.message || "Penilaian Akhir Magang berhasil disimpan!",
      );
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menyimpan penilaian";
      showToast.updateError(toastId, msg);
    } finally {
      setSaving(false);
    }
  };

  const renderAspectRow = (key: AspectKey, label: string) => {
    const isLocked = readOnly || key === "kehadiranTaatJadwal";
    const isAutoAttendance = key === "kehadiranTaatJadwal";

    return (
      <tr key={key} className="bg-white dark:bg-slate-900/50">
        <td className="border-b border-r border-slate-200 dark:border-slate-700 px-3 py-2.5 text-center" />
        <td className="border-b border-r border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span>{label}</span>
            {isAutoAttendance && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                <Lock className="w-2.5 h-2.5" />
                Otomatis Absensi
              </span>
            )}
          </div>
        </td>
        <td className="border-b border-r border-slate-200 dark:border-slate-700 px-2.5 py-2 text-center">
          {isLocked ? (
            <span
              className={`inline-flex items-center justify-center gap-1 text-xs sm:text-sm font-bold tabular-nums ${
                isAutoAttendance && !readOnly
                  ? "w-20 sm:w-24 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 px-2 py-1.5 text-slate-700 dark:text-slate-200 cursor-not-allowed"
                  : "text-slate-900 dark:text-white"
              }`}
              title={
                isAutoAttendance
                  ? "Nilai dikunci otomatis berdasarkan kehadiran peserta"
                  : undefined
              }
            >
              {aspects[key].nilai !== "" ? aspects[key].nilai : "-"}
            </span>
          ) : (
            <input
              type="text"
              inputMode="decimal"
              value={aspects[key].nilai}
              onChange={(e) => handleScoreChange(key, e.target.value)}
              placeholder="0–100"
              className="w-20 sm:w-24 text-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#1D64F2] focus:ring-2 focus:ring-[#1D64F2]/20 tabular-nums"
            />
          )}
        </td>
        <td className="border-b border-slate-200 dark:border-slate-700 px-2.5 py-2">
          {isLocked ? (
            <span
              className={`block text-xs sm:text-sm ${
                isAutoAttendance && !readOnly
                  ? "w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 text-slate-700 dark:text-slate-200 font-semibold cursor-not-allowed"
                  : "text-slate-700 dark:text-slate-200"
              }`}
            >
              {aspects[key].keterangan || "-"}
            </span>
          ) : (
            <input
              type="text"
              value={aspects[key].keterangan}
              onChange={(e) => handleKetChange(key, e.target.value)}
              placeholder="Otomatis / isi keterangan"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#1D64F2] focus:ring-2 focus:ring-[#1D64F2]/20"
            />
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5">
      <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* HEADER */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
                {readOnly
                  ? "Detail Penilaian Akhir Magang"
                  : existing
                    ? "Edit Penilaian Akhir Magang"
                    : "Input Penilaian Akhir Magang"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
                {readOnly ? (
                  <>
                    Rincian hasil penilaian akhir magang untuk{" "}
                    <b>{peserta.nama}</b>
                  </>
                ) : (
                  <>
                    Isi nilai 0–100 tiap aspek, kesan, dan saran untuk{" "}
                    <b>{peserta.nama}</b>
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#F8FAFC] dark:bg-slate-950/40">
          {/* INFO PESERTA & REFERENSI ABSENSI */}
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-[#1D64F2] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-slate-500">Nama Peserta</p>
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    {peserta.nama}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <GraduationCap className="w-4 h-4 text-[#1D64F2] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-slate-500">
                    {peserta.asal?.jenis || "Instansi"}
                  </p>
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    {peserta.asal?.nama || "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-[#1D64F2] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-slate-500">Unit Kerja / Bidang</p>
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    {peserta.posisi}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-[#1D64F2] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-slate-500">Periode Magang</p>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {formatDateIndo(peserta.tanggalMulaiMagang)} –{" "}
                    {formatDateIndo(peserta.tanggalSelesaiMagang)}
                  </p>
                </div>
              </div>
            </div>

            {(peserta.mentorName || existing?.penilaiNama) && (
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
                {peserta.mentorName && (
                  <span>
                    Mentor Pembimbing:{" "}
                    <b className="text-slate-900 dark:text-white">
                      {peserta.mentorName}
                    </b>
                  </span>
                )}
                {existing?.penilaiNama && (
                  <span>
                    Terakhir dinilai oleh{" "}
                    <b className="text-slate-900 dark:text-white">
                      {existing.penilaiNama}
                    </b>
                    {existing.tanggalPenilaian
                      ? ` (${formatDateIndo(existing.tanggalPenilaian)})`
                      : ""}
                  </span>
                )}
              </div>
            )}

            {peserta.absensiRef && (
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <ScanFace className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Nilai Kehadiran Magang (s/d H-3 Selesai):{" "}
                    <b className="text-slate-900 dark:text-white">
                      {peserta.absensiRef.averageScore ?? 0}
                    </b>{" "}
                    ({peserta.absensiRef.totalHari} hadir dari{" "}
                    {peserta.absensiRef.totalHariKerja ??
                      peserta.absensiRef.totalHari}{" "}
                    hari kerja)
                  </span>
                </div>

                <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                  <Lock className="w-3 h-3" />
                  <span>Terkunci otomatis pada Poin 1.A</span>
                </span>
              </div>
            )}
          </div>

          {/* TABEL INPUT PENILAIAN */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <table className="w-full border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold">
                  <th className="border-b border-r border-slate-200 dark:border-slate-700 px-3 py-2.5 text-center w-12">
                    No
                  </th>
                  <th className="border-b border-r border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-left min-w-[230px]">
                    Rincian
                  </th>
                  <th className="border-b border-r border-slate-200 dark:border-slate-700 px-3 py-2.5 text-center w-28 sm:w-32">
                    Nilai (0–100)
                  </th>
                  <th className="border-b border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-left min-w-[190px]">
                    Keterangan
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-slate-50/90 dark:bg-slate-800/60 font-bold text-slate-900 dark:text-white">
                  <td className="border-b border-r border-slate-200 dark:border-slate-700 px-3 py-2.5 text-center">
                    1
                  </td>
                  <td className="border-b border-r border-slate-200 dark:border-slate-700 px-3.5 py-2.5">
                    Kedisiplinan dan Sikap Kerja
                  </td>
                  <td className="border-b border-r border-slate-200 dark:border-slate-700 px-3 py-2.5" />
                  <td className="border-b border-slate-200 dark:border-slate-700 px-3.5 py-2.5" />
                </tr>

                {renderAspectRow(
                  "kehadiranTaatJadwal",
                  "A. Kehadiran dan Taat Jadwal",
                )}
                {renderAspectRow("sikapKerja", "B. Sikap Kerja")}

                <tr className="bg-slate-50/90 dark:bg-slate-800/60 font-bold text-slate-900 dark:text-white">
                  <td className="border-b border-r border-slate-200 dark:border-slate-700 px-3 py-2.5 text-center">
                    2
                  </td>
                  <td className="border-b border-r border-slate-200 dark:border-slate-700 px-3.5 py-2.5">
                    Kemampuan
                  </td>
                  <td className="border-b border-r border-slate-200 dark:border-slate-700 px-3 py-2.5" />
                  <td className="border-b border-slate-200 dark:border-slate-700 px-3.5 py-2.5" />
                </tr>

                {renderAspectRow("penguasaanMateri", "A. Penguasaan Materi")}
                {renderAspectRow("praktikKerja", "B. Praktik Kerja")}
                {renderAspectRow(
                  "inisiatifKomunikasi",
                  "C. Inisiatif dan Hubungan Kerja/Komunikasi",
                )}

                {/* NILAI RATA-RATA OTOMATIS */}
                <tr className="bg-blue-50/60 dark:bg-blue-950/30 font-bold text-slate-900 dark:text-white">
                  <td className="border-r border-slate-200 dark:border-slate-700 px-3 py-3 text-center" />
                  <td className="border-r border-slate-200 dark:border-slate-700 px-3.5 py-3">
                    Nilai Rata-Rata (Otomatis)
                  </td>
                  <td className="border-r border-slate-200 dark:border-slate-700 px-3 py-3 text-center text-[#1D64F2] dark:text-blue-400 tabular-nums">
                    {summaryCalc.rataRata !== null ? summaryCalc.rataRata : "-"}
                  </td>
                  <td className="px-3.5 py-3">
                    {summaryCalc.predikat ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getPredikatBadgeClass(
                          summaryCalc.predikat,
                        )}`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {summaryCalc.predikat}
                      </span>
                    ) : (
                      <span className="text-xs font-normal text-slate-400">
                        Menunggu input nilai
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ACUAN NILAI HORIZONTAL */}
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-2">
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              Acuan Nilai :
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                {
                  range: "91-100",
                  label: "Sangat Baik",
                  color: "text-emerald-700 dark:text-emerald-400",
                },
                {
                  range: "76-90",
                  label: "Baik",
                  color: "text-[#1D64F2] dark:text-blue-400",
                },
                {
                  range: "61-75",
                  label: "Cukup",
                  color: "text-amber-700 dark:text-amber-400",
                },
                {
                  range: "< 61",
                  label: "Kurang",
                  color: "text-red-600 dark:text-red-400",
                },
              ].map((item) => (
                <div
                  key={item.range}
                  className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700"
                >
                  <span className="font-medium text-slate-600 dark:text-slate-300 tabular-nums">
                    {item.range}
                  </span>
                  <span className={`font-bold ${item.color}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* KESAN, SARAN & NIP OPSIONAL */}
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Kesan
              </label>
              {readOnly ? (
                <p className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                  {kesan || "-"}
                </p>
              ) : (
                <textarea
                  rows={3}
                  value={kesan}
                  onChange={(e) => setKesan(e.target.value)}
                  placeholder="Tuliskan kesan terhadap kinerja, sikap, dan kontribusi peserta selama magang..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#1D64F2] focus:ring-2 focus:ring-[#1D64F2]/20"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Saran
              </label>
              {readOnly ? (
                <p className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                  {saran || "-"}
                </p>
              ) : (
                <textarea
                  rows={3}
                  value={saran}
                  onChange={(e) => setSaran(e.target.value)}
                  placeholder="Tuliskan saran membangun untuk pengembangan kompetensi peserta ke depan..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#1D64F2] focus:ring-2 focus:ring-[#1D64F2]/20"
                />
              )}
            </div>

            {readOnly ? (
              penilaiNip ? (
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  NIP Pembimbing:{" "}
                  <b className="text-slate-900 dark:text-white">{penilaiNip}</b>
                </div>
              ) : null
            ) : (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  NIP Pembimbing (Opsional — untuk ditampilkan di PDF peserta)
                </label>
                <input
                  type="text"
                  value={penilaiNip}
                  onChange={(e) => setPenilaiNip(e.target.value)}
                  placeholder="Contoh: 198501012010121001"
                  className="w-full sm:max-w-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#1D64F2] focus:ring-2 focus:ring-[#1D64F2]/20"
                />
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          {readOnly ? (
            <>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mode pantau Admin / Superadmin (hanya Mentor pembimbing yang
                dapat mengisi atau mengubah nilai).
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
              >
                Tutup
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {summaryCalc.isComplete
                  ? "Semua 5 komponen nilai telah terisi dan siap disimpan."
                  : "Lengkapi seluruh 5 komponen nilai (0–100) untuk menyimpan."}
              </p>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving || !summaryCalc.isComplete}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#1D64F2] hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition inline-flex items-center justify-center gap-2 shadow-2xs"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {saving ? "Menyimpan..." : "Simpan Penilaian Akhir"}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
