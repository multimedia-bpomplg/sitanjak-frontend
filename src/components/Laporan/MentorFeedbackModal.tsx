"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Mail,
  MessageSquareHeart,
  RotateCcw,
  Send,
  Star,
  User,
  X,
} from "lucide-react";
import { showToast } from "@/components/ui/toastDashboard";

export type MentorFeedbackItem = {
  _id: string;
  month: string;
  feedbackMentor: string;
  status: string;
  mentorResponse?: string;
  mentorRespondedAt?: string;
  revisionNote?: string;
  revisionRequestedAt?: string | null;
  feedbackMentorSentAt?: string;
  createdAt?: string;
  isFeedbackMentorSent?: boolean;
  survey?: {
    kepuasanMagang?: number;
    rekomendasiProgram?: number;
    kemudahanProses?: number;
    peningkatanSkill?: number;
  };
  user?: {
    _id: string;
    name: string;
    email: string;
  };
};

type Props = {
  feedback: MentorFeedbackItem;
  onClose: () => void;
  onResponseSent?: () => void;
};

const QUICK_RESPONSES = [
  "Terima kasih atas feedback yang diberikan. Semoga ilmu selama magang bermanfaat.",
  "Masukan Anda sangat kami hargai dan akan menjadi bahan evaluasi bimbingan ke depan.",
  "Terima kasih, jika ada kendala selama magang silakan diskusikan langsung bersama kami.",
];

