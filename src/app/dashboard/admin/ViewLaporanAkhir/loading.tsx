import { TablePageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <TablePageSkeleton
      title="📑 Laporan Akhir"
      subtitle="Memuat berkas laporan akhir peserta magang..."
      columnsCount={6}
      rowsCount={5}
    />
  );
}

