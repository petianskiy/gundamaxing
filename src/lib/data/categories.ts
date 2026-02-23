import { cache } from "react";
import { db } from "@/lib/db";
import type { ForumCategory } from "@/lib/types";

// ─── Helpers ─────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// ─── Transform ───────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toUICategory(cat: any): ForumCategory {
  // Derive lastActivity from the most recent thread in this category
  const lastThread = cat.threads?.[0];
  const lastActivity = lastThread ? formatDate(lastThread.createdAt) : "\u2014";

  return {
    id: cat.id,
    name: cat.name,
    description: cat.description,
    icon: cat.icon,
    color: cat.color,
    threadCount: cat.threadCount,
    postCount: cat.postCount,
    lastActivity,
  };
}

// ─── Queries ─────────────────────────────────────────────────────

export const getCategories = cache(async (): Promise<ForumCategory[]> => {
  const categories = await db.forumCategory.findMany({
    orderBy: { order: "asc" },
    include: {
      threads: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  return categories.map(toUICategory);
});

export const getCategoryById = cache(async (id: string): Promise<ForumCategory | null> => {
  const cat = await db.forumCategory.findUnique({
    where: { id },
    include: {
      threads: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  if (!cat) return null;
  return toUICategory(cat);
});
