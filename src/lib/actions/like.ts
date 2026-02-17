"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function toggleLike(buildId?: string, commentId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const userId = session.user.id;

    if (!buildId && !commentId) {
      return { error: "A buildId or commentId is required." };
    }

    // Check if the like already exists
    const existingLike = await db.like.findFirst({
      where: {
        userId,
        buildId: buildId ?? null,
        commentId: commentId ?? null,
      },
    });

    if (existingLike) {
      // Unlike: delete the like and decrement counter atomically
      await db.$transaction(async (tx) => {
        await tx.like.delete({
          where: { id: existingLike.id },
        });

        if (buildId) {
          await tx.build.update({
            where: { id: buildId },
            data: { likeCount: { decrement: 1 } },
          });
        }

        if (commentId) {
          await tx.comment.update({
            where: { id: commentId },
            data: { likeCount: { decrement: 1 } },
          });
        }
      });

      return { liked: false };
    } else {
      // Like: create the like and increment counter atomically
      await db.$transaction(async (tx) => {
        await tx.like.create({
          data: {
            userId,
            buildId: buildId ?? null,
            commentId: commentId ?? null,
          },
        });

        if (buildId) {
          await tx.build.update({
            where: { id: buildId },
            data: { likeCount: { increment: 1 } },
          });
        }

        if (commentId) {
          await tx.comment.update({
            where: { id: commentId },
            data: { likeCount: { increment: 1 } },
          });
        }
      });

      return { liked: true };
    }
  } catch (error) {
    console.error("toggleLike error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function toggleBookmark(buildId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const userId = session.user.id;

    // Check if the bookmark already exists
    const existingBookmark = await db.bookmark.findFirst({
      where: {
        userId,
        buildId,
      },
    });

    if (existingBookmark) {
      // Remove bookmark and decrement counter atomically
      await db.$transaction(async (tx) => {
        await tx.bookmark.delete({
          where: { id: existingBookmark.id },
        });

        await tx.build.update({
          where: { id: buildId },
          data: { bookmarkCount: { decrement: 1 } },
        });
      });

      return { bookmarked: false };
    } else {
      // Create bookmark and increment counter atomically
      await db.$transaction(async (tx) => {
        await tx.bookmark.create({
          data: {
            userId,
            buildId,
          },
        });

        await tx.build.update({
          where: { id: buildId },
          data: { bookmarkCount: { increment: 1 } },
        });
      });

      return { bookmarked: true };
    }
  } catch (error) {
    console.error("toggleBookmark error:", error);
    return { error: "An unexpected error occurred." };
  }
}
