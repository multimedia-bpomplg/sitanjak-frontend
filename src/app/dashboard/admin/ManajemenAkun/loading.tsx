import { TablePageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <TablePageSkeleton
      title="🔐 Manajemen Akun"
      subtitle="Memuat daftar pengguna sistem..."
      columnsCount={5}
      rowsCount={6}
    />
  );
}

