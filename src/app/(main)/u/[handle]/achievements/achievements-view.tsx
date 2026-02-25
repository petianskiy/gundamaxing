"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Trophy,
  ArrowLeft,
  Star,
  Check,
  Hammer,
  Heart,
  MessageSquare,
  GitBranch,
  Package,
  BookOpen,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LevelBadge } from "@/components/ui/level-badge";
import type { UserAchievementUI, AchievementCategory, LevelInfo } from "@/lib/types";

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

// ─── Category Config ─────────────────────────────────────────────

const categoryConfig: Record<
  AchievementCategory,
  { label: string; color: string; bgColor: string; borderColor: string; icon: React.ElementType }
> = {
  BUILDING: {
    label: "Building",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    icon: Hammer,
  },
  SOCIAL: {
    label: "Social",
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/30",
    icon: Heart,
  },
  POPULARITY: {
    label: "Popularity",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    icon: Star,
  },
  FORUM: {
    label: "Forum",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    icon: MessageSquare,
  },
  LINEAGE: {
    label: "Lineage",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    icon: GitBranch,
  },
  COLLECTOR: {
    label: "Collector",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    icon: Package,
  },
  COMMUNITY: {
    label: "Community",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    icon: Users,
  },
};

const ALL_CATEGORIES: AchievementCategory[] = [
  "BUILDING",
  "SOCIAL",
  "POPULARITY",
  "FORUM",
  "LINEAGE",
  "COLLECTOR",
  "COMMUNITY",
];

// ─── Tier Colors ─────────────────────────────────────────────────

const tierColors = [
  { bg: "bg-zinc-700", text: "text-zinc-300", border: "border-zinc-600", glow: "" },
  { bg: "bg-emerald-700", text: "text-emerald-300", border: "border-emerald-500", glow: "" },
  { bg: "bg-blue-700", text: "text-blue-300", border: "border-blue-500", glow: "" },
  { bg: "bg-purple-700", text: "text-purple-300", border: "border-purple-500", glow: "" },
  { bg: "bg-amber-600", text: "text-amber-200", border: "border-amber-400", glow: "shadow-amber-500/30 shadow-lg" },
];

// ─── Unit labels per achievement slug for tier descriptions ──────

const unitLabels: Record<string, string> = {
  builder: "builds",
  supporter: "likes given",
  "rising-star": "likes received",
  "forum-voice": "forum posts",
  genealogist: "lineages",
  collector: "kits",
  critic: "reviews",
  "community-pillar": "engagement",
};

// ─── Props ───────────────────────────────────────────────────────

interface AchievementsViewProps {
  username: string;
  handle: string;
  achievements: UserAchievementUI[];
  levelInfo: LevelInfo;
  earnedCount: number;
  totalCount?: number;
  isOwner: boolean;
}

// ─── Main Component ──────────────────────────────────────────────

