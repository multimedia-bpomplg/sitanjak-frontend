"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Shield } from "lucide-react";

export default function ViewAdminRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/superadmin/ManajemenAkun/buatadmin");
  }, [router]);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400 flex items-center justify-center mx-auto">
        <Shield className="w-6 h-6" />
      </div>
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          Mengalihkan ke Manajemen Akun Admin...
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Daftar akun admin kini terintegrasi pada halaman Manajemen Akun Admin.
        </p>
      </div>
      <Link
        href="/dashboard/superadmin/ManajemenAkun/buatadmin"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0284c7] hover:bg-sky-700 transition"
      >
        <span>Buka Manajemen Akun Admin</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
