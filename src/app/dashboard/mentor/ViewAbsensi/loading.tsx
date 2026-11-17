import { TablePageSkeleton } from "@/components/dashboard/skeletons";

export default function MentorViewAbsensiLoading() {
  return (
    <TablePageSkeleton
      title="Absensi Peserta Bimbingan"
      subtitle="Memuat data kehadiran peserta bimbingan Anda..."
      columnsCount={6}
    />
  );
}
