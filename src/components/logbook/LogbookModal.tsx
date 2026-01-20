"use client";

import { useEffect, useState } from "react";
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
      try {
        const res = await fetch(getEndpoint(), {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (res.status === 404) return;
        if (!res.ok) throw new Error("Gagal mengambil logbook");

        const data = await res.json();
        if (!data) return;

        setStatus(data.status);
        setJudul(data.judul || "");
        setPengalaman(data.pengalaman || "");
        setKendala(data.kendala || "");
        setKeterangan(data.keterangan || "");
        setFileUrls(data.files || []);
        setApprovedByMentor(Boolean(data.approvedByMentor));
        setMentorNote(data.mentorNote || "");
      } catch (error) {
        console.error(error);
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

      showToast.updateSuccess(toastId, "Logbook berhasil disimpan");
      onClose();
    } catch (err: any) {
      showToast.updateError(
        toastId,
        err.message || "Terjadi kesalahan saat menyimpan",
      );
    }
  };

  // Approve Handler for Mentor
  const handleApprove = async (approved: boolean) => {
    // Note: logbookId tidak didefinisikan di komponen ini
    // Anda perlu menambahkan logbookId ke props atau state
    const logbookId = ""; // Ganti dengan ID yang sesuai

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/logbook/mentor/approve/${logbookId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          approvedByMentor: approved,
          mentorNote,
        }),
      },
    );

    if (!res.ok) {
      showToast.error("Gagal memproses logbook");
      return;
    }

    showToast.success(approved ? "Logbook disetujui" : "Logbook ditolak");
  };

  const getImageUrl = (path: string) => {
    if (!path) return "";
    return `${process.env.NEXT_PUBLIC_BASE_URL}/api/${path}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-6">
      <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white">
                {mode === "view" ? "Detail Logbook" : "Isi Logbook Harian"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {date}
              </p>
            </div>

            <span
              className={`
                  shrink-0 rounded-full px-3 py-1 text-xs font-semibold
                  ${
                    mode === "view"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                      : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200"
                  }
                `}
            >
              {mode.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Mentor Status Notification */}
        {mode === "view" && (
          <div className="px-5 sm:px-6 pt-4 space-y-3">
            {approvedByMentor ? (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
                ✅ <b>Logbook disetujui mentor</b>
              </div>
            ) : mentorNote ? (
              <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-800 dark:text-red-200">
                ❌ <b>Logbook ditolak mentor</b>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                ⏳ <b>Menunggu pemeriksaan mentor</b>
              </div>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-6 space-y-6">
          {/* Status Field */}
          <Field label="Status Kehadiran">
            {readonly ? (
              <span
                className={`
                    inline-flex items-center px-4 py-2 rounded-full
                    text-sm font-semibold
                    ${
                      status === "hadir" &&
                      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                    }
                    ${
                      status === "tidak_hadir_keterangan" &&
                      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
                    }
                    ${
                      status === "tidak_hadir_tanpa_keterangan" &&
                      "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200"
                    }
                  `}
              >
                {status === "hadir" && "✔ Hadir"}
                {status === "tidak_hadir_keterangan" &&
                  "ℹ Tidak Hadir (Keterangan)"}
                {status === "tidak_hadir_tanpa_keterangan" &&
                  "✖ Tidak Hadir (Tanpa Keterangan)"}
              </span>
            ) : (
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="w-full appearance-none rounded-xl border px-4 py-2.5 text-sm bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 bg-[url('data:image/svg+xml;base64,PHN2ZyB...')] bg-no-repeat bg-[length:14px] bg-[right_1rem_center]"
              >
                <option value="hadir">Hadir</option>
                <option value="tidak_hadir_keterangan">
                  Tidak Hadir (Keterangan)
                </option>
                <option value="tidak_hadir_tanpa_keterangan">
                  Tidak Hadir (Tanpa Keterangan)
                </option>
              </select>
            )}
          </Field>

          {/* Hadir Fields */}
          {status === "hadir" && (
            <>
              <Field label="Uraian Aktivitas">
                {readonly ? (
                  <TextBlock value={judul} />
                ) : (
                  <Textarea
                    value={judul}
                    onChange={setJudul}
                    disabled={readonly}
                  />
                )}
              </Field>

              <Field label="Pembelajaran">
                {readonly ? (
                  <TextBlock value={pengalaman} />
                ) : (
                  <Textarea
                    value={pengalaman}
                    onChange={setPengalaman}
                    disabled={readonly}
                  />
                )}
              </Field>

              <Field label="Kendala">
                {readonly ? (
                  <TextBlock value={kendala} />
                ) : (
                  <Textarea
                    value={kendala}
                    onChange={setKendala}
                    disabled={readonly}
                  />
                )}
              </Field>

              {/* File Upload (Create Mode) */}
              {!readonly && (
                <Field label="Dokumentasi (max 3 foto)">
                  {files.length === 0 ? (
                    <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-600 bg-indigo-50/60 dark:bg-indigo-900/20 px-4 py-8 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition text-center">
                      <span className="text-3xl">📸</span>
                      <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                        Klik untuk upload foto
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Maksimal 3 foto • Ukuran ≤ 2MB / foto
                      </span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {files.map((file, i) => (
                          <div
                            key={i}
                            className="relative group rounded-xl overflow-hidden border dark:border-slate-700"
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              className="h-32 w-full object-cover"
                              alt={`Upload ${i + 1}`}
                            />
                            <button
                              type="button"
                              onClick={() => removeFile(i)}
                              className="absolute top-2 right-2 bg-black/60 text-white text-xs rounded-full px-2 py-1 opacity-0 group-hover:opacity-100 transition"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                      <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                        ➕ Tambah / ganti foto
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
                    <p className="text-xs text-red-600 mt-1">{errorFile}</p>
                  )}
                </Field>
              )}

              {/* File Display (View Mode) */}
              {readonly && fileUrls.length > 0 && (
                <Field label="Dokumentasi">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {fileUrls.map((url, i) => (
                      <img
                        src={getImageUrl(url)}
                        onClick={() => setPreviewImage(getImageUrl(url))}
                        className="h-28 w-full rounded-xl object-cover cursor-pointer hover:scale-105 transition"
                        alt={`Dokumentasi ${i + 1}`}
                      />
                    ))}
                  </div>
                </Field>
              )}
            </>
          )}

          {/* Tidak Hadir dengan Keterangan */}
          {status === "tidak_hadir_keterangan" && (
            <Field label="Alasan Tidak Hadir">
              {readonly ? (
                <TextBlock value={keterangan} />
              ) : (
                <Textarea
                  value={keterangan}
                  onChange={setKeterangan}
                  disabled={readonly}
                />
              )}
            </Field>
          )}

          {/* Agreement Checkbox (Create Mode) */}
          {mode === "create" && (
            <button
              type="button"
              onClick={() => setAgree(!agree)}
              className={`
                  w-full flex items-start gap-3 rounded-2xl border px-4 py-4 text-sm transition
                  ${
                    agree
                      ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                      : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  }
                `}
            >
              <span
                className={`
                    mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center
                    ${agree ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-400"}
                  `}
              >
                {agree && "✓"}
              </span>
              <span className="text-left text-slate-700 dark:text-slate-200">
                Saya telah memastikan bahwa seluruh data yang diisi sudah benar
              </span>
            </button>
          )}

          {/* Mentor Approval Status */}
          {mode === "view" && approvedByMentor && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 text-sm text-emerald-700">
              ✅ Disetujui Mentor
            </div>
          )}

          {/* Mentor Note */}
          {mode === "view" && mentorNote && (
            <Field label="Catatan Mentor">
              <textarea
                value={mentorNote}
                readOnly
                rows={4}
                className="
        w-full rounded-xl border
        bg-slate-100 dark:bg-slate-800
        px-3 py-2 text-sm
        resize-none
      "
              />
            </Field>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-sm font-semibold text-red-600 dark:text-red-400 border border-red-400 dark:border-red-500 bg-transparent hover:bg-red-50 dark:hover:bg-red-900/30 shadow-sm hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            Tutup
          </button>

          {mode === "create" && (
            <button
              disabled={submitDisabled}
              onClick={handleSubmit}
              title={
                submitDisabled
                  ? "Lengkapi semua isian minimal 50 karakter dan upload foto valid"
                  : "Simpan logbook"
              }
              className={`
                  rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-all
                  ${
                    submitDisabled
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg"
                  }
                `}
            >
              💾 Simpan
            </button>
          )}

          {/* Mentor Approval Buttons */}
          {role === "mentor" && mode === "view" && (
            <div className="flex gap-3">
              <button
                onClick={() => handleApprove(true)}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white"
              >
                ✅ Laporan Diterima
              </button>
              <button
                onClick={() => handleApprove(false)}
                className="px-4 py-2 rounded-lg bg-red-600 text-white"
              >
                ❌ Laporan Ditolak
              </button>
            </div>
          )}
        </div>

        {/* Image Preview Modal */}
        {previewImage && (
          <div
            className="fixed inset-0 z-[999] bg-black/80 flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <img
              src={previewImage}
              className="max-h-[90vh] max-w-full rounded-2xl"
              alt="Preview"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Reusable Components
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[15px] sm:text-base font-extrabold text-slate-800 dark:text-slate-100 mb-2 block">
        {label}
      </label>
      {children}
    </div>
  );
}

function Textarea({
  value,
  onChange,
  disabled,
  min = MIN_TEXT_LENGTH,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  min?: number;
}) {
  const length = value.trim().length;
  const isError = length > 0 && length < min;
  const isValid = length >= min;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    // Auto-grow
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  return (
    <div className="space-y-1">
      <textarea
        value={value}
        disabled={disabled}
        rows={4}
        onChange={handleChange}
        className={`
            w-full resize-y overflow-auto max-h-[40vh] rounded-xl px-3 py-2
            text-sm sm:text-base bg-white dark:bg-slate-800 border transition
            focus:outline-none focus:ring-2
            ${
              isError
                ? "border-red-400 focus:ring-red-400"
                : isValid
                  ? "border-emerald-400 focus:ring-emerald-400"
                  : "border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
            }
          `}
      />
      <div className="flex justify-between text-xs">
        {isError && (
          <span className="text-red-500">Minimal {min} karakter</span>
        )}
        {isValid && (
          <span className="text-emerald-600 dark:text-emerald-400">
            ✓ Sudah memenuhi
          </span>
        )}
        <span className="text-slate-400">
          {length}/{min}
        </span>
      </div>
    </div>
  );
}

function TextBlock({ value }: { value: string }) {
  return (
    <div className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line text-justify">
      {value || "-"}
    </div>
  );
}
