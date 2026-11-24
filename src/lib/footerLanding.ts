export type FooterSocialPlatform =
  | "globe"
  | "facebook"
  | "instagram"
  | "youtube"
  | "whatsapp"
  | "tiktok"
  | "linkedin";

export interface FooterSocialLinkItem {
  platform: FooterSocialPlatform | string;
  label: string;
  href: string;
}

export interface FooterLandingContent {
  isCustom?: boolean;
  institutionName: string;
  address: string;
  phone: string;
  email: string;
  socialLinks: FooterSocialLinkItem[];
  updatedBy?: { name?: string; email?: string } | null;
  updatedAt?: string | null;
}

export const FOOTER_SOCIAL_PLATFORMS: Array<{
  key: FooterSocialPlatform;
  label: string;
}> = [
  { key: "globe", label: "Website Resmi" },
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "youtube", label: "YouTube" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "tiktok", label: "TikTok" },
  { key: "linkedin", label: "LinkedIn" },
];

export const DEFAULT_FOOTER_LANDING: FooterLandingContent = {
  isCustom: false,
  institutionName: "Balai Besar POM di Palembang",
  address: "Jl. Pangeran Ratu, 5 Ulu, Kota Palembang 30254",
  phone: "(0711) 510195",
  email: "bpom_palembang@pom.go.id",
  socialLinks: [
    {
      platform: "globe",
      label: "Website Resmi BPOM Palembang",
      href: "https://palembang.pom.go.id/",
    },
    {
      platform: "facebook",
      label: "Facebook BBPOM Palembang",
      href: "https://www.facebook.com/bpom.plg/",
    },
    {
      platform: "instagram",
      label: "Instagram @bpom.palembang",
      href: "https://www.instagram.com/bpom.palembang/",
    },
    {
      platform: "youtube",
      label: "YouTube BBPOM Palembang",
      href: "https://www.youtube.com/@bbpom_palembang",
    },
  ],
};

export function normalizeTelHref(phone: string): string {
  const cleaned = phone.replace(/[^0-9+]/g, "");
  return `tel:${cleaned || "0711510195"}`;
}
