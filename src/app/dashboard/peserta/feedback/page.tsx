"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  MessageSquare,
  Lock,
} from "lucide-react";
import FeedbackModal from "@/components/Laporan/FeedbackModal";
import { PesertaDashboardSkeleton } from "@/components/dashboard/skeletons";
import { showToast } from "@/components/ui/toastDashboard";

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
  const [laporanStatus, setLaporanStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<"create" | "view">("create");
  const [showModal, setShowModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || "";
      const headers = { Authorization: `Bearer ${token}` };

      const [fbRes, lapRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/feedback/riwayat`, {
          headers,
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/laporan-akhir`, {
          headers,
        }).catch(() => null),
      ]);

      const data = fbRes.ok ? await fbRes.json() : [];
      if (Array.isArray(data) && data.length > 0) {
        setFeedback(data[0]);
      } else {
        setFeedback(null);
      }

      if (lapRes && lapRes.ok) {
        const lapData = await lapRes.json().catch(() => null);
        setLaporanStatus(lapData?.status || null);
      } else {
        setLaporanStatus(null);
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

  const isLaporanApproved = laporanStatus === "Disetujui";

  const openModal = () => {
    if (!feedback && !isLaporanApproved) {
      showToast.error(
        "Survei dan feedback hanya dapat diisi setelah Laporan Akhir disetujui oleh Mentor.",
      );
      return;
    }

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
    return <PesertaDashboardSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pt-1">
        <Link
          href="/dashboard/peserta/laporan-akhir"
          className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            Survei & Feedback Program
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Survei hanya dapat dikirim 1 kali selama program magang.
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Status Survei</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {feedback ? "Sudah Mengisi" : "Belum Mengisi"}
              </p>
            </div>
          </div>

          {feedback ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" />
              <span>Terkirim</span>
            </span>
          ) : isLaporanApproved ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-3 h-3" />
              <span>Belum Diisi</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600">
              <Lock className="w-3 h-3" />
              <span>Terkunci</span>
            </span>
          )}
        </div>

        {feedback ? (
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700/70">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Periode</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {feedback.month}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Tanggal Kirim</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {new Date(feedback.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            {feedback.mentorResponse && (
              <div className="rounded-xl bg-[#FFFBEB] dark:bg-amber-950/40 border border-[#FDE68A] dark:border-amber-800/70 p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    Catatan Mentor (
                    {feedback.mentorRespondedBy?.name || "Mentor"})
                  </span>
                </div>
                <p className="text-xs text-amber-900 dark:text-amber-100 pl-5 whitespace-pre-line break-words [overflow-wrap:anywhere]">
                  {feedback.mentorResponse}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={openModal}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold text-xs transition"
            >
              Lihat Detail Survei
            </button>
          </div>
        ) : !isLaporanApproved ? (
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700/70">
            <div className="rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 p-3.5 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              Survei dan feedback baru dapat diisi setelah <b>Laporan Akhir</b> Anda diunggah dan berstatus <b>Disetujui</b> oleh Mentor
              {laporanStatus ? ` (Status saat ini: ${laporanStatus})` : ""}.
            </div>
            <Link
              href="/dashboard/peserta/laporan-akhir"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs transition inline-flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Kembali ke Halaman Perkembangan Magang</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700/70">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Silakan isi survei dan ulasan untuk membantu evaluasi program
              magang di Balai Besar POM di Palembang.
            </p>
            <button
              type="button"
              onClick={openModal}
              className="w-full py-2.5 px-4 rounded-xl bg-[#1D64F2] hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
            >
              Isi Survei Sekarang
            </button>
          </div>
        )}
      </div>

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
