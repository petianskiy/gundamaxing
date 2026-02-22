import { cache } from "react";
import { db } from "@/lib/db";
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

    return builds;
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

    return comments;
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

    return threads;
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
