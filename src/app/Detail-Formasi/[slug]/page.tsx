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
    <main className="min-h-screen bg-gradient-to-br from-red-50 via-white to-yellow-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Back */}
        <Link
          href="/#formasi"
          className="inline-flex items-center text-gray-600 hover:text-[#7F1D1D] mb-6"
        >
          <HiArrowLeft className="mr-2" />
          Kembali ke Daftar Formasi
        </Link>

        {/* ================= HERO STATUS ================= */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            <div>
              <h1 className="text-3xl font-extrabold text-[#7F1D1D] mb-3">
                {data.title}
              </h1>

              <div className="flex flex-wrap gap-3 mb-4">
                <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-semibold">
                  Kuota: {data.kuota} orang
                </span>
                <span className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-sm font-semibold">
                  Durasi: {data.durasiMagang}
                </span>
                <span className="bg-yellow-100 text-yellow-800 px-4 py-1 rounded-full text-sm font-semibold">
                  Deadline: {data.deadlinePendaftaran}
                </span>
              </div>

              {/* Progress Visual */}
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Perkiraan Kuota Terisi</p>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-600"
                    style={{ width: "60%" }}
                  />
                </div>
              </div>
            </div>

            <Link
              href={`/pendaftaran?formasi=${data.id}`}
              className="bg-gradient-to-r from-[#7F1D1D] to-[#B91C1C] text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.03] transition"
            >
              Daftar Sekarang 🚀
            </Link>
          </div>
        </div>

        {/* ================= INSIGHT ================= */}
        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-200 rounded-2xl p-6 mb-8">
          <h2 className="font-bold text-lg text-[#7F1D1D] mb-2">
            🔮 Prediksi Kuota
          </h2>
          <p className="text-gray-700">
            Berdasarkan tren pendaftaran saat ini, kuota diperkirakan akan penuh dalam ±7 hari.
            Segera daftarkan diri Anda untuk mengamankan posisi.
          </p>
        </div>

        {/* ================= FORECAST SECTION ================= */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
          <h2 className="text-xl font-bold text-[#7F1D1D] mb-6">
            📅 Perkiraan Sisa Kuota per Tanggal
          </h2>

          <div className="space-y-6">

            {[
              { date: "20 Feb 2026", sisa: 3 },
              { date: "25 Feb 2026", sisa: 2 },
              { date: "28 Feb 2026", sisa: 0 },
            ].map((item, index) => (
              <div key={index}>
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-700">{item.date}</span>
                  <span className={`font-bold ${item.sisa === 0 ? "text-red-600" : "text-green-600"}`}>
                    {item.sisa === 0 ? "Penuh" : `${item.sisa} tersisa`}
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      item.sisa === 0
                        ? "bg-red-500"
                        : "bg-gradient-to-r from-green-400 to-emerald-600"
                    }`}
                    style={{ width: `${item.sisa * 20}%` }}
                  />
                </div>
              </div>
            ))}

          </div>
        </div>

        {/* ================= DETAIL GRID ================= */}
        <div className="grid lg:grid-cols-3 gap-8">

          {/* MAIN CONTENT */}
          <div className="lg:col-span-2 space-y-8">

            {/* Deskripsi */}
            <section className="bg-white rounded-3xl shadow-md p-8">
              <h2 className="text-xl font-bold text-[#7F1D1D] mb-4">
                Deskripsi Formasi
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {data.deskripsi}
              </p>
            </section>

            {/* Tugas */}
            <section className="bg-white rounded-3xl shadow-md p-8">
              <h2 className="text-xl font-bold text-[#7F1D1D] mb-4">
                Tugas & Tanggung Jawab
              </h2>
              <ul className="grid sm:grid-cols-2 gap-3">
                {data.tugas.map((tugas, index) => (
                  <li key={index} className="flex gap-2">
                    <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                    <span>{tugas}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Kualifikasi */}
            <section className="bg-white rounded-3xl shadow-md p-8">
              <h2 className="text-xl font-bold text-[#7F1D1D] mb-4">
                Kualifikasi
              </h2>
              <ul className="grid sm:grid-cols-2 gap-3">
                {data.kualifikasi.map((kualifikasi, index) => (
                  <li key={index} className="flex gap-2">
                    <HiCheckCircle className="text-green-500 mt-1 shrink-0" />
                    <span>{kualifikasi}</span>
                  </li>
                ))}
              </ul>
            </section>

          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">

            <div className="bg-white rounded-3xl shadow-md p-6">
              <h3 className="font-bold text-lg text-[#7F1D1D] mb-4">
                Informasi Penting
              </h3>
              <p className="text-gray-700 mb-3">
                <strong>Lokasi:</strong><br />{data.lokasi}
              </p>
              <p className="text-gray-700 mb-3">
                <strong>Jurusan:</strong>
              </p>
              <div className="flex flex-wrap gap-2">
                {data.jurusan.map((jur, i) => (
                  <span key={i} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                    {jur}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-3xl p-6 text-center">
              <h3 className="font-bold text-lg text-[#7F1D1D] mb-2">
                Siap Mendaftar?
              </h3>
              <Link
                href={`/pendaftaran?formasi=${data.id}`}
                className="block w-full bg-[#7F1D1D] text-white py-3 rounded-xl font-bold hover:bg-[#B91C1C] transition"
              >
                Daftar Sekarang
              </Link>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}
