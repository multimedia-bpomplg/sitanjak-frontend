import Navbar from "@/app/components/ui/Navbar";
import Footer from "@/app/components/ui/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* HERO SECTION */}
      <section className="container mx-auto px-6 py-20 flex flex-col lg:flex-row items-center">
        <div className="flex-1 space-y-5">
          <h1 className="text-4xl lg:text-5xl font-bold text-blue-700 leading-tight">
            Sistem Pendaftaran Magang <br />
            <span className="text-blue-500">BPOM</span>
          </h1>

          <p className="text-gray-600 max-w-lg">
            Selamat datang di sistem informasi pendaftaran magang resmi Badan
            Pengawas Obat dan Makanan (BPOM). Daftarkan diri Anda untuk
            mengikuti program magang dan dapatkan pengalaman profesional.
          </p>

          <div className="flex gap-4 pt-4">
            <a
              href="/auth/register"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
            >
              Daftar Sekarang
            </a>

            <a
              href="/auth/login"
              className="px-6 py-3 border border-blue-600 text-blue-700 rounded-lg hover:bg-blue-50"
            >
              Login
            </a>
          </div>
        </div>

        <div className="flex-1 mt-10 lg:mt-0 flex justify-center">
          <img
            src="https://www.bpom.go.id/assets/dokumen/BPOM.png"
            alt="BPOM Logo"
            className="w-72 opacity-90"
          />
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-center text-3xl font-bold text-gray-800 mb-10">
            Mengapa Magang di BPOM?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 shadow rounded-lg bg-white">
              <h3 className="text-xl font-semibold text-blue-600 mb-2">
                Pembelajaran Nyata
              </h3>
              <p className="text-gray-600">
                Magang langsung bersama tenaga ahli dan praktisi profesional
                BPOM.
              </p>
            </div>

            <div className="p-6 shadow rounded-lg bg-white">
              <h3 className="text-xl font-semibold text-blue-600 mb-2">
                Proyek Resmi
              </h3>
              <p className="text-gray-600">
                Mengikuti pekerjaan nyata seperti penanganan data, pengawasan,
                dan administrasi.
              </p>
            </div>

            <div className="p-6 shadow rounded-lg bg-white">
              <h3 className="text-xl font-semibold text-blue-600 mb-2">
                Sertifikat Magang
              </h3>
              <p className="text-gray-600">
                Mendapatkan sertifikat resmi sebagai bukti pengalaman kerja di
                BPOM.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
