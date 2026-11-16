import { TablePageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <TablePageSkeleton
      title="Manajemen Pendaftaran Magang"
      subtitle="Memuat data pendaftaran magang..."
      columnsCount={6}
      rowsCount={8}
    />
  );
}
