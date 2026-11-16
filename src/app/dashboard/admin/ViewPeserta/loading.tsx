import { TablePageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <TablePageSkeleton
      title="Data Peserta Magang"
      subtitle="Memuat daftar peserta magang yang telah disetujui..."
      columnsCount={6}
      rowsCount={8}
    />
  );
}
