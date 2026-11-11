import { TablePageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <TablePageSkeleton
      title="📅 Logbook Harian"
      subtitle="Memuat kalender dan aktivitas logbook harian..."
      columnsCount={4}
      rowsCount={4}
    />
  );
}

