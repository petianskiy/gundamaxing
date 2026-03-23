import { HeroSection } from "@/components/landing/hero-section";
import { FeaturedBuildsSection } from "@/components/landing/featured-builds-section";
import { GundamGridSection } from "@/components/landing/gundam-grid-section";
import { BuildDnaTeaser } from "@/components/landing/build-dna-teaser";
import { WorkshopsSection } from "@/components/landing/workshops-section";
import { ConnectSection } from "@/components/landing/connect-section";
import { getLatestBuilds, getBuildOfTheWeek } from "@/lib/data/builds";
import { getLeafCategories } from "@/lib/data/categories";
import type { ForumCategory } from "@/lib/types";

const WORKSHOP_NAMES = ["Painting", "Scribing", "Decals", "Weathering", "LEDs", "Kitbash"];

// Revalidate every 60 seconds so new builds appear on the landing page
export const revalidate = 60;

export default async function HomePage() {
  const [latestBuilds, buildOfTheWeek, leafCategories] = await Promise.all([
    getLatestBuilds(4),
    getBuildOfTheWeek(),
    getLeafCategories(),
  ]);

  const workshopCategories = WORKSHOP_NAMES
    .map((name) => leafCategories.find((c) => c.name.toLowerCase() === name.toLowerCase()))
    .filter((c): c is ForumCategory => !!c);

  return (
    <>
      <HeroSection buildOfTheWeek={buildOfTheWeek} />
      <FeaturedBuildsSection builds={latestBuilds} />
      <GundamGridSection />
      <BuildDnaTeaser />
      <WorkshopsSection categories={workshopCategories} />
      <ConnectSection />
    </>
  );
}
