import {
  LayoutDashboard,
  ClipboardList,
  Users,
  BookOpenCheck,
  GraduationCap,
  MessageSquareHeart,
  UserCheck,
  UserPlus,
  ShieldCheck,
  Megaphone,
  Wrench,
  Sliders,
  MessageCircle,
  KeyRound,
  FileText,
  LucideIcon,
} from "lucide-react";

export type NavSubItem = {
  title: string;
  href: string;
  icon?: LucideIcon;
  external?: boolean;
};

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  external?: boolean;
  children?: NavSubItem[];
};

export type NavSection = {
  sectionTitle?: string;
  items: NavItem[];
};

export type RoleType = "admin" | "mentor" | "peserta" | "superadmin";

export interface RoleConfig {
  roleName: string;
  roleBadge: string;
  badgeClass: string;
  homeUrl: string;
  guideUrl: string;
  sections: NavSection[];
}

export const ROLE_NAVIGATION_CONFIG: Record<RoleType, RoleConfig> = {
  superadmin: {
    roleName: "Super Admin",
    roleBadge: "SUPERADMIN",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/80",
    homeUrl: "/dashboard/superadmin",
    guideUrl: "https://docs.google.com/document/d/1-VulRQpzbMAbXDg101vkVsDBp02WChH5TQN3DXmzkZ4/edit?usp=sharing",
    sections: [
      {
        sectionTitle: "MENU UTAMA",
        items: [
          {
            title: "Dashboard",
            href: "/dashboard/superadmin",
            icon: LayoutDashboard,
          },
        ],
      },
      {
        sectionTitle: "MANAJEMEN MAGANG",
        items: [
          {
            title: "Pendaftaran",
            href: "/dashboard/superadmin/ViewPendaftaran",
            icon: ClipboardList,
          },
          {
            title: "Data Peserta",
            href: "/dashboard/superadmin/ViewPeserta",
            icon: Users,
          },
          {
            title: "Logbook Harian",
            href: "/dashboard/superadmin/ViewLogbook",
            icon: BookOpenCheck,
          },
          {
            title: "Laporan Akhir",
            href: "/dashboard/superadmin/ViewLaporanAkhir",
            icon: GraduationCap,
          },
          {
            title: "Feedback & Ulasan",
            href: "/dashboard/superadmin/ViewFeedback",
            icon: MessageSquareHeart,
          },
        ],
      },
      {
        sectionTitle: "AKUN & OTORISASI",
        items: [
          {
            title: "Manajemen Akun",
            href: "/dashboard/superadmin/ManajemenAkun",
            icon: Users,
            children: [
              {
                title: "Akun Admin",
                href: "/dashboard/superadmin/ManajemenAkun/buatadmin",
                icon: ShieldCheck,
              },
              {
                title: "Akun Mentor",
                href: "/dashboard/superadmin/ManajemenAkun/buatmentor",
                icon: UserCheck,
              },
              {
                title: "Akun Peserta",
                href: "/dashboard/superadmin/ManajemenAkun/buatpeserta",
                icon: UserPlus,
              },
            ],
          },
        ],
      },
      {
        sectionTitle: "SISTEM & TAMPILAN",
        items: [
          {
            title: "Pengaturan Sistem",
            href: "/dashboard/superadmin/manajemenTampilan",
            icon: Sliders,
            children: [
              {
                title: "Mode Maintenance",
                href: "/dashboard/superadmin/manajemenTampilan/Maintenance",
                icon: Wrench,
              },
              {
                title: "Informasi Fungsi",
                href: "/dashboard/superadmin/manajemenTampilan/InformasiFungsi",
                icon: Sliders,
              },
              {
                title: "Gateway WhatsApp",
                href: "/dashboard/superadmin/manajemenTampilan/WhatappEdit",
                icon: MessageCircle,
              },
              {
                title: "Banner & Pengumuman",
                href: "/dashboard/superadmin/manajemenTampilan/BannerEdit",
                icon: Megaphone,
              },
            ],
          },
        ],
      },
      {
        sectionTitle: "LAINNYA",
        items: [
          {
            title: "Ganti Password",
            href: "/dashboard/superadmin/ganti-password",
            icon: KeyRound,
          },
          {
            title: "Panduan Website",
            href: "https://docs.google.com/document/d/1-VulRQpzbMAbXDg101vkVsDBp02WChH5TQN3DXmzkZ4/edit?usp=sharing",
            icon: FileText,
            external: true,
          },
        ],
      },
    ],
  },

  admin: {
    roleName: "Administrator",
    roleBadge: "ADMIN",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/80",
    homeUrl: "/dashboard/admin",
    guideUrl: "https://docs.google.com/document/d/1RpjFR-Z6PwJo5WClcVSiDCf37i4fD34LpnrlFZpmmwQ/edit?usp=sharing",
    sections: [
      {
        sectionTitle: "MENU UTAMA",
        items: [
          {
            title: "Dashboard",
            href: "/dashboard/admin",
            icon: LayoutDashboard,
          },
        ],
      },
      {
        sectionTitle: "MANAJEMEN MAGANG",
        items: [
          {
            title: "Pendaftaran",
            href: "/dashboard/admin/ViewPendaftaran",
            icon: ClipboardList,
          },
          {
            title: "Data Peserta",
            href: "/dashboard/admin/ViewPeserta",
            icon: Users,
          },
          {
            title: "Logbook Harian",
            href: "/dashboard/admin/ViewLogbook",
            icon: BookOpenCheck,
          },
          {
            title: "Laporan Akhir",
            href: "/dashboard/admin/ViewLaporanAkhir",
            icon: GraduationCap,
          },
          {
            title: "Feedback & Ulasan",
            href: "/dashboard/admin/ViewFeedback",
            icon: MessageSquareHeart,
          },
        ],
      },
      {
        sectionTitle: "MANAJEMEN AKUN",
        items: [
          {
            title: "Kelola Akun",
            href: "/dashboard/admin/ManajemenAkun",
            icon: Users,
            children: [
              {
                title: "Buat Akun Mentor",
                href: "/dashboard/admin/ManajemenAkun/buatmentor",
                icon: UserCheck,
              },
              {
                title: "Buat Akun Peserta",
                href: "/dashboard/admin/ManajemenAkun/buatpeserta",
                icon: UserPlus,
              },
            ],
          },
        ],
      },
      {
        sectionTitle: "TAMPILAN",
        items: [
          {
            title: "Banner & Pengumuman",
            href: "/dashboard/admin/manajemenTampilan/BannerEdit",
            icon: Megaphone,
          },
        ],
      },
      {
        sectionTitle: "PENGATURAN",
        items: [
          {
            title: "Ganti Password",
            href: "/dashboard/admin/ganti-password",
            icon: KeyRound,
          },
          {
            title: "Panduan Website",
            href: "https://docs.google.com/document/d/1RpjFR-Z6PwJo5WClcVSiDCf37i4fD34LpnrlFZpmmwQ/edit?usp=sharing",
            icon: FileText,
            external: true,
          },
        ],
      },
    ],
  },

  mentor: {
    roleName: "Mentor / Pembimbing",
    roleBadge: "MENTOR",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80",
    homeUrl: "/dashboard/mentor",
    guideUrl: "https://docs.google.com/document/d/16QXQuE7mnh3uEB_AlG_sCgA3f7QzlY8yRhjYz8kVqiA/edit?usp=sharing",
    sections: [
      {
        sectionTitle: "MENU UTAMA",
        items: [
          {
            title: "Dashboard",
            href: "/dashboard/mentor",
            icon: LayoutDashboard,
          },
        ],
      },
      {
        sectionTitle: "BIMBINGAN MAGANG",
        items: [
          {
            title: "Peserta Bimbingan",
            href: "/dashboard/mentor/peserta",
            icon: Users,
          },
          {
            title: "Verifikasi Logbook",
            href: "/dashboard/mentor/ViewLogbook",
            icon: BookOpenCheck,
          },
          {
            title: "Review Laporan Akhir",
            href: "/dashboard/mentor/ViewLaporanAkhir",
            icon: GraduationCap,
          },
          {
            title: "Feedback Mahasiswa",
            href: "/dashboard/mentor/ViewFeedback",
            icon: MessageSquareHeart,
          },
        ],
      },
      {
        sectionTitle: "PENGATURAN",
        items: [
          {
            title: "Ganti Password",
            href: "/dashboard/mentor/ganti-password",
            icon: KeyRound,
          },
          {
            title: "Panduan Mentor",
            href: "https://docs.google.com/document/d/16QXQuE7mnh3uEB_AlG_sCgA3f7QzlY8yRhjYz8kVqiA/edit?usp=sharing",
            icon: FileText,
            external: true,
          },
        ],
      },
    ],
  },

  peserta: {
    roleName: "Peserta Magang",
    roleBadge: "PESERTA",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/80",
    homeUrl: "/dashboard/peserta",
    guideUrl: "https://docs.google.com/document/d/1kBAVAJvKjtcx0jiZq1xnZ0nlhiGMcVJtobQeX6nQwWU/edit?usp=sharing",
    sections: [
      {
        sectionTitle: "MENU UTAMA",
        items: [
          {
            title: "Dashboard",
            href: "/dashboard/peserta",
            icon: LayoutDashboard,
          },
        ],
      },
      {
        sectionTitle: "KEGIATAN MAGANG",
        items: [
          {
            title: "Isi Logbook",
            href: "/dashboard/peserta/isi-logbook",
            icon: BookOpenCheck,
          },
          {
            title: "Laporan Akhir",
            href: "/dashboard/peserta/laporan-akhir",
            icon: GraduationCap,
          },
          {
            title: "Beri Ulasan & Feedback",
            href: "/dashboard/peserta/feedback",
            icon: MessageSquareHeart,
          },
        ],
      },
      {
        sectionTitle: "PENGATURAN",
        items: [
          {
            title: "Ganti Password",
            href: "/dashboard/peserta/ganti-password",
            icon: KeyRound,
          },
          {
            title: "Panduan Peserta",
            href: "https://docs.google.com/document/d/1kBAVAJvKjtcx0jiZq1xnZ0nlhiGMcVJtobQeX6nQwWU/edit?usp=sharing",
            icon: FileText,
            external: true,
          },
        ],
      },
    ],
  },
};

