import { TablePageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <TablePageSkeleton
      title="Feedback Mahasiswa"
      subtitle="Memuat feedback dari peserta bimbingan..."
      columnsCount={7}
      rowsCount={5}
    />
  );
}
