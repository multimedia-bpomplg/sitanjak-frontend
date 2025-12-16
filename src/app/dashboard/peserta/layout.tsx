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

export default function PesertaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [dashboardOpen, setDashboardOpen] = useState(true);
  const [activityOpen, setActivityOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  /* ===================== DARK MODE ===================== */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  /* ===================== AUTO OPEN ===================== */
  useEffect(() => {
    if (pathname.startsWith("/dashboard/peserta")) {
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
          {!collapsed && (
            <h1 className="text-lg font-semibold">Peserta Magang</h1>
          )}
        </div>

        {/* MENU */}
        <nav className="flex flex-col mt-6 space-y-1 font-medium">
          {/* ===== DASHBOARD ===== */}
          <button
            onClick={() => setDashboardOpen(!dashboardOpen)}
            className={`flex items-center gap-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
              transition w-full
              ${
                collapsed ? "justify-center px-3" : "pl-5 pr-3 justify-between"
              }`}
          >
            <div className="flex items-center gap-3">
              🏠 {!collapsed && <span>Dashboard</span>}
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
              dashboardOpen ? "max-h-40" : "max-h-0"
            }`}
          >
            <Link
              href="/dashboard/peserta"
              className={`flex py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}
                ${
                  pathname === "/dashboard/peserta"
                    ? "bg-blue-100 dark:bg-blue-900/30"
                    : ""
                }`}
            >
              👋 {!collapsed && "Selamat Datang"}
            </Link>
          </div>

          {/* ===== AKTIVITAS MAGANG ===== */}
          <button
            onClick={() => setActivityOpen(!activityOpen)}
            className={`flex items-center gap-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
              transition w-full
              ${
                collapsed ? "justify-center px-3" : "pl-5 pr-3 justify-between"
              }`}
          >
            <div className="flex items-center gap-3">
              📘 {!collapsed && <span>Aktivitas Magang</span>}
            </div>
            {!collapsed && (
              <span
                className={`transition-transform ${
                  activityOpen ? "rotate-90" : ""
                }`}
              >
                ▶
              </span>
            )}
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              activityOpen ? "max-h-60" : "max-h-0"
            }`}
          >
            <Link
              href="/dashboard/peserta/logbook"
              className={`flex py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}`}
            >
              ✍️ {!collapsed && "Isi Logbook Harian"}
            </Link>

            <Link
              href="/dashboard/peserta/laporan/bulanan"
              className={`flex py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}`}
            >
              🗓 {!collapsed && "Laporan Bulanan"}
            </Link>

            <Link
              href="/dashboard/peserta/laporan/akhir"
              className={`flex py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}`}
            >
              📄 {!collapsed && "Laporan Akhir"}
            </Link>
          </div>

          {/* ===== RIWAYAT ===== */}
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className={`flex items-center gap-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
              transition w-full
              ${
                collapsed ? "justify-center px-3" : "pl-5 pr-3 justify-between"
              }`}
          >
            <div className="flex items-center gap-3">
              🕘 {!collapsed && <span>Riwayat</span>}
            </div>
            {!collapsed && (
              <span
                className={`transition-transform ${
                  historyOpen ? "rotate-90" : ""
                }`}
              >
                ▶
              </span>
            )}
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              historyOpen ? "max-h-40" : "max-h-0"
            }`}
          >
            <Link
              href="/dashboard/peserta/riwayat"
              className={`flex py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}`}
            >
              📜 {!collapsed && "Riwayat Pengajuan"}
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

        <div className="ml-auto flex items-center gap-5">
          <Bell />

          <button onClick={() => setDark(!dark)}>
            {dark ? <Sun /> : <Moon />}
          </button>

          <div className="relative">
            <img
              src="https://ui-avatars.com/api/?name=Peserta"
              className="w-11 h-11 rounded-full cursor-pointer border-2"
              onClick={() => setProfileOpen(!profileOpen)}
            />

            {profileOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-gray-800 shadow-xl rounded-xl p-4 z-50">
                <div className="flex flex-col items-center gap-2 mb-3">
                  <img
                    src="https://ui-avatars.com/api/?name=Peserta"
                    className="w-16 h-16 rounded-full"
                  />
                  <span className="font-semibold">Nama Peserta</span>
                  <span className="text-sm text-gray-500">
                    Posisi Magang - Lokasi
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
