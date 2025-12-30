export default function PesertaDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 text-gray-800 dark:text-gray-200">
      <h1 className="text-2xl font-bold mb-4">Selamat Datang 👋</h1>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Silakan isi logbook dan laporan magang Anda secara berkala.
      </p>

      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl h-[60vh] flex items-center justify-center bg-white dark:bg-gray-800">
        <span className="text-gray-400 dark:text-gray-500 text-sm">
          Content Peserta Akan Ditampilkan di Sini
        </span>
      </div>
    </div>
  );
}
