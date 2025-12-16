"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ChevronsLeft,
  ChevronsRight,
  Bell,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export default function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [dashboardOpen, setDashboardOpen] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  /* ===================== DARK MODE ===================== */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  /* ===================== AUTO OPEN DASHBOARD ===================== */
  useEffect(() => {
    if (pathname.startsWith("/dashboard/mentor")) {
      setDashboardOpen(true);
    }
  }, [pathname]);

  /* ===================== LOGOUT ===================== */
  const handleSignOut = () => {
    localStorage.clear();
    router.replace("/auth/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* ===================== SIDEBAR ===================== */}
      <aside
        className={`fixed top-0 left-0 z-30 h-full bg-white dark:bg-gray-800
        border-r border-black/10 transition-all duration-300
        ${collapsed ? "w-20" : "w-64"}`}
      >
        {/* LOGO */}
        <div className="flex items-center gap-3 p-5">
          <img
            src="/images/logo/logo-icon.svg"
            className={`${collapsed ? "w-8 h-8" : "w-12 h-12"}`}
          />
          {!collapsed && <h1 className="text-lg font-semibold">Mentor</h1>}
        </div>

        {/* MENU */}
        <nav className="flex flex-col mt-6 space-y-1 font-medium">
          {/* ===== DASHBOARD MENTOR ===== */}
          <button
            onClick={() => setDashboardOpen(!dashboardOpen)}
            className={`flex items-center gap-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
              transition w-full
              ${
                collapsed ? "justify-center px-3" : "pl-5 pr-3 justify-between"
              }`}
          >
            <div className="flex items-center gap-3">
              📊 {!collapsed && <span>Dashboard Mentor</span>}
            </div>
            {!collapsed && (
              <span
                className={`transition-transform ${
                  dashboardOpen ? "rotate-90" : ""
                }`}
              >
                ▶
              </span>
            )}
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              dashboardOpen ? "max-h-64" : "max-h-0"
            }`}
          >
            <Link
              href="/dashboard/mentor"
              className={`flex py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}
                ${
                  pathname === "/dashboard/mentor"
                    ? "bg-blue-100 dark:bg-blue-900/30"
                    : ""
                }`}
            >
              🖥 {!collapsed && "View Sistem"}
            </Link>

            <Link
              href="/dashboard/mentor/peserta"
              className={`flex py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}
                ${
                  pathname.includes("/peserta")
                    ? "bg-blue-100 dark:bg-blue-900/30"
                    : ""
                }`}
            >
              👥 {!collapsed && "View Peserta"}
            </Link>

            <Link
              href="/dashboard/mentor/logbook"
              className={`flex py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}
                ${
                  pathname.includes("/logbook")
                    ? "bg-blue-100 dark:bg-blue-900/30"
                    : ""
                }`}
            >
              📘 {!collapsed && "View Logbook"}
            </Link>
          </div>

          {/* ===== LAPORAN MAGANG ===== */}
          <button
            onClick={() => setReportOpen(!reportOpen)}
            className={`flex items-center gap-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
              transition w-full
              ${
                collapsed ? "justify-center px-3" : "pl-5 pr-3 justify-between"
              }`}
          >
            <div className="flex items-center gap-3">
              📑 {!collapsed && <span>Laporan Magang</span>}
            </div>
            {!collapsed && (
              <span
                className={`transition-transform ${
                  reportOpen ? "rotate-90" : ""
                }`}
              >
                ▶
              </span>
            )}
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              reportOpen ? "max-h-40" : "max-h-0"
            }`}
          >
            <Link
              href="/dashboard/mentor/laporan"
              className={`flex py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}`}
            >
              📊 {!collapsed && "Rekap Laporan"}
            </Link>

            <Link
              href="/dashboard/mentor/laporan/peserta"
              className={`flex py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}`}
            >
              📂 {!collapsed && "Laporan per Peserta"}
            </Link>
          </div>
        </nav>
      </aside>

      {/* ===================== TOPBAR ===================== */}
      <header
        className={`fixed top-0 right-0 z-20 h-16 bg-white dark:bg-gray-800 shadow
        flex items-center px-6 transition-all duration-300
        ${collapsed ? "left-20" : "left-64"}`}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mr-4 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 border"
        >
          {collapsed ? <ChevronsRight /> : <ChevronsLeft />}
        </button>

        <input
          placeholder="Search..."
          className="w-1/3 min-w-[200px] px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border outline-none"
        />

        <div className="ml-auto flex items-center gap-5">
          <Bell />

          <button onClick={() => setDark(!dark)}>
            {dark ? <Sun /> : <Moon />}
          </button>

          <div className="relative">
            <img
              src="https://ui-avatars.com/api/?name=Mentor"
              className="w-12 h-12 rounded-full cursor-pointer border-2"
              onClick={() => setProfileOpen(!profileOpen)}
            />

            {profileOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-gray-800 shadow-xl rounded-xl p-4 z-50">
                <div className="flex flex-col items-center gap-2 mb-3">
                  <img
                    src="https://ui-avatars.com/api/?name=Mentor"
                    className="w-16 h-16 rounded-full"
                  />
                  <span className="font-semibold">Mentor</span>
                  <span className="text-sm text-gray-500">
                    mentor@example.com
                  </span>
                </div>

                <button
                  onClick={() => {
                    if (confirm("Apakah Anda yakin ingin keluar?")) {
                      handleSignOut();
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-100 rounded-lg w-full"
                >
                  <LogOut size={18} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ===================== CONTENT ===================== */}
      <main
        className={`pt-20 p-6 transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
