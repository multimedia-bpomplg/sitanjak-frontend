import { TablePageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <TablePageSkeleton
      title="Laporan Akhir Peserta"
      subtitle="Memuat daftar laporan akhir dan penilaian mentor..."
      columnsCount={6}
      rowsCount={8}
    />
  );
}
