// components/Laporan/MentorLaporanAkhirModal.tsx
"use client";

import { useState, useEffect } from "react";
import {
  FiX,
  FiFileText,
  FiAward,
  FiUser,
  FiMail,
  FiCheckCircle,
  FiXCircle,
  FiEdit,
} from "react-icons/fi";
import { showToast } from "@/components/ui/toastDashboard";

type Props = {
  peserta: {
    id: string;
    nama: string;
    email: string;
    posisi: string;
  };
  onClose: () => void;
  onStatusUpdate?: () => void;
};

export default function MentorLaporanAkhirModal({
  peserta,
  onClose,
  onStatusUpdate,
}: Props) {
  const [laporan, setLaporan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mentorNote, setMentorNote] = useState("");
  const [status, setStatus] = useState("Menunggu");

  /* ================= FETCH LAPORAN AKHIR PESERTA ================= */
  const fetchLaporanAkhirPeserta = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      if (!peserta.email || !peserta.email.includes("@")) {
        console.error("Email peserta tidak valid:", peserta.email);
        setLaporan(null);
        setLoading(false);
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/laporan-akhir/mentor/peserta-email/${encodeURIComponent(peserta.email)}`,
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
      console.error("Gagal memuat laporan akhir:", error);
      setLaporan(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporanAkhirPeserta();
  }, [peserta]);

  /* ================= UPDATE STATUS ================= */
  const handleUpdateStatus = async () => {
    if (!laporan) return;

    const toastId = showToast.loading("Mengupdate status laporan...");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/laporan-akhir/mentor/update-status/${laporan._id}`,
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
      fetchLaporanAkhirPeserta();

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

  /* ================= GET STATUS COLOR ================= */
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Disetujui":
        return {
          bg: "bg-emerald-50",
          text: "text-emerald-700",
          border: "border-emerald-200",
          icon: "text-emerald-500",
        };
      case "Ditolak":
        return {
          bg: "bg-red-50",
          text: "text-red-700",
          border: "border-red-200",
          icon: "text-red-500",
        };
      case "Revisi":
        return {
          bg: "bg-amber-50",
          text: "text-amber-700",
          border: "border-amber-200",
          icon: "text-amber-500",
        };
      case "Menunggu":
        return {
          bg: "bg-blue-50",
          text: "text-blue-700",
          border: "border-blue-200",
          icon: "text-blue-500",
        };
      default:
        return {
          bg: "bg-slate-50",
          text: "text-slate-500",
          border: "border-slate-200",
          icon: "text-slate-400",
        };
    }
  };

  /* ================= GET STATUS ICON ================= */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Disetujui":
        return <FiCheckCircle className="w-5 h-5" />;
      case "Ditolak":
        return <FiXCircle className="w-5 h-5" />;
      case "Revisi":
        return <FiEdit className="w-5 h-5" />;
      default:
        return <FiAward className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* HEADER */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FiAward className="text-xl" />
            <div>
              <h2 className="text-xl font-bold">Laporan Akhir Magang</h2>
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
          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-slate-600">Memuat laporan...</p>
            </div>
          ) : laporan ? (
            <>
              {/* STATUS BADGE */}
              <div
                className={`px-4 py-3 rounded-xl border ${getStatusColor(laporan.status).bg} ${getStatusColor(laporan.status).border}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={getStatusColor(laporan.status).icon}>
                      {getStatusIcon(laporan.status)}
                    </span>
                    <div>
                      <p className="font-semibold">Status Laporan</p>
                      <p
                        className={`text-sm ${getStatusColor(laporan.status).text}`}
                      >
                        {laporan.status === "Disetujui"
                          ? "✅ Disetujui"
                          : laporan.status === "Ditolak"
                            ? "❌ Ditolak"
                            : laporan.status === "Revisi"
                              ? "📝 Perlu Revisi"
                              : "⏳ Menunggu Review"}
                      </p>
                    </div>
                  </div>
                  {laporan.approvedAt && (
                    <p className="text-sm text-slate-500">
                      Direview:{" "}
                      {new Date(laporan.approvedAt).toLocaleDateString("id-ID")}
                    </p>
                  )}
                </div>
              </div>

              {/* CONTENT */}
              <div className="space-y-5">
                <Field label="Judul Laporan Akhir">
                  <div className="p-4 bg-slate-50 border rounded-xl whitespace-pre-line">
                    {laporan.judul}
                  </div>
                </Field>

                <Field label="Ringkasan Kegiatan Magang">
                  <div className="p-4 bg-slate-50 border rounded-xl whitespace-pre-line">
                    {laporan.ringkasan}
                  </div>
                </Field>

                <Field label="Hasil & Pencapaian">
                  <div className="p-4 bg-slate-50 border rounded-xl whitespace-pre-line">
                    {laporan.hasil}
                  </div>
                </Field>

                <Field label="Kendala Selama Magang">
                  <div className="p-4 bg-slate-50 border rounded-xl whitespace-pre-line">
                    {laporan.kendala}
                  </div>
                </Field>

                <Field label="Kesimpulan">
                  <div className="p-4 bg-slate-50 border rounded-xl whitespace-pre-line">
                    {laporan.kesimpulan}
                  </div>
                </Field>

                <Field label="Saran">
                  <div className="p-4 bg-slate-50 border rounded-xl whitespace-pre-line">
                    {laporan.saran || "Tidak ada saran"}
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
                      {["Disetujui", "Ditolak", "Revisi", "Menunggu"].map(
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
                                    : s === "Revisi"
                                      ? "bg-amber-500 text-white"
                                      : "bg-blue-500 text-white"
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
                Belum ada laporan akhir
              </p>
              <p className="text-slate-500 text-sm mt-2">
                Peserta belum mengisi laporan akhir magang
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
