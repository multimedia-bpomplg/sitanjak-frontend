import Navbar from "@/components/layouts/Navbar";
import Footer from "@/components/layouts/footer";
import HeroSection from "@/components/landing page/Herosection/page";
import Profil from "@/components/landing page/Profil/page";
import Formasi from "@/components/landing page/Formasi/page";
import Datastatistik from "@/components/landing page/Datastatistik/page";
import Manfaat from "@/components/landing page/Manfaat/page";
import Peraturan from "@/components/landing page/Peraturan/page";
import AnimatedSection from "@/components/ui/AnimatedSection";
import LandingPopup from "@/components/ui/Banner";
import WhatsAppBubble from "@/components/ui/WhatappBubble";

export default function HomePage() {
  return (
    <>
      {/* POPUP PROMO */}
      <LandingPopup
        image="/popup-magang.jpg"
        title="Pendaftaran Magang Dibuka 🎉"
        description="Bergabunglah bersama mentor profesional dan dapatkan pengalaman kerja nyata."
      />

      {/* WHATSAPP FLOAT */}
      <WhatsAppBubble />

      <div
        className="
          min-h-screen
          bg-gradient-to-br
          from-[#E8F8F1]
          via-[#E6FAFA]
          to-[#EEF7FF]
          pt-28
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
