import { cache } from "react";
import { db } from "@/lib/db";
import { toCdnUrl } from "@/lib/upload/r2";
import type { BuildStatus, Prisma } from "@prisma/client";

interface AdminBuildParams {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

interface AdminCommentParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

interface AdminThreadParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export const getAdminBuilds = cache(
  async ({ search, status, page = 1, pageSize = 20 }: AdminBuildParams) => {
    const where: Prisma.BuildWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { kitName: { contains: search, mode: "insensitive" } },
        { user: { username: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status && status !== "ALL") {
      where.status = status as BuildStatus;
    }

    const builds = await db.build.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { url: true, alt: true },
        },
        _count: { select: { comments: true, likes: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return builds.map((b) => ({
      ...b,
      user: { ...b.user, avatar: b.user.avatar ? toCdnUrl(b.user.avatar) : b.user.avatar },
      images: b.images.map((img) => ({ ...img, url: toCdnUrl(img.url) })),
    }));
  }
);

export const getTotalBuildCount = cache(
  async ({ search, status }: AdminBuildParams) => {
    const where: Prisma.BuildWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { kitName: { contains: search, mode: "insensitive" } },
        { user: { username: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status && status !== "ALL") {
      where.status = status as BuildStatus;
    }

    return db.build.count({ where });
  }
);

export const getAdminComments = cache(
  async ({ search, page = 1, pageSize = 20 }: AdminCommentParams) => {
    const where: Prisma.CommentWhereInput = {};

    if (search) {
      where.OR = [
        { content: { contains: search, mode: "insensitive" } },
        { user: { username: { contains: search, mode: "insensitive" } } },
      ];
    }

    const comments = await db.comment.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        build: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return comments.map((c) => ({
      ...c,
      user: { ...c.user, avatar: c.user.avatar ? toCdnUrl(c.user.avatar) : c.user.avatar },
    }));
  }
);

export const getTotalCommentCount = cache(
  async ({ search }: AdminCommentParams) => {
    const where: Prisma.CommentWhereInput = {};

    if (search) {
      where.OR = [
        { content: { contains: search, mode: "insensitive" } },
        { user: { username: { contains: search, mode: "insensitive" } } },
      ];
    }

    return db.comment.count({ where });
  }
);

export const getAdminThreads = cache(
  async ({ search, page = 1, pageSize = 20 }: AdminThreadParams) => {
    const where: Prisma.ThreadWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { user: { username: { contains: search, mode: "insensitive" } } },
      ];
    }

    const threads = await db.thread.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        category: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return threads.map((t) => ({
      ...t,
      user: { ...t.user, avatar: t.user.avatar ? toCdnUrl(t.user.avatar) : t.user.avatar },
    }));
  }
);

export const getTotalThreadCount = cache(
  async ({ search }: AdminThreadParams) => {
    const where: Prisma.ThreadWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { user: { username: { contains: search, mode: "insensitive" } } },
      ];
    }

    return db.thread.count({ where });
  }
);

export const getDeletionHistory = cache(
  async ({ page = 1, pageSize = 20 }: { page: number; pageSize: number }) => {
    return db.moderationAction.findMany({
      where: { type: "DELETE_CONTENT" },
      include: { moderator: { select: { username: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }
);

export const getDeletionHistoryCount = cache(async () => {
  return db.moderationAction.count({ where: { type: "DELETE_CONTENT" } });
});
