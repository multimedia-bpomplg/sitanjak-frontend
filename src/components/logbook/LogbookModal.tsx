"use client";

import { useEffect, useState } from "react";
import {
  FiUpload,
  FiCheck,
  FiX,
  FiCalendar,
  FiFileText,
  FiImage,
  FiClock,
  FiUserCheck,
  FiUserX,
  FiEdit,
} from "react-icons/fi";
import { showToast } from "@/components/ui/toastDashboard";

type Status =
  | "hadir"
  | "tidak_hadir_keterangan"
  | "tidak_hadir_tanpa_keterangan";

type Props = {
  date: string;
  mode: "create" | "view";
  onClose: () => void;
  userId?: string;
  role?: "peserta" | "mentor";
};

const MIN_TEXT_LENGTH = 50;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_FILES = 3;

export default function LogbookModal({
  date,
  mode,
  onClose,
  userId,
  role = "peserta",
}: Props) {
  const readonly = mode === "view";

  // State Management
  const [status, setStatus] = useState<Status>("hadir");
  const [judul, setJudul] = useState("");
  const [pengalaman, setPengalaman] = useState("");
  const [kendala, setKendala] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [agree, setAgree] = useState(false);
  const [errorFile, setErrorFile] = useState("");
  const [approvedByMentor, setApprovedByMentor] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [mentorNote, setMentorNote] = useState("");
  const [approvalStatus, setApprovalStatus] = useState<
    "menunggu" | "disetujui" | "ditolak"
  >("menunggu");
  const [approvedAt, setApprovedAt] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [logbookId, setLogbookId] = useState<string | null>(null);

  // Format tanggal untuk display
  const formatDate = (dateString: string) => {
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // API Endpoints
  const getEndpoint = () => {
    if (role === "mentor") {
      return `${process.env.NEXT_PUBLIC_API_URL}/logbook/mentor/peserta/${userId}/date/${date}`;
    }
    return `${process.env.NEXT_PUBLIC_API_URL}/logbook/date/${date}`;
  };

  // Fetch Data for View Mode
  useEffect(() => {
    if (mode !== "view") return;

    const fetchLogbook = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(getEndpoint(), {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (res.status === 404) {
          setIsLoading(false);
          return;
        }

        if (!res.ok) throw new Error("Gagal mengambil logbook");

        const data = await res.json();
        if (!data) {
          setIsLoading(false);
          return;
        }

        setStatus(data.status);
        setJudul(data.judul || "");
        setPengalaman(data.pengalaman || "");
        setKendala(data.kendala || "");
        setKeterangan(data.keterangan || "");
        setFileUrls(data.files || []);
        setApprovedByMentor(Boolean(data.approvedByMentor));
        setApprovalStatus(data.approvalStatus || "menunggu");
        setMentorNote(data.mentorNote || "");
        setApprovedAt(data.approvedAt || "");
        setLogbookId(data._id || null);
      } catch (error) {
        console.error(error);
        showToast.error("Gagal memuat data logbook");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogbook();
  }, [mode, date, role, userId]);

  // File Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readonly) return;

    const selectedFiles = Array.from(e.target.files || []);

    // Validasi jumlah file
    if (selectedFiles.length > MAX_FILES) {
      setErrorFile(`Maksimal ${MAX_FILES} foto`);
      return;
    }

    // Validasi tipe dan ukuran file
    for (const file of selectedFiles) {
      if (!file.type.startsWith("image/")) {
        setErrorFile("Hanya gambar yang diperbolehkan");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setErrorFile("Maksimal 2MB per foto");
        return;
      }
    }

    setErrorFile("");
    setFiles(selectedFiles);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, idx) => idx !== index));
  };

  // Validation Functions
  const isTextValid = (text: string) => text.trim().length >= MIN_TEXT_LENGTH;

  const isFilesValid =
    files.length > 0 &&
    files.length <= MAX_FILES &&
    files.every((f) => f.type.startsWith("image/") && f.size <= MAX_FILE_SIZE);

  const getSubmitDisabled = () => {
    if (readonly || !agree) return true;

    if (status === "hadir") {
      return !(
        isTextValid(judul) &&
        isTextValid(pengalaman) &&
        isTextValid(kendala) &&
        isFilesValid
      );
    }

    if (status === "tidak_hadir_keterangan") {
      return !isTextValid(keterangan);
    }

    return false;
  };

  const submitDisabled = getSubmitDisabled();

  // Submit Handler
  const handleSubmit = async () => {
    if (readonly || submitDisabled) return;

    const toastId = showToast.loading("Menyimpan logbook...");

    try {
      const formData = new FormData();
      formData.append("date", date);
      formData.append("status", status);
      formData.append("judul", judul);
      formData.append("pengalaman", pengalaman);
      formData.append("kendala", kendala);
      formData.append("keterangan", keterangan);
      files.forEach((f) => formData.append("files", f));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logbook`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Gagal menyimpan logbook");

      showToast.updateSuccess(toastId, "Logbook berhasil disimpan! ✅");
      onClose();
    } catch (err: any) {
      showToast.updateError(
        toastId,
        err.message || "Terjadi kesalahan saat menyimpan",
      );
    }
  };

  // Handle Approve/Reject
  const handleApprove = async (approved: boolean) => {
    if (!logbookId) {
      showToast.error("Logbook tidak ditemukan");
      return;
    }

    // 🔥 PERBAIKAN: Catatan wajib untuk approve ATAU reject
    if (!mentorNote.trim()) {
      showToast.error("Harap berikan catatan terlebih dahulu");
      return;
    }

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

      setApprovalStatus(approved ? "disetujui" : "ditolak");
      setApprovedByMentor(approved);

      showToast.updateSuccess(
        toastId,
        approved
          ? "Logbook berhasil disetujui! ✅"
          : "Logbook berhasil ditolak! ❌",
      );

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      showToast.updateError(toastId, err.message || "Terjadi kesalahan");
    }
  };

  // 🔥 PERBAIKAN: Fungsi untuk mendapatkan URL gambar yang benar
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

  // Status badge component
  const StatusBadge = ({ status }: { status: Status }) => {
    const config = {
      hadir: {
        icon: <FiUserCheck className="text-emerald-600" />,
        text: "Hadir",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        textColor: "text-emerald-700",
      },
      tidak_hadir_keterangan: {
        icon: <FiUserX className="text-blue-600" />,
        text: "Tidak Hadir (Keterangan)",
        bg: "bg-blue-50",
        border: "border-blue-200",
        textColor: "text-blue-700",
      },
      tidak_hadir_tanpa_keterangan: {
        icon: <FiUserX className="text-red-600" />,
        text: "Tidak Hadir (Tanpa Keterangan)",
        bg: "bg-red-50",
        border: "border-red-200",
        textColor: "text-red-700",
      },
    };

    const { icon, text, bg, border, textColor } = config[status];

    return (
      <div
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl ${bg} ${border} border`}
      >
        {icon}
        <span className={`font-semibold ${textColor}`}>{text}</span>
      </div>
    );
  };

  // Approval Status Badge
  const ApprovalBadge = () => {
    const config = {
      menunggu: {
        icon: <FiClock className="text-amber-600" />,
        text: "Menunggu Persetujuan",
        bg: "bg-amber-50",
        border: "border-amber-200",
        textColor: "text-amber-700",
      },
      disetujui: {
        icon: <FiCheck className="text-emerald-600" />,
        text: "Disetujui Mentor",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        textColor: "text-emerald-700",
      },
      ditolak: {
        icon: <FiX className="text-red-600" />,
        text: "Ditolak Mentor",
        bg: "bg-red-50",
        border: "border-red-200",
        textColor: "text-red-700",
      },
    };

    const { icon, text, bg, border, textColor } = config[approvalStatus];

    return (
      <div
        className={`flex items-center gap-3 p-4 rounded-xl ${bg} ${border} border`}
      >
        <div className="text-xl">{icon}</div>
        <div className="flex-1">
          <p className={`font-semibold ${textColor}`}>{text}</p>
          {approvedAt && approvalStatus !== "menunggu" && (
            <p className="text-sm text-slate-500 mt-1">
              Diproses: {new Date(approvedAt).toLocaleDateString("id-ID")}
            </p>
          )}
        </div>
      </div>
    );
  };

  const statusStyle = {
    hadir:
      "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    tidak_hadir_keterangan:
      "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    tidak_hadir_tanpa_keterangan:
      "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-center text-slate-600">
            Memuat data logbook...
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
        {/* Header */}
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
                  {mode === "view"
                    ? "Detail Logbook Harian"
                    : "Isi Logbook Harian"}
                </h2>
                <p className="text-xs sm:text-sm opacity-90">
                  {formatDate(date)} •{" "}
                  {mode === "view" ? "Mode Baca" : "Mode Buat"}
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

        {/* Approval Status */}
        <div className="mt-4 sm:mt-6 px-4 sm:px-6">
          <ApprovalBadge />
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Status Kehadiran */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FiUserCheck className="text-slate-500 dark:text-white" />
              <label className="font-semibold text-slate-700 dark:text-white">
                Status Kehadiran
              </label>
            </div>
            {readonly ? (
              <StatusBadge status={status} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { value: "hadir", label: "Hadir", icon: <FiUserCheck /> },
                  {
                    value: "tidak_hadir_keterangan",
                    label: "Tidak Hadir (Keterangan)",
                    icon: <FiUserX />,
                  },
                  {
                    value: "tidak_hadir_tanpa_keterangan",
                    label: "Tidak Hadir (Tanpa Keterangan)",
                    icon: <FiUserX />,
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatus(option.value as Status)}
                    className={`
                      flex items-center gap-3 p-4 rounded-xl border transition-all
                      ${
                        status === option.value
                          ? statusStyle[option.value]
                          : "border-slate-200 hover:bg-slate-50 text-slate-600 dark:text-slate-300"
                      }
                    `}
                  >
                    <div
                      className={`
                        p-2 rounded-lg
                        ${
                          status === option.value
                            ? option.value === "hadir"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : option.value === "tidak_hadir_keterangan"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300"
                        }
                      `}
                    >
                      {option.icon}
                    </div>
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Conditional Fields Based on Status */}
          {status === "hadir" ? (
            <>
              {/* Uraian Aktivitas */}
              <FieldSection
                icon={<FiFileText />}
                label="Uraian Aktivitas"
                value={judul}
                onChange={setJudul}
                readonly={readonly}
                minLength={MIN_TEXT_LENGTH}
                placeholder="Jelaskan aktivitas yang dilakukan hari ini..."
              />

              {/* Pembelajaran */}
              <FieldSection
                icon={<FiFileText />}
                label="Pembelajaran"
                value={pengalaman}
                onChange={setPengalaman}
                readonly={readonly}
                minLength={MIN_TEXT_LENGTH}
                placeholder="Apa yang Anda pelajari hari ini?"
              />

              {/* Kendala */}
              <FieldSection
                icon={<FiFileText />}
                label="Kendala"
                value={kendala}
                onChange={setKendala}
                readonly={readonly}
                minLength={MIN_TEXT_LENGTH}
                placeholder="Apakah ada kendala yang dihadapi?"
              />

              {/* File Upload/Display */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FiImage className="text-slate-500 dark:text-white" />
                  <label className="font-semibold text-slate-700 dark:text-white">
                    Dokumentasi{" "}
                    {!readonly && `(Max ${MAX_FILES} foto, 2MB/foto)`}
                  </label>
                </div>

                {!readonly ? (
                  <>
                    {files.length === 0 ? (
                      <label className="block">
                        <div
                          className="
                          border-2 border-dashed 
                          border-amber-300 bg-amber-50/60
                          rounded-xl p-8 text-center cursor-pointer 
                          hover:border-amber-400
                          hover:bg-amber-100
                          dark:bg-indigo-900/30
                          dark:border-indigo-700 
                          transition"
                        >
                          <FiUpload className="text-3xl text-slate-400 mx-auto mb-3" />
                          <p className="font-medium text-slate-700">
                            Klik untuk upload foto
                          </p>
                          <p className="text-sm text-slate-500 mt-1">
                            Drag & drop atau klik untuk memilih file
                          </p>
                        </div>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {files.map((file, i) => (
                            <div key={i} className="relative group">
                              <img
                                src={URL.createObjectURL(file)}
                                className="w-full h-40 object-cover rounded-lg"
                                alt={`Upload ${i + 1}`}
                              />
                              <button
                                type="button"
                                onClick={() => removeFile(i)}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                              >
                                <FiX className="text-sm" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition">
                          <FiUpload />
                          <span className="font-medium">
                            Tambah Foto Lainnya
                          </span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                    {errorFile && (
                      <p className="text-sm text-red-600">{errorFile}</p>
                    )}
                  </>
                ) : fileUrls.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {fileUrls.map((url, i) => {
                      const imageUrl = getImageUrl(url);
                      console.log(`Image URL ${i}:`, imageUrl); // Debug log
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
                              console.error(`Gagal memuat gambar ${i}:`, url);
                              e.currentTarget.src = `https://via.placeholder.com/300x200?text=Gambar+Tidak+Tersedia`;
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition rounded-lg" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <FiImage className="text-3xl mx-auto mb-2" />
                    <p>Tidak ada dokumentasi</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Alasan Tidak Hadir */
            <FieldSection
              icon={<FiFileText />}
              label="Alasan Tidak Hadir"
              value={keterangan}
              onChange={setKeterangan}
              readonly={readonly}
              minLength={MIN_TEXT_LENGTH}
              placeholder="Jelaskan alasan ketidakhadiran Anda..."
            />
          )}

          {/* 🔥 PERBAIKAN: Approval Status Dipindahkan ke sini (setelah gambar) */}
          {mode === "view" && (
            <div className="space-y-4">
              {/* Catatan Mentor (Tampilkan jika ada catatan) */}
              {mentorNote && approvalStatus !== "menunggu" && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 dark:bg-indigo-900/30 dark:border-indigo-700">
                  <div className="flex items-center gap-2 mb-2">
                    <FiEdit className="flex items-center gap-2" />
                    <span className="font-semibold text-slate-700 dark:text-white">
                      Catatan Mentor:
                    </span>
                  </div>
                  <p className="text-amber-800 dark:text-indigo-200 whitespace-pre-line">
                    {mentorNote}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Agreement Checkbox (Create Mode) */}
          {mode === "create" && (
            <div
              className={`
                p-4 rounded-xl border transition
                ${
                  agree
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30"
                    : "border-slate-200 bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                }
              `}
            >
              <button
                type="button"
                onClick={() => setAgree(!agree)}
                className="flex items-start gap-3 w-full text-left"
              >
                {/* CHECKBOX */}
                <div
                  className={`
                    w-6 h-6 rounded border-2
                    flex items-center justify-center shrink-0 mt-0.5
                    transition
                    ${
                      agree
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "border-slate-400 dark:border-slate-500 bg-transparent"
                    }
                  `}
                >
                  {agree && <FiCheck className="text-sm" />}
                </div>

                {/* TEXT */}
                <div>
                  <p
                    className={`
                      font-medium
                      ${agree ? "text-emerald-700 dark:text-emerald-300" : "text-slate-700 dark:text-slate-200"}
                    `}
                  >
                    Konfirmasi
                  </p>
                  <p
                    className={`
                      text-sm mt-1
                      ${agree ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}
                    `}
                  >
                    Saya menyatakan bahwa semua data yang diisi adalah benar dan
                    dapat dipertanggungjawabkan
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* 🔥 PERBAIKAN: Catatan Mentor Input untuk Mentor (hanya jika status menunggu) */}
          {role === "mentor" &&
            mode === "view" &&
            approvalStatus === "menunggu" && (
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
                  className="
                    w-full px-4 py-3
                    border rounded-xl
                    resize-y
                    max-h-[40vh]
                    transition
                    focus:border-indigo-500
                    focus:ring-2 focus:ring-indigo-200
                  "
                  placeholder="Berikan catatan atau komentar untuk peserta..."
                />
                <p className="text-sm text-slate-500">
                  *Catatan wajib diisi sebelum menyetujui atau menolak logbook
                </p>
              </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-5 border-t bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="
                w-full sm:w-auto
                px-6 py-3
                rounded-full
                font-medium
                border
                border-red-500 text-red-600
                hover:bg-red-50
                dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/30
                transition
              "
            >
              {mode === "view" ? "Tutup" : "Batalkan"}
            </button>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* Create Mode: Save Button */}
              {mode === "create" && (
                <button
                  disabled={submitDisabled}
                  onClick={handleSubmit}
                  className={`
                    w-full sm:w-auto justify-center
                    px-8 py-3
                    rounded-full
                    font-semibold
                    flex items-center gap-2
                    transition-all
                    ${
                      submitDisabled
                        ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl active:scale-[0.98]"
                    }
                  `}
                >
                  <FiCheck />
                  Simpan Logbook
                </button>
              )}

              {/* Mentor Mode: Approve/Reject Buttons */}
              {role === "mentor" &&
                mode === "view" &&
                approvalStatus === "menunggu" && (
                  <>
                    <button
                      onClick={() => handleApprove(false)}
                      disabled={!mentorNote.trim()}
                      className={`
                        w-full sm:w-auto justify-center
                        px-6 py-3 rounded-full
                        font-semibold
                        flex items-center gap-2
                        transition-all
                        ${
                          !mentorNote.trim()
                            ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700 text-white shadow-lg"
                        }
                      `}
                    >
                      <FiX />
                      Tolak
                    </button>
                    <button
                      onClick={() => handleApprove(true)}
                      disabled={!mentorNote.trim()}
                      className={`
                        w-full sm:w-auto justify-center
                        px-6 py-3 rounded-full
                        font-semibold
                        flex items-center gap-2
                        transition-all
                        ${
                          !mentorNote.trim()
                            ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                        }
                      `}
                    >
                      <FiCheck />
                      Setujui
                    </button>
                  </>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-999 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition"
          >
            <FiX className="text-white text-xl" />
          </button>
          <img
            src={previewImage}
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
            alt="Preview"
            onError={(e) => {
              console.error("Gagal memuat gambar preview:", previewImage);
              e.currentTarget.src = `https://via.placeholder.com/800x600?text=Gambar+Tidak+Dapat+Dimuat`;
            }}
          />
        </div>
      )}
    </div>
  );
}

// Field Section Component
function FieldSection({
  icon,
  label,
  value,
  onChange,
  readonly,
  minLength = MIN_TEXT_LENGTH,
  placeholder = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  readonly: boolean;
  minLength?: number;
  placeholder?: string;
}) {
  const length = value.trim().length;
  const isValid = length >= minLength;
  const isError = length > 0 && length < minLength;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <label className="font-semibold text-slate-700 dark:text-white">
          {label}
        </label>
      </div>

      {readonly ? (
        <div
          className="
            p-4 rounded-xl border min-h-25 whitespace-pre-line
            bg-white text-slate-800
            dark:bg-slate-800 dark:text-slate-200
            border-slate-200 dark:border-slate-700
          "
        >
          {value || <span className="text-slate-400">-</span>}
        </div>
      ) : (
        <>
          <textarea
            value={value}
            onChange={(e) => {
              onChange(e.target.value);

              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            rows={4}
            className={`
              w-full
              px-4 py-3
              rounded-2xl
              resize-y
              max-h-[45vh]
              text-sm sm:text-base
              leading-relaxed sm:leading-loose
              border
              transition-all
              focus:outline-none focus:ring-2
              ${
                isError
                  ? "border-red-500 focus:ring-red-300 bg-white dark:bg-slate-800"
                  : isValid
                    ? "border-emerald-500 focus:ring-emerald-300 bg-white dark:bg-slate-800"
                    : "border-slate-300 bg-white dark:bg-slate-800 focus:ring-slate-400"
              }
            `}
            placeholder={placeholder}
          />
          <div className="flex justify-between items-center text-sm mt-1">
            {isError && (
              <span className="text-red-600">Minimal {minLength} karakter</span>
            )}
            {isValid && (
              <span className="text-emerald-600 flex items-center gap-1">
                <FiCheck /> Sudah memenuhi
              </span>
            )}
            <span className="text-slate-500">
              {length}/{minLength}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
