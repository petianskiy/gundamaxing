import { cache } from "react";
import { db } from "@/lib/db";

export const getPendingReports = cache(async (page = 1, pageSize = 20) => {
  const [reports, total] = await db.$transaction([
    db.report.findMany({
      where: { status: "PENDING" },
      include: {
        reporter: { select: { id: true, username: true, avatar: true } },
        reportedUser: { select: { id: true, username: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.report.count({ where: { status: "PENDING" } }),
  ]);

  return { reports, total, page, totalPages: Math.ceil(total / pageSize) };
});

export const getEventLogs = cache(async (
  filters: { type?: string; userId?: string; ip?: string } = {},
  page = 1,
  pageSize = 50
) => {
  const where: any = {};
  if (filters.type) where.type = filters.type;
  if (filters.userId) where.userId = filters.userId;
  if (filters.ip) where.ipAddress = filters.ip;

  const [events, total] = await db.$transaction([
    db.eventLog.findMany({
      where,
      include: {
        user: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.eventLog.count({ where }),
  ]);

  return { events, total, page, totalPages: Math.ceil(total / pageSize) };
});

export const getAdminStats = cache(async () => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [totalUsers, newToday, pendingReports, captchaPassed, captchaFailed] = await db.$transaction([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: todayStart } } }),
    db.report.count({ where: { status: "PENDING" } }),
    db.eventLog.count({ where: { type: "CAPTCHA_PASSED", createdAt: { gte: oneDayAgo } } }),
    db.eventLog.count({ where: { type: "CAPTCHA_FAILED", createdAt: { gte: oneDayAgo } } }),
  ]);

  const captchaTotal = captchaPassed + captchaFailed;
  const captchaPassRate = captchaTotal > 0 ? Math.round((captchaPassed / captchaTotal) * 100) : 100;

  return { totalUsers, newToday, pendingReports, captchaPassRate };
});
