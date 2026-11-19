import { TablePageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <TablePageSkeleton
      title="Evaluasi & Surat Pernyataan"
      subtitle="Memuat daftar evaluasi & surat pernyataan peserta bimbingan..."
      columnsCount={5}
      rowsCount={6}
    />
  );
}
