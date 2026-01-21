"use client";

import { useState, useEffect } from "react";
import {
  HiDocumentText,
  HiCheckCircle,
  HiClock,
  HiDownload,
  HiEye,
  HiExclamation,
  HiCalendar,
} from "react-icons/hi";

export default function LaporanAkhirPage() {
  const [laporanData, setLaporanData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Data dummy
  const dummyData = {
    judul: "Laporan Akhir Magang sebagai Software Developer di PT XYZ",
    ringkasan:
      "Selama 6 bulan magang di PT XYZ, saya berkesempatan untuk mengembangkan sistem manajemen inventaris berbasis web menggunakan React.js dan Node.js. Saya terlibat dalam seluruh siklus pengembangan, mulai dari analisis kebutuhan, desain UI/UX, implementasi frontend dan backend, hingga testing dan deployment.",
    hasil:
      "1. Berhasil mengembangkan modul manajemen inventaris dengan fitur CRUD lengkap\n2. Mengimplementasikan sistem autentikasi dengan JWT dan role-based access control\n3. Meningkatkan performa aplikasi dengan optimasi database queries dan code splitting\n4. Membuat dokumentasi teknis dan user manual untuk aplikasi\n5. Melakukan testing unit dan integration testing dengan coverage 85%",
    kendala:
      "1. Kurang familiar dengan teknologi GraphQL di awal magang\n2. Keterbatasan waktu dalam mempelajari sistem legacy yang kompleks\n3. Koordinasi dengan tim remote yang berbeda timezone\n4. Debugging isu performa pada environment production",
    kesimpulan:
      "Magang ini memberikan pengalaman berharga dalam pengembangan software secara profesional. Saya belajar banyak tentang best practices dalam pengembangan aplikasi web, kolaborasi tim, dan manajemen proyek. Keterampilan teknis saya meningkat signifikan, terutama dalam pengembangan full-stack dan penerapan agile methodology.",
    saran:
      "1. Menyarankan implementasi continuous integration/continuous deployment (CI/CD) pipeline\n2. Penambahan fitur real-time notification untuk monitoring stok\n3. Migrasi ke microservices architecture untuk scalability yang lebih baik\n4. Implementasi comprehensive logging dan monitoring system",
    status: "Disetujui",
    approvedAt: "2024-12-15T10:30:00Z",
    mentorNote:
      "Laporan sangat komprehensif dan menunjukkan pemahaman mendalam tentang proyek yang dikerjakan. Dokumentasi teknis yang dibuat juga sangat membantu untuk maintenance kedepannya.",
    mentor: {
      name: "Budi Santoso, S.Kom",
      email: "budi.santoso@perusahaan.com",
      posisiMentor: "Senior Software Engineer",
    },
  };

  useEffect(() => {
    // Simulasi fetch data
    setTimeout(() => {
      setLaporanData(dummyData);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSubmitLaporan = () => {
    // Logic submit laporan
    console.log("Submit laporan akhir");
    setShowConfirmModal(false);
    alert("Laporan akhir berhasil dikirim!");
  };

  const handleDownloadPDF = () => {
    // Logic download PDF
    alert("Memulai download PDF...");
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-100 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                <HiDocumentText className="w-8 h-8 text-blue-600" />
                Laporan Akhir Magang
              </h1>
              <p className="text-slate-600 mt-2">
                Dokumen final yang menguraikan keseluruhan pengalaman magang
                Anda
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${
                  laporanData.status === "Disetujui"
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    : "bg-amber-100 text-amber-700 border border-amber-200"
                }`}
              >
                {laporanData.status === "Disetujui" ? (
                  <HiCheckCircle className="w-4 h-4" />
                ) : (
                  <HiClock className="w-4 h-4" />
                )}
                {laporanData.status}
              </span>
              {laporanData.status === "Disetujui" && (
                <button
                  onClick={handleDownloadPDF}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2"
                >
                  <HiDownload className="w-4 h-4" />
                  Download PDF
                </button>
              )}
            </div>
          </div>

          {/* Info Panel */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <HiCalendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Disetujui Pada</p>
                  <p className="font-semibold text-slate-800">
                    {new Date(laporanData.approvedAt).toLocaleDateString(
                      "id-ID",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      },
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <HiCheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Mentor Penilai</p>
                  <p className="font-semibold text-slate-800">
                    {laporanData.mentor.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <HiExclamation className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status Final</p>
                  <p className="font-semibold text-slate-800">
                    Tidak Dapat Diubah
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Judul Laporan */}
          <Section title="Judul Laporan Akhir">
            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800">
                {laporanData.judul}
              </h2>
            </div>
          </Section>

          {/* Ringkasan Kegiatan */}
          <Section title="Ringkasan Kegiatan Magang">
            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <div className="prose max-w-none">
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {laporanData.ringkasan}
                </p>
              </div>
            </div>
          </Section>

          {/* Hasil & Pencapaian */}
          <Section title="Hasil & Pencapaian">
            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <div className="prose max-w-none">
                <ul className="space-y-3">
                  {laporanData.hasil
                    .split("\n")
                    .map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                          {index + 1}
                        </span>
                        <span className="text-slate-700">{item}</span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </Section>

          {/* Kendala */}
          <Section title="Kendala Selama Magang">
            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <div className="prose max-w-none">
                <ul className="space-y-3">
                  {laporanData.kendala
                    .split("\n")
                    .map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                          {index + 1}
                        </span>
                        <span className="text-slate-700">{item}</span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </Section>

          {/* Kesimpulan */}
          <Section title="Kesimpulan">
            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <div className="prose max-w-none">
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {laporanData.kesimpulan}
                </p>
              </div>
            </div>
          </Section>

          {/* Saran */}
          <Section title="Saran (Opsional)">
            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <div className="prose max-w-none">
                <ul className="space-y-3">
                  {laporanData.saran
                    .split("\n")
                    .map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                          {index + 1}
                        </span>
                        <span className="text-slate-700">{item}</span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </Section>

          {/* Catatan Mentor */}
          {laporanData.mentorNote && (
            <Section title="Catatan Mentor">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white rounded-lg border shadow-sm">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                      {laporanData.mentor.name.charAt(0)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-slate-800">
                          {laporanData.mentor.name}
                        </h4>
                        <p className="text-sm text-slate-500">
                          {laporanData.mentor.posisiMentor}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(laporanData.approvedAt).toLocaleDateString(
                          "id-ID",
                        )}
                      </span>
                    </div>
                    <div className="prose max-w-none">
                      <p className="text-slate-700 italic border-l-4 border-blue-400 pl-4 py-2">
                        "{laporanData.mentorNote}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Action Buttons */}
          {!laporanData.status && (
            <div className="sticky bottom-6 mt-10">
              <div className="bg-white rounded-2xl border shadow-lg p-6 max-w-2xl mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <HiExclamation className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">
                        Laporan Akhir
                      </p>
                      <p className="text-sm text-slate-500">
                        Pastikan semua data sudah benar
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => window.print()}
                      className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                      <HiEye className="w-4 h-4" />
                      Preview
                    </button>
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all shadow-sm hover:shadow flex items-center gap-2"
                    >
                      <HiCheckCircle className="w-4 h-4" />
                      Kirim Laporan Akhir
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                  <HiExclamation className="w-6 h-6 text-amber-600" />
                  Konfirmasi Pengiriman
                </h3>
                <p className="text-slate-600 mt-2">
                  Apakah Anda yakin ingin mengirim laporan akhir?
                </p>
              </div>

              <div className="p-6">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-amber-800 font-medium">
                    ⚠️ PERINGATAN: Setelah dikirim, laporan akhir tidak dapat
                    diubah kembali.
                  </p>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSubmitLaporan}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all shadow-sm"
                  >
                    Ya, Kirim Sekarang
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Reusable Section Component
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
        {title}
      </h2>
      {children}
    </div>
  );
}