export function AchievementsView({
  username,
  handle,
  achievements,
  levelInfo,
  earnedCount,
  totalCount,
  isOwner,
}: AchievementsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | "ALL">("ALL");

  const filtered =
    selectedCategory === "ALL"
      ? achievements
      : achievements.filter((a) => a.achievement.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/u/${handle}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to profile
      </Link>

      {/* Level header */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold font-rajdhani text-foreground">
                {username}&apos;s Achievements
              </h1>
              <LevelBadge level={levelInfo.level} size="md" />
            </div>
            <p className="text-sm text-muted-foreground">
              {totalCount !== undefined
                ? `${earnedCount} of ${totalCount} achievements progressed`
                : `${earnedCount} achievements earned`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gx-gold">{levelInfo.xp}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total XP</p>
          </div>
        </div>

        {/* XP progress bar */}
        {levelInfo.level < 5 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Level {levelInfo.level}</span>
              <span>
                {levelInfo.xp} / {levelInfo.nextLevelXp} XP
              </span>
              <span>Level {levelInfo.level + 1}</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gx-gold/80 to-gx-gold rounded-full transition-all duration-500"
                style={{ width: `${levelInfo.progress}%` }}
              />
            </div>
          </div>
        )}
        {levelInfo.level >= 5 && (
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">Max Level Reached</span>
            </div>
          </div>
        )}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory("ALL")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
            selectedCategory === "ALL"
              ? "bg-gx-gold/15 text-gx-gold border-gx-gold/30"
              : "text-muted-foreground hover:text-foreground border-border/50 hover:border-border"
          )}
        >
          All
        </button>
        {ALL_CATEGORIES.map((cat) => {
          const config = categoryConfig[cat];
          const catAchievements = achievements.filter((a) => a.achievement.category === cat);
          if (!isOwner && catAchievements.length === 0) return null;
          const earned = catAchievements.filter((a) => a.tier >= 1).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                selectedCategory === cat
                  ? `${config.bgColor} ${config.color} ${config.borderColor}`
                  : "text-muted-foreground hover:text-foreground border-border/50 hover:border-border"
              )}
            >
              {config.label}
              {isOwner && ` (${earned}/${catAchievements.length})`}
              {!isOwner && ` (${earned})`}
            </button>
          );
        })}
      </div>

      {/* Achievement grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <DetailedAchievementCard key={item.achievement.id} item={item} isOwner={isOwner} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No achievements in this category.</p>
        </div>
      )}
    </div>
  );
}

// ─── Detailed Achievement Card ───────────────────────────────────

function DetailedAchievementCard({
  item,
  isOwner,
}: {
  item: UserAchievementUI;
  isOwner: boolean;
}) {
  const { achievement, tier, progress, nextTierThreshold } = item;
  const catConfig = categoryConfig[achievement.category];
  const IconComponent = (achievement.icon && iconMap[achievement.icon]) || Trophy;
  const isEarned = tier >= 1;
  const isMaxed = tier >= 5;
  const unit = unitLabels[achievement.slug] || "actions";

  // Calculate XP earned from this achievement
  const xpEarned = achievement.xpPerTier
    .slice(0, tier)
    .reduce((sum, xp) => sum + xp, 0);

  // Total possible XP
  const totalXp = achievement.xpPerTier.reduce((sum, xp) => sum + xp, 0);

  // Progress toward next tier
  const currentTierThreshold = tier > 0 ? achievement.tiers[tier - 1] : 0;
  const progressPercent = nextTierThreshold
    ? Math.min(
        100,
        Math.max(
          0,
          Math.round(((progress - currentTierThreshold) / (nextTierThreshold - currentTierThreshold)) * 100)
        )
      )
    : 100;

  // Determine card glow for high tiers
  const cardGlow = tier >= 5
    ? "shadow-[0_0_15px_rgba(245,158,11,0.15)]"
    : tier >= 4
      ? "shadow-[0_0_10px_rgba(168,85,247,0.1)]"
      : "";

  return (
    <div
      className={cn(
        "rounded-xl border p-5 transition-all",
        isEarned
          ? `bg-card ${catConfig.borderColor} ${cardGlow}`
          : "bg-zinc-900/30 border-zinc-800/50",
        !isEarned && "opacity-50"
      )}
    >
      {/* Header row */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl shrink-0",
            isEarned
              ? `${catConfig.bgColor} ${catConfig.color}`
              : "bg-zinc-800/50 text-zinc-600"
          )}
        >
          <IconComponent className="h-5.5 w-5.5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              "text-base font-bold font-rajdhani leading-tight",
              isEarned ? "text-foreground" : "text-zinc-500"
            )}
          >
            {achievement.name}
          </h3>
          <p
            className={cn(
              "text-xs mt-0.5 leading-relaxed",
              isEarned ? "text-muted-foreground" : "text-zinc-600"
            )}
          >
            {achievement.description}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className={cn("text-xs font-bold", isEarned ? "text-gx-gold" : "text-zinc-600")}>
            {xpEarned}/{totalXp}
          </p>
          <p className="text-[10px] text-muted-foreground">XP</p>
        </div>
      </div>

      {/* Tier progression row */}
      <div className="flex items-center justify-between gap-2 mb-4">
        {Array.from({ length: 5 }, (_, i) => {
          const tierNum = i + 1;
          const earned = tier >= tierNum;
          const isCurrent = tier === tierNum;
          const colors = tierColors[i];
          return (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={cn(
                  "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all relative",
                  earned
                    ? `${colors.bg} ${colors.border} ${colors.glow}`
                    : "bg-zinc-800/30 border-zinc-700/40",
                  isCurrent && !isMaxed && "ring-2 ring-offset-1 ring-offset-background ring-white/20"
                )}
              >
                {earned ? (
                  <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                ) : (
                  <span className="text-[10px] font-bold text-zinc-600">{tierNum}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-[9px] font-medium",
                  earned ? colors.text : "text-zinc-600"
                )}
              >
                {achievement.tiers[i]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar between current and next tier */}
      {!isMaxed && (
        <div className="mb-3">
          <div className="flex justify-between items-center text-[10px] mb-1">
            <span className={isEarned ? "text-muted-foreground" : "text-zinc-600"}>
              Progress to Tier {tier + 1}
            </span>
            <span className={isEarned ? "text-foreground font-medium" : "text-zinc-600"}>
              {progress} / {nextTierThreshold}
            </span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                tier === 0
                  ? "bg-zinc-600"
                  : tier >= 4
                    ? "bg-gradient-to-r from-purple-600 to-purple-400"
                    : tier >= 3
                      ? "bg-gradient-to-r from-blue-600 to-blue-400"
                      : tier >= 2
                        ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
                        : "bg-gradient-to-r from-zinc-500 to-zinc-400"
              )}
              style={{ width: `${Math.max(0, progressPercent)}%` }}
            />
          </div>
        </div>
      )}
      {isMaxed && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-bold tracking-wider mb-1">
            <Star className="h-3 w-3" />
            FULLY MAXED
          </div>
          <div className="h-2 bg-gradient-to-r from-amber-600/40 to-amber-400/40 rounded-full" />
        </div>
      )}

      {/* Tier threshold list */}
      <div className="space-y-1">
        {achievement.tiers.map((threshold, i) => {
          const tierNum = i + 1;
          const earned = tier >= tierNum;
          return (
            <div
              key={i}
              className={cn(
                "flex items-center justify-between text-[10px] px-2 py-0.5 rounded",
                earned ? "text-muted-foreground" : "text-zinc-600"
              )}
            >
              <span>
                <span
                  className={cn(
                    "inline-block w-1.5 h-1.5 rounded-full mr-1.5",
                    earned ? tierColors[i].bg : "bg-zinc-700"
                  )}
                />
                Tier {tierNum}: {threshold} {unit}
              </span>
              <span className={cn("font-medium", earned ? "text-gx-gold" : "")}>
                {earned && <Check className="inline h-2.5 w-2.5 mr-0.5" />}
                +{achievement.xpPerTier[i]} XP
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
