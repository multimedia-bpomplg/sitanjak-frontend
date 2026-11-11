"use client";

import { useEffect, useState } from "react";
import {
  HiDocumentText,
  HiUser,
  HiCalendar,
  HiCheckCircle,
  HiSearch,
  HiClock,
  HiDownload,
} from "react-icons/hi";
import { FiMessageCircle } from "react-icons/fi";
import SuperadminFeedbackDetailModal from "@/components/superadmin/SuperadminFeedbackDetailModal";
import { showToast } from "@/components/ui/toastDashboard";

type PesertaFeedback = {
  _id: string;
  name: string;
  email: string;
  totalFeedback: number;
  sentToMentor: number;
  notSentToMentor: number;
  responded: number;
  unresponded: number;
  feedbackMonths: string[];
  lastFeedbackDate: string | null;
};

type FeedbackDetail = {
  _id: string;
  month: string;
  survey: {
    kepuasanMagang: number;
    rekomendasiProgram: number;
    kemudahanProses: number;
    peningkatanSkill: number;
  };

  feedbackBPOM: string;
  feedbackMentor: string;
  isFeedbackMentorSent: boolean;
  status: string;
  mentorResponse?: string;
  user: {
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

export default function ViewFeedbackSuperadmin() {
  const [feedbackList, setFeedbackList] = useState<FeedbackDetail[]>([]);
  const [pesertaFeedback, setPesertaFeedback] = useState<PesertaFeedback[]>([]);
  const [filteredPeserta, setFilteredPeserta] = useState<PesertaFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedPeserta, setSelectedPeserta] =
    useState<PesertaFeedback | null>(null);
  const [selectedFeedback, setSelectedFeedback] =
    useState<FeedbackDetail | null>(null);
  const [statistics, setStatistics] = useState<any>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Load peserta summary
      const pesertaRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/feedback/peserta-summary`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (pesertaRes.ok) {
        const pesertaData = await pesertaRes.json();
        setPesertaFeedback(pesertaData);
        setFilteredPeserta(pesertaData);
      }

      // Load statistics
      const statsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/feedback/statistics`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStatistics(statsData);
      }

      // Load all feedback
      const feedbackRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/feedback`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (feedbackRes.ok) {
        const feedbackData = await feedbackRes.json();
        setFeedbackList(feedbackData);
      }
    } catch (error) {
      console.error("Gagal memuat data feedback", error);
    } finally {
      setLoading(false);
    }
  };

  const getFeedbackByPeserta = (pesertaId: string) => {
    return feedbackList.filter(
      (feedback) => feedback.user && feedback.user._id === pesertaId,
    );
  };

  const handleViewFeedback = (peserta: PesertaFeedback) => {
    const feedbackDetails = getFeedbackByPeserta(peserta._id).sort((a, b) => {
      const [yearA, monthA] = a.month.split("-").map(Number);
      const [yearB, monthB] = b.month.split("-").map(Number);
      if (yearA !== yearB) return yearB - yearA;
      return monthB - monthA;
    });

    if (feedbackDetails.length === 0) {
      showToast.error("Peserta belum memiliki feedback");
      return;
    }

    // Ambil feedback terbaru
    const latestFeedback = feedbackDetails[0];

    setSelectedPeserta(peserta);
    setSelectedFeedback(latestFeedback);
  };

  // ✅ FUNGSI DOWNLOAD SEMUA FEEDBACK DALAM BENTUK PDF
  const handleDownloadAllFeedback = async () => {
    if (feedbackList.length === 0) {
      showToast.error("Tidak ada data feedback untuk diunduh");
      return;
    }

    setDownloading(true);
    const toastId = showToast.loading("Menyiapkan laporan feedback...");

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/feedback/download-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            feedbackList,
            statistics,
            date: new Date().toISOString(),
          }),
        },
      );

      if (!res.ok) throw new Error("Gagal mengunduh PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laporan-feedback-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showToast.updateSuccess(toastId, "Laporan feedback berhasil diunduh");
    } catch (error) {
      console.error("Error downloading feedback PDF:", error);
      showToast.updateError(toastId, "Gagal mengunduh laporan feedback");
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredPeserta(pesertaFeedback);
      setPage(1);
      return;
    }

    const query = search.toLowerCase();
    const filtered = pesertaFeedback.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query),
    );
    setFilteredPeserta(filtered);
    setPage(1);
  }, [search, pesertaFeedback]);

  // Calculate pagination
  const totalPage = Math.ceil(filteredPeserta.length / itemsPerPage);
  const indexOfLastItem = page * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPeserta.slice(indexOfFirstItem, indexOfLastItem);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getTotalSurveyScore = (survey: FeedbackDetail["survey"]) => {
    if (!survey) return 0;

    return (
      survey.kepuasanMagang +
      survey.rekomendasiProgram +
      survey.kemudahanProses +
      survey.peningkatanSkill
    );
  };

  const getSurveyCategory = (total: number) => {
    if (total >= 17) return "Sangat Baik";
    if (total >= 13) return "Baik";
    if (total >= 9) return "Cukup";
    if (total >= 5) return "Kurang";
    return "Buruk";
  };

  return (
    <div
      className="
        min-h-screen p-4 sm:p-6 lg:p-10
        bg-linear-to-br
        from-slate-50 via-white to-indigo-100
        dark:from-[#0B0614] dark:via-[#120A24] dark:to-[#1E0F3D]
        text-slate-800 dark:text-slate-100
        transition-colors
      "
    >
      {/* HEADER */}
      <div className="mb-10">
        <div>
          <h1 className="flex items-center gap-3 tracking-tight mb-2">
            <FiMessageCircle className="text-[#B91C1C] dark:text-indigo-500 text-4xl" />

            <span
              className="
                text-2xl sm:text-3xl lg:text-4xl
                font-extrabold leading-tight
                bg-clip-text text-transparent
                bg-linear-to-r
                from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400
              "
            >
              Monitoring Feedback Peserta
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2">
            Pantau feedback dari peserta untuk BPOM dan mentor
          </p>
        </div>
      </div>

      {/* Stats */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <StatCard
            title="Total Feedback"
            value={statistics.total}
            icon={<HiDocumentText className="w-7 h-7" />}
            note="Jumlah seluruh feedback"
            color="indigo"
          />

          <StatCard
            title="Ke Mentor"
            value={statistics.sentToMentor}
            icon={<FiMessageCircle className="w-7 h-7" />}
            note="Feedback terkirim ke mentor"
            color="amber"
          />

          <StatCard
            title="Ke BPOM"
            value={statistics.sentToMentor}
            icon={<HiDocumentText className="w-7 h-7" />}
            note="Feedback untuk BPOM"
            color="slate"
          />

          <StatCard
            title="Direspon"
            value={statistics.responded}
            icon={<HiCheckCircle className="w-7 h-7" />}
            note="Feedback direspon mentor"
            color="emerald"
          />

          <StatCard
            title="Menunggu"
            value={statistics.unresponded}
            icon={<HiClock className="w-7 h-7" />}
            note="Menunggu respon mentor"
            color="slate"
          />
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-1">
        <div className="relative">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7F1D1D] dark:text-indigo-400 w-5 h-5 z-10" />
          <input
            type="text"
            placeholder="Cari peserta berdasarkan nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              w-full pl-11 pr-10 py-3
              rounded-2xl
              bg-white/90 dark:bg-white/5
              backdrop-blur
              border border-[#F59E0B]/40 dark:border-indigo-500/40
              text-slate-700 dark:text-slate-100
              placeholder:text-slate-400
              focus:outline-none focus:ring-2
              focus:ring-[#B91C1C]/60 dark:focus:ring-indigo-500/60
              transition
            "
          />
        </div>
        <div className="mt-2 text-sm text-slate-500">
          Total {filteredPeserta.length} peserta dengan feedback
        </div>
      </div>

      {/* ✅ BUTTON DOWNLOAD ALL FEEDBACK */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleDownloadAllFeedback}
          disabled={downloading || feedbackList.length === 0}
          className="
            inline-flex items-center justify-center gap-2
            px-6 py-3
            rounded-xl
            text-sm font-semibold
            text-white
            bg-linear-to-r from-emerald-500 to-green-600
            hover:from-emerald-600 hover:to-green-700
            dark:from-indigo-600 dark:to-violet-500
            dark:hover:from-indigo-500 dark:hover:to-violet-400
            shadow-lg hover:shadow-xl
            transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            min-w-45
          "
        >
          {downloading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              <span>Menyiapkan...</span>
            </>
          ) : (
            <>
              <HiDownload className="w-5 h-5" />
              <span>Download Laporan PDF</span>
            </>
          )}
        </button>
      </div>

      {/* ===================== TABLE ===================== */}
      {!loading && currentItems.length === 0 ? (
        <div
          className="
            rounded-3xl
            bg-white/80 dark:bg-white/5
            backdrop-blur
            border border-[#F59E0B]/30 dark:border-indigo-500/30
            shadow-xl
            p-12 text-center
          "
        >
          <div
            className="
              w-16 h-16 sm:w-20 sm:h-20
              mx-auto mb-5
              rounded-full
              bg-linear-to-br
              from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
              dark:from-indigo-600 dark:to-violet-500
              flex items-center justify-center
              shadow-lg
              animate-pulse
            "
          >
            <HiUser className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-[#7F1D1D] dark:text-indigo-300 mb-2">
            {search ? "Peserta tidak ditemukan" : "Belum ada data feedback"}
          </h3>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {search
              ? `Tidak ada peserta yang sesuai dengan pencarian "${search}".`
              : "Saat ini belum ada data feedback dari peserta."}
          </p>
        </div>
      ) : (
        <div
          className="
            rounded-2xl
            bg-white/90 dark:bg-white/5
            backdrop-blur
            border border-slate-200 dark:border-indigo-500/30
            shadow-lg
            overflow-hidden
          "
        >
          <div className="overflow-x-auto">
            <table className="min-w-200 w-full text-sm sm:text-base">
              <thead>
                <tr
                  className="
                    bg-slate-50 dark:bg-indigo-500/10
                    border-b border-slate-200 dark:border-indigo-500/30
                  "
                >
                  <th className="w-[6%] py-4 px-4 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                    No
                  </th>
                  <th className="w-[32%] py-4 px-4 text-left text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                    Peserta
                  </th>
                  <th className="w-[28%] py-4 px-4 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                    Status Feedback
                  </th>
                  <th className="w-[18%] py-4 px-4 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                    Feedback Terakhir
                  </th>
                  <th className="w-[16%] py-4 px-4 text-center text-xs font-semibold uppercase text-slate-600 dark:text-indigo-200">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-indigo-500/20">
                {currentItems.map((peserta, index) => (
                  <tr
                    key={peserta._id}
                    className="hover:bg-[#FEF3C7]/40 dark:hover:bg-indigo-500/10 transition"
                  >
                    <td className="py-4 px-4 text-center align-middle font-medium text-slate-500 dark:text-slate-300">
                      {indexOfFirstItem + index + 1}
                    </td>

                    <td className="py-4 px-4 text-left align-middle">
                      <div className="flex items-center gap-3">
                        <div
                          className="
                            shrink-0 w-10 h-10
                            rounded-full
                            bg-linear-to-br from-[#7F1D1D] to-[#F59E0B]
                            dark:from-indigo-600 dark:to-violet-500
                            flex items-center justify-center
                            text-white shadow
                          "
                        >
                          <HiUser className="w-5 h-5" />
                        </div>
                        <div className="text-left leading-tight">
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {peserta.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {peserta.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center align-middle">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-center flex-wrap gap-2">
                          {peserta.responded > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                              <HiCheckCircle className="w-3 h-3" />
                              {peserta.responded} Direspon
                            </span>
                          )}
                          {peserta.unresponded > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                              <HiClock className="w-3 h-3" />
                              {peserta.unresponded} Menunggu
                            </span>
                          )}
                          {peserta.notSentToMentor > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                              <HiDocumentText className="w-3 h-3" />
                              {peserta.notSentToMentor} Draft
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center align-middle">
                      {peserta.lastFeedbackDate ? (
                        <div className="flex justify-center items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <HiCalendar className="w-4 h-4" />
                          {formatDate(peserta.lastFeedbackDate)}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400 italic">
                          Belum ada
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleViewFeedback(peserta)}
                        disabled={peserta.totalFeedback === 0}
                        className="
                          inline-flex items-center gap-2
                          px-4 py-2
                          rounded-xl
                          text-sm font-semibold
                          text-white
                          bg-linear-to-r from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                          dark:from-indigo-600 dark:to-violet-500
                          shadow hover:shadow-xl
                          hover:-translate-y-0.5
                          transition
                          disabled:opacity-50 disabled:cursor-not-allowed
                        "
                      >
                        <FiMessageCircle className="w-4 h-4" />
                        {peserta.totalFeedback === 0
                          ? "Belum Ada"
                          : "Lihat Feedback"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPage > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 py-5">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="
                  px-4 py-2 rounded-lg text-sm font-medium
                  border border-slate-300 dark:border-indigo-500/30
                  bg-white dark:bg-indigo-950
                  text-slate-700 dark:text-indigo-200
                  hover:bg-[#FFF1F2] dark:hover:bg-indigo-900/40
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition
                "
              >
                Prev
              </button>

              {Array.from({ length: totalPage }).map((_, i) => {
                const active = page === i + 1;
                return (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`
                      min-w-9.5 h-9.5 rounded-lg text-sm font-semibold transition
                      ${
                        active
                          ? "bg-[#B91C1C] text-white shadow dark:bg-indigo-600"
                          : `
                            bg-white dark:bg-indigo-950
                            text-[#7F1D1D] dark:text-indigo-200
                            border border-slate-300 dark:border-indigo-500/30
                            hover:bg-[#FFF1F2] dark:hover:bg-indigo-900/40
                          `
                      }
                    `}
                  >
                    {i + 1}
                  </button>
                );
              })}

              <button
                disabled={page === totalPage}
                onClick={() => setPage((p) => p + 1)}
                className="
                  px-4 py-2 rounded-lg text-sm font-medium
                  border border-slate-300 dark:border-indigo-500/30
                  bg-white dark:bg-indigo-950
                  text-slate-700 dark:text-indigo-200
                  hover:bg-[#FFF1F2] dark:hover:bg-indigo-900/40
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition
                "
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Info jumlah data */}
      <div className="text-center mt-2 text-sm text-slate-500">
        {filteredPeserta.length <= itemsPerPage ? (
          <span>Menampilkan semua {filteredPeserta.length} peserta</span>
        ) : (
          <span>
            Menampilkan {indexOfFirstItem + 1}-
            {Math.min(indexOfLastItem, filteredPeserta.length)} dari{" "}
            {filteredPeserta.length} peserta
          </span>
        )}
      </div>

      {/* Modal Detail Feedback */}
      {selectedFeedback && selectedPeserta && (
        <SuperadminFeedbackDetailModal
          feedback={selectedFeedback}
          totalSurveyScore={
            selectedFeedback ? getTotalSurveyScore(selectedFeedback.survey) : 0
          }
          surveyCategory={
            selectedFeedback
              ? getSurveyCategory(getTotalSurveyScore(selectedFeedback.survey))
              : ""
          }
          onClose={() => {
            setSelectedFeedback(null);
            setSelectedPeserta(null);
          }}
        />
      )}
    </div>
  );
}

type StatCardColor = "indigo" | "emerald" | "amber" | "slate" | "blue";

type StatCardProps = {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  note: string;
  color: StatCardColor;
};

function StatCard({ title, value, icon, note, color }: StatCardProps) {
  const iconColorMap: Record<StatCardColor, string> = {
    indigo: "bg-[#B91C1C]/90 dark:bg-indigo-600",
    emerald: "bg-emerald-500 dark:bg-emerald-600",
    amber: "bg-amber-500 dark:bg-violet-500",
    slate: "bg-slate-500 dark:bg-indigo-700",
    blue: "bg-blue-500 dark:bg-blue-600",
  };

  const textColorMap: Record<StatCardColor, string> = {
    indigo: "text-[#7F1D1D] dark:text-white",
    emerald: "text-[#7F1D1D] dark:text-white",
    amber: "text-[#7F1D1D] dark:text-white",
    slate: "text-[#7F1D1D] dark:text-white",
    blue: "text-[#7F1D1D] dark:text-white",
  };

  return (
    <div
      className="
        group relative
        rounded-2xl
        border border-[#FCA5A5]/40 dark:border-indigo-500/30
        bg-linear-to-br
        from-[#FFFDF8] via-[#FFF4EC] to-white
        dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-800
        p-6
        shadow-sm hover:shadow-xl
        transition
      "
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#7F1D1D] dark:text-indigo-300">
            {title}
          </p>
          <p className={`text-4xl font-extrabold mt-1 ${textColorMap[color]}`}>
            {value}
          </p>
        </div>

        <div
          className={`
            w-14 h-14 rounded-2xl
            text-white
            flex items-center justify-center
            shadow
            group-hover:scale-110 transition
            ${iconColorMap[color]}
          `}
        >
          {icon}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[#FCA5A5]/40 dark:border-indigo-500/30">
        <p className="text-xs text-slate-600 dark:text-slate-300">{note}</p>
      </div>
    </div>
  );
}
