import { TablePageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <TablePageSkeleton
      title="📖 Review Logbook Peserta"
      subtitle="Memuat logbook harian peserta bimbingan..."
      columnsCount={6}
      rowsCount={5}
    />
  );
}

