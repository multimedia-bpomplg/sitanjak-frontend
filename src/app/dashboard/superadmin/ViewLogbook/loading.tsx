import { TablePageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <TablePageSkeleton
      title="📖 Logbook Peserta"
      subtitle="Memuat riwayat logbook seluruh peserta..."
      columnsCount={6}
      rowsCount={6}
    />
  );
}

