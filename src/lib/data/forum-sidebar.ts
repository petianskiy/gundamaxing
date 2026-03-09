import { cache } from "react";
import { db } from "@/lib/db";
import type {
  ForumActivePilot,
  ForumLeaderboardEntry,
  ForumRecentActivity,
  ForumStats,
} from "@/lib/types";

// ─── Active Pilots ──────────────────────────────────────────────

export const getActivePilots = cache(async (limit = 5): Promise<ForumActivePilot[]> => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Users who created threads or comments in the last 7 days
  const [threadAuthors, commentAuthors] = await Promise.all([
    db.thread.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: {
        userId: true,
        createdAt: true,
        user: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.comment.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: {
        userId: true,
        createdAt: true,
        user: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Merge and deduplicate by userId, keeping most recent activity
  const userMap = new Map<string, ForumActivePilot>();

  for (const t of threadAuthors) {
    const existing = userMap.get(t.userId);
    if (!existing || new Date(existing.lastActiveAt) < t.createdAt) {
      userMap.set(t.userId, {
        id: t.user.id,
        username: t.user.username,
        displayName: t.user.displayName,
        avatar: t.user.avatar,
        lastActiveAt: t.createdAt.toISOString(),
      });
    }
  }

  for (const c of commentAuthors) {
    const existing = userMap.get(c.userId);
    if (!existing || new Date(existing.lastActiveAt) < c.createdAt) {
      userMap.set(c.userId, {
        id: c.user.id,
        username: c.user.username,
        displayName: c.user.displayName,
        avatar: c.user.avatar,
        lastActiveAt: c.createdAt.toISOString(),
      });
    }
  }

  return Array.from(userMap.values())
    .sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime())
    .slice(0, limit);
});

// ─── Top Contributors (by total build likes) ────────────────────

export const getTopContributors = cache(async (limit = 5): Promise<ForumLeaderboardEntry[]> => {
  const topBuilders = await db.build.groupBy({
    by: ["userId"],
    _sum: { likeCount: true },
    orderBy: { _sum: { likeCount: "desc" } },
    take: limit,
  });

  if (topBuilders.length === 0) return [];

  const users = await db.user.findMany({
    where: { id: { in: topBuilders.map((b) => b.userId) } },
    select: { id: true, username: true, displayName: true, avatar: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return topBuilders
    .map((b) => {
      const user = userMap.get(b.userId);
      if (!user) return null;
      return {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        totalLikes: b._sum.likeCount ?? 0,
      };
    })
    .filter((x): x is ForumLeaderboardEntry => x !== null);
});

// ─── Recent Activity ────────────────────────────────────────────

export const getRecentActivity = cache(async (limit = 8): Promise<ForumRecentActivity[]> => {
  const [recentThreads, recentComments] = await Promise.all([
    db.thread.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        createdAt: true,
        user: { select: { username: true } },
      },
    }),
    db.comment.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        user: { select: { username: true } },
        thread: { select: { title: true } },
      },
    }),
  ]);

  const activities: ForumRecentActivity[] = [
    ...recentThreads.map((t) => ({
      type: "thread" as const,
      id: t.id,
      title: t.title,
      username: t.user.username,
      createdAt: t.createdAt.toISOString(),
    })),
    ...recentComments
      .filter((c) => c.thread !== null)
      .map((c) => ({
        type: "comment" as const,
        id: c.id,
        title: c.thread!.title,
        username: c.user.username,
        createdAt: c.createdAt.toISOString(),
      })),
  ];

  return activities
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
});

// ─── Forum Stats ────────────────────────────────────────────────

export const getForumStats = cache(async (): Promise<ForumStats> => {
  const [totalThreads, totalPosts, totalPilots] = await Promise.all([
    db.thread.count(),
    db.comment.count(),
    db.user.count(),
  ]);

  return { totalThreads, totalPosts, totalPilots };
});
