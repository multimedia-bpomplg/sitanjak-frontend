import { FormPageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <FormPageSkeleton
      title="Kelola Panduan Peserta & Mentor"
      subtitle="Memuat pengaturan dokumen panduan..."
      fieldsCount={4}
    />
  );
}
