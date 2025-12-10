export default function Footer() {
  return (
    <footer className="w-full bg-gray-900 text-white py-5 mt-10">
      <div className="text-center text-sm">
        © {new Date().getFullYear()} BPOM — Sistem Pendaftaran Magang
      </div>
    </footer>
  );
}
