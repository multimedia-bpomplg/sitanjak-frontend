import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-blue-700">
          BPOM Magang
        </Link>

        {/* Menu */}
        <div className="space-x-6 flex items-center">
          <Link
            href="/"
            className="text-gray-700 hover:text-blue-600 font-medium"
          >
            Home
          </Link>

          <Link
            href="/features"
            className="text-gray-700 hover:text-blue-600 font-medium"
          >
            Fitur
          </Link>

          {/* Superadmin */}
          <Link
            href="/dashboard/superadmin"
            className="text-gray-700 hover:text-blue-600 font-medium"
          >
            Superadmin
          </Link>

          {/* Admin */}
          <Link
            href="/dashboard/admin"
            className="text-gray-700 hover:text-blue-600 font-medium"
          >
            Admin
          </Link>

          {/* Mentor */}
          <Link
            href="/dashboard/mentor"
            className="text-gray-700 hover:text-blue-600 font-medium"
          >
            Mentor
          </Link>

          {/* Peserta */}
          <Link
            href="/dashboard/peserta"
            className="text-gray-700 hover:text-blue-600 font-medium"
          >
            Peserta
          </Link>

          <Link
            href="/pendaftaran"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Daftar
          </Link>

          <Link
            href="/auth/login"
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
          >
            Login
          </Link>
        </div>
      </div>
    </nav>
  );
}
