import { cache } from "react";
import { db } from "@/lib/db";

export const getUserLikeForBuild = cache(
  async (userId: string, buildId: string): Promise<boolean> => {
    const like = await db.like.findFirst({
      where: { userId, buildId },
      select: { id: true },
    });
    return !!like;
  }
);

export const getUserBookmarkForBuild = cache(
  async (userId: string, buildId: string): Promise<boolean> => {
    const bookmark = await db.bookmark.findFirst({
      where: { userId, buildId },
      select: { id: true },
    });
    return !!bookmark;
  }
);

export const getUserLikedBuildIds = cache(
  async (userId: string): Promise<Set<string>> => {
    const likes = await db.like.findMany({
      where: { userId, buildId: { not: null } },
      select: { buildId: true },
    });
    return new Set(likes.map((l) => l.buildId).filter((id): id is string => id !== null));
  }
);

export const getUserBookmarkedBuildIds = cache(
  async (userId: string): Promise<Set<string>> => {
    const bookmarks = await db.bookmark.findMany({
      where: { userId },
      select: { buildId: true },
    });
    return new Set(bookmarks.map((b) => b.buildId).filter((id): id is string => id !== null));
  }
);

export const getUserCommentLikes = cache(
  async (userId: string, buildId: string): Promise<string[]> => {
    const likes = await db.like.findMany({
      where: {
        userId,
        comment: { buildId },
      },
      select: { commentId: true },
    });
    return likes.map((l) => l.commentId).filter((id): id is string => id !== null);
  }
);
