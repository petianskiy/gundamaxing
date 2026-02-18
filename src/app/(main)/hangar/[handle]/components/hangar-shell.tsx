"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { HangarBackground } from "./hangar-background";
import { HangarHeader } from "./hangar-header";
import { HangarHero } from "./hangar-hero";
import { BuilderStatsPanel } from "./builder-stats-panel";
import { CinematicBuildStrip } from "./cinematic-build-strip";
import { InspectionOverlay } from "./inspection-overlay";
import type { HangarUser, Build, BuildEra } from "@/lib/types";

interface HangarShellProps {
  user: HangarUser;
  featuredBuild: Build | null;
  eras: BuildEra[];
  unassignedBuilds: Build[];
  isOwner: boolean;
  currentUserId?: string;
}

export function HangarShell({
  user,
  featuredBuild,
  eras,
  unassignedBuilds,
  isOwner,
  currentUserId,
}: HangarShellProps) {
  const [inspectedBuild, setInspectedBuild] = useState<Build | null>(null);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <HangarBackground theme={user.hangarTheme} accentColor={user.accentColor} />
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <HangarHeader user={user} isOwner={isOwner} />
        {featuredBuild && (
          <HangarHero
            build={featuredBuild}
            onInspect={() => setInspectedBuild(featuredBuild)}
          />
        )}
        <BuilderStatsPanel user={user} />
        <CinematicBuildStrip
          eras={eras}
          unassignedBuilds={unassignedBuilds}
          layout={user.hangarLayout}
          onInspect={setInspectedBuild}
        />
      </div>
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
