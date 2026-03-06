import type { Metadata } from "next";

import Navbar from "@/components/layouts/Navbar";
import Footer from "@/components/layouts/footer";
import HeroSection from "@/components/LandingPage/Herosection/page";
import Profil from "@/components/LandingPage/Profil/page";
import Formasi from "@/components/LandingPage/Formasi/page";
import Datastatistik from "@/components/LandingPage/Datastatistik/page";
import Manfaat from "@/components/LandingPage/Manfaat/page";
import Peraturan from "@/components/LandingPage/Peraturan/page";
import AnimatedSection from "@/components/ui/AnimatedSection";
import LandingPopup from "@/components/ui/Banner";
import WhatsAppBubble from "@/components/ui/WhatappBubble";
import InformasiFungsi from "@/components/LandingPage/InformasiFungsi/page";

/* ================= SEO METADATA ================= */

export const metadata: Metadata = {
  title: "SI TANJAK - Sistem Informasi Tahapan dan Jangkauan Magang Akademik",

  description:
    "SI TANJAK adalah Sistem Informasi Tahapan dan Jangkauan Magang Akademik untuk pendaftaran, seleksi, dan pengelolaan kegiatan magang secara digital.",

  keywords: [
    "magang bpom palembang",
    "magang bbpom palembang",
    "magang bbpom kota palembang",
    "magang palembang",
    "magang smk palembang",
    "magang mahasiswa palembang",
    "pendaftaran magang bpom",
    "sitanjak bpom palembang",
    "bpom palembang",
    "balai besar pom palembang",
    "bbpom kota palembang",
  ],

  openGraph: {
    title: "SI TANJAK",
    description: "Sistem Informasi Tahapan dan Jangkauan Magang Akademik.",
    url: "https://sitanjak.tech",
    siteName: "SI TANJAK",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/seo.png",
        width: 1200,
        height: 630,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "SI TANJAK",
    description: "Sistem Informasi Tahapan dan Jangkauan Magang Akademik",
    images: ["/seo.png"],
  },
};

/* ================= PAGE ================= */

export default function HomePage() {
  return (
    <>
      {/* Google Rich Result Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "SI TANJAK",
            url: "https://sitanjak.tech",
            description:
              "Sistem Informasi Tahapan dan Jangkauan Magang Akademik",
            publisher: {
              "@type": "Organization",
              name: "BPOM Palembang",
            },
          }),
        }}
      />

      {/* POPUP PROMO */}
      <LandingPopup />

      {/* WHATSAPP FLOAT */}
      <WhatsAppBubble />

      <div
        className="
          min-h-screen
          bg-linear-to-br 
          from-[#FFF7E6] 
          via-[#F3FDFB] 
          to-[#FFFFFF]
          pt-23
        "
      >
        <Navbar />

        <AnimatedSection id="home">
          <HeroSection />
        </AnimatedSection>

        <AnimatedSection id="profil">
          <Profil />
        </AnimatedSection>

        <AnimatedSection id="formasi">
          <Formasi />
        </AnimatedSection>

        <AnimatedSection id="informasi">
          <InformasiFungsi />
        </AnimatedSection>

        <Datastatistik />

        <AnimatedSection id="manfaat">
          <Manfaat />
        </AnimatedSection>

        <AnimatedSection id="peraturan">
          <Peraturan />
        </AnimatedSection>

        <Footer />
      </div>
    </>
  );
}
