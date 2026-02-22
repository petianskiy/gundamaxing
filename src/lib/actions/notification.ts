"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getMyUnreadCount() {
  const session = await auth();
  if (!session?.user?.id) return 0;
  return db.notification.count({
    where: { userId: session.user.id, read: false },
  });
}

export async function markNotificationRead(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };

  await db.notification.updateMany({
    where: { id: notificationId, userId: session.user.id },
    data: { read: true },
  });

  return { success: true };
}

export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };

  await db.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });

  return { success: true };
}
