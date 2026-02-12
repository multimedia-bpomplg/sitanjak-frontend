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
  FiRefreshCw,
} from "react-icons/fi";
import { showToast } from "@/components/ui/toastDashboard";

type Status =
  | "hadir"
  | "tidak_hadir_keterangan"
  | "tidak_hadir_tanpa_keterangan";

type Props = {
  date: string;
  mode: "create" | "view" | "edit";
  onClose: () => void;
  userId?: string;
  role?: "peserta" | "mentor";
  logbookId?: string;
};

const MIN_TEXT_LENGTH = 50;
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MAX_FILES = 3;

export default function LogbookModal({
  date,
  mode,
  onClose,
  userId,
  role = "peserta",
  logbookId,
}: Props) {
  const [status, setStatus] = useState<Status>("hadir");
  const [judul, setJudul] = useState("");
  const [pengalaman, setPengalaman] = useState("");
  const [kendala, setKendala] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [keterangan, setKeterangan] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [agree, setAgree] = useState(false);
  const [errorFile, setErrorFile] = useState("");
  const [approvedByMentor, setApprovedByMentor] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [mentorNote, setMentorNote] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const [approvalStatus, setApprovalStatus] = useState<
    "menunggu" | "disetujui" | "ditolak" | "revisi"
  >("menunggu");
  const [approvedAt, setApprovedAt] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [logbookIdState, setLogbookIdState] = useState<string | null>(
    logbookId || null,
  );
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionRequestedAt, setRevisionRequestedAt] = useState<string>("");

  const readonly = mode === "view" && approvalStatus !== "revisi";
  const isEditMode = mode === "edit";
  const lockStatus = approvalStatus === "revisi" && isEditMode;
  const canEdit =
    mode === "create" || mode === "edit" || approvalStatus === "revisi";

  const formatDate = (dateString: string) => {
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getEndpoint = () => {
    if (role === "mentor") {
      return `${process.env.NEXT_PUBLIC_API_URL}/logbook/mentor/peserta/${userId}/date/${date}`;
    }
    return `${process.env.NEXT_PUBLIC_API_URL}/logbook/date/${date}`;
  };

  const getLogbookDetailEndpoint = () => {
    if (logbookIdState) {
      return `${process.env.NEXT_PUBLIC_API_URL}/logbook/${logbookIdState}/detail`;
    }
    return null;
  };

  useEffect(() => {
    if (mode !== "view" && mode !== "edit") return;

    const fetchLogbook = async () => {
      setIsLoading(true);
      try {
        let endpoint;

        if (mode === "edit" && logbookIdState) {
          endpoint = getLogbookDetailEndpoint();
          if (!endpoint) {
            showToast.error("ID logbook tidak valid");
            return;
          }
        } else {
          endpoint = getEndpoint();
        }

        const res = await fetch(endpoint!, {
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
        setFileUrls(
          Array.isArray(data.files)
            ? data.files.filter((f: any) => typeof f === "string")
            : [],
        );

        setPdfUrl(typeof data.pdfFile === "string" ? data.pdfFile : null);
        setApprovedByMentor(Boolean(data.approvedByMentor));
        setApprovalStatus(
          (data.approvalStatus as
            | "menunggu"
            | "disetujui"
            | "ditolak"
            | "revisi") || "menunggu",
        );
        setMentorNote(data.mentorNote || "");
        setRevisionNote(data.revisionNote || "");
        setApprovedAt(data.approvedAt || "");
        setRevisionRequestedAt(data.revisionRequestedAt || "");
        setLogbookIdState(data._id || null);
      } catch (error) {
        showToast.error("Gagal memuat data logbook");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogbook();
  }, [mode, date, role, userId, logbookIdState]);

  const handleRequestRevision = async () => {
    if (!revisionNote.trim()) {
      showToast.error("Harap berikan catatan revisi");
      return;
    }

    if (!logbookIdState) {
      showToast.error("Logbook tidak ditemukan");
      return;
    }

    const toastId = showToast.loading("Mengirim permintaan revisi...");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/logbook/${logbookIdState}/request-revision`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            revisionNote: revisionNote.trim(),
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal meminta revisi");
      }

      showToast.updateSuccess(
        toastId,
        "Permintaan revisi berhasil dikirim ke peserta",
      );

      setShowRevisionModal(false);
      setApprovalStatus("revisi");
      setRevisionRequestedAt(new Date().toISOString());

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      showToast.updateError(toastId, err.message || "Terjadi kesalahan");
    }
  };

  const handleUpdateLogbook = async () => {
    if (!logbookIdState) {
      showToast.error("Logbook ID tidak ditemukan");
      return;
    }

    if (pendingSubmit) {
      return;
    }

    try {
      setPendingSubmit(true);

      const formData = new FormData();

      formData.append("status", status);
      formData.append("judul", judul);
      formData.append("pengalaman", pengalaman);
      formData.append("kendala", kendala);
      formData.append("keterangan", keterangan);

      files.forEach((f) => {
        formData.append("files", f);
      });

      if (pdfFile) {
        formData.append("pdfFile", pdfFile);
      }

      const url = `${process.env.NEXT_PUBLIC_API_URL}/logbook/${logbookIdState}/submit-revision`;

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal submit revisi");
      }

      showToast.success("Revisi berhasil dikirim ke mentor");

      onClose();
    } catch (err: any) {
      showToast.error(err.message || "Terjadi kesalahan");
    } finally {
      setPendingSubmit(false);
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      showToast.error("File harus PDF");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast.error("Maksimal PDF 5MB");
      return;
    }

    setPdfFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readonly && !isEditMode) return;

    const selectedFiles = Array.from(e.target.files || []);

    if (selectedFiles.length > MAX_FILES) {
      setErrorFile(`Maksimal ${MAX_FILES} foto`);
      return;
    }

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

  const isTextValid = (text: string) => text.trim().length >= MIN_TEXT_LENGTH;

  const isFilesValid =
    files.length <= MAX_FILES &&
    files.every((f) => f.type.startsWith("image/") && f.size <= MAX_FILE_SIZE);

  const getSubmitDisabled = () => {
    if ((readonly && !isEditMode) || (mode === "create" && !agree)) return true;

    if (status === "hadir") {
      return (
        !isTextValid(judul) || !isTextValid(pengalaman) || !isTextValid(kendala)
      );
    }

    if (status === "tidak_hadir_keterangan") {
      return !isTextValid(keterangan);
    }

    return false;
  };

  const submitDisabled = getSubmitDisabled();

  const handleSubmit = () => {
    if (readonly || submitDisabled) return;
    setShowConfirm(true);
  };

  const submitConfirmed = async () => {
    if (pendingSubmit) return;

    setPendingSubmit(true);
    setShowConfirm(false);

    const toastId = showToast.loading("Mengirim logbook...");

    try {
      const formData = new FormData();
      formData.append("date", date);
      formData.append("status", status);
      formData.append("judul", judul);
      formData.append("pengalaman", pengalaman);
      formData.append("kendala", kendala);
      formData.append("keterangan", keterangan);

      files.forEach((f) => {
        formData.append("files", f);
      });

      if (pdfFile) {
        formData.append("pdfFile", pdfFile);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logbook`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Gagal menyimpan logbook");

      showToast.updateSuccess(toastId, "Logbook berhasil dikirim! ✅");
      onClose();
    } catch (err: any) {
      showToast.updateError(
        toastId,
        err.message || "Terjadi kesalahan saat menyimpan",
      );
    }

    setPendingSubmit(false);
  };

  const handleApprove = async (approved: boolean) => {
    if (!logbookIdState) {
      showToast.error("Logbook tidak ditemukan");
      return;
    }

    if (!mentorNote.trim()) {
      showToast.error("Harap berikan catatan terlebih dahulu");
      return;
    }

    const toastId = showToast.loading("Memproses logbook...");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/logbook/mentor/approve/${logbookIdState}`,
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

  const getImageUrl = (path: any) => {
    if (!path || typeof path !== "string") return "";

    if (path.startsWith("http")) return path;

    const base =
      process.env.NEXT_PUBLIC_API_URL || window.location.origin + "/api";

    const cleanPath = path.replace(/^uploads\//, "");

    return `${base.replace(/\/$/, "")}/uploads/${cleanPath}`;
  };

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

  const ApprovalBadge = () => {
    const config = {
      menunggu: {
        icon: <FiClock className="text-amber-600" />,
        text: "Menunggu Persetujuan",
        bg: "bg-amber-50",
        border: "border-amber-200",
        textColor: "text-amber-700",
      },
      revisi: {
        icon: <FiRefreshCw className="text-purple-600" />,
        text: "Perlu Revisi",
        bg: "bg-purple-50",
        border: "border-purple-200",
        textColor: "text-purple-700",
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

    const { icon, text, bg, border, textColor } =
      config[approvalStatus] || config.menunggu;

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
          {revisionRequestedAt && approvalStatus === "revisi" && (
            <p className="text-sm text-purple-500 mt-1">
              Diminta revisi:{" "}
              {new Date(revisionRequestedAt).toLocaleDateString("id-ID")}
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

  const renderActionButtons = () => {
    if (mode === "create") {
      return (
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
      );
    }

    if (mode === "edit" || approvalStatus === "revisi") {
      return (
        <button
          disabled={submitDisabled}
          onClick={handleUpdateLogbook}
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
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl active:scale-[0.98]"
            }
          `}
        >
          <FiRefreshCw />
          Kirim Revisi
        </button>
      );
    }

    if (role === "mentor" && mode === "view") {
      if (approvalStatus === "menunggu") {
        return (
          <>
            <button
              onClick={() => setShowRevisionModal(true)}
              className={`
                w-full sm:w-auto justify-center
                px-6 py-3 rounded-full
                font-semibold
                flex items-center gap-2
                transition-all
                ${
                  !mentorNote.trim()
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                }
              `}
              disabled={!mentorNote.trim()}
            >
              <FiRefreshCw />
              Minta Revisi
            </button>

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
        );
      } else if (approvalStatus === "revisi") {
        return (
          <div className="text-center py-2 w-full">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full">
              <FiRefreshCw className="animate-spin" />
              <span className="font-semibold">Menunggu Revisi Peserta</span>
            </div>
          </div>
        );
      }
    }

    return null;
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
                    : mode === "edit"
                      ? "Edit Logbook Harian"
                      : "Isi Logbook Harian"}
                </h2>
                <p className="text-xs sm:text-sm opacity-90">
                  {formatDate(date)} •{" "}
                  {mode === "view"
                    ? "Mode Baca"
                    : mode === "edit"
                      ? "Mode Edit"
                      : "Mode Buat"}
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

        <div className="mt-4 sm:mt-6 px-4 sm:px-6">
          <ApprovalBadge />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FiUserCheck className="text-slate-500 dark:text-white" />
              <label className="font-semibold text-slate-700 dark:text-white">
                Status Kehadiran
              </label>
            </div>
            {readonly || approvalStatus === "revisi" ? (
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
                    onClick={() => {
                      if (lockStatus) return;
                      setStatus(option.value as Status);
                    }}
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

          {status === "hadir" ? (
            <>
              <FieldSection
                icon={<FiFileText />}
                label="Uraian Aktivitas"
                value={judul}
                onChange={setJudul}
                readonly={readonly}
                editable={canEdit}
                minLength={MIN_TEXT_LENGTH}
                placeholder="Jelaskan aktivitas yang dilakukan hari ini..."
              />

              <FieldSection
                icon={<FiFileText />}
                label="Pembelajaran"
                value={pengalaman}
                onChange={setPengalaman}
                readonly={readonly}
                editable={canEdit}
                minLength={MIN_TEXT_LENGTH}
                placeholder="Apa yang Anda pelajari hari ini?"
              />

              <FieldSection
                icon={<FiFileText />}
                label="Kendala"
                value={kendala}
                onChange={setKendala}
                readonly={readonly}
                editable={canEdit}
                minLength={MIN_TEXT_LENGTH}
                placeholder="Apakah ada kendala yang dihadapi?"
              />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FiImage className="text-slate-500 dark:text-white" />
                  <label className="font-semibold text-slate-700 dark:text-white">
                    Dokumentasi{" "}
                    {!readonly &&
                      `- Max ${MAX_FILES} foto, 2MB/foto (Opsional)`}
                  </label>
                </div>

                {!readonly ? (
                  <>
                    {files.length === 0 && fileUrls.length === 0 ? (
                      <label className="block">
                        <div
                          className="
                            border-2 border-dashed
                            border-[#F59E0B]
                            bg-linear-to-br
                            from-[#FFF7ED] via-[#FEF3C7] to-[#FFF1F2]
                            dark:from-indigo-900/40
                            dark:via-indigo-800/40
                            dark:to-indigo-900/60
                            rounded-2xl
                            p-6 sm:p-8
                            text-center
                            cursor-pointer
                            transition-all
                            hover:scale-[1.01]
                            hover:shadow-md
                            dark:border-indigo-600
                          "
                        >
                          <div
                            className="
                              mx-auto mb-3
                              w-14 h-14
                              rounded-xl
                              flex items-center justify-center
                              bg-linear-to-br
                              from-[#F59E0B] to-[#B91C1C]
                              dark:from-indigo-500
                              dark:to-violet-500
                              text-white
                              shadow
                            "
                          >
                            <FiUpload className="text-2xl" />
                          </div>
                          <p className="font-semibold text-slate-800 dark:text-white">
                            Klik untuk upload foto
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
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
                          {fileUrls.map((url, i) => {
                            const imageUrl = getImageUrl(url);
                            return (
                              <div key={`existing-${i}`} className="relative">
                                <img
                                  src={imageUrl}
                                  className="w-full h-40 object-cover rounded-lg"
                                  alt={`Existing ${i + 1}`}
                                />
                                {!readonly && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newUrls = [...fileUrls];
                                      newUrls.splice(i, 1);
                                      setFileUrls(newUrls);
                                    }}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-80 hover:opacity-100 transition"
                                  >
                                    <FiX className="text-sm" />
                                  </button>
                                )}
                              </div>
                            );
                          })}

                          {files.map((file, i) => (
                            <div key={`new-${i}`} className="relative group">
                              <img
                                src={URL.createObjectURL(file)}
                                className="w-full h-40 object-cover rounded-lg"
                                alt={`New ${i + 1}`}
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
                        <label
                          className="
                            inline-flex items-center justify-center
                            gap-2 px-4 py-2.5
                            rounded-xl
                            text-sm font-semibold
                            cursor-pointer
                            bg-linear-to-r
                            from-[#F59E0B] to-[#B91C1C]
                            dark:from-indigo-600 dark:to-violet-500
                            text-white
                            shadow hover:shadow-lg
                            transition
                          "
                        >
                          <FiUpload />
                          Tambah Foto Lainnya
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

              <div className="space-y-3 mt-4">
                <div className="flex items-center gap-2">
                  <FiFileText className="text-slate-500" />
                  <label className="font-semibold">
                    Dokumen PDF (Opsional)
                  </label>
                </div>

                {!readonly ? (
                  <label className="block cursor-pointer">
                    {!pdfFile && !pdfUrl ? (
                      <div
                        className="
                          border-2 border-dashed
                          border-[#B91C1C]
                          dark:border-indigo-600
                          rounded-2xl
                          p-6
                          text-center
                          transition-all
                          bg-linear-to-br
                          from-[#FFF7ED] via-[#FFF1F2] to-white
                          dark:from-indigo-950
                          dark:via-indigo-900
                          dark:to-indigo-950
                          hover:shadow-md
                        "
                      >
                        <div
                          className="
                            mx-auto mb-3
                            w-12 h-12
                            rounded-xl
                            flex items-center justify-center
                            bg-linear-to-br
                            from-[#F97316] to-[#7F1D1D]
                            dark:from-indigo-500
                            dark:to-violet-500
                            text-white
                          "
                        >
                          <FiUpload className="text-xl" />
                        </div>

                        <p className="text-sm font-semibold text-slate-800 dark:text-indigo-100">
                          Upload PDF laporan
                        </p>
                      </div>
                    ) : (
                      <div
                        className="
                          border
                          border-emerald-300
                          dark:border-emerald-600
                          rounded-2xl
                          p-4
                          flex items-center gap-4
                          bg-emerald-50
                          dark:bg-emerald-900/20
                          transition
                        "
                      >
                        <div
                          className="
                            w-12 h-12
                            rounded-xl
                            flex items-center justify-center
                            bg-emerald-500
                            text-white
                          "
                        >
                          <FiFileText className="text-xl" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 truncate">
                            {pdfFile ? pdfFile.name : "File PDF Terlampir"}
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">
                            {pdfFile ? "PDF siap diunggah" : "PDF sudah ada"}
                          </p>
                        </div>

                        <span
                          className="
                            text-xs font-semibold
                            px-3 py-1 rounded-full
                            bg-emerald-200 text-emerald-800
                            dark:bg-emerald-800 dark:text-emerald-200
                          "
                        >
                          {pdfFile ? "Baru" : "Ada"}
                        </span>
                      </div>
                    )}

                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handlePdfChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  pdfUrl && (
                    <a
                      href={getImageUrl(pdfUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
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
                  )
                )}
              </div>

              {approvalStatus === "revisi" && revisionNote && (
                <div className="mx-6 mb-4 p-4 rounded-xl bg-purple-50 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FiRefreshCw className="text-purple-600" />
                    <span className="font-semibold text-purple-700">
                      Catatan Revisi dari Mentor:
                    </span>
                  </div>
                  <p className="text-purple-800 whitespace-pre-line">
                    {revisionNote}
                  </p>
                </div>
              )}
            </>
          ) : status === "tidak_hadir_keterangan" ? (
            <>
              <FieldSection
                icon={<FiFileText />}
                label="Alasan Tidak Hadir"
                value={keterangan}
                onChange={setKeterangan}
                readonly={readonly}
                editable={canEdit}
                minLength={MIN_TEXT_LENGTH}
                placeholder="Jelaskan alasan ketidakhadiran Anda..."
              />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FiImage className="text-slate-500 dark:text-white" />
                  <label className="font-semibold text-slate-700 dark:text-white">
                    Bukti Pendukung{" "}
                    {!readonly &&
                      `- Max ${MAX_FILES} foto, 2MB/foto (Opsional)`}
                  </label>
                </div>

                {!readonly ? (
                  <>
                    {files.length === 0 && fileUrls.length === 0 ? (
                      <label className="block">
                        <div
                          className="
                            border-2 border-dashed
                            border-[#F59E0B]
                            bg-linear-to-br
                            from-[#FFF7ED] via-[#FEF3C7] to-[#FFF1F2]
                            dark:from-indigo-900/40
                            dark:via-indigo-800/40
                            dark:to-indigo-900/60
                            rounded-2xl
                            p-6 sm:p-8
                            text-center
                            cursor-pointer
                            transition-all
                            hover:scale-[1.01]
                            hover:shadow-md
                            dark:border-indigo-600
                          "
                        >
                          <div
                            className="
                              mx-auto mb-3
                              w-14 h-14
                              rounded-xl
                              flex items-center justify-center
                              bg-linear-to-br
                              from-[#F59E0B] to-[#B91C1C]
                              dark:from-indigo-500
                              dark:to-violet-500
                              text-white
                              shadow
                            "
                          >
                            <FiUpload className="text-2xl" />
                          </div>

                          <p className="font-semibold text-slate-700 dark:text-white">
                            Klik untuk upload foto bukti
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Upload foto bukti seperti surat dokter, dll
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
                          {fileUrls.map((url, i) => (
                            <div key={`existing-${i}`} className="relative">
                              <img
                                src={getImageUrl(url)}
                                className="w-full h-40 object-cover rounded-lg"
                                alt={`Existing ${i + 1}`}
                              />
                              {!readonly && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newUrls = [...fileUrls];
                                    newUrls.splice(i, 1);
                                    setFileUrls(newUrls);
                                  }}
                                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-80 hover:opacity-100 transition"
                                >
                                  <FiX className="text-sm" />
                                </button>
                              )}
                            </div>
                          ))}

                          {files.map((file, i) => (
                            <div key={`new-${i}`} className="relative group">
                              <img
                                src={URL.createObjectURL(file)}
                                className="w-full h-40 object-cover rounded-lg"
                                alt={`New ${i + 1}`}
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
                        <label
                          className="
                            inline-flex items-center justify-center
                            gap-2 px-4 py-2.5
                            rounded-xl
                            text-sm font-semibold
                            cursor-pointer
                            bg-linear-to-r
                            from-[#F59E0B] to-[#B91C1C]
                            dark:from-indigo-600 dark:to-violet-500
                            text-white
                            shadow hover:shadow-lg
                            transition
                          "
                        >
                          <FiUpload />
                          Tambah Foto Lainnya
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
                      return (
                        <div
                          key={i}
                          className="relative group cursor-pointer"
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
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition rounded-lg" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <FiImage className="text-3xl mx-auto mb-2" />
                    <p>Tidak ada bukti pendukung</p>
                  </div>
                )}
              </div>

              <div className="space-y-3 mt-4">
                <div className="flex items-center gap-2">
                  <FiFileText className="text-slate-500" />
                  <label className="font-semibold">
                    Dokumen PDF Bukti (Opsional)
                  </label>
                </div>

                {!readonly ? (
                  <label className="block cursor-pointer">
                    {!pdfFile && !pdfUrl ? (
                      <div
                        className="
                          border-2 border-dashed
                          border-[#B91C1C]
                          dark:border-indigo-600
                          rounded-2xl
                          p-6
                          text-center
                          transition-all
                          bg-linear-to-br
                          from-[#FFF7ED] via-[#FFF1F2] to-white
                          dark:from-indigo-950
                          dark:via-indigo-900
                          dark:to-indigo-950
                          hover:shadow-md
                        "
                      >
                        <div
                          className="
                            mx-auto mb-3
                            w-12 h-12
                            rounded-xl
                            flex items-center justify-center
                            bg-linear-to-br
                            from-[#F97316] to-[#7F1D1D]
                            dark:from-indigo-500
                            dark:to-violet-500
                            text-white
                          "
                        >
                          <FiUpload className="text-xl" />
                        </div>

                        <p className="text-sm font-semibold text-slate-800 dark:text-indigo-100">
                          Upload PDF bukti
                        </p>
                        <p className="text-xs text-slate-500 dark:text-indigo-300 mt-1">
                          Contoh: surat dokter, surat izin, dll
                        </p>
                      </div>
                    ) : (
                      <div
                        className="
                          border
                          border-emerald-300
                          dark:border-emerald-600
                          rounded-2xl
                          p-4
                          flex items-center gap-4
                          bg-emerald-50
                          dark:bg-emerald-900/20
                          transition
                        "
                      >
                        <div
                          className="
                            w-12 h-12
                            rounded-xl
                            flex items-center justify-center
                            bg-emerald-500
                            text-white
                          "
                        >
                          <FiFileText className="text-xl" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 truncate">
                            {pdfFile ? pdfFile.name : "File PDF Bukti"}
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">
                            {pdfFile ? "PDF siap diunggah" : "PDF sudah ada"}
                          </p>
                        </div>

                        <span
                          className="
                            text-xs font-semibold
                            px-3 py-1 rounded-full
                            bg-emerald-200 text-emerald-800
                            dark:bg-emerald-800 dark:text-emerald-200
                          "
                        >
                          {pdfFile ? "Baru" : "Ada"}
                        </span>
                      </div>
                    )}

                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handlePdfChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  pdfUrl && (
                    <a
                      href={getImageUrl(pdfUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
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
                  )
                )}
              </div>
            </>
          ) : (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 dark:bg-red-900/30 dark:border-red-700">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <FiX className="text-lg" />
                <span className="font-semibold">
                  Tidak Hadir Tanpa Keterangan
                </span>
              </div>
              <p className="text-red-600 dark:text-red-400 mt-2">
                Status ini tidak memerlukan keterangan atau bukti pendukung.
              </p>
            </div>
          )}

          {mode === "view" && mentorNote && approvalStatus !== "menunggu" && (
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

                <div>
                  <p
                    className={`
                      font-medium
                      ${
                        agree
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-slate-700 dark:text-slate-200"
                      }
                    `}
                  >
                    Konfirmasi
                  </p>
                  <p
                    className={`
                      text-sm mt-1
                      ${
                        agree
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-500 dark:text-slate-400"
                      }
                    `}
                  >
                    Saya menyatakan bahwa semua data yang diisi adalah benar dan
                    dapat dipertanggungjawabkan
                  </p>
                </div>
              </button>
            </div>
          )}

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
              {renderActionButtons()}
            </div>
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
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition"
          >
            <FiX className="text-white text-xl" />
          </button>
          <img
            src={previewImage}
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
            alt="Preview"
            onError={(e) => {
              e.currentTarget.src = `https://via.placeholder.com/800x600?text=Gambar+Tidak+Dapat+Dimuat`;
            }}
          />
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          />

          <div
            className="
              relative
              w-full max-w-sm sm:max-w-md
              rounded-3xl
              bg-white dark:bg-slate-900
              shadow-2xl
              p-6 sm:p-8
              text-center
              animate-scaleIn
            "
          >
            <div
              className="
                mx-auto mb-4
                w-20 h-20
                rounded-full
                flex items-center justify-center
                shadow-lg
                bg-linear-to-br
                from-[#F59E0B] to-[#B91C1C]
                dark:from-indigo-500 dark:to-violet-600
                text-white
              "
            >
              <FiCheck className="text-3xl" />
            </div>

            <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mb-2">
              Kirim Logbook Sekarang?
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              Pastikan semua aktivitas sudah diisi dengan benar.
              <br />
              <span className="text-slate-500 dark:text-slate-400">
                Logbook yang sudah dikirim tidak dapat diubah.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="
                  w-full
                  px-4 py-3
                  rounded-xl
                  border
                  border-slate-300
                  text-slate-700
                  font-medium
                  bg-white
                  hover:bg-slate-100
                  dark:bg-slate-800
                  dark:border-slate-600
                  dark:text-slate-200
                  dark:hover:bg-slate-700
                  transition
                "
              >
                Periksa Lagi
              </button>

              <button
                onClick={submitConfirmed}
                className="
                  w-full
                  px-4 py-3
                  rounded-xl
                  font-semibold
                  text-white
                  shadow-lg
                  transition-all
                  bg-linear-to-r
                  from-[#F59E0B] via-[#F97316] to-[#7F1D1D]
                  hover:brightness-110
                  dark:from-indigo-600
                  dark:via-indigo-500
                  dark:to-violet-600
                "
              >
                Ya, Kirim Logbook
              </button>
            </div>
          </div>
        </div>
      )}

      {showRevisionModal && (
        <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 shadow-2xl p-8">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
                <FiRefreshCw className="text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                Minta Revisi Logbook
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Berikan catatan revisi untuk peserta
              </p>
            </div>

            <div className="space-y-4">
              <textarea
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 resize-none outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Jelaskan bagian mana yang perlu direvisi dan bagaimana perbaikannya..."
              />

              <p className="text-sm text-slate-500">
                Catatan ini akan dikirim ke peserta untuk perbaikan logbook
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRevisionModal(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                onClick={handleRequestRevision}
                disabled={!revisionNote.trim()}
                className={`
                  flex-1 px-4 py-3 rounded-xl font-semibold text-white transition
                  ${
                    !revisionNote.trim()
                      ? "bg-slate-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }
                `}
              >
                Kirim Permintaan Revisi
              </button>
            </div>
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
  onChange,
  editable,
  readonly,
  minLength = MIN_TEXT_LENGTH,
  placeholder = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  editable: boolean;
  readonly?: boolean;
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

      {!editable ? (
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
