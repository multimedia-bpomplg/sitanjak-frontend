"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Download,
  FileSignature,
  ImagePlus,
  Lock,
  Save,
  Trash2,
  Upload,
  UserCheck,
} from "lucide-react";
import { PesertaDashboardSkeleton } from "@/components/dashboard/skeletons";
import { showToast } from "@/components/ui/toastDashboard";
import {
  downloadEvaluasiDanPernyataanPdf,
  EvaluasiMagangPayload,
  getEvaluasiTexts,
  RATING_LEGEND,
} from "@/lib/evaluasiPdf";
import { isPkpaPeserta } from "@/lib/pesertaKategori";

function getTodayWibIso(): string {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
  );
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateIso(raw?: string): string | null {
  if (!raw || raw === "-") return null;
  const parsed = new Date(raw);
  if (isNaN(parsed.getTime())) return null;
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shiftIsoDate(dateIso: string, deltaDays: number): string {
  const [y, m, d] = dateIso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + deltaDays);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(dt.getDate() < 10 ? 2 : 2, "0");
  return `${yy}-${mm}-${dd}`;
}

function diffDaysIso(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.split("-").map(Number);
  const [ty, tm, td] = toIso.split("-").map(Number);
  const fromMs = Date.UTC(fy, fm - 1, fd);
  const toMs = Date.UTC(ty, tm - 1, td);
  return Math.round((toMs - fromMs) / (24 * 60 * 60 * 1000));
}

