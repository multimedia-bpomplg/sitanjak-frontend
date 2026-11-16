"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  UserCheck,
  UserX,
  FileText,
  ImagePlus,
  UploadCloud,
  Check,
  X,
  AlertCircle,
  Send,
  RefreshCw,
  ShieldAlert,
  Paperclip,
} from "lucide-react";
import { showToast } from "@/components/ui/toastDashboard";

type AttendanceStatus =
  | "hadir"
  | "tidak_hadir_keterangan"
  | "tidak_hadir_tanpa_keterangan";

export type InlineLogbookInitialData = {
  _id: string;
  status: AttendanceStatus;
  judul?: string;
  pengalaman?: string;
  kendala?: string;
  keterangan?: string;
  files?: string[];
  pdfFile?: string;
  revisionNote?: string;
};

type Props = {
  date: string;
  mode?: "create" | "edit";
  initialData?: InlineLogbookInitialData | null;
  formattedDateLabel: string;
  onSuccess: () => void;
  onCancel?: () => void;
};

const MIN_TEXT_LENGTH = 50;
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MAX_FILES = 3;
const MAX_PDF_SIZE = 5 * 1024 * 1024;

function getAssetUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const cleanBase = baseUrl.replace(/\/api$/, "");
  const cleanUrl = url.startsWith("/") ? url : `/${url}`;
  return `${cleanBase}${cleanUrl}`;
}

