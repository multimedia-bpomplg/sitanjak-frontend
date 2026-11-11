"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer } from "react-toastify";
import { ConfirmProvider } from "@/components/ui/ConfirmProvider";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";
import { RoleType } from "./dashboardNavConfig";

interface LoggedUser {
  name: string;
  email: string;
  roles: string[];
  avatar?: string;
}

interface DashboardLayoutWrapperProps {
  role: RoleType;
  children: React.ReactNode;
  Guard?: React.ComponentType<{ children: React.ReactNode }>;
}

export default function DashboardLayoutWrapper({
  role,
  children,
  Guard,
}: DashboardLayoutWrapperProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<LoggedUser | null>(null);

  const router = useRouter();

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/auth/login");
  };

  useEffect(() => {
    setMounted(true);

    const token = localStorage.getItem("token");
    if (!token) {
      handleSignOut();
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser({
        name: payload.name || payload.nama || "Pengguna",
        email: payload.email || "-",
        roles: payload.roles || [role],
        avatar: payload.avatar,
      });
    } catch (err) {
      console.error("Token tidak valid:", err);
      handleSignOut();
    }
  }, []);

  if (!mounted) {
    return null; // Mencegah hydration mismatch pada client rendering
  }

  const content = (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs p-4 sm:p-6">
      {children}
    </div>
  );

  return (
    <ConfirmProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
        {/* ================= SIDEBAR ================= */}
        <DashboardSidebar
          role={role}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        {/* ================= MAIN CONTENT AREA ================= */}
        <div
          className={`
            flex flex-col min-h-screen min-w-0
            transition-all duration-300 ease-in-out
            ${collapsed ? "lg:pl-20" : "lg:pl-72"}
          `}
        >
          {/* Header / Topbar */}
          <DashboardHeader
            role={role}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
            onMobileOpen={() => setMobileOpen(true)}
            user={user}
            onSignOut={handleSignOut}
          />

          {/* Main Workspace */}
          <main className="flex-1 p-4 lg:p-6 min-w-0">
            {Guard ? <Guard>{content}</Guard> : content}
          </main>
        </div>

        {/* Global Toast Notifications */}
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
        />
      </div>
    </ConfirmProvider>
  );
}

