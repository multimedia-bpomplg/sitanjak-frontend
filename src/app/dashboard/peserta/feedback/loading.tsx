import { FormPageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <FormPageSkeleton
      title="💬 Feedback & Evaluasi"
      subtitle="Memuat formulir evaluasi pengalaman magang..."
      fieldsCount={4}
    />
  );
}

