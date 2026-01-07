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
  X,
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  type LoggedUser = {
    name: string;
    email: string;
    roles: string[];
  };

  const [user, setUser] = useState<LoggedUser | null>(null);

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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      handleSignOut();
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      setUser({
        name: payload.name,
        email: payload.email,
        roles: payload.roles || [],
      });
    } catch (error) {
      console.error("Token tidak valid");
      handleSignOut();
    }
  }, []);

  if (!mounted) {
    return null; // ⛔ cegah render sebelum client siap
  }

  return (
    <ConfirmProvider>
      <div
        className="
        min-h-screen
        lg:grid lg:grid-cols-[18rem_1fr]
        bg-gradient-to-br
        from-emerald-50 via-white to-cyan-50

        dark:from-[#020617]
        dark:via-[#020617]
        dark:to-[#0F172A]

        text-gray-800 dark:text-gray-100
        transition-colors duration-300
      "
      >
        {/* ===================== SIDEBAR ===================== */}
        <aside
          className={`
            z-30 h-full
            bg-gradient-to-b
            from-white via-emerald-50 to-emerald-100
            dark:from-[#020617]
            dark:via-[#1E1B4B]
            dark:to-[#3B0764]
            border-r border-emerald-200 dark:border-indigo-900/40
            shadow-[4px_0_20px_-5px_rgba(0,0,0,0.15)]
            transition-all duration-300

            w-72
            ${collapsed ? "lg:w-20" : "lg:w-72"}

            fixed lg:static
            top-0 left-0

            transform
            ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0
          `}
        >
          {/* LOGO + CLOSE BUTTON */}
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <img
                src="/images/icons/Logo-Simaggo.png"
                className={`
                  object-contain
                  ${collapsed ? "w-9 h-9" : "w-14 h-14"}
                `}
                alt="SIMAGGO Logo"
              />
              {!collapsed && (
                <h1 className="text-lg font-semibold tracking-wide">
                  Superadmin
                </h1>
              )}
            </div>

            {/* CLOSE BUTTON (MOBILE ONLY) */}
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close sidebar"
              className="
                lg:hidden
                flex items-center justify-center
                w-9 h-9
                rounded-full
                border

                bg-white/80
                border-emerald-200
                text-emerald-700

                hover:bg-emerald-100
                hover:border-emerald-300

                dark:bg-slate-800/80
                dark:border-slate-600
                dark:text-slate-200
                dark:hover:bg-slate-700
                dark:hover:border-slate-500

                transition-all duration-200
              "
            >
              <X size={18} />
            </button>
          </div>

          {/* MENU */}
          <nav className="flex flex-col mt-6 space-y-1 font-medium">
            {/* ===== DASHBOARD DROPDOWN ===== */}
            <button
              onClick={() => setDashboardOpen(!dashboardOpen)}
              className={`flex items-center gap-3 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30
                transition w-full
                ${
                  collapsed
                    ? "justify-center px-3"
                    : "pl-5 pr-3 justify-between"
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
                  collapsed
                    ? "justify-center px-3"
                    : "pl-5 pr-3 justify-between"
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
                  collapsed
                    ? "justify-center px-3"
                    : "pl-5 pr-3 justify-between"
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

        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          />
        )}

        {/* RIGHT AREA */}
        <div
          className={`
            flex flex-col min-w-0
          `}
        >
          {/* ===================== TOPBAR ===================== */}
          <header
            className={`
              sticky top-0 z-20 h-16
              bg-white/70 dark:bg-[#020617]/70
              backdrop-blur-xl
              border-b border-emerald-200 dark:border-slate-800
              shadow-sm
              flex items-center px-4 lg:px-6
            `}
          >
            <button
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setMobileOpen(true);
                } else {
                  setCollapsed(!collapsed);
                }
              }}
              className="mr-4 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 border"
            >
              <ChevronsRight className="lg:hidden" />
              <span className="hidden lg:block">
                {collapsed ? <ChevronsRight /> : <ChevronsLeft />}
              </span>
            </button>

            <input
              placeholder="search...."
              className="
                hidden md:block
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
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.name || "User"
                  )}`}
                  // ganti dengan foto sebenarnya jika ada
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
                        {user?.name || "-"}
                      </span>

                      <span className="text-sm text-gray-500 dark:text-gray-300">
                        {user?.roles?.[0] || "-"}
                      </span>

                      <span className="text-sm text-gray-500 dark:text-gray-300">
                        {user?.email || "-"}
                      </span>
                    </div>

                    {/* Tombol */}
                    <div className="flex flex-col gap-2">
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
            className="flex-1 p-4 lg:p-6">
            <div
              className="
              rounded-2xl
              bg-white/80 dark:bg-slate-900/80
              p-6
            "
            >
              {children}
            </div>
          </main>
        </div>

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
