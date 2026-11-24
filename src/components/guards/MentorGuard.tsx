"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { parseJwtPayload } from "@/lib/authSession";

export default function MentorGuard({
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
        if (roles.includes("mentor")) {
          setHasAccess(true);
          setLoading(false);
          return;
        }

        setHasAccess(false);
        setLoading(false);
        router.push("/403");
      } catch (error) {
        console.error("Mentor guard error:", error);
        router.push("/auth/login");
      }
    };

    const raf = requestAnimationFrame(checkAccess);
    return () => cancelAnimationFrame(raf);
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Akses Ditolak</h1>
          <p className="text-gray-600">
            Anda tidak memiliki peran mentor untuk mengakses halaman ini
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
