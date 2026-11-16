import { TablePageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <TablePageSkeleton
      title="Evaluasi & Feedback Peserta"
      subtitle="Memuat ringkasan feedback dan rating survei peserta..."
      columnsCount={6}
      rowsCount={8}
    />
  );
}
