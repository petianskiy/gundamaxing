"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import type { Build } from "@/lib/types";
import { EraBuildCard } from "./era-build-card";

interface EraRowProps {
  era: {
    id: string;
    name: string;
    builds: Build[];
    isCollapsed?: boolean;
    coverImage?: string | null;
  };
  onInspect: (build: Build) => void;
}

export function EraRow({ era, onInspect }: EraRowProps) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(era.isCollapsed ?? false);

  const buildCountLabel =
    era.builds.length === 1
      ? t("hangar.era.build")
      : t("hangar.era.builds", { count: era.builds.length });

  return (
    <div>
      {/* Header */}
      <button
        onClick={() => setCollapsed((prev) => !prev)}
        className={cn(
          "flex items-center gap-3 w-full text-left group",
          "px-2 py-2 rounded-lg transition-colors",
          "hover:bg-[#18181b]/60"
        )}
      >
        <motion.span
          animate={{ rotate: collapsed ? 0 : 90 }}
          transition={{ duration: 0.2 }}
          className="text-zinc-500 group-hover:text-zinc-300"
        >
          <ChevronRight className="w-5 h-5" />
        </motion.span>

        <h3 className="text-lg font-bold text-zinc-100 tracking-tight">
          {era.name}
        </h3>

        <span className="text-sm text-zinc-500 font-medium">
          {buildCountLabel}
        </span>
      </button>

      {/* Scrollable build row */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key={`era-content-${era.id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                "flex gap-4 pt-3 pb-4 px-2",
                "overflow-x-auto",
                "[scroll-snap-type:x_mandatory]",
                "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              )}
            >
              {era.builds.length > 0 ? (
                era.builds.map((build) => (
                  <EraBuildCard
                    key={build.id}
                    build={build}
                    onClick={() => onInspect(build)}
                  />
                ))
              ) : (
                <p className="text-sm text-zinc-600 italic py-6 px-2">
                  {t("hangar.era.empty")}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
