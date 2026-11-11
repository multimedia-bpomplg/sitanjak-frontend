import { TablePageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <TablePageSkeleton
      title="💬 Feedback Peserta"
      subtitle="Memuat feedback dan evaluasi magang..."
      columnsCount={5}
      rowsCount={5}
    />
  );
}

