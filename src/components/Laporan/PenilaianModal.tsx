// components/Laporan/PenilaianModal.tsx
"use client";

import { useState, useEffect } from "react";
import { FiX, FiStar, FiUser, FiCalendar } from "react-icons/fi";
import { showToast } from "@/components/ui/toastDashboard";

type Props = {
  onClose: () => void;
};

type Penilaian = {
  kehadiranDisiplin: string;
  sikapPerilaku: string;
  kemampuanKomunikasi: string;
  inisiatifTanggungJawab: string;
  kemampuanAdaptasi: string;
  pengetahuanTeknis: string;
  produktivitasKetepatanWaktu: string;
  kerjaSamaTim: string;
};

export default function PenilaianModal({ onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [penilaian, setPenilaian] = useState<Penilaian | null>(null);
  const [mentorNote, setMentorNote] = useState("");
  const [approvedAt, setApprovedAt] = useState("");
  const [mentorName, setMentorName] = useState("");

  useEffect(() => {
    fetchPenilaian();
  }, []);

  const fetchPenilaian = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/laporan-akhir/penilaian`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.ok) {
        const data = await res.json();
        setPenilaian(data.penilaian);
        setMentorNote(data.mentorNote || "");
        setApprovedAt(data.approvedAt);
        setMentorName(data.approvedBy?.name || "Mentor");
      } else {
        showToast.error("Gagal mengambil data penilaian");
        onClose();
      }
    } catch (error) {
      console.error(error);
      showToast.error("Terjadi kesalahan");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  /* ================= LABEL PENILAIAN ================= */
  const penilaianLabels: Record<keyof Penilaian, string> = {
    kehadiranDisiplin: "Kehadiran dan Disiplin",
    sikapPerilaku: "Sikap dan Perilaku",
    kemampuanKomunikasi: "Kemampuan Komunikasi",
    inisiatifTanggungJawab: "Inisiatif dan Tanggung Jawab",
    kemampuanAdaptasi: "Kemampuan Adaptasi",
    pengetahuanTeknis: "Pengetahuan Teknis",
    produktivitasKetepatanWaktu: "Produktivitas dan Ketepatan Waktu",
    kerjaSamaTim: "Kerja Sama Tim",
  };

  /* ================= GET NILAI COLOR ================= */
  const getNilaiColor = (nilai: string) => {
    switch (nilai) {
      case "sangat baik":
        return "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300";
      case "baik":
        return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300";
      case "buruk":
        return "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300";
      case "sangat buruk":
        return "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  /* ================= FORMAT NILAI ================= */
  const formatNilai = (nilai: string) => {
    const map: Record<string, string> = {
      "sangat baik": "Sangat Baik",
      baik: "Baik",
      buruk: "Buruk",
      "sangat buruk": "Sangat Buruk",
    };
    return map[nilai] || nilai;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            Memuat penilaian...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-6">
      <div
        className="
          w-full max-w-3xl
          rounded-3xl
          bg-white dark:bg-slate-900
          shadow-2xl
          flex flex-col
          max-h-[90vh]
          overflow-hidden
          border border-slate-200 dark:border-slate-800
        "
      >
        {/* HEADER */}
        <div
          className="
            px-5 sm:px-6 py-4
            border-b border-slate-200 dark:border-slate-800
            bg-linear-to-r
            from-[#FFF7ED] via-[#FEF3C7] to-[#FDE68A]
            dark:from-indigo-800 dark:via-indigo-700 dark:to-violet-700
            flex items-start justify-between
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                p-3 rounded-xl
                bg-white/60 dark:bg-white/10
                backdrop-blur
                shadow-sm
              "
            >
              <FiStar className="text-xl text-amber-600 dark:text-amber-300" />
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white">
                Penilaian Mentor
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Hasil evaluasi dari mentor magang
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/60 dark:bg-white/10 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
          >
            <FiX className="text-xl text-red-500" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-6 space-y-6">
          {/* INFO MENTOR */}
          <div
            className="
              rounded-2xl
              border border-indigo-200 dark:border-indigo-800
              bg-linear-to-br
              from-indigo-50 via-white to-indigo-50
              dark:from-indigo-950 dark:via-slate-900 dark:to-indigo-950
              p-5
            "
          >
            <div className="flex items-center gap-4">
              <div
                className="
                  w-12 h-12
                  rounded-xl
                  bg-indigo-100 dark:bg-indigo-800/40
                  flex items-center justify-center
                "
              >
                <FiUser className="text-indigo-600 dark:text-indigo-300 text-xl" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                  Direview oleh
                </p>
                <p className="font-semibold text-slate-800 dark:text-white">
                  {mentorName}
                </p>
                {approvedAt && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <FiCalendar className="w-3 h-3" />
                    {new Date(approvedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PENILAIAN GRID */}
          {penilaian && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <FiStar className="text-amber-500" />
                Aspek Penilaian
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.keys(penilaianLabels) as Array<keyof Penilaian>).map(
                  (key) => (
                    <div
                      key={key}
                      className="
                        p-4
                        rounded-xl
                        border border-slate-200 dark:border-slate-800
                        bg-white dark:bg-slate-900
                        shadow-sm
                        flex items-center justify-between
                      "
                    >
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {penilaianLabels[key]}
                      </span>
                      <span
                        className={`
                          px-3 py-1.5
                          rounded-full
                          text-xs font-semibold
                          border
                          ${getNilaiColor(penilaian[key])}
                        `}
                      >
                        {formatNilai(penilaian[key])}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {/* CATATAN MENTOR */}
          {mentorNote && (
            <div
              className="
                rounded-2xl
                border border-amber-200 dark:border-amber-700
                bg-linear-to-br
                from-amber-50 via-white to-amber-50
                dark:from-amber-900/20 dark:via-slate-900 dark:to-amber-900/20
                p-5
                space-y-2
              "
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                Catatan Mentor
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                {mentorNote}
              </p>
            </div>
          )}

          {/* RINGKASAN */}
          {penilaian && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <p className="text-sm text-emerald-800 dark:text-emerald-200">
              <span className="font-bold">Ringkasan:</span>{" "}
                {
                  Object.values(penilaian).filter(
                    (v) => v === "sangat baik" || v === "baik",
                  ).length
                }{" "}
                dari 8 aspek mendapat nilai Baik atau Sangat Baik.
              </p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div
          className="
            px-4 sm:px-6 py-4
            border-t border-slate-200 dark:border-slate-800
            bg-slate-50 dark:bg-slate-900
            flex justify-end
          "
        >
          <button
            onClick={onClose}
            className="
              px-6 py-2.5
              rounded-xl
              text-sm font-semibold
              text-slate-600 dark:text-slate-300
              border border-slate-300 dark:border-slate-600
              hover:bg-slate-100 dark:hover:bg-white/10
              transition
            "
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
