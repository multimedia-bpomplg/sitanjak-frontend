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
  const [errorFile, setErrorFile] = useState("");

  // ☑️ Persetujuan user
  const [agree, setAgree] = useState(false);

  // 🔔 Approval mentor
  const [approvedByMentor, setApprovedByMentor] = useState(false);

  /* ================= FETCH DATA (VIEW MODE) ================= */
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
          setApprovedByMentor(Boolean(data.approvedByMentor));
        })
        .catch(() => {
          console.error("Gagal memuat detail logbook");
        });
    }
  }, [mode, date]);

  /* ================= FILE HANDLER ================= */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readonly) return;

    const selected = Array.from(e.target.files || []);

    if (selected.length > 3) {
      setErrorFile("Maksimal 3 foto diperbolehkan");
      return;
    }

    for (const file of selected) {
      if (!file.type.startsWith("image/")) {
        setErrorFile("Hanya file gambar yang diperbolehkan");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setErrorFile("Ukuran maksimal 1 foto adalah 2 MB");
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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-lg font-bold text-slate-800">
            {mode === "view" ? "Detail Logbook" : "Isi Logbook Harian"}
          </h2>
          <p className="text-sm text-slate-500">
            Tanggal: <span className="font-medium">{date}</span>
          </p>
        </div>

        {/* BODY */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* STATUS */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              Status Kehadiran
            </label>
            <select
              value={status}
              disabled={readonly}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="hadir">Hadir</option>
              <option value="tidak_hadir_keterangan">
                Tidak Hadir dengan Keterangan
              </option>
              <option value="tidak_hadir_tanpa_keterangan">
                Tidak Hadir tanpa Keterangan
              </option>
            </select>
          </div>

          {status === "hadir" && (
            <>
              <Textarea
                label="Uraian Aktivitas"
                value={judul}
                onChange={setJudul}
                disabled={readonly}
              />

              <Textarea
                label="Pembelajaran yang didapatkan"
                value={pengalaman}
                onChange={setPengalaman}
                disabled={readonly}
              />
              <Textarea
                label="Kendala"
                value={kendala}
                onChange={setKendala}
                disabled={readonly}
              />

              {!readonly && (
                <div className="space-y-1">
                  <label className="block text-sm font-semibold">
                    Dokumentasi Kegiatan
                  </label>
                  <input type="file" multiple onChange={handleFileChange} />
                  {errorFile && (
                    <p className="text-xs text-red-600">{errorFile}</p>
                  )}
                </div>
              )}
            </>
          )}

          {status === "tidak_hadir_keterangan" && (
            <Textarea
              label="Alasan Tidak Hadir"
              value={keterangan}
              onChange={setKeterangan}
              disabled={readonly}
            />
          )}

          {/* ☑️ PERNYATAAN */}
          {mode === "create" && (
            <label className="flex items-start gap-3 text-sm bg-slate-50 border rounded-xl p-4">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-1"
              />
              <span className="text-slate-700">
                Saya menyatakan bahwa seluruh data dan informasi yang saya isi
                pada logbook ini adalah <b>benar</b>, <b>jujur</b>, dan dapat
                saya <b>pertanggungjawabkan sepenuhnya</b>.
              </span>
            </label>
          )}
        </div>

        {/* 🔔 NOTIFIKASI APPROVAL */}
        {mode === "view" && approvedByMentor && (
          <div className="mx-6 mb-3 rounded-xl bg-emerald-50 border border-emerald-300 p-3 text-sm text-emerald-700">
            ✅ Laporan logbook ini telah <b>disetujui oleh mentor</b>.
          </div>
        )}

        {/* FOOTER */}
        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-slate-50">
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
              className={`px-5 py-2.5 rounded-xl font-semibold text-white transition
                ${
                  submitDisabled
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
              Simpan Logbook
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= REUSABLE ================= */

function Input({ label, value, onChange, disabled }: any) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        readOnly={disabled}
        className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function Textarea({ label, value, onChange, disabled }: any) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <textarea
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        readOnly={disabled}
        className="w-full rounded-xl border px-3 py-2 resize-y focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
