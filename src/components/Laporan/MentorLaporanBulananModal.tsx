// components/Laporan/MentorLaporanBulananModal.tsx
"use client";

import { useState, useEffect } from "react";
import { FiX, FiFileText, FiCalendar, FiUser, FiMail } from "react-icons/fi";
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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* HEADER */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FiCalendar className="text-xl" />
            <div>
              <h2 className="text-xl font-bold">Laporan Bulanan Peserta</h2>
              <div className="flex items-center gap-4 text-sm opacity-90">
                <div className="flex items-center gap-1">
                  <FiUser />
                  <span>{peserta.nama}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FiMail />
                  <span>{peserta.email}</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* FILTER BULAN */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-700">Pilih Periode</h3>
              <p className="text-sm text-slate-500">
                Pilih bulan untuk melihat laporan
              </p>
            </div>
            <div className="flex items-center gap-2">
              {availableMonths.length > 0 ? (
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                <span className="text-sm text-slate-500">
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
                className={`px-4 py-3 rounded-xl border ${
                  laporan.status === "Disetujui"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : laporan.status === "Ditolak"
                      ? "bg-red-50 border-red-200 text-red-700"
                      : laporan.status === "Perbaiki"
                        ? "bg-amber-50 border-amber-200 text-amber-700"
                        : "bg-slate-50 border-slate-200 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Status Laporan</p>
                    <p className="text-sm">
                      {laporan.status === "Disetujui"
                        ? "✅ Disetujui"
                        : laporan.status === "Ditolak"
                          ? "❌ Ditolak"
                          : laporan.status === "Perbaiki"
                            ? "📝 Perlu Perbaikan"
                            : "⏳ Menunggu Review"}
                    </p>
                  </div>
                  {laporan.approvedAt && (
                    <p className="text-sm">
                      Direview:{" "}
                      {new Date(laporan.approvedAt).toLocaleDateString("id-ID")}
                    </p>
                  )}
                </div>
              </div>

              {/* CONTENT */}
              <div className="space-y-5">
                <Field label="Ringkasan Aktivitas Bulanan">
                  <div className="p-4 bg-slate-50 border rounded-xl whitespace-pre-line">
                    {laporan.ringkasan || "Tidak ada ringkasan"}
                  </div>
                </Field>

                <Field label="Pencapaian Utama">
                  <div className="p-4 bg-slate-50 border rounded-xl whitespace-pre-line">
                    {laporan.pencapaian || "Tidak ada pencapaian"}
                  </div>
                </Field>

                <Field label="Kendala yang Dihadapi">
                  <div className="p-4 bg-slate-50 border rounded-xl whitespace-pre-line">
                    {laporan.kendala || "Tidak ada kendala"}
                  </div>
                </Field>

                <Field label="Rencana Bulan Berikutnya">
                  <div className="p-4 bg-slate-50 border rounded-xl whitespace-pre-line">
                    {laporan.rencana || "Tidak ada rencana"}
                  </div>
                </Field>
              </div>

              {/* FORM REVIEW MENTOR */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-slate-700 mb-4">
                  Review Mentor
                </h3>

                <div className="space-y-4">
                  {/* STATUS SELECTION */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Update Status
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {["Disetujui", "Ditolak", "Perbaiki", "Menunggu"].map(
                        (s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setStatus(s)}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                              status === s
                                ? s === "Disetujui"
                                  ? "bg-emerald-500 text-white"
                                  : s === "Ditolak"
                                    ? "bg-red-500 text-white"
                                    : s === "Perbaiki"
                                      ? "bg-amber-500 text-white"
                                      : "bg-slate-500 text-white"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            {s}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  {/* KOMENTAR */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Komentar / Catatan
                    </label>
                    <textarea
                      value={mentorNote}
                      onChange={(e) => setMentorNote(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Berikan komentar atau catatan untuk peserta..."
                    />
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={onClose}
                      className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleUpdateStatus}
                      className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
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

function Field({ label, children }: any) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 font-semibold text-slate-700">
        <FiFileText />
        {label}
      </div>
      {children}
    </div>
  );
}
