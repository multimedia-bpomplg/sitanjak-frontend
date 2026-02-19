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
  HiFolder,
  HiDocumentDuplicate,
  HiCalculator,
  HiArchive,
} from "react-icons/hi";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tata Usaha - Formasi Magang Balai Besar POM Palembang",
  description:
    "Informasi lengkap formasi magang Bagian Tata Usaha di Balai Besar POM Palembang",
};

export default function TataUsahaPage() {
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
        <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-8 py-10 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
                Bagian Tata Usaha
              </h1>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium">
                  Kuota: 5 orang
                </span>
                <span className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium">
                  Durasi: 3-6 bulan
                </span>
                <span className="bg-yellow-500 text-gray-800 px-4 py-1.5 rounded-full text-sm font-bold">
                  Deadline: 31 Desember 2024
                </span>
              </div>
            </div>
            <Link
              href="/pendaftaran?formasi=tata-usaha"
              className="bg-white text-gray-800 px-8 py-3 rounded-xl font-bold hover:bg-yellow-400 transition-colors text-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <HiDocumentText className="text-yellow-500" />
                  Deskripsi Formasi
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Formasi Tata Usaha berperan dalam administrasi, pengelolaan
                  surat, arsip, serta dukungan operasional kegiatan perkantoran
                  di Balai Besar POM Palembang. Magang di bagian ini akan
                  memberikan pengalaman dalam manajemen administrasi perkantoran
                  dan tata kelola dokumen instansi pemerintah.
                </p>
              </section>

              {/* Tugas */}
              <section>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <HiBriefcase className="text-yellow-500" />
                  Tugas dan Tanggung Jawab
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <HiFolder className="text-gray-700 text-2xl mb-2" />
                    <h3 className="font-semibold mb-2">Surat Menyurat</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm">
                        <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                        <span>Mengelola surat masuk dan keluar</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                        <span>Mendistribusikan surat ke bagian terkait</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                        <span>Membuat konsep surat dinas</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <HiArchive className="text-gray-700 text-2xl mb-2" />
                    <h3 className="font-semibold mb-2">Kearsipan</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm">
                        <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                        <span>Mengarsip dokumen secara digital</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                        <span>Mengelola arsip fisik</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                        <span>Sistem pencarian dokumen</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <HiDocumentDuplicate className="text-gray-700 text-2xl mb-2" />
                    <h3 className="font-semibold mb-2">Administrasi</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm">
                        <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                        <span>Administrasi kepegawaian</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                        <span>Pendataan kegiatan internal</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                        <span>Menyusun laporan administrasi</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <HiCalculator className="text-gray-700 text-2xl mb-2" />
                    <h3 className="font-semibold mb-2">Operasional</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm">
                        <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                        <span>Membantu persiapan rapat</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                        <span>Mengelola inventaris kantor</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                        <span>Dokumentasi kegiatan</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Kualifikasi */}
              <section>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <HiAcademicCap className="text-yellow-500" />
                  Kualifikasi
                </h2>
                <div className="bg-gray-50 rounded-2xl p-6">
                  <ul className="grid sm:grid-cols-2 gap-3">
                    <li className="flex items-start gap-2">
                      <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                      <span>Mahasiswa aktif minimal semester 4</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                      <span>IPK minimal 3.00</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                      <span>Jurusan Administrasi/Manajemen/Akuntansi</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                      <span>Menguasai Microsoft Office</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                      <span>Teliti dan detail oriented</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                      <span>Mampu bekerja dalam tim</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Benefit */}
              <section>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
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
                      <span>Pengalaman administrasi pemerintah</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <HiCheckCircle className="text-green-600 mt-1 shrink-0" />
                      <span>Bimbingan dari pegawai profesional</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <HiCheckCircle className="text-green-600 mt-1 shrink-0" />
                      <span>Relasi dan jaringan profesional</span>
                    </li>
                  </ul>
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="font-bold text-lg text-gray-800 mb-4">
                  Informasi Penting
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <HiOutlineOfficeBuilding className="text-gray-700 text-xl shrink-0 mt-1" />
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
                        {[
                          "Administrasi",
                          "Manajemen",
                          "Akuntansi",
                          "Administrasi Perkantoran",
                        ].map((jur, index) => (
                          <span
                            key={index}
                            className="bg-white px-3 py-1 rounded-full text-sm shadow-sm"
                          >
                            {jur}
                          </span>
                        ))}
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

              <div className="bg-gray-800 text-white rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <HiLocationMarker />
                  Kontak Person
                </h3>
                <div className="space-y-3">
                  <p className="text-white/90">
                    <span className="font-semibold">Narahubung:</span>
                    <br />
                    Ibu Siti (Kepala Subbagian Tata Usaha)
                  </p>
                  <p className="text-white/90">
                    <span className="font-semibold">Email:</span>
                    <br />
                    <a
                      href="mailto:tatausaha@pompalembang.go.id"
                      className="hover:text-yellow-300"
                    >
                      tatausaha@pompalembang.go.id
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
