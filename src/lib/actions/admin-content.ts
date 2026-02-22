"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/data/events";
import { createNotification } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

export async function adminDeleteBuild(buildId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const admin = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (admin?.role !== "ADMIN") {
      return { error: "Insufficient permissions." };
    }

    const build = await db.build.findUnique({
      where: { id: buildId },
      select: { id: true, title: true, slug: true, userId: true },
    });

    if (!build) {
      return { error: "Build not found." };
    }

    await db.moderationAction.create({
      data: {
        type: "DELETE_CONTENT",
        reason: `Deleted build: "${build.title}"`,
        targetUserId: build.userId,
        targetBuildId: buildId,
        moderatorId: session.user.id!,
      },
    });

    await db.build.delete({ where: { id: buildId } });

    await logEvent("CONTENT_MODERATED", {
      userId: session.user.id,
      metadata: {
        action: "delete_build",
        targetId: buildId,
        buildTitle: build.title,
      },
    });

    await createNotification({
      userId: build.userId,
      type: "CONTENT_DELETED",
      title: "Build Removed",
      message: `Your build "${build.title}" has been removed by a moderator.`,
    });

    revalidatePath("/admin/content");
    revalidatePath("/builds");
    revalidatePath(`/builds/${build.slug || buildId}`);
    return { success: true };
  } catch (error) {
    console.error("[adminDeleteBuild]", error);
    return { error: "Failed to delete build." };
  }
}

export async function adminDeleteComment(commentId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const admin = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (admin?.role !== "ADMIN") {
      return { error: "Insufficient permissions." };
    }

    const comment = await db.comment.findUnique({
      where: { id: commentId },
      select: { id: true, content: true, userId: true, build: { select: { slug: true, id: true } } },
    });

    if (!comment) {
      return { error: "Comment not found." };
    }

    await db.moderationAction.create({
      data: {
        type: "DELETE_CONTENT",
        reason: `Deleted comment: "${comment.content.slice(0, 100)}"`,
        targetUserId: comment.userId,
        targetCommentId: commentId,
        moderatorId: session.user.id!,
      },
    });

    await db.comment.delete({ where: { id: commentId } });

    await logEvent("CONTENT_MODERATED", {
      userId: session.user.id,
      metadata: {
        action: "delete_comment",
        targetId: commentId,
        contentPreview: comment.content.slice(0, 100),
      },
    });

    await createNotification({
      userId: comment.userId,
      type: "CONTENT_DELETED",
      title: "Comment Removed",
      message: "One of your comments has been removed by a moderator.",
    });

    revalidatePath("/admin/content");
    if (comment.build) {
      revalidatePath(`/builds/${comment.build.slug || comment.build.id}`);
    }
    return { success: true };
  } catch (error) {
    console.error("[adminDeleteComment]", error);
    return { error: "Failed to delete comment." };
  }
}

export async function adminDeleteThread(threadId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const admin = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (admin?.role !== "ADMIN") {
      return { error: "Insufficient permissions." };
    }

    const thread = await db.thread.findUnique({
      where: { id: threadId },
      select: { id: true, title: true, userId: true },
    });

    if (!thread) {
      return { error: "Thread not found." };
    }

    await db.moderationAction.create({
      data: {
        type: "DELETE_CONTENT",
        reason: `Deleted thread: "${thread.title}"`,
        targetUserId: thread.userId,
        targetThreadId: threadId,
        moderatorId: session.user.id!,
      },
    });

    await db.thread.delete({ where: { id: threadId } });

    await logEvent("CONTENT_MODERATED", {
      userId: session.user.id,
      metadata: {
        action: "delete_thread",
        targetId: threadId,
        threadTitle: thread.title,
      },
    });

    await createNotification({
      userId: thread.userId,
      type: "CONTENT_DELETED",
      title: "Thread Removed",
      message: `Your thread "${thread.title}" has been removed by a moderator.`,
    });

    revalidatePath("/admin/content");
    revalidatePath("/forum");
    revalidatePath(`/thread/${threadId}`);
    return { success: true };
  } catch (error) {
    console.error("[adminDeleteThread]", error);
    return { error: "Failed to delete thread." };
  }
}
