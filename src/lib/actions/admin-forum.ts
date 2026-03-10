"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/data/events";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") throw new Error("Insufficient permissions");
  return session.user.id;
}

// ─── Create Category ─────────────────────────────────────────────

export async function createCategory(formData: FormData) {
  try {
    const adminId = await requireAdmin();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const icon = formData.get("icon") as string;
    const color = formData.get("color") as string;
    const image = (formData.get("image") as string) || null;
    const parentId = (formData.get("parentId") as string) || null;

    if (!name?.trim() || !description?.trim() || !icon?.trim() || !color?.trim()) {
      return { error: "Name, description, icon, and color are required." };
    }

    // Get next order value
    const maxOrder = await db.forumCategory.aggregate({
      _max: { order: true },
      where: { parentId: parentId || null },
    });
    const order = (maxOrder._max.order ?? -1) + 1;

    const category = await db.forumCategory.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        icon: icon.trim(),
        color: color.trim(),
        image,
        parentId,
        order,
      },
    });

    await logEvent("MODERATION_ACTION", {
      userId: adminId,
      metadata: { action: "create_category", categoryId: category.id, name: category.name, parentId },
    });

    revalidatePath("/admin/forum");
    revalidatePath("/forum");
    return { success: true, categoryId: category.id };
  } catch (error) {
    console.error("[createCategory]", error);
    return { error: "Failed to create category." };
  }
}

// ─── Update Category ─────────────────────────────────────────────

export async function updateCategory(formData: FormData) {
  try {
    const adminId = await requireAdmin();

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const icon = formData.get("icon") as string;
    const color = formData.get("color") as string;
    const image = (formData.get("image") as string) || null;

    if (!id || !name?.trim() || !description?.trim() || !icon?.trim() || !color?.trim()) {
      return { error: "All fields are required." };
    }

    await db.forumCategory.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description.trim(),
        icon: icon.trim(),
        color: color.trim(),
        image,
      },
    });

    await logEvent("MODERATION_ACTION", {
      userId: adminId,
      metadata: { action: "update_category", categoryId: id, name: name.trim() },
    });

    revalidatePath("/admin/forum");
    revalidatePath("/forum");
    revalidatePath(`/forum/category/${id}`);
    return { success: true };
  } catch (error) {
    console.error("[updateCategory]", error);
    return { error: "Failed to update category." };
  }
}

// ─── Delete Category ─────────────────────────────────────────────

export async function deleteCategory(categoryId: string) {
  try {
    const adminId = await requireAdmin();

    const category = await db.forumCategory.findUnique({
      where: { id: categoryId },
      include: {
        _count: { select: { threads: true, children: true } },
      },
    });

    if (!category) return { error: "Category not found." };

    if (category._count.threads > 0) {
      return { error: `Cannot delete: category has ${category._count.threads} thread(s). Move or delete them first.` };
    }

    if (category._count.children > 0) {
      return { error: `Cannot delete: category has ${category._count.children} subcategory(ies). Delete them first.` };
    }

    await db.forumCategory.delete({ where: { id: categoryId } });

    await logEvent("MODERATION_ACTION", {
      userId: adminId,
      metadata: { action: "delete_category", categoryId, name: category.name },
    });

    revalidatePath("/admin/forum");
    revalidatePath("/forum");
    return { success: true };
  } catch (error) {
    console.error("[deleteCategory]", error);
    return { error: "Failed to delete category." };
  }
}

// ─── Reorder Category ────────────────────────────────────────────

export async function reorderCategory(categoryId: string, direction: "up" | "down") {
  try {
    await requireAdmin();

    const category = await db.forumCategory.findUnique({
      where: { id: categoryId },
      select: { id: true, order: true, parentId: true },
    });

    if (!category) return { error: "Category not found." };

    const siblings = await db.forumCategory.findMany({
      where: { parentId: category.parentId },
      orderBy: { order: "asc" },
      select: { id: true, order: true },
    });

    const idx = siblings.findIndex((s) => s.id === categoryId);
    if (idx === -1) return { error: "Category not found in siblings." };

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return { error: "Already at boundary." };

    // Swap order values
    await db.$transaction([
      db.forumCategory.update({
        where: { id: siblings[idx].id },
        data: { order: siblings[swapIdx].order },
      }),
      db.forumCategory.update({
        where: { id: siblings[swapIdx].id },
        data: { order: siblings[idx].order },
      }),
    ]);

    revalidatePath("/admin/forum");
    revalidatePath("/forum");
    return { success: true };
  } catch (error) {
    console.error("[reorderCategory]", error);
    return { error: "Failed to reorder." };
  }
}

