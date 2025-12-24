import Navbar from "@/components/layouts/Navbar";
import Footer from "@/components/layouts/footer";
import HeroSection from "@/components/landing page/Herosection/page";
import Profil from "@/components/landing page/Profil/page";
import Formasi from "@/components/landing page/Formasi/page";
import Datastatistik from "@/components/landing page/Datastatistik/page";
import Manfaat from "@/components/landing page/Manfaat/page";
import Peraturan from "@/components/landing page/Peraturan/page";

export default function HomePage() {
  return (
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

      <HeroSection />
      <Profil />
      <Formasi />
      <Datastatistik />
      <Manfaat />
      <Peraturan />

      <Footer />
    </div>
  );
}