function formatIsoToIndo(dateIso: string): string {
  const [y, m, d] = dateIso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function EvaluasiDanPernyataanPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [evalStatus, setEvalStatus] = useState<
    "Menunggu" | "Revisi" | "Disetujui" | null
  >(null);
  const [mentorNote, setMentorNote] = useState("");
  const [reviewedByName, setReviewedByName] = useState("");
  const [isPkpa, setIsPkpa] = useState(false);

  const [periode, setPeriode] = useState<{
    mulai?: string;
    selesai?: string;
    statusMagang?: string;
  }>({});
  const [submittedAt, setSubmittedAt] = useState<string>("");

  // Bagian A: Evaluasi Fasilitator / Pembimbing
  const [fasNama, setFasNama] = useState("");
  const [fasJudulMateri, setFasJudulMateri] = useState("");
  const [fasScores, setFasScores] = useState<number[]>([0, 0, 0, 0, 0]);
  const [fasAdaSaran, setFasAdaSaran] = useState<"Ya" | "Tidak">("Ya");
  const [fasSaran, setFasSaran] = useState("");

  // Bagian B: Evaluasi Penyelenggara
  const [penScores, setPenScores] = useState<number[]>([0, 0, 0, 0, 0]);
  const [penBermanfaat, setPenBermanfaat] = useState<"Ya" | "Tidak">("Ya");
  const [penAlasanBermanfaat, setPenAlasanBermanfaat] = useState("");
  const [penAdaMasukan, setPenAdaMasukan] = useState<"Ya" | "Tidak">("Ya");
  const [penMasukan, setPenMasukan] = useState("");

  // Bagian C: Surat Pernyataan
  const [spNama, setSpNama] = useState("");
  const [spNim, setSpNim] = useState("");
  const [spProdi, setSpProdi] = useState("");
  const [spUniv, setSpUniv] = useState("");
  const [spTanggal, setSpTanggal] = useState(getTodayWibIso());
  const [spTtdImage, setSpTtdImage] = useState("");
  const ttdInputRef = useRef<HTMLInputElement | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") ?? "";
      if (!token) return;
      const payload = JSON.parse(atob(token.split(".")[1]));
      const email = payload?.email || "";
      const headers = { Authorization: `Bearer ${token}` };

      const [evalRes, pendRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/evaluasi/me`, {
          headers,
        }).catch(() => null),
        email
          ? fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/pendaftaran/cek?email=${encodeURIComponent(email)}`,
              { headers },
            ).catch(() => null)
          : Promise.resolve(null),
      ]);

      let defaultMentorNama = "";
      let defaultNama = payload?.name || "";
      let defaultProdi = payload?.jurusan || "";
      let defaultUniv = "";
      let detectedPkpa = isPkpaPeserta(payload);

      if (pendRes && pendRes.ok) {
        const pendJson = await pendRes.json().catch(() => null);
        const found = pendJson?.peserta?.find(
          (p: { email?: string }) =>
            p.email?.toLowerCase() === email.toLowerCase(),
        );
        if (found) {
          detectedPkpa = detectedPkpa || isPkpaPeserta(found);
          defaultNama = found.nama || defaultNama;
          defaultProdi = found.jurusan || defaultProdi;
          defaultUniv = found.asal?.nama || "";
          defaultMentorNama =
            found.mentor?.name || found.mentorNama || defaultMentorNama;
          setPeriode({
            mulai: found.tanggalMulaiMagang,
            selesai: found.tanggalSelesaiMagang,
            statusMagang: found.statusMagang,
          });
        }
      }
      setIsPkpa(detectedPkpa);

      if (evalRes && evalRes.ok) {
        const evalJson = await evalRes.json().catch(() => null);
        const ev = evalJson?.evaluasi;
        if (ev) {
          setHasSaved(true);
          setEvalStatus(ev.status || "Menunggu");
          setSubmittedAt(ev.submittedAt || ev.createdAt || "");
          setMentorNote(ev.mentorNote || "");
          setReviewedByName(ev.reviewedByName || ev.reviewedBy?.name || "");
          setFasNama(ev.fasilitator?.nama || defaultMentorNama);
          setFasJudulMateri(ev.fasilitator?.judulMateri || "");
          setFasScores([
            ev.fasilitator?.skor1 || 0,
            ev.fasilitator?.skor2 || 0,
            ev.fasilitator?.skor3 || 0,
            ev.fasilitator?.skor4 || 0,
            ev.fasilitator?.skor5 || 0,
          ]);
          setFasAdaSaran(ev.fasilitator?.adaSaran === "Tidak" ? "Tidak" : "Ya");
          setFasSaran(ev.fasilitator?.saran || "");

          setPenScores([
            ev.penyelenggara?.skor1 || 0,
            ev.penyelenggara?.skor2 || 0,
            ev.penyelenggara?.skor3 || 0,
            ev.penyelenggara?.skor4 || 0,
            ev.penyelenggara?.skor5 || 0,
          ]);
          setPenBermanfaat(
            ev.penyelenggara?.bermanfaat === "Tidak" ? "Tidak" : "Ya",
          );
          setPenAlasanBermanfaat(ev.penyelenggara?.alasanBermanfaat || "");
          setPenAdaMasukan(
            ev.penyelenggara?.adaMasukan === "Tidak" ? "Tidak" : "Ya",
          );
          setPenMasukan(ev.penyelenggara?.masukan || "");

          setSpNama(ev.suratPernyataan?.nama || defaultNama);
          setSpNim(ev.suratPernyataan?.nim || "");
          setSpProdi(ev.suratPernyataan?.programPendidikan || defaultProdi);
          setSpUniv(ev.suratPernyataan?.universitas || defaultUniv);
          setSpTanggal(ev.suratPernyataan?.tanggalSurat || getTodayWibIso());
          setSpTtdImage(ev.suratPernyataan?.ttdImage || "");
          return;
        }
      }

      // Default prefill jika belum pernah mengisi
      setFasNama(defaultMentorNama);
      setSpNama(defaultNama);
      setSpProdi(defaultProdi);
      setSpUniv(defaultUniv);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUploadTtd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const isPngMime = file.type === "image/png";
    const isPngExt = file.name.toLowerCase().endsWith(".png");
    if (!isPngMime && !isPngExt) {
      showToast.error("Foto tanda tangan (TTD) harus berformat PNG (.png)");
      return;
    }
    if (file.type && file.type !== "image/png") {
      showToast.error("Foto tanda tangan (TTD) harus berformat PNG (.png)");
      return;
    }

    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      showToast.error("Ukuran foto tanda tangan (TTD) maksimal 2 MB");
      return;
    }

    try {
      const headerBuf = await file.slice(0, 8).arrayBuffer();
      const bytes = new Uint8Array(headerBuf);
      const isPngSignature =
        bytes.length >= 4 &&
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47;
      if (!isPngSignature) {
        showToast.error(
          "File tidak valid. Foto tanda tangan (TTD) harus berformat PNG (.png)",
        );
        return;
      }

      const rawDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          typeof reader.result === "string"
            ? resolve(reader.result)
            : reject(new Error("Gagal membaca file"));
        reader.onerror = () => reject(new Error("Gagal membaca file"));
        reader.readAsDataURL(file);
      });

      const normalizedPng = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const maxW = 700;
          const maxH = 350;
          const scale = Math.min(1, maxW / img.width, maxH / img.height);
          const targetW = Math.max(1, Math.round(img.width * scale));
          const targetH = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }
          ctx.clearRect(0, 0, targetW, targetH);
          ctx.drawImage(img, 0, 0, targetW, targetH);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => reject(new Error("Gambar PNG TTD tidak dapat dimuat"));
        img.src = rawDataUrl;
      });

      setSpTtdImage(normalizedPng);
      showToast.success("Gambar tanda tangan (PNG) berhasil diunggah");
    } catch {
      showToast.error("Gagal memproses gambar tanda tangan (TTD)");
    }
  };

  const buildPayload = (): EvaluasiMagangPayload | null => {
    if (!fasNama.trim()) {
      showToast.error("Nama Fasilitator / Pembimbing wajib diisi");
      return null;
    }
    if (fasScores.some((s) => s < 1 || s > 5)) {
      showToast.error(
        "Lengkapi seluruh penilaian skala 1–5 pada Evaluasi Fasilitator/Pembimbing",
      );
      return null;
    }
    if (fasAdaSaran === "Ya" && !fasSaran.trim()) {
      showToast.error("Mohon isi saran/masukan untuk Fasilitator/Pembimbing");
      return null;
    }

    if (penScores.some((s) => s < 1 || s > 5)) {
      showToast.error(
        "Lengkapi seluruh penilaian skala 1–5 pada Evaluasi Penyelenggara",
      );
      return null;
    }
    if (!penAlasanBermanfaat.trim()) {
      showToast.error(
        penBermanfaat === "Ya"
          ? "Mohon jelaskan manfaat yang diperoleh pada Evaluasi Penyelenggara"
          : "Mohon jelaskan alasan pada pertanyaan kebermanfaatan Evaluasi Penyelenggara",
      );
      return null;
    }
    if (penAdaMasukan === "Ya" && !penMasukan.trim()) {
      showToast.error("Mohon isi masukan untuk Penyelenggara");
      return null;
    }

    if (
      !spNama.trim() ||
      !spNim.trim() ||
      !spProdi.trim() ||
      !spUniv.trim() ||
      !spTanggal.trim()
    ) {
      showToast.error("Lengkapi seluruh isian pada Surat Pernyataan");
      return null;
    }

    return {
      fasilitator: {
        nama: fasNama.trim(),
        judulMateri: fasJudulMateri.trim(),
        skor1: fasScores[0],
        skor2: fasScores[1],
        skor3: fasScores[2],
        skor4: fasScores[3],
        skor5: fasScores[4],
        adaSaran: fasAdaSaran,
        saran: fasAdaSaran === "Ya" ? fasSaran.trim() : "",
      },
      penyelenggara: {
        skor1: penScores[0],
        skor2: penScores[1],
        skor3: penScores[2],
        skor4: penScores[3],
        skor5: penScores[4],
        bermanfaat: penBermanfaat,
        alasanBermanfaat: penAlasanBermanfaat.trim(),
        adaMasukan: penAdaMasukan,
        masukan: penAdaMasukan === "Ya" ? penMasukan.trim() : "",
      },
      suratPernyataan: {
        nama: spNama.trim(),
        nim: spNim.trim(),
        programPendidikan: spProdi.trim(),
        universitas: spUniv.trim(),
        tanggalSurat: spTanggal.trim(),
        ttdImage: spTtdImage,
      },
    };
  };

  const evaluasiScheduleInfo = useMemo(() => {
    if (periode.statusMagang === "Tidak Magang") {
      return {
        canFill: false,
        reason: "inactive" as const,
        openDateLabel: "-",
        daysUntilOpen: 0,
      };
    }

    const endIso = parseDateIso(periode.selesai);
    if (!endIso) {
      return {
        canFill: true,
        reason: "ok" as const,
        openDateLabel: "-",
        daysUntilOpen: 0,
      };
    }

    const todayIso = getTodayWibIso();
    const openEvaluasiIso = shiftIsoDate(endIso, -10);
    const daysUntilOpen = Math.max(0, diffDaysIso(todayIso, openEvaluasiIso));

    return {
      canFill: todayIso >= openEvaluasiIso,
      reason:
        todayIso >= openEvaluasiIso ? ("ok" as const) : ("too_early" as const),
      openDateLabel: formatIsoToIndo(openEvaluasiIso),
      daysUntilOpen,
    };
  }, [periode.selesai, periode.statusMagang]);

  const isScheduleLocked = !hasSaved && !evaluasiScheduleInfo.canFill;
  const isLocked =
    evalStatus === "Menunggu" ||
    evalStatus === "Disetujui" ||
    isScheduleLocked;
  const canDownloadPdf = evalStatus === "Disetujui";

  const handleSave = async () => {
    if (isScheduleLocked) {
      showToast.error(
        evaluasiScheduleInfo.reason === "inactive"
          ? "Status kepesertaan magang Anda sedang tidak aktif."
          : `Pengisian Evaluasi & Surat Pernyataan baru dibuka mulai H-10 selesai magang (${evaluasiScheduleInfo.openDateLabel}).`,
      );
      return;
    }
    if (isLocked) {
      showToast.error(
        evalStatus === "Disetujui"
          ? "Evaluasi sudah disetujui dan tidak dapat diubah."
          : "Evaluasi sedang menunggu penindakan mentor pembimbing.",
      );
      return;
    }

    const payload = buildPayload();
    if (!payload) return;

    const toastId = showToast.loading("Mengirim Evaluasi & Surat Pernyataan...");
    try {
      setSaving(true);
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/evaluasi/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Gagal mengirim data evaluasi");
      }

      setHasSaved(true);
      setEvalStatus("Menunggu");
      setSubmittedAt(data?.evaluasi?.submittedAt || new Date().toISOString());
      setMentorNote("");
      showToast.updateSuccess(
        toastId,
        data?.message ||
          "Data Evaluasi & Surat Pernyataan dikirim dan menunggu persetujuan mentor.",
      );
    } catch (err: unknown) {
      showToast.updateError(
        toastId,
        err instanceof Error ? err.message : "Gagal mengirim data evaluasi",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadOnly = async () => {
    if (!canDownloadPdf) {
      showToast.error(
        "Dokumen PDF hanya dapat diunduh setelah disetujui oleh mentor pembimbing.",
      );
      return;
    }
    const payload = buildPayload();
    if (!payload) return;
    try {
      setDownloadingPdf(true);
      await downloadEvaluasiDanPernyataanPdf(payload, {
        ...periode,
        submittedAt,
        isPkpa,
      });
      showToast.success("File PDF berhasil diunduh");
    } catch {
      showToast.error("Gagal membuat file PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return <PesertaDashboardSkeleton />;
  }

  const texts = getEvaluasiTexts(isPkpa);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pt-1">
        <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
          <Link
            href="/dashboard/peserta/laporan-akhir"
            aria-label="Kembali ke Perkembangan Magang"
            className="mt-0.5 w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition shrink-0 shadow-2xs"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-snug">
                Evaluasi &amp; Surat Pernyataan
              </h1>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                  isPkpa
                    ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800"
                    : "bg-blue-50 text-[#1D64F2] border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                }`}
              >
                {isPkpa ? "Khusus PKPA" : "Reguler"}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Isi evaluasi pembimbing, penyelenggara, serta surat pernyataan lalu
              unduh sebagai dokumen PDF resmi.
            </p>
          </div>
        </div>

        {canDownloadPdf && (
          <button
            type="button"
            disabled={downloadingPdf}
            onClick={handleDownloadOnly}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition shrink-0 disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingPdf ? "Membuat PDF..." : "Unduh PDF"}</span>
          </button>
        )}
      </div>

      {/* STATUS BANNER */}
      {isScheduleLocked && (
        <div className="rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 p-3.5 sm:p-4 flex items-start gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
              {evaluasiScheduleInfo.reason === "inactive"
                ? "Pengisian Evaluasi & Surat Pernyataan Tidak Tersedia"
                : "Pengisian Evaluasi & Surat Pernyataan Belum Dibuka"}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5 leading-relaxed">
              {evaluasiScheduleInfo.reason === "inactive" ? (
                "Status kepesertaan magang Anda sedang tidak aktif."
              ) : (
                <>
                  Pengisian Evaluasi &amp; Surat Pernyataan baru dapat dilakukan
                  mulai <b>H-10</b> sebelum masa magang berakhir, yaitu mulai
                  tanggal <b>{evaluasiScheduleInfo.openDateLabel}</b>
                  {evaluasiScheduleInfo.daysUntilOpen > 0
                    ? ` (${evaluasiScheduleInfo.daysUntilOpen} hari lagi)`
                    : ""}
                  .
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {hasSaved && evalStatus === "Disetujui" && (
        <div className="rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70 p-3.5 sm:p-4 flex items-start gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
              Evaluasi &amp; Surat Pernyataan Disetujui
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5 leading-relaxed">
              {reviewedByName
                ? `Telah disetujui oleh ${reviewedByName}. `
                : "Telah disetujui oleh mentor pembimbing. "}
              Dokumen PDF resmi kini sudah dapat Anda unduh.
            </p>
            {mentorNote && (
              <p className="text-xs text-emerald-800 dark:text-emerald-200 mt-1.5 bg-white/70 dark:bg-emerald-900/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-lg px-3 py-1.5">
                <b>Catatan:</b> {mentorNote}
              </p>
            )}
          </div>
        </div>
      )}

      {hasSaved && evalStatus === "Menunggu" && (
        <div className="rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 p-3.5 sm:p-4 flex items-start gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
              Menunggu Penindakan Mentor Pembimbing
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5 leading-relaxed">
              Isian hanya dapat dikirim 1 kali dan saat ini terkunci menunggu
              persetujuan mentor. Tombol Unduh PDF akan terbuka setelah
              disetujui mentor.
            </p>
          </div>
        </div>
      )}

      {hasSaved && evalStatus === "Revisi" && (
        <div className="rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/70 p-3.5 sm:p-4 flex items-start gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-rose-900 dark:text-rose-200">
              Perlu Revisi dari Mentor Pembimbing
            </p>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5 leading-relaxed">
              Silakan perbaiki isian di bawah sesuai catatan berikut lalu kirim
              ulang untuk ditinjau kembali.
            </p>
            {mentorNote && (
              <div className="mt-2 rounded-xl bg-white/80 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800/70 px-3 py-2 text-xs text-rose-900 dark:text-rose-100 whitespace-pre-line">
                <b>Catatan Revisi:</b> {mentorNote}
              </div>
            )}
          </div>
        </div>
      )}

      {/* LEGEND SKALA PENILAIAN */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-4 shadow-2xs">
        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
          Keterangan Skala Penilaian:
        </p>
        <div className="flex flex-wrap gap-1.5 sm:grid sm:grid-cols-5 sm:gap-2 text-xs">
          {RATING_LEGEND.map((item) => (
            <div
              key={item.score}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700"
            >
              <span className="w-5 h-5 rounded-md bg-[#1D64F2]/10 text-[#1D64F2] dark:text-blue-400 font-bold flex items-center justify-center shrink-0">
                {item.score}
              </span>
              <span className="font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap sm:truncate">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <fieldset
        disabled={isLocked}
        className="space-y-4 sm:space-y-6 disabled:opacity-90"
      >

      {/* ================= BAGIAN A: EVALUASI FASILITATOR / PEMBIMBING ================= */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-700/70">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1D64F2] dark:text-blue-400 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              a. Evaluasi Fasilitator / Pembimbing
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Lembar evaluasi kualitas fasilitator / pembimbing selama magang
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Fasilitator / Pembimbing{" "}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={fasNama}
              onChange={(e) => setFasNama(e.target.value)}
              placeholder="Nama mentor pembimbing"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#1D64F2]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Judul Materi / Topik Bimbingan
            </label>
            <input
              type="text"
              value={fasJudulMateri}
              onChange={(e) => setFasJudulMateri(e.target.value)}
              placeholder="Contoh: Pengujian Sampel Pangan / Pengawasan Obat"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#1D64F2]"
            />
          </div>
        </div>

        <div className="space-y-3">
          {texts.fasilitatorQuestions.map((q, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 p-3.5 space-y-2.5"
            >
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                <span className="font-bold mr-1.5">{idx + 1}.</span>
                {q}
              </p>
              <div className="grid grid-cols-5 sm:flex sm:flex-wrap sm:items-center gap-2">
                {[1, 2, 3, 4, 5].map((num) => {
                  const selected = fasScores[idx] === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() =>
                        setFasScores((prev) =>
                          prev.map((v, i) => (i === idx ? num : v)),
                        )
                      }
                      className={`py-2 sm:py-1.5 sm:px-3.5 rounded-lg text-xs font-bold border text-center transition ${
                        selected
                          ? "bg-[#1D64F2] text-white border-[#1D64F2] shadow-2xs"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#1D64F2]"
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2.5 pt-1">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {texts.fasilitatorSaranPrompt}
          </p>
          <div className="flex items-center gap-2">
            {(["Ya", "Tidak"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setFasAdaSaran(opt)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition ${
                  fasAdaSaran === opt
                    ? "bg-[#1D64F2] text-white border-[#1D64F2]"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {fasAdaSaran === "Ya" && (
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                Jika Ya, masukan apa yang dapat saudara/i usulkan?{" "}
                <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={fasSaran}
                onChange={(e) => setFasSaran(e.target.value)}
                placeholder="Tuliskan saran atau masukan Anda untuk fasilitator/pembimbing..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#1D64F2]"
              />
            </div>
          )}
        </div>
      </div>

      {/* ================= BAGIAN B: EVALUASI PENYELENGGARA ================= */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-700/70">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              b. Evaluasi Penyelenggara
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluasi pelaksanaan, fasilitas, lingkungan, dan pelayanan panitia
              BBPOM di Palembang
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {texts.penyelenggaraQuestions.map((q, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 p-3.5 space-y-2.5"
            >
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                <span className="font-bold mr-1.5">{idx + 1}.</span>
                {q}
              </p>
              <div className="grid grid-cols-5 sm:flex sm:flex-wrap sm:items-center gap-2">
                {[1, 2, 3, 4, 5].map((num) => {
                  const selected = penScores[idx] === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() =>
                        setPenScores((prev) =>
                          prev.map((v, i) => (i === idx ? num : v)),
                        )
                      }
                      className={`py-2 sm:py-1.5 sm:px-3.5 rounded-lg text-xs font-bold border text-center transition ${
                        selected
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-600"
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-1">
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 p-3.5 space-y-2.5">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {texts.penyelenggaraBermanfaatPrompt}
            </p>
            <div className="flex items-center gap-2">
              {(["Ya", "Tidak"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setPenBermanfaat(opt)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition ${
                    penBermanfaat === opt
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                {penBermanfaat === "Ya"
                  ? "Jika ya, manfaat apa yang dapat Saudara jelaskan:"
                  : "Jika tidak, alasan apa yang dapat Saudara jelaskan:"}{" "}
                <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={penAlasanBermanfaat}
                onChange={(e) => setPenAlasanBermanfaat(e.target.value)}
                placeholder={
                  penBermanfaat === "Ya"
                    ? "Tuliskan manfaat yang Anda peroleh dari kegiatan ini..."
                    : "Tuliskan alasan mengapa kegiatan dirasa kurang bermanfaat..."
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 p-3.5 space-y-2.5">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {texts.penyelenggaraMasukanPrompt}
            </p>
            <div className="flex items-center gap-2">
              {(["Ya", "Tidak"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setPenAdaMasukan(opt)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition ${
                    penAdaMasukan === opt
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {penAdaMasukan === "Ya" && (
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Jika ya, masukan apa yang dapat Saudara berikan:{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={penMasukan}
                  onChange={(e) => setPenMasukan(e.target.value)}
                  placeholder="Tuliskan masukan Anda untuk penyelenggara..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= BAGIAN C: SURAT PERNYATAAN ================= */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-700/70">
          <div className="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <FileSignature className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              c. Surat Pernyataan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Data identitas pembuat surat pernyataan PKL/Magang
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Lengkap <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={spNama}
              onChange={(e) => setSpNama(e.target.value)}
              placeholder="Nama lengkap peserta"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#1D64F2]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              NIM / NISN <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={spNim}
              onChange={(e) => setSpNim(e.target.value)}
              placeholder="Masukkan NIM atau NISN Anda"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#1D64F2]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Program Pendidikan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={spProdi}
              onChange={(e) => setSpProdi(e.target.value)}
              placeholder="Contoh: Profesi Apoteker / Farmasi (S1)"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#1D64F2]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Universitas / Sekolah <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={spUniv}
              onChange={(e) => setSpUniv(e.target.value)}
              placeholder="Nama universitas / sekolah"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#1D64F2]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tanggal Surat <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={spTanggal}
              onChange={(e) => setSpTanggal(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#1D64F2]"
            />
          </div>
        </div>

        {/* Upload Tanda Tangan (TTD) PNG */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 p-3.5 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Tanda Tangan (TTD) Pembuat Surat
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-0.5">
                Catatan: Foto tanda tangan (TTD) harus berformat PNG (.png),
                maksimal 2 MB. Disarankan latar belakang transparan atau putih
                bersih.
              </p>
            </div>
            <input
              ref={ttdInputRef}
              type="file"
              accept="image/png,.png"
              onChange={handleUploadTtd}
              className="hidden"
            />
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => ttdInputRef.current?.click()}
                className="flex-1 sm:flex-initial justify-center px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:border-[#1D64F2] text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 transition"
              >
                {spTtdImage ? (
                  <Upload className="w-3.5 h-3.5 text-[#1D64F2]" />
                ) : (
                  <ImagePlus className="w-3.5 h-3.5 text-[#1D64F2]" />
                )}
                <span>{spTtdImage ? "Ganti Foto TTD" : "Upload Foto TTD (.png)"}</span>
              </button>
              {spTtdImage && (
                <button
                  type="button"
                  onClick={() => setSpTtdImage("")}
                  className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 text-xs font-semibold text-rose-600 dark:text-rose-400 inline-flex items-center justify-center gap-1 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              )}
            </div>
          </div>

          {spTtdImage && (
            <div className="rounded-xl bg-white border border-slate-200 p-3 flex flex-col items-center justify-center gap-1.5 w-full sm:max-w-xs">
              <span className="text-xs text-slate-500">
                Pratinjau TTD di Surat Pernyataan:
              </span>
              <img
                src={spTtdImage}
                alt="Pratinjau Tanda Tangan"
                className="max-h-24 w-auto object-contain"
              />
              <span className="text-xs text-slate-800 font-medium">
                ( {spNama || "Nama Peserta"} )
              </span>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 p-3.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
            Isi Pernyataan:
          </p>
          <p>{texts.suratPernyataanParagraph}</p>
        </div>
      </div>
      </fieldset>

      {/* ================= TOMBOL AKSI ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {canDownloadPdf ? (
          <>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              Dokumen telah disetujui mentor pembimbing dan siap diunduh.
            </p>
            <button
              type="button"
              disabled={downloadingPdf}
              onClick={handleDownloadOnly}
              className="w-full sm:w-auto px-5 py-3 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs inline-flex items-center justify-center gap-2 transition disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              <span>
                {downloadingPdf ? "Memproses PDF..." : "Unduh PDF Resmi"}
              </span>
            </button>
          </>
        ) : evalStatus === "Menunggu" ? (
          <div className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/70 px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 inline-flex items-center justify-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              Menunggu Persetujuan Mentor • Unduh PDF Terkunci
            </span>
          </div>
        ) : isScheduleLocked ? (
          <div className="w-full rounded-xl border border-amber-200 dark:border-amber-800/70 bg-amber-50/70 dark:bg-amber-950/30 px-4 py-3 text-sm font-semibold text-amber-800 dark:text-amber-200 inline-flex items-center justify-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              {evaluasiScheduleInfo.reason === "inactive"
                ? "Terkunci • Status Kepesertaan Tidak Aktif"
                : `Terkunci • Dibuka Mulai H-10 Selesai Magang (${evaluasiScheduleInfo.openDateLabel})`}
            </span>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {evalStatus === "Revisi"
                ? "Perbaiki data sesuai catatan mentor lalu kirim ulang revisi Anda."
                : "Data hanya bisa dikirim 1 kali. PDF dapat diunduh setelah disetujui mentor."}
            </p>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="w-full sm:w-auto px-5 py-3 rounded-xl text-sm font-bold bg-[#1D64F2] hover:bg-blue-700 text-white shadow-xs inline-flex items-center justify-center gap-2 transition disabled:opacity-60 shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>
                {saving
                  ? "Mengirim..."
                  : evalStatus === "Revisi"
                    ? "Kirim Ulang Revisi"
                    : "Kirim Evaluasi & Surat Pernyataan"}
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
