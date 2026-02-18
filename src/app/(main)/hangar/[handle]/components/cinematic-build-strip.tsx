"use client";

import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/context";
import type { Build, BuildEra, HangarLayout } from "@/lib/types";
import { EraRow } from "./era-row";

interface CinematicBuildStripProps {
  eras: BuildEra[];
  unassignedBuilds: Build[];
  layout: HangarLayout;
  onInspect: (build: Build) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export function CinematicBuildStrip({
  eras,
  unassignedBuilds,
  layout,
  onInspect,
}: CinematicBuildStripProps) {
  const { t } = useTranslation();

  const sortedEras = [...eras].sort((a, b) => a.order - b.order);

  return (
    <section className="mt-12 space-y-10">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-10"
      >
        {sortedEras.map((era) => (
          <motion.div key={era.id} variants={rowVariants}>
            <EraRow
              era={{
                id: era.id,
                name: era.name,
                builds: era.builds,
                isCollapsed: era.isCollapsed,
                coverImage: era.coverImage,
              }}
              onInspect={onInspect}
            />
          </motion.div>
        ))}

        {unassignedBuilds.length > 0 && (
          <motion.div variants={rowVariants}>
            <EraRow
              era={{
                id: "__unassigned__",
                name: t("hangar.era.allBuilds"),
                builds: unassignedBuilds,
                isCollapsed: false,
                coverImage: null,
              }}
              onInspect={onInspect}
            />
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
