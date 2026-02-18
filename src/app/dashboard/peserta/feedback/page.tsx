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

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto space-y-8">
      {/* ================= HEADER ================= */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          💬 Feedback
        </h1>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Feedback hanya dapat dikirim <b>1 kali</b> selama program magang.
        </p>
      </div>

      {/* ================= STATUS CARD ================= */}
      <div className="rounded-2xl border bg-white dark:bg-slate-900 shadow p-6 space-y-5">
        {feedback ? (
          <>
            {/* STATUS */}
            <div className="space-y-2">
              <p className="text-sm text-slate-500">Status Feedback</p>

              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-emerald-100 text-emerald-700">
                ✅ Sudah Mengisi
              </span>
            </div>

            {/* INFO */}
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Periode</p>
                <p className="font-semibold">{feedback.month}</p>
              </div>

              <div>
                <p className="text-slate-500">Tanggal Kirim</p>
                <p className="font-semibold">
                  {new Date(feedback.createdAt).toLocaleDateString("id-ID")}
                </p>
              </div>
            </div>

            {/* STATUS MENTOR */}
            <div className="space-y-2 pt-2 border-t">
              <p className="text-sm text-slate-500">Status Mentor</p>

              {feedback.mentorResponse ? (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-emerald-100 text-emerald-700">
                  💬 Sudah Merespon
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-700">
                  ⏳ Belum Merespon
                </span>
              )}
            </div>

            {/* BUTTON */}
            <button
              onClick={openModal}
              className="
                w-full mt-2
                rounded-xl py-3
                font-semibold text-white
                bg-emerald-600 hover:bg-emerald-700
                shadow-md
                transition
              "
            >
              📄 Lihat Detail Feedback
            </button>
          </>
        ) : (
          <>
            {/* BELUM ADA */}
            <div className="space-y-2">
              <p className="text-sm text-slate-500">Status</p>

              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-700">
                ❌ Belum Mengisi
              </span>
            </div>

            <p className="text-sm text-slate-600">
              Silakan isi feedback Anda untuk membantu evaluasi program magang.
            </p>

            <button
              onClick={openModal}
              className="
                w-full mt-4
                rounded-xl py-3
                font-semibold text-white
                bg-linear-to-r
                from-[#7F1D1D]
                via-[#B91C1C]
                to-[#F59E0B]
                hover:shadow-lg
                transition
              "
            >
              ✍️ Isi Feedback Sekarang
            </button>
          </>
        )}
      </div>

      {/* ================= KOMENTAR MENTOR ================= */}
      {feedback?.mentorResponse && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 font-semibold text-emerald-700">
            💬 Komentar Mentor
          </div>

          <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
            {feedback.mentorResponse}
          </p>

          <div className="pt-2 border-t text-xs text-slate-500">
            {feedback.mentorRespondedBy?.name && (
              <span>Oleh: {feedback.mentorRespondedBy.name}</span>
            )}

            {feedback.mentorRespondedAt && (
              <span className="ml-2">
                •{" "}
                {new Date(feedback.mentorRespondedAt).toLocaleDateString(
                  "id-ID",
                )}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ================= INFO ================= */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-700">
        💡 Feedback yang sudah dikirim tidak dapat diubah kembali.
      </div>

      {/* ================= MODAL ================= */}
      {showModal && selectedMonth && (
        <FeedbackModal
          month={selectedMonth}
          mode={modalMode}
          onClose={(submitted) => {
            setShowModal(false);

            if (submitted) {
              fetchFeedback();
            }
          }}
        />
      )}
    </div>
  );
}
