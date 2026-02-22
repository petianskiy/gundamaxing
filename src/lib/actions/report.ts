"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { logEvent } from "@/lib/data/events";

const reportSchema = z.object({
  reason: z.enum([
    "SPAM",
    "HARASSMENT",
    "INAPPROPRIATE",
    "MISINFORMATION",
    "OTHER",
  ]),
  description: z.string().max(2000).optional(),
  targetType: z.enum(["build", "comment", "thread", "user"]),
  targetId: z.string().min(1),
});

export async function submitReport(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in to submit a report." };
    }

    const raw = {
      reason: formData.get("reason") as string,
      description: (formData.get("description") as string) || undefined,
      targetType: formData.get("targetType") as string,
      targetId: formData.get("targetId") as string,
    };

    const parsed = reportSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: "Invalid report data." };
    }

    const { reason, description, targetType, targetId } = parsed.data;

    // Self-report prevention
    let ownerId: string | null = null;
    switch (targetType) {
      case "build": {
        const build = await db.build.findUnique({ where: { id: targetId }, select: { userId: true } });
        ownerId = build?.userId ?? null;
        break;
      }
      case "comment": {
        const comment = await db.comment.findUnique({ where: { id: targetId }, select: { userId: true } });
        ownerId = comment?.userId ?? null;
        break;
      }
      case "thread": {
        const thread = await db.thread.findUnique({ where: { id: targetId }, select: { userId: true } });
        ownerId = thread?.userId ?? null;
        break;
      }
      case "user":
        ownerId = targetId;
        break;
    }
    if (ownerId === session.user.id) {
      return { error: "You cannot report your own content." };
    }

    // Duplicate report prevention
    const targetField = targetType === "user" ? "reportedUserId" : `${targetType}Id`;
    const existing = await db.report.findFirst({
      where: {
        reporterId: session.user.id,
        [targetField]: targetId,
        status: { in: ["PENDING", "REVIEWING"] },
      },
    });
    if (existing) {
      return { error: "You have already reported this content." };
    }

    // Map targetType + targetId to the correct Report fields
    const reportData: {
      reason: typeof reason;
      description: string | null;
      reporterId: string;
      buildId?: string;
      commentId?: string;
      threadId?: string;
      reportedUserId?: string;
    } = {
      reason,
      description: description ?? null,
      reporterId: session.user.id,
    };

    switch (targetType) {
      case "build":
        reportData.buildId = targetId;
        break;
      case "comment":
        reportData.commentId = targetId;
        break;
      case "thread":
        reportData.threadId = targetId;
        break;
      case "user":
        reportData.reportedUserId = targetId;
        break;
    }

    const report = await db.report.create({
      data: reportData,
    });

    // Log event
    await logEvent("REPORT_CREATED", {
      userId: session.user.id,
      metadata: {
        reportId: report.id,
        reason,
        targetType,
        targetId,
      } as Record<string, unknown>,
    });

    return { success: true };
  } catch (error) {
    console.error("submitReport error:", error);
    return { error: "An unexpected error occurred." };
  }
}
