"use client";

import { useEffect, useState } from "react";
import { showToast } from "@/components/ui/toastDashboard";
import {
  FiCheck,
  FiX,
  FiCalendar,
  FiFileText,
  FiImage,
  FiClock,
  FiUserCheck,
  FiUserX,
  FiEdit,
  FiEye,
} from "react-icons/fi";

type Props = {
  date: string;
  pesertaId: string;
  pesertaNama: string;
  onClose: () => void;
};

export default function MentorLogbookModal({
  date,
  pesertaId,
  pesertaNama,
  onClose,
}: Props) {
  const [logbookId, setLogbookId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("hadir");
  const [judul, setJudul] = useState("");
  const [pengalaman, setPengalaman] = useState("");
  const [kendala, setKendala] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [approvedByMentor, setApprovedByMentor] = useState(false);
  const [mentorNote, setMentorNote] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<
    "menunggu" | "disetujui" | "ditolak" | "revisi"
  >("menunggu");
  const [isFinalized, setIsFinalized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvedAt, setApprovedAt] = useState<string>("");

  useEffect(() => {
    fetchLogbook();
  }, [date, pesertaId]);

  const getImageUrl = (path: string) => {
    if (!path) return "";

    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }

    if (path.startsWith("uploads/")) {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        "";
      return `${baseUrl.replace(/\/$/, "")}/${path}`;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    return `${baseUrl}/${path}`;
  };

  const fetchLogbook = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/logbook/mentor/peserta/${pesertaId}/date/${date}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (res.status === 404) {
        showToast.error("Logbook ini belum dibuat oleh peserta");
        setIsLoading(false);
        return;
      }

      if (!res.ok) throw new Error("Gagal mengambil logbook");

      const data = await res.json();

      setLogbookId(data._id);
      setStatus(data.status);
      setJudul(data.judul || "");
      setPengalaman(data.pengalaman || "");
      setKendala(data.kendala || "");
      setKeterangan(data.keterangan || "");
      setFiles(data.files || []);
      setPdfFile(data.pdfFile || null);
      setApprovedByMentor(Boolean(data.approvedByMentor));
      setApprovalStatus(data.approvalStatus || "menunggu");
      setMentorNote(data.mentorNote || "");
      setApprovedAt(data.approvedAt || "");
      setIsFinalized(data.isFinalized || false);
    } catch {
      showToast.error("Gagal memuat logbook");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (approved: boolean) => {
    if (!logbookId) {
      showToast.error("Logbook tidak ditemukan");
      return;
    }

    if (isFinalized) {
      showToast.error("Logbook sudah diproses dan tidak dapat diubah");
      return;
    }

    if (!mentorNote.trim()) {
      showToast.error("Harap berikan catatan terlebih dahulu");
      return;
    }

    setIsSubmitting(true);
    const toastId = showToast.loading("Memproses logbook...");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/logbook/mentor/approve/${logbookId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            approvalStatus: approved ? "disetujui" : "ditolak",
            mentorNote: mentorNote.trim(),
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal memproses logbook");
      }

      setIsFinalized(true);
      setApprovalStatus(approved ? "disetujui" : "ditolak");
      setApprovedByMentor(approved);
      setApprovedAt(new Date().toISOString());

      showToast.updateSuccess(
        toastId,
        approved ? "Logbook berhasil disetujui" : "Logbook berhasil ditolak",
      );

      setTimeout(() => {
        try {
          onClose();
        } catch {}
      }, 1200);
    } catch (err: any) {
      showToast.updateError(toastId, err.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevision = async () => {
    if (!logbookId) {
      showToast.error("Logbook tidak ditemukan");
      return;
    }

    if (!mentorNote.trim()) {
      showToast.error("Catatan revisi wajib diisi");
      return;
    }

    setIsSubmitting(true);
    const toastId = showToast.loading("Mengirim permintaan revisi...");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/logbook/mentor/request-revision/${logbookId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            revisionNote: mentorNote.trim(),
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal mengirim revisi");
      }

      showToast.updateSuccess(toastId, "Revisi berhasil dikirim");

      setApprovalStatus("revisi");
      setIsFinalized(false);

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      showToast.updateError(toastId, err.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatSimpleDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("id-ID");
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div
        className="
          fixed inset-0 z-50
          flex items-center justify-center
          bg-black/40 dark:bg-black/70
          backdrop-blur-sm
        "
      >
        <div
          className="
            relative
            w-64
            rounded-3xl
            p-8
            text-center
            shadow-2xl
            bg-linear-to-br from-[#FFFDF8] via-[#FFF1E8] to-[#FEF3C7]
            border border-[#FCA5A5]/40
            dark:bg-linear-to-br dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-800
            dark:border-indigo-500/30
          "
        >
          <div
            className="
              pointer-events-none absolute inset-0 rounded-3xl
              bg-linear-to-br from-[#F59E0B] to-[#7F1D1D]
              dark:from-indigo-600 dark:to-violet-500
              opacity-20 blur-xl
            "
          />

          <div className="relative">
            <div
              className="
                animate-spin
                mx-auto
                h-14 w-14
                rounded-full
                border-4 border-transparent
                border-t-[#7F1D1D] border-r-[#F59E0B]
                dark:border-t-indigo-400 dark:border-r-violet-400
              "
            />
          </div>

          <p className="relative mt-5 text-sm font-semibold text-[#7F1D1D] dark:text-indigo-300">
            Memuat logbook...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-6">
      <div
        className="
          w-full max-w-3xl
          rounded-3xl
          bg-white dark:bg-slate-900
          shadow-2xl
          flex flex-col
          max-h-[90vh]
          overflow-hidden
        "
      >
        <div
          className="
            px-5 sm:px-6 py-4
            border-b border-slate-200 dark:border-slate-800
            bg-linear-to-r
            from-[#FCA5A5] via-[#FDE68A] to-[#FFF7ED]
            dark:from-indigo-800 dark:via-indigo-700 dark:to-indigo-900
            text-slate-900 dark:text-white
            shadow-lg
          "
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FiCalendar className="text-xl" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold leading-tight">
                  Logbook Peserta
                </h2>
                <p className="text-xs sm:text-sm opacity-90">
                  {pesertaNama} • {formatSimpleDate(date)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition"
            >
              <FiX className="text-xl" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <div
            className={`
              rounded-xl border px-5 py-4
              ${
                approvalStatus === "disetujui"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-600 dark:text-emerald-300"
                  : approvalStatus === "ditolak"
                    ? "border-red-300 bg-red-50 text-red-800 dark:bg-red-900/30 dark:border-red-600 dark:text-red-300"
                    : approvalStatus === "revisi"
                      ? "border-purple-300 bg-purple-50 text-purple-800 dark:bg-purple-900/30 dark:border-purple-600 dark:text-purple-300"
                      : "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:border-amber-600 dark:text-amber-300"
              }
            `}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">
                {approvalStatus === "disetujui" ? (
                  <FiCheck />
                ) : approvalStatus === "ditolak" ? (
                  <FiX />
                ) : approvalStatus === "revisi" ? (
                  <FiEdit />
                ) : (
                  <FiClock />
                )}
              </span>

              <div className="flex-1">
                <p className="font-semibold">
                  {approvalStatus === "disetujui"
                    ? "Logbook Disetujui"
                    : approvalStatus === "ditolak"
                      ? "Logbook Ditolak"
                      : approvalStatus === "revisi"
                        ? "Menunggu Revisi Peserta"
                        : "Menunggu Persetujuan"}
                </p>

                {approvedAt && approvalStatus !== "menunggu" && (
                  <p className="text-sm mt-1">
                    Diproses pada: {formatDate(approvedAt)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {isFinalized && (
            <div
              className="
                rounded-xl border px-4 py-3 text-sm
                bg-slate-50 text-slate-700 border-slate-300
                dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700
              "
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🔒</span>
                <div>
                  <p className="font-semibold">Logbook sudah diproses</p>
                  <p className="text-slate-600 dark:text-slate-300">
                    Status sudah final dan tidak dapat diubah kembali
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FiUserCheck className="text-slate-500 dark:text-white" />
                <label className="font-semibold text-slate-700 dark:text-white">
                  Status Kehadiran
                </label>
              </div>
              <div
                className={`
                  inline-flex items-center gap-2
                  px-4 py-2.5 rounded-xl border
                  text-sm font-semibold
                  transition
                  ${
                    status === "hadir"
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/40"
                      : status === "tidak_hadir_keterangan"
                        ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/40"
                        : "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700/40"
                  }
                `}
              >
                {status === "hadir" ? (
                  <FiUserCheck className="w-4 h-4" />
                ) : (
                  <FiUserX className="w-4 h-4" />
                )}

                <span>
                  {status === "hadir"
                    ? "Hadir"
                    : status === "tidak_hadir_keterangan"
                      ? "Tidak Hadir (Dengan Keterangan)"
                      : "Tidak Hadir (Tanpa Keterangan)"}
                </span>
              </div>
            </div>

            {status === "hadir" && (
              <>
                <FieldSection
                  icon={<FiFileText />}
                  label="Uraian Aktivitas"
                  value={judul}
                />

                <FieldSection
                  icon={<FiFileText />}
                  label="Pembelajaran"
                  value={pengalaman}
                />

                <FieldSection
                  icon={<FiFileText />}
                  label="Kendala"
                  value={kendala}
                />

                {files.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FiImage className="flex items-center gap-2" />
                      <label className="font-semibold text-slate-700 dark:text-white">
                        Dokumentasi
                      </label>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {files.map((f, i) => {
                        const imageUrl = getImageUrl(f);

                        return (
                          <div
                            key={i}
                            className="relative group cursor-pointer"
                            onClick={() => setPreviewImage(imageUrl)}
                          >
                            <img
                              src={imageUrl}
                              className="w-full h-40 object-cover rounded-lg"
                              alt={`Dokumentasi ${i + 1}`}
                              onError={(e) => {
                                e.currentTarget.src = `https://via.placeholder.com/300x200?text=Gambar+Tidak+Tersedia`;
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition rounded-lg flex items-center justify-center">
                              <FiEye className="text-white opacity-0 group-hover:opacity-100 transition text-2xl" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-sm text-slate-500">
                      Klik gambar untuk melihat ukuran penuh
                    </p>
                  </div>
                )}

                {files.length === 0 && status === "hadir" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FiImage className="text-slate-500" />
                      <label className="font-semibold text-slate-700 dark:text-white">
                        Dokumentasi
                      </label>
                    </div>
                    <div
                      className="
                        text-center py-8 rounded-xl border-2 border-dashed
                        text-slate-400 border-slate-300
                        dark:text-slate-300 dark:border-slate-700
                      "
                    >
                      <FiImage className="text-3xl mx-auto mb-2" />
                      <p>Tidak ada dokumentasi</p>
                    </div>
                  </div>
                )}

                {pdfFile && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <FiFileText className="text-slate-500" />
                      <span className="font-semibold">Dokumen PDF (Opsional)</span>
                    </div>

                    {pdfFile ? (
                      <a
                        href={getImageUrl(pdfFile)}
                        target="_blank"
                        className="
                          flex items-center gap-4
                          p-4 rounded-2xl
                          border
                          border-amber-200 dark:border-indigo-700
                          bg-amber-50 dark:bg-indigo-900/30
                          hover:shadow-md
                          transition
                          group
                        "
                      >
                        <div
                          className="
                            w-12 h-12
                            rounded-xl
                            flex items-center justify-center
                            bg-linear-to-br
                            from-amber-500 to-orange-600
                            dark:from-indigo-500 dark:to-violet-600
                            text-white
                            group-hover:scale-105
                            transition
                          "
                        >
                          <FiFileText className="text-xl" />
                        </div>

                        <div className="flex-1">
                          <p className="font-semibold text-amber-800 dark:text-indigo-200">
                            Dokumen PDF
                          </p>
                          <p className="text-xs text-amber-600 dark:text-indigo-400">
                            Klik untuk melihat file
                          </p>
                        </div>

                        <span
                          className="
                            text-xs font-semibold
                            px-3 py-1 rounded-full
                            bg-amber-200 text-amber-800
                            dark:bg-indigo-800 dark:text-indigo-200
                          "
                        >
                          📄 Lihat PDF
                        </span>
                      </a>
                    ) : (
                      <div
                        className="
                          text-center py-8 rounded-xl border-2 border-dashed
                          text-slate-400 border-slate-300
                          dark:text-slate-300 dark:border-slate-700
                        "
                      >
                        <FiFileText className="text-3xl mx-auto mb-2" />
                        <p>Tidak ada File</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {status === "tidak_hadir_keterangan" && (
              <>
                <FieldSection
                  icon={<FiFileText />}
                  label="Alasan Tidak Hadir"
                  value={keterangan}
                />

                {files.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FiImage />
                      <label className="font-semibold">Bukti Pendukung</label>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {files.map((f, i) => {
                        const imageUrl = getImageUrl(f);

                        return (
                          <div
                            key={i}
                            className="relative cursor-pointer"
                            onClick={() => setPreviewImage(imageUrl)}
                          >
                            <img
                              src={imageUrl}
                              className="w-full h-40 object-cover rounded-lg"
                              alt={`Bukti ${i + 1}`}
                              onError={(e) => {
                                e.currentTarget.src = `https://via.placeholder.com/300x200?text=Gambar+Tidak+Tersedia`;
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {files.length === 0 && (
                  <p className="text-sm text-slate-400">Tidak ada foto bukti</p>
                )}

                {pdfFile && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <FiFileText className="text-slate-500" />
                      <span className="font-semibold">Dokumen Bukti (PDF)</span>
                    </div>

                    {pdfFile ? (
                      <a
                        href={getImageUrl(pdfFile)}
                        target="_blank"
                        className="
                          flex items-center gap-4
                          p-4 rounded-2xl
                          border
                          border-amber-200 dark:border-indigo-700
                          bg-amber-50 dark:bg-indigo-900/30
                          hover:shadow-md
                          transition
                          group
                        "
                      >
                        <div
                          className="
                            w-12 h-12
                            rounded-xl
                            flex items-center justify-center
                            bg-linear-to-br
                            from-amber-500 to-orange-600
                            dark:from-indigo-500 dark:to-violet-600
                            text-white
                          "
                        >
                          <FiFileText className="text-xl" />
                        </div>

                        <div className="flex-1">
                          <p className="font-semibold text-amber-800 dark:text-indigo-200">
                            Dokumen PDF
                          </p>
                          <p className="text-xs text-amber-600 dark:text-indigo-400">
                            Klik untuk melihat file
                          </p>
                        </div>

                        <span
                          className="
                            text-xs font-semibold
                            px-3 py-1 rounded-full
                            bg-amber-200 text-amber-800
                            dark:bg-indigo-800 dark:text-indigo-200
                          "
                        >
                          📄 Lihat PDF
                        </span>
                      </a>
                    ) : (
                      <div
                        className="
                          text-center py-8 rounded-xl border-2 border-dashed
                          text-slate-400 border-slate-300
                          dark:text-slate-300 dark:border-slate-700
                        "
                      >
                        <FiFileText className="text-3xl mx-auto mb-2" />
                        <p>Tidak ada File</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-4">
            {isFinalized && mentorNote && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FiEdit className="flex items-center gap-2" />
                  <label className="font-semibold text-slate-700 dark:text-white">
                    Catatan Mentor
                  </label>
                </div>
                <div
                  className="
                    p-4 rounded-xl border
                    bg-slate-50 text-slate-700
                    dark:bg-slate-800 dark:text-slate-200
                    border-slate-200 dark:border-slate-700
                  "
                >
                  <p className="whitespace-pre-line">{mentorNote}</p>
                </div>
              </div>
            )}

            {!isFinalized && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FiEdit className="flex items-center gap-2" />
                  <label className="font-semibold text-slate-700 dark:text-white">
                    Catatan Mentor <span className="text-red-500">*</span>
                  </label>
                </div>
                <textarea
                  value={mentorNote}
                  onChange={(e) => setMentorNote(e.target.value)}
                  rows={4}
                  placeholder="Berikan catatan atau komentar untuk peserta..."
                  className="
                    w-full px-4 py-3 rounded-xl resize-none outline-none transition
                    bg-white text-slate-800
                    dark:bg-slate-900 dark:text-slate-100
                    border border-amber-400
                    dark:border-indigo-500
                    focus:border-amber-500 focus:ring-2 focus:ring-amber-200
                    dark:focus:border-indigo-400 dark:focus:ring-indigo-400/30
                  "
                />
                <p className="text-sm text-slate-500">
                  *Catatan wajib diisi sebelum menyetujui atau menolak logbook
                </p>
              </div>
            )}
          </div>
        </div>

        <div
          className="
            sticky bottom-0 z-20
            px-5 sm:px-6 py-4
            bg-white/80 dark:bg-slate-900/80
            backdrop-blur
            border-t border-amber-200/60 dark:border-indigo-700/40
          "
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-stretch sm:items-center">
            <button
              onClick={onClose}
              className="
                w-full sm:w-auto
                inline-flex items-center justify-center
                gap-2
                px-5 py-2.5
                rounded-xl
                border
                border-slate-300 dark:border-slate-700
                bg-white dark:bg-slate-800
                text-slate-600 dark:text-slate-300
                hover:bg-slate-100 dark:hover:bg-slate-700
                transition
              "
            >
              Tutup
            </button>

            {!isFinalized && (
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  onClick={() => handleApprove(false)}
                  disabled={isSubmitting || !mentorNote.trim()}
                  className={`
                    w-full sm:w-auto
                    inline-flex items-center justify-center gap-2
                    px-5 py-2.5 rounded-xl font-semibold
                    transition-all
                    ${
                      isSubmitting || !mentorNote.trim()
                        ? "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                        : `
                          bg-linear-to-r from-rose-500 to-red-600
                          hover:from-rose-600 hover:to-red-700
                          text-white shadow-md hover:shadow-xl
                        `
                    }
                  `}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <FiX />
                      Tolak
                    </>
                  )}
                </button>

                <button
                  onClick={handleRevision}
                  disabled={isSubmitting || !mentorNote.trim()}
                  className={`
                    w-full sm:w-auto
                    inline-flex items-center justify-center gap-2
                    px-5 py-2.5 rounded-xl font-semibold
                    transition-all
                    ${
                      isSubmitting || !mentorNote.trim()
                        ? "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                        : `
                          bg-amber-500 hover:bg-amber-600
                          text-white shadow-md hover:shadow-xl
                        `
                    }
                  `}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <FiEdit />
                      Revisi
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleApprove(true)}
                  disabled={isSubmitting || !mentorNote.trim()}
                  className={`
                    w-full sm:w-auto
                    inline-flex items-center justify-center gap-2
                    px-5 py-2.5 rounded-xl font-semibold
                    transition-all
                    ${
                      isSubmitting || !mentorNote.trim()
                        ? "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                        : `
                          bg-linear-to-r from-emerald-500 to-green-600
                          hover:from-emerald-600 hover:to-green-700
                          text-white shadow-md hover:shadow-xl
                        `
                    }
                  `}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <FiCheck />
                      Setujui
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-999 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition z-10"
          >
            <FiX className="text-white text-xl" />
          </button>
          <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            <img
              src={previewImage}
              className="max-h-[85vh] max-w-full rounded-lg object-contain"
              alt="Preview"
              onError={(e) => {
                e.currentTarget.src = `https://via.placeholder.com/800x600?text=Gambar+Tidak+Dapat+Dimuat`;
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function FieldSection({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <label className="font-semibold text-slate-700 dark:text-white">
          {label}
        </label>
      </div>

      <div
        className="
          w-full
          px-4 py-3
          rounded-2xl
          min-h-25
          whitespace-pre-line
          text-sm sm:text-base
          leading-relaxed sm:leading-loose
          bg-white text-slate-800
          dark:bg-slate-800 dark:text-slate-200
          border border-slate-300 dark:border-slate-700
          shadow-sm
        "
      >
        {value || <span className="text-slate-400">-</span>}
      </div>
    </div>
  );
}
