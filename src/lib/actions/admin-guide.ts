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

// ─── Create Guide Step ──────────────────────────────────────────

export async function adminCreateGuideStep(formData: FormData) {
  try {
    const adminId = await requireAdmin();

    const selector = formData.get("selector") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const tip = (formData.get("tip") as string) || null;

    if (!selector?.trim() || !title?.trim() || !description?.trim()) {
      return { error: "Selector, title, and description are required." };
    }

    // Get next sort order
    const maxOrder = await db.editorGuideStep.aggregate({
      _max: { sortOrder: true },
    });
    const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

    const step = await db.editorGuideStep.create({
      data: {
        selector: selector.trim(),
        title: title.trim(),
        description: description.trim(),
        tip: tip?.trim() || null,
        sortOrder,
      },
    });

    await logEvent("MODERATION_ACTION", {
      userId: adminId,
      metadata: { action: "create_guide_step", stepId: step.id, title: step.title },
    });

    revalidatePath("/admin/guide");
    return { success: true, stepId: step.id };
  } catch (error) {
    console.error("[adminCreateGuideStep]", error);
    return { error: "Failed to create guide step." };
  }
}

// ─── Update Guide Step ──────────────────────────────────────────

export async function adminUpdateGuideStep(formData: FormData) {
  try {
    const adminId = await requireAdmin();

    const id = formData.get("id") as string;
    const selector = formData.get("selector") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const tip = (formData.get("tip") as string) || null;
    const isActive = formData.get("isActive") === "true";

    if (!id || !selector?.trim() || !title?.trim() || !description?.trim()) {
      return { error: "Selector, title, and description are required." };
    }

    await db.editorGuideStep.update({
      where: { id },
      data: {
        selector: selector.trim(),
        title: title.trim(),
        description: description.trim(),
        tip: tip?.trim() || null,
        isActive,
      },
    });

    await logEvent("MODERATION_ACTION", {
      userId: adminId,
      metadata: { action: "update_guide_step", stepId: id, title: title.trim() },
    });

    revalidatePath("/admin/guide");
    return { success: true };
  } catch (error) {
    console.error("[adminUpdateGuideStep]", error);
    return { error: "Failed to update guide step." };
  }
}

// ─── Delete Guide Step ──────────────────────────────────────────

export async function adminDeleteGuideStep(id: string) {
  try {
    const adminId = await requireAdmin();

    const step = await db.editorGuideStep.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!step) return { error: "Step not found." };

    await db.editorGuideStep.delete({ where: { id } });

    await logEvent("MODERATION_ACTION", {
      userId: adminId,
      metadata: { action: "delete_guide_step", stepId: id, title: step.title },
    });

    revalidatePath("/admin/guide");
    return { success: true };
  } catch (error) {
    console.error("[adminDeleteGuideStep]", error);
    return { error: "Failed to delete guide step." };
  }
}

// ─── Reorder Guide Step ─────────────────────────────────────────

export async function adminReorderGuideStep(id: string, direction: "up" | "down") {
  try {
    await requireAdmin();

    const step = await db.editorGuideStep.findUnique({
      where: { id },
      select: { id: true, sortOrder: true },
    });

    if (!step) return { error: "Step not found." };

    const allSteps = await db.editorGuideStep.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, sortOrder: true },
    });

    const idx = allSteps.findIndex((s) => s.id === id);
    if (idx === -1) return { error: "Step not found in list." };

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= allSteps.length) return { error: "Already at boundary." };

    // Swap sort order values
    await db.$transaction([
      db.editorGuideStep.update({
        where: { id: allSteps[idx].id },
        data: { sortOrder: allSteps[swapIdx].sortOrder },
      }),
      db.editorGuideStep.update({
        where: { id: allSteps[swapIdx].id },
        data: { sortOrder: allSteps[idx].sortOrder },
      }),
    ]);

    revalidatePath("/admin/guide");
    return { success: true };
  } catch (error) {
    console.error("[adminReorderGuideStep]", error);
    return { error: "Failed to reorder." };
  }
}
