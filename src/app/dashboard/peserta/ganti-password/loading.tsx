import { FormPageSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <FormPageSkeleton
      title="🔒 Ganti Password"
      subtitle="Memuat formulir pembaruan kata sandi..."
      fieldsCount={3}
    />
  );
}

