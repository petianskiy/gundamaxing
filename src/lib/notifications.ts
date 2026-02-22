import { db } from "@/lib/db";
import type { NotificationType } from "@prisma/client";

export async function createNotification({
  userId,
  type,
  title,
  message,
  actionUrl,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
}) {
  return db.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      actionUrl: actionUrl ?? null,
    },
  });
}
