"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  ClipboardCheck,
  ClipboardList,
  ChevronRight,
  Download,
  Award,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Eye,
  X,
  BadgeCheck,
  Lock,
  FileSignature,
} from "lucide-react";
import LaporanAkhirUploadModal from "@/components/Laporan/LaporanAkhirModal";
import PenilaianModal from "@/components/Laporan/PenilaianModal";
import FeedbackModal from "@/components/Laporan/FeedbackModal";
import { showToast } from "@/components/ui/toastDashboard";
import { PesertaDashboardSkeleton } from "@/components/dashboard/skeletons";
import { isPkpaPeserta } from "@/lib/pesertaKategori";
import type { EvaluasiMagangPayload } from "@/lib/evaluasiPdf";

type FormatLaporanItem = {
  title: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  fileUrl: string;
};

type LaporanAkhir = {
  _id: string;
  fileName: string;
  fileSize: number;
  fileLampiran1Name?: string;
  fileLampiran2Name?: string;
  status: string;
  submittedAt: string;
  approvedByMentor?: any;
  approvedAt?: string;
  mentorNote?: string;
};

type Feedback = {
  _id: string;
  month: string;
  status: string;
  createdAt: string;
  mentorResponse?: string;
  mentorRespondedAt?: string;
  mentorRespondedBy?: {
    name: string;
    email: string;
  };
};

type SuratSelesai = {
  email: string;
  nama: string;
  file: string;
  tanggalKirim: string;
};

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
  const dd = String(dt.getDate()).padStart(2, "0");
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

