import { cache } from "react";
import { db } from "@/lib/db";
import type { ForumCategory } from "@/lib/types";

// ─── Helpers ─────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// ─── Transform ───────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toUICategory(cat: any, postCount: number): ForumCategory {
  const lastThread = cat.threads?.[0];
  const lastActivity = lastThread ? formatDate(lastThread.createdAt) : "\u2014";

  return {
    id: cat.id,
    name: cat.name,
    description: cat.description,
    icon: cat.icon,
    color: cat.color,
    threadCount: cat._count?.threads ?? 0,
    postCount,
    lastActivity,
  };
}

// ─── Queries ─────────────────────────────────────────────────────

export const getCategories = cache(async (): Promise<ForumCategory[]> => {
  const categories = await db.forumCategory.findMany({
    orderBy: { order: "asc" },
    include: {
      _count: { select: { threads: true } },
      threads: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  // Compute real comment counts per category
  const postCounts = await Promise.all(
    categories.map((cat) =>
      db.comment.count({ where: { thread: { categoryId: cat.id } } })
    )
  );

  return categories.map((cat, i) => toUICategory(cat, postCounts[i]));
});

export const getCategoryById = cache(async (id: string): Promise<ForumCategory | null> => {
  const cat = await db.forumCategory.findUnique({
    where: { id },
    include: {
      _count: { select: { threads: true } },
      threads: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  if (!cat) return null;

  const postCount = await db.comment.count({
    where: { thread: { categoryId: id } },
  });

  return toUICategory(cat, postCount);
});
