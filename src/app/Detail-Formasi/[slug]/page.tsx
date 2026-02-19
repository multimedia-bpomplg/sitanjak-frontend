import { notFound } from "next/navigation";
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
} from "react-icons/hi";
import { Metadata } from "next";

// Tipe data untuk formasi detail
type FormasiDetail = {
  id: string;
  title: string;
  deskripsi: string;
  tugas: string[];
  jurusan: string[];
  kualifikasi: string[];
  kuota: number;
  lokasi: string;
  durasiMagang: string;
  benefit: string[];
  kontakPerson: string;
  emailKontak: string;
  deadlinePendaftaran: string;
};

// Data formasi (bisa diganti dengan fetch dari API)
const FORMASI_DATA: Record<string, FormasiDetail> = {
  "tata-usaha": {
    id: "tata-usaha",
    title: "Bagian Tata Usaha",
    deskripsi:
      "Formasi Tata Usaha berperan dalam administrasi, pengelolaan surat, arsip, serta dukungan operasional kegiatan perkantoran di Balai Besar POM Palembang.",
    tugas: [
      "Mengelola surat masuk dan keluar",
      "Melakukan pengarsipan dokumen secara digital dan fisik",
      "Membantu administrasi kepegawaian",
      "Melakukan pendataan kegiatan internal kantor",
      "Membantu persiapan rapat dan dokumentasi",
      "Mengelola inventaris kantor",
    ],
    jurusan: [
      "Administrasi Perkantoran",
      "Manajemen Administrasi",
      "Administrasi Bisnis",
      "Akuntansi",
      "Manajemen",
    ],
    kualifikasi: [
      "Mahasiswa aktif minimal semester 4",
      "IPK minimal 3.00",
      "Menguasai Microsoft Office (Word, Excel, PowerPoint)",
      "Teliti dan memiliki kemampuan administrasi yang baik",
      "Mampu bekerja dalam tim",
      "Bersedia magang minimal 3 bulan",
    ],
    kuota: 5,
    lokasi:
      "Balai Besar POM Palembang, Jl. Inspektur Marzuki No. 1234, Palembang",
    durasiMagang: "3-6 bulan",
    benefit: [
      "Sertifikat magang",
      "Uang transport",
      "Pengalaman kerja di instansi pemerintah",
      "Bimbingan dari pegawai profesional",
      "Relasi dan jaringan profesional",
    ],
    kontakPerson: "Ibu Siti (Kepala Subbagian Tata Usaha)",
    emailKontak: "tatausaha@pompalembang.go.id",
    deadlinePendaftaran: "31 Desember 2024",
  },

  infokom: {
    id: "infokom",
    title: "Fungsi Informasi dan Komunikasi",
    deskripsi:
      "Formasi Infokom berfokus pada pengelolaan informasi publik, media sosial, dokumentasi, dan komunikasi kelembagaan di Balai Besar POM Palembang.",
    tugas: [
      "Mengelola konten media sosial (Instagram, Twitter, Facebook)",
      "Membuat konten informasi dan edukasi publik",
      "Melakukan dokumentasi foto dan video kegiatan",
      "Membantu publikasi dan komunikasi publik",
      "Mengelola website dan konten digital",
      "Membuat laporan kegiatan kehumasan",
    ],
    jurusan: [
      "Ilmu Komunikasi",
      "Jurnalistik",
      "Public Relations",
      "Desain Komunikasi Visual",
      "Marketing Komunikasi",
    ],
    kualifikasi: [
      "Mahasiswa aktif minimal semester 4",
      "IPK minimal 3.00",
      "Memiliki kemampuan menulis yang baik",
      "Menguasai dasar-dasar desain grafis (Canva/Photoshop)",
      "Aktif di media sosial",
      "Kreatif dan inovatif",
    ],
    kuota: 5,
    lokasi:
      "Balai Besar POM Palembang, Jl. Inspektur Marzuki No. 1234, Palembang",
    durasiMagang: "3-6 bulan",
    benefit: [
      "Sertifikat magang",
      "Uang transport",
      "Portfolio konten",
      "Pengalaman di bidang kehumasan pemerintah",
      "Jaringan profesional",
    ],
    kontakPerson: "Bapak Ahmad (Kasubbag Informasi dan Komunikasi)",
    emailKontak: "infokom@pompalembang.go.id",
    deadlinePendaftaran: "31 Desember 2024",
  },

  penindakan: {
    id: "penindakan",
    title: "Fungsi Penindakan",
    deskripsi:
      "Formasi Penindakan mendukung kegiatan penindakan terhadap pelanggaran di bidang obat dan makanan di wilayah Sumatera Selatan.",
    tugas: [
      "Membantu pendampingan kegiatan penindakan",
      "Melakukan pengolahan data pelanggaran",
      "Membantu penyusunan laporan penindakan",
      "Melakukan dokumentasi kegiatan penindakan",
      "Membantu analisis kasus pelanggaran",
      "Koordinasi dengan instansi terkait",
    ],
    jurusan: [
      "Ilmu Hukum",
      "Hukum Pidana",
      "Hukum Administrasi Negara",
      "Kriminologi",
    ],
    kualifikasi: [
      "Mahasiswa aktif minimal semester 5",
      "IPK minimal 3.25",
      "Memahami dasar-dasar hukum Indonesia",
      "Memiliki kemampuan analisis yang baik",
      "Teliti dan bertanggung jawab",
      "Bersedia melakukan tugas lapangan",
    ],
    kuota: 5,
    lokasi:
      "Balai Besar POM Palembang, Jl. Inspektur Marzuki No. 1234, Palembang",
    durasiMagang: "3-6 bulan",
    benefit: [
      "Sertifikat magang",
      "Uang transport",
      "Pengalaman di bidang penegakan hukum",
      "Bimbingan dari penyidik pegawai negeri sipil (PPNS)",
      "Relasi profesional",
    ],
    kontakPerson: "Bapak Hendra (Koordinator Fungsi Penindakan)",
    emailKontak: "penindakan@pompalembang.go.id",
    deadlinePendaftaran: "31 Desember 2024",
  },

  pengujian: {
    id: "pengujian",
    title: "Fungsi Pengujian",
    deskripsi:
      "Formasi Pengujian mendukung kegiatan pengujian sampel obat dan makanan di laboratorium terakreditasi Balai Besar POM Palembang.",
    tugas: [
      "Membantu persiapan sampel uji",
      "Melakukan dokumentasi hasil pengujian",
      "Membantu pemeliharaan alat laboratorium",
      "Mencatat dan mengolah data hasil uji",
      "Membantu kalibrasi alat sederhana",
      "Menjaga kebersihan area laboratorium",
    ],
    jurusan: ["Kimia", "Farmasi", "Analis Kimia", "Biologi", "Teknik Kimia"],
    kualifikasi: [
      "Mahasiswa aktif minimal semester 5",
      "IPK minimal 3.00",
      "Memahami dasar-dasar kimia analisis",
      "Teliti dan cermat dalam bekerja",
      "Memahami K3 laboratorium",
      "Bersedia bekerja dengan sampel uji",
    ],
    kuota: 5,
    lokasi:
      "Balai Besar POM Palembang, Jl. Inspektur Marzuki No. 1234, Palembang",
    durasiMagang: "3-6 bulan",
    benefit: [
      "Sertifikat magang",
      "Uang transport",
      "Pengalaman di laboratorium terakreditasi",
      "Bimbingan dari analis profesional",
      "Sertifikat pelatihan K3 laboratorium",
    ],
    kontakPerson: "Ibu Dr. Dewi (Koordinator Laboratorium)",
    emailKontak: "pengujian@pompalembang.go.id",
    deadlinePendaftaran: "31 Desember 2024",
  },

  pemeriksaan: {
    id: "pemeriksaan",
    title: "Fungsi Pemeriksaan (Inspeksi dan Sertifikasi)",
    deskripsi:
      "Formasi Pemeriksaan mendukung kegiatan pemeriksaan, inspeksi, dan sertifikasi produk obat dan makanan di Balai Besar POM Palembang.",
    tugas: [
      "Membantu pendampingan inspeksi ke sarana produksi",
      "Melakukan pengolahan data sertifikasi",
      "Membantu administrasi pemeriksaan",
      "Menyusun laporan hasil inspeksi",
      "Membantu verifikasi dokumen sertifikasi",
      "Koordinasi dengan pelaku usaha",
    ],
    jurusan: [
      "Sistem Informasi",
      "Teknik Informatika",
      "Manajemen",
      "Administrasi Bisnis",
      "Kesehatan Masyarakat",
    ],
    kualifikasi: [
      "Mahasiswa aktif minimal semester 5",
      "IPK minimal 3.00",
      "Menguasai Microsoft Office",
      "Memiliki kemampuan komunikasi yang baik",
      "Teliti dan mampu bekerja dengan deadline",
      "Bersedia melakukan kunjungan lapangan",
    ],
    kuota: 5,
    lokasi:
      "Balai Besar POM Palembang, Jl. Inspektur Marzuki No. 1234, Palembang",
    durasiMagang: "3-6 bulan",
    benefit: [
      "Sertifikat magang",
      "Uang transport",
      "Pengalaman di bidang inspeksi dan sertifikasi",
      "Bimbingan dari auditor profesional",
      "Relasi dengan pelaku usaha",
    ],
    kontakPerson: "Bapak Budi (Koordinator Pemeriksaan)",
    emailKontak: "pemeriksaan@pompalembang.go.id",
    deadlinePendaftaran: "31 Desember 2024",
  },
};

