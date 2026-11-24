// src/components/Laporan/FeedbackModal.tsx
"use client";

import { useEffect, useState } from "react";
import {
  X,
  ClipboardCheck,
  AlertCircle,
  Building2,
  UserCheck,
  MessageSquare,
  Check,
  RotateCcw,
  ShieldAlert,
  Send,
  Star,
} from "lucide-react";
import { showToast } from "@/components/ui/toastDashboard";

type Props = {
  month: string;
  mode: "create" | "view" | "revise";
  feedbackId?: string;
  revisionNote?: string;
  onClose: (submitted?: boolean) => void;
};

export default function FeedbackModal({
  month,
  mode,
  feedbackId,
  revisionNote: initialRevisionNote,
  onClose,
}: Props) {
  const readonly = mode === "view";
  const isRevise = mode === "revise";

  const [loadedFeedbackId, setLoadedFeedbackId] = useState(feedbackId || "");
  const [feedbackBPOM, setFeedbackBPOM] = useState("");
  const [feedbackMentor, setFeedbackMentor] = useState("");
  const [mentorComment, setMentorComment] = useState("");
  const [revisionNote, setRevisionNote] = useState(initialRevisionNote || "");
  const [mentorCommentedBy, setMentorCommentedBy] = useState<{
    name?: string;
    email?: string;
  } | null>(null);
  const [isFeedbackMentorSent, setIsFeedbackMentorSent] = useState(false);

  const [agree, setAgree] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const MIN_TEXT = 30;
  const isTextValid = (text: string) => text.trim().length >= MIN_TEXT;

  const [kepuasanMagang, setKepuasanMagang] = useState(0);
  const [rekomendasiProgram, setRekomendasiProgram] = useState(0);
  const [kemudahanProses, setKemudahanProses] = useState(0);
  const [peningkatanSkill, setPeningkatanSkill] = useState(0);

  /* ================= FETCH (VIEW / REVISE MODE) ================= */
  useEffect(() => {
    if (mode !== "view" && mode !== "revise") return;

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
        if (data._id) setLoadedFeedbackId(data._id);
        setFeedbackBPOM(data.feedbackBPOM || "");
        setFeedbackMentor(data.feedbackMentor || "");
        setMentorComment(data.mentorResponse || data.mentorComment || "");
        setRevisionNote(data.revisionNote || initialRevisionNote || "");
        setMentorCommentedBy(
          data.mentorRespondedBy || data.mentorCommentedBy || null,
        );
        setIsFeedbackMentorSent(data.isFeedbackMentorSent || false);
        if (data.survey) {
          setKepuasanMagang(data.survey.kepuasanMagang || 0);
          setRekomendasiProgram(data.survey.rekomendasiProgram || 0);
          setKemudahanProses(data.survey.kemudahanProses || 0);
          setPeningkatanSkill(data.survey.peningkatanSkill || 0);
        }
      } catch {
        console.error("Gagal memuat feedback");
      }
    };

    fetchDetail();
  }, [mode, month, initialRevisionNote]);

  /* ================= SUBMIT FEEDBACK ================= */
  const handleSubmit = async () => {
    if (
      readonly ||
      !agree ||
      !isTextValid(feedbackBPOM) ||
      !isTextValid(feedbackMentor) ||
      kepuasanMagang === 0 ||
      rekomendasiProgram === 0 ||
      kemudahanProses === 0 ||
      peningkatanSkill === 0
    ) {
      showToast.error("Semua pertanyaan survei dan masukan wajib diisi");
      return;
    }

    setSubmitting(true);
    const toastId = showToast.loading(
      isRevise ? "Mengirim ulang revisi survei & feedback..." : "Mengirim survei & feedback...",
    );

    try {
      const targetId = feedbackId || loadedFeedbackId;
      if (isRevise && !targetId) {
        throw new Error("ID feedback tidak ditemukan");
      }

      const url = isRevise
        ? `${process.env.NEXT_PUBLIC_API_URL}/feedback/${targetId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/feedback`;
      const method = isRevise ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          month,
          kepuasanMagang,
          rekomendasiProgram,
          kemudahanProses,
          peningkatanSkill,
          feedbackBPOM,
          feedbackMentor,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Gagal mengirim feedback");
      }

      showToast.updateSuccess(
        toastId,
        isRevise
          ? "Revisi survei & feedback berhasil dikirim! ✅"
          : "Survei & feedback berhasil dikirim! ✅",
      );
      setShowConfirm(false);

      setTimeout(() => {
        onClose(true);
      }, 1200);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengirim feedback";
      showToast.updateError(toastId, message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalQuestions = 4;
  const answered = [
    kepuasanMagang,
    rekomendasiProgram,
    kemudahanProses,
    peningkatanSkill,
  ].filter((v) => v !== 0).length;
  const progress = Math.round((answered / totalQuestions) * 100);

  const canSubmit =
    !readonly &&
    agree &&
    answered === totalQuestions &&
    isTextValid(feedbackBPOM) &&
    isTextValid(feedbackMentor) &&
    !submitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-xs p-3 sm:p-5">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* ================= HEADER ================= */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1D64F2] dark:text-blue-400 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight"
                  style={{ fontWeight: 800 }}
                >
                  {readonly
                    ? "Detail Survei & Feedback"
                    : isRevise
                      ? "Revisi Survei & Feedback"
                      : "Isi Survei & Feedback"}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border ${
                    readonly
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                      : isRevise
                        ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800"
                        : "bg-blue-50 text-[#1D64F2] border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                  }`}
                >
                  {readonly
                    ? "Sudah Dikirim"
                    : isRevise
                      ? "Revisi"
                      : "Pengisian"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Periode Survei:{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {month}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onClose()}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= BODY ================= */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5 bg-[#F8FAFC] dark:bg-slate-950/50">
          {/* INFO PENTING / CATATAN REVISI */}
          {isRevise && revisionNote && (
            <div className="rounded-xl bg-orange-50/90 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/70 p-3.5 sm:p-4 text-orange-900 dark:text-orange-200">
              <div className="flex items-start gap-2.5">
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm leading-relaxed space-y-0.5">
                  <p className="font-bold" style={{ fontWeight: 700 }}>
                    Permintaan Revisi dari Mentor
                  </p>
                  <p className="text-orange-800 dark:text-orange-200/90 whitespace-pre-line">
                    {revisionNote}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!readonly && !isRevise && (
            <div className="rounded-xl bg-[#FFFBEB] dark:bg-amber-950/40 border border-[#FDE68A] dark:border-amber-800/70 p-3.5 sm:p-4 text-amber-900 dark:text-amber-200">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm leading-relaxed">
                  <p className="font-bold" style={{ fontWeight: 700 }}>
                    Perhatian
                  </p>
                  <p className="text-amber-800 dark:text-amber-200/90 mt-0.5">
                    Survei dan masukan akan langsung dikirim ke Balai Besar POM
                    di Palembang serta Mentor Anda.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* KOMENTAR MENTOR (HANYA DI VIEW MODE) */}
          {readonly && mentorComment && (
            <div className="rounded-xl bg-[#FFFBEB] dark:bg-amber-950/40 border border-[#FDE68A] dark:border-amber-800/70 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
                <MessageSquare className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Tanggapan Mentor
                  {mentorCommentedBy?.name
                    ? ` (${mentorCommentedBy.name})`
                    : ""}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-100 pl-6 whitespace-pre-line break-words [overflow-wrap:anywhere]">
                {mentorComment}
              </p>
            </div>
          )}

          {/* PROGRESS KUISIONER */}
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200"
                style={{ fontWeight: 700 }}
              >
                Kuisioner Pengalaman Magang
              </span>
              <span className="text-xs font-bold text-[#1D64F2] dark:text-blue-400">
                {answered}/{totalQuestions} Terjawab ({progress}%)
              </span>
            </div>

            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-linear-to-r from-[#1D64F2] to-[#3B82F6] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* DAFTAR 4 PERTANYAAN SURVEI */}
          <div className="space-y-3.5">
            <SurveyItem
              question="1. Seberapa mudah Anda memahami tampilan dan navigasi pada website SITANJAK?"
              value={kepuasanMagang}
              onChange={setKepuasanMagang}
              disabled={readonly}
            />

            <SurveyItem
              question="2. Seberapa mudah proses pendaftaran magang melalui website SITANJAK?"
              value={rekomendasiProgram}
              onChange={setRekomendasiProgram}
              disabled={readonly}
            />

            <SurveyItem
              question="3. Seberapa mudah menggunakan fitur pencatatan kegiatan harian (logbook) dan pengunggahan laporan akhir di website SITANJAK?"
              value={kemudahanProses}
              onChange={setKemudahanProses}
              disabled={readonly}
            />

            <SurveyItem
              question="4. Secara keseluruhan, seberapa puas Anda menggunakan website SITANJAK dan apakah Anda bersedia merekomendasikannya kepada teman atau peserta magang lainnya?"
              value={peningkatanSkill}
              onChange={setPeningkatanSkill}
              disabled={readonly}
            />
          </div>

          {/* MASUKAN UNTUK BBPOM */}
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1D64F2] dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <label
                  className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white"
                  style={{ fontWeight: 700 }}
                >
                  Masukan untuk BBPOM di Palembang
                </label>
              </div>
              <span className="text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-[#1D64F2] dark:text-blue-400 px-2 py-0.5 rounded-md">
                Wajib
              </span>
            </div>

            {readonly ? (
              <div className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-3.5 py-3 text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line break-words [overflow-wrap:anywhere]">
                {feedbackBPOM || <span className="text-slate-400">-</span>}
              </div>
            ) : (
              <Textarea
                value={feedbackBPOM}
                onChange={setFeedbackBPOM}
                placeholder="Tuliskan saran, kritik, atau masukan untuk program magang di Balai Besar POM di Palembang..."
                min={MIN_TEXT}
              />
            )}
          </div>

          {/* MASUKAN UNTUK MENTOR */}
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1D64F2] dark:text-blue-400 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <label
                  className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white"
                  style={{ fontWeight: 700 }}
                >
                  Masukan untuk Pembimbing / Mentor
                </label>
              </div>
              <span className="text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-[#1D64F2] dark:text-blue-400 px-2 py-0.5 rounded-md">
                Wajib
              </span>
            </div>

            {readonly ? (
              <div className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-3.5 py-3 text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line break-words [overflow-wrap:anywhere]">
                {feedbackMentor || <span className="text-slate-400">-</span>}

                {isFeedbackMentorSent && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-700">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                      <Check className="w-3.5 h-3.5" />
                      <span>Feedback telah diteruskan ke Mentor</span>
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <Textarea
                value={feedbackMentor}
                onChange={setFeedbackMentor}
                placeholder="Tuliskan apresiasi, kesan, atau masukan untuk pembimbing/mentor Anda..."
                min={MIN_TEXT}
              />
            )}
          </div>

          {/* PERNYATAAN */}
          {!readonly && (
            <button
              type="button"
              onClick={() => setAgree(!agree)}
              className={`w-full flex items-start gap-3 rounded-xl border p-3.5 text-left transition ${
                agree
                  ? "border-[#1D64F2] bg-blue-50/50 dark:bg-blue-950/30"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              }`}
            >
              <span
                className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${
                  agree
                    ? "border-[#1D64F2] bg-[#1D64F2] text-white"
                    : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                }`}
              >
                {agree && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
              </span>

              <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                Saya menyatakan bahwa survei dan masukan ini diisi secara{" "}
                <b>jujur</b>, <b>objektif</b>, dan <b>bertanggung jawab</b>.
              </span>
            </button>
          )}
        </div>

        {/* ================= FOOTER ================= */}
        <div className="px-5 sm:px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
          <button
            type="button"
            onClick={() => onClose()}
            disabled={submitting}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition disabled:opacity-50"
          >
            {readonly ? "Tutup" : "Batal"}
          </button>

          {!readonly && (
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => setShowConfirm(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#1D64F2] hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed shadow-2xs transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>
                {submitting
                  ? "Mengirim..."
                  : isRevise
                    ? "Kirim Revisi Survei"
                    : "Kirim Survei & Feedback"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ================= KONFIRMASI KIRIM ================= */}
      {showConfirm && (
        <ConfirmDialog
          title={
            isRevise
              ? "Konfirmasi Pengiriman Revisi Survei"
              : "Konfirmasi Pengiriman Survei"
          }
          message={
            isRevise
              ? "Apakah Anda yakin ingin mengirim ulang hasil revisi survei dan feedback ini?"
              : "Apakah Anda yakin ingin mengirim survei dan feedback ini?"
          }
          warning="Survei dan masukan akan langsung dikirim ke Balai Besar POM di Palembang serta Mentor Anda."
          confirmText={isRevise ? "Ya, Kirim Revisi" : "Ya, Kirim Sekarang"}
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
    <div className="space-y-1.5">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className={`w-full resize-y overflow-auto max-h-[35vh] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/60 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 border transition focus:outline-none focus:ring-2 ${
          isError
            ? "border-red-400 focus:ring-red-400/30"
            : isValid
              ? "border-emerald-400 focus:ring-emerald-400/30"
              : "border-slate-200 dark:border-slate-700 focus:border-[#1D64F2] focus:ring-[#1D64F2]/20"
        }`}
      />

      <div className="flex items-center justify-between text-[11px] sm:text-xs">
        <div>
          {isError && (
            <span className="text-red-500 font-medium">
              Minimal {min} karakter (kurang {min - length} karakter)
            </span>
          )}
          {isValid && (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              ✓ Jumlah karakter sudah memenuhi
            </span>
          )}
          {!isError && !isValid && (
            <span className="text-slate-400">Minimal {min} karakter</span>
          )}
        </div>
        <span className="text-slate-400 font-medium">
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
  confirmText = "Ya, Kirim Sekarang",
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
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3
              className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white"
              style={{ fontWeight: 800 }}
            >
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {warning && (
          <div className="rounded-xl bg-[#FFFBEB] dark:bg-amber-950/40 border border-[#FDE68A] dark:border-amber-800/70 px-3.5 py-2.5 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            {warning}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
          >
            Periksa Kembali
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#1D64F2] hover:bg-blue-700 shadow-2xs transition"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= COMPONENT SURVEY ITEM ================= */
function SurveyItem({
  question,
  value,
  onChange,
  disabled = false,
}: {
  question: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const labels = ["Sangat Buruk", "Buruk", "Cukup", "Baik", "Sangat Baik"];

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
      <p
        className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed"
        style={{ fontWeight: 700 }}
      >
        {question}
      </p>

      <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
        {labels.map((label, i) => {
          const score = i + 1;
          const active = value === score;
          const isFilled = value >= score;

          return (
            <button
              key={score}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onChange(score)}
              className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border transition ${
                active
                  ? "border-2 border-[#1D64F2] bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-400 text-[#1D64F2] dark:text-blue-300 shadow-2xs"
                  : isFilled
                    ? "border-amber-200/90 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20 text-slate-700 dark:text-slate-200"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:border-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800"
              } ${disabled ? "cursor-default" : "cursor-pointer"}`}
            >
              <Star
                className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                  isFilled
                    ? "text-amber-400 fill-amber-400"
                    : "text-slate-300 dark:text-slate-600"
                }`}
              />
              <span
                className={`text-[10px] sm:text-xs mt-1.5 text-center leading-tight ${
                  active ? "font-bold" : "font-medium"
                }`}
                style={{ fontWeight: active ? 700 : 500 }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
