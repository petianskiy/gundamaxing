import { cache } from "react";
import { db } from "@/lib/db";

export const getUnreadNotificationCount = cache(async (userId: string) => {
  return db.notification.count({
    where: { userId, read: false },
  });
});

export const getNotifications = cache(async (userId: string, limit = 20) => {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
});
