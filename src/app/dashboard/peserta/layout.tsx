"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ToastContainer } from "react-toastify";
import { ConfirmProvider } from "@/components/ui/ConfirmProvider";
import {
  Home,
  CalendarCheck2,
  ClipboardList,
  User,
  Clock,
} from "lucide-react";

export default function PesertaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [serverTime, setServerTime] = useState<string>("--.--.--");

  useEffect(() => {
    setMounted(true);

    const token = localStorage.getItem("token");
    if (!token) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.replace("/auth/login");
      return;
    }

    try {
      JSON.parse(atob(token.split(".")[1]));
    } catch (err) {
      console.error("Token tidak valid:", err);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.replace("/auth/login");
    }
  }, [router]);

  // Live WIB (GMT+7) server clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const formatted = now
        .toLocaleTimeString("id-ID", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
        .replace(/:/g, ".");
      setServerTime(formatted);
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return null;
  }

  const navItems = [
    {
      label: "Beranda",
      href: "/dashboard/peserta",
      icon: Home,
      isActive: pathname === "/dashboard/peserta",
    },
    {
      label: "Riwayat",
      href: "/dashboard/peserta/isi-logbook",
      icon: CalendarCheck2,
      isActive: pathname.startsWith("/dashboard/peserta/isi-logbook"),
    },
    {
      label: "Perkembangan",
      href: "/dashboard/peserta/laporan-akhir",
      icon: ClipboardList,
      isActive:
        pathname.startsWith("/dashboard/peserta/laporan-akhir") ||
        pathname.startsWith("/dashboard/peserta/feedback"),
    },
    {
      label: "Akun",
      href: "/dashboard/peserta/ganti-password",
      icon: User,
      isActive: pathname.startsWith("/dashboard/peserta/ganti-password"),
    },
  ];

  return (
    <ConfirmProvider>
      <div className="min-h-screen bg-[#E9EDF4] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex justify-center">
        {/* Centered App-Shell Container (Proportional on Web Desktop & Full on Mobile) */}
        <div className="w-full max-w-[780px] min-h-screen bg-[#F5F7FA] dark:bg-slate-900 flex flex-col relative shadow-[0_0_40px_rgba(15,23,42,0.07)] border-x border-slate-200/70 dark:border-slate-800">
          {/* Main Scrollable Content */}
          <main className="flex-1 px-4 sm:px-7 md:px-10 pt-6 sm:pt-8 pb-36">{children}</main>

          {/* Bottom Docked Area: Server Time Pill + Bottom Navigation */}
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[780px] z-40 pointer-events-none">
            {/* Server Clock Pill */}
            <div className="flex justify-center pb-2.5 pt-1 bg-gradient-to-t from-[#F5F7FA] via-[#F5F7FA]/95 to-transparent dark:from-slate-900 dark:via-slate-900/95">
              <div className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-2xs text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
                <span>Waktu Server</span>
                <span className="font-bold text-slate-800 dark:text-white tabular-nums">
                  {serverTime} WIB (GMT+7)
                </span>
              </div>
            </div>

            {/* 4-Tab Bottom Navigation Bar */}
            <nav
              aria-label="Navigasi Peserta"
              className="pointer-events-auto bg-white dark:bg-slate-900 border-t border-slate-200/90 dark:border-slate-800 grid grid-cols-4 h-15 sm:h-17 px-1"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                      item.isActive
                        ? "text-[#1D64F2] dark:text-blue-400 font-bold"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                    }`}
                  >
                    <Icon
                      className="w-5 h-5 sm:w-5.5 sm:h-5.5"
                      strokeWidth={item.isActive ? 2.4 : 1.8}
                    />
                    <span className="text-[11px] sm:text-xs leading-none">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Global Toast Notifications */}
        <ToastContainer
          position="top-center"
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
