import { cache } from "react";
import { db } from "@/lib/db";

export const getUserBadges = cache(async (userId: string) => {
  const userBadges = await db.userBadge.findMany({
    where: { userId },
    include: {
      badge: true,
    },
    orderBy: { awardedAt: "desc" },
  });

  return userBadges.map((ub) => ({
    id: ub.badge.id,
    name: ub.badge.name,
    icon: ub.badge.icon,
    description: ub.badge.description,
    tier: ub.badge.tier.toLowerCase() as "bronze" | "silver" | "gold" | "platinum",
    awardedAt: ub.awardedAt.toLocaleDateString(),
  }));
});

export const getAllBadges = cache(async () => {
  return db.badge.findMany({
    orderBy: [{ tier: "asc" }, { name: "asc" }],
  });
});

export async function checkAndAwardBadges(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      _count: { select: { builds: true, comments: true, likes: true } },
      badges: { select: { badgeId: true } },
    },
  });

  if (!user) return;

  const existingBadgeIds = new Set(user.badges.map((b) => b.badgeId));

  const badges = await db.badge.findMany();

  for (const badge of badges) {
    if (existingBadgeIds.has(badge.id)) continue;

    const criteria = badge.criteria as Record<string, number> | null;
    if (!criteria) continue;

    let earned = true;

    if (criteria.minBuilds && user._count.builds < criteria.minBuilds) earned = false;
    if (criteria.minComments && user._count.comments < criteria.minComments) earned = false;
    if (criteria.minLikes && user._count.likes < criteria.minLikes) earned = false;
    if (criteria.minReputation && user.reputation < criteria.minReputation) earned = false;

    if (earned) {
      await db.userBadge.create({
        data: { userId, badgeId: badge.id },
      });
    }
  }
}
