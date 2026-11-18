import { TablePageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <TablePageSkeleton
      title="Penilaian Akhir Magang"
      subtitle="Memuat daftar peserta bimbingan..."
      columnsCount={6}
      rowsCount={6}
    />
  );
}
