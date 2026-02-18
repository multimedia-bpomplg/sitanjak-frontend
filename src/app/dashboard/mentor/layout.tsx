"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ChevronsLeft,
  ChevronsRight,
  Sun,
  Moon,
  LogOut,
  X,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
import { ConfirmProvider, useConfirm } from "@/components/ui/ConfirmProvider";

type LoggedUser = {
  name: string;
  email: string;
  roles: string[];
  avatar?: string;
};

export default function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<LoggedUser | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [dashboardOpen, setDashboardOpen] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingOpen, setSettingOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const confirm = useConfirm();

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
  };

  /* ===================== DARK MODE ===================== */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* ===================== AUTO OPEN ===================== */
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
        avatar: payload.avatar,
      });
    } catch (error) {
      console.error("Token tidak valid");
      handleSignOut();
    }
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0].toUpperCase())
      .join("")
      .slice(0, 3);
  };

  if (!mounted) {
    return null; // ⛔ cegah render sebelum client siap
  }

  return (
    <ConfirmProvider>
      <div
        className="
          min-h-screen
          flex
          bg-linear-to-br
          from-[#FBF7F2]   
          via-[#F9FAFB]    
          to-[#F3F4F6]     

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
            z-30
            h-screen
            bg-linear-to-b
            from-[#FFF7ED]   
            via-[#FEF3C7]   
            to-[#FDE68A]
            dark:from-[#020617]
            dark:via-[#1E1B4B]
            dark:to-[#3B0764]
            border-r border-[#F1C40F]/40 dark:border-indigo-900/40
            shadow-[4px_0_20px_-5px_rgba(0,0,0,0.15)]
            transition-all duration-300

            w-72
            ${collapsed ? "lg:w-20" : "lg:w-72"}

            fixed lg:sticky
            top-0 left-0

            transform
            ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0
          `}
        >
          {/* LOGO */}
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <img
                src="/images/icons/sitanjak.png"
                className={`
                  object-contain
                  ${collapsed ? "w-9 h-9" : "w-14 h-14"}
                `}
                alt="SiTanjak Logo"
              />
              {!collapsed && (
                <h1 className="text-lg font-semibold tracking-wide">Mentor</h1>
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
                border-[#FDE68A]
                text-[#7F1D1D]

                hover:bg-[#FEF3C7]
                hover:border-[#FACC15]

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
            {/* ===== DASHBOARD MENTOR ===== */}
            <button
              onClick={() => setDashboardOpen(!dashboardOpen)}
              className={`flex items-center gap-3 py-2 rounded-xl hover:bg-[#FACC15]/30 hover:text-[#7F1D1D] hover:shadow-sm dark:hover:bg-[#312E81]/40 dark:hover:text-white
                transition w-full
                ${
                  collapsed
                    ? "justify-center px-3"
                    : "pl-5 pr-3 justify-between"
                }
              `}
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
                dashboardOpen ? "max-h-40" : "max-h-0"
              }`}
            >
              <Link
                href="/dashboard/mentor"
                className={`
                  flex items-center gap-3
                  py-2.5 rounded-xl
                  text-sm
                  text-gray-700 dark:text-gray-300
                  hover:bg-[#FACC15]/30 hover:text-[#7F1D1D] hover:shadow-sm
                  dark:hover:bg-slate-800
                  transition
                  ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}
                  ${
                    pathname === "/dashboard/mentor"
                      ? `
                          bg-linear-to-r
                          from-[#FDE68A]/60
                          to-[#FACC15]/40
                          text-[#7F1D1D]
                          dark:from-indigo-500/30
                          dark:via-purple-500/25
                          dark:to-fuchsia-500/30
                          dark:text-indigo-200
                          shadow-inner
                        `
                      : ""
                  }
                `}
              >
                🖥 {!collapsed && "View Sistem"}
              </Link>

              <Link
                href="/dashboard/mentor/peserta"
                className={`
                  flex items-center gap-3
                  py-2.5 rounded-xl
                  text-sm
                  text-gray-700 dark:text-gray-300
                  hover:bg-[#FACC15]/30 hover:text-[#7F1D1D] hover:shadow-sm
                  dark:hover:bg-slate-800
                  transition
                  ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}

                  ${
                    pathname.includes("/mentor/peserta")
                      ? `
                          bg-linear-to-r
                          from-[#FDE68A]/60
                          to-[#FACC15]/40
                          text-[#7F1D1D]
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

            {/* ===== LAPORAN MAGANG ===== */}
            <button
              onClick={() => setReportOpen(!reportOpen)}
              className={`flex items-center gap-3 py-2 rounded-xl hover:bg-[#FACC15]/30 hover:text-[#7F1D1D] hover:shadow-sm dark:hover:bg-[#312E81]/40 dark:hover:text-white
                transition w-full
                ${
                  collapsed
                    ? "justify-center px-3"
                    : "pl-5 pr-3 justify-between"
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
                href="/dashboard/mentor/ViewLogbook"
                className={`
                  flex items-center gap-3
                  py-2.5 rounded-xl
                  text-sm
                  text-gray-700 dark:text-gray-300
                  hover:bg-[#FACC15]/30 hover:text-[#7F1D1D] hover:shadow-sm
                  dark:hover:bg-slate-800
                  transition
                  ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}

                  ${
                    pathname.includes("ViewLogbook")
                      ? `
                          bg-linear-to-r
                          from-[#FDE68A]/60
                          to-[#FACC15]/40
                          text-[#7F1D1D]
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
                href="/dashboard/mentor/ViewLaporanAkhir"
                className={`
                  flex items-center gap-3
                  py-2.5 rounded-xl
                  text-sm
                  text-gray-700 dark:text-gray-300
                  hover:bg-[#FACC15]/30 hover:text-[#7F1D1D] hover:shadow-sm
                  dark:hover:bg-slate-800
                  transition
                  ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}
                    
                  ${
                    pathname.includes("ViewLaporanAkhir")
                      ? `
                          bg-linear-to-r
                          from-[#FDE68A]/60
                          to-[#FACC15]/40
                          text-[#7F1D1D]
                          dark:from-indigo-500/30
                          dark:via-purple-500/25
                          dark:to-fuchsia-500/30
                          dark:text-indigo-200
                          shadow-inner
                        `
                      : ""
                  }`}
              >
                📂 {!collapsed && "Laporan Akhir"}
              </Link>

              <Link
                href="/dashboard/mentor/ViewFeedback"
                className={`
                  flex items-center gap-3
                  py-2.5 rounded-xl
                  text-sm
                  text-gray-700 dark:text-gray-300
                  hover:bg-[#FACC15]/30 hover:text-[#7F1D1D] hover:shadow-sm
                  dark:hover:bg-slate-800
                  transition
                  ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}
                    
                  ${
                    pathname.includes("ViewFeedback")
                      ? `
                          bg-linear-to-r
                          from-[#FDE68A]/60
                          to-[#FACC15]/40
                          text-[#7F1D1D]
                          dark:from-indigo-500/30
                          dark:via-purple-500/25
                          dark:to-fuchsia-500/30
                          dark:text-indigo-200
                          shadow-inner
                        `
                      : ""
                  }`}
              >
                📊 {!collapsed && "Feedback Dari Peserta"}
              </Link>
            </div>

            {/* ===== SETTING (ADMIN) ===== */}
            <button
              onClick={() => setSettingOpen(!settingOpen)}
              className={`flex items-center gap-3 py-2 rounded-xl
    hover:bg-[#FACC15]/30 hover:text-[#7F1D1D] hover:shadow-sm
    dark:hover:bg-[#312E81]/40 dark:hover:text-white
    transition w-full
    ${collapsed ? "justify-center px-3" : "pl-5 pr-3 justify-between"}
  `}
            >
              <div className="flex items-center gap-3">
                🛠️ {!collapsed && <span>Setting</span>}
              </div>

              {!collapsed && (
                <span
                  className={`transition-transform ${
                    settingOpen ? "rotate-90" : ""
                  }`}
                >
                  ▶
                </span>
              )}
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ${
                settingOpen ? "max-h-40" : "max-h-0"
              }`}
            >
              {/* Ganti Password */}
              <Link
                href="/dashboard/mentor/ganti-password"
                className={`
      flex items-center gap-3
      py-2.5 rounded-xl
      text-sm
      text-gray-700 dark:text-gray-300
      hover:bg-[#FACC15]/30 hover:text-[#7F1D1D] hover:shadow-sm
      dark:hover:bg-slate-800
      transition
      ${collapsed ? "justify-center px-3" : "pl-12 pr-3"}
      ${
        pathname === "/dashboard/mentor/ganti-password"
          ? `
              bg-linear-to-r
              from-[#FDE68A]/60
              to-[#FACC15]/40
              text-[#7F1D1D]
              dark:from-indigo-500/30
              dark:via-purple-500/25
              dark:to-fuchsia-500/30
              dark:text-indigo-200
              shadow-inner
            `
          : ""
      }
    `}
              >
                🔒 {!collapsed && "Ganti Password"}
              </Link>
            </div>

            {/* Panduan Website */}
            <a
              href="https://docs.google.com/document/d/16QXQuE7mnh3uEB_AlG_sCgA3f7QzlY8yRhjYz8kVqiA/edit?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className={`
                flex items-center gap-3
                py-2 rounded-xl
                hover:bg-[#FACC15]/30 hover:text-[#7F1D1D] hover:shadow-sm
                dark:hover:bg-[#312E81]/40 dark:hover:text-white
                transition w-full
                ${collapsed ? "justify-center px-3" : "pl-5 pr-3"}
                text-gray-700 dark:text-gray-300
              `}
            >
              📖 {!collapsed && "Panduan Website"}
            </a>
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
            flex flex-col min-w-0 flex-1
            transition-all duration-300
          `}
        >
          {/* ===================== TOPBAR ===================== */}
          <header
            className={`
              sticky top-0 z-20 h-16
              dark:bg-[#020617]/70
              backdrop-blur-xl
              border-b border-[#FDE68A]/60 bg-white/80 dark:border-slate-800
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

            <div className="ml-auto flex items-center gap-5">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-[#FACC15]/30 hover:text-[#7F1D1D] hover:shadow-sm dark:hover:bg-[#312E81]/40"
              >
                <Sun className="hidden dark:block text-yellow-400" />
                <Moon className="block dark:hidden text-[#7F1D1D]" />
              </button>

              <div className="relative">
                <div
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="
                    w-12 h-12
                    rounded-full
                    cursor-pointer
                    flex items-center justify-center
                    font-bold

                    bg-linear-to-br from-[#B91C1C] to-[#7F1D1D]
                    text-white
                    ring-2 ring-[#FDE68A]
                    shadow-md

                    dark:bg-linear-to-br dark:from-indigo-500 dark:via-purple-500 dark:to-fuchsia-500
                    dark:text-white
                    dark:ring-2 dark:ring-indigo-900/60
                    dark:shadow-lg

                    hover:scale-105
                    active:scale-95
                    transition-all duration-300
                  "
                >
                  {getInitials(user?.name)}
                </div>

                {profileOpen && (
                  <div
                    className="
                      absolute right-0 mt-4 w-72
                      rounded-3xl
                      bg-white/90 dark:bg-slate-900/90
                      backdrop-blur-xl
                      border border-[#FDE68A]/60 dark:border-slate-700
                      shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)]
                      p-6
                      z-50
                      animate-scaleIn
                    "
                  >
                    {/* ===== PROFILE INFO ===== */}
                    <div className="flex flex-col items-center text-center gap-2 mb-6">
                      {/* AVATAR */}
                      <div
                        className="
                          w-20 h-20
                          rounded-full
                          flex items-center justify-center
                            
                          bg-linear-to-br from-[#B91C1C] to-[#7F1D1D]
                          text-white
                          ring-4 ring-[#FDE68A]

                          dark:bg-linear-to-br dark:from-indigo-500 dark:via-purple-500 dark:to-fuchsia-500
                          dark:text-white
                          dark:ring-4 dark:ring-indigo-900/60

                          text-2xl font-bold
                          shadow-lg
                          transition-colors duration-300
                        "
                      >
                        {getInitials(user?.name)}
                      </div>

                      {/* NAMA */}
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                        {user?.name || "-"}
                      </h3>

                      {/* EMAIL */}
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user?.email || "-"}
                      </p>

                      {/* POSISI MAGANG */}
                      <span
                        className="
                          mt-1
                          inline-flex items-center
                          px-3 py-1
                          rounded-full
                          text-xs font-semibold

                          bg-[#FDE68A] text-[#7F1D1D]

                          dark:bg-purple-900/40
                          dark:text-purple-300
                          dark:ring-1 dark:ring-purple-800/60
                        "
                      >
                        Mentor
                      </span>
                    </div>

                    {/* ===== SIGN OUT BUTTON ===== */}
                    <button
                      onClick={() =>
                        confirm({
                          title: "Keluar dari akun?",
                          message:
                            "Anda akan keluar dari sistem dan perlu login kembali untuk mengakses dashboard.",
                          onConfirm: handleSignOut,
                        })
                      }
                      className="
                        w-full
                        flex items-center justify-center gap-2
                        py-3
                        rounded-xl
                        bg-linear-to-r from-rose-600 to-pink-600
                        text-white font-semibold
                        shadow-lg
                        hover:shadow-xl
                        hover:scale-[1.03]
                        active:scale-95
                        transition
                      "
                    >
                      <LogOut size={18} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* ===================== CONTENT ===================== */}
          <main className="flex-1 p-4 lg:p-6">
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
