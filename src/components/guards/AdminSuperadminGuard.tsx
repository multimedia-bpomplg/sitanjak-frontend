"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminSuperadminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/auth/login");
      return;
    }

    try {
      // ✅ DECODE TOKEN UNTUK DAPATKAN DATA
      const payload = JSON.parse(atob(token.split(".")[1]));
      const roles = payload.roles || [];
      const isSuperAccess = payload.isSuperAccess || false;

      console.log("🔐 Guard Check:", {
        roles,
        isSuperAccess,
        path: window.location.pathname,
      });

      // LOGIC AKSES
      const path = window.location.pathname;

      // ✅ ADMIN ROUTES
      if (path.includes("/dashboard/admin")) {
        // Admin biasa boleh akses semua halaman admin
        if (roles.includes("admin")) {
          setHasAccess(true);
          setLoading(false);
          return;
        }

        // Superadmin juga boleh akses admin routes
        if (roles.includes("superadmin")) {
          setHasAccess(true);
          setLoading(false);
          return;
        }
      }

      // ✅ SUPERADMIN ROUTES
      if (path.includes("/dashboard/superadmin")) {
        if (roles.includes("superadmin")) {
          setHasAccess(true);
          setLoading(false);
          return;
        }
      }

      // Jika tidak ada akses
      setHasAccess(false);
      setLoading(false);
      router.push("/403");
    } catch (error) {
      console.error("Guard error:", error);
      router.push("/auth/login");
    }
  };

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
