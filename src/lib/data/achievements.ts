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
  xpReward: number;
  threshold: number;
}): AchievementUI {
  return {
    id: a.id,
    slug: a.slug,
    name: a.name,
    description: a.description,
    category: a.category as AchievementCategory,
    icon: a.icon,
    xpReward: a.xpReward,
    threshold: a.threshold,
  };
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
      unlockedAt: ua.unlockedAt.toISOString(),
      progress: ua.progress,
      isUnlocked: true,
    }));
  }
);

export const getAchievementProgress = cache(
  async (userId: string): Promise<UserAchievementUI[]> => {
    // Get all achievements
    const allAchievements = await db.achievement.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });

    // Get user's unlocked achievements
    const userAchievements = await db.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true, unlockedAt: true, progress: true },
    });

    const unlockedMap = new Map(
      userAchievements.map((ua) => [
        ua.achievementId,
        { unlockedAt: ua.unlockedAt, progress: ua.progress },
      ])
    );

    return allAchievements.map((a) => {
      const unlock = unlockedMap.get(a.id);
      return {
        achievement: toAchievementUI(a),
        unlockedAt: unlock?.unlockedAt.toISOString() ?? null,
        progress: unlock?.progress ?? 0,
        isUnlocked: !!unlock,
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