// Generate metadata untuk SEO
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const data = FORMASI_DATA[params.slug];

  if (!data) {
    return {
      title: "Formasi Tidak Ditemukan - Balai Besar POM Palembang",
      description: "Formasi magang yang Anda cari tidak ditemukan",
    };
  }

  return {
    title: `${data.title} - Formasi Magang Balai Besar POM Palembang`,
    description: data.deskripsi,
    openGraph: {
      title: data.title,
      description: data.deskripsi,
      type: "website",
    },
  };
}

export default function DetailFormasiPage({
  params,
}: {
  params: { slug: string };
}) {
  const data = FORMASI_DATA[params.slug];

  if (!data) return notFound();

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
        <div className="bg-gradient-to-r from-[#7F1D1D] to-[#B91C1C] px-8 py-10 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
                {data.title}
              </h1>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium">
                  Kuota: {data.kuota} orang
                </span>
                <span className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium">
                  Durasi: {data.durasiMagang}
                </span>
                <span className="bg-yellow-500 text-[#7F1D1D] px-4 py-1.5 rounded-full text-sm font-bold">
                  Deadline: {data.deadlinePendaftaran}
                </span>
              </div>
            </div>
            <Link
              href={`/pendaftaran?formasi=${data.id}`}
              className="bg-white text-[#7F1D1D] px-8 py-3 rounded-xl font-bold hover:bg-yellow-400 transition-colors text-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Daftar Sekarang
            </Link>
          </div>
        </div>

        {/* Content Grid */}
        <div className="p-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Main Content - 2 columns */}
            <div className="md:col-span-2 space-y-8">
              {/* Deskripsi */}
              <section>
                <h2 className="text-xl font-bold text-[#7F1D1D] mb-4 flex items-center gap-2">
                  <HiDocumentText className="text-[#FACC15]" />
                  Deskripsi Formasi
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {data.deskripsi}
                </p>
              </section>

              {/* Tugas dan Tanggung Jawab */}
              <section>
                <h2 className="text-xl font-bold text-[#7F1D1D] mb-4 flex items-center gap-2">
                  <HiBriefcase className="text-[#FACC15]" />
                  Tugas dan Tanggung Jawab
                </h2>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {data.tugas.map((tugas, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                      <span className="text-gray-700">{tugas}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Kualifikasi */}
              <section>
                <h2 className="text-xl font-bold text-[#7F1D1D] mb-4 flex items-center gap-2">
                  <HiAcademicCap className="text-[#FACC15]" />
                  Kualifikasi
                </h2>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {data.kualifikasi.map((kualifikasi, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                      <span className="text-gray-700">{kualifikasi}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Benefit */}
              <section>
                <h2 className="text-xl font-bold text-[#7F1D1D] mb-4 flex items-center gap-2">
                  <HiClipboardList className="text-[#FACC15]" />
                  Benefit Magang
                </h2>
                <div className="bg-green-50 rounded-2xl p-6">
                  <ul className="grid sm:grid-cols-2 gap-3">
                    {data.benefit.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <HiCheckCircle className="text-green-600 mt-1 shrink-0" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </div>

            {/* Sidebar - 1 column */}
            <div className="space-y-6">
              {/* Info Card */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="font-bold text-lg text-[#7F1D1D] mb-4">
                  Informasi Penting
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <HiOutlineOfficeBuilding className="text-[#B91C1C] text-xl shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-sm text-gray-500">
                        LOKASI
                      </p>
                      <p className="text-gray-800">{data.lokasi}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <HiUsers className="text-[#FACC15] text-xl shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-sm text-gray-500">
                        JURUSAN YANG DITERIMA
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {data.jurusan.map((jur, index) => (
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
                    <HiCalendar className="text-blue-500 text-xl shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-sm text-gray-500">
                        DEADLINE PENDAFTARAN
                      </p>
                      <p className="text-red-600 font-bold">
                        {data.deadlinePendaftaran}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kontak Card */}
              <div className="bg-[#7F1D1D] text-white rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <HiLocationMarker />
                  Kontak Person
                </h3>
                <div className="space-y-3">
                  <p className="text-white/90">
                    <span className="font-semibold">Narahubung:</span>
                    <br />
                    {data.kontakPerson}
                  </p>
                  <p className="text-white/90">
                    <span className="font-semibold">Email:</span>
                    <br />
                    <a
                      href={`mailto:${data.emailKontak}`}
                      className="hover:text-yellow-300 transition-colors"
                    >
                      {data.emailKontak}
                    </a>
                  </p>
                </div>
              </div>

              {/* CTA Card */}
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl p-6 text-center">
                <h3 className="font-bold text-lg text-[#7F1D1D] mb-2">
                  Tertarik Bergabung?
                </h3>
                <p className="text-[#7F1D1D]/80 text-sm mb-4">
                  Jangan lewatkan kesempatan magang di Balai Besar POM Palembang
                </p>
                <Link
                  href={`/pendaftaran?formasi=${data.id}`}
                  className="block w-full bg-[#7F1D1D] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#B91C1C] transition-colors"
                >
                  Daftar Sekarang
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
