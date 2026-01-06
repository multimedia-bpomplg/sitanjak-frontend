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
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ConfirmProvider } from "@/components/ui/ConfirmProvider";

export default function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(true);
  const [userOpen, setUserOpen] = useState(false);
  const [layoutOpen, setLayoutOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
  };

  /* ===================== DARK MODE ===================== */
  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) {
    return null; // ⛔ cegah render sebelum client siap
  }

  return (
    <ConfirmProvider>
      <div className="
        min-h-screen
        bg-gradient-to-br
        from-emerald-50 via-white to-cyan-50

        dark:from-[#020617]
        dark:via-[#020617]
        dark:to-[#0F172A]

        text-gray-800 dark:text-gray-100
        transition-colors duration-300
      ">
        {/* ===================== SIDEBAR ===================== */}
        <aside className={`
          fixed top-0 left-0 z-30 h-full
          bg-gradient-to-b
          from-white via-emerald-50 to-emerald-100

          dark:from-[#020617]
          dark:via-[#1E1B4B]
          dark:to-[#3B0764]        

          border-r border-emerald-200 dark:border-indigo-900/40
          shadow-[4px_0_20px_-5px_rgba(0,0,0,0.15)]
          transition-all duration-300
          ${collapsed ? "w-20" : "w-72"}
        `}>
          {/* LOGO */}
          <div className="
            flex items-center gap-3 p-5
            border-b border-emerald-200 dark:border-slate-800
          ">
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
              className={`flex items-center gap-3 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30
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
                className={`
                  flex items-center gap-3
                  py-2.5 rounded-xl
                  text-sm
                  text-gray-700 dark:text-gray-300
                  hover:bg-emerald-100/70
                  dark:hover:bg-slate-800
                  transition
                  ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}
                  ${
                    pathname === "/dashboard/superadmin"
                      ? `
                          bg-gradient-to-r
                          from-emerald-500/20 to-cyan-500/20
                          text-emerald-700
                          dark:from-indigo-500/30
                          dark:via-purple-500/25
                          dark:to-fuchsia-500/30
                          dark:text-indigo-200
                          shadow-inner
                        `
                      : ""
                  }`}
              >
                📈 {!collapsed && "Overview Sistem"}
              </Link>

              <Link
                href="/dashboard/superadmin/ViewPendaftaran"
                className={`
                  flex items-center gap-3
                  py-2.5 rounded-xl
                  text-sm
                  text-gray-700 dark:text-gray-300
                  hover:bg-emerald-100/70
                  dark:hover:bg-slate-800
                  transition
                  ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}
                  ${
                    pathname.includes("/ViewPendaftaran")
                      ? `
                          bg-gradient-to-r
                          from-emerald-500/20 to-cyan-500/20
                          text-emerald-700
                          dark:from-indigo-500/30
                          dark:via-purple-500/25
                          dark:to-fuchsia-500/30
                          dark:text-indigo-200
                          shadow-inner
                        `
                      : ""
                  }`}
              >
                📝 {!collapsed && "View Pendaftaran"}
              </Link>

              <Link
                href="/dashboard/superadmin/ViewLogbook"
                className={`flex items-center gap-3
                  py-2.5 rounded-xl
                  text-sm
                  text-gray-700 dark:text-gray-300
                  hover:bg-emerald-100/70
                  dark:hover:bg-slate-800
                  transition
                  ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}
                  ${
                    pathname.includes("/ViewLogbook")
                      ? `
                          bg-gradient-to-r
                          from-emerald-500/20 to-cyan-500/20
                          text-emerald-700
                          dark:from-indigo-500/30
                          dark:via-purple-500/25
                          dark:to-fuchsia-500/30
                          dark:text-indigo-200
                          shadow-inner
                        `
                      : ""
                  }`}
              >
                📘 {!collapsed && "View Logbook"}
              </Link>

              <Link
                href="/dashboard/superadmin/ViewPeserta"
                className={`
                  flex items-center gap-3
                  py-2.5 rounded-xl
                  text-sm
                  text-gray-700 dark:text-gray-300
                  hover:bg-emerald-100/70
                  dark:hover:bg-slate-800
                  transition
                  ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}
                  ${
                    pathname.includes("/ViewPeserta")
                      ? `
                          bg-gradient-to-r
                          from-emerald-500/20 to-cyan-500/20
                          text-emerald-700
                          dark:from-indigo-500/30
                          dark:via-purple-500/25
                          dark:to-fuchsia-500/30
                          dark:text-indigo-200
                          shadow-inner
                        `
                      : ""
                  }`}
              >
                👥 {!collapsed && "View Peserta"}
              </Link>
            </div>

            {/* ===== MANAJEMEN AKUN DROPDOWN ===== */}
            <button
              onClick={() => setUserOpen(!userOpen)}
              className={`flex items-center gap-3 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30
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
                href="/dashboard/superadmin/ManajemenAkun/buatadmin"
                className={`
                  flex items-center gap-3
                  py-2.5 rounded-xl
                  text-sm
                  text-gray-700 dark:text-gray-300
                  hover:bg-emerald-100/70
                  dark:hover:bg-slate-800
                  transition
                  ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}
                  ${
                    pathname.includes("/ManajemenAkun/buatadmin")
                      ? `
                          bg-gradient-to-r
                          from-emerald-500/20 to-cyan-500/20
                          text-emerald-700
                          dark:from-indigo-500/30
                          dark:via-purple-500/25
                          dark:to-fuchsia-500/30
                          dark:text-indigo-200
                          shadow-inner
                        `
                      : ""
                  }`}
              >
                🛠 {!collapsed && "Buat Akun Admin"}
              </Link>

              <Link
                href="/dashboard/superadmin/ManajemenAkun/buatmentor"
                className={`
                  flex items-center gap-3
                  py-2.5 rounded-xl
                  text-sm
                  text-gray-700 dark:text-gray-300
                  hover:bg-emerald-100/70
                  dark:hover:bg-slate-800
                  transition
                  ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}
                  ${
                    pathname.includes("/ManajemenAkun/buatmentor")
                      ? `
                          bg-gradient-to-r
                          from-emerald-500/20 to-cyan-500/20
                          text-emerald-700
                          dark:from-indigo-500/30
                          dark:via-purple-500/25
                          dark:to-fuchsia-500/30
                          dark:text-indigo-200
                          shadow-inner
                        `
                      : ""
                  }`}
              >
                🧑‍🏫 {!collapsed && "Buat Akun Mentor"}
              </Link>

              <Link
                href="/dashboard/superadmin/ManajemenAkun/buatpeserta"
                className={`
                  flex items-center gap-3
                  py-2.5 rounded-xl
                  text-sm
                  text-gray-700 dark:text-gray-300
                  hover:bg-emerald-100/70
                  dark:hover:bg-slate-800
                  transition
                  ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}
                  ${
                    pathname.includes("/ManajemenAkun/buatpeserta")
                      ? `
                          bg-gradient-to-r
                          from-emerald-500/20 to-cyan-500/20
                          text-emerald-700
                          dark:from-indigo-500/30
                          dark:via-purple-500/25
                          dark:to-fuchsia-500/30
                          dark:text-indigo-200
                          shadow-inner
                        `
                      : ""
                  }`}
              >
                📋 {!collapsed && "Buat Akun Peserta"}
              </Link>
            </div>

            {/* ===== MANAJEMEN TAMPILAN DROPDOWN ===== */}
            <button
              onClick={() => setLayoutOpen(!layoutOpen)}
              className={`flex items-center gap-3 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30
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
                className={`
                  flex items-center gap-3
                  py-2.5 rounded-xl
                  text-sm
                  text-gray-700 dark:text-gray-300
                  hover:bg-emerald-100/70
                  dark:hover:bg-slate-800
                  transition
                  ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}
                  ${
                    pathname.includes("/layout/utama")
                      ? `
                          bg-gradient-to-r
                          from-emerald-500/20 to-cyan-500/20
                          text-emerald-700
                          dark:from-indigo-500/30
                          dark:via-purple-500/25
                          dark:to-fuchsia-500/30
                          dark:text-indigo-200
                          shadow-inner
                        `
                      : ""
                  }`}
              >
                🏠 {!collapsed && "Layout Halaman Utama"}
              </Link>

              <Link
                href="/dashboard/superadmin/layout/konten"
                className={`
                  flex items-center gap-3
                  py-2.5 rounded-xl
                  text-sm
                  text-gray-700 dark:text-gray-300
                  hover:bg-emerald-100/70
                  dark:hover:bg-slate-800
                  transition
                  ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}
                  ${
                    pathname.includes("/layout/konten")
                      ? `
                          bg-gradient-to-r
                          from-emerald-500/20 to-cyan-500/20
                          text-emerald-700
                          dark:from-indigo-500/30
                          dark:via-purple-500/25
                          dark:to-fuchsia-500/30
                          dark:text-indigo-200
                          shadow-inner
                        `
                      : ""
                  }`}
              >
                📰 {!collapsed && "Konten Informasi"}
              </Link>

              <Link
                href="/dashboard/superadmin/layout/banner"
                className={`
                  flex items-center gap-3
                  py-2.5 rounded-xl
                  text-sm
                  text-gray-700 dark:text-gray-300
                  hover:bg-emerald-100/70
                  dark:hover:bg-slate-800
                  transition
                  ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}
                  ${
                    pathname.includes("/layout/banner")
                      ? `
                          bg-gradient-to-r
                          from-emerald-500/20 to-cyan-500/20
                          text-emerald-700
                          dark:from-indigo-500/30
                          dark:via-purple-500/25
                          dark:to-fuchsia-500/30
                          dark:text-indigo-200
                          shadow-inner
                        `
                      : ""
                  }`}
              >
                📢 {!collapsed && "Banner & Pengumuman"}
              </Link>
            </div>
          </nav>
        </aside>

        {/* ===================== TOPBAR ===================== */}
        <header className={`
          fixed top-0 right-0 z-20 h-16
          bg-white/70
          dark:bg-[#020617]/70
          backdrop-blur-xl
          border-b border-emerald-200 dark:border-slate-800
          shadow-sm
          flex items-center px-6
          transition-all duration-300
          ${collapsed ? "left-20" : "left-72"}
        `}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="mr-4 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 border"
          >
            {collapsed ? <ChevronsRight /> : <ChevronsLeft />}
          </button>

          <input
            placeholder="search...."
            className="
            w-1/3 min-w-[220px]
            px-4 py-2 rounded-xl
            bg-white/80 dark:bg-slate-800
            border border-emerald-200 dark:border-slate-700
            focus:ring-2 focus:ring-emerald-400
            outline-none
            transition
            "
          />

          <div className="ml-auto flex items-center gap-5">
            <Bell />

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
            >
              <Sun className="hidden dark:block text-yellow-400" />
              <Moon className="block dark:hidden text-emerald-600" />
            </button>

            <div className="relative">
              {/* Foto profil lingkaran */}
              <img
                src="https://ui-avatars.com/api/?name=Admin" // ganti dengan foto sebenarnya jika ada
                className="w-12 h-12 rounded-full cursor-pointer border-2 border-gray-300 dark:border-gray-600"
                onClick={() => setProfileOpen(!profileOpen)}
              />

              {profileOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl shadow-2xl rounded-2xl p-4 border border-emerald-100 dark:border-slate-700 z-50">
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
                      className="flex items-center gap-2 px-3 py-2 text-gray-800 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg"
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
          className={`
            pt-20 p-6
            transition-all duration-300
            ${collapsed ? "ml-20" : "ml-72"}
          `}
        >
          <div className="
            rounded-2xl
            bg-white/80 dark:bg-slate-900/80
            backdrop-blur-xl
            shadow-lg
            p-6
          ">
            {children}
          </div>
        </main>

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
