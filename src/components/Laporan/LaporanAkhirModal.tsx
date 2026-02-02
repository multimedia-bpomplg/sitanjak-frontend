"use client";

import { useEffect, useState } from "react";
import { showToast } from "@/components/ui/toastDashboard";

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

  /* ================= FETCH (VIEW MODE) ================= */
  useEffect(() => {
    if (mode !== "view") return;

    const fetchDetail = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/laporan-akhir`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        // ⛔ JIKA TIDAK OK → STOP
        if (!res.ok) return;

        const data = await res.json();

        setJudul(data.judul || "");
        setRingkasan(data.ringkasan || "");
        setHasil(data.hasil || "");
        setKendala(data.kendala || "");
        setKesimpulan(data.kesimpulan || "");
        setSaran(data.saran || "");
        setApprovedByMentor(Boolean(data.approvedByMentor));
      } catch (err) {
        console.error("Gagal memuat laporan akhir", err);
      }
    };

    fetchDetail();
  }, [mode]);

  const isMin = (text: string, min: number) => text.trim().length >= min;

  /* ================= VALIDASI ================= */
  const submitDisabled =
    readonly ||
    !agree ||
    !isMin(judul, 20) ||
    !isMin(ringkasan, 50) ||
    !isMin(hasil, 50) ||
    !isMin(kendala, 50) ||
    !isMin(kesimpulan, 50);

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (readonly || submitDisabled) return;

    // 1️⃣ AMBIL TOKEN SEKALI
    const token = localStorage.getItem("token");

    // 2️⃣ CEK TOKEN SEBELUM REQUEST
    if (!token) {
      showToast.error("Sesi login habis. Silakan login ulang.");
      return;
    }

    const toastId = showToast.loading("Menyimpan laporan akhir...");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/laporan-akhir`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // 3️⃣ PAKAI TOKEN DI SINI
          },
          body: JSON.stringify({
            judul,
            ringkasan,
            hasil,
            kendala,
            kesimpulan,
            saran,
          }),
        },
      );

      const data = await res.json();

      // ✨ TANGANI TOKEN INVALID DENGAN JELAS
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error(
            "Sesi login Anda telah berakhir. Silakan login ulang.",
          );
        }

        throw new Error(data?.message || "Gagal menyimpan laporan akhir");
      }

      // ✅ SUCCESS
      showToast.updateSuccess(toastId, "🎉 Laporan akhir berhasil dikirim.");

      setShowConfirm(false);

      setTimeout(() => {
        onClose(true);
      }, 1200);
    } catch (err: any) {
      // ❌ ERROR
      showToast.updateError(
        toastId,
        err.message || "Terjadi kesalahan saat menyimpan laporan",
      );
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/laporan-akhir/pdf`,
      );

      if (!res.ok) throw new Error();

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "Laporan_Akhir_Magang.pdf";
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("❌ Gagal mengunduh PDF laporan akhir");
    }
  };

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
        {/* HEADER */}
        <div
          className="
            px-5 sm:px-6 py-4
            border-b border-slate-200 dark:border-slate-800
            bg-linear-to-r
            from-[#FCA5A5] via-[#FDE68A] to-[#FFF7ED]
            dark:from-indigo-800 dark:via-indigo-700 dark:to-indigo-900
            text-slate-900 dark:text-white
          "
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white">
                📘 Laporan Akhir Magang
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
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
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-6 space-y-6">
          <Field label="Judul Laporan Akhir">
            {readonly ? (
              <TextBlock value={judul} />
            ) : (
              <Input
                value={judul}
                onChange={setJudul}
                disabled={readonly}
                min={20}
              />
            )}
          </Field>

          <Field label="Ringkasan Kegiatan Magang">
            {readonly ? (
              <TextBlock value={ringkasan} />
            ) : (
              <Textarea
                value={ringkasan}
                onChange={setRingkasan}
                disabled={readonly}
                min={50}
              />
            )}
          </Field>

          <Field label="Hasil & Pencapaian">
            {readonly ? (
              <TextBlock value={hasil} />
            ) : (
              <Textarea
                value={hasil}
                onChange={setHasil}
                disabled={readonly}
                min={50}
              />
            )}
          </Field>

          <Field label="Kendala Selama Magang">
            {readonly ? (
              <TextBlock value={kendala} />
            ) : (
              <Textarea
                value={kendala}
                onChange={setKendala}
                disabled={readonly}
                min={50}
              />
            )}
          </Field>

          <Field label="Kesimpulan">
            {readonly ? (
              <TextBlock value={kesimpulan} />
            ) : (
              <Textarea
                value={kesimpulan}
                onChange={setKesimpulan}
                disabled={readonly}
                min={50}
              />
            )}
          </Field>

          <Field label="Saran (Opsional)">
            {readonly ? (
              <TextBlock value={saran} />
            ) : (
              <Textarea
                value={saran}
                onChange={setSaran}
                disabled={readonly}
                optional
              />
            )}
          </Field>

          {mode === "create" && (
            <button
              type="button"
              onClick={() => setAgree(!agree)}
              className={`
                w-full flex items-start gap-3
                rounded-2xl border
                px-4 py-4 text-sm
                transition
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
                  ${
                    agree
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-400"
                  }
                `}
              >
                {agree && "✓"}
              </span>

              <span className="text-left text-slate-700 dark:text-slate-200">
                Saya menyatakan laporan akhir ini dibuat dengan <b>jujur</b>,
                <b> benar</b>, dan saya bertanggung jawab penuh atas isinya.
              </span>
            </button>
          )}
        </div>

        {/* FOOTER */}
        <div
          className="
            px-4 sm:px-6 py-4
            border-t border-slate-200 dark:border-slate-800
            bg-slate-50 dark:bg-slate-900
            flex flex-col-reverse sm:flex-row
            sm:items-center sm:justify-between
            gap-3
          "
        >
          {/* KIRI: DOWNLOAD PDF
          {mode === "view" && approvedByMentor && (
            <button
              onClick={handleDownloadPdf}
              className="
                inline-flex items-center justify-center gap-2
                px-5 py-2.5
                rounded-full
                text-sm font-semibold
                text-emerald-700 dark:text-emerald-300
                border border-emerald-400 dark:border-emerald-500
                bg-transparent
                hover:bg-emerald-50 dark:hover:bg-emerald-900/30
                shadow-sm hover:shadow-md
                transition
                focus:outline-none focus:ring-2 focus:ring-emerald-400
              "
            >
              📄 Download PDF
            </button>
          )} */}

          {/* KANAN: AKSI */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={() => onClose()}
              className="
                w-full sm:w-auto
                px-5 py-2.5
                rounded-full
                text-sm font-semibold
                text-red-600 dark:text-red-400
                border border-red-400 dark:border-red-500
                bg-transparent
                hover:bg-red-50 dark:hover:bg-red-900/30
                shadow-sm hover:shadow-md
                transition
                focus:outline-none focus:ring-2 focus:ring-red-400
              "
            >
              Tutup
            </button>

            {mode === "create" && (
              <button
                disabled={submitDisabled}
                onClick={() => setShowConfirm(true)}
                className={`
                  w-full sm:w-auto
                  rounded-full px-6 py-2.5
                  text-sm font-semibold text-white
                  transition-all
                  focus:outline-none focus:ring-2
                  ${
                    submitDisabled
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg focus:ring-emerald-400"
                  }
                `}
              >
                🚀 Kirim Laporan Akhir
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KONFIRMASI */}
      {showConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div
            className="
              w-full max-w-md
              rounded-3xl
              bg-white dark:bg-slate-900
              shadow-[0_25px_80px_-20px_rgba(0,0,0,0.45)]
              border border-slate-200 dark:border-slate-800
              overflow-hidden
              animate-scaleIn
            "
          >
            {/* HEADER */}
            <div
              className="
                px-6 py-5
                bg-linear-to-r from-indigo-50 to-blue-50
                dark:from-slate-800 dark:to-slate-900
                border-b border-slate-200 dark:border-slate-800
                flex items-center gap-3
              "
            >
              <div
                className="
                  h-10 w-10
                  rounded-full
                  flex items-center justify-center
                  bg-indigo-100 dark:bg-indigo-900/40
                  text-indigo-600 dark:text-indigo-300
                  text-lg
                "
              >
                ⚠️
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-white">
                  Konfirmasi Laporan Akhir
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Pastikan laporan sudah benar
                </p>
              </div>
            </div>

            {/* BODY */}
            <div className="px-6 py-6 space-y-4">
              <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed">
                Apakah Anda yakin ingin mengirim laporan akhir ini?
              </p>

              <div
                className="
                  rounded-xl
                  border border-amber-300
                  bg-amber-50 dark:bg-amber-900/20
                  px-4 py-3
                  text-sm text-amber-800 dark:text-amber-200
                "
              >
                ⚠️ <b>Perhatian:</b> Setelah dikirim, laporan
                <b> tidak dapat diubah kembali</b>.
              </div>
            </div>

            <div
              className="
                px-6 py-4
                bg-slate-50 dark:bg-slate-900
                border-t border-slate-200 dark:border-slate-800
                flex flex-col-reverse sm:flex-row
                gap-3
                sm:justify-end
              "
            >
              <button
                onClick={() => setShowConfirm(false)}
                className="
                  w-full sm:w-auto
                  px-5 py-2.5
                  rounded-full
                  text-sm font-semibold
                  text-slate-600 dark:text-slate-300
                  border border-slate-300 dark:border-slate-700
                  hover:bg-slate-100 dark:hover:bg-slate-800
                  transition
                "
              >
                Batal
              </button>

              <button
                onClick={handleSubmit}
                className="
                  w-full sm:w-auto
                  px-6 py-2.5
                  rounded-full
                  text-sm font-semibold text-white
                  bg-emerald-600 hover:bg-emerald-700
                  shadow-md hover:shadow-lg
                  transition
                "
              >
                ✅ Iya, Kirim Final
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= REUSABLE ================= */
function Field({ label, children }: any) {
  return (
    <div>
      <label
        className="
          text-[15px] sm:text-base
          font-extrabold
          text-slate-800 dark:text-slate-100
          mb-2 block
        "
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  disabled,
  min = 20,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  min?: number;
  type?: string;
}) {
  const length = value.trim().length;
  const isError = length > 0 && length < min;
  const isValid = length >= min;

  return (
    <div className="space-y-1">
      <input
        type={type}
        value={value}
        disabled={disabled}
        readOnly={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full rounded-2xl px-4 py-3
          text-sm sm:text-base
          bg-white dark:bg-slate-800
          border transition
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

      {/* INFO BAWAH */}
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

function Textarea({
  value,
  onChange,
  disabled,
  min = 50,
  optional = false,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  min?: number;
  optional?: boolean;
}) {
  const length = value.trim().length;

  const isError = !optional && length > 0 && length < min;

  const isValid = !optional && length >= min;

  return (
    <div className="space-y-1">
      <textarea
        value={value}
        disabled={disabled}
        rows={4}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full resize-y max-h-[40vh]
          rounded-xl px-3 py-2
          text-sm sm:text-base
          bg-white dark:bg-slate-800
          border transition
          focus:outline-none focus:ring-2
          ${
            optional
              ? "border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
              : isError
                ? "border-red-400 focus:ring-red-400"
                : isValid
                  ? "border-emerald-400 focus:ring-emerald-400"
                  : "border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
          }
        `}
      />

      {/* INFO BAWAH */}
      {!optional && (
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
      )}
    </div>
  );
}

function TextBlock({ value }: { value: string }) {
  return (
    <div
      className="
        w-full
        rounded-xl
        border
        px-4 py-3
        text-sm sm:text-base
        leading-relaxed
        whitespace-pre-line
        text-justify

        bg-white
        border-slate-200
        text-slate-800

        dark:bg-slate-800/80
        dark:border-slate-700
        dark:text-slate-200
        
        shadow-sm
      "
    >
      {value || <span className="text-slate-400">-</span>}
    </div>
  );
}
