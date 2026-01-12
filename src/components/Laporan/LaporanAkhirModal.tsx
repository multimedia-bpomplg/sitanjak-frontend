"use client";

import { useEffect, useState } from "react";

type Props = {
  mode: "create" | "view";
  onClose: (submitted?: boolean) => void;
};

export default function LaporanAkhirModal({ mode, onClose }: Props) {
  const readonly = mode === "view";

  const [judul, setJudul] = useState("");
  const [ringkasan, setRingkasan] = useState("");
  const [hasil, setHasil] = useState("");
  const [kendala, setKendala] = useState("");
  const [kesimpulan, setKesimpulan] = useState("");
  const [saran, setSaran] = useState("");

  const [agree, setAgree] = useState(false);
  const [approvedByMentor, setApprovedByMentor] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  /* ================= FETCH (VIEW MODE) ================= */
  useEffect(() => {
    if (mode !== "view") return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/laporan-akhir`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setJudul(data.judul || "");
        setRingkasan(data.ringkasan || "");
        setHasil(data.hasil || "");
        setKendala(data.kendala || "");
        setKesimpulan(data.kesimpulan || "");
        setSaran(data.saran || "");
        setApprovedByMentor(Boolean(data.approvedByMentor));
      })
      .catch(() => console.error("Gagal memuat laporan akhir"));
  }, [mode]);

  /* ================= VALIDASI ================= */
  const submitDisabled =
    readonly ||
    !agree ||
    !judul ||
    !ringkasan ||
    !hasil ||
    !kendala ||
    !kesimpulan;

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/laporan-akhir`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            judul,
            ringkasan,
            hasil,
            kendala,
            kesimpulan,
            saran,
          }),
        }
      );

      if (!res.ok) throw new Error();

      setShowConfirm(false);
      setShowSuccess(true);

      setTimeout(() => {
        onClose(true);
      }, 1800);
    } catch {
      alert("❌ Gagal menyimpan laporan akhir");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.3)] overflow-hidden animate-scaleIn">
        {/* HEADER */}
        <div className="px-8 py-6 border-b bg-gradient-to-br from-indigo-100 via-purple-50 to-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                📘 Laporan Akhir Magang
              </h2>
              <p className="text-sm text-slate-500">
                Dokumen akhir – hanya dapat diisi satu kali
              </p>
            </div>

            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
              FINAL
            </span>
          </div>
        </div>

        {/* INFO FINAL */}
        {mode === "view" && (
          <div className="mx-8 mt-4 rounded-xl bg-yellow-50 border border-yellow-300 p-4 text-sm text-yellow-700">
            🔒 <b>Laporan akhir bersifat final</b> dan tidak dapat diubah
            kembali.
          </div>
        )}

        {/* BODY */}
        <div className="px-8 py-6 space-y-5 max-h-[65vh] overflow-y-auto">
          <Input
            label="Judul Laporan Akhir"
            value={judul}
            onChange={setJudul}
            disabled={readonly}
          />

          <Textarea
            label="Ringkasan Kegiatan Magang"
            value={ringkasan}
            onChange={setRingkasan}
            disabled={readonly}
          />

          <Textarea
            label="Hasil & Pencapaian"
            value={hasil}
            onChange={setHasil}
            disabled={readonly}
          />

          <Textarea
            label="Kendala Selama Magang"
            value={kendala}
            onChange={setKendala}
            disabled={readonly}
          />

          <Textarea
            label="Kesimpulan"
            value={kesimpulan}
            onChange={setKesimpulan}
            disabled={readonly}
          />

          <Textarea
            label="Saran (Opsional)"
            value={saran}
            onChange={setSaran}
            disabled={readonly}
          />

          {mode === "create" && (
            <label className="flex items-start gap-3 text-sm bg-slate-50 border rounded-2xl p-4">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-1 accent-indigo-600"
              />
              <span>
                Saya menyatakan laporan akhir ini dibuat dengan <b>jujur</b>,
                <b> benar</b>, dan saya bertanggung jawab penuh atas isinya.
              </span>
            </label>
          )}
        </div>

        {/* SUCCESS */}
        {showSuccess && (
          <div className="mx-8 mb-4 rounded-xl bg-emerald-50 border border-emerald-300 p-4 text-sm text-emerald-700">
            🎉 <b>Laporan akhir berhasil dikirim.</b>
          </div>
        )}

        {/* FOOTER */}
        <div className="px-8 py-4 border-t flex justify-end gap-3 bg-slate-50">
          <button
            onClick={() => onClose()}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200"
          >
            Tutup
          </button>

          {mode === "create" && (
            <button
              disabled={submitDisabled}
              onClick={() => setShowConfirm(true)}
              className={`px-6 py-2.5 rounded-xl font-semibold text-white
                ${
                  submitDisabled
                    ? "bg-slate-400"
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-lg"
                }`}
            >
              Kirim Laporan Akhir
            </button>
          )}
        </div>
      </div>

      {/* KONFIRMASI */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center px-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-2">Konfirmasi Laporan Akhir</h3>
            <p className="text-sm text-slate-600 mb-5">
              Apakah Anda yakin ingin mengirim laporan akhir ini?
              <b> Laporan tidak dapat diubah kembali.</b>
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-xl hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Iya, Kirim Final
              </button>
            </div>
          </div>
        </div>
      )}
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
        className="w-full rounded-2xl border px-4 py-3"
      />
    </div>
  );
}

function Textarea({ label, value, onChange, disabled }: any) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <textarea
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        readOnly={disabled}
        className="w-full rounded-2xl border px-4 py-3 resize-y"
      />
    </div>
  );
}
