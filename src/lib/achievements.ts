import { db } from "@/lib/db";
import type { AchievementCategory as PrismaAchievementCategory } from "@prisma/client";

// ─── Level Calculation ─────────────────────────────────────────

const LEVEL_THRESHOLDS = [0, 100, 300, 700, 1500];

export function calculateLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

export function getXpForNextLevel(currentLevel: number): number {
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    return Infinity;
  }
  return LEVEL_THRESHOLDS[currentLevel]; // next level threshold
}

export function getLevelProgress(xp: number): {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  progress: number;
} {
  const level = calculateLevel(xp);
  const currentLevelThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextLevelThreshold = LEVEL_THRESHOLDS[level] ?? Infinity;

  if (nextLevelThreshold === Infinity) {
    return { level, currentXp: xp, nextLevelXp: currentLevelThreshold, progress: 100 };
  }

  const xpIntoLevel = xp - currentLevelThreshold;
  const xpNeeded = nextLevelThreshold - currentLevelThreshold;
  const progress = Math.min(100, Math.round((xpIntoLevel / xpNeeded) * 100));

  return { level, currentXp: xp, nextLevelXp: nextLevelThreshold, progress };
}

// ─── Rate Limit (in-memory, per category per user) ────────────

const checkTimestamps = new Map<string, number>();
const CHECK_COOLDOWN_MS = 60_000; // 1 minute

function canCheck(userId: string, category: string): boolean {
  const key = `${userId}:${category}`;
  const last = checkTimestamps.get(key);
  if (last && Date.now() - last < CHECK_COOLDOWN_MS) {
    return false;
  }
  checkTimestamps.set(key, Date.now());
  return true;
}

// ─── Count Metric per Category ─────────────────────────────────

async function countMetric(
  userId: string,
  category: PrismaAchievementCategory
): Promise<number> {
  switch (category) {
    case "BUILDING":
      return db.build.count({ where: { userId } });

    case "SOCIAL":
      // Likes given on builds (not comments)
      return db.like.count({ where: { userId, buildId: { not: null } } });

    case "POPULARITY":
      // Total likes received across all builds
      return db.like.count({
        where: {
          build: { userId },
          buildId: { not: null },
        },
      });

    case "FORUM": {
      const [threads, comments] = await Promise.all([
        db.thread.count({ where: { userId } }),
        db.comment.count({ where: { userId, flagged: false } }),
      ]);
      return threads + comments;
    }

    case "LINEAGE":
      return db.lineage.count({ where: { userId } });

    case "COLLECTOR":
      return db.userKit.count({ where: { userId } });

    case "COMMUNITY":
      // Profile completion check: count 1 if user has filled out key fields
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { displayName: true, bio: true, avatar: true, country: true },
      });
      if (!user) return 0;
      const filledFields = [user.displayName, user.bio, user.avatar, user.country].filter(Boolean).length;
      return filledFields >= 3 ? 1 : 0;

    default:
      return 0;
  }
}

// ─── Main Achievement Check ─────────────────────────────────────

export async function checkAndAwardAchievements(
  userId: string,
  category: PrismaAchievementCategory
): Promise<void> {
  // Rate limit: max 1 check per category per user per 60 seconds
  if (!canCheck(userId, category)) {
    return;
  }

  try {
    // 1. Get all achievements for this category
    const achievements = await db.achievement.findMany({
      where: { category },
      orderBy: { threshold: "asc" },
    });

    if (achievements.length === 0) return;

    // 2. Get user's existing unlocked achievements for this category
    const existingUnlocks = await db.userAchievement.findMany({
      where: {
        userId,
        achievementId: { in: achievements.map((a) => a.id) },
      },
      select: { achievementId: true },
    });

    const unlockedSet = new Set(existingUnlocks.map((u) => u.achievementId));

    // 3. Count the relevant metric
    const count = await countMetric(userId, category);

    // 4. Find newly eligible achievements
    const toUnlock = achievements.filter(
      (a) => count >= a.threshold && !unlockedSet.has(a.id)
    );

    if (toUnlock.length === 0) return;

    // 5. Award achievements + XP in a transaction
    const totalXp = toUnlock.reduce((sum, a) => sum + a.xpReward, 0);

    await db.$transaction(async (tx) => {
      // Create all UserAchievement records
      for (const achievement of toUnlock) {
        await tx.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            progress: count,
          },
        });
      }

      // Award XP and recalculate level
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { xp: true },
      });

      if (user) {
        const newXp = user.xp + totalXp;
        const newLevel = calculateLevel(newXp);

        await tx.user.update({
          where: { id: userId },
          data: { xp: newXp, level: newLevel },
        });
      }
    });
  } catch (error) {
    // Silently fail — achievement checking should never break primary actions
    console.error(`[achievements] Error checking ${category} for user ${userId}:`, error);
  }
}
