import { FeaturesSection } from "@/components/landing/features-section";
import { HeroSection } from "@/components/landing/hero-section";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteNav } from "@/components/landing/site-nav";

export default function HomePage() {
  return (
    <>
      <SiteNav />
      <main className="flex flex-col">
        <HeroSection />
        <FeaturesSection />
      </main>
      <SiteFooter />
    </>
  );
}
