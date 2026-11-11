// dashboard/mentor/viewfeedback/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  HiUser,
  HiSearch,
  HiDocumentText,
  HiMail,
  HiChat,
} from "react-icons/hi";
import { MdEmail } from "react-icons/md";
import MentorFeedbackModal from "@/components/Laporan/MentorFeedbackModal";

type Peserta = {
  id: string;
  nama: string;
  email: string;
  posisi: string;
};

type Feedback = {
  _id: string;
  month: string;
  feedbackMentor: string; // Hanya feedback untuk mentor
  status: string;
  mentorResponse?: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  feedbackMentorSentAt: string;
  createdAt: string;
  isFeedbackMentorSent: boolean;
};

export default function ViewFeedbackMentor() {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<Feedback[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  /* ================= FETCH SEMUA FEEDBACK ================= */
  const fetchAllFeedback = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/feedback/mentor/semua-feedback`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.ok) {
        const data = await res.json();
        setFeedbackList(data);
        setFilteredFeedback(data);
      }
    } catch (error) {
      console.error("Gagal memuat feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFeedback();
  }, []);

  /* ================= SEARCH ================= */
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFeedback(feedbackList);
      return;
    }

    const q = searchQuery.toLowerCase();
    const filtered = feedbackList.filter(
      (f) =>
        f.user?.name?.toLowerCase().includes(q) ||
        f.user?.email?.toLowerCase().includes(q) ||
        f.month?.toLowerCase().includes(q),
    );

    setFilteredFeedback(filtered);
  }, [searchQuery, feedbackList]);

  /* ================= STATISTICS ================= */
  const stats = {
    total: feedbackList.length,
    belumDirespon: feedbackList.filter((f) => !f.mentorResponse).length,
    sudahDirespon: feedbackList.filter((f) => f.mentorResponse).length,
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-10 bg-slate-50 dark:bg-[#0B0614] text-slate-800 dark:text-slate-100">
      {/* HEADER */}
      <div className="mb-10">
        <h1 className="flex items-center gap-3 tracking-tight mb-2">
            <HiChat className="text-[#B91C1C] dark:text-indigo-500 text-4xl" />
        
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
            Feedback dari Peserta
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Lihat dan berikan response untuk feedback dari peserta bimbingan Anda
        </p>
      </div>

      {/* STATISTIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Feedback"
          value={stats.total}
          icon={<HiDocumentText className="w-7 h-7" />}
          color="indigo"
        />

        <StatCard
          title="Belum Direspon"
          value={stats.belumDirespon}
          icon={<HiMail className="w-7 h-7" />}
          color="amber"
        />

        <StatCard
          title="Sudah Direspon"
          value={stats.sudahDirespon}
          icon={<HiChat className="w-7 h-7" />}
          color="emerald"
        />
      </div>

      {/* SEARCH BAR */}
      <div className="mb-8">
        <div className="relative">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7F1D1D] dark:text-indigo-400 w-5 h-5 z-10" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama peserta, email, atau periode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
      </div>

      {/* TABLE */}
      <div className="rounded-2xl bg-white/90 dark:bg-white/5 backdrop-blur border border-slate-200 dark:border-indigo-500/30 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-10 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-slate-500">Memuat data...</p>
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className="py-16 text-center">
              <HiChat className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
              <p className="mt-4 text-lg font-medium text-slate-500 dark:text-slate-400">
                Belum ada feedback dari peserta
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500">
                Feedback dari peserta akan muncul di sini
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-indigo-500/10 border-b border-slate-200 dark:border-indigo-500/30">
                  <Th className="w-[6%]" align="center">No</Th>
                  <Th className="w-[22%]" align="left">Peserta</Th>
                  <Th className="w-[14%]" align="center">Periode</Th>
                  <Th className="w-[30%]" align="left">Feedback untuk Mentor</Th>
                  <Th className="w-[14%]" align="center">Status</Th>
                  <Th className="w-[14%]" align="center">Aksi</Th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-indigo-500/20">
                {filteredFeedback.map((f, i) => (
                  <tr
                    key={f._id}
                    className="hover:bg-[#FEF3C7]/40 dark:hover:bg-indigo-500/10 transition"
                  >
                    <td className="py-4 px-4 text-center align-middle font-medium text-slate-500">
                      {i + 1}
                    </td>

                    <td className="py-4 px-4 text-left align-middle">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 w-10 h-10 rounded-full bg-linear-to-br from-[#7F1D1D] to-[#F59E0B] dark:from-indigo-600 dark:to-violet-500 flex items-center justify-center text-white">
                          <HiUser className="w-5 h-5" />
                        </div>
                        <div className="text-left leading-tight">
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {f.user?.name || "Unknown"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {f.user?.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center align-middle">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                        {f.month}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-left align-middle">
                      <div className="max-w-xs line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                        {f.feedbackMentor}
                      </div>
                      {!f.isFeedbackMentorSent && (
                        <span className="inline-block mt-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          Menunggu dikirim ke mentor
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-center align-middle">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold
                          ${
                            f.mentorResponse
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200"
                          }
                        `}
                      >
                        {f.mentorResponse ? "Direspon" : "Belum Direspon"}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center align-middle">
                      <button
                        onClick={() => setSelectedFeedback(f)}
                        className="
                          group
                          inline-flex items-center justify-center gap-2
                          px-4 py-2
                          rounded-xl
                          text-xs sm:text-sm font-semibold
                          text-white
                          bg-linear-to-r from-[#7F1D1D] via-[#B91C1C] to-[#F59E0B]
                          hover:from-[#991B1B] hover:via-[#DC2626] hover:to-[#FBBF24]
                          dark:from-indigo-600 dark:to-violet-500
                          dark:hover:from-indigo-500 dark:hover:to-violet-400
                          shadow-md hover:shadow-xl
                          hover:-translate-y-0.5
                          transition-all duration-300
                        "
                      >
                        <HiChat className="w-4 h-4" />
                        <span>{f.mentorResponse ? "Lihat" : "Respon"}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL */}
      {selectedFeedback && (
        <MentorFeedbackModal
          feedback={selectedFeedback}
          onClose={() => setSelectedFeedback(null)}
          onResponseSent={fetchAllFeedback}
        />
      )}
    </div>
  );
}

function Th({ children, className = "", align = "center" }: any) {
  const alignClass = align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center";
  return (
    <th
      className={`
        py-4 px-4 ${alignClass}
        text-xs font-semibold uppercase
        text-slate-600 dark:text-indigo-200
        tracking-wider
        ${className}
      `}
    >
      {children}
    </th>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const iconColorMap: any = {
    indigo: "bg-[#B91C1C]/90 dark:bg-indigo-600",
    emerald: "bg-emerald-500 dark:bg-emerald-600",
    amber: "bg-amber-500 dark:bg-violet-500",
  };

  return (
    <div className="group relative rounded-2xl border border-[#FCA5A5]/40 dark:border-indigo-500/30 bg-white dark:bg-indigo-950 p-6 shadow-sm hover:shadow-xl transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#7F1D1D] dark:text-indigo-300">
            {title}
          </p>
          <p className="text-4xl font-extrabold mt-1 text-[#7F1D1D] dark:text-white">
            {value}
          </p>
        </div>
        <div
          className={`w-14 h-14 rounded-2xl text-white flex items-center justify-center shadow group-hover:scale-110 transition ${iconColorMap[color]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
