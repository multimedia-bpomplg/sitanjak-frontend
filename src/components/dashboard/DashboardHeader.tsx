"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Bell,
  Sun,
  Moon,
  KeyRound,
  FileText,
  LogOut,
  ChevronDown,
  ChevronRight,
  Shield,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { RoleType, ROLE_NAVIGATION_CONFIG } from "./dashboardNavConfig";

interface UserProfile {
  name: string;
  email: string;
  roles: string[];
  avatar?: string;
}

interface DashboardHeaderProps {
  role: RoleType;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onMobileOpen: () => void;
  user: UserProfile | null;
  onSignOut: () => void;
}

// Peta nama breadcrumb agar rapi dan mudah dibaca
const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  admin: "Admin",
  superadmin: "Super Admin",
  mentor: "Mentor",
  peserta: "Peserta",
  ViewPendaftaran: "Data Pendaftaran",
  ViewPeserta: "Data Peserta",
  ViewLogbook: "Logbook Harian",
  ViewLaporanAkhir: "Laporan Akhir",
  ViewFeedback: "Feedback & Ulasan",
  ManajemenAkun: "Manajemen Akun",
  buatadmin: "Tambah Akun Admin",
  buatmentor: "Tambah Akun Mentor",
  buatpeserta: "Tambah Akun Peserta",
  manajemenTampilan: "Tampilan & Sistem",
  BannerEdit: "Banner & Pengumuman",
  Maintenance: "Mode Maintenance",
  InformasiFungsi: "Informasi Fungsi",
  WhatappEdit: "Gateway WhatsApp",
  "ganti-password": "Ganti Password",
  "isi-logbook": "Isi Logbook",
  "laporan-akhir": "Laporan Akhir",
  feedback: "Feedback",
};

