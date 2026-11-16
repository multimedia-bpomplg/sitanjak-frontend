"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  MessageSquareHeart,
  Star,
  User,
  X,
} from "lucide-react";

export type AdminFeedbackItem = {
  _id: string;
  month: string;
  survey?: {
    kepuasanMagang?: number;
    rekomendasiProgram?: number;
    kemudahanProses?: number;
    peningkatanSkill?: number;
  };
  feedbackBPOM?: string;
  feedbackMentor?: string;
  isFeedbackMentorSent?: boolean;
  status: string;
  mentorResponse?: string;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
  mentorRespondedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  feedbackMentorSentAt?: string;
  mentorRespondedAt?: string;
  createdAt: string;
};

type Props = {
  pesertaName: string;
  pesertaEmail: string;
  feedbacks: AdminFeedbackItem[];
  onClose: () => void;
};

const SURVEY_LABELS: Array<{
  key: keyof NonNullable<AdminFeedbackItem["survey"]>;
  label: string;
}> = [
  { key: "kepuasanMagang", label: "Kepuasan Magang" },
  { key: "rekomendasiProgram", label: "Rekomendasi Program" },
  { key: "kemudahanProses", label: "Kemudahan Proses" },
  { key: "peningkatanSkill", label: "Peningkatan Skill" },
];

function formatMonthLabel(monthStr?: string): string {
  if (!monthStr) return "-";
  const match = /^(\d{4})-(\d{2})$/.exec(monthStr.trim());
  if (!match) return monthStr;
  const d = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  if (Number.isNaN(d.getTime())) return monthStr;
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

function getAverageRating(survey?: AdminFeedbackItem["survey"]): number {
  if (!survey) return 0;
  const values = [
    survey.kepuasanMagang,
    survey.rekomendasiProgram,
    survey.kemudahanProses,
    survey.peningkatanSkill,
  ].filter((n): n is number => typeof n === "number" && n > 0);
  if (values.length === 0) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

export default function AdminFeedbackModal({
  pesertaName,
  pesertaEmail,
  feedbacks,
  onClose,
}: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const current = feedbacks[selectedIndex] || feedbacks[0];

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!current) return null;

  const avg = getAverageRating(current.survey);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl max-h-[90vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-[#0284c7] to-blue-700 px-6 py-4 text-white flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <MessageSquareHeart className="w-5 h-5 shrink-0" />
              <h2 className="text-lg font-bold">Detail Feedback Peserta</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-[#0284c7]">
                {feedbacks.length} Laporan Bulanan
              </span>
            </div>
            <p className="text-xs text-sky-100 mt-1 truncate">
              {pesertaName} • {pesertaEmail}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail feedback"
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selector Bulan Feedback */}
        {feedbacks.length > 1 && (
          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
              Pilih Bulan:
            </span>
            {feedbacks.map((fb, idx) => {
              const active = idx === selectedIndex;
              return (
                <button
                  key={fb._id}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    active
                      ? "bg-[#0284c7] text-white shadow-xs"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {formatMonthLabel(fb.month)}
                </button>
              );
            })}
          </div>
        )}

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {/* Top Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-white">
                <Calendar className="w-4 h-4 text-[#0284c7]" />
                {formatMonthLabel(current.month)}
              </span>
              <span className="inline-flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {pesertaName}
              </span>
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {pesertaEmail}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {current.mentorResponse ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Sudah Direspon Mentor
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
                  <Clock className="w-3.5 h-3.5" />
                  Menunggu Respon Mentor
                </span>
              )}
            </div>
          </div>

          {/* 4 Aspek Rating Bintang (1-5) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Penilaian Survei Program
              </h3>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                Rata-rata {avg.toFixed(1)} / 5.0
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SURVEY_LABELS.map((item) => {
                const score = Number(current.survey?.[item.key] || 0);
                return (
                  <div
                    key={item.key}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2"
                  >
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {item.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= score
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-200 dark:text-slate-700"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 ml-1">
                        {score}/5
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback untuk BPOM & Mentor */}
          <div className="grid grid-cols-1 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <p className="text-xs font-semibold text-[#0284c7] dark:text-sky-400 uppercase mb-1.5">
                Feedback untuk Instansi (BPOM)
              </p>
              <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {current.feedbackBPOM || "-"}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <p className="text-xs font-semibold text-[#0284c7] dark:text-sky-400 uppercase mb-1.5">
                Feedback untuk Mentor Pembimbing
              </p>
              <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {current.feedbackMentor || "-"}
              </p>
            </div>

            {current.mentorResponse && (
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase mb-1.5">
                  Respon Mentor ({current.mentorRespondedBy?.name || "Mentor"})
                </p>
                <p className="text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
                  {current.mentorResponse}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
