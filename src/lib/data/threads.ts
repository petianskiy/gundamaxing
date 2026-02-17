import { cache } from "react";
import { db } from "@/lib/db";
import type { Thread } from "@/lib/types";

// ─── Helpers ─────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const threadInclude = {
  user: {
    select: { id: true, username: true, displayName: true, avatar: true },
  },
  category: {
    select: { id: true, name: true },
  },
} as const;

// ─── Transform ───────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toUIThread(t: any): Thread {
  return {
    id: t.id,
    title: t.title,
    content: t.content,
    categoryId: t.categoryId,
    categoryName: t.category?.name ?? "",
    userId: t.userId,
    username: t.user?.displayName ?? t.user?.username ?? "",
    userAvatar: t.user?.avatar ?? "",
    replies: t.replyCount,
    views: t.views,
    isPinned: t.isPinned,
    createdAt: formatDate(t.createdAt),
    lastReplyAt: t.lastReplyAt ? formatDate(t.lastReplyAt) : formatDate(t.createdAt),
  };
}

// ─── Queries ─────────────────────────────────────────────────────

export const getThreads = cache(async (): Promise<Thread[]> => {
  const threads = await db.thread.findMany({
    include: threadInclude,
    orderBy: [{ isPinned: "desc" }, { lastReplyAt: "desc" }, { createdAt: "desc" }],
  });

  return threads.map(toUIThread);
});

export const getThreadById = cache(async (id: string): Promise<Thread | null> => {
  const thread = await db.thread.findUnique({
    where: { id },
    include: threadInclude,
  });

  if (!thread) return null;

  // Increment view count (fire and forget, do not block return)
  db.thread.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {});

  return toUIThread(thread);
});