export default function LaporanAkhirPage() {
  const [laporan, setLaporan] = useState<LaporanAkhir | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [suratSelesai, setSuratSelesai] = useState<SuratSelesai | null>(null);
  const [sertifikat, setSertifikat] = useState<{
    email: string;
    nama: string;
    nomorSertifikat?: string;
    file: string;
    tanggalKirim: string;
  } | null>(null);
  const [sertifikatPreviewUrl, setSertifikatPreviewUrl] = useState<string | null>(
    null,
  );
  const [penilaianAkhirSummary, setPenilaianAkhirSummary] = useState<{
    nilaiRataRata: number;
    keteranganRataRata: string;
    penilaiNama?: string;
  } | null>(null);
  const [evaluasiData, setEvaluasiData] =
    useState<EvaluasiMagangPayload | null>(null);
  const [evaluasiStatus, setEvaluasiStatus] = useState<
    "Menunggu" | "Revisi" | "Disetujui" | null
  >(null);
  const [formatLaporanDocs, setFormatLaporanDocs] = useState<{
    reguler: FormatLaporanItem | null;
    pkpa: FormatLaporanItem | null;
  }>({
    reguler: null,
    pkpa: null,
  });
  const [downloadingFormatLaporan, setDownloadingFormatLaporan] =
    useState(false);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Accordion expand state for cards
  const [openLaporanSection, setOpenLaporanSection] = useState(false);
  const [openSurveiSection, setOpenSurveiSection] = useState(false);
  const [openSertifikatSection, setOpenSertifikatSection] = useState(false);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPenilaianModal, setShowPenilaianModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showSertifikatModal, setShowSertifikatModal] = useState(false);
  const [showSuratSelesaiModal, setShowSuratSelesaiModal] = useState(false);
  const [pesertaInfo, setPesertaInfo] = useState<{
    nama: string;
    posisi: string;
    jurusan?: string;
    kategoriMagang?: string;
    mulai: string;
    selesai: string;
    statusMagang?: string;
  }>({
    nama: "Peserta Magang",
    posisi: "Peserta Magang BBPOM",
    jurusan: "",
    kategoriMagang: "",
    mulai: "-",
    selesai: "-",
    statusMagang: "",
  });
  const [tokenMagangMeta, setTokenMagangMeta] = useState<{
    jurusan?: string;
    kategoriMagang?: string;
  } | null>(null);
  const [feedbackModalMode, setFeedbackModalMode] = useState<"create" | "view">(
    "create",
  );
  const [selectedMonth, setSelectedMonth] = useState("");
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);

  const hasShownPopupRef = useRef(false);

  const fetchLaporan = useCallback(async () => {
    try {
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/laporan-akhir`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.status === 404) {
        setLaporan(null);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setLaporan(data);
      }
    } catch (error) {
      console.error("Gagal mengambil laporan akhir", error);
    }
  }, []);

  const checkFeedback = useCallback(async () => {
    try {
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/feedback/riwayat`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setFeedback(data[0]);
      } else {
        setFeedback(null);
      }
    } catch (error) {
      console.error("Gagal cek feedback", error);
      setFeedback(null);
    }
  }, []);

  const fetchPesertaProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem("token") ?? "";
      if (!token) return;
      const payload = JSON.parse(atob(token.split(".")[1]));
      setTokenMagangMeta({
        jurusan: payload?.jurusan,
        kategoriMagang: payload?.kategoriMagang,
      });
      const email = payload?.email;
      if (!email) return;

      const [res, selesaiRes, sertifikatRes, penilaianAkhirRes] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/pendaftaran/cek?email=${encodeURIComponent(email)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/surat-selesai/cek?email=${encodeURIComponent(email)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ).catch(() => null),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/sertifikat/cek?email=${encodeURIComponent(email)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ).catch(() => null),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/penilaian-akhir/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
      ]);

      if (penilaianAkhirRes && penilaianAkhirRes.ok) {
        const paJson = await penilaianAkhirRes.json().catch(() => null);
        if (paJson?.penilaian) {
          setPenilaianAkhirSummary({
            nilaiRataRata: paJson.penilaian.nilaiRataRata,
            keteranganRataRata: paJson.penilaian.keteranganRataRata || "",
            penilaiNama: paJson.penilaian.penilaiNama,
          });
        } else {
          setPenilaianAkhirSummary(null);
        }
      }

      if (selesaiRes && selesaiRes.ok) {
        const sData = await selesaiRes.json().catch(() => null);
        setSuratSelesai(sData || null);
      }

      if (sertifikatRes && sertifikatRes.ok) {
        const certData = await sertifikatRes.json().catch(() => null);
        setSertifikat(certData || null);
      }

      if (!res.ok) return;
      const data = await res.json();
      const found = data?.peserta?.find(
        (p: any) => p.email?.toLowerCase() === email.toLowerCase(),
      );
      if (found) {
        setPesertaInfo({
          nama: found.nama || "Peserta Magang",
          posisi: found.posisi || "Peserta Magang BBPOM",
          jurusan: found.jurusan || "",
          kategoriMagang: found.kategoriMagang || "",
          mulai: found.tanggalMulaiMagang || "-",
          selesai: found.tanggalSelesaiMagang || "-",
          statusMagang: found.statusMagang || "",
        });
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchEvaluasi = useCallback(async () => {
    try {
      const token = localStorage.getItem("token") ?? "";
      if (!token) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/evaluasi/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const json = await res.json().catch(() => null);
      if (json?.evaluasi) {
        setEvaluasiData({
          fasilitator: json.evaluasi.fasilitator,
          penyelenggara: json.evaluasi.penyelenggara,
          suratPernyataan: json.evaluasi.suratPernyataan,
        });
        setEvaluasiStatus(json.evaluasi.status || "Menunggu");
      } else {
        setEvaluasiData(null);
        setEvaluasiStatus(null);
      }
    } catch {
      // ignore error, keep evaluasiData null
    }
  }, []);

  const fetchFormatLaporan = useCallback(async () => {
    try {
      const token = localStorage.getItem("token") ?? "";
      if (!token) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/panduan`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const json = await res.json().catch(() => null);
      setFormatLaporanDocs({
        reguler: json?.data?.["format-laporan-reguler"] || null,
        pkpa: json?.data?.["format-laporan-pkpa"] || null,
      });
    } catch {
      // ignore error
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setDataLoaded(false);
    await Promise.all([
      fetchLaporan(),
      checkFeedback(),
      fetchPesertaProfile(),
      fetchEvaluasi(),
      fetchFormatLaporan(),
    ]);
    setLoading(false);
    setDataLoaded(true);
  }, [
    fetchLaporan,
    checkFeedback,
    fetchPesertaProfile,
    fetchEvaluasi,
    fetchFormatLaporan,
  ]);

  useEffect(() => {
    loadAllData();
    hasShownPopupRef.current = false;
  }, [loadAllData]);

  const uploadScheduleInfo = useMemo(() => {
    if (pesertaInfo.statusMagang === "Tidak Magang") {
      return {
        canUpload: false,
        reason: "inactive" as const,
        openDateLabel: "-",
        daysUntilOpen: 0,
      };
    }

    const endIso = parseDateIso(pesertaInfo.selesai);
    if (!endIso) {
      return {
        canUpload: true,
        reason: "ok" as const,
        openDateLabel: "-",
        daysUntilOpen: 0,
      };
    }

    const todayIso = getTodayWibIso();
    const openUploadIso = shiftIsoDate(endIso, -10);
    const daysUntilOpen = Math.max(0, diffDaysIso(todayIso, openUploadIso));

    return {
      canUpload: todayIso >= openUploadIso,
      reason: todayIso >= openUploadIso ? ("ok" as const) : ("too_early" as const),
      openDateLabel: formatIsoToIndo(openUploadIso),
      daysUntilOpen,
    };
  }, [pesertaInfo.selesai, pesertaInfo.statusMagang]);

  const isLaporanApproved = laporan?.status === "Disetujui";
  const isSurveyDone = feedback !== null;
  const canDownloadCompletionDocs = isLaporanApproved && isSurveyDone;
  const isPkpa = isPkpaPeserta(pesertaInfo) || isPkpaPeserta(tokenMagangMeta);
  const activeFormatLaporanDoc = isPkpa
    ? formatLaporanDocs.pkpa
    : formatLaporanDocs.reguler;

  const handleDownloadFormatLaporan = async () => {
    if (!activeFormatLaporanDoc?.fileUrl) return;
    const fullUrl = `${process.env.NEXT_PUBLIC_API_URL}${activeFormatLaporanDoc.fileUrl}`;
    try {
      setDownloadingFormatLaporan(true);
      const res = await fetch(fullUrl);
      if (!res.ok) throw new Error("Gagal mengunduh file");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        activeFormatLaporanDoc.originalName ||
        (isPkpa
          ? "Format_Laporan_Akhir_Magang_PKPA.pdf"
          : "Format_Laporan_Akhir_Magang_Reguler.pdf");
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(fullUrl, "_blank", "noopener,noreferrer");
    } finally {
      setDownloadingFormatLaporan(false);
    }
  };

  // Prompt to fill feedback only after laporan is approved and feedback is not yet filled
  useEffect(() => {
    if (!dataLoaded) return;

    if (isLaporanApproved && !isSurveyDone) {
      if (!hasShownPopupRef.current) {
        hasShownPopupRef.current = true;
        setShowFeedbackPopup(true);
      }
    } else {
      setShowFeedbackPopup(false);
    }
  }, [dataLoaded, isLaporanApproved, isSurveyDone]);

  const handleOpenFeedbackModal = () => {
    if (!feedback && !isLaporanApproved) {
      showToast.error(
        "Survei dan feedback hanya dapat diisi setelah Laporan Akhir disetujui oleh Mentor.",
      );
      return;
    }

    if (feedback) {
      setSelectedMonth(feedback.month);
      setFeedbackModalMode("view");
    } else {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      setSelectedMonth(month);
      setFeedbackModalMode("create");
    }
    setShowFeedbackModal(true);
  };

  const downloadPdf = async () => {
    try {
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/laporan-akhir/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error("Gagal mengunduh");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = laporan?.fileName || "Laporan_Akhir.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showToast.error("Gagal mengunduh laporan");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Disetujui":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
      case "Ditolak":
        return "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
    }
  };

  const handleOpenPreviewSertifikat = async () => {
    if (!canDownloadCompletionDocs) {
      showToast.error(
        "Sertifikat hanya dapat dilihat setelah Laporan Akhir disetujui dan Survei selesai diisi.",
      );
      return;
    }
    if (!sertifikat?.file) {
      showToast.error("Sertifikat Magang belum tersedia");
      return;
    }
    try {
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/sertifikat/download?inline=1`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.message || "Gagal membuka Sertifikat Magang");
      }
      const blob = await res.blob();
      if (sertifikatPreviewUrl) window.URL.revokeObjectURL(sertifikatPreviewUrl);
      const url = window.URL.createObjectURL(blob);
      setSertifikatPreviewUrl(url);
      setShowSertifikatModal(true);
    } catch (err: any) {
      showToast.error(err?.message || "Gagal membuka pratinjau sertifikat");
    }
  };

  const handleClosePreviewSertifikat = () => {
    setShowSertifikatModal(false);
    if (sertifikatPreviewUrl) {
      window.URL.revokeObjectURL(sertifikatPreviewUrl);
      setSertifikatPreviewUrl(null);
    }
  };

  const handleDownloadSertifikat = async () => {
    if (!canDownloadCompletionDocs) {
      showToast.error(
        "Sertifikat hanya dapat diunduh setelah Laporan Akhir disetujui dan Survei selesai diisi.",
      );
      return;
    }
    if (!sertifikat?.file) {
      showToast.error("Sertifikat Magang belum tersedia");
      return;
    }
    try {
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/sertifikat/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.message || "Gagal mengunduh Sertifikat Magang");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Sertifikat_${pesertaInfo.nama.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast.success("Sertifikat Magang berhasil diunduh");
    } catch (err: any) {
      showToast.error(err?.message || "Gagal mengunduh Sertifikat Magang");
    }
  };

  const suratSelesaiFileUrl = suratSelesai?.file
    ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${suratSelesai.file}`
    : null;

  const handleDownloadSuratSelesai = async () => {
    if (!canDownloadCompletionDocs) {
      showToast.error(
        "Surat Selesai Magang hanya dapat diunduh setelah Laporan Akhir disetujui dan Survei selesai diisi.",
      );
      return;
    }
    if (!suratSelesai?.file) {
      showToast.error("Surat Selesai Magang belum tersedia");
      return;
    }
    try {
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/surat-selesai/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.message || "Gagal mengunduh Surat Selesai Magang");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Surat_Selesai_Magang_${pesertaInfo.nama.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast.success("Surat Selesai Magang berhasil diunduh");
    } catch (err: any) {
      showToast.error(err?.message || "Gagal mengunduh Surat Selesai Magang");
    }
  };

  if (loading) {
    return <PesertaDashboardSkeleton />;
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ================= 1. HEADER ================= */}
      <div className="pt-1">
        <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Perkembangan Magang
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
          Lihat laporan akhir, evaluasi penilaian mentor, survei program, dan
          sertifikat magang Anda.
        </p>
      </div>

      {/* ================= 2. CHEVRON CARDS LIST ================= */}
      <div className="space-y-3.5 sm:space-y-4">
        {/* CARD 1: EVALUASI & SURAT PERNYATAAN */}
        <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs overflow-hidden">
          <Link
            href="/dashboard/peserta/evaluasi"
            className="block w-full p-4 sm:p-5 text-left hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 sm:gap-3.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <FileSignature className="w-5 h-5" />
                </div>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  Evaluasi &amp; Surat Pernyataan
                </span>
              </div>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0" />
            </div>

            <div className="mt-3 sm:mt-3.5 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-700/70 flex items-center justify-between gap-2 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5 truncate">
                {evaluasiData ? (
                  evaluasiStatus === "Disetujui" ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
                      <span className="truncate">
                        Disetujui mentor • Siap diunduh PDF
                      </span>
                    </>
                  ) : evaluasiStatus === "Revisi" ? (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 shrink-0" />
                      <span className="truncate text-rose-600 dark:text-rose-400">
                        Perlu revisi • Ketuk untuk memperbaiki
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
                      <span className="truncate">
                        Menunggu penindakan mentor pembimbing
                      </span>
                    </>
                  )
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
                    <span className="truncate">
                      Belum diisi • Isi evaluasi &amp; surat pernyataan
                    </span>
                  </>
                )}
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${
                  !evaluasiData
                    ? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700/60 dark:text-slate-300 dark:border-slate-600"
                    : evaluasiStatus === "Disetujui"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60"
                      : evaluasiStatus === "Revisi"
                        ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60"
                        : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60"
                }`}
              >
                {!evaluasiData
                  ? "Belum Diisi"
                  : evaluasiStatus || "Menunggu"}
              </span>
            </div>
          </Link>
        </div>

        {/* CARD 2: LAPORAN AKHIR */}
        <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs overflow-hidden">
          <button
            type="button"
            onClick={() => setOpenLaporanSection((v) => !v)}
            className="w-full p-4 sm:p-5 text-left hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 sm:gap-3.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1D64F2] dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  Laporan Akhir
                </span>
              </div>
              <ChevronRight
                className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-400 transition-transform duration-200 ${
                  openLaporanSection ? "rotate-90" : ""
                }`}
              />
            </div>

            <div className="mt-3 sm:mt-3.5 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-700/70 flex items-center justify-between gap-2 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5 truncate">
                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
                <span className="truncate">
                  {laporan
                    ? `Laporan Akhir (${laporan.status})`
                    : "Penilaian Mentor & Unggah Laporan Akhir"}
                </span>
              </div>
              {laporan && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${getStatusBadge(
                    laporan.status,
                  )}`}
                >
                  {laporan.status}
                </span>
              )}
            </div>
          </button>

          {/* Expanded Laporan Akhir Content */}
          {openLaporanSection && (
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2.5 border-t border-slate-100 dark:border-slate-700/70 space-y-4 bg-slate-50/40 dark:bg-slate-800/40">
              {/* Format Laporan Magang (PDF dikelola Admin/Superadmin) */}
              <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1D64F2] dark:text-blue-400 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {activeFormatLaporanDoc?.title ||
                          `Format Laporan Akhir Magang (${isPkpa ? "PKPA" : "Reguler"})`}
                      </p>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#1D64F2] border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
                        {isPkpa ? "PKPA" : "Reguler"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {activeFormatLaporanDoc
                        ? `${activeFormatLaporanDoc.originalName} • ${formatFileSize(activeFormatLaporanDoc.fileSize)}`
                        : `Belum tersedia untuk kategori ${isPkpa ? "PKPA" : "Reguler"} (diatur Admin / Superadmin)`}
                    </p>
                  </div>
                </div>

                {activeFormatLaporanDoc && (
                  <button
                    type="button"
                    disabled={downloadingFormatLaporan}
                    onClick={handleDownloadFormatLaporan}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-[#1D64F2] dark:text-blue-300 border border-blue-200 dark:border-blue-800/70 text-xs font-bold transition shrink-0 disabled:opacity-60"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>
                      {downloadingFormatLaporan
                        ? "Mengunduh..."
                        : "Unduh Format PDF"}
                    </span>
                  </button>
                )}
              </div>

              {laporan ? (
                <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-4 space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {laporan.fileName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatFileSize(laporan.fileSize)} • Dikirim{" "}
                        {new Date(laporan.submittedAt).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${getStatusBadge(
                        laporan.status,
                      )}`}
                    >
                      {laporan.status}
                    </span>
                  </div>

                  {/* Catatan Mentor */}
                  {laporan.mentorNote && (
                    <div className="rounded-xl bg-[#FFFBEB] dark:bg-amber-950/40 border border-[#FDE68A] dark:border-amber-800/70 p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-sm font-bold text-amber-900 dark:text-amber-200">
                        <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
                        <span>Catatan Review Mentor</span>
                      </div>
                      <p className="text-sm text-amber-900 dark:text-amber-100 pl-5 whitespace-pre-line break-words [overflow-wrap:anywhere]">
                        {laporan.mentorNote}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={downloadPdf}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-sm font-bold transition"
                    >
                      <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Unduh PDF</span>
                    </button>

                    {laporan.status === "Disetujui" && (
                      <button
                        type="button"
                        onClick={() => setShowPenilaianModal(true)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#1D64F2] hover:bg-blue-700 text-white text-sm font-bold transition"
                      >
                        <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Lihat Penilaian</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : !uploadScheduleInfo.canUpload ? (
                <div className="rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 p-4 sm:p-5 text-center space-y-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center mx-auto">
                    <Lock className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {uploadScheduleInfo.reason === "inactive"
                      ? "Unggah Laporan Akhir Tidak Tersedia"
                      : "Unggah Laporan Akhir Belum Dibuka"}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
                    {uploadScheduleInfo.reason === "inactive" ? (
                      "Status kepesertaan magang Anda sedang tidak aktif."
                    ) : (
                      <>
                        Unggah Laporan Akhir dibuka mulai <b>H-10</b> sebelum masa magang berakhir, yaitu mulai tanggal{" "}
                        <b>{uploadScheduleInfo.openDateLabel}</b>
                        {uploadScheduleInfo.daysUntilOpen > 0
                          ? ` (${uploadScheduleInfo.daysUntilOpen} hari lagi)`
                          : ""}
                        .
                      </>
                    )}
                  </p>
                  <button
                    type="button"
                    disabled
                    className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-sm font-bold inline-flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Unggah Laporan Akhir Terkunci</span>
                  </button>
                </div>
              ) : (
                <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-4 sm:p-5 text-center space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Unggah laporan akhir magang dalam format PDF (maksimal 5MB).
                    Laporan hanya dapat diunggah <b>1 kali</b> dan bersifat
                    final.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(true)}
                    className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#1D64F2] hover:bg-blue-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2 shadow-xs transition"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Unggah Laporan Akhir</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CARD 3: SURVEI */}
        <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs overflow-hidden">
          <button
            type="button"
            onClick={() => {
              if (!feedback && isLaporanApproved) {
                handleOpenFeedbackModal();
              } else {
                setOpenSurveiSection((v) => !v);
              }
            }}
            className="w-full p-4 sm:p-5 text-left hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 sm:gap-3.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  Survei &amp; Feedback
                </span>
              </div>
              <ChevronRight
                className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-400 transition-transform duration-200 ${
                  openSurveiSection ? "rotate-90" : ""
                }`}
              />
            </div>

            <div className="mt-3 sm:mt-3.5 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-700/70 flex items-center justify-between gap-2 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5 min-w-0">
                {feedback ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      Sudah dikirim •{" "}
                      {feedback.mentorResponse
                        ? "Sudah direspon Mentor"
                        : "Menunggu respon Mentor"}
                    </span>
                  </>
                ) : isLaporanApproved ? (
                  <>
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1D64F2] shrink-0" />
                    <span className="truncate text-[#1D64F2] font-semibold">
                      Siap diisi • Ketuk untuk mengisi survei program
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
                    <span className="truncate">
                      Terkunci • Menunggu Laporan Akhir disetujui Mentor
                    </span>
                  </>
                )}
              </div>

              {!feedback && !isLaporanApproved && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                  Terkunci
                </span>
              )}
            </div>
          </button>

          {/* Expanded Survei Detail: locked state if laporan not approved yet */}
          {!feedback && !isLaporanApproved && openSurveiSection && (
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2.5 border-t border-slate-100 dark:border-slate-700/70 bg-slate-50/40 dark:bg-slate-800/40">
              <div className="rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 p-4 text-center space-y-2.5">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Survei &amp; Feedback Belum Dapat Diisi
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {laporan
                    ? `Status Laporan Akhir Anda saat ini "${laporan.status}". Pengisian Survei & Feedback baru dibuka setelah Laporan Akhir disetujui oleh Mentor.`
                    : "Silakan unggah Laporan Akhir terlebih dahulu (dibuka mulai H-10) dan tunggu persetujuan Mentor sebelum mengisi Survei & Feedback."}
                </p>
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-sm font-bold inline-flex items-center justify-center gap-1.5 cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" />
                  <span>Menunggu Persetujuan Laporan Akhir</span>
                </button>
              </div>
            </div>
          )}

          {/* Expanded Survei Detail when already filled */}
          {feedback && openSurveiSection && (
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2.5 border-t border-slate-100 dark:border-slate-700/70 space-y-3 bg-slate-50/40 dark:bg-slate-800/40">
              <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Periode Survei</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {feedback.month}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Tanggal Kirim</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {new Date(feedback.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {feedback.mentorResponse && (
                  <div className="rounded-xl bg-[#FFFBEB] dark:bg-amber-950/40 border border-[#FDE68A] dark:border-amber-800/70 p-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-amber-900 dark:text-amber-200">
                      <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
                      <span>
                        Tanggapan Mentor (
                        {feedback.mentorRespondedBy?.name || "Mentor"})
                      </span>
                    </div>
                    <p className="text-sm text-amber-900 dark:text-amber-100 pl-5 whitespace-pre-line break-words [overflow-wrap:anywhere]">
                      {feedback.mentorResponse}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleOpenFeedbackModal}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-sm font-bold transition"
                >
                  Lihat Detail Isian Survei
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CARD 3: PENILAIAN AKHIR MAGANG */}
        <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs overflow-hidden">
          <Link
            href="/dashboard/peserta/penilaian-akhir"
            className="block w-full p-4 sm:p-5 text-left hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 sm:gap-3.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  Penilaian Akhir Magang
                </span>
              </div>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0" />
            </div>

            <div className="mt-3 sm:mt-3.5 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-700/70 flex items-center justify-between gap-2 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5 truncate">
                {penilaianAkhirSummary ? (
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
                )}
                <span className="truncate">
                  {penilaianAkhirSummary
                    ? `Rata-rata: ${penilaianAkhirSummary.nilaiRataRata}${penilaianAkhirSummary.keteranganRataRata ? ` (${penilaianAkhirSummary.keteranganRataRata})` : ""}`
                    : "Menunggu penilaian dari Mentor pembimbing"}
                </span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${
                  penilaianAkhirSummary
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                    : "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800"
                }`}
              >
                {penilaianAkhirSummary ? "Tersedia" : "Lihat Detail"}
              </span>
            </div>
          </Link>
        </div>

        {/* CARD 4: SERTIFIKAT & SURAT SELESAI MAGANG */}
        <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs overflow-hidden">
          <button
            type="button"
            onClick={() => setOpenSertifikatSection((v) => !v)}
            className="w-full p-4 sm:p-5 text-left hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 sm:gap-3.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  Sertifikat & Surat Selesai Magang
                </span>
              </div>
              <ChevronRight
                className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-400 transition-transform duration-200 ${
                  openSertifikatSection ? "rotate-90" : ""
                }`}
              />
            </div>

            <div className="mt-3 sm:mt-3.5 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-700/70 flex items-center justify-between gap-2 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5 truncate">
                {canDownloadCompletionDocs ? (
                  <BadgeCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
                )}
                <span className="truncate">
                  {canDownloadCompletionDocs
                    ? "Sertifikat Kelulusan & Surat Keterangan Selesai Magang"
                    : "Selesaikan Laporan Akhir (Disetujui) & Survei untuk mengunduh"}
                </span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${
                  canDownloadCompletionDocs
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                    : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                }`}
              >
                {canDownloadCompletionDocs ? "Siap Diunduh" : "Terkunci"}
              </span>
            </div>
          </button>

          {/* Expanded Sertifikat & Surat Selesai Content */}
          {openSertifikatSection && (
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2.5 border-t border-slate-100 dark:border-slate-700/70 space-y-3.5 bg-slate-50/40 dark:bg-slate-800/40">
              {!canDownloadCompletionDocs && (
                <div className="rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-200">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Syarat Mengunduh Sertifikat &amp; Surat Selesai Magang</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 pl-1">
                    <div className="flex items-center gap-2">
                      {isLaporanApproved ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <span className={isLaporanApproved ? "font-semibold text-emerald-700 dark:text-emerald-300" : ""}>
                        1. Laporan Akhir sudah disetujui oleh Mentor{" "}
                        {laporan ? `(Status: ${laporan.status})` : "(Belum diunggah)"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSurveyDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <span className={isSurveyDone ? "font-semibold text-emerald-700 dark:text-emerald-300" : ""}>
                        2. Survei &amp; Feedback program sudah selesai diisi{" "}
                        {isSurveyDone ? "(Selesai)" : "(Belum diisi)"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Item 1: Sertifikat Magang */}
              <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-4 space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1D64F2] dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-sm font-bold text-slate-900 dark:text-white truncate"
                        style={{ fontWeight: 700 }}
                      >
                        Sertifikat Magang
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {sertifikat?.nomorSertifikat
                          ? `No: ${sertifikat.nomorSertifikat}`
                          : sertifikat?.tanggalKirim
                            ? `Diterbitkan ${new Date(
                                sertifikat.tanggalKirim,
                              ).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}`
                            : "Sertifikat Kelulusan Program Magang BBPOM"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${
                      !canDownloadCompletionDocs
                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                        : sertifikat?.file
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600"
                    }`}
                  >
                    {!canDownloadCompletionDocs
                      ? "Terkunci"
                      : sertifikat?.file
                        ? "Tersedia"
                        : "Belum Terbit"}
                  </span>
                </div>

                {!canDownloadCompletionDocs ? (
                  <div className="flex flex-col sm:flex-row gap-2.5 pt-0.5">
                    <button
                      type="button"
                      disabled
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-sm font-bold cursor-not-allowed"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Review Sertifikat Terkunci</span>
                    </button>

                    <button
                      type="button"
                      disabled
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-sm font-bold cursor-not-allowed"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Unduh Sertifikat Terkunci</span>
                    </button>
                  </div>
                ) : sertifikat?.file ? (
                  <div className="flex flex-col sm:flex-row gap-2.5 pt-0.5">
                    <button
                      type="button"
                      onClick={handleOpenPreviewSertifikat}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-sm font-bold transition"
                    >
                      <Eye className="w-4 h-4 text-[#1D64F2] dark:text-blue-400" />
                      <span>Review Sertifikat</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadSertifikat}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-[#1D64F2] hover:bg-blue-700 text-white text-sm font-bold shadow-2xs transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh Sertifikat</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/70 px-3.5 py-2.5 leading-relaxed">
                    Sertifikat Magang akan muncul di sini setelah diunggah oleh Admin / Superadmin BBPOM di Palembang.
                  </p>
                )}
              </div>

              {/* Item 2: Surat Selesai Magang */}
              <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-4 space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-sm font-bold text-slate-900 dark:text-white truncate"
                        style={{ fontWeight: 700 }}
                      >
                        Surat Selesai Magang
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {suratSelesai?.tanggalKirim
                          ? `Diterbitkan ${new Date(
                              suratSelesai.tanggalKirim,
                            ).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}`
                          : "Surat Keterangan Telah Menyelesaikan Magang BBPOM"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${
                      !canDownloadCompletionDocs
                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                        : suratSelesai?.file
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600"
                    }`}
                  >
                    {!canDownloadCompletionDocs
                      ? "Terkunci"
                      : suratSelesai?.file
                        ? "Tersedia"
                        : "Belum Terbit"}
                  </span>
                </div>

                {!canDownloadCompletionDocs ? (
                  <div className="flex flex-col sm:flex-row gap-2.5 pt-0.5">
                    <button
                      type="button"
                      disabled
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-sm font-bold cursor-not-allowed"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Review Surat Terkunci</span>
                    </button>
                    <button
                      type="button"
                      disabled
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-sm font-bold cursor-not-allowed"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Unduh Surat Terkunci</span>
                    </button>
                  </div>
                ) : suratSelesai?.file ? (
                  <div className="flex flex-col sm:flex-row gap-2.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setShowSuratSelesaiModal(true)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-sm font-bold transition"
                    >
                      <Eye className="w-4 h-4 text-[#1D64F2] dark:text-blue-400" />
                      <span>Review Surat Selesai</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadSuratSelesai}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-[#1D64F2] hover:bg-blue-700 text-white text-sm font-bold shadow-2xs transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh Surat Selesai</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/70 px-3.5 py-2.5 leading-relaxed">
                    Surat Keterangan Selesai Magang akan muncul di sini setelah
                    diterbitkan oleh Admin BBPOM di Palembang.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL UPLOAD LAPORAN AKHIR ================= */}
      {showUploadModal && (
        <LaporanAkhirUploadModal
          isPkpa={isPkpa}
          onClose={async (success) => {
            setShowUploadModal(false);
            if (success) {
              setLoading(true);
              await Promise.all([fetchLaporan(), checkFeedback()]);
              setLoading(false);
              hasShownPopupRef.current = false;
            }
          }}
        />
      )}

      {/* ================= MODAL PENILAIAN MENTOR ================= */}
      {showPenilaianModal && (
        <PenilaianModal onClose={() => setShowPenilaianModal(false)} />
      )}

      {/* ================= MODAL FEEDBACK / SURVEI ================= */}
      {showFeedbackModal && selectedMonth && (
        <FeedbackModal
          month={selectedMonth}
          mode={feedbackModalMode}
          onClose={(submitted) => {
            setShowFeedbackModal(false);
            if (submitted) {
              checkFeedback();
              setShowFeedbackPopup(false);
            }
          }}
        />
      )}

      {/* ================= MODAL REVIEW SERTIFIKAT ================= */}
      {showSertifikatModal &&
        canDownloadCompletionDocs &&
        sertifikatPreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-xs p-3 sm:p-5">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1D64F2] dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2
                    className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight"
                    style={{ fontWeight: 800 }}
                  >
                    Review Sertifikat Magang
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    Pratinjau dokumen Sertifikat Magang BBPOM di Palembang
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClosePreviewSertifikat}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body: PDF Preview */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#F8FAFC] dark:bg-slate-950/50 space-y-3">
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white">
                <iframe
                  src={sertifikatPreviewUrl}
                  title="Preview Sertifikat Magang"
                  className="w-full h-[55vh] sm:h-[60vh]"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>
                  Jika pratinjau tidak tampil di browser, buka langsung di tab baru.
                </span>
                <a
                  href={sertifikatPreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-[#1D64F2] hover:underline shrink-0"
                >
                  <span>Buka Tab Baru</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 sm:px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
              <button
                type="button"
                onClick={handleClosePreviewSertifikat}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={handleDownloadSertifikat}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#1D64F2] hover:bg-blue-700 shadow-2xs transition inline-flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Sertifikat (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL REVIEW SURAT SELESAI MAGANG ================= */}
      {showSuratSelesaiModal &&
        canDownloadCompletionDocs &&
        suratSelesaiFileUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-xs p-3 sm:p-5">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2
                    className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight"
                    style={{ fontWeight: 800 }}
                  >
                    Review Surat Selesai Magang
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    Pratinjau dokumen Surat Selesai Magang BBPOM di Palembang
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSuratSelesaiModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body: PDF Preview */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#F8FAFC] dark:bg-slate-950/50 space-y-3">
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white">
                <iframe
                  src={suratSelesaiFileUrl}
                  title="Preview Surat Selesai Magang"
                  className="w-full h-[55vh] sm:h-[60vh]"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>
                  Jika pratinjau tidak tampil di browser, buka langsung di tab
                  baru.
                </span>
                <a
                  href={suratSelesaiFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-[#1D64F2] hover:underline shrink-0"
                >
                  <span>Buka Tab Baru</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 sm:px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowSuratSelesaiModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={handleDownloadSuratSelesai}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#1D64F2] hover:bg-blue-700 shadow-2xs transition inline-flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Surat Selesai (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= POPUP WAJIB SURVEI ================= */}
      {showFeedbackPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <ClipboardCheck className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Isi Survei & Feedback
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Laporan akhir Anda telah <b>disetujui</b> oleh Mentor. Silakan
                lengkapi <b>Survei dan Feedback Program</b> agar Sertifikat dan
                Surat Selesai Magang dapat diunduh.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowFeedbackPopup(false);
                  handleOpenFeedbackModal();
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-[#1D64F2] hover:bg-blue-700 transition"
              >
                Isi Survei Sekarang
              </button>
              <button
                type="button"
                onClick={() => setShowFeedbackPopup(false)}
                className="w-full py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