// ─── Pin/Unpin Thread ────────────────────────────────────────────

export async function adminTogglePin(threadId: string) {
  try {
    const adminId = await requireAdmin();

    const thread = await db.thread.findUnique({
      where: { id: threadId },
      select: { id: true, isPinned: true, title: true },
    });

    if (!thread) return { error: "Thread not found." };

    await db.thread.update({
      where: { id: threadId },
      data: { isPinned: !thread.isPinned },
    });

    await logEvent("MODERATION_ACTION", {
      userId: adminId,
      metadata: { action: thread.isPinned ? "unpin_thread" : "pin_thread", threadId, title: thread.title },
    });

    revalidatePath("/admin/forum");
    revalidatePath("/forum");
    revalidatePath(`/thread/${threadId}`);
    return { success: true, isPinned: !thread.isPinned };
  } catch (error) {
    console.error("[adminTogglePin]", error);
    return { error: "Failed to toggle pin." };
  }
}

// ─── Lock/Unlock Thread ──────────────────────────────────────────

export async function adminToggleLock(threadId: string) {
  try {
    const adminId = await requireAdmin();

    const thread = await db.thread.findUnique({
      where: { id: threadId },
      select: { id: true, isLocked: true, title: true },
    });

    if (!thread) return { error: "Thread not found." };

    await db.thread.update({
      where: { id: threadId },
      data: { isLocked: !thread.isLocked },
    });

    await logEvent("MODERATION_ACTION", {
      userId: adminId,
      metadata: { action: thread.isLocked ? "unlock_thread" : "lock_thread", threadId, title: thread.title },
    });

    revalidatePath("/admin/forum");
    revalidatePath("/forum");
    revalidatePath(`/thread/${threadId}`);
    return { success: true, isLocked: !thread.isLocked };
  } catch (error) {
    console.error("[adminToggleLock]", error);
    return { error: "Failed to toggle lock." };
  }
}

// ─── Move Thread ─────────────────────────────────────────────────

export async function adminMoveThread(threadId: string, newCategoryId: string) {
  try {
    const adminId = await requireAdmin();

    const thread = await db.thread.findUnique({
      where: { id: threadId },
      select: { id: true, title: true, categoryId: true },
    });

    if (!thread) return { error: "Thread not found." };

    const newCategory = await db.forumCategory.findUnique({
      where: { id: newCategoryId },
      select: { id: true, name: true },
    });

    if (!newCategory) return { error: "Target category not found." };

    // Update thread counts
    await db.$transaction([
      db.thread.update({
        where: { id: threadId },
        data: { categoryId: newCategoryId },
      }),
      db.forumCategory.update({
        where: { id: thread.categoryId },
        data: { threadCount: { decrement: 1 } },
      }),
      db.forumCategory.update({
        where: { id: newCategoryId },
        data: { threadCount: { increment: 1 } },
      }),
    ]);

    await logEvent("MODERATION_ACTION", {
      userId: adminId,
      metadata: {
        action: "move_thread",
        threadId,
        title: thread.title,
        fromCategoryId: thread.categoryId,
        toCategoryId: newCategoryId,
        toCategoryName: newCategory.name,
      },
    });

    revalidatePath("/admin/forum");
    revalidatePath("/forum");
    revalidatePath(`/thread/${threadId}`);
    revalidatePath(`/forum/category/${thread.categoryId}`);
    revalidatePath(`/forum/category/${newCategoryId}`);
    return { success: true };
  } catch (error) {
    console.error("[adminMoveThread]", error);
    return { error: "Failed to move thread." };
  }
}
