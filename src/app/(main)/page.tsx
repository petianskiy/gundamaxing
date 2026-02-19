import { HeroSection } from "@/components/landing/hero-section";
import { FeaturedBuildsSection } from "@/components/landing/featured-builds-section";
import { GundamGridSection } from "@/components/landing/gundam-grid-section";
import { BuildDnaTeaser } from "@/components/landing/build-dna-teaser";
import { WorkshopsSection } from "@/components/landing/workshops-section";
import { ConnectSection } from "@/components/landing/connect-section";
import { getLatestBuilds } from "@/lib/data/builds";

// Revalidate every 60 seconds so new builds appear on the landing page
export const revalidate = 60;

export default async function HomePage() {
  const latestBuilds = await getLatestBuilds(4);

  return (
    <>
      <HeroSection />
      <FeaturedBuildsSection builds={latestBuilds} />
      <GundamGridSection />
      <BuildDnaTeaser />
      <WorkshopsSection />
      <ConnectSection />
    </>
  );
}
