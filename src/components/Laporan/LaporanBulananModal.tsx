"use client";

import { useEffect, useState } from "react";

type Props = {
  month: string;
  mode: "create" | "view";
  onClose: (submitted?: boolean) => void;
};

export default function LaporanBulananModal({ month, mode, onClose }: Props) {
  const readonly = mode === "view";

  const [ringkasan, setRingkasan] = useState("");
  const [pencapaian, setPencapaian] = useState("");
  const [kendala, setKendala] = useState("");
  const [rencana, setRencana] = useState("");
  const [agree, setAgree] = useState(false);

  const [approvedByMentor, setApprovedByMentor] = useState(false);

  // 🔔 UI STATE
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  /* ================= FETCH (VIEW MODE) ================= */
  useEffect(() => {
    if (mode !== "view") return;

    const fetchDetail = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/laporan-bulanan/${month}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!res.ok) return;

        const data = await res.json();
        setRingkasan(data.ringkasan || "");
        setPencapaian(data.pencapaian || "");
        setKendala(data.kendala || "");
        setRencana(data.rencana || "");
        setApprovedByMentor(Boolean(data.approvedByMentor));
      } catch {
        console.error("Gagal memuat laporan bulanan");
      }
    };

    fetchDetail();
  }, [mode, month]);

  /* ================= VALIDASI ================= */
  const submitDisabled =
    readonly || !agree || !ringkasan || !pencapaian || !kendala || !rencana;

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (readonly) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/laporan-bulanan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            month,
            ringkasan,
            pencapaian,
            kendala,
            rencana,
          }),
        }
      );

      if (!res.ok) throw new Error();

      setShowConfirm(false);
      setShowSuccess(true);

      setTimeout(() => {
        onClose(true);
      }, 1500);
    } catch {
      alert("❌ Gagal menyimpan laporan bulanan");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden animate-scaleIn">
        {/* HEADER */}
        <div className="px-6 py-5 border-b bg-gradient-to-br from-indigo-100 via-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {mode === "view"
                  ? "Detail Laporan Bulanan"
                  : "Isi Laporan Bulanan"}
              </h2>
              <p className="text-sm text-slate-500">
                Periode: <span className="font-medium">{month}</span>
              </p>
            </div>

            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full
                ${
                  mode === "view"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-indigo-100 text-indigo-700"
                }`}
            >
              {mode === "view" ? "SUDAH DIISI" : "PENGISIAN"}
            </span>
          </div>
        </div>

        {/* INFO SUDAH MENGISI */}
        {mode === "view" && (
          <div className="mx-6 mt-4 rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-700">
            📌 <b>Informasi:</b> Laporan bulanan ini sudah dikirim dan tidak
            dapat diubah kembali.
          </div>
        )}

        {/* BODY */}
        <div className="px-6 py-6 space-y-5 max-h-[65vh] overflow-y-auto">
          <Textarea
            label="Ringkasan Aktivitas Bulanan"
            value={ringkasan}
            onChange={setRingkasan}
            disabled={readonly}
          />
          <Textarea
            label="Pencapaian Utama"
            value={pencapaian}
            onChange={setPencapaian}
            disabled={readonly}
          />
          <Textarea
            label="Kendala Selama Bulan Ini"
            value={kendala}
            onChange={setKendala}
            disabled={readonly}
          />
          <Textarea
            label="Rencana Kegiatan Bulan Berikutnya"
            value={rencana}
            onChange={setRencana}
            disabled={readonly}
          />

          {mode === "create" && (
            <label className="flex items-start gap-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-1 accent-indigo-600"
              />
              <span className="text-slate-700 leading-relaxed">
                Saya menyatakan laporan ini diisi dengan <b>jujur</b>,
                <b> benar</b>, dan saya <b>bertanggung jawab penuh</b>.
              </span>
            </label>
          )}
        </div>

        {/* NOTIFIKASI SUKSES */}
        {showSuccess && (
          <div className="mx-6 mb-3 rounded-xl bg-emerald-50 border border-emerald-300 p-4 text-sm text-emerald-700">
            🎉 <b>Laporan bulanan berhasil dikirim!</b>
          </div>
        )}

        {/* APPROVAL */}
        {mode === "view" && approvedByMentor && (
          <div className="mx-6 mb-3 rounded-xl bg-emerald-50 border border-emerald-300 p-3 text-sm text-emerald-700">
            ✅ Laporan ini telah <b>disetujui oleh mentor</b>.
          </div>
        )}

        {/* FOOTER */}
        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-slate-50">
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
              className={`px-6 py-2.5 rounded-xl font-semibold text-white transition
                ${
                  submitDisabled
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-lg"
                }`}
            >
              Kirim Laporan Bulanan
            </button>
          )}
        </div>
      </div>

      {/* KONFIRMASI */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-bold mb-2">Konfirmasi Pengisian</h3>
            <p className="text-sm text-slate-600 mb-5">
              Apakah Anda yakin dengan laporan ini? Setelah dikirim, laporan
              <b> tidak dapat diubah</b>.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Iya, Kirim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= REUSABLE ================= */

function Textarea({ label, value, onChange, disabled }: any) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1 text-slate-700">
        {label}
      </label>
      <textarea
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        readOnly={disabled}
        className={`w-full rounded-2xl border px-4 py-3 resize-y transition
          ${
            disabled
              ? "bg-slate-100 text-slate-600"
              : "bg-white focus:ring-2 focus:ring-indigo-500"
          }`}
      />
    </div>
  );
}
