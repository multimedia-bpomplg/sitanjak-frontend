// components/Feedback/MentorFeedbackModal.tsx
"use client";

import { useState } from "react";
import {
  FiX,
  FiUser,
  FiMail,
  FiCalendar,
  FiSend,
  FiCheckCircle,
} from "react-icons/fi";
import { showToast } from "@/components/ui/toastDashboard";

type Props = {
  feedback: any;
  onClose: () => void;
  onResponseSent?: () => void;
};

export default function MentorFeedbackModal({
  feedback,
  onClose,
  onResponseSent,
}: Props) {
  const [response, setResponse] = useState(feedback.mentorResponse || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!response.trim()) {
      showToast.error("Response tidak boleh kosong");
      return;
    }

    setIsSubmitting(true);
    const toastId = showToast.loading("Mengirim response...");

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
          body: JSON.stringify({ response }),
        },
      );

      if (!res.ok) {
        throw new Error("Gagal mengirim response");
      }

      showToast.updateSuccess(toastId, "✅ Response berhasil dikirim!");

      if (onResponseSent) {
        onResponseSent();
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      showToast.updateError(toastId, error.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-3xl bg-white/90 dark:bg-white/5 backdrop-blur rounded-3xl border border-slate-200 dark:border-indigo-500/30 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* HEADER */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 bg-linear-to-r from-[#FCA5A5] via-[#FDE68A] to-[#FFF7ED] dark:from-indigo-800 dark:via-indigo-700 dark:to-indigo-900 text-slate-900 dark:text-white flex items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="p-2 bg-white/20 rounded-xl shrink-0">
              <FiCalendar className="text-xl" />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold leading-tight truncate">
                Feedback dari Peserta
              </h2>

              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm opacity-90">
                <div className="flex items-center gap-1 min-w-0">
                  <FiUser className="shrink-0" />
                  <span className="truncate">{feedback.user?.name}</span>
                </div>

                <div className="flex items-center gap-1 min-w-0">
                  <FiMail className="shrink-0" />
                  <span className="truncate max-w-55 sm:max-w-none">
                    {feedback.user?.email}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <FiCalendar className="shrink-0" />
                  <span>{feedback.month}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
          {/* FEEDBACK CARD */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">💬</span>
              <h3 className="font-bold text-slate-800 dark:text-indigo-200">
                Feedback dari Peserta
              </h3>
            </div>

            <div className="p-5 rounded-2xl bg-white/80 dark:bg-indigo-950/40 border border-amber-400/30 dark:border-indigo-500/30 shadow-sm">
              <p className="text-sm leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-200">
                {feedback.feedbackMentor}
              </p>

              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-indigo-500/30 text-xs text-slate-500">
                Dikirim:{" "}
                {new Date(feedback.feedbackMentorSentAt).toLocaleString(
                  "id-ID",
                )}
              </div>
            </div>
          </div>

          {/* RESPONSE SECTION */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">✍️</span>
              <h3 className="font-bold text-slate-800 dark:text-indigo-200">
                Response Mentor
              </h3>
            </div>

            {feedback.mentorResponse ? (
              <div className="p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-400/30">
                <div className="flex items-start gap-3">
                  <FiCheckCircle className="text-emerald-600 text-xl mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                      Response telah dikirim
                    </p>
                    <p className="text-sm mt-2 whitespace-pre-line text-slate-700 dark:text-slate-200">
                      {feedback.mentorResponse}
                    </p>
                    <p className="text-xs mt-3 text-slate-500">
                      {new Date(feedback.mentorRespondedAt).toLocaleString(
                        "id-ID",
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={6}
                  className="
                    w-full px-4 py-3
                    rounded-xl
                    bg-white dark:bg-white/5
                    border border-amber-400/70 dark:border-indigo-500/60
                    text-slate-700 dark:text-slate-100
                    placeholder:text-slate-400
                    focus:ring-2 focus:ring-amber-300 dark:focus:ring-indigo-500/60
                    outline-none
                    transition
                    resize-none
                  "
                  placeholder="Tulis response Anda untuk peserta..."
                />

                <div className="text-xs text-slate-500">
                  Response Anda akan dikirimkan ke peserta dan ditampilkan di
                  dashboard mereka.
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
                  <button
                    onClick={onClose}
                    className="
                      px-5 py-2.5
                      rounded-xl
                      border border-slate-300
                      text-slate-600 dark:text-slate-300
                      hover:bg-slate-100 dark:hover:bg-white/10
                      transition
                    "
                  >
                    Batal
                  </button>

                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !response.trim()}
                    className={`
                      px-6 py-2.5
                      rounded-xl
                      flex items-center justify-center gap-2
                      text-white font-semibold
                      shadow-md hover:shadow-xl
                      transition-all duration-300
                      ${
                        isSubmitting || !response.trim()
                          ? "bg-slate-400 cursor-not-allowed"
                          : "bg-emerald-600 hover:bg-emerald-700"
                      }
                    `}
                  >
                    <FiSend />
                    {isSubmitting ? "Mengirim..." : "Kirim Response"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
