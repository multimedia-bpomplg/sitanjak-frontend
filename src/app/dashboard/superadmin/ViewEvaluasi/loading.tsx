import { TablePageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <TablePageSkeleton
      title="Evaluasi & Surat Pernyataan"
      subtitle="Memuat daftar evaluasi & surat pernyataan peserta magang..."
      columnsCount={6}
      rowsCount={6}
    />
  );
}
