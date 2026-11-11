import { FormPageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <FormPageSkeleton
      title="🎨 Manajemen Tampilan"
      subtitle="Memuat pengaturan tampilan landing page..."
      fieldsCount={5}
    />
  );
}

