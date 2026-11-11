import { TablePageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <TablePageSkeleton
      title="📑 Review Laporan Akhir"
      subtitle="Memuat laporan akhir peserta bimbingan..."
      columnsCount={6}
      rowsCount={5}
    />
  );
}

