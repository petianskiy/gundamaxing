import { db } from "@/lib/db";
import { Prisma, type EventType } from "@prisma/client";

export async function logEvent(
  type: EventType,
  data: {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<void> {
  try {
    await db.eventLog.create({
      data: {
        type,
        userId: data.userId ?? null,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
        metadata: data.metadata
          ? (data.metadata as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });
  } catch (error) {
    // Log but don't throw — event logging should never break the main flow
    console.error("[logEvent] Failed to log event:", type, error);
  }
}
