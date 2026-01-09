"use client";

import { useState } from "react";

type Status =
  | "hadir"
  | "tidak_hadir_keterangan"
  | "tidak_hadir_tanpa_keterangan";
mode: "create" | "view";

export default function LogbookModal({
  date,
  onClose,
}: {
  date: string;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<Status>("hadir");

  const [judul, setJudul] = useState("");
  const [pengalaman, setPengalaman] = useState("");
  const [kendala, setKendala] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [errorFile, setErrorFile] = useState("");
  const [agree, setAgree] = useState(false);

  /* ================= FILE HANDLER ================= */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    !agree ||
    (status === "hadir" &&
      (!judul || !pengalaman || !kendala || files.length === 0)) ||
    (status === "tidak_hadir_keterangan" && !keterangan);

  const handleSubmit = async () => {
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
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-scaleIn">
        {/* HEADER */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-lg font-bold text-slate-800">Logbook Harian</h2>
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
              onChange={(e) => setStatus(e.target.value as Status)}
              className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
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

          {/* HADIR */}
          {status === "hadir" && (
            <>
              <Input
                label="Judul Kegiatan"
                value={judul}
                onChange={setJudul}
                placeholder="Contoh: Membuat UI Dashboard"
              />

              <Textarea
                label="Pengalaman yang Didapatkan"
                value={pengalaman}
                onChange={setPengalaman}
                placeholder="Ceritakan pengalaman hari ini..."
              />

              <Textarea
                label="Kendala yang Dialami"
                value={kendala}
                onChange={setKendala}
                placeholder="Apakah ada kendala?"
              />

              {/* UPLOAD FOTO */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Dokumentasi Kegiatan
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Maks 3 foto • Maks 2MB/foto • Disarankan 1280×720
                </p>
                {errorFile && (
                  <p className="text-xs text-red-600 mt-1">{errorFile}</p>
                )}
              </div>
            </>
          )}

          {/* TIDAK HADIR + KETERANGAN */}
          {status === "tidak_hadir_keterangan" && (
            <Textarea
              label="Alasan Tidak Hadir"
              value={keterangan}
              onChange={setKeterangan}
              placeholder="Tuliskan alasan tidak hadir..."
            />
          )}

          {/* PERNYATAAN */}
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1"
            />
            <span>
              Saya menyatakan bahwa data yang saya isi adalah benar dan dapat
              dipertanggungjawabkan.
            </span>
          </label>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 transition"
          >
            Batal
          </button>

          <button
            disabled={submitDisabled}
            onClick={handleSubmit}
            className={`px-5 py-2.5 rounded-xl font-semibold text-white transition
              ${
                submitDisabled
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }
            `}
          >
            Simpan Logbook
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= REUSABLE ================= */

function Input({ label, value, onChange, placeholder }: any) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder }: any) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <textarea
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
      />
    </div>
  );
}
