"use client";

import Link from "next/link";
import {
  Trophy,
  Hammer,
  Heart,
  Star,
  MessageSquare,
  GitBranch,
  Package,
  BookOpen,
  Users,
  ChevronRight,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserAchievementUI, AchievementCategory } from "@/lib/types";

// ─── Icon Mapping ────────────────────────────────────────────────

const iconMap: Record<string, React.ElementType> = {
  hammer: Hammer,
  heart: Heart,
  star: Star,
  "message-square": MessageSquare,
  "git-branch": GitBranch,
  package: Package,
  "book-open": BookOpen,
  users: Users,
};

// ─── Category Colors ─────────────────────────────────────────────

const categoryColors: Record<AchievementCategory, { icon: string; border: string }> = {
  BUILDING: { icon: "text-blue-400", border: "border-l-blue-400" },
  SOCIAL: { icon: "text-pink-400", border: "border-l-pink-400" },
  POPULARITY: { icon: "text-amber-400", border: "border-l-amber-400" },
  FORUM: { icon: "text-green-400", border: "border-l-green-400" },
  LINEAGE: { icon: "text-purple-400", border: "border-l-purple-400" },
  COLLECTOR: { icon: "text-cyan-400", border: "border-l-cyan-400" },
  COMMUNITY: { icon: "text-orange-400", border: "border-l-orange-400" },
};

// ─── Tier Colors ─────────────────────────────────────────────────

const tierIndicatorColors = [
  { filled: "bg-zinc-500 border-zinc-400", ring: "" },                                          // T1
  { filled: "bg-emerald-600 border-emerald-400", ring: "" },                                    // T2
  { filled: "bg-blue-600 border-blue-400", ring: "" },                                          // T3
  { filled: "bg-purple-600 border-purple-400", ring: "" },                                      // T4
  { filled: "bg-amber-500 border-amber-300", ring: "shadow-[0_0_6px_rgba(245,158,11,0.4)]" },  // T5
];

// ─── Props ───────────────────────────────────────────────────────

interface AchievementsProps {
  achievements: UserAchievementUI[];
  isOwner: boolean;
  handle: string;
}

// ─── Main Component ──────────────────────────────────────────────

export function Achievements({ achievements, isOwner, handle }: AchievementsProps) {
  // Visitor view: only show earned (tier >= 1)
  const displayAchievements = isOwner
    ? achievements
    : achievements.filter((a) => a.tier >= 1);

  // If visitor and nothing earned, render nothing
  if (!isOwner && displayAchievements.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-border/50 bg-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-gx-gold" />
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            Achievements
          </h2>
        </div>
        <Link
          href={`/u/${handle}/achievements`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Achievement Cards */}
      <div className="grid grid-cols-1 gap-3">
        {displayAchievements.map((item) => (
          <AchievementCard key={item.achievement.id} item={item} />
        ))}
      </div>

      {/* Owner empty state */}
      {isOwner && displayAchievements.every((a) => a.tier === 0) && (
        <p className="text-center text-xs text-muted-foreground mt-3">
          Start building to unlock achievements!
        </p>
      )}
    </section>
  );
}

// ─── Achievement Card ────────────────────────────────────────────

function AchievementCard({ item }: { item: UserAchievementUI }) {
  const { achievement, tier, progress, nextTierThreshold } = item;
  const catColor = categoryColors[achievement.category];
  const IconComponent = (achievement.icon && iconMap[achievement.icon]) || Trophy;
  const isEarned = tier >= 1;
  const isMaxed = tier >= 5;

  // Calculate XP earned from this achievement (sum of xpPerTier for earned tiers)
  const xpEarned = achievement.xpPerTier
    .slice(0, tier)
    .reduce((sum, xp) => sum + xp, 0);

  // Progress toward next tier
  const currentTierThreshold = tier > 0 ? achievement.tiers[tier - 1] : 0;
  const nextThreshold = nextTierThreshold;
  const progressPercent = nextThreshold
    ? Math.min(100, Math.round(((progress - currentTierThreshold) / (nextThreshold - currentTierThreshold)) * 100))
    : 100;

  return (
    <div
      className={cn(
        "relative rounded-xl border-l-[3px] border border-border/50 p-4 transition-all",
        isEarned
          ? `bg-card ${catColor.border}`
          : "bg-zinc-900/30 border-l-zinc-700 opacity-60"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
            isEarned
              ? `bg-background/50 ${catColor.icon}`
              : "bg-zinc-800/50 text-zinc-600"
          )}
        >
          <IconComponent className="h-4.5 w-4.5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3
              className={cn(
                "text-sm font-bold font-rajdhani leading-tight",
                isEarned ? "text-foreground" : "text-zinc-500"
              )}
            >
              {achievement.name}
            </h3>
            {xpEarned > 0 && (
              <span className="text-[10px] font-bold text-gx-gold tracking-wider shrink-0">
                +{xpEarned} XP
              </span>
            )}
          </div>

          <p
            className={cn(
              "text-xs mt-0.5 leading-relaxed",
              isEarned ? "text-muted-foreground" : "text-zinc-600"
            )}
          >
            {achievement.description}
          </p>

          {/* Tier Indicators */}
          <div className="flex items-center gap-1.5 mt-2.5">
            {Array.from({ length: 5 }, (_, i) => {
              const tierNum = i + 1;
              const earned = tier >= tierNum;
              const colors = tierIndicatorColors[i];
              return (
                <div
                  key={i}
                  className={cn(
                    "h-5 w-5 rounded-full border flex items-center justify-center transition-all",
                    earned
                      ? `${colors.filled} ${colors.ring}`
                      : "bg-zinc-800/50 border-zinc-700/50"
                  )}
                >
                  {earned && (
                    <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="mt-2.5">
            <div className="flex justify-between items-center text-[10px] mb-1">
              <span className={isEarned ? "text-muted-foreground" : "text-zinc-600"}>
                {isMaxed ? (
                  <span className="text-amber-400 font-bold tracking-wider">MAX</span>
                ) : (
                  `${progress} / ${nextTierThreshold}`
                )}
              </span>
            </div>
            {!isMaxed && (
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    isEarned
                      ? "bg-gradient-to-r from-zinc-500 to-zinc-400"
                      : "bg-zinc-600"
                  )}
                  style={{ width: `${Math.max(0, progressPercent)}%` }}
                />
              </div>
            )}
            {isMaxed && (
              <div className="h-1.5 bg-gradient-to-r from-amber-600/50 to-amber-400/50 rounded-full" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
