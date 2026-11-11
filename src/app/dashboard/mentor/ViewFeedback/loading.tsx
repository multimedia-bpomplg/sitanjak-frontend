import { TablePageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <TablePageSkeleton
      title="💬 Feedback Peserta Bimbingan"
      subtitle="Memuat feedback dari peserta..."
      columnsCount={5}
      rowsCount={5}
    />
  );
}

