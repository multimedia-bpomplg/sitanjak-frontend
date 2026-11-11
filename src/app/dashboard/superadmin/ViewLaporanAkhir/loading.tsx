import { TablePageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <TablePageSkeleton
      title="📑 Laporan Akhir"
      subtitle="Memuat seluruh laporan akhir magang..."
      columnsCount={6}
      rowsCount={5}
    />
  );
}

