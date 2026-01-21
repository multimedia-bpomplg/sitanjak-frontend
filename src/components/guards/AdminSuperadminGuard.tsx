"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const ADMIN_ALLOWED = [
  "/dashboard/superadmin/ViewPendaftaran",
  "/dashboard/superadmin/ViewLogbook",
  "/dashboard/superadmin/ViewPeserta",
  "/dashboard/superadmin/ManajemenAkun/buatmentor",
  "/dashboard/superadmin/ManajemenAkun/buatpeserta",
];

export default function AdminSuperadminGuard({
  role,
  children,
}: {
  role: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (role === "admin") {
      const allowed = ADMIN_ALLOWED.some((r) => pathname.startsWith(r));
      if (!allowed) router.replace("/dashboard/admin");
    }
  }, [pathname, role]);

  return <>{children}</>;
}
