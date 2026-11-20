"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ConfirmProvider } from "@/components/ui/ConfirmProvider";
import {
  clearAuthSession,
  hasBrowserCookie,
  isJwtExpired,
  parseJwtPayload,
  persistAuthCookies,
} from "@/lib/authSession";
import {
  Home,
  CalendarCheck2,
  ScanFace,
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
    if (!token || isJwtExpired(token)) {
      clearAuthSession();
      router.replace("/auth/login");
      return;
    }

    const payload = parseJwtPayload(token);
    if (!payload) {
      clearAuthSession();
      router.replace("/auth/login");
      return;
    }

    if (!hasBrowserCookie("token")) {
      const roles = Array.isArray(payload.roles) ? payload.roles : ["peserta"];
      persistAuthCookies(token, roles);
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
      label: "Absen",
      href: "/dashboard/peserta/absen",
      icon: ScanFace,
      isActive: pathname.startsWith("/dashboard/peserta/absen"),
      isCenter: true,
    },
    {
      label: "Perkembangan",
      href: "/dashboard/peserta/laporan-akhir",
      icon: ClipboardList,
      isActive:
        pathname.startsWith("/dashboard/peserta/laporan-akhir") ||
        pathname.startsWith("/dashboard/peserta/evaluasi") ||
        pathname.startsWith("/dashboard/peserta/feedback") ||
        pathname.startsWith("/dashboard/peserta/penilaian-akhir"),
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
      <div className="min-h-screen bg-[#E9EDF4] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex justify-center [font-family:var(--font-inter),system-ui,sans-serif]">
        {/* Centered App-Shell Container (Proportional on Web Desktop & Full on Mobile) */}
        <div className="w-full max-w-[780px] min-h-screen bg-[#F5F7FA] dark:bg-slate-900 flex flex-col relative shadow-[0_0_40px_rgba(15,23,42,0.07)] border-x border-slate-200/70 dark:border-slate-800">
          {/* Main Scrollable Content */}
          <main className="flex-1 px-4 sm:px-7 md:px-10 pt-6 sm:pt-8 pb-40">
            {children}
          </main>

          {/* Bottom Docked Area: Server Time Pill + Bottom Navigation */}
          <div className="print:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[780px] z-40 pointer-events-none">
            {/* Server Clock Pill */}
            <div className="flex justify-center pb-5 sm:pb-6 pt-2 bg-linear-to-t from-[#F5F7FA] via-[#F5F7FA]/95 to-transparent dark:from-slate-900 dark:via-slate-900/95">
              <div className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-2xs text-xs text-slate-600 dark:text-slate-300">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
                <span>Waktu Server</span>
                <span className="font-bold text-slate-800 dark:text-white tabular-nums">
                  {serverTime} WIB (GMT+7)
                </span>
              </div>
            </div>

            {/* 5-Tab Bottom Navigation Bar */}
            <nav
              aria-label="Navigasi Peserta"
              className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-6px_25px_-6px_rgba(15,23,42,0.08)] pb-[env(safe-area-inset-bottom)]"
            >
              <div className="grid grid-cols-5 items-center h-16 sm:h-[70px] px-1 sm:px-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                if (item.isCenter) {
                  return (
                    <div
                      key={item.label}
                      className="flex items-center justify-center"
                    >
                      <Link
                        href={item.href}
                        aria-label={item.label}
                        title="Absen Kehadiran"
                        className={`-mt-6 sm:-mt-7 w-14 h-14 sm:w-[60px] sm:h-[60px] rounded-full flex items-center justify-center bg-linear-to-b from-[#3B82F6] via-[#2563EB] to-[#1D64F2] border-[3px] border-white dark:border-slate-900 text-white transition-all duration-200 active:scale-95 ${
                          item.isActive
                            ? "shadow-[0_8px_26px_rgba(29,100,242,0.58)] ring-4 ring-blue-500/20 scale-[1.04]"
                            : "shadow-[0_6px_20px_rgba(29,100,242,0.4)] hover:scale-[1.04] hover:shadow-[0_8px_24px_rgba(29,100,242,0.5)]"
                        }`}
                      >
                        <Icon
                          className="w-6 h-6 sm:w-6.5 sm:h-6.5"
                          strokeWidth={2.2}
                        />
                      </Link>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex flex-col items-center justify-center gap-1 py-1.5 transition-colors ${
                      item.isActive
                        ? "text-[#1D64F2] dark:text-blue-400"
                        : "text-[#8B95A5] dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                  >
                    <Icon
                      className="w-5 h-5 sm:w-[22px] sm:h-[22px]"
                      strokeWidth={item.isActive ? 2.4 : 1.9}
                    />
                    <span
                      className={`text-[11.5px] sm:text-xs leading-none tracking-tight ${
                        item.isActive ? "font-bold" : "font-medium"
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
              </div>
            </nav>
          </div>
        </div>
      </div>
    </ConfirmProvider>
  );
}
