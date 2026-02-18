// D:\Projek BPOM\frontend-bpom\src\components\Feedback\FeedbackModal.tsx
"use client";

import { useEffect, useState } from "react";
import { showToast } from "@/components/ui/toastDashboard";
import { FiAlertCircle } from "react-icons/fi";

type Props = {
  month: string;
  mode: "create" | "view";
  onClose: (submitted?: boolean) => void;
};

export default function FeedbackModal({ month, mode, onClose }: Props) {
  const readonly = mode === "view";

  const [feedbackBPOM, setFeedbackBPOM] = useState("");
  const [feedbackMentor, setFeedbackMentor] = useState("");
  const [mentorComment, setMentorComment] = useState("");
  const [mentorCommentedBy, setMentorCommentedBy] = useState<any>(null);
  const [isFeedbackMentorSent, setIsFeedbackMentorSent] = useState(false);

  const [agree, setAgree] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const MIN_TEXT = 30;

  const isTextValid = (text: string) => text.trim().length >= MIN_TEXT;

  /* ================= FETCH (VIEW MODE) ================= */
  useEffect(() => {
    if (mode !== "view") return;

    const fetchDetail = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/feedback/${month}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        if (!res.ok) return;

        const data = await res.json();
        setFeedbackBPOM(data.feedbackBPOM || "");
        setFeedbackMentor(data.feedbackMentor || "");
        setMentorComment(data.mentorComment || "");
        setMentorCommentedBy(data.mentorCommentedBy || null);
        setIsFeedbackMentorSent(data.isFeedbackMentorSent || false);
      } catch {
        console.error("Gagal memuat feedback");
      }
    };

    fetchDetail();
  }, [mode, month]);

  /* ================= SUBMIT FEEDBACK ================= */
  const handleSubmit = async () => {
    if (
      readonly ||
      !agree ||
      !isTextValid(feedbackBPOM) ||
      !isTextValid(feedbackMentor)
    )
      return;

    const toastId = showToast.loading("Mengirim feedback...");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          month,
          feedbackBPOM,
          feedbackMentor,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Gagal mengirim feedback");
      }

      showToast.updateSuccess(toastId, "✅ Feedback berhasil dikirim!");
      setShowConfirm(false);

      setTimeout(() => {
        onClose(true);
      }, 1200);
    } catch (err: any) {
      showToast.updateError(
        toastId,
        err.message || "Terjadi kesalahan saat mengirim feedback",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-6">
      <div
        className="
          w-full max-w-4xl
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
                {mode === "view" ? "Detail Feedback" : "Kirim Feedback"}
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
              {mode === "view" ? "SUDAH DIKIRIM" : "PENGISIAN"}
            </span>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-6 space-y-6">
          {/* INFO PENTING */}
          {mode === "create" && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-700">
              <div className="flex items-start gap-3">
                <FiAlertCircle className="text-xl shrink-0 mt-0.5" />
                <div>
                  <b>Perhatian:</b> Feedback akan langsung dikirim ke BPOM dan
                  mentor Anda. <b>Tidak dapat diubah setelah dikirim!</b>
                </div>
              </div>
            </div>
          )}

          {/* KOMENTAR MENTOR (HANYA DI VIEW MODE) */}
          {mode === "view" && mentorComment && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700">
              <div className="flex items-start gap-3">
                <span className="text-lg">💬</span>
                <div>
                  <b>Komentar dari Mentor:</b>
                  {mentorCommentedBy && (
                    <p className="text-xs text-emerald-600 mt-1">
                      — {mentorCommentedBy.name}
                    </p>
                  )}
                  <p className="mt-2 whitespace-pre-line">{mentorComment}</p>
                </div>
              </div>
            </div>
          )}

          {/* FEEDBACK UNTUK BPOM */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏛️</span>
              <label className="font-extrabold text-slate-800 dark:text-slate-100">
                Feedback untuk BPOM
              </label>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                Wajib
              </span>
            </div>

            {readonly ? (
              <div
                className="
                  w-full rounded-xl border px-4 py-3
                  text-sm leading-relaxed whitespace-pre-line
                  bg-white border-slate-200 text-slate-800
                  dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-200
                "
              >
                {feedbackBPOM || <span className="text-slate-400">-</span>}
              </div>
            ) : (
              <Textarea
                value={feedbackBPOM}
                onChange={setFeedbackBPOM}
                placeholder="Saran, kritik, atau masukan untuk program magang BPOM..."
                min={MIN_TEXT}
              />
            )}
          </div>

          {/* FEEDBACK UNTUK MENTOR */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">👨‍🏫</span>
              <label className="font-extrabold text-slate-800 dark:text-slate-100">
                Feedback untuk Mentor
              </label>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                Wajib
              </span>
            </div>

            {readonly ? (
              <div
                className="
                  w-full rounded-xl border px-4 py-3
                  text-sm leading-relaxed whitespace-pre-line
                  bg-white border-slate-200 text-slate-800
                  dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-200
                "
              >
                {feedbackMentor || <span className="text-slate-400">-</span>}

                {/* Tampilkan status pengiriman ke mentor */}
                {isFeedbackMentorSent && (
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                      ✅ Feedback telah dikirim ke mentor
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <Textarea
                value={feedbackMentor}
                onChange={setFeedbackMentor}
                placeholder="Apresiasi, saran, atau masukan untuk mentor Anda..."
                min={MIN_TEXT}
              />
            )}
          </div>

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
                Saya menyatakan feedback ini diisi dengan <b>jujur</b> dan{" "}
                <b>bertanggung jawab</b>.
              </span>
            </button>
          )}
        </div>

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
              disabled={
                !agree ||
                !isTextValid(feedbackBPOM) ||
                !isTextValid(feedbackMentor)
              }
              onClick={() => setShowConfirm(true)}
              className={`
                rounded-full px-6 py-2.5
                text-sm font-semibold text-white
                transition-all
                ${
                  !agree ||
                  !isTextValid(feedbackBPOM) ||
                  !isTextValid(feedbackMentor)
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg"
                }
              `}
            >
              Kirim Feedback
            </button>
          )}
        </div>
      </div>

      {/* ================= KONFIRMASI KIRIM ================= */}
      {showConfirm && (
        <ConfirmDialog
          title="Konfirmasi Pengiriman Feedback"
          message="Apakah Anda yakin ingin mengirim feedback ini?"
          warning="⚠️ Feedback akan langsung dikirim ke BPOM dan mentor Anda. TIDAK DAPAT DIUBAH setelah dikirim!"
          confirmText="Ya, Kirim Sekarang"
          onConfirm={handleSubmit}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}

/* ================= REUSABLE COMPONENTS ================= */

function Textarea({
  value,
  onChange,
  placeholder,
  min = 30,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  min?: number;
}) {
  const length = value.trim().length;
  const isError = length > 0 && length < min;
  const isValid = length >= min;

  return (
    <div className="space-y-1">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder={placeholder}
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

function ConfirmDialog({
  title,
  message,
  warning,
  confirmText = "Ya, Kirim",
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  warning?: string;
  confirmText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
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
        <div className="px-6 py-5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-white">
            {title}
          </h3>
        </div>

        <div className="px-6 py-6 space-y-4">
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed">
            {message}
          </p>

          {warning && (
            <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-200">
              {warning}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={onCancel}
            className="
              w-full sm:w-auto
              px-5 py-2.5
              rounded-full
              text-sm font-semibold
              text-slate-600 dark:text-slate-300
              border border-slate-300 dark:border-slate-700
              hover:bg-slate-100 dark:hover:bg-slate-700
              transition
            "
          >
            Batal
          </button>

          <button
            onClick={onConfirm}
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
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
