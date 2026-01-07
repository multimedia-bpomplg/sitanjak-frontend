export default function PesertaDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 text-gray-800 dark:text-gray-200 space-y-6">
      {/* ===== HEADER ===== */}
      <div>
        <h1 className="text-2xl font-bold">Selamat Datang 👋</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Silakan isi logbook dan laporan magang Anda secara berkala.
        </p>
      </div>

      {/* ===== SUMMARY CARD ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="Hari Magang" value="23 Hari" />
        <DashboardCard title="Logbook Hari Ini" value="Belum Diisi" />
        <DashboardCard title="Laporan Bulanan" value="Menunggu" />
        <DashboardCard title="Status Magang" value="Aktif" />
      </div>

      {/* ===== REMINDER ===== */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-sm text-yellow-800 font-medium">⚠️ Reminder</p>
        <p className="text-sm text-yellow-700 mt-1">
          Anda belum mengisi logbook hari ini. Jangan lupa mengisi sebelum
          pulang.
        </p>
      </div>

      {/* ===== QUICK ACTION ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickAction title="Isi Logbook Harian" />
        <QuickAction title="Upload Laporan Bulanan" />
        <QuickAction title="Lihat Riwayat Magang" />
      </div>

      {/* ===== MAIN CONTENT PLACEHOLDER ===== */}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl h-[35vh] flex items-center justify-center bg-white dark:bg-gray-800">
        <span className="text-gray-400 dark:text-gray-500 text-sm">
          Konten Peserta Akan Ditampilkan di Sini
        </span>
      </div>
    </div>
  );
}

/* ===== COMPONENT ===== */

function DashboardCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border">
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="text-xl font-bold mt-1">{value}</h2>
    </div>
  );
}

function QuickAction({ title }: { title: string }) {
  return (
    <button
      className="
      bg-white dark:bg-gray-800
      border rounded-xl p-4
      text-left shadow
      hover:bg-blue-50 dark:hover:bg-gray-700
      transition
    "
    >
      <p className="font-semibold">{title}</p>
      <p className="text-xs text-gray-500 mt-1">Klik untuk membuka</p>
    </button>
  );
}
