import { FormPageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <FormPageSkeleton
      title="📑 Laporan Akhir Magang"
      subtitle="Memuat formulir pengunggahan laporan akhir..."
      fieldsCount={4}
    />
  );
}

