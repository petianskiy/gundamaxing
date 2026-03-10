import { db } from "@/lib/db";

// ─── Categories ──────────────────────────────────────────────────

export async function getAdminCategories() {
  return db.forumCategory.findMany({
    where: { parentId: null },
    orderBy: { order: "asc" },
    include: {
      _count: { select: { threads: true, children: true } },
      children: {
        orderBy: { order: "asc" },
        include: {
          _count: { select: { threads: true, children: true } },
        },
      },
    },
  });
}

export async function getAdminCategoryById(id: string) {
  return db.forumCategory.findUnique({
    where: { id },
    include: {
      _count: { select: { threads: true, children: true } },
      parent: { select: { id: true, name: true } },
      children: {
        orderBy: { order: "asc" },
        include: {
          _count: { select: { threads: true, children: true } },
        },
      },
    },
  });
}

// ─── Threads (for moderation) ────────────────────────────────────

export async function getAdminForumThreads({
  search,
  categoryId,
  page,
  pageSize,
}: {
  search: string;
  categoryId: string;
  page: number;
  pageSize: number;
}) {
  const where = {
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { user: { username: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
    ...(categoryId ? { categoryId } : {}),
  };

  const [threads, total] = await Promise.all([
    db.thread.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { username: true } },
        category: { select: { name: true, color: true } },
      },
    }),
    db.thread.count({ where }),
  ]);

  return { threads, total };
}

// ─── Stats ───────────────────────────────────────────────────────

export async function getForumStats() {
  const [totalCategories, totalThreads, totalComments, threadsToday] = await Promise.all([
    db.forumCategory.count(),
    db.thread.count(),
    db.comment.count({ where: { threadId: { not: null } } }),
    db.thread.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ]);

  return { totalCategories, totalThreads, totalComments, threadsToday };
}
