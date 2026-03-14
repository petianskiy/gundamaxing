import { cache } from "react";
import { db } from "@/lib/db";
import { toCdnUrl } from "@/lib/upload/cdn";
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
    image: cat.image ? toCdnUrl(cat.image) : null,
    threadCount: cat._count?.threads ?? 0,
    postCount,
    lastActivity,
    childCount: cat._count?.children ?? 0,
  };
}

// ─── Queries ─────────────────────────────────────────────────────

export const getCategories = cache(async (): Promise<ForumCategory[]> => {
  const categories = await db.forumCategory.findMany({
    where: { parentId: null },
    orderBy: { order: "asc" },
    include: {
      _count: { select: { threads: true, children: true } },
      threads: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  // Compute real comment counts per category (including child categories)
  const postCounts = await Promise.all(
    categories.map(async (cat) => {
      // Get IDs of this category and all its children
      const children = await db.forumCategory.findMany({
        where: { parentId: cat.id },
        select: { id: true },
      });
      const categoryIds = [cat.id, ...children.map((c) => c.id)];
      return db.comment.count({ where: { thread: { categoryId: { in: categoryIds } } } });
    })
  );

  return categories.map((cat, i) => toUICategory(cat, postCounts[i]));
});

export const getCategoryById = cache(async (id: string): Promise<(ForumCategory & { children?: ForumCategory[] }) | null> => {
  const cat = await db.forumCategory.findUnique({
    where: { id },
    include: {
      _count: { select: { threads: true, children: true } },
      threads: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
      children: {
        orderBy: { order: "asc" },
        include: {
          _count: { select: { threads: true, children: true } },
          threads: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { createdAt: true },
          },
        },
      },
    },
  });

  if (!cat) return null;

  const postCount = await db.comment.count({
    where: { thread: { categoryId: id } },
  });

  const result = toUICategory(cat, postCount);

  if (cat.children.length > 0) {
    const childPostCounts = await Promise.all(
      cat.children.map((child) =>
        db.comment.count({ where: { thread: { categoryId: child.id } } })
      )
    );
    result.children = cat.children.map((child, i) => toUICategory(child, childPostCounts[i]));
  }

  return result;
});

export const getLeafCategories = cache(async (): Promise<ForumCategory[]> => {
  const categories = await db.forumCategory.findMany({
    where: { children: { none: {} } },
    orderBy: { order: "asc" },
    include: {
      _count: { select: { threads: true, children: true } },
      threads: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  const postCounts = await Promise.all(
    categories.map((cat) =>
      db.comment.count({ where: { thread: { categoryId: cat.id } } })
    )
  );

  return categories.map((cat, i) => toUICategory(cat, postCounts[i]));
});
