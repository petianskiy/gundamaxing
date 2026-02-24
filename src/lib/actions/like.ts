"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { checkAndAwardAchievements } from "@/lib/achievements";

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

      if (buildId) {
        revalidatePath("/builds");
        revalidatePath(`/builds/${buildId}`);
      }

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

      // Send notification for build likes (fire-and-forget)
      if (buildId) {
        try {
          const build = await db.build.findUnique({
            where: { id: buildId },
            select: { userId: true, title: true, slug: true },
          });

          if (build && build.userId !== userId) {
            createNotification({
              userId: build.userId,
              type: "LIKE",
              title: "New like",
              message: `${session.user.username ?? "Someone"} liked your build "${build.title}"`,
              actionUrl: `/builds/${build.slug}`,
            }).catch(() => {});
            // Fire-and-forget achievement check for likes received
            checkAndAwardAchievements(build.userId, "POPULARITY").catch(() => {});
          }
        } catch {
          // Don't let notification failures break the like action
        }
      }

      // Fire-and-forget achievement check for likes given
      checkAndAwardAchievements(userId, "SOCIAL").catch(() => {});

      if (buildId) {
        revalidatePath("/builds");
        revalidatePath(`/builds/${buildId}`);
      }

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
