import { cache } from "react";
import { db } from "@/lib/db";
import type {
  ForumActivePilot,
  ForumLeaderboardEntry,
  ForumRecentActivity,
  MonthlyMissionUI,
} from "@/lib/types";

// ─── Active Pilots ──────────────────────────────────────────────

export const getActivePilots = cache(async (limit = 5): Promise<ForumActivePilot[]> => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const users = await db.user.findMany({
    where: { lastActiveAt: { gte: fiveMinutesAgo } },
    select: { id: true, username: true, displayName: true, avatar: true, lastActiveAt: true },
    orderBy: { lastActiveAt: "desc" },
    take: limit,
  });

  return users.map((u) => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatar: u.avatar,
    lastActiveAt: u.lastActiveAt!.toISOString(),
  }));
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

// ─── Active Mission ─────────────────────────────────────────────

export const getActiveMission = cache(async (): Promise<MonthlyMissionUI | null> => {
  const mission = await db.monthlyMission.findFirst({
    where: { isActive: true },
    include: {
      _count: { select: { submissions: true } },
      winner: {
        include: { user: { select: { username: true } } },
      },
    },
  });

  if (!mission) return null;

  return {
    id: mission.id,
    title: mission.title,
    description: mission.description,
    rules: mission.rules,
    prizes: mission.prizes,
    startDate: mission.startDate.toISOString(),
    endDate: mission.endDate.toISOString(),
    isActive: mission.isActive,
    submissionCount: mission._count.submissions,
    winnerId: mission.winnerId,
    winnerUsername: mission.winner?.user.username ?? null,
    winnerSubmissionTitle: mission.winner?.title ?? null,
  };
});
