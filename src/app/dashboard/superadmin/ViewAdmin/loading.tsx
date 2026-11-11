import { TablePageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <TablePageSkeleton
      title="🛡️ Manajemen Admin"
      subtitle="Memuat daftar administrator sistem..."
      columnsCount={5}
      rowsCount={5}
    />
  );
}

