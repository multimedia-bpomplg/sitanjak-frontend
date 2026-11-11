import { TablePageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <TablePageSkeleton
      title="📋 Pendaftaran Magang"
      subtitle="Memuat data pendaftaran magang..."
      columnsCount={7}
      rowsCount={6}
    />
  );
}

