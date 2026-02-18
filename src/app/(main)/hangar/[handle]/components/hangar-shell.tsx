"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { HangarBackground } from "./hangar-background";
import { HangarIdentity } from "./hangar-identity";
import { BuildShowcase } from "./build-showcase";
import { CinematicBuildStrip } from "./cinematic-build-strip";
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

  const showcaseBuilds = featuredBuild
    ? [featuredBuild, ...latestBuilds.filter((b) => b.id !== featuredBuild.id)]
    : latestBuilds;

  const allBuilds = [
    ...showcaseBuilds,
    ...unassignedBuilds.filter(
      (b) => !showcaseBuilds.some((s) => s.id === b.id)
    ),
  ];

  const hasBelow = eras.length > 0 || unassignedBuilds.length > 0;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <HangarBackground />

      {/* ── HERO SECTION ── full viewport height, below navbar */}
      <section className="relative z-10 min-h-screen flex flex-col pt-20">
        {/* Identity bar */}
        <HangarIdentity user={user} isOwner={isOwner} />

        {/* Build Showcase — fills remaining space */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-6">
          <BuildShowcase
            builds={showcaseBuilds}
            allBuilds={allBuilds}
            user={user}
            isOwner={isOwner}
            onInspect={setInspectedBuild}
          />
        </div>

        {/* Scroll hint */}
        {hasBelow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="pb-6 flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-white/20"
            >
              <ChevronDown className="h-6 w-6" />
            </motion.div>
          </motion.div>
        )}
      </section>

      {/* ── BELOW THE FOLD ── era strips */}
      {hasBelow && (
        <section className="relative z-10 bg-[#09090b] border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <CinematicBuildStrip
              eras={eras}
              unassignedBuilds={unassignedBuilds}
              layout={user.hangarLayout}
              onInspect={setInspectedBuild}
            />
          </div>
        </section>
      )}

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
