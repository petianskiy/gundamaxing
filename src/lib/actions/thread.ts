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
import { containsProfanity } from "@/lib/security/profanity";

const threadSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(50000),
  categoryId: z.string().min(1),
});

function getThreadRateLimit(accountCreatedAt: Date): {
  limit: number;
  window: number;
} {
  const accountAge = Date.now() - accountCreatedAt.getTime();
  const oneDay = 86400000;

  if (accountAge < oneDay) {
    return { limit: 0, window: oneDay };
  }
  if (accountAge < 7 * oneDay) {
    return { limit: 1, window: oneDay };
  }
  if (accountAge < 30 * oneDay) {
    return { limit: 5, window: oneDay };
  }
  return { limit: 20, window: oneDay };
}

export async function createThread(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in to create a thread." };
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
      return { error: "You must verify your email before creating threads." };
    }

    // Honeypot validation - silently reject bots
    if (!validateHoneypot(formData)) {
      return { success: true, threadId: "ok" };
    }

    // Timing validation
    if (!validateTiming(formData, 3)) {
      return { error: "Please take more time before submitting." };
    }

    // Rate limit check based on account age
    const { limit, window } = getThreadRateLimit(user.createdAt);
    if (limit === 0) {
      return {
        error:
          "Your account is too new to create threads. Please wait 24 hours after registration.",
      };
    }

    const rateLimitResult = await checkRateLimit(
      `thread:${user.id}`,
      limit,
      window
    );
    if (!rateLimitResult.success) {
      return {
        error: `Rate limit exceeded. You can create ${limit} threads per day. Try again later.`,
      };
    }

    // Parse and validate input
    const raw = {
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      categoryId: formData.get("categoryId") as string,
    };

    const parsed = threadSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: "Invalid thread data." };
    }

    const { title, content, categoryId } = parsed.data;

    if (containsProfanity(title)) {
      return { error: "Thread title contains inappropriate language." };
    }
    if (containsProfanity(content)) {
      return { error: "Thread content contains inappropriate language." };
    }

    // Reputation gating: block links for new low-rep users
    const accountAge = Date.now() - user.createdAt.getTime();
    const thirtyDays = 30 * 86400000;
    if (accountAge < thirtyDays && (user.reputation ?? 0) < 50) {
      const linkPattern = /https?:\/\/|www\./i;
      if (linkPattern.test(content) || linkPattern.test(title)) {
        return {
          error:
            "Your account is too new to post links. Build up reputation first.",
        };
      }
    }

    // Spam heuristics check
    const spamResult = await checkSpamContent(`${title} ${content}`, user.id);

    // Get IP address from headers
    const headersList = await headers();
    const ipAddress = getClientIp(headersList);

    // Create thread record
    const thread = await db.thread.create({
      data: {
        title,
        content,
        categoryId,
        userId: user.id,
      },
    });

    // Increment category thread count
    await db.forumCategory.update({
      where: { id: categoryId },
      data: { threadCount: { increment: 1 } },
    });

    // Log event if flagged
    if (spamResult.score > 0.7) {
      await logEvent("CONTENT_FLAGGED", {
        userId: user.id,
        ipAddress: ipAddress ?? undefined,
        metadata: {
          threadId: thread.id,
          categoryId,
          spamScore: spamResult.score,
          reasons: spamResult.reasons,
        } as Record<string, unknown>,
      });
    }

    return { success: true, threadId: thread.id };
  } catch (error) {
    console.error("createThread error:", error);
    return { error: "An unexpected error occurred." };
  }
}
