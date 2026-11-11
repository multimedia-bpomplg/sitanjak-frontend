import { TablePageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <TablePageSkeleton
      title="👥 Data Peserta Magang"
      subtitle="Memuat daftar peserta magang..."
      columnsCount={6}
      rowsCount={6}
    />
  );
}