function formatMonthLabel(monthStr?: string): string {
  if (!monthStr) return "-";
  const match = /^(\d{4})-(\d{2})$/.exec(monthStr.trim());
  if (!match) return monthStr;
  const d = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  if (Number.isNaN(d.getTime())) return monthStr;
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MentorFeedbackModal({
  feedback,
  onClose,
  onResponseSent,
}: Props) {
  const [response, setResponse] = useState(
    feedback.mentorResponse || feedback.revisionNote || "",
  );
  const [submittingAction, setSubmittingAction] = useState<
    "Direspon" | "Revisi" | null
  >(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const isRevisionPending = feedback.status === "Revisi";
  const alreadyResponded =
    feedback.status === "Direspon" ||
    (!isRevisionPending && Boolean(feedback.mentorResponse?.trim()));

  const handleSubmit = async (actionStatus: "Direspon" | "Revisi") => {
    if (!response.trim()) {
      showToast.error(
        actionStatus === "Revisi"
          ? "Catatan revisi tidak boleh kosong"
          : "Tanggapan tidak boleh kosong",
      );
      return;
    }

    setSubmittingAction(actionStatus);
    const toastId = showToast.loading(
      actionStatus === "Revisi"
        ? "Mengirim permintaan revisi..."
        : "Mengirim tanggapan...",
    );

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/feedback/mentor/respond/${feedback._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            response: response.trim(),
            status: actionStatus,
          }),
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || "Gagal memproses feedback");
      }

      showToast.updateSuccess(
        toastId,
        actionStatus === "Revisi"
          ? "Permintaan revisi berhasil dikirim ke peserta"
          : "Tanggapan berhasil dikirim",
      );
      onResponseSent?.();

      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan";
      showToast.updateError(toastId, message);
    } finally {
      setSubmittingAction(null);
    }
  };

  const surveyItems = feedback.survey
    ? [
        { label: "Kepuasan Magang", value: feedback.survey.kepuasanMagang },
        { label: "Rekomendasi", value: feedback.survey.rekomendasiProgram },
        { label: "Kemudahan Proses", value: feedback.survey.kemudahanProses },
        { label: "Peningkatan Skill", value: feedback.survey.peningkatanSkill },
      ].filter((item) => typeof item.value === "number")
    : [];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-3xl bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= HEADER (TEMA BIRU SIDEBAR) ================= */}
        <div className="px-5 sm:px-6 py-4 bg-linear-to-r from-[#0284c7] via-sky-600 to-blue-700 dark:from-[#0369a1] dark:to-blue-900 text-white flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2.5 bg-white/20 rounded-xl shrink-0">
              <MessageSquareHeart className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold truncate">
                Feedback Peserta Bimbingan
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-sky-100">
                <span className="inline-flex items-center gap-1">
                  <User className="w-3.5 h-3.5 shrink-0" />
                  {feedback.user?.name || "Peserta"}
                </span>
                {feedback.user?.email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate max-w-52">
                      {feedback.user.email}
                    </span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  {formatMonthLabel(feedback.month)}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= BODY ================= */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5">
          {/* Survey Rating Ringkas (1–5 Bintang) */}
          {surveyItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {surveyItems.map((item) => {
                const score = Number(item.value || 0);
                return (
                  <div
                    key={item.label}
                    className="rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                        {item.label}
                      </p>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white shrink-0">
                        {score}/5
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= score
                              ? "text-amber-500 fill-amber-400"
                              : "text-slate-300 dark:text-slate-600"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Isi Feedback untuk Mentor */}
          <div className="rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Pesan / Masukan untuk Mentor
              </h3>
              <span className="text-[11px] text-slate-400">
                Dikirim:{" "}
                {formatDateTime(
                  feedback.feedbackMentorSentAt || feedback.createdAt,
                )}
              </span>
            </div>

            <p className="text-sm leading-relaxed whitespace-pre-line text-slate-800 dark:text-slate-200">
              {feedback.feedbackMentor || "-"}
            </p>
          </div>

          {/* Bagian Tanggapan / Revisi Mentor */}
          <div className="rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Tanggapan &amp; Penindakan Mentor
            </h3>

            {alreadyResponded ? (
              <div className="rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4" />
                    Tanggapan Telah Dikirim
                  </span>
                  {feedback.mentorRespondedAt && (
                    <span className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                      {formatDateTime(feedback.mentorRespondedAt)}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-line text-slate-800 dark:text-slate-200">
                  {feedback.mentorResponse}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {isRevisionPending && feedback.revisionNote && (
                  <div className="rounded-xl bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/70 p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-700 dark:text-orange-300">
                        <RotateCcw className="w-3.5 h-3.5" />
                        Menunggu Revisi Peserta
                      </span>
                      {feedback.revisionRequestedAt && (
                        <span className="text-[11px] text-orange-700/80 dark:text-orange-300/80">
                          {formatDateTime(feedback.revisionRequestedAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-orange-900 dark:text-orange-100 whitespace-pre-line">
                      {feedback.revisionNote}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {QUICK_RESPONSES.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setResponse(preset)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-50 hover:text-[#0284c7] dark:hover:bg-sky-950/60 dark:hover:text-sky-300 border border-slate-200 dark:border-slate-700 transition text-left"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>

                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={4}
                  placeholder="Tulis tanggapan akhir atau catatan perbaikan jika meminta revisi..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7] resize-none transition"
                />

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Pilih <b>Minta Revisi</b> jika peserta perlu memperbaiki
                  survei/ulasan, atau <b>Kirim Tanggapan</b> untuk menyelesaikan
                  review feedback.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ================= FOOTER ================= */}
        <div className="px-5 sm:px-6 py-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {alreadyResponded ? "Tutup" : "Batal"}
          </button>

          {!alreadyResponded && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleSubmit("Revisi")}
                disabled={submittingAction !== null || !response.trim()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {submittingAction === "Revisi"
                  ? "Mengirim Revisi..."
                  : "Minta Revisi"}
              </button>

              <button
                type="button"
                onClick={() => handleSubmit("Direspon")}
                disabled={submittingAction !== null || !response.trim()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-sky-700 text-white disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 transition"
              >
                <Send className="w-3.5 h-3.5" />
                {submittingAction === "Direspon"
                  ? "Mengirim..."
                  : "Kirim Tanggapan"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
