import { cache } from "react";
import { db } from "@/lib/db";
import type { Comment } from "@/lib/types";

// ─── Helpers ─────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// Nested include for 3 levels of comment children
const commentInclude = {
  user: {
    select: { id: true, username: true, displayName: true, avatar: true },
  },
  children: {
    include: {
      user: {
        select: { id: true, username: true, displayName: true, avatar: true },
      },
      children: {
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatar: true },
          },
        },
        orderBy: { createdAt: "asc" as const },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

// ─── Transform ───────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toUIComment(c: any): Comment {
  return {
    id: c.id,
    content: c.content,
    userId: c.userId,
    username: c.user?.displayName || c.user?.username || "",
    userHandle: c.user?.username || "",
    userAvatar: c.user?.avatar ?? "",
    likes: c.likeCount,
    createdAt: formatDate(c.createdAt),
    children: (c.children ?? []).map(toUIComment),
  };
}

// ─── Queries ─────────────────────────────────────────────────────

export const getCommentsByBuildId = cache(async (buildId: string): Promise<Comment[]> => {
  const comments = await db.comment.findMany({
    where: { buildId, parentId: null },
    include: commentInclude,
    orderBy: { createdAt: "asc" },
  });

  return comments.map(toUIComment);
});

export const getCommentsByThreadId = cache(async (threadId: string): Promise<Comment[]> => {
  const comments = await db.comment.findMany({
    where: { threadId, parentId: null },
    include: commentInclude,
    orderBy: { createdAt: "asc" },
  });

  return comments.map(toUIComment);
});
