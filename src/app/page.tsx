import { HeroSection } from "@/components/landing/hero-section";
import { FeaturedBuildsSection } from "@/components/landing/featured-builds-section";
import { GundamGridSection } from "@/components/landing/gundam-grid-section";
import { BuildDnaTeaser } from "@/components/landing/build-dna-teaser";
import { WorkshopsSection } from "@/components/landing/workshops-section";
import { ConnectSection } from "@/components/landing/connect-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedBuildsSection />
      <GundamGridSection />
      <BuildDnaTeaser />
      <WorkshopsSection />
      <ConnectSection />
    </>
  );
}
