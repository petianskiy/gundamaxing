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

export type ThreadSort = "newest" | "most-replies" | "most-views";

function getOrderBy(sort: ThreadSort) {
  switch (sort) {
    case "most-replies":
      return [{ isPinned: "desc" as const }, { replyCount: "desc" as const }, { createdAt: "desc" as const }];
    case "most-views":
      return [{ isPinned: "desc" as const }, { views: "desc" as const }, { createdAt: "desc" as const }];
    case "newest":
    default:
      return [{ isPinned: "desc" as const }, { lastReplyAt: "desc" as const }, { createdAt: "desc" as const }];
  }
}

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
    username: t.user?.displayName || t.user?.username || "",
    userHandle: t.user?.username || "",
    userAvatar: t.user?.avatar ?? "",
    replies: t.replyCount,
    views: t.views,
    isPinned: t.isPinned,
    isLocked: t.isLocked,
    createdAt: formatDate(t.createdAt),
    lastReplyAt: t.lastReplyAt ? formatDate(t.lastReplyAt) : formatDate(t.createdAt),
  };
}

// ─── Queries ─────────────────────────────────────────────────────

export const getThreads = cache(async (
  page: number = 1,
  limit: number = 20,
  sort: ThreadSort = "newest",
): Promise<Thread[]> => {
  const threads = await db.thread.findMany({
    include: threadInclude,
    orderBy: getOrderBy(sort),
    skip: (page - 1) * limit,
    take: limit,
  });

  return threads.map(toUIThread);
});

export const getThreadCount = cache(async (): Promise<number> => {
  return db.thread.count();
});

export const getThreadsByCategory = cache(async (
  categoryId: string,
  page: number = 1,
  limit: number = 20,
  sort: ThreadSort = "newest",
): Promise<Thread[]> => {
  const threads = await db.thread.findMany({
    where: { categoryId },
    include: threadInclude,
    orderBy: getOrderBy(sort),
    skip: (page - 1) * limit,
    take: limit,
  });

  return threads.map(toUIThread);
});

export const getThreadCountByCategory = cache(async (categoryId: string): Promise<number> => {
  return db.thread.count({ where: { categoryId } });
});

export const searchThreads = cache(async (
  query: string,
  page: number = 1,
  limit: number = 20,
): Promise<Thread[]> => {
  const threads = await db.thread.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
      ],
    },
    include: threadInclude,
    orderBy: [{ createdAt: "desc" }],
    skip: (page - 1) * limit,
    take: limit,
  });

  return threads.map(toUIThread);
});

export const searchThreadCount = cache(async (query: string): Promise<number> => {
  return db.thread.count({
    where: {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
      ],
    },
  });
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
