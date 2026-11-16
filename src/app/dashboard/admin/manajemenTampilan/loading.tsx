import { TablePageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <TablePageSkeleton
      title="Manajemen Tampilan & Pengumuman"
      subtitle="Memuat daftar banner dan pengumuman sistem..."
      columnsCount={5}
      rowsCount={6}
    />
  );
}
