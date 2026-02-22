import { cache } from "react";
import { db } from "@/lib/db";

export const getSignupTrends = cache(async (days = 30) => {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const results = await db.$queryRaw<{ date: string; count: number }[]>`
    SELECT DATE("createdAt") as date, CAST(COUNT(*) AS INTEGER) as count
    FROM "User"
    WHERE "createdAt" >= ${since}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `;

  return results.map((r) => ({
    date: String(r.date),
    count: Number(r.count),
  }));
});

export const getBuildTrends = cache(async (days = 30) => {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const results = await db.$queryRaw<{ date: string; count: number }[]>`
    SELECT DATE("createdAt") as date, CAST(COUNT(*) AS INTEGER) as count
    FROM "Build"
    WHERE "createdAt" >= ${since}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `;

  return results.map((r) => ({
    date: String(r.date),
    count: Number(r.count),
  }));
});

export const getReportTrends = cache(async (days = 30) => {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const results = await db.$queryRaw<{ date: string; count: number }[]>`
    SELECT DATE("createdAt") as date, CAST(COUNT(*) AS INTEGER) as count
    FROM "Report"
    WHERE "createdAt" >= ${since}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `;

  return results.map((r) => ({
    date: String(r.date),
    count: Number(r.count),
  }));
});

export const getActiveUserCount = cache(async () => {
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const result = await db.$queryRaw<{ count: number }[]>`
    SELECT CAST(COUNT(DISTINCT "userId") AS INTEGER) as count
    FROM "EventLog"
    WHERE type = 'LOGIN_SUCCESS'
      AND "createdAt" >= ${since}
  `;

  return result[0]?.count ?? 0;
});

export const getRoleDistribution = cache(async () => {
  const groups = await db.user.groupBy({
    by: ["role"],
    _count: true,
  });

  return groups.map((g) => ({
    role: g.role,
    count: g._count,
  }));
});

export const getTopStats = cache(async () => {
  const [totalUsers, totalBuilds, totalComments, totalThreads] =
    await Promise.all([
      db.user.count(),
      db.build.count(),
      db.comment.count(),
      db.thread.count(),
    ]);

  return { totalUsers, totalBuilds, totalComments, totalThreads };
});
