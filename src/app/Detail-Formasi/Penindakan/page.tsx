import Link from "next/link";
import {
  HiOutlineOfficeBuilding,
  HiUsers,
  HiAcademicCap,
  HiCheckCircle,
  HiArrowLeft,
  HiBriefcase,
  HiLocationMarker,
  HiDocumentText,
  HiCalendar,
  HiClipboardList,
  HiScale,
  HiShieldExclamation,
  HiDocumentReport,
  HiSearch,
} from "react-icons/hi";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Penindakan - Formasi Magang Balai Besar POM Palembang",
  description:
    "Informasi lengkap formasi magang Fungsi Penindakan di Balai Besar POM Palembang",
};

export default function PenindakanPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      {/* Back Button */}
      <div className="max-w-6xl mx-auto mb-6">
        <Link
          href="/#formasi"
          className="inline-flex items-center text-gray-600 hover:text-[#7F1D1D] transition-colors group"
        >
          <HiArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
          <span>Kembali ke Daftar Formasi</span>
        </Link>
      </div>

      {/* Header Section */}
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-10 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
                Fungsi Penindakan
              </h1>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium">
                  Kuota: 5 orang
                </span>
                <span className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium">
                  Durasi: 3-6 bulan
                </span>
                <span className="bg-yellow-500 text-red-600 px-4 py-1.5 rounded-full text-sm font-bold">
                  Deadline: 31 Desember 2024
                </span>
              </div>
            </div>
            <Link
              href="/pendaftaran?formasi=penindakan"
              className="bg-white text-red-600 px-8 py-3 rounded-xl font-bold hover:bg-yellow-400 transition-colors text-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Daftar Sekarang
            </Link>
          </div>
        </div>

        {/* Content Grid */}
        <div className="p-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-8">
              {/* Deskripsi */}
              <section>
                <h2 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
                  <HiDocumentText className="text-yellow-500" />
                  Deskripsi Formasi
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Formasi Penindakan mendukung kegiatan penindakan terhadap
                  pelanggaran di bidang obat dan makanan di wilayah Sumatera
                  Selatan. Magang di bagian ini akan memberikan pengalaman dalam
                  proses penegakan hukum, penyidikan, dan penanganan kasus
                  pelanggaran.
                </p>
              </section>

              {/* Tugas */}
              <section>
                <h2 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
                  <HiBriefcase className="text-yellow-500" />
                  Tugas dan Tanggung Jawab
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-red-50 rounded-xl p-4">
                    <HiScale className="text-red-600 text-2xl mb-2" />
                    <h3 className="font-semibold mb-2">Pendampingan</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm">
                        <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                        <span>Mendampingi kegiatan penindakan</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                        <span>Membantu operasi lapangan</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                        <span>Dokumentasi kegiatan penindakan</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-red-50 rounded-xl p-4">
                    <HiDocumentReport className="text-red-600 text-2xl mb-2" />
                    <h3 className="font-semibold mb-2">Administrasi</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm">
                        <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                        <span>Mengolah data pelanggaran</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                        <span>Menyusun laporan penindakan</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                        <span>Mengarsip dokumen kasus</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-red-50 rounded-xl p-4">
                    <HiSearch className="text-red-600 text-2xl mb-2" />
                    <h3 className="font-semibold mb-2">Analisis</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm">
                        <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                        <span>Menganalisis kasus pelanggaran</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                        <span>Studi kasus dan putusan</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                        <span>Rekomendasi tindakan</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-red-50 rounded-xl p-4">
                    <HiShieldExclamation className="text-red-600 text-2xl mb-2" />
                    <h3 className="font-semibold mb-2">Koordinasi</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm">
                        <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                        <span>Koordinasi dengan instansi terkait</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                        <span>Komunikasi dengan tim PPNS</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                        <span>Follow up kasus</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Kualifikasi */}
              <section>
                <h2 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
                  <HiAcademicCap className="text-yellow-500" />
                  Kualifikasi
                </h2>
                <div className="bg-gray-50 rounded-2xl p-6">
                  <ul className="grid sm:grid-cols-2 gap-3">
                    <li className="flex items-start gap-2">
                      <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                      <span>Mahasiswa aktif minimal semester 5</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                      <span>IPK minimal 3.25</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                      <span>Jurusan Hukum/Ilmu Hukum</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                      <span>Memahami dasar hukum Indonesia</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                      <span>Analitis dan teliti</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                      <span>Bersedia tugas lapangan</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Benefit */}
              <section>
                <h2 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
                  <HiClipboardList className="text-yellow-500" />
                  Benefit Magang
                </h2>
                <div className="bg-green-50 rounded-2xl p-6">
                  <ul className="grid sm:grid-cols-2 gap-3">
                    <li className="flex items-start gap-2">
                      <HiCheckCircle className="text-green-600 mt-1 shrink-0" />
                      <span>Sertifikat magang</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <HiCheckCircle className="text-green-600 mt-1 shrink-0" />
                      <span>Uang transport</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <HiCheckCircle className="text-green-600 mt-1 shrink-0" />
                      <span>Pengalaman di bidang penegakan hukum</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <HiCheckCircle className="text-green-600 mt-1 shrink-0" />
                      <span>Bimbingan dari PPNS</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <HiCheckCircle className="text-green-600 mt-1 shrink-0" />
                      <span>Relasi profesional</span>
                    </li>
                  </ul>
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="font-bold text-lg text-red-600 mb-4">
                  Informasi Penting
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <HiOutlineOfficeBuilding className="text-red-600 text-xl shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-sm text-gray-500">
                        LOKASI
                      </p>
                      <p className="text-gray-800">Balai Besar POM Palembang</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <HiUsers className="text-yellow-500 text-xl shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-sm text-gray-500">
                        JURUSAN
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {["Ilmu Hukum", "Hukum Pidana", "Kriminologi"].map(
                          (jur, index) => (
                            <span
                              key={index}
                              className="bg-white px-3 py-1 rounded-full text-sm shadow-sm"
                            >
                              {jur}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <HiCalendar className="text-red-500 text-xl shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-sm text-gray-500">
                        DEADLINE
                      </p>
                      <p className="text-red-600 font-bold">31 Desember 2024</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-red-600 text-white rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <HiLocationMarker />
                  Kontak Person
                </h3>
                <div className="space-y-3">
                  <p className="text-white/90">
                    <span className="font-semibold">Narahubung:</span>
                    <br />
                    Bapak Hendra (Koordinator Penindakan)
                  </p>
                  <p className="text-white/90">
                    <span className="font-semibold">Email:</span>
                    <br />
                    <a
                      href="mailto:penindakan@pompalembang.go.id"
                      className="hover:text-yellow-300"
                    >
                      penindakan@pompalembang.go.id
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
