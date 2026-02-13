"use client";

import { useState, useEffect } from "react";
import {
  FiX,
  FiFileText,
  FiUser,
  FiMail,
  FiCheckCircle,
  FiXCircle,
  FiStar,
  FiDownload,
  FiEye,
  FiLock,
} from "react-icons/fi";
import { showToast } from "@/components/ui/toastDashboard";

type Props = {
  peserta: {
    id: string;
    nama: string;
    email: string;
    posisi: string;
  };
  onClose: () => void;
  onStatusUpdate?: () => void;
};

type Penilaian = {
  kehadiranDisiplin: string;
  sikapPerilaku: string;
  kemampuanKomunikasi: string;
  inisiatifTanggungJawab: string;
  kemampuanAdaptasi: string;
  pengetahuanTeknis: string;
  produktivitasKetepatanWaktu: string;
  kerjaSamaTim: string;
};

const penilaianOptions = [
  { value: "sangat buruk", label: "Sangat Buruk", color: "rose" },
  { value: "buruk", label: "Buruk", color: "amber" },
  { value: "baik", label: "Baik", color: "blue" },
  { value: "sangat baik", label: "Sangat Baik", color: "emerald" },
];

export default function MentorLaporanAkhirModal({
  peserta,
  onClose,
  onStatusUpdate,
}: Props) {
  const [laporan, setLaporan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mentorNote, setMentorNote] = useState("");
  const [status, setStatus] = useState("Menunggu");
  const [showConfirm, setShowConfirm] = useState(false);
  const [penilaian, setPenilaian] = useState<Penilaian>({
    kehadiranDisiplin: "",
    sikapPerilaku: "",
    kemampuanKomunikasi: "",
    inisiatifTanggungJawab: "",
    kemampuanAdaptasi: "",
    pengetahuanTeknis: "",
    produktivitasKetepatanWaktu: "",
    kerjaSamaTim: "",
  });

  /* ================= FETCH LAPORAN AKHIR PESERTA ================= */
  const fetchLaporanAkhirPeserta = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      if (!peserta.email || !peserta.email.includes("@")) {
        console.error("Email peserta tidak valid:", peserta.email);
        setLaporan(null);
        setLoading(false);
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/laporan-akhir/mentor/peserta-email/${encodeURIComponent(peserta.email)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.ok) {
        const data = await res.json();
        setLaporan(data);
        setMentorNote(data.mentorNote || "");
        if (data.status === "Menunggu") {
          setStatus("Disetujui"); // hanya tampilan
        } else {
          setStatus(data.status);
        }

        // 🔥 LOAD PENILAIAN JIKA ADA
        if (data.penilaian) {
          setPenilaian({
            kehadiranDisiplin: data.penilaian.kehadiranDisiplin || "",
            sikapPerilaku: data.penilaian.sikapPerilaku || "",
            kemampuanKomunikasi: data.penilaian.kemampuanKomunikasi || "",
            inisiatifTanggungJawab: data.penilaian.inisiatifTanggungJawab || "",
            kemampuanAdaptasi: data.penilaian.kemampuanAdaptasi || "",
            pengetahuanTeknis: data.penilaian.pengetahuanTeknis || "",
            produktivitasKetepatanWaktu:
              data.penilaian.produktivitasKetepatanWaktu || "",
            kerjaSamaTim: data.penilaian.kerjaSamaTim || "",
          });
        }
      } else {
        setLaporan(null);
        setMentorNote("");
        setStatus("Menunggu");
      }
    } catch (error) {
      console.error("Gagal memuat laporan akhir:", error);
      setLaporan(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporanAkhirPeserta();
  }, [peserta]);

  /* ================= CEK APAKAH SUDAH DIREVIEW ================= */
  const isAlreadyReviewed = () => {
    return laporan?.status === "Disetujui" || laporan?.status === "Ditolak";
  };

  /* ================= UPDATE STATUS & PENILAIAN ================= */
  const handleUpdateStatus = async () => {
    if (!laporan) return;

    // 🔥 VALIDASI KOMENTAR WAJIB
    if (!mentorNote.trim()) {
      showToast.error("Komentar mentor wajib diisi");
      return;
    }

    // 🔥 CEK SUDAH DIREVIEW
    if (isAlreadyReviewed()) {
      showToast.error("Laporan ini sudah direview dan tidak dapat diubah lagi");
      return;
    }

    // 🔥 VALIDASI: jika status Disetujui, penilaian harus lengkap
    if (status === "Disetujui") {
      const isPenilaianComplete = Object.values(penilaian).every(
        (v) => v !== "",
      );
      if (!isPenilaianComplete) {
        showToast.error(
          "Semua aspek penilaian harus diisi untuk menyetujui laporan",
        );
        return;
      }
    }

    const toastId = showToast.loading("Mengupdate status laporan...");

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/laporan-akhir/mentor/update-status-penilaian/${laporan._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
            mentorNote,
            penilaian: status === "Disetujui" ? penilaian : undefined,
          }),
        },
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Gagal mengupdate status");
      }

      showToast.updateSuccess(toastId, "Status laporan berhasil diupdate!");

      // Refresh data
      fetchLaporanAkhirPeserta();

      // Trigger callback untuk refresh parent
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error: any) {
      showToast.updateError(
        toastId,
        error.message || "Terjadi kesalahan saat mengupdate status",
      );
    }
  };

  /* ================= DOWNLOAD PDF ================= */
  const handleDownloadPdf = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/laporan-akhir/mentor/download/${laporan._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error("Gagal mengunduh PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = laporan?.fileName || "Laporan_Akhir.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showToast.error("Gagal mengunduh PDF");
    }
  };

  /* ================= VIEW PDF ================= */
  const handleViewPdf = () => {
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL}/laporan-akhir/mentor/view/${laporan._id}`,
      "_blank",
    );
  };

  /* ================= UPDATE PENILAIAN ================= */
  const updatePenilaian = (key: keyof Penilaian, value: string) => {
    if (isAlreadyReviewed()) return; // Tidak bisa ubah jika sudah direview
    setPenilaian((prev) => ({ ...prev, [key]: value }));
  };

  /* ================= FORMAT FILE SIZE ================= */
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  /* ================= GET STATUS COLOR ================= */
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Disetujui":
        return {
          bg: "bg-emerald-500/20 dark:bg-emerald-400/20",
          text: "text-emerald-700 dark:text-emerald-300",
          border: "border-emerald-400/40",
          icon: "text-emerald-500",
        };
      case "Ditolak":
        return {
          bg: "bg-red-500/20 dark:bg-red-400/20",
          text: "text-red-700 dark:text-red-300",
          border: "border-red-400/40",
          icon: "text-red-500",
        };
      default:
        return {
          bg: "bg-amber-500/20 dark:bg-amber-400/20",
          text: "text-amber-700 dark:text-amber-300",
          border: "border-amber-400/40",
          icon: "text-amber-500",
        };
    }
  };

  /* ================= GET STATUS ICON ================= */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Disetujui":
        return <FiCheckCircle className="w-5 h-5" />;
      case "Ditolak":
        return <FiXCircle className="w-5 h-5" />;
      default:
        return <FiFileText className="w-5 h-5" />;
    }
  };

  /* ================= LABEL PENILAIAN ================= */
  const penilaianLabels: Record<keyof Penilaian, string> = {
    kehadiranDisiplin: "Kehadiran dan Disiplin",
    sikapPerilaku: "Sikap dan Perilaku",
    kemampuanKomunikasi: "Kemampuan Komunikasi",
    inisiatifTanggungJawab: "Inisiatif dan Tanggung Jawab",
    kemampuanAdaptasi: "Kemampuan Adaptasi",
    pengetahuanTeknis: "Pengetahuan Teknis",
    produktivitasKetepatanWaktu: "Produktivitas dan Ketepatan Waktu",
    kerjaSamaTim: "Kerja Sama Tim",
  };

  const alreadyReviewed = isAlreadyReviewed();
  const isCommentFilled = mentorNote.trim().length > 0;

  return (
    <div
      className="
        fixed inset-0 z-50
        bg-black/40 dark:bg-black/70
        backdrop-blur-md
        flex items-center justify-center
        p-2 sm:p-4
      "
    >
      <div
        className="
          w-full max-w-4xl
          bg-white dark:bg-slate-900
          rounded-2xl sm:rounded-3xl
          border border-slate-200 dark:border-slate-800
          shadow-2xl
          overflow-hidden
          max-h-[95vh]
          flex flex-col
        "
      >
        {/* HEADER */}
        <div
          className="
            px-4 sm:px-6 py-4
            bg-linear-to-r
            from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
            dark:from-indigo-700 dark:to-violet-600
            text-white
            flex items-center justify-between
            gap-3
          "
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-white/20 rounded-xl shrink-0">
              <FiFileText className="text-lg" />
            </div>

            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold truncate">
                Review Laporan Akhir
              </h2>
              <p className="text-xs opacity-80 truncate">
                {peserta.nama} • {peserta.posisi}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/30 hover:bg-white/50 transition"
          >
            <FiX className="text-xl text-red-500" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-slate-600">Memuat laporan...</p>
            </div>
          ) : laporan ? (
            <>
              {/* 🔥 NOTIFIKASI SUDAH DIREVIEW */}
              {alreadyReviewed && (
                <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-indigo-100 dark:bg-indigo-800 rounded-lg">
                      <FiLock className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                    </div>
                    <div>
                      <p className="font-semibold text-indigo-800 dark:text-indigo-200">
                        Laporan Telah Direview
                      </p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-1">
                        Status:{" "}
                        {laporan.status === "Disetujui"
                          ? "✅ Disetujui"
                          : "❌ Ditolak"}{" "}
                        •{" "}
                        {laporan.approvedAt &&
                          new Date(laporan.approvedAt).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* STATUS & FILE INFO */}
              <div
                className={`
                  rounded-2xl
                  border
                  px-5 py-4
                  backdrop-blur
                  shadow-md
                  transition
                  bg-white/80 dark:bg-indigo-950/40
                  ${getStatusColor(laporan.status).border}
                `}
              >
                <div
                  className="
                    rounded-2xl
                    border
                    px-4 sm:px-6 py-4
                    bg-white/80 dark:bg-indigo-950/40
                    backdrop-blur
                    shadow-md
                    transition
                    flex flex-col sm:flex-row
                    sm:items-center sm:justify-between
                    gap-4
                  "
                >
                  {/* LEFT - STATUS */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`
                        w-12 h-12
                        rounded-2xl
                        flex items-center justify-center
                        shadow-inner
                        ${getStatusColor(laporan.status).bg}
                      `}
                    >
                      <span
                        className={`
                          text-xl
                          ${getStatusColor(laporan.status).icon}
                        `}
                      >
                        {getStatusIcon(laporan.status)}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 dark:text-indigo-300">
                        Status Laporan
                      </p>
                      <p
                        className={`
                          mt-0.5 text-sm sm:text-base font-bold
                          ${getStatusColor(laporan.status).text}
                        `}
                      >
                        {laporan.status === "Disetujui"
                          ? "✅ Disetujui"
                          : laporan.status === "Ditolak"
                            ? "❌ Ditolak"
                            : "⏳ Menunggu Review"}
                      </p>
                    </div>
                  </div>

                  {/* RIGHT - FILE INFO */}
                  <div className="flex flex-col sm:items-end gap-1">
                    <div
                      className="
                        inline-flex items-center gap-2
                        px-3 py-1.5
                        rounded-full
                        bg-slate-100 dark:bg-white/10
                        text-slate-700 dark:text-slate-200
                        text-xs sm:text-sm
                        font-medium
                      "
                    >
                      <FiFileText className="text-sm" />
                      <span className="truncate max-w-45">
                        {laporan.fileName || "Laporan_Akhir.pdf"}
                      </span>
                    </div>

                    <div className="mt-1 me-2 text-[11px] sm:text-xs text-slate-500 flex items-center gap-2 sm:justify-end">
                      <span>
                        {laporan.fileSize
                          ? formatFileSize(laporan.fileSize)
                          : "-"}
                      </span>
                      <span>
                        {new Date(
                          laporan.submittedAt || laporan.createdAt,
                        ).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS PDF */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleDownloadPdf}
                  className="
                    w-full sm:w-auto
                    inline-flex items-center justify-center gap-2
                    px-5 py-2.5
                    rounded-xl
                    text-sm font-semibold
                    text-white
                    bg-emerald-600 hover:bg-emerald-700
                    shadow hover:shadow-lg
                    transition
                  "
                >
                  <FiDownload className="w-4 h-4" />
                  Download PDF
                </button>
              </div>

              {/* FORM REVIEW MENTOR + PENILAIAN */}
              <div
                className={`
                  mt-6
                  rounded-2xl
                  border border-slate-200 dark:border-slate-700
                  bg-white dark:bg-slate-800
                  p-4 sm:p-6
                  shadow-sm
                  ${
                    alreadyReviewed
                      ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                      : "bg-white/80 dark:bg-indigo-950/40 border-slate-200 dark:border-indigo-500/30"
                  }
                `}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`p-2 rounded-lg ${
                      alreadyReviewed
                        ? "bg-slate-200 dark:bg-slate-700"
                        : "bg-amber-100 dark:bg-indigo-500/20"
                    }`}
                  >
                    <FiStar
                      className={`w-5 h-5 ${
                        alreadyReviewed
                          ? "text-slate-500 dark:text-slate-400"
                          : "text-amber-600 dark:text-violet-300"
                      }`}
                    />
                  </div>
                  <div>
                    <h3
                      className={`font-bold ${
                        alreadyReviewed
                          ? "text-slate-600 dark:text-slate-400"
                          : "text-slate-800 dark:text-indigo-200"
                      }`}
                    >
                      Review & Penilaian Mentor
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {alreadyReviewed
                        ? "Anda sudah memberikan review untuk laporan ini"
                        : "Berikan penilaian dan status untuk laporan ini"}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* STATUS SELECTION - DISABLE JIKA SUDAH DIREVIEW */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
                      Status Laporan
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["Disetujui", "Ditolak"].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => !alreadyReviewed && setStatus(s)}
                          disabled={alreadyReviewed}
                          className={`
                            px-5 py-2.5
                            rounded-xl
                            text-sm font-semibold
                            transition-all
                            ${
                              alreadyReviewed
                                ? "opacity-50 cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                                : status === s
                                  ? s === "Disetujui"
                                    ? "bg-emerald-500 text-white shadow-lg"
                                    : "bg-red-500 text-white shadow-lg"
                                  : "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                            }
                          `}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    {alreadyReviewed && (
                      <div
                        className="
                          mt-3
                          flex items-start gap-3
                          rounded-xl
                          border border-amber-300
                          bg-amber-50
                          dark:border-amber-600
                          dark:bg-amber-900/20
                          p-3 sm:p-4
                        "
                      >
                        <div
                          className="
                            shrink-0
                            w-8 h-8
                            rounded-lg
                            bg-amber-100
                            dark:bg-amber-800/40
                            flex items-center justify-center
                            text-amber-600
                            dark:text-amber-300
                            text-sm
                          "
                        >
                          ⚠️
                        </div>

                        <div className="text-left">
                          <p className="text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-300">
                            Laporan sudah direview
                          </p>
                          <p className="text-[11px] sm:text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                            Status tidak dapat diubah karena laporan sudah disetujui atau ditolak.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PENILAIAN GRID - DISABLE JIKA SUDAH DIREVIEW */}
                  {status === "Disetujui" && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1 rounded ${
                            alreadyReviewed
                              ? "bg-slate-200 dark:bg-slate-700"
                              : "bg-amber-100 dark:bg-amber-900/30"
                          }`}
                        >
                          <FiStar
                            className={`w-4 h-4 ${
                              alreadyReviewed
                                ? "text-slate-500 dark:text-slate-400"
                                : "text-amber-600 dark:text-amber-400"
                            }`}
                          />
                        </div>
                        <label
                          className={`text-sm font-semibold ${
                            alreadyReviewed
                              ? "text-slate-500 dark:text-slate-400"
                              : "text-slate-700 dark:text-slate-200"
                          }`}
                        >
                          Aspek Penilaian
                        </label>
                        {!alreadyReviewed && (
                          <span className="text-xs text-red-500">
                            *Wajib diisi semua
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {(
                          Object.keys(penilaianLabels) as Array<keyof Penilaian>
                        ).map((key) => (
                          <div
                            key={key}
                            className="
                              flex flex-col sm:flex-row sm:items-center 
                              gap-2 sm:gap-4
                              p-3
                              rounded-xl
                              bg-slate-50 dark:bg-slate-800/50
                              border border-slate-200 dark:border-slate-700
                            "
                          >
                            <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 sm:w-48 font-medium">
                              {penilaianLabels[key]}
                            </span>
                            <select
                              value={penilaian[key]}
                              onChange={(e) =>
                                updatePenilaian(key, e.target.value)
                              }
                              disabled={alreadyReviewed}
                              className={`
                                flex-1
                                px-4 py-2.5
                                rounded-lg
                                text-sm
                                border-2
                                bg-white dark:bg-slate-900
                                text-slate-700 dark:text-slate-100
                                focus:ring-2 focus:ring-offset-2
                                outline-none
                                transition
                                ${
                                  alreadyReviewed
                                    ? "border-slate-300 dark:border-slate-600 opacity-70 cursor-not-allowed"
                                    : penilaian[key]
                                      ? "border-emerald-400 dark:border-emerald-500 focus:ring-emerald-400"
                                      : "border-amber-400 dark:border-indigo-500 focus:ring-amber-400 dark:focus:ring-indigo-500"
                                }
                              `}
                            >
                              <option value="" disabled>
                                Pilih nilai
                              </option>
                              {penilaianOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>

                      {/* INFO VALIDASI */}
                      {status === "Disetujui" && !alreadyReviewed && (
                        <div
                          className={`
                          mt-2 p-3 rounded-lg text-xs
                          ${
                            Object.values(penilaian).every((v) => v !== "")
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 border border-amber-200"
                          }
                        `}
                        >
                          {Object.values(penilaian).every((v) => v !== "")
                            ? "✓ Semua aspek penilaian telah diisi"
                            : `⚠️ ${Object.values(penilaian).filter((v) => v === "").length} aspek penilaian belum diisi`}
                        </div>
                      )}
                    </div>
                  )}

                  {/* KOMENTAR - DISABLE JIKA SUDAH DIREVIEW */}
                  <div>
                    <label
                      className={`block text-sm font-semibold mb-2 ${
                        alreadyReviewed
                          ? "text-slate-500 dark:text-slate-400"
                          : "text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      Komentar / Catatan <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={mentorNote}
                      onChange={(e) =>
                        !alreadyReviewed && setMentorNote(e.target.value)
                      }
                      disabled={alreadyReviewed}
                      rows={4}
                      className={`
                        w-full px-4 py-3
                        rounded-xl
                        bg-white dark:bg-white/5
                        border-2
                        text-slate-700 dark:text-slate-100
                        placeholder:text-slate-400
                        focus:ring-2
                        outline-none
                        transition
                        resize-none
                        ${
                          alreadyReviewed
                            ? "border-slate-300 dark:border-slate-600 opacity-70 cursor-not-allowed"
                            : "border-amber-400/70 dark:border-indigo-500/60 focus:ring-amber-300 dark:focus:ring-indigo-500/60"
                        }
                      `}
                      placeholder={
                        alreadyReviewed
                          ? "Catatan mentor"
                          : "Berikan komentar atau catatan untuk peserta..."
                      }
                      readOnly={alreadyReviewed}
                    />
                  </div>

                  {/* ACTION BUTTONS - HILANGKAN JIKA SUDAH DIREVIEW */}
                  {!alreadyReviewed && (
                    <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                      <button
                        onClick={onClose}
                        className="
                          px-6 py-2.5
                          rounded-xl
                          border-2 border-slate-300
                          text-slate-600 dark:text-slate-300
                          hover:bg-slate-100 dark:hover:bg-white/10
                          font-semibold
                          transition
                        "
                      >
                        Batal
                      </button>

                      <button
                        onClick={() => setShowConfirm(true)}
                        disabled={
                          !isCommentFilled ||
                          (status === "Disetujui" &&
                            !Object.values(penilaian).every((v) => v !== ""))
                        }
                        className={`
                          px-8 py-2.5
                          rounded-xl
                          font-semibold
                          shadow-md hover:shadow-xl
                          transition-all duration-300
                          ${
                            !isCommentFilled ||
                            (status === "Disetujui" &&
                              !Object.values(penilaian).every((v) => v !== ""))
                              ? "bg-slate-400 cursor-not-allowed text-white"
                              : status === "Disetujui"
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-red-600 hover:bg-red-700 text-white"
                          }
                        `}
                      >
                        {status === "Disetujui"
                          ? "✅ Setujui & Beri Nilai"
                          : "❌ Tolak Laporan"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* TAMPILKAN PENILAIAN LAMA (JIKA ADA) */}
              {laporan.status === "Disetujui" && laporan.penilaian && (
                <div className="mt-6 p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-200 mb-3 flex items-center gap-2">
                    <FiStar className="w-4 h-4" />
                    Penilaian yang sudah diberikan
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(penilaianLabels).map(([key, label]) => (
                      <div
                        key={key}
                        className="flex justify-between items-center p-2 bg-white dark:bg-slate-800 rounded-lg"
                      >
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {label}:
                        </span>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                          {laporan.penilaian[key] || "-"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-slate-700 font-medium text-lg">
                Belum ada laporan akhir
              </p>
              <p className="text-slate-500 text-sm mt-2">
                Peserta belum mengupload laporan akhir magang
              </p>
            </div>
          )}
        </div>
      </div>
      
      {showConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className="
              w-full max-w-sm
              rounded-3xl
              bg-white dark:bg-slate-900
              border border-slate-200 dark:border-slate-700
              shadow-2xl
              p-6
              space-y-5
              text-center
            "
          >
            {/* ICON */}
            <div
              className={`
                mx-auto
                w-14 h-14
                rounded-2xl
                flex items-center justify-center
                text-white
                shadow-lg
                ${
                  status === "Disetujui"
                    ? "bg-emerald-500"
                    : "bg-red-500"
                }
              `}
            >
              {status === "Disetujui" ? (
                <FiCheckCircle className="text-2xl" />
              ) : (
                <FiXCircle className="text-2xl" />
              )}
            </div>

            {/* TITLE */}
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                Konfirmasi {status === "Disetujui" ? "Persetujuan" : "Penolakan"}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                Apakah Anda yakin ingin{" "}
                <span
                  className={`font-semibold ${
                    status === "Disetujui"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {status === "Disetujui" ? "menyetujui" : "menolak"}
                </span>{" "}
                laporan ini?
              </p>
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="
                  w-full
                  py-2.5
                  rounded-xl
                  border
                  border-slate-300 dark:border-slate-600
                  text-slate-600 dark:text-slate-300
                  hover:bg-slate-100 dark:hover:bg-slate-800
                  font-semibold
                  transition
                "
              >
                Batal
              </button>

              <button
                onClick={() => {
                  setShowConfirm(false);
                  handleUpdateStatus();
                }}
                className={`
                  w-full
                  py-2.5
                  rounded-xl
                  text-white
                  font-semibold
                  shadow-md hover:shadow-xl
                  transition
                  ${
                    status === "Disetujui"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-red-600 hover:bg-red-700"
                  }
                `}
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
