"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/context";
import { BuildGridCard } from "./build-grid-card";
import type { Build } from "@/lib/types";

interface BuildGridProps {
  builds: Build[];
  pinnedBuildIds?: string[];
}

export function BuildGrid({ builds, pinnedBuildIds = [] }: BuildGridProps) {
  const { t } = useTranslation();

  const sortedBuilds = useMemo(() => {
    if (pinnedBuildIds.length === 0) return builds;
    return [...builds].sort((a, b) => {
      const aPin = pinnedBuildIds.includes(a.id) ? -1 : 0;
      const bPin = pinnedBuildIds.includes(b.id) ? -1 : 0;
      return aPin - bPin;
    });
  }, [builds, pinnedBuildIds]);

  if (sortedBuilds.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">{t("hangar.emptyHangar")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {sortedBuilds.map((build, i) => (
        <motion.div
          key={build.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: i * 0.04 }}
        >
          <BuildGridCard
            build={build}
            isPinned={pinnedBuildIds.includes(build.id)}
          />
        </motion.div>
      ))}
    </div>
  );
}
