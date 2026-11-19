"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { parseJwtPayload } from "@/lib/authSession";

export default function AdminSuperadminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAccess = () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/auth/login");
        return;
      }

      try {
        const payload = parseJwtPayload(token);
        if (!payload) {
          router.push("/auth/login");
          return;
        }

        const roles = Array.isArray(payload.roles) ? payload.roles : [];
        const path = window.location.pathname;

        // Jika Superadmin membuka rute /dashboard/admin/*, arahkan ke /dashboard/superadmin/*
        // agar layout, sidebar, dan badge role tetap Superadmin.
        if (path === "/dashboard/admin" || path.startsWith("/dashboard/admin/")) {
          if (roles.includes("superadmin")) {
            const targetPath = path.replace(
              /^\/dashboard\/admin(?=\/|$)/,
              "/dashboard/superadmin",
            );
            router.replace(
              `${targetPath}${window.location.search}${window.location.hash}`,
            );
            return;
          }

          if (roles.includes("admin")) {
            setHasAccess(true);
            setLoading(false);
            return;
          }
        }

        if (
          path === "/dashboard/superadmin" ||
          path.startsWith("/dashboard/superadmin/")
        ) {
          if (roles.includes("superadmin")) {
            setHasAccess(true);
            setLoading(false);
            return;
          }
        }

        setHasAccess(false);
        setLoading(false);
        router.push("/403");
      } catch (error) {
        console.error("Guard error:", error);
        router.push("/auth/login");
      }
    };

    const raf = requestAnimationFrame(checkAccess);
    return () => cancelAnimationFrame(raf);
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Akses Ditolak</h1>
          <p className="text-gray-600">
            Anda tidak memiliki izin untuk mengakses halaman ini
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
