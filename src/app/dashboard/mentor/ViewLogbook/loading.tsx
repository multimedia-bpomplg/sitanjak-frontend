import { TablePageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <TablePageSkeleton
      title="Verifikasi Logbook"
      subtitle="Memuat daftar logbook peserta bimbingan Anda..."
      columnsCount={5}
      rowsCount={6}
    />
  );
}
