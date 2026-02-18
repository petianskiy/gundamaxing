"use client";

import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { HangarBackground } from "./hangar-background";
import { HangarIdentity } from "./hangar-identity";
import { FeaturedBuildBanner } from "./featured-build-banner";
import { BuildGrid } from "./build-grid";
import { EraSection } from "./era-section";
import { InspectionOverlay } from "./inspection-overlay";
import type { HangarUser, Build, BuildEra } from "@/lib/types";

interface HangarShellProps {
  user: HangarUser;
  featuredBuild: Build | null;
  latestBuilds: Build[];
  eras: BuildEra[];
  unassignedBuilds: Build[];
  isOwner: boolean;
  currentUserId?: string;
}

export function HangarShell({
  user,
  featuredBuild,
  latestBuilds,
  eras,
  unassignedBuilds,
  isOwner,
  currentUserId,
}: HangarShellProps) {
  const [inspectedBuild, setInspectedBuild] = useState<Build | null>(null);

  // Collect all non-era builds (latest + unassigned, deduplicated)
  const allLooseBuilds = useMemo(() => {
    const seen = new Set<string>();
    const result: Build[] = [];
    for (const b of [...latestBuilds, ...unassignedBuilds]) {
      if (!seen.has(b.id)) {
        seen.add(b.id);
        result.push(b);
      }
    }
    return result;
  }, [latestBuilds, unassignedBuilds]);

  const hasEras = eras.length > 0;

  return (
    <div className="relative min-h-screen">
      <HangarBackground />

      <div className="relative z-10 min-h-screen">
        {/* Identity bar — scrolls with page */}
        <div className="pt-20">
          <HangarIdentity user={user} isOwner={isOwner} />
        </div>

        {/* Main content area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
          {/* Featured build banner */}
          {featuredBuild && (
            <FeaturedBuildBanner
              build={featuredBuild}
              onInspect={setInspectedBuild}
            />
          )}

          {/* Build grids */}
          {hasEras ? (
            <EraSection
              eras={eras}
              unassignedBuilds={allLooseBuilds}
              onInspect={setInspectedBuild}
            />
          ) : (
            <BuildGrid
              builds={allLooseBuilds}
              onInspect={setInspectedBuild}
            />
          )}
        </div>
      </div>

      {/* Inspection overlay */}
      <AnimatePresence>
        {inspectedBuild && (
          <InspectionOverlay
            build={inspectedBuild}
            currentUserId={currentUserId}
            onClose={() => setInspectedBuild(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
