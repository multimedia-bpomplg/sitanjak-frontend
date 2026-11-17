import { TablePageSkeleton } from "@/components/dashboard/skeletons";

export default function SuperadminViewAbsensiLoading() {
  return (
    <TablePageSkeleton
      title="Kelola Absensi Kehadiran"
      subtitle="Memuat data kehadiran dan skor disiplin peserta magang..."
      columnsCount={7}
    />
  );
}
