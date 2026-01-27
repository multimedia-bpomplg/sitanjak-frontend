"use client";

import { useState, useEffect } from "react";
import { FiX, FiFileText, FiCalendar, FiUser, FiMail, FiEdit, } from "react-icons/fi";
import { showToast } from "@/components/ui/toastDashboard";

type Props = {
  peserta: {
    id: string;
    nama: string;
    email: string;
    posisi: string;
  };
  month?: string;
  onClose: () => void;
  onStatusUpdate?: () => void;
};

export default function MentorLaporanBulananModal({
  peserta,
  onClose,
  onStatusUpdate,
}: Props) {
  const [laporan, setLaporan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [mentorNote, setMentorNote] = useState("");
  const [status, setStatus] = useState("Menunggu");

  /* ================= FETCH LAPORAN PESERTA ================= */
  const fetchLaporanPeserta = async (month: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // GUNAKAN EMAIL BUKAN ID
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/laporan-bulanan/mentor/peserta-email/${peserta.email}/${month}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.ok) {
        const data = await res.json();
        setLaporan(data);
        setMentorNote(data.mentorNote || "");
        setStatus(data.status || "Menunggu");
      } else {
        setLaporan(null);
        setMentorNote("");
        setStatus("Menunggu");
      }
    } catch (error) {
      setLaporan(null);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FETCH AVAILABLE MONTHS ================= */
  const fetchAvailableMonths = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/laporan-bulanan/mentor/semua-laporan`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.ok) {
        const data = await res.json();

        // Filter laporan untuk peserta ini (berdasarkan email)
        const laporanPeserta = data.filter(
          (l: any) => l.user && l.user.email === peserta.email,
        );

        const months = laporanPeserta.map((l: any) => l.month);

        setAvailableMonths(months);

        if (months.length > 0) {
          setSelectedMonth(months[0]);
          fetchLaporanPeserta(months[0]);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableMonths();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchLaporanPeserta(selectedMonth);
    }
  }, [selectedMonth]);

  /* ================= UPDATE STATUS ================= */
  const handleUpdateStatus = async () => {
    if (!laporan) return;

    const toastId = showToast.loading("Mengupdate status laporan...");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/laporan-bulanan/mentor/update-status/${laporan._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
            mentorNote,
          }),
        },
      );

      if (!res.ok) {
        throw new Error("Gagal mengupdate status");
      }

      showToast.updateSuccess(toastId, "Status laporan berhasil diupdate!");

      // Refresh data
      fetchLaporanPeserta(selectedMonth);

      // Trigger callback untuk refresh parent
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error: any) {
      showToast.updateError(
        toastId,
        error.message || "Terjadi kesalahan saat mengupdate status",
      );
    }
  };

  return (
    <div className="
      fixed inset-0 z-50
      bg-black/40 dark:bg-black/70
      backdrop-blur-md
      flex items-center justify-center p-3 sm:p-6
    ">
      <div className="
        w-full max-w-5xl
        bg-white/90 dark:bg-white/5
        backdrop-blur
        rounded-3xl
        border border-slate-200 dark:border-indigo-500/30
        shadow-2xl
        overflow-hidden
        max-h-[92vh]
        flex flex-col
      ">
        {/* HEADER */}
        <div
          className="
            px-5 sm:px-6 py-4 sm:py-5
            bg-linear-to-r
            from-[#FCA5A5] via-[#FDE68A] to-[#FFF7ED]
            dark:from-indigo-800 dark:via-indigo-700 dark:to-indigo-900
            text-slate-900 dark:text-white
            flex items-center justify-between
            gap-3
          "
        >
          {/* LEFT */}
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="p-2 bg-white/20 rounded-xl shrink-0">
              <FiCalendar className="text-xl" />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold leading-tight truncate">
                Laporan Bulanan Peserta
              </h2>

              {/* META */}
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm opacity-90">
                <div className="flex items-center gap-1 min-w-0">
                  <FiUser className="shrink-0" />
                  <span className="truncate">{peserta.nama}</span>
                </div>

                <div className="flex items-center gap-1 min-w-0">
                  <FiMail className="shrink-0" />
                  <span className="truncate max-w-55 sm:max-w-none">
                    {peserta.email}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CLOSE */}
          <button
            onClick={onClose}
            className="p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
          {/* FILTER BULAN */}
          <div
            className="
              flex flex-col sm:flex-row sm:items-center sm:justify-between
              gap-4
              rounded-2xl
              border border-slate-200 dark:border-indigo-500/30
              bg-white/70 dark:bg-indigo-950/40
              backdrop-blur
              p-4 sm:p-5
              shadow-sm
            "
          >
            <div>
              <h3 className="font-bold text-slate-800 dark:text-indigo-200">
                Pilih Periode
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Pilih bulan untuk melihat laporan
              </p>
            </div>

            <div className="flex items-center gap-2">
              {availableMonths.length > 0 ? (
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="
                    px-4 py-2.5
                    rounded-xl
                    bg-white dark:bg-indigo-900/40
                    border border-slate-300 dark:border-indigo-500/40
                    text-slate-700 dark:text-slate-100
                    focus:ring-2 focus:ring-amber-300 dark:focus:ring-indigo-500/60
                    transition
                  "
                >
                  {availableMonths.map((month) => (
                    <option key={month} value={month}>
                      {new Date(month + "-01").toLocaleDateString("id-ID", {
                        month: "long",
                        year: "numeric",
                      })}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Tidak ada laporan tersedia
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-slate-600">Memuat laporan...</p>
            </div>
          ) : laporan ? (
            <>
              {/* STATUS BADGE */}
              <div
                className={`
                  relative
                  rounded-2xl
                  border
                  px-5 py-4
                  backdrop-blur
                  shadow-md
                  transition
                  bg-linear-to-br
                  from-white/80 to-white/60
                  dark:from-indigo-900/40 dark:to-indigo-950/60
                  ${
                    laporan.status === "Disetujui"
                      ? "border-emerald-400/40"
                      : laporan.status === "Ditolak"
                      ? "border-red-400/40"
                      : laporan.status === "Perbaiki"
                      ? "border-amber-400/40"
                      : "border-indigo-400/40"
                  }
                `}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                  {/* LEFT */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`
                        w-10 h-10 rounded-xl flex items-center justify-center
                        shadow-inner
                        ${
                          laporan.status === "Disetujui"
                            ? "bg-emerald-500/20 text-emerald-500"
                            : laporan.status === "Ditolak"
                            ? "bg-red-500/20 text-red-500"
                            : laporan.status === "Perbaiki"
                            ? "bg-amber-500/20 text-amber-500"
                            : "bg-indigo-500/20 text-indigo-400"
                        }
                      `}
                    >
                      {laporan.status === "Disetujui"
                        ? "✅"
                        : laporan.status === "Ditolak"
                        ? "❌"
                        : laporan.status === "Perbaiki"
                        ? "📝"
                        : "⏳"}
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-indigo-300">
                        Status Laporan
                      </p>
                      <p
                        className={`
                          mt-0.5 text-sm sm:text-base font-bold
                          ${
                            laporan.status === "Disetujui"
                              ? "text-emerald-700 dark:text-emerald-300"
                              : laporan.status === "Ditolak"
                              ? "text-red-700 dark:text-red-300"
                              : laporan.status === "Perbaiki"
                              ? "text-amber-700 dark:text-amber-300"
                              : "text-indigo-700 dark:text-indigo-300"
                          }
                        `}
                      >
                        {laporan.status === "Disetujui"
                          ? "Disetujui"
                          : laporan.status === "Ditolak"
                          ? "Ditolak"
                          : laporan.status === "Perbaiki"
                          ? "Perlu Perbaikan"
                          : "Menunggu Review"}
                      </p>
                    </div>
                  </div>

                  {/* RIGHT */}
                  {laporan.approvedAt && (
                    <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-300">
                      Direview:
                      <span className="ml-1 font-semibold">
                        {new Date(laporan.approvedAt).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* CONTENT */}
              <div className="space-y-6">
                <FieldViewCard
                  icon={<FiFileText />}
                  label="Ringkasan Aktivitas Bulanan"
                  value={laporan.ringkasan}
                />

                <FieldViewCard
                  icon={<FiFileText />}
                  label="Pencapaian Utama"
                  value={laporan.pencapaian}
                />

                <FieldViewCard
                  icon={<FiFileText />}
                  label="Kendala yang Dihadapi"
                  value={laporan.kendala}
                />

                <FieldViewCard
                  icon={<FiFileText />}
                  label="Rencana Bulan Berikutnya"
                  value={laporan.rencana}
                />
              </div>

              {/* FORM REVIEW MENTOR */}
              <div
                className="
                  mt-8
                  rounded-2xl
                  border border-slate-200 dark:border-indigo-500/30
                  bg-white/80 dark:bg-indigo-950/40
                  backdrop-blur
                  p-5 sm:p-6
                  shadow-sm
                "
              >
                {/* HEADER */}
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="
                      w-10 h-10 rounded-xl
                      flex items-center justify-center
                      bg-indigo-100 text-indigo-600
                      dark:bg-indigo-500/20 dark:text-indigo-300
                    "
                  >
                    <FiEdit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-indigo-200">
                        Review Mentor
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Tentukan status dan beri catatan untuk peserta
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* STATUS SELECTION */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                      Update Status
                    </label>

                    <div
                      className="
                        flex flex-wrap gap-2
                        rounded-xl
                        bg-slate-100/80 dark:bg-white/5
                        p-2
                      "
                    >
                      {["Disetujui", "Ditolak", "Perbaiki", "Menunggu"].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStatus(s)}
                          className={`
                            px-4 py-2
                            rounded-lg
                            text-xs sm:text-sm
                            font-semibold
                            transition-all
                            focus:outline-none
                            ${
                              status === s
                                ? s === "Disetujui"
                                  ? "bg-emerald-500 text-white shadow"
                                  : s === "Ditolak"
                                    ? "bg-red-500 text-white shadow"
                                    : s === "Perbaiki"
                                      ? "bg-amber-500 text-white shadow"
                                      : "bg-blue-500 text-white shadow"
                                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                            }
                          `}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* KOMENTAR */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                      Komentar / Catatan
                    </label>

                    <textarea
                      value={mentorNote}
                      onChange={(e) => setMentorNote(e.target.value)}
                      rows={4}
                      className="
                        w-full px-4 py-3
                        rounded-xl
                        bg-white dark:bg-white/5

                        border
                        border-amber-400/70       
                        dark:border-indigo-500/60 

                        text-slate-700 dark:text-slate-100
                        placeholder:text-slate-400

                        focus:ring-2
                        focus:ring-amber-300      
                        dark:focus:ring-indigo-500/60 

                        outline-none
                        transition
                      "
                      placeholder="Berikan komentar atau catatan untuk peserta..."
                    />
                  </div>

                  {/* ACTION BUTTONS */}
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
                      onClick={handleUpdateStatus}
                      className="
                        px-6 py-2.5
                        rounded-xl

                        bg-linear-to-r from-amber-400 via-[#B91C1C] to-[#7F1D1D]
                        hover:from-amber-300 hover:via-[#DC2626] hover:to-[#991B1B]

                        dark:bg-linear-to-r dark:from-indigo-600 dark:to-violet-500
                        dark:hover:from-indigo-500 dark:hover:to-violet-400

                        text-white font-semibold
                        shadow-md hover:shadow-xl
                        hover:-translate-y-0.5
                        transition-all duration-300
                      "
                    >
                      Simpan Review
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-slate-700 font-medium">
                {selectedMonth
                  ? `Belum ada laporan untuk ${selectedMonth}`
                  : "Belum ada laporan"}
              </p>
              <p className="text-slate-500 text-sm mt-2">
                Peserta belum mengisi laporan bulanan untuk periode ini
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldViewCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <div className="space-y-3">
      {/* HEADER */}
      <div className="flex items-center gap-2 text-slate-700 dark:text-white">
        <span className="text-[#B91C1C] dark:text-indigo-400">
          {icon}
        </span>
        <label className="font-semibold tracking-wide">
          {label}
        </label>
      </div>

      {/* BODY */}
      <div
        className="
          p-4 sm:p-5
          rounded-2xl
          min-h-24
          whitespace-pre-line
          leading-relaxed
          bg-white/80
          dark:bg-indigo-950/40
          border border-[#F59E0B]/30 dark:border-indigo-500/30
          shadow-sm
          transition
          text-slate-700 dark:text-slate-100
        "
      >
        {value || <span className="text-slate-400">-</span>}
      </div>
    </div>
  );
}