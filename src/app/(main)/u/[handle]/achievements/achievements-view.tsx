"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Lock,
  Star,
  ArrowLeft,
  Hammer,
  Heart,
  Flame,
  MessageSquare,
  GitBranch,
  Package,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LevelBadge } from "@/components/ui/level-badge";
import type { UserAchievementUI, AchievementCategory, LevelInfo } from "@/lib/types";

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
    icon: Flame,
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

interface AchievementsViewProps {
  username: string;
  handle: string;
  achievements: UserAchievementUI[];
  levelInfo: LevelInfo;
  unlockedCount: number;
  totalCount: number;
}

export function AchievementsView({
  username,
  handle,
  achievements,
  levelInfo,
  unlockedCount,
  totalCount,
}: AchievementsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | "ALL">("ALL");

  const filtered =
    selectedCategory === "ALL"
      ? achievements
      : achievements.filter((a) => a.achievement.category === selectedCategory);

  // Group by category for display
  const grouped = ALL_CATEGORIES.reduce(
    (acc, cat) => {
      const items = filtered.filter((a) => a.achievement.category === cat);
      if (items.length > 0) acc[cat] = items;
      return acc;
    },
    {} as Record<AchievementCategory, UserAchievementUI[]>
  );

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
              <h1 className="text-2xl font-bold text-foreground">
                {username}&apos;s Achievements
              </h1>
              <LevelBadge level={levelInfo.level} size="md" />
            </div>
            <p className="text-sm text-muted-foreground">
              {unlockedCount} of {totalCount} achievements unlocked
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
          All ({totalCount})
        </button>
        {ALL_CATEGORIES.map((cat) => {
          const config = categoryConfig[cat];
          const count = achievements.filter((a) => a.achievement.category === cat).length;
          const unlocked = achievements.filter(
            (a) => a.achievement.category === cat && a.isUnlocked
          ).length;
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
              {config.label} ({unlocked}/{count})
            </button>
          );
        })}
      </div>

      {/* Achievement cards by category */}
      <div className="space-y-8">
        {Object.entries(grouped).map(([category, items]) => {
          const config = categoryConfig[category as AchievementCategory];
          const CategoryIcon = config.icon;
          return (
            <section key={category}>
              <div className="flex items-center gap-2 mb-4">
                <CategoryIcon className={cn("h-4 w-4", config.color)} />
                <h2 className={cn("text-sm font-bold uppercase tracking-wider", config.color)}>
                  {config.label}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((item) => (
                  <AchievementCard key={item.achievement.id} item={item} />
                ))}
              </div>
            </section>
          );
        })}
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

function AchievementCard({ item }: { item: UserAchievementUI }) {
  const config = categoryConfig[item.achievement.category];

  return (
    <div
      className={cn(
        "relative rounded-xl border p-4 transition-all",
        item.isUnlocked
          ? `${config.bgColor} ${config.borderColor} shadow-sm`
          : "bg-zinc-900/50 border-zinc-800/50 opacity-50"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
            item.isUnlocked ? `${config.bgColor} ${config.color}` : "bg-zinc-800 text-zinc-600"
          )}
        >
          {item.isUnlocked ? (
            <Trophy className="h-5 w-5" />
          ) : (
            <Lock className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              "text-sm font-semibold leading-tight",
              item.isUnlocked ? "text-foreground" : "text-zinc-500"
            )}
          >
            {item.achievement.name}
          </h3>
          <p
            className={cn(
              "text-xs mt-0.5 leading-relaxed",
              item.isUnlocked ? "text-muted-foreground" : "text-zinc-600"
            )}
          >
            {item.achievement.description}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider",
                item.isUnlocked ? "text-gx-gold" : "text-zinc-600"
              )}
            >
              +{item.achievement.xpReward} XP
            </span>
            {item.isUnlocked && item.unlockedAt && (
              <span className="text-[10px] text-muted-foreground">
                {new Date(item.unlockedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress indicator for locked achievements */}
      {!item.isUnlocked && item.achievement.threshold > 1 && (
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-zinc-600 mb-1">
            <span>{item.progress} / {item.achievement.threshold}</span>
          </div>
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-zinc-600 rounded-full"
              style={{
                width: `${Math.min(100, (item.progress / item.achievement.threshold) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
