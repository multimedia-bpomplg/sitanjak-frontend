"use client";

import { useEffect, useState } from "react";
import { showToast } from "@/components/ui/toastDashboard";

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
          },
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

  const MIN_TEXT = 50;

  const isTextValid = (text: string) => text.trim().length >= MIN_TEXT;

  /* ================= VALIDASI ================= */
  const submitDisabled =
    readonly ||
    !agree ||
    !isTextValid(ringkasan) ||
    !isTextValid(pencapaian) ||
    !isTextValid(kendala) ||
    !isTextValid(rencana);

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (readonly || submitDisabled) return;

    const toastId = showToast.loading("Menyimpan laporan bulanan...");

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
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Gagal menyimpan laporan bulanan");
      }

      // ✅ SUCCESS TOAST
      showToast.updateSuccess(toastId, "🎉Laporan bulanan berhasil dikirim!");

      setShowConfirm(false);

      setTimeout(() => {
        onClose(true);
      }, 1200);
    } catch (err: any) {
      // ❌ ERROR TOAST
      showToast.updateError(
        toastId,
        err.message || "Terjadi kesalahan saat menyimpan laporan",
      );
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
                {mode === "view"
                  ? "Detail Laporan Bulanan"
                  : "Isi Laporan Bulanan"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Periode: <span className="font-medium">{month}</span>
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
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-6 space-y-6">
          <Field label="Ringkasan Aktivitas Bulanan">
            {readonly ? (
              <TextBlock value={ringkasan} />
            ) : (
              <Textarea
                value={ringkasan}
                onChange={setRingkasan}
                disabled={readonly}
              />
            )}
          </Field>

          <Field label="Pencapaian Utama">
            {readonly ? (
              <TextBlock value={pencapaian} />
            ) : (
              <Textarea
                value={pencapaian}
                onChange={setPencapaian}
                disabled={readonly}
              />
            )}
          </Field>

          <Field label="Kendala Selama Bulan Ini">
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

          <Field label="Rencana Kegiatan Bulan Berikutnya">
            {readonly ? (
              <TextBlock value={rencana} />
            ) : (
              <Textarea
                value={rencana}
                onChange={setRencana}
                disabled={readonly}
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
                Saya menyatakan laporan ini diisi dengan <b>jujur</b>,
                <b> benar</b>, dan saya <b>bertanggung jawab penuh</b>.
              </span>
            </button>
          )}
        </div>

        {/* APPROVAL */}
        {mode === "view" && approvedByMentor && (
          <div className="mx-6 mb-3 rounded-xl bg-emerald-50 border border-emerald-300 p-3 text-sm text-emerald-700">
            ✅ Laporan ini telah <b>disetujui oleh mentor</b>.
          </div>
        )}

        {/* FOOTER */}
        <div
          className="
            px-5 sm:px-6 py-4
            border-t border-slate-200 dark:border-slate-800
            bg-slate-50 dark:bg-slate-900
            flex justify-end gap-3
          "
        >
          <button
            onClick={() => onClose()}
            className="
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
                rounded-full px-6 py-2.5
                text-sm font-semibold text-white
                transition-all
                ${
                  submitDisabled
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg"
                }
              `}
            >
              Kirim Laporan Bulanan
            </button>
          )}
        </div>
      </div>

      {/* ================= KONFIRMASI ================= */}
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
                  Konfirmasi Pengiriman
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Pastikan laporan sudah benar
                </p>
              </div>
            </div>

            {/* BODY */}
            <div className="px-6 py-6 space-y-4">
              <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed">
                Apakah Anda yakin ingin mengirim laporan bulanan ini?
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

            {/* FOOTER */}
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
                ✅ Iya, Kirim
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

function Textarea({
  value,
  onChange,
  disabled,
  min = 50,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  min?: number;
}) {
  const length = value.trim().length;
  const isError = length > 0 && length < min;
  const isValid = length >= min;

  return (
    <div className="space-y-1">
      <textarea
        value={value}
        disabled={disabled}
        rows={4}
        onChange={(e) => {
          onChange(e.target.value);

          // auto-grow (tetap)
          e.target.style.height = "auto";
          e.target.style.height = e.target.scrollHeight + "px";
        }}
        className={`
          w-full
          resize-y             
          overflow-auto         
          max-h-[40vh]          
          rounded-xl px-3 py-2
          text-sm sm:text-base
          bg-white dark:bg-slate-800
          border
          transition
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
