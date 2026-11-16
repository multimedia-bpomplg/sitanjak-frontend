import { TablePageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <TablePageSkeleton
      title="Monitoring Logbook Peserta"
      subtitle="Memuat data logbook harian peserta magang..."
      columnsCount={5}
      rowsCount={8}
    />
  );
}
