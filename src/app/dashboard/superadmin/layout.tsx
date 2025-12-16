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

export default function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(true);
  const [userOpen, setUserOpen] = useState(false);
  const [layoutOpen, setLayoutOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  /* ===================== DARK MODE ===================== */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  /* ===================== AUTO OPEN DASHBOARD ===================== */
  useEffect(() => {
    if (pathname.startsWith("/dashboard/superadmin")) {
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
          {!collapsed && <h1 className="text-lg font-semibold">Superadmin</h1>}
        </div>

        {/* MENU */}
        <nav className="flex flex-col mt-6 space-y-1 font-medium">
          {/* ===== DASHBOARD DROPDOWN ===== */}
          <button
            onClick={() => setDashboardOpen(!dashboardOpen)}
            className={`flex items-center gap-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
              transition w-full
              ${
                collapsed ? "justify-center px-3" : "pl-5 pr-3 justify-between"
              }`}
          >
            <div className="flex items-center gap-3">
              📊 {!collapsed && <span>Dashboard</span>}
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
              dashboardOpen ? "max-h-60" : "max-h-0"
            }`}
          >
            <Link
              href="/dashboard/superadmin"
              className={`flex py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}
                ${
                  pathname === "/dashboard/superadmin"
                    ? "bg-blue-100 dark:bg-blue-900/30"
                    : ""
                }`}
            >
              📈 {!collapsed && "Overview Sistem"}
            </Link>

            <Link
              href="/dashboard/superadmin/pendaftaran"
              className={`flex py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}
                ${
                  pathname.includes("/pendaftaran")
                    ? "bg-blue-100 dark:bg-blue-900/30"
                    : ""
                }`}
            >
              📝 {!collapsed && "View Pendaftaran"}
            </Link>

            <Link
              href="/dashboard/superadmin/logbook"
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

            <Link
              href="/dashboard/superadmin/peserta"
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
          </div>

          {/* ===== MANAJEMEN AKUN DROPDOWN ===== */}
          <button
            onClick={() => setUserOpen(!userOpen)}
            className={`flex items-center gap-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
              transition w-full
              ${
                collapsed ? "justify-center px-3" : "pl-5 pr-3 justify-between"
              }`}
          >
            <div className="flex items-center gap-3">
              👤 {!collapsed && <span>Manajemen Akun</span>}
            </div>
            {!collapsed && (
              <span
                className={`transition-transform ${
                  userOpen ? "rotate-90" : ""
                }`}
              >
                ▶
              </span>
            )}
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              userOpen ? "max-h-40" : "max-h-0"
            }`}
          >
            <Link
              href="/dashboard/superadmin/users/admin"
              className={`flex py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}
                ${
                  pathname.includes("/users/admin")
                    ? "bg-blue-100 dark:bg-blue-900/30"
                    : ""
                }`}
            >
              🛠 {!collapsed && "Buat Akun Admin"}
            </Link>

            <Link
              href="/dashboard/superadmin/users/mentor"
              className={`flex py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}
                ${
                  pathname.includes("/users/mentor")
                    ? "bg-blue-100 dark:bg-blue-900/30"
                    : ""
                }`}
            >
              🧑‍🏫 {!collapsed && "Buat Akun Mentor"}
            </Link>

            <Link
              href="/dashboard/superadmin/users/peserta"
              className={`flex py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}
                ${
                  pathname.includes("/users/peserta")
                    ? "bg-blue-100 dark:bg-blue-900/30"
                    : ""
                }`}
            >
              📋 {!collapsed && "Data Peserta"}
            </Link>
          </div>

          {/* ===== MANAJEMEN TAMPILAN DROPDOWN ===== */}
          <button
            onClick={() => setLayoutOpen(!layoutOpen)}
            className={`flex items-center gap-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
              transition w-full
              ${
                collapsed ? "justify-center px-3" : "pl-5 pr-3 justify-between"
              }`}
          >
            <div className="flex items-center gap-3">
              🧱 {!collapsed && <span>Manajemen Tampilan</span>}
            </div>
            {!collapsed && (
              <span
                className={`transition-transform ${
                  layoutOpen ? "rotate-90" : ""
                }`}
              >
                ▶
              </span>
            )}
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              layoutOpen ? "max-h-40" : "max-h-0"
            }`}
          >
            <Link
              href="/dashboard/superadmin/layout/utama"
              className={`flex py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}
                ${
                  pathname.includes("/layout/utama")
                    ? "bg-blue-100 dark:bg-blue-900/30"
                    : ""
                }`}
            >
              🏠 {!collapsed && "Layout Halaman Utama"}
            </Link>

            <Link
              href="/dashboard/superadmin/layout/konten"
              className={`flex py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}
                ${
                  pathname.includes("/layout/konten")
                    ? "bg-blue-100 dark:bg-blue-900/30"
                    : ""
                }`}
            >
              📰 {!collapsed && "Konten Informasi"}
            </Link>

            <Link
              href="/dashboard/superadmin/layout/banner"
              className={`flex py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}
                ${
                  pathname.includes("/layout/banner")
                    ? "bg-blue-100 dark:bg-blue-900/30"
                    : ""
                }`}
            >
              📢 {!collapsed && "Banner & Pengumuman"}
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
            {/* Foto profil lingkaran */}
            <img
              src="https://ui-avatars.com/api/?name=Admin" // ganti dengan foto sebenarnya jika ada
              className="w-12 h-12 rounded-full cursor-pointer border-2 border-gray-300 dark:border-gray-600"
              onClick={() => setProfileOpen(!profileOpen)}
            />

            {profileOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-gray-800 shadow-xl rounded-xl p-4 z-50">
                {/* Foto profil besar */}
                <div className="flex flex-col items-center gap-2 mb-3">
                  <img
                    src="https://ui-avatars.com/api/?name=Admin"
                    className="w-16 h-16 rounded-full border-2 border-gray-300 dark:border-gray-600"
                  />
                  <span className="font-semibold text-gray-800 dark:text-gray-100">
                    Admin Name
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-300">
                    Superadmin
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-300">
                    admin@example.com
                  </span>
                </div>

                {/* Tombol */}
                <div className="flex flex-col gap-2">
                  <Link
                    href="/dashboard/superadmin/profile/edit"
                    className="flex items-center gap-2 px-3 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    ✏️ Edit Profile
                  </Link>
                  <button
                    onClick={() => {
                      if (window.confirm("Apakah Anda yakin ingin keluar?")) {
                        handleSignOut();
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg"
                  >
                    <LogOut size={18} /> Sign Out
                  </button>
                </div>
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