export default function InlineLogbookForm({
  date,
  mode = "create",
  initialData,
  formattedDateLabel,
  onSuccess,
  onCancel,
}: Props) {
  const isEdit = mode === "edit";

  const [status, setStatus] = useState<AttendanceStatus>(
    initialData?.status || "hadir",
  );
  const [judul, setJudul] = useState(initialData?.judul || "");
  const [pengalaman, setPengalaman] = useState(initialData?.pengalaman || "");
  const [kendala, setKendala] = useState(initialData?.kendala || "");
  const [keterangan, setKeterangan] = useState(initialData?.keterangan || "");
  const [files, setFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<string[]>(
    Array.isArray(initialData?.files) ? initialData.files : [],
  );
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [existingPdf] = useState<string | undefined>(initialData?.pdfFile);
  const [agree, setAgree] = useState(false);
  const [errorFile, setErrorFile] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  // Sync if initialData changes (e.g. entering edit mode)
  useEffect(() => {
    if (isEdit && initialData) {
      setStatus(initialData.status || "hadir");
      setJudul(initialData.judul || "");
      setPengalaman(initialData.pengalaman || "");
      setKendala(initialData.kendala || "");
      setKeterangan(initialData.keterangan || "");
      setExistingFiles(
        Array.isArray(initialData.files) ? initialData.files : [],
      );
      setFiles([]);
      setPdfFile(null);
    }
  }, [isEdit, initialData]);

  // Create object URLs safely for newly selected images
  const filePreviews = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  );

  useEffect(() => {
    return () => {
      filePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [filePreviews]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    if (selectedFiles.length + existingFiles.length > MAX_FILES) {
      setErrorFile(`Maksimal ${MAX_FILES} foto`);
      e.target.value = "";
      return;
    }

    for (const file of selectedFiles) {
      if (!file.type.startsWith("image/")) {
        setErrorFile("Hanya file gambar yang diperbolehkan");
        e.target.value = "";
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setErrorFile("Ukuran maksimal 2 MB per foto");
        e.target.value = "";
        return;
      }
    }

    setErrorFile("");
    setFiles(selectedFiles);
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.type !== "application/pdf") {
      showToast.error("Dokumen harus berformat PDF");
      e.target.value = "";
      return;
    }

    if (selected.size > MAX_PDF_SIZE) {
      showToast.error("Ukuran maksimal PDF adalah 5 MB");
      e.target.value = "";
      return;
    }

    setPdfFile(selected);
  };

  const isTextValid = (text: string) => text.trim().length >= MIN_TEXT_LENGTH;

  const isFormValid = useMemo(() => {
    if (!isEdit && !agree) return false;
    if (status === "hadir") {
      return (
        isTextValid(judul) && isTextValid(pengalaman) && isTextValid(kendala)
      );
    }
    if (status === "tidak_hadir_keterangan") {
      return isTextValid(keterangan);
    }
    return true;
  }, [isEdit, agree, status, judul, pengalaman, kendala, keterangan]);

  const submitLogbook = async () => {
    if (submitting || !isFormValid) return;

    setSubmitting(true);
    setShowConfirm(false);
    const toastId = showToast.loading(
      isEdit ? "Mengirim revisi laporan..." : "Mengirim kehadiran & laporan...",
    );

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      if (!isEdit) {
        formData.append("date", date);
      }
      formData.append("status", status);
      formData.append("judul", judul);
      formData.append("pengalaman", pengalaman);
      formData.append("kendala", kendala);
      formData.append("keterangan", keterangan);

      files.forEach((f) => formData.append("files", f));
      if (pdfFile) {
        formData.append("pdfFile", pdfFile);
      }

      const url = isEdit
        ? `${process.env.NEXT_PUBLIC_API_URL}/logbook/${initialData?._id}/submit-revision`
        : `${process.env.NEXT_PUBLIC_API_URL}/logbook`;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Gagal menyimpan laporan harian");
      }

      showToast.updateSuccess(
        toastId,
        isEdit
          ? "Revisi laporan berhasil dikirim ke Mentor! ✅"
          : "Kehadiran & laporan hari ini berhasil dikirim! ✅",
      );
      onSuccess();
    } catch (err: any) {
      showToast.updateError(
        toastId,
        err?.message || "Terjadi kesalahan saat menyimpan",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="form-kehadiran" className="space-y-4 sm:space-y-5">
      {/* Header Date & Badge */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-700/70">
        <div>
          <h2
            className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white"
            style={{ fontWeight: 800 }}
          >
            {formattedDateLabel}
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isEdit
              ? "Perbaiki isian laporan harian sesuai catatan Mentor"
              : "Isi status kehadiran dan laporan aktivitas magang hari ini"}
          </p>
        </div>

        <span
          className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold border shrink-0 ${
            isEdit
              ? "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
              : "bg-blue-50 text-[#1D64F2] border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
          }`}
        >
          {isEdit ? "Perlu Revisi" : "Isi Hari Ini"}
        </span>
      </div>

      {/* Revision Note Banner if Edit Mode */}
      {isEdit && initialData?.revisionNote && (
        <div className="rounded-xl bg-[#FFFBEB] dark:bg-amber-950/40 border border-[#FDE68A] dark:border-amber-800/70 p-3.5 sm:p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Catatan Revisi Mentor</span>
          </div>
          <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-100 pl-5 sm:pl-6 whitespace-pre-line break-words [overflow-wrap:anywhere]">
            {initialData.revisionNote}
          </p>
        </div>
      )}

      {/* Status Kehadiran */}
      <div className="space-y-2.5">
        <label
          className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200"
          style={{ fontWeight: 700 }}
        >
          Status Kehadiran <span className="text-red-500">*</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {[
            {
              value: "hadir" as AttendanceStatus,
              label: "Hadir",
              icon: <UserCheck className="w-4 h-4" />,
              activeClass:
                "border-[#1D64F2] bg-blue-50/70 text-[#1D64F2] dark:bg-blue-950/50 dark:border-blue-400 dark:text-blue-300",
            },
            {
              value: "tidak_hadir_keterangan" as AttendanceStatus,
              label: "Izin / Sakit",
              icon: <UserX className="w-4 h-4" />,
              activeClass:
                "border-amber-500 bg-amber-50/80 text-amber-700 dark:bg-amber-950/50 dark:border-amber-500 dark:text-amber-300",
            },
            {
              value: "tidak_hadir_tanpa_keterangan" as AttendanceStatus,
              label: "Tanpa Keterangan",
              icon: <UserX className="w-4 h-4" />,
              activeClass:
                "border-red-500 bg-red-50/80 text-red-600 dark:bg-red-950/50 dark:border-red-500 dark:text-red-300",
            },
          ].map((opt) => {
            const active = status === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={isEdit}
                onClick={() => !isEdit && setStatus(opt.value)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-left transition ${
                  active
                    ? `${opt.activeClass} ring-1 ring-current/20`
                    : "border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800"
                } ${isEdit ? "opacity-75 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <span className="shrink-0">{opt.icon}</span>
                <span className="text-xs sm:text-sm font-bold leading-tight">
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Fields Based on Status */}
      {status === "hadir" ? (
        <div className="space-y-4">
          <InlineTextField
            label="Uraian Aktivitas"
            value={judul}
            onChange={setJudul}
            placeholder="Jelaskan kegiatan atau pekerjaan yang Anda lakukan hari ini..."
          />

          <InlineTextField
            label="Pembelajaran yang Diperoleh"
            value={pengalaman}
            onChange={setPengalaman}
            placeholder="Jelaskan ilmu, keterampilan, atau wawasan baru yang Anda peroleh..."
          />

          <InlineTextField
            label="Kendala yang Dialami"
            value={kendala}
            onChange={setKendala}
            placeholder="Tuliskan kendala yang dihadapi hari ini (atau tuliskan jika tidak ada kendala minimal 50 karakter)..."
          />

          {/* Upload Foto & PDF */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Dokumentasi Foto */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/50 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ImagePlus className="w-4 h-4 text-[#1D64F2]" />
                  <span>Dokumentasi Foto</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  Opsional • Maks. {MAX_FILES} foto
                </span>
              </div>

              <input
                ref={photoInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />

              {(existingFiles.length > 0 || filePreviews.length > 0) && (
                <div className="grid grid-cols-3 gap-2">
                  {existingFiles.map((url, idx) => (
                    <div
                      key={`existing-${idx}`}
                      className="relative h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700"
                    >
                      <img
                        src={getAssetUrl(url)}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setExistingFiles(
                            existingFiles.filter((_, i) => i !== idx),
                          )
                        }
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {filePreviews.map((preview, idx) => (
                    <div
                      key={`new-${idx}`}
                      className="relative h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700"
                    >
                      <img
                        src={preview}
                        alt={`Upload ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFiles(files.filter((_, i) => i !== idx))
                        }
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-[#1D64F2] text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#1D64F2] flex items-center justify-center gap-1.5 transition"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>
                  {files.length > 0 ? "Ganti Foto" : "Pilih Foto Kegiatan"}
                </span>
              </button>

              {errorFile && (
                <p className="text-[11px] text-red-600 font-medium">
                  {errorFile}
                </p>
              )}
            </div>

            {/* Dokumen PDF */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/50 p-3.5 flex flex-col justify-between gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#1D64F2]" />
                  <span>Lampiran PDF</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  Opsional • Maks. 5 MB
                </span>
              </div>

              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                onChange={handlePdfChange}
                className="hidden"
              />

              {pdfFile ? (
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 truncate">
                      {pdfFile.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPdfFile(null);
                      if (pdfInputRef.current) pdfInputRef.current.value = "";
                    }}
                    className="text-slate-400 hover:text-red-600 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : existingPdf ? (
                <div className="rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-3 py-2 text-xs font-semibold text-[#1D64F2] dark:text-blue-300">
                  File PDF sebelumnya tersedia
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-[#1D64F2] text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#1D64F2] flex items-center justify-center gap-1.5 transition"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>{pdfFile ? "Ganti File PDF" : "Pilih File PDF"}</span>
              </button>
            </div>
          </div>
        </div>
      ) : status === "tidak_hadir_keterangan" ? (
        <div className="space-y-4">
          <InlineTextField
            label="Keterangan Ketidakhadiran / Izin"
            value={keterangan}
            onChange={setKeterangan}
            placeholder="Jelaskan alasan izin atau sakit Anda secara lengkap..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Bukti Foto */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/50 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ImagePlus className="w-4 h-4 text-[#1D64F2]" />
                  <span>Foto Bukti Pendukung</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  Opsional • Maks. {MAX_FILES} foto
                </span>
              </div>

              <input
                ref={photoInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />

              {filePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {filePreviews.map((preview, idx) => (
                    <div
                      key={`bukti-${idx}`}
                      className="relative h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700"
                    >
                      <img
                        src={preview}
                        alt={`Bukti ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFiles(files.filter((_, i) => i !== idx))
                        }
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-[#1D64F2] text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#1D64F2] flex items-center justify-center gap-1.5 transition"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Pilih Foto Bukti</span>
              </button>

              {errorFile && (
                <p className="text-[11px] text-red-600 font-medium">
                  {errorFile}
                </p>
              )}
            </div>

            {/* Bukti PDF */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/50 p-3.5 flex flex-col justify-between gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#1D64F2]" />
                  <span>Surat Izin / Dokter (PDF)</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  Opsional • Maks. 5 MB
                </span>
              </div>

              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                onChange={handlePdfChange}
                className="hidden"
              />

              {pdfFile && (
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 truncate">
                      {pdfFile.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPdfFile(null);
                      if (pdfInputRef.current) pdfInputRef.current.value = "";
                    }}
                    className="text-slate-400 hover:text-red-600 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-[#1D64F2] text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#1D64F2] flex items-center justify-center gap-1.5 transition"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>{pdfFile ? "Ganti File PDF" : "Pilih File PDF"}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-800/70 p-4 space-y-1">
          <p className="text-xs sm:text-sm font-bold text-red-700 dark:text-red-300">
            Tidak Hadir Tanpa Keterangan
          </p>
          <p className="text-xs text-red-600/90 dark:text-red-400 leading-relaxed">
            Status ini tidak memerlukan uraian aktivitas atau bukti pendukung.
          </p>
        </div>
      )}

      {/* Checkbox Konfirmasi (Create Mode) */}
      {!isEdit && (
        <button
          type="button"
          onClick={() => setAgree(!agree)}
          className={`w-full flex items-start gap-3 rounded-xl border p-3.5 text-left transition ${
            agree
              ? "border-[#1D64F2] bg-blue-50/50 dark:bg-blue-950/30"
              : "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <span
            className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${
              agree
                ? "border-[#1D64F2] bg-[#1D64F2] text-white"
                : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
            }`}
          >
            {agree && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
          </span>
          <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            Saya menyatakan bahwa data kehadiran dan laporan harian yang diisi
            adalah <b>benar</b> dan <b>dapat dipertanggungjawabkan</b>.
          </span>
        </button>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
        {isEdit && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
          >
            Batal
          </button>
        )}

        <button
          type="button"
          disabled={!isFormValid || submitting}
          onClick={() => {
            if (isEdit) {
              submitLogbook();
            } else {
              setShowConfirm(true);
            }
          }}
          className="w-full sm:w-auto px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#1D64F2] hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed shadow-2xs transition inline-flex items-center justify-center gap-2"
        >
          {isEdit ? (
            <RefreshCw className="w-4 h-4" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>
            {submitting
              ? "Mengirim..."
              : isEdit
                ? "Kirim Revisi Laporan"
                : "Kirim Kehadiran & Laporan"}
          </span>
        </button>
      </div>

      {/* Confirmation Popup before final submit */}
      {showConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/70 text-[#1D64F2] dark:text-blue-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3
                  className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white"
                  style={{ fontWeight: 800 }}
                >
                  Kirim Kehadiran & Laporan?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Pastikan seluruh isian untuk <b>{formattedDateLabel}</b> sudah
                  benar. Laporan yang sudah dikirim tidak dapat diubah kecuali
                  diminta revisi oleh Mentor.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
              >
                Periksa Kembali
              </button>
              <button
                type="button"
                onClick={submitLogbook}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#1D64F2] hover:bg-blue-700 shadow-2xs transition"
              >
                Ya, Kirim Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= TEXT FIELD HELPER ================= */
function InlineTextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const length = value.trim().length;
  const isValid = length >= MIN_TEXT_LENGTH;
  const isError = length > 0 && length < MIN_TEXT_LENGTH;

  return (
    <div className="space-y-1.5">
      <label
        className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200"
        style={{ fontWeight: 700 }}
      >
        {label} <span className="text-red-500">*</span>
      </label>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className={`w-full rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder:text-slate-400 border transition focus:outline-none focus:ring-2 resize-y ${
          isError
            ? "border-red-400 focus:ring-red-400/25"
            : isValid
              ? "border-emerald-400 focus:ring-emerald-400/25"
              : "border-slate-200 dark:border-slate-700 focus:border-[#1D64F2] focus:ring-[#1D64F2]/20"
        }`}
      />

      <div className="flex items-center justify-between text-[11px] sm:text-xs">
        <div>
          {isError && (
            <span className="text-red-500 font-medium">
              Minimal {MIN_TEXT_LENGTH} karakter (kurang{" "}
              {MIN_TEXT_LENGTH - length} karakter)
            </span>
          )}
          {isValid && (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              ✓ Sudah memenuhi minimal karakter
            </span>
          )}
          {!isError && !isValid && (
            <span className="text-slate-400">
              Minimal {MIN_TEXT_LENGTH} karakter
            </span>
          )}
        </div>
        <span className="text-slate-400 font-medium">
          {length}/{MIN_TEXT_LENGTH}
        </span>
      </div>
    </div>
  );
}
