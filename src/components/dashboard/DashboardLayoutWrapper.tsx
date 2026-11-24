"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer } from "react-toastify";
import { ConfirmProvider } from "@/components/ui/ConfirmProvider";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";
import { RoleType } from "./dashboardNavConfig";
import {
  clearAuthSession,
  hasBrowserCookie,
  isJwtExpired,
  parseJwtPayload,
  persistAuthCookies,
} from "@/lib/authSession";

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
    clearAuthSession();
    router.replace("/auth/login");
  };

  useEffect(() => {
    setMounted(true);

    const applySessionFromStorage = () => {
      const token = localStorage.getItem("token");
      if (!token || isJwtExpired(token)) {
        handleSignOut();
        return null;
      }

      const payload = parseJwtPayload(token);
      if (!payload) {
        handleSignOut();
        return null;
      }

      const userRoles = Array.isArray(payload.roles) ? payload.roles : [role];
      localStorage.setItem("roles", JSON.stringify(userRoles));
      if (!hasBrowserCookie("token")) {
        persistAuthCookies(token, userRoles);
      }

      setUser({
        name: payload.name || payload.nama || "Pengguna",
        email: payload.email || "-",
        roles: userRoles,
        avatar: payload.avatar,
      });

      return { token, userRoles };
    };

    const currentSession = applySessionFromStorage();
    if (!currentSession) return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
    if (apiBase) {
      fetch(`${apiBase}/auth/session`, {
        headers: {
          Authorization: `Bearer ${currentSession.token}`,
        },
      })
        .then(async (res) => {
          if (!res.ok) return;
          const json = await res.json();
          if (json?.token && Array.isArray(json?.roles)) {
            localStorage.setItem("token", json.token);
            localStorage.setItem("roles", JSON.stringify(json.roles));
            persistAuthCookies(json.token, json.roles);
            setUser({
              name: json.user?.name || "Pengguna",
              email: json.user?.email || "-",
              roles: json.roles,
              avatar: undefined,
            });
          }
        })
        .catch(() => {
          // Diamkan agar tetap memakai sesi lokal bila offline
        });
    }

    const onSessionUpdated = () => {
      applySessionFromStorage();
    };
    window.addEventListener("auth-session-updated", onSessionUpdated);
    return () => {
      window.removeEventListener("auth-session-updated", onSessionUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

