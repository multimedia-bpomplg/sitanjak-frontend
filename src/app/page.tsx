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
