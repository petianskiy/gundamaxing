"use client";

import { motion } from "framer-motion";
import { Package, Clock, Star, Award } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import type { HangarUser } from "@/lib/types";

interface BuilderStatsPanelProps {
  user: HangarUser;
}

function calculateYearsBuilding(createdAt: string): number {
  const joined = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - joined.getTime();
  const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, Math.floor(years * 10) / 10);
}

export function BuilderStatsPanel({ user }: BuilderStatsPanelProps) {
  const { t } = useTranslation();

  const yearsBuilding = calculateYearsBuilding(user.createdAt);
  const favoriteGrade = user.preferredGrades.length > 0 ? user.preferredGrades[0] : "\u2014";

  const stats = [
    {
      icon: Package,
      label: t("hangar.stats.kitsCompleted"),
      value: String(user.buildCount),
    },
    {
      icon: Clock,
      label: t("hangar.stats.yearsBuilding"),
      value: yearsBuilding < 1 ? "<1" : String(yearsBuilding),
    },
    {
      icon: Star,
      label: t("hangar.stats.favoriteGrade"),
      value: favoriteGrade,
    },
    {
      icon: Award,
      label: t("hangar.stats.level"),
      value: String(user.level),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" as const }}
    >
      <div className="flex justify-center gap-3 sm:gap-4 lg:gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-black/20 backdrop-blur-sm border border-white/5"
          >
            <stat.icon className="h-4 w-4 text-white/30 hidden sm:block" />
            <div className="text-center sm:text-left">
              <p className="text-base sm:text-lg font-bold text-white tabular-nums">
                {stat.value}
              </p>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-white/30 font-medium">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
