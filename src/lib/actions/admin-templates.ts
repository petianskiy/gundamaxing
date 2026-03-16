"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/data/events";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

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

// ─── Create Template ────────────────────────────────────────────

export async function adminCreateTemplate(data: {
  name: string;
  category: string;
  slots: { x: number; y: number; w: number; h: number; type: "image" | "text" | "meta" }[];
}) {
  try {
    const adminId = await requireAdmin();

    if (!data.name?.trim()) {
      return { error: "Name is required." };
    }

    if (!data.slots || data.slots.length === 0) {
      return { error: "At least one slot is required." };
    }

    const imageCount = data.slots.filter((s) => s.type === "image").length;

    // Get next sort order
    const maxOrder = await db.customTemplate.aggregate({
      _max: { sortOrder: true },
    });
    const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

    const template = await db.customTemplate.create({
      data: {
        name: data.name.trim(),
        category: data.category?.trim() || "Custom",
        imageCount,
        slots: data.slots as unknown as Prisma.InputJsonValue,
        sortOrder,
      },
    });

    await logEvent("MODERATION_ACTION", {
      userId: adminId,
      metadata: { action: "create_template", templateId: template.id, name: template.name },
    });

    revalidatePath("/admin/templates");
    return { success: true, templateId: template.id };
  } catch (error) {
    console.error("[adminCreateTemplate]", error);
    return { error: "Failed to create template." };
  }
}

// ─── Update Template ────────────────────────────────────────────

export async function adminUpdateTemplate(data: {
  id: string;
  name: string;
  category: string;
  slots: { x: number; y: number; w: number; h: number; type: "image" | "text" | "meta" }[];
}) {
  try {
    const adminId = await requireAdmin();

    if (!data.id) return { error: "Template ID is required." };
    if (!data.name?.trim()) return { error: "Name is required." };
    if (!data.slots || data.slots.length === 0) return { error: "At least one slot is required." };

    const imageCount = data.slots.filter((s) => s.type === "image").length;

    await db.customTemplate.update({
      where: { id: data.id },
      data: {
        name: data.name.trim(),
        category: data.category?.trim() || "Custom",
        imageCount,
        slots: data.slots as unknown as Prisma.InputJsonValue,
      },
    });

    await logEvent("MODERATION_ACTION", {
      userId: adminId,
      metadata: { action: "update_template", templateId: data.id, name: data.name.trim() },
    });

    revalidatePath("/admin/templates");
    return { success: true };
  } catch (error) {
    console.error("[adminUpdateTemplate]", error);
    return { error: "Failed to update template." };
  }
}

// ─── Delete Template ────────────────────────────────────────────

export async function adminDeleteTemplate(id: string) {
  try {
    const adminId = await requireAdmin();

    const template = await db.customTemplate.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!template) return { error: "Template not found." };

    await db.customTemplate.delete({ where: { id } });

    await logEvent("MODERATION_ACTION", {
      userId: adminId,
      metadata: { action: "delete_template", templateId: id, name: template.name },
    });

    revalidatePath("/admin/templates");
    return { success: true };
  } catch (error) {
    console.error("[adminDeleteTemplate]", error);
    return { error: "Failed to delete template." };
  }
}

// ─── Toggle Template Active ─────────────────────────────────────

export async function adminToggleTemplate(id: string) {
  try {
    const adminId = await requireAdmin();

    const template = await db.customTemplate.findUnique({
      where: { id },
      select: { id: true, name: true, isActive: true },
    });

    if (!template) return { error: "Template not found." };

    await db.customTemplate.update({
      where: { id },
      data: { isActive: !template.isActive },
    });

    await logEvent("MODERATION_ACTION", {
      userId: adminId,
      metadata: {
        action: template.isActive ? "deactivate_template" : "activate_template",
        templateId: id,
        name: template.name,
      },
    });

    revalidatePath("/admin/templates");
    return { success: true, isActive: !template.isActive };
  } catch (error) {
    console.error("[adminToggleTemplate]", error);
    return { error: "Failed to toggle template." };
  }
}

// ─── Reorder Template ───────────────────────────────────────────

export async function adminReorderTemplate(id: string, direction: "up" | "down") {
  try {
    await requireAdmin();

    const template = await db.customTemplate.findUnique({
      where: { id },
      select: { id: true, sortOrder: true },
    });

    if (!template) return { error: "Template not found." };

    const allTemplates = await db.customTemplate.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, sortOrder: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const idx = allTemplates.findIndex((t: any) => t.id === id);
    if (idx === -1) return { error: "Template not found." };

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= allTemplates.length) return { error: "Already at boundary." };

    // Swap sort order values
    await db.$transaction([
      db.customTemplate.update({
        where: { id: allTemplates[idx].id },
        data: { sortOrder: allTemplates[swapIdx].sortOrder },
      }),
      db.customTemplate.update({
        where: { id: allTemplates[swapIdx].id },
        data: { sortOrder: allTemplates[idx].sortOrder },
      }),
    ]);

    revalidatePath("/admin/templates");
    return { success: true };
  } catch (error) {
    console.error("[adminReorderTemplate]", error);
    return { error: "Failed to reorder." };
  }
}