export default function DashboardHeader({
  role,
  collapsed,
  onToggleCollapse,
  onMobileOpen,
  user,
  onSignOut,
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const confirm = useConfirm();
  const config = ROLE_NAVIGATION_CONFIG[role];

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDark, setIsDark] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Sync tema dark mode
  useEffect(() => {
    const isDarkMode =
      document.documentElement.classList.contains("dark") ||
      localStorage.getItem("theme") === "dark";
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Close dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Generate breadcrumb items
  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbItems = pathSegments.map((segment, index) => {
    const url = "/" + pathSegments.slice(0, index + 1).join("/");
    const label = ROUTE_LABELS[segment] || segment;
    const isLast = index === pathSegments.length - 1;
    return { label, url, isLast };
  });

  // Initials dari nama user
  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0].toUpperCase())
      .slice(0, 2)
      .join("");
  };

  const handleLogoutClick = () => {
    setProfileDropdownOpen(false);
    confirm({
      title: "Keluar dari Akun?",
      message:
        "Anda akan keluar dari sistem SI TANJAK dan perlu memasukkan kredensial kembali untuk login.",
      onConfirm: onSignOut,
    });
  };

  return (
    <header className="sticky top-0 z-30 h-18 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
        {/* ================= SISI KIRI: TOGGLE & BREADCRUMBS ================= */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Tombol Toggle Sidebar Mobile */}
          <button
            type="button"
            onClick={onMobileOpen}
            aria-label="Buka menu"
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
          >
            <Menu size={20} />
          </button>

          {/* Tombol Toggle Collapse Desktop */}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Kecilkan / besarkan sidebar"
            className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
          >
            {collapsed ? <ChevronsRight size={19} /> : <ChevronsLeft size={19} />}
          </button>

          {/* Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate ml-2"
          >
            <Link
              href={config.homeUrl}
              className="font-medium hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              Portal
            </Link>
            {breadcrumbItems.map((b, i) => (
              <React.Fragment key={i}>
                <ChevronRight size={14} className="text-slate-400 shrink-0" />
                {b.isLast ? (
                  <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {b.label}
                  </span>
                ) : (
                  <Link
                    href={b.url}
                    className="hover:text-slate-900 dark:hover:text-slate-200 truncate transition-colors"
                  >
                    {b.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* ================= SISI TENGAH: SEARCH BAR ================= */}
        <div className="hidden xl:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Cari menu atau fitur... (Ctrl + K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full pl-9 pr-14 py-2
                bg-slate-100/70 dark:bg-slate-800/60
                border border-transparent focus:border-orange-500/50
                focus:bg-white dark:focus:bg-slate-900
                rounded-xl text-xs text-slate-800 dark:text-slate-200
                placeholder-slate-400
                outline-hidden focus:ring-3 focus:ring-orange-500/15
                transition-all duration-200
              "
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-1.5 py-0.5">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* ================= SISI KANAN: ACTIONS & PROFILE ================= */}
        <div className="flex items-center gap-2.5">
          {/* Notification Button */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotificationOpen(!notificationOpen)}
              title="Notifikasi"
              className="
                relative p-2.5 rounded-xl
                text-slate-600 dark:text-slate-400
                hover:bg-slate-100 dark:hover:bg-slate-800
                hover:text-slate-900 dark:hover:text-white
                transition-colors
              "
            >
              <Bell size={19} />
              {/* Badge dot */}
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-white dark:ring-slate-900" />
            </button>

            {/* Notification Popover */}
            {notificationOpen && (
              <>
                {/* Backdrop transparan untuk mobile */}
                <div
                  className="fixed inset-0 z-40 sm:hidden"
                  onClick={() => setNotificationOpen(false)}
                />

                <div
                  className="
                    fixed inset-x-4 top-[74px] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-3
                    w-auto sm:w-96
                    bg-white dark:bg-slate-900
                    border border-slate-200 dark:border-slate-800
                    rounded-2xl shadow-xl p-4 z-50
                    animate-scaleIn
                  "
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">
                        Pusat Informasi
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        Sistem Aktif
                      </span>
                    </div>
                  </div>

                  <div className="py-3 space-y-2.5 max-h-64 overflow-y-auto">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex gap-3">
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          Sistem SI TANJAK Berjala
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Layanan pendaftaran & monitoring magang BBPOM Palembang siap digunakan.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex gap-3">
                      <AlertCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          Panduan Penggunaan
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Pastikan Anda membaca panduan resmi pada menu dokumentasi samping.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
            className="
              p-2.5 rounded-xl
              text-slate-600 dark:text-slate-400
              hover:bg-slate-100 dark:hover:bg-slate-800
              hover:text-slate-900 dark:hover:text-white
              transition-colors
            "
          >
            {isDark ? (
              <Sun size={19} className="text-amber-400" />
            ) : (
              <Moon size={19} className="text-slate-600" />
            )}
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          {/* ================= USER PROFILE CAPSULE ================= */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="
                flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl
                hover:bg-slate-100/80 dark:hover:bg-slate-800/70
                border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60
                transition-all duration-150
              "
            >
              {/* Avatar Image or Initials */}
              <div
                className="
                  w-9 h-9 rounded-xl
                  flex items-center justify-center font-bold text-xs
                  bg-gradient-to-br from-orange-500 to-amber-600
                  text-white shadow-xs
                "
              >
                {getInitials(user?.name)}
              </div>

              {/* User text info */}
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[130px] truncate leading-tight">
                  {user?.name || "Pengguna"}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {config.roleName}
                </span>
              </div>

              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform duration-200 ${
                  profileDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <>
                {/* Backdrop transparan untuk mobile */}
                <div
                  className="fixed inset-0 z-40 sm:hidden"
                  onClick={() => setProfileDropdownOpen(false)}
                />

                <div
                  className="
                    absolute right-0 mt-3 w-72 max-w-[calc(100vw-2rem)]
                    bg-white dark:bg-slate-900
                    border border-slate-200 dark:border-slate-800
                    rounded-2xl shadow-xl p-2 z-50
                    animate-scaleIn
                  "
                >
                {/* Header Profile Card */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      {getInitials(user?.name)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {user?.name || "Nama Pengguna"}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {user?.email || "email@instansi.id"}
                      </span>
                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${config.badgeClass}`}
                        >
                          <Shield size={10} />
                          {config.roleBadge}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-1">
                  <Link
                    href={`/dashboard/${role}/ganti-password`}
                    onClick={() => setProfileDropdownOpen(false)}
                    className="
                      flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium
                      text-slate-700 dark:text-slate-300
                      hover:bg-slate-100 dark:hover:bg-slate-800
                      hover:text-slate-900 dark:hover:text-white
                      transition-colors
                    "
                  >
                    <KeyRound size={16} className="text-slate-400" />
                    <span>Ganti Kata Sandi</span>
                  </Link>

                  <a
                    href={config.guideUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="
                      flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium
                      text-slate-700 dark:text-slate-300
                      hover:bg-slate-100 dark:hover:bg-slate-800
                      hover:text-slate-900 dark:hover:text-white
                      transition-colors
                    "
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText size={16} className="text-slate-400" />
                      <span>Buku Panduan</span>
                    </div>
                    <ExternalLink size={13} className="text-slate-400" />
                  </a>
                </div>

                <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="
                    w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium
                    text-rose-600 dark:text-rose-400
                    hover:bg-rose-50 dark:hover:bg-rose-950/40
                    transition-colors
                  "
                >
                  <LogOut size={16} />
                  <span>Keluar dari Akun</span>
                </button>
              </div>
            </>
          )}
          </div>
        </div>
      </div>
    </header>
  );
}

