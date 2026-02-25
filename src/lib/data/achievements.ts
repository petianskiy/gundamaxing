import { cache } from "react";
import { db } from "@/lib/db";
import { getLevelProgress } from "@/lib/achievements";
import type {
  AchievementUI,
  UserAchievementUI,
  AchievementCategory,
  LevelInfo,
} from "@/lib/types";

// ─── Transform Helpers ──────────────────────────────────────────

function toAchievementUI(a: {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  icon: string | null;
  tiers: number[];
  xpPerTier: number[];
}): AchievementUI {
  return {
    id: a.id,
    slug: a.slug,
    name: a.name,
    description: a.description,
    category: a.category as AchievementCategory,
    icon: a.icon,
    tiers: a.tiers,
    xpPerTier: a.xpPerTier,
  };
}

function getNextTierThreshold(tiers: number[], currentTier: number): number | null {
  if (currentTier >= tiers.length) return null; // maxed out
  return tiers[currentTier] ?? null; // currentTier is 0-based index for the next tier
}

// ─── Queries ────────────────────────────────────────────────────

export const getUserAchievements = cache(
  async (userId: string): Promise<UserAchievementUI[]> => {
    const userAchievements = await db.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { unlockedAt: "desc" },
    });

    return userAchievements.map((ua) => ({
      achievement: toAchievementUI(ua.achievement),
      tier: ua.tier,
      progress: ua.progress,
      nextTierThreshold: getNextTierThreshold(ua.achievement.tiers, ua.tier),
    }));
  }
);

export const getAchievementProgress = cache(
  async (userId: string): Promise<UserAchievementUI[]> => {
    // Get all achievements ordered by sortOrder
    const allAchievements = await db.achievement.findMany({
      orderBy: { sortOrder: "asc" },
    });

    // Get user's UserAchievement records
    const userAchievements = await db.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true, tier: true, progress: true },
    });

    const userMap = new Map(
      userAchievements.map((ua) => [
        ua.achievementId,
        { tier: ua.tier, progress: ua.progress },
      ])
    );

    return allAchievements.map((a) => {
      const userData = userMap.get(a.id);
      const tier = userData?.tier ?? 0;
      const progress = userData?.progress ?? 0;
      return {
        achievement: toAchievementUI(a),
        tier,
        progress,
        nextTierThreshold: getNextTierThreshold(a.tiers, tier),
      };
    });
  }
);

export const getEarnedAchievements = cache(
  async (userId: string): Promise<UserAchievementUI[]> => {
    // Get all achievements ordered by sortOrder
    const allAchievements = await db.achievement.findMany({
      orderBy: { sortOrder: "asc" },
    });

    // Get user's UserAchievement records where tier >= 1
    const userAchievements = await db.userAchievement.findMany({
      where: { userId, tier: { gte: 1 } },
      select: { achievementId: true, tier: true, progress: true },
    });

    const userMap = new Map(
      userAchievements.map((ua) => [
        ua.achievementId,
        { tier: ua.tier, progress: ua.progress },
      ])
    );

    // Only return achievements where the user has tier >= 1
    return allAchievements
      .filter((a) => userMap.has(a.id))
      .map((a) => {
        const userData = userMap.get(a.id)!;
        return {
          achievement: toAchievementUI(a),
          tier: userData.tier,
          progress: userData.progress,
          nextTierThreshold: getNextTierThreshold(a.tiers, userData.tier),
        };
      });
  }
);

export const getUserLevel = cache(
  async (userId: string): Promise<LevelInfo> => {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true },
    });

    if (!user) {
      return { level: 1, xp: 0, currentLevelXp: 0, nextLevelXp: 100, progress: 0 };
    }

    const info = getLevelProgress(user.xp);
    return {
      level: info.level,
      xp: info.currentXp,
      currentLevelXp: info.currentXp,
      nextLevelXp: info.nextLevelXp,
      progress: info.progress,
    };
  }
);

export const getLeaderboard = cache(
  async (limit: number = 20): Promise<
    Array<{
      id: string;
      username: string;
      displayName: string | null;
      avatar: string | null;
      xp: number;
      level: number;
      achievementCount: number;
    }>
  > => {
    const users = await db.user.findMany({
      where: { isProfilePrivate: false },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        xp: true,
        level: true,
        _count: { select: { achievements: true } },
      },
      orderBy: { xp: "desc" },
      take: limit,
    });

    return users.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      avatar: u.avatar,
      xp: u.xp,
      level: u.level,
      achievementCount: u._count.achievements,
    }));
  }
);
