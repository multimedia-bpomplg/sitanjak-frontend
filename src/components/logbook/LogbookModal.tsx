"use client";

import { useEffect, useState } from "react";

type Status =
  | "hadir"
  | "tidak_hadir_keterangan"
  | "tidak_hadir_tanpa_keterangan";

type Props = {
  date: string;
  mode: "create" | "view";
  onClose: () => void;
};

export default function LogbookModal({ date, mode, onClose }: Props) {
  const readonly = mode === "view";

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

  /* ================= FETCH VIEW ================= */
  useEffect(() => {
    if (mode === "view") {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/logbook/${date}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setStatus(data.status);
          setJudul(data.judul || "");
          setPengalaman(data.pengalaman || "");
          setKendala(data.kendala || "");
          setKeterangan(data.keterangan || "");
          setFileUrls(data.files || []);
          setApprovedByMentor(Boolean(data.approvedByMentor));
          setMentorNote(data.mentorNote || ""); // ✅ TAMBAHAN
        });
    }
  }, [mode, date]);

  /* ================= FILE HANDLER ================= */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readonly) return;

    const selected = Array.from(e.target.files || []);

    if (selected.length > 3) {
      setErrorFile("Maksimal 3 foto");
      return;
    }

    for (const file of selected) {
      if (!file.type.startsWith("image/")) {
        setErrorFile("Hanya gambar");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setErrorFile("Maksimal 2MB / foto");
        return;
      }
    }

    setErrorFile("");
    setFiles(selected);
  };

  /* ================= VALIDASI ================= */
  const submitDisabled =
    readonly ||
    !agree ||
    (status === "hadir" &&
      (!judul || !pengalaman || !kendala || files.length === 0)) ||
    (status === "tidak_hadir_keterangan" && !keterangan);

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (readonly) return;

    const formData = new FormData();
    formData.append("date", date);
    formData.append("status", status);
    formData.append("judul", judul);
    formData.append("pengalaman", pengalaman);
    formData.append("kendala", kendala);
    formData.append("keterangan", keterangan);
    files.forEach((f) => formData.append("files", f));

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logbook`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
        {/* ================= HEADER ================= */}
        <div className="px-6 py-5 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {mode === "view" ? "Detail Logbook" : "Isi Logbook Harian"}
              </h2>
              <p className="text-sm text-slate-500">{date}</p>
            </div>
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full
              ${
                mode === "view"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {mode.toUpperCase()}
            </span>
          </div>
        </div>

        {/* 🔔 NOTIFIKASI STATUS MENTOR */}
        {mode === "view" && (
          <>
            {approvedByMentor ? (
              <div className="mx-6 mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                ✅ <b>Logbook ini telah diperiksa oleh mentor</b>
              </div>
            ) : (
              <div className="mx-6 mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                ⏳ <b>Logbook ini belum diperiksa oleh mentor</b>
              </div>
            )}
          </>
        )}

        {/* ================= BODY ================= */}
        <div className="px-6 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <Field label="Status Kehadiran">
            <select
              value={status}
              disabled={readonly}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="input"
            >
              <option value="hadir">Hadir</option>
              <option value="tidak_hadir_keterangan">
                Tidak Hadir (Keterangan)
              </option>
              <option value="tidak_hadir_tanpa_keterangan">
                Tidak Hadir (Tanpa)
              </option>
            </select>
          </Field>

          {status === "hadir" && (
            <>
              <Field label="Uraian Aktivitas">
                <Textarea
                  value={judul}
                  onChange={setJudul}
                  disabled={readonly}
                />
              </Field>

              <Field label="Pembelajaran">
                <Textarea
                  value={pengalaman}
                  onChange={setPengalaman}
                  disabled={readonly}
                />
              </Field>

              <Field label="Kendala">
                <Textarea
                  value={kendala}
                  onChange={setKendala}
                  disabled={readonly}
                />
              </Field>

              {!readonly && (
                <Field label="Dokumentasi (max 3 foto)">
                  <input type="file" multiple onChange={handleFileChange} />
                  {errorFile && (
                    <p className="text-xs text-red-600">{errorFile}</p>
                  )}
                </Field>
              )}

              {readonly && fileUrls.length > 0 && (
                <Field label="Dokumentasi">
                  <div className="grid grid-cols-3 gap-3">
                    {fileUrls.map((url, i) => (
                      <img
                        key={i}
                        src={`${process.env.NEXT_PUBLIC_BASE_URL}/${url}`}
                        onClick={() =>
                          setPreviewImage(
                            `${process.env.NEXT_PUBLIC_BASE_URL}/${url}`
                          )
                        }
                        className="h-28 w-full object-cover rounded-xl cursor-pointer hover:scale-105 transition"
                        alt={`Dokumentasi ${i + 1}`}
                      />
                    ))}
                  </div>
                </Field>
              )}
            </>
          )}

          {status === "tidak_hadir_keterangan" && (
            <Field label="Alasan Tidak Hadir">
              <Textarea
                value={keterangan}
                onChange={setKeterangan}
                disabled={readonly}
              />
            </Field>
          )}

          {mode === "create" && (
            <label className="flex gap-3 text-sm bg-blue-50 border border-blue-200 rounded-xl p-4">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <span>Saya menyatakan data yang diisi benar</span>
            </label>
          )}

          {mode === "view" && approvedByMentor && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 text-sm text-emerald-700">
              ✅ Disetujui Mentor
            </div>
          )}

          {mode === "view" && approvedByMentor && mentorNote && (
            <Field label="Balasan Mentor">
              <textarea
                value={mentorNote}
                readOnly
                className="w-full rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 resize-none"
                rows={4}
              />
            </Field>
          )}
        </div>

        {/* ================= FOOTER ================= */}
        <div className="px-6 py-4 border-t bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200"
          >
            Tutup
          </button>

          {mode === "create" && (
            <button
              disabled={submitDisabled}
              onClick={handleSubmit}
              className={`px-5 py-2 rounded-xl font-semibold text-white
                ${
                  submitDisabled
                    ? "bg-slate-400"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
              Simpan
            </button>
          )}
        </div>

        {/* ================= PREVIEW FOTO ================= */}
        {previewImage && (
          <div
            className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center"
            onClick={() => setPreviewImage(null)}
          >
            <img
              src={previewImage}
              className="max-w-full max-h-[90vh] rounded-2xl"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= REUSABLE ================= */

function Field({ label, children }: any) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700 mb-1 block">
        {label}
      </label>
      {children}
    </div>
  );
}

function Textarea({ value, onChange, disabled }: any) {
  return (
    <textarea
      rows={4}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-500 resize-none"
    />
  );
}
