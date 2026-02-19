"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import { BuildGrid } from "./build-grid";
import type { Build, BuildEra } from "@/lib/types";

interface EraSectionProps {
  eras: BuildEra[];
  unassignedBuilds: Build[];
}

function EraGroup({
  era,
}: {
  era: BuildEra;
}) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(era.isCollapsed);
  const buildCount = era.builds.length;
  const countLabel = buildCount === 1 ? t("hangar.era.build") : t("hangar.era.builds").replace("{{count}}", String(buildCount));

  return (
    <div>
      {/* Era header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-3 pb-4 mb-4 border-b border-border/50 group/era"
      >
        <motion.div
          animate={{ rotate: collapsed ? -90 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-muted-foreground group-hover/era:text-foreground transition-colors"
        >
          <ChevronDown className="h-5 w-5" />
        </motion.div>
        <div className="flex-1 text-left">
          <h3 className="text-lg font-bold text-foreground tracking-tight">
            {era.name}
          </h3>
          {era.description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {era.description}
            </p>
          )}
        </div>
        <span className="text-xs text-muted-foreground px-2.5 py-1 rounded-full bg-muted/50 border border-border/50">
          {countLabel}
        </span>
      </button>

      {/* Era builds */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {buildCount > 0 ? (
              <BuildGrid builds={era.builds} />
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                {t("hangar.era.empty")}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function EraSection({ eras, unassignedBuilds }: EraSectionProps) {
  const { t } = useTranslation();

  const sortedEras = [...eras].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-10">
      {sortedEras.map((era) => (
        <EraGroup key={era.id} era={era} />
      ))}

      {/* Unassigned builds */}
      {unassignedBuilds.length > 0 && (
        <div>
          {sortedEras.length > 0 && (
            <div className="pb-4 mb-4 border-b border-border/50">
              <h3 className="text-lg font-bold text-foreground tracking-tight">
                {t("hangar.era.allBuilds")}
              </h3>
            </div>
          )}
          <BuildGrid builds={unassignedBuilds} />
        </div>
      )}
    </div>
  );
}
