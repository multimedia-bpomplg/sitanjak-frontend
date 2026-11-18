import { TablePageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <TablePageSkeleton
      title="Penilaian Akhir Magang"
      subtitle="Memuat status & nilai akhir seluruh peserta magang..."
      columnsCount={6}
      rowsCount={6}
    />
  );
}
