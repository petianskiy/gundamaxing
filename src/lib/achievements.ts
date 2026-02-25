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

// ─── Count Metrics per Category ───────────────────────────────

async function countMetrics(
  userId: string,
  category: PrismaAchievementCategory
): Promise<Record<string, number>> {
  switch (category) {
    case "BUILDING": {
      const count = await db.build.count({ where: { userId } });
      return { builder: count };
    }

    case "SOCIAL": {
      // Likes given on builds (not comments)
      const count = await db.like.count({ where: { userId, buildId: { not: null } } });
      return { supporter: count };
    }

    case "POPULARITY": {
      // Total likes received across all builds
      const count = await db.like.count({
        where: {
          build: { userId },
          buildId: { not: null },
        },
      });
      return { rising_star: count };
    }

    case "FORUM": {
      const [threads, comments] = await Promise.all([
        db.thread.count({ where: { userId } }),
        db.comment.count({ where: { userId, flagged: false } }),
      ]);
      return { forum_voice: threads + comments };
    }

    case "LINEAGE": {
      const count = await db.lineage.count({ where: { userId } });
      return { genealogist: count };
    }

    case "COLLECTOR": {
      const [kitCount, reviewCount] = await Promise.all([
        db.userKit.count({ where: { userId } }),
        db.userKit.count({ where: { userId, review: { not: null } } }),
      ]);
      return { collector: kitCount, critic: reviewCount };
    }

    case "COMMUNITY": {
      // Profile completion check: count 1 if user has filled out key fields
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { displayName: true, bio: true, avatar: true, country: true },
      });
      if (!user) return { community_pillar: 0 };
      const filledFields = [user.displayName, user.bio, user.avatar, user.country].filter(Boolean).length;
      return { community_pillar: filledFields >= 3 ? 1 : 0 };
    }

    default:
      return {};
  }
}

// ─── Tier Calculation ─────────────────────────────────────────

function calculateTier(count: number, tiers: number[]): number {
  let tier = 0;
  for (let i = 0; i < tiers.length; i++) {
    if (count >= tiers[i]) {
      tier = i + 1; // 1-based tier
    }
  }
  return tier;
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
      orderBy: { sortOrder: "asc" },
    });

    if (achievements.length === 0) return;

    // 2. Get user's existing UserAchievement records for this category
    const existingRecords = await db.userAchievement.findMany({
      where: {
        userId,
        achievementId: { in: achievements.map((a) => a.id) },
      },
      select: { achievementId: true, tier: true },
    });

    const existingMap = new Map(
      existingRecords.map((r) => [r.achievementId, r.tier])
    );

    // 3. Count metrics for this category
    const metrics = await countMetrics(userId, category);

    // 4. Process each achievement
    let totalNewXp = 0;

    await db.$transaction(async (tx) => {
      for (const achievement of achievements) {
        // Determine metric value for this specific achievement
        const metricValue = metrics[achievement.slug] ?? 0;

        // Calculate new tier
        const newTier = calculateTier(metricValue, achievement.tiers);
        const previousTier = existingMap.get(achievement.id) ?? 0;

        // Upsert UserAchievement — always update progress and tier
        await tx.userAchievement.upsert({
          where: {
            userId_achievementId: {
              userId,
              achievementId: achievement.id,
            },
          },
          create: {
            userId,
            achievementId: achievement.id,
            progress: metricValue,
            tier: newTier,
          },
          update: {
            progress: metricValue,
            tier: newTier,
          },
        });

        // If tier increased, calculate XP for newly earned tiers only
        if (newTier > previousTier) {
          for (let t = previousTier; t < newTier; t++) {
            totalNewXp += achievement.xpPerTier[t] ?? 0;
          }
        }
      }

      // 5. If total new XP > 0, update user xp and level
      if (totalNewXp > 0) {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { xp: true },
        });

        if (user) {
          const newXp = user.xp + totalNewXp;
          const newLevel = calculateLevel(newXp);

          await tx.user.update({
            where: { id: userId },
            data: { xp: newXp, level: newLevel },
          });
        }
      }
    });
  } catch (error) {
    // Silently fail — achievement checking should never break primary actions
    console.error(`[achievements] Error checking ${category} for user ${userId}:`, error);
  }
}
