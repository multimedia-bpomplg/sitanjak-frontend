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
  FiUpload,
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

  // 🔥 STATE BARU
  const [approvalStatus, setApprovalStatus] = useState<
    "menunggu" | "disetujui" | "ditolak"
  >("menunggu");
  const [isFinalized, setIsFinalized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvedAt, setApprovedAt] = useState<string>("");

  useEffect(() => {
    fetchLogbook();
  }, [date, pesertaId]);

  // 🔥 FUNGSI UNTUK MENDAPATKAN URL GAMBAR YANG BENAR
  const getImageUrl = (path: string) => {
    if (!path) return "";

    // Jika sudah full URL
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }

    // Jika path dimulai dengan uploads/
    if (path.startsWith("uploads/")) {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        "";
      // Hapus slash ganda jika ada
      return `${baseUrl.replace(/\/$/, "")}/${path}`;
    }

    // Jika hanya nama file, tambahkan base URL
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
        onClose();
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
      setApprovedByMentor(Boolean(data.approvedByMentor));
      setApprovalStatus(data.approvalStatus || "menunggu");
      setMentorNote(data.mentorNote || "");
      setApprovedAt(data.approvedAt || "");

      // Debug: Lihat data yang diterima
      console.log("Logbook data:", {
        files: data.files,
        fileCount: data.files?.length,
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
        apiUrl: process.env.NEXT_PUBLIC_API_URL,
      });

      // 🔥 CEK APAKAH SUDAH FINAL
      setIsFinalized(data.isFinalized || false);
    } catch (err) {
      console.error("Error fetching logbook:", err);
      showToast.error("Gagal memuat logbook");
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 FUNGSI APPROVE/DENY DENGAN VALIDASI
  const handleApprove = async (approved: boolean) => {
    if (!logbookId) {
      showToast.error("Logbook tidak ditemukan");
      return;
    }

    // 🔥 CEK JIKA SUDAH FINAL
    if (isFinalized) {
      showToast.error("Logbook sudah diproses dan tidak dapat diubah");
      return;
    }

    // 🔥 VALIDASI: HARUS ADA CATATAN (untuk approve ATAU reject)
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

      // 🔥 UPDATE STATE SETELAH BERHASIL
      setIsFinalized(true);
      setApprovalStatus(approved ? "disetujui" : "ditolak");
      setApprovedByMentor(approved);
      setApprovedAt(new Date().toISOString());

      showToast.updateSuccess(
        toastId,
        approved ? "Logbook berhasil disetujui" : "Logbook berhasil ditolak",
      );

      // Auto close setelah 2 detik
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      showToast.updateError(toastId, err.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-center text-slate-600">Memuat logbook...</p>
        </div>
      </div>
    );
  }

  // 🔥 FUNGSI UNTUK FORMAT TANGGAL
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
    } catch (error) {
      return dateString;
    }
  };

  // 🔥 FORMAT TANGGAL SEDERHANA
  const formatSimpleDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("id-ID");
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* HEADER */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FiCalendar className="text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Logbook Peserta</h2>
                <p className="text-sm opacity-90">
                  {pesertaNama} • {formatSimpleDate(date)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <FiX className="text-xl" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* 🔥 STATUS APPROVAL */}
          <div
            className={`
              rounded-xl border px-5 py-4
              ${
                approvalStatus === "disetujui"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : approvalStatus === "ditolak"
                    ? "border-red-300 bg-red-50 text-red-800"
                    : "border-amber-300 bg-amber-50 text-amber-800"
              }
            `}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">
                {approvalStatus === "disetujui" ? (
                  <FiCheck />
                ) : approvalStatus === "ditolak" ? (
                  <FiX />
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

          {/* 🔥 ALERT JIKA SUDAH FINAL */}
          {isFinalized && (
            <div className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔒</span>
                <div>
                  <p className="font-semibold">Logbook sudah diproses</p>
                  <p className="text-slate-600">
                    Status sudah final dan tidak dapat diubah kembali
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* KONTEN LOGBOOK */}
          <div className="space-y-6">
            {/* Status Kehadiran */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FiUserCheck className="text-slate-500" />
                <label className="font-semibold text-slate-700">
                  Status Kehadiran
                </label>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-slate-50">
                <span>
                  {status === "hadir" ? (
                    <FiUserCheck className="text-emerald-600" />
                  ) : (
                    <FiUserX className="text-red-600" />
                  )}
                </span>
                <span className="font-semibold">
                  {status === "hadir"
                    ? "✅ Hadir"
                    : status === "tidak_hadir_keterangan"
                      ? "ℹ Tidak Hadir (Dengan Keterangan)"
                      : "❌ Tidak Hadir (Tanpa Keterangan)"}
                </span>
              </div>
            </div>

            {status === "hadir" && (
              <>
                {/* Uraian Aktivitas */}
                <FieldSection
                  icon={<FiFileText />}
                  label="Uraian Aktivitas"
                  value={judul}
                />

                {/* Pembelajaran */}
                <FieldSection
                  icon={<FiFileText />}
                  label="Pembelajaran"
                  value={pengalaman}
                />

                {/* Kendala */}
                <FieldSection
                  icon={<FiFileText />}
                  label="Kendala"
                  value={kendala}
                />

                {/* 🔥 PERBAIKAN: DOKUMENTASI GAMBAR */}
                {files.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FiImage className="text-slate-500" />
                      <label className="font-semibold text-slate-700">
                        Dokumentasi
                      </label>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {files.map((f, i) => {
                        const imageUrl = getImageUrl(f);
                        console.log(`Image ${i}:`, {
                          original: f,
                          url: imageUrl,
                        });

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
                                console.error(`Gagal memuat gambar ${i}:`, f);
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

                {/* Jika tidak ada gambar */}
                {files.length === 0 && status === "hadir" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FiImage className="text-slate-500" />
                      <label className="font-semibold text-slate-700">
                        Dokumentasi
                      </label>
                    </div>
                    <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-300 rounded-xl">
                      <FiImage className="text-3xl mx-auto mb-2" />
                      <p>Tidak ada dokumentasi</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {status === "tidak_hadir_keterangan" && (
              <FieldSection
                icon={<FiFileText />}
                label="Alasan Tidak Hadir"
                value={keterangan}
              />
            )}
          </div>

          {/* 🔥 CATATAN MENTOR SECTION */}
          <div className="space-y-4">
            {/* Jika sudah final, tampilkan catatan sebagai read-only */}
            {isFinalized && mentorNote && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FiEdit className="text-slate-500" />
                  <label className="font-semibold text-slate-700">
                    Catatan Mentor
                  </label>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-slate-700 whitespace-pre-line">
                    {mentorNote}
                  </p>
                </div>
              </div>
            )}

            {/* Jika belum final, tampilkan textarea untuk input */}
            {!isFinalized && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FiEdit className="text-slate-500" />
                  <label className="font-semibold text-slate-700">
                    Catatan Mentor <span className="text-red-500">*</span>
                  </label>
                </div>
                <textarea
                  value={mentorNote}
                  onChange={(e) => setMentorNote(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition resize-none"
                  placeholder="Berikan catatan atau komentar untuk peserta..."
                />
                <p className="text-sm text-slate-500">
                  *Catatan wajib diisi sebelum menyetujui atau menolak logbook
                </p>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-5 border-t border-slate-200 bg-slate-50">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
            <button
              onClick={onClose}
              className="px-6 py-3 font-medium text-slate-600 hover:text-slate-800 transition"
            >
              Tutup
            </button>

            {/* 🔥 TOMBOL ACTION - HANYA TAMPIL JIKA BELUM FINAL */}
            {!isFinalized && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(false)}
                  disabled={isSubmitting || !mentorNote.trim()}
                  className={`
                    px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2
                    ${
                      isSubmitting || !mentorNote.trim()
                        ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl"
                    }
                  `}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Memproses...</span>
                    </div>
                  ) : (
                    <>
                      <FiX />
                      Tolak
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleApprove(true)}
                  disabled={isSubmitting || !mentorNote.trim()}
                  className={`
                    px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2
                    ${
                      isSubmitting || !mentorNote.trim()
                        ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl"
                    }
                  `}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Memproses...</span>
                    </div>
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

      {/* 🔥 PERBAIKAN: IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center p-4"
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
                console.error("Gagal memuat gambar preview:", previewImage);
                e.currentTarget.src = `https://via.placeholder.com/800x600?text=Gambar+Tidak+Dapat+Dimuat`;
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// 🔥 FIELD SECTION COMPONENT UNTUK READ-ONLY
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
        <label className="font-semibold text-slate-700">{label}</label>
      </div>
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 min-h-[100px] whitespace-pre-line">
        {value || <span className="text-slate-400">-</span>}
      </div>
    </div>
  );
}
