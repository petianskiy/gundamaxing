"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const GIF_NULL_DATA = {
  gifUrl: null,
  gifPreviewUrl: null,
  gifWidth: null,
  gifHeight: null,
  gifSlug: null,
};

export async function removeGifFromComment(commentId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const comment = await db.comment.findUnique({
      where: { id: commentId },
      select: { userId: true, gifUrl: true },
    });

    if (!comment) {
      return { error: "Comment not found." };
    }

    if (!comment.gifUrl) {
      return { error: "Comment has no GIF." };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    });

    if (!user) {
      return { error: "User not found." };
    }

    const isOwner = comment.userId === user.id;
    const isMod = user.role === "ADMIN" || user.role === "MODERATOR";

    if (!isOwner && !isMod) {
      return { error: "You do not have permission to remove this GIF." };
    }

    await db.comment.update({
      where: { id: commentId },
      data: GIF_NULL_DATA,
    });

    return { success: true };
  } catch (error) {
    console.error("removeGifFromComment error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function removeGifFromThread(threadId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const thread = await db.thread.findUnique({
      where: { id: threadId },
      select: { userId: true, gifUrl: true },
    });

    if (!thread) {
      return { error: "Thread not found." };
    }

    if (!thread.gifUrl) {
      return { error: "Thread has no GIF." };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    });

    if (!user) {
      return { error: "User not found." };
    }

    const isOwner = thread.userId === user.id;
    const isMod = user.role === "ADMIN" || user.role === "MODERATOR";

    if (!isOwner && !isMod) {
      return { error: "You do not have permission to remove this GIF." };
    }

    await db.thread.update({
      where: { id: threadId },
      data: GIF_NULL_DATA,
    });

    return { success: true };
  } catch (error) {
    console.error("removeGifFromThread error:", error);
    return { error: "An unexpected error occurred." };
  }
}
