import { FormPageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <FormPageSkeleton
      title="Kelola Gambar Hero Landing Page"
      subtitle="Memuat pengaturan gambar section hero..."
      fieldsCount={4}
    />
  );
}
