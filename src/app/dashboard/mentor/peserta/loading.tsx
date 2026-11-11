import { TablePageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <TablePageSkeleton
      title="👥 Peserta Bimbingan"
      subtitle="Memuat daftar peserta bimbingan Anda..."
      columnsCount={5}
      rowsCount={5}
    />
  );
}

