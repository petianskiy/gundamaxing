"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { validateHoneypot } from "@/lib/security/honeypot";
import { validateTiming } from "@/lib/security/timing";
import { checkSpamContent } from "@/lib/security/spam-heuristics";
import { logEvent } from "@/lib/data/events";
import { getClientIp } from "@/lib/security/ip-utils";

const commentSchema = z.object({
  content: z.string().min(1).max(10000),
  buildId: z.string().optional(),
  threadId: z.string().optional(),
  parentId: z.string().optional(),
});

function getCommentRateLimit(accountCreatedAt: Date): {
  limit: number;
  window: number;
} {
  const accountAge = Date.now() - accountCreatedAt.getTime();
  const oneDay = 86400000;

  if (accountAge < oneDay) {
    return { limit: 3, window: oneDay };
  }
  if (accountAge < 7 * oneDay) {
    return { limit: 10, window: oneDay };
  }
  if (accountAge < 30 * oneDay) {
    return { limit: 30, window: oneDay };
  }
  return { limit: 60, window: oneDay };
}

export async function createComment(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in to comment." };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        emailVerified: true,
        createdAt: true,
        reputation: true,
      },
    });

    if (!user) {
      return { error: "User not found." };
    }

    if (!user.emailVerified) {
      return { error: "You must verify your email before commenting." };
    }

    // Honeypot validation - silently reject bots
    if (!validateHoneypot(formData)) {
      // Silently pretend success to confuse bots
      return { success: true, commentId: "ok" };
    }

    // Timing validation
    if (!validateTiming(formData, 3)) {
      return { error: "Please take more time before submitting." };
    }

    // Rate limit check based on account age
    const { limit, window } = getCommentRateLimit(user.createdAt);
    const rateLimitResult = await checkRateLimit(
      `comment:${user.id}`,
      limit,
      window
    );
    if (!rateLimitResult.success) {
      return {
        error: `Rate limit exceeded. You can post ${limit} comments per day. Try again later.`,
      };
    }

    // Parse and validate input
    const raw = {
      content: formData.get("content") as string,
      buildId: (formData.get("buildId") as string) || undefined,
      threadId: (formData.get("threadId") as string) || undefined,
      parentId: (formData.get("parentId") as string) || undefined,
    };

    const parsed = commentSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: "Invalid comment data." };
    }

    const { content, buildId, threadId, parentId } = parsed.data;

    // Reputation gating: block links for new low-rep users
    const accountAge = Date.now() - user.createdAt.getTime();
    const thirtyDays = 30 * 86400000;
    if (accountAge < thirtyDays && (user.reputation ?? 0) < 50) {
      const linkPattern = /https?:\/\/|www\./i;
      if (linkPattern.test(content)) {
        return {
          error:
            "Your account is too new to post links. Build up reputation first.",
        };
      }
    }

    // Spam heuristics check
    const spamResult = await checkSpamContent(content, user.id);

    // Get IP address from headers
    const headersList = await headers();
    const ipAddress = getClientIp(headersList);

    // Create comment record
    const comment = await db.comment.create({
      data: {
        content,
        buildId: buildId ?? null,
        threadId: threadId ?? null,
        parentId: parentId ?? null,
        userId: user.id,
        ipAddress,
        flagged: spamResult.score > 0.7,
      },
    });

    // Update counters
    if (buildId) {
      await db.build.update({
        where: { id: buildId },
        data: { commentCount: { increment: 1 } },
      });
    }

    if (threadId) {
      await db.thread.update({
        where: { id: threadId },
        data: { replyCount: { increment: 1 } },
      });
    }

    // Log event
    await logEvent("CONTENT_FLAGGED", {
      userId: user.id,
      ipAddress: ipAddress ?? undefined,
      metadata: {
        commentId: comment.id,
        buildId,
        threadId,
        parentId,
        flagged: spamResult.score > 0.7,
        spamScore: spamResult.score,
      } as Record<string, unknown>,
    });

    return { success: true, commentId: comment.id };
  } catch (error) {
    console.error("createComment error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function deleteComment(commentId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const comment = await db.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        userId: true,
        buildId: true,
        threadId: true,
      },
    });

    if (!comment) {
      return { error: "Comment not found." };
    }

    // Check if user is the owner or a moderator/admin
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    });

    if (!user) {
      return { error: "User not found." };
    }

    const isOwner = comment.userId === user.id;
    const isModerator = user.role === "MODERATOR" || user.role === "ADMIN";

    if (!isOwner && !isModerator) {
      return { error: "You do not have permission to delete this comment." };
    }

    // Delete comment
    await db.comment.delete({
      where: { id: commentId },
    });

    // Update counters
    if (comment.buildId) {
      await db.build.update({
        where: { id: comment.buildId },
        data: { commentCount: { decrement: 1 } },
      });
    }

    if (comment.threadId) {
      await db.thread.update({
        where: { id: comment.threadId },
        data: { replyCount: { decrement: 1 } },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("deleteComment error:", error);
    return { error: "An unexpected error occurred." };
  }
}
