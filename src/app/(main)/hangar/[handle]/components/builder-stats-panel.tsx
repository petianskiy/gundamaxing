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
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
      className="mb-8"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border/50 bg-[#18181b]/80 backdrop-blur-sm p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                {stat.label}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground tracking-tight">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
