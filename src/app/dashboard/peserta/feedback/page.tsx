"use client";

import { useEffect, useState } from "react";
import FeedbackModal from "@/components/Laporan/FeedbackModal";

type Feedback = {
  _id: string;
  month: string;
  status: string;
  createdAt: string;

  mentorResponse?: string;
  mentorRespondedAt?: string;
  mentorRespondedBy?: {
    name: string;
    email: string;
  };
};

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);

  const [modalMode, setModalMode] = useState<"create" | "view">("create");
  const [showModal, setShowModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");

  const [mentorOpen, setMentorOpen] = useState(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : "";

  /* ================= AMBIL FEEDBACK ================= */
  const fetchFeedback = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/feedback/riwayat`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        setFeedback(data[0]);
      } else {
        setFeedback(null);
      }
    } catch {
      console.error("Gagal memuat feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  /* ================= OPEN MODAL ================= */
  const openModal = () => {
    if (feedback) {
      setSelectedMonth(feedback.month);
      setModalMode("view");
    } else {
      const now = new Date();

      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
        2,
        "0",
      )}`;

      setSelectedMonth(month);
      setModalMode("create");
    }

    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500">
        Memuat data feedback...
      </div>
    );
  }

  /* ================= STEP STATE ================= */
  const stepState = {
    filled: Boolean(feedback),
    responded: Boolean(feedback?.mentorResponse),
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto space-y-10">
      {/* ================= HERO ================= */}
      <div
        className="
          relative overflow-hidden
          rounded-3xl
          bg-linear-to-r
          from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
          dark:from-indigo-600 dark:via-purple-600 dark:to-fuchsia-600
          text-white
          px-6 sm:px-10 py-8
          shadow-xl
        "
      >
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/20 rounded-full blur-3xl" />

        <div className="relative space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
            💬 Feedback Program
          </h1>
          <p className="text-white/90 text-sm sm:text-base">
            Feedback hanya dapat dikirim <b>1 kali</b> selama program magang.
          </p>
        </div>
      </div>

      {/* ================= INFO ================= */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 p-4 text-sm text-blue-700 dark:text-blue-300">
        <div className="text-lg">💡</div>
        <p className="mt-1">Feedback yang sudah dikirim tidak dapat diubah kembali.</p>
      </div>

      {/* ================= PROGRESS STEP ================= */}
      <div
        className="
          rounded-2xl
          border
          border-slate-200 dark:border-slate-700
          bg-white dark:bg-slate-900
          p-5
          shadow-sm
        "
      >
        {/* MOBILE VERSION */}
        <div className="sm:hidden space-y-4">
          {[
            {
              label: "Belum Isi",
              active: !stepState.filled,
              done: stepState.filled,
            },
            {
              label: "Sudah Isi",
              active: stepState.filled && !stepState.responded,
              done: stepState.responded,
            },
            {
              label: "Mentor Respon",
              active: stepState.responded,
              done: stepState.responded,
            },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              {/* circle */}
              <div
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold
                  ${
                    step.done
                      ? "bg-emerald-500 text-white"
                      : step.active
                      ? "bg-amber-400 dark:bg-indigo-500 text-white"
                      : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                  }
                `}
              >
                {step.done ? "✓" : i + 1}
              </div>

              {/* label */}
              <span
                className={`
                  text-sm font-medium
                  ${
                    step.active || step.done
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-500 dark:text-slate-400"
                  }
                `}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* DESKTOP VERSION */}
        <div className="hidden sm:flex items-center justify-between">
          {[
            {
              label: "Belum Isi",
              active: !stepState.filled,
              done: stepState.filled,
            },
            {
              label: "Sudah Isi",
              active: stepState.filled && !stepState.responded,
              done: stepState.responded,
            },
            {
              label: "Mentor Respon",
              active: stepState.responded,
              done: stepState.responded,
            },
          ].map((step, i, arr) => (
            <div key={i} className="flex-1 flex items-center">
              {/* circle */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                  transition
                  ${
                    step.done
                      ? "bg-emerald-500 text-white"
                      : step.active
                      ? "bg-amber-400 dark:bg-indigo-500 text-white"
                      : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                  }
                `}
              >
                {step.done ? "✓" : i + 1}
              </div>

              {/* label */}
              <span
                className={`
                  ml-3 text-sm font-medium
                  ${
                    step.active || step.done
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-500 dark:text-slate-400"
                  }
                `}
              >
                {step.label}
              </span>

              {/* line */}
              {i < arr.length - 1 && (
                <div
                  className={`
                    flex-1 h-0.5 mx-4
                    ${
                      arr[i + 1].done || arr[i + 1].active
                        ? "bg-emerald-400"
                        : "bg-slate-300 dark:bg-slate-700"
                    }
                  `}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ================= STATUS CARD ================= */}
      <div
        className="
          relative
          rounded-3xl
          border
          border-slate-200 dark:border-slate-700
          bg-white dark:bg-slate-900
          shadow-xl
          p-6 sm:p-8
          space-y-6
        "
      >
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-400/10 rounded-full blur-3xl" />

        {feedback ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Status Feedback
                </p>

                <span className="mt-1 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                  ✅ Sudah Mengisi
                </span>
              </div>

              {feedback.mentorResponse ? (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                  💬 Sudah direspon mentor
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                  ⏳ Menunggu respon mentor
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="rounded-xl p-4 bg-slate-50 dark:bg-slate-800">
                <p className="text-xs text-slate-500">Periode</p>
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  {feedback.month}
                </p>
              </div>

              <div className="rounded-xl p-4 bg-slate-50 dark:bg-slate-800">
                <p className="text-xs text-slate-500">Tanggal Kirim</p>
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  {new Date(feedback.createdAt).toLocaleDateString("id-ID")}
                </p>
              </div>
            </div>

            <button
              onClick={openModal}
              className="w-full rounded-xl py-3 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 shadow-md hover:shadow-lg transition"
            >
              📄 Lihat Detail Feedback
            </button>
          </>
        ) : (
          <>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-linear-to-br from-[#FEE2E2] to-[#FEF3C7] text-[#B91C1C] dark:from-indigo-600/20 dark:to-violet-600/20 dark:text-indigo-300">
                ✍️
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Status
                </p>

                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                  ❌ Belum Mengisi
                </span>

                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Silakan isi feedback untuk membantu evaluasi program magang.
                </p>
              </div>
            </div>

            <button
              onClick={openModal}
              className="w-full rounded-xl py-3 font-semibold text-white bg-linear-to-r from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B] hover:shadow-xl transition dark:from-indigo-600 dark:to-violet-500"
            >
              ✍️ Isi Feedback Sekarang
            </button>
          </>
        )}
      </div>

      {/* ================= CATATAN MENTOR (DROPDOWN) ================= */}
      {feedback?.mentorResponse && (
        <div
          className="
            rounded-3xl
            border
            border-slate-200 dark:border-slate-700
            bg-white dark:bg-slate-900
            shadow-lg
            overflow-hidden
            transition
          "
        >
          {/* HEADER (CLICKABLE) */}
          <button
            onClick={() => setMentorOpen(!mentorOpen)}
            className="
              w-full
              flex items-center justify-between
              gap-4
              px-5 sm:px-7 py-4
              text-left
              hover:bg-slate-50 dark:hover:bg-slate-800/60
              transition
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  w-10 h-10
                  rounded-xl
                  flex items-center justify-center
                  text-sm font-bold
                  bg-amber-100 text-amber-600
                  dark:bg-indigo-800/40 dark:text-indigo-300
                "
              >
                {feedback.mentorRespondedBy?.name
                  ? feedback.mentorRespondedBy.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                  : "M"}
              </div>

              <div className="space-y-0.5">
                <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Catatan Mentor
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {feedback.mentorRespondedBy?.name || "Mentor"}
                </p>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-3">
              <span
                className="
                  hidden sm:inline-flex
                  text-[10px]
                  px-2.5 py-1
                  rounded-full
                  font-semibold
                  bg-emerald-100 text-emerald-700
                  dark:bg-emerald-500/20 dark:text-emerald-300
                "
              >
                Sudah Direspon
              </span>

              {/* arrow */}
              <div
                className={`
                  text-slate-400
                  transition-transform duration-300
                  ${mentorOpen ? "rotate-180" : ""}
                `}
              >
                ▼
              </div>
            </div>
          </button>

          {/* CONTENT */}
          <div
            className={`
              transition-all duration-300 ease-in-out
              ${mentorOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}
              overflow-hidden
            `}
          >
            <div className="px-5 sm:px-7 pb-5 space-y-4">
              <div
                className="
                  rounded-2xl
                  border
                  border-slate-200 dark:border-slate-700
                  bg-slate-50 dark:bg-slate-800
                  p-4 sm:p-5
                  text-sm sm:text-base
                  text-slate-700 dark:text-slate-200
                  leading-relaxed
                  whitespace-pre-line
                "
              >
                {feedback.mentorResponse}
              </div>

              {feedback.mentorRespondedAt && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Direspon pada{" "}
                  {new Date(
                    feedback.mentorRespondedAt
                  ).toLocaleDateString("id-ID")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL ================= */}
      {showModal && selectedMonth && (
        <FeedbackModal
          month={selectedMonth}
          mode={modalMode}
          onClose={(submitted) => {
            setShowModal(false);
            if (submitted) fetchFeedback();
          }}
        />
      )}
    </div>
  );
}