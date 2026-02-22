"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/data/events";
import { createNotification } from "@/lib/notifications";

/**
 * Helper to determine what kind of content a report targets
 * and get the target ID.
 */
function getReportTarget(report: {
  buildId: string | null;
  commentId: string | null;
  threadId: string | null;
  reportedUserId: string | null;
}): { type: string; id: string } | null {
  if (report.buildId) return { type: "build", id: report.buildId };
  if (report.commentId) return { type: "comment", id: report.commentId };
  if (report.threadId) return { type: "thread", id: report.threadId };
  if (report.reportedUserId) return { type: "user", id: report.reportedUserId };
  return null;
}

export async function resolveReport(
  reportId: string,
  action: "dismiss" | "warn" | "delete" | "ban"
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    // Verify the user is an admin or moderator
    const moderator = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    });

    if (!moderator) {
      return { error: "User not found." };
    }

    if (moderator.role !== "ADMIN" && moderator.role !== "MODERATOR") {
      return { error: "You do not have permission to resolve reports." };
    }

    // Fetch the report
    const report = await db.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return { error: "Report not found." };
    }

    if (report.status !== "PENDING") {
      return { error: "This report has already been resolved." };
    }

    const target = getReportTarget(report);

    // Process based on action
    switch (action) {
      case "dismiss": {
        await db.report.update({
          where: { id: reportId },
          data: {
            status: "DISMISSED",
            resolvedBy: moderator.id,
            resolvedAt: new Date(),
          },
        });
        break;
      }

      case "warn": {
        await db.report.update({
          where: { id: reportId },
          data: {
            status: "RESOLVED",
            resolvedBy: moderator.id,
            resolvedAt: new Date(),
          },
        });

        await logEvent("MODERATION_ACTION", {
          userId: moderator.id,
          metadata: {
            action: "warn",
            reportId,
            targetType: target?.type,
            targetId: target?.id,
          } as Record<string, unknown>,
        });

        // Create notification for warned user
        if (target) {
          let targetUserId: string | null = null;
          if (target.type === "user") {
            targetUserId = target.id;
          } else if (target.type === "build") {
            const build = await db.build.findUnique({ where: { id: target.id }, select: { userId: true } });
            targetUserId = build?.userId ?? null;
          } else if (target.type === "comment") {
            const comment = await db.comment.findUnique({ where: { id: target.id }, select: { userId: true } });
            targetUserId = comment?.userId ?? null;
          } else if (target.type === "thread") {
            const thread = await db.thread.findUnique({ where: { id: target.id }, select: { userId: true } });
            targetUserId = thread?.userId ?? null;
          }
          if (targetUserId) {
            await createNotification({
              userId: targetUserId,
              type: "WARNING",
              title: "You received a warning",
              message: `A moderator issued a warning regarding your ${target.type}: ${report.reason.toLowerCase().replace("_", " ")}.`,
            });
          }
        }
        break;
      }

      case "delete": {
        // Look up content owner before deletion
        let contentOwnerId: string | null = null;
        if (target) {
          if (target.type === "build") {
            const build = await db.build.findUnique({ where: { id: target.id }, select: { userId: true } });
            contentOwnerId = build?.userId ?? null;
          } else if (target.type === "comment") {
            const comment = await db.comment.findUnique({ where: { id: target.id }, select: { userId: true } });
            contentOwnerId = comment?.userId ?? null;
          } else if (target.type === "thread") {
            const thread = await db.thread.findUnique({ where: { id: target.id }, select: { userId: true } });
            contentOwnerId = thread?.userId ?? null;
          }
        }

        // Delete the target content based on type
        if (target) {
          switch (target.type) {
            case "build":
              await db.build.delete({ where: { id: target.id } });
              break;
            case "comment":
              await db.comment.delete({ where: { id: target.id } });
              break;
            case "thread":
              await db.thread.delete({ where: { id: target.id } });
              break;
          }
        }

        await db.report.update({
          where: { id: reportId },
          data: {
            status: "RESOLVED",
            resolvedBy: moderator.id,
            resolvedAt: new Date(),
          },
        });

        await logEvent("MODERATION_ACTION", {
          userId: moderator.id,
          metadata: {
            action: "delete",
            reportId,
            targetType: target?.type,
            targetId: target?.id,
          } as Record<string, unknown>,
        });

        if (contentOwnerId) {
          await createNotification({
            userId: contentOwnerId,
            type: "CONTENT_DELETED",
            title: "Your content was removed",
            message: `A moderator removed your ${target?.type || "content"} for violating community guidelines: ${report.reason.toLowerCase().replace("_", " ")}.`,
          });
        }
        break;
      }

      case "ban": {
        // Ban the user who created the reported content
        let targetUserId: string | null = null;

        if (target) {
          if (target.type === "user") {
            targetUserId = target.id;
          } else if (target.type === "build") {
            const build = await db.build.findUnique({
              where: { id: target.id },
              select: { userId: true },
            });
            targetUserId = build?.userId ?? null;
          } else if (target.type === "comment") {
            const comment = await db.comment.findUnique({
              where: { id: target.id },
              select: { userId: true },
            });
            targetUserId = comment?.userId ?? null;
          } else if (target.type === "thread") {
            const thread = await db.thread.findUnique({
              where: { id: target.id },
              select: { userId: true },
            });
            targetUserId = thread?.userId ?? null;
          }
        }

        if (!targetUserId) {
          return { error: "Could not identify the user to ban." };
        }

        // Set the target user's role to USER and flag them
        // (Role enum doesn't include BANNED — use riskScore + session deletion)
        await db.user.update({
          where: { id: targetUserId },
          data: {
            riskScore: 100,
            banReason: `Violation: ${report.reason.toLowerCase().replace("_", " ")}. ${report.description || ""}`.trim(),
            bannedAt: new Date(),
            bannedBy: moderator.id,
          },
        });

        await createNotification({
          userId: targetUserId,
          type: "BAN",
          title: "Account suspended",
          message: `Your account has been suspended: ${report.reason.toLowerCase().replace("_", " ")}. ${report.description || ""}`.trim(),
        });

        // Delete all their sessions to force logout
        await db.session.deleteMany({
          where: { userId: targetUserId },
        });

        await db.report.update({
          where: { id: reportId },
          data: {
            status: "RESOLVED",
            resolvedBy: moderator.id,
            resolvedAt: new Date(),
          },
        });

        // Create moderation action record
        await db.moderationAction.create({
          data: {
            type: "BAN",
            moderatorId: moderator.id,
            targetUserId,
            reason: `Report #${reportId}`,
          },
        });

        await logEvent("MODERATION_ACTION", {
          userId: moderator.id,
          metadata: {
            action: "ban",
            reportId,
            targetUserId,
            targetType: target?.type,
            targetContentId: target?.id,
          } as Record<string, unknown>,
        });
        break;
      }

      default:
        return { error: "Invalid action." };
    }

    return { success: true };
  } catch (error) {
    console.error("resolveReport error:", error);
    return { error: "An unexpected error occurred." };
  }
}
