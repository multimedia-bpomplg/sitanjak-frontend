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
        setStatus(data.status || "Menunggu");

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

  return (
    <div
      className="
        fixed inset-0 z-50
        bg-black/40 dark:bg-black/70
        backdrop-blur-md
        flex items-center justify-center p-3 sm:p-6
      "
    >
      <div
        className="
          w-full max-w-5xl
          bg-white/90 dark:bg-white/5
          backdrop-blur
          rounded-3xl
          border border-slate-200 dark:border-indigo-500/30
          shadow-2xl
          overflow-hidden
          max-h-[92vh]
          flex flex-col
        "
      >
        {/* HEADER */}
        <div
          className="
            px-5 sm:px-6 py-4 sm:py-5
            bg-linear-to-r
            from-[#FCA5A5] via-[#FDE68A] to-[#FFF7ED]
            dark:from-indigo-800 dark:via-indigo-700 dark:to-indigo-900
            text-slate-900 dark:text-white
            flex items-center justify-between
            gap-3
          "
        >
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="p-2 bg-white/20 rounded-xl shrink-0">
              <FiFileText className="text-xl" />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold leading-tight truncate">
                Laporan Akhir Magang
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm opacity-90">
                <div className="flex items-center gap-1 min-w-0">
                  <FiUser className="shrink-0" />
                  <span className="truncate">{peserta.nama}</span>
                </div>
                <div className="flex items-center gap-1 min-w-0">
                  <FiMail className="shrink-0" />
                  <span className="truncate max-w-55 sm:max-w-none">
                    {peserta.email}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition"
          >
            <FiX className="text-xl" />
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* LEFT - STATUS */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`
                        w-10 h-10 rounded-xl flex items-center justify-center
                        shadow-inner
                        ${getStatusColor(laporan.status).bg}
                      `}
                    >
                      <span className={getStatusColor(laporan.status).icon}>
                        {getStatusIcon(laporan.status)}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-indigo-300">
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
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                      <FiFileText className="text-slate-500" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {laporan.fileName || "Laporan_Akhir.pdf"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500">
                        {laporan.fileSize
                          ? formatFileSize(laporan.fileSize)
                          : "-"}
                      </span>
                      <span className="text-xs text-slate-500">
                        •{" "}
                        {new Date(
                          laporan.submittedAt || laporan.createdAt,
                        ).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS PDF */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleDownloadPdf}
                  className="
                    inline-flex items-center gap-2
                    px-4 py-2.5
                    rounded-xl
                    text-sm font-semibold
                    text-emerald-700 dark:text-emerald-300
                    border border-emerald-400 dark:border-emerald-500
                    bg-white dark:bg-slate-900
                    hover:bg-emerald-50 dark:hover:bg-emerald-900/30
                    shadow-sm hover:shadow-md
                    transition-all
                  "
                >
                  <FiDownload className="w-4 h-4" />
                  Download PDF
                </button>

                <button
                  onClick={handleViewPdf}
                  className="
                    inline-flex items-center gap-2
                    px-4 py-2.5
                    rounded-xl
                    text-sm font-semibold
                    text-indigo-700 dark:text-indigo-300
                    border border-indigo-400 dark:border-indigo-500
                    bg-white dark:bg-slate-900
                    hover:bg-indigo-50 dark:hover:bg-indigo-900/30
                    shadow-sm hover:shadow-md
                    transition-all
                  "
                >
                  <FiEye className="w-4 h-4" />
                  Lihat PDF
                </button>
              </div>

              {/* FORM REVIEW MENTOR + PENILAIAN */}
              <div
                className={`
                  mt-6
                  rounded-2xl
                  border
                  p-5 sm:p-6
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
                        : "bg-indigo-100 dark:bg-indigo-500/20"
                    }`}
                  >
                    <FiStar
                      className={`w-5 h-5 ${
                        alreadyReviewed
                          ? "text-slate-500 dark:text-slate-400"
                          : "text-indigo-600 dark:text-indigo-300"
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
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                        ⚠️ Status tidak dapat diubah karena laporan sudah
                        direview
                      </p>
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
                                      : "border-amber-400 dark:border-amber-500 focus:ring-amber-400"
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
                      Komentar / Catatan
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
                        onClick={handleUpdateStatus}
                        disabled={
                          status === "Disetujui" &&
                          !Object.values(penilaian).every((v) => v !== "")
                        }
                        className={`
                          px-8 py-2.5
                          rounded-xl
                          font-semibold
                          shadow-md hover:shadow-xl
                          transition-all duration-300
                          ${
                            status === "Disetujui" &&
                            !Object.values(penilaian).every((v) => v !== "")
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
    </div>
  );
}
