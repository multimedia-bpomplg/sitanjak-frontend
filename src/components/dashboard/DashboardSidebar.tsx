"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  X,
  ExternalLink,
  ChevronsLeft,
  ChevronsRight,
  Shield,
} from "lucide-react";
import {
  RoleConfig,
  RoleType,
  ROLE_NAVIGATION_CONFIG,
} from "./dashboardNavConfig";

interface DashboardSidebarProps {
  role: RoleType;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function DashboardSidebar({
  role,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const config: RoleConfig = ROLE_NAVIGATION_CONFIG[role];

  // State untuk menyimpan dropdown submenu yang terbuka
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  // Buka submenu secara otomatis jika halaman aktif ada di dalamnya
  useEffect(() => {
    config.sections.forEach((sec) => {
      sec.items.forEach((item) => {
        if (item.children) {
          const isChildActive = item.children.some(
            (child) => pathname === child.href || pathname.startsWith(child.href + "/")
          );
          if (isChildActive) {
            setOpenSubmenus((prev) => ({ ...prev, [item.title]: true }));
          }
        }
      });
    });
  }, [pathname, config]);

  const toggleSubmenu = (title: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isItemActive = (href: string) => {
    if (href === config.homeUrl) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      {/* Sidebar Container (Biru Muda) */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen
          bg-[#0284c7] dark:bg-[#0369a1]
          border-r border-sky-600/30 dark:border-sky-800/60
          shadow-md
          flex flex-col
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-20" : "w-72"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* ===================== LOGO & BRAND ===================== */}
        <div className="h-18 flex items-center justify-between px-4 border-b border-white/15 dark:border-white/10">
          <Link
            href={config.homeUrl}
            className="flex items-center gap-3 overflow-hidden group py-1"
          >
            <div className="relative shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 dark:bg-white/15 border border-white/30 p-1 group-hover:scale-105 transition-transform duration-200 shadow-xs">
              <img
                src="/images/icons/sitanjak.png"
                alt="SI TANJAK Logo"
                className="w-full h-full object-contain"
              />
            </div>

            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-base tracking-tight text-white leading-tight">
                  SI TANJAK
                </span>
                <span className="text-[11px] font-medium text-sky-100/90 truncate">
                  BBPOM di Palembang
                </span>
              </div>
            )}
          </Link>

          {/* Close button for Mobile */}
          <button
            onClick={onMobileClose}
            aria-label="Tutup menu"
            className="lg:hidden p-1.5 rounded-lg text-white hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Role Pill Badge */}
        {!collapsed && (
          <div className="px-5 pt-3 pb-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white/20 text-white border border-white/30 backdrop-blur-xs">
              <Shield size={12} className="text-white" />
              <span>{config.roleBadge}</span>
            </div>
          </div>
        )}

        {/* ===================== NAVIGATION MENU ===================== */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-6 scrollbar-thin scrollbar-thumb-sky-700/50 scrollbar-track-transparent">
          {config.sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {/* Section Title */}
              {section.sectionTitle && !collapsed && (
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-sky-100/75">
                  {section.sectionTitle}
                </div>
              )}

              {/* Items */}
              {section.items.map((item, idx) => {
                const ItemIcon = item.icon;
                const hasChildren = item.children && item.children.length > 0;
                const isSubmenuOpen = openSubmenus[item.title];
                const active = hasChildren
                  ? item.children!.some((c) => isItemActive(c.href))
                  : isItemActive(item.href);

                // --- Case 1: Item with Submenu ---
                if (hasChildren) {
                  return (
                    <div key={idx} className="relative group">
                      <button
                        type="button"
                        onClick={() => toggleSubmenu(item.title)}
                        className={`
                          w-full flex items-center justify-between
                          px-3 py-2.5 rounded-xl text-sm font-medium
                          transition-all duration-150
                          ${
                            active
                              ? "bg-white/20 text-white font-semibold backdrop-blur-xs"
                              : "text-white hover:bg-white/20 hover:text-white"
                          }
                          ${collapsed ? "justify-center" : ""}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <ItemIcon
                            size={19}
                            className="shrink-0 text-white transition-colors"
                          />
                          {!collapsed && <span className="truncate text-white">{item.title}</span>}
                        </div>

                        {!collapsed && (
                          <ChevronDown
                            size={16}
                            className={`shrink-0 text-white/80 transition-transform duration-200 ${
                              isSubmenuOpen ? "rotate-180" : ""
                            }`}
                          />
                        )}
                      </button>

                      {/* Tooltip when collapsed */}
                      {collapsed && (
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 whitespace-nowrap">
                          {item.title}
                        </div>
                      )}

                      {/* Submenu Dropdown */}
                      {!collapsed && isSubmenuOpen && (
                        <div className="mt-1 ml-4 pl-3 border-l-2 border-white/25 space-y-1">
                          {item.children!.map((child, cIdx) => {
                            const ChildIcon = child.icon;
                            const childActive = isItemActive(child.href);
                            return (
                              <Link
                                key={cIdx}
                                href={child.href}
                                onClick={onMobileClose}
                                className={`
                                  flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium
                                  transition-all duration-150
                                  ${
                                    childActive
                                      ? "bg-white text-[#0284c7] font-bold shadow-xs"
                                      : "text-white/90 hover:bg-white/20 hover:text-white"
                                  }
                                `}
                              >
                                {ChildIcon && (
                                  <ChildIcon
                                    size={15}
                                    className={`shrink-0 ${
                                      childActive ? "text-[#0284c7]" : "text-white"
                                    }`}
                                  />
                                )}
                                <span className="truncate">{child.title}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                // --- Case 2: Regular Menu Item ---
                const isExternal = item.external;
                const linkProps = isExternal
                  ? {
                      href: item.href,
                      target: "_blank",
                      rel: "noopener noreferrer",
                    }
                  : {
                      href: item.href,
                      onClick: onMobileClose,
                    };

                return (
                  <div key={idx} className="relative group">
                    <Link
                      {...linkProps}
                      className={`
                        flex items-center gap-3
                        px-3 py-2.5 rounded-xl text-sm font-medium
                        transition-all duration-150
                        ${
                          active
                            ? "bg-white text-[#0284c7] font-bold shadow-sm"
                            : "text-white hover:bg-white/20 hover:text-white"
                        }
                        ${collapsed ? "justify-center" : "justify-between"}
                      `}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <ItemIcon
                          size={19}
                          className={`shrink-0 transition-colors ${
                            active ? "text-[#0284c7]" : "text-white"
                          }`}
                        />
                        {!collapsed && <span className="truncate">{item.title}</span>}
                      </div>

                      {!collapsed && isExternal && (
                        <ExternalLink
                          size={14}
                          className={`shrink-0 ${
                            active ? "text-[#0284c7]/80" : "text-white/80"
                          }`}
                        />
                      )}
                    </Link>

                    {/* Tooltip on Collapsed */}
                    {collapsed && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 whitespace-nowrap">
                        {item.title}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* ===================== FOOTER CARD ===================== */}
        <div className="p-3 border-t border-white/15 dark:border-white/10 bg-black/10 dark:bg-black/20">
          {!collapsed ? (
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-white">
                  SI TANJAK v2.0
                </span>
                <span className="text-[10px] text-sky-100/80">
                  BBPOM Palembang
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Kecilkan sidebar"
                className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-white hover:bg-white/20 transition-colors"
              >
                <ChevronsLeft size={18} />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Perlebar sidebar"
                className="hidden lg:flex items-center justify-center w-9 h-9 rounded-lg text-white hover:bg-white/20 transition-colors"
              >
                <ChevronsRight size={18} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
