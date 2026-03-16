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

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Create Theme ────────────────────────────────────────────────

export async function adminCreateTheme(data: {
  name: string;
  badgeColor: string;
  unlockLevel: number;
  backgroundType: string;
  backgroundImages: string[] | null;
  backgroundVideoUrl: string | null;
  backgroundPosterUrl: string | null;
  carouselInterval: number;
  dimness: number;
  effects: { type: string; color: string; size: number; speed: number; density: number }[] | null;
  gridConfig: { topOffset: number; leftOffset: number; width: number; columns: number } | null;
}) {
  try {
    const adminId = await requireAdmin();

    if (!data.name?.trim()) {
      return { error: "Name is required." };
    }

    const slug = slugify(data.name);
    if (!slug) {
      return { error: "Name must contain alphanumeric characters." };
    }

    // Check unique slug
    const existing = await db.hangarThemeConfig.findUnique({ where: { slug } });
    if (existing) {
      return { error: "A theme with a similar name already exists." };
    }

    // Get next sort order
    const maxOrder = await db.hangarThemeConfig.aggregate({
      _max: { sortOrder: true },
    });
    const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

    const theme = await db.hangarThemeConfig.create({
      data: {
        name: data.name.trim(),
        slug,
        badgeColor: data.badgeColor || "#dc2626",
        unlockLevel: data.unlockLevel ?? 1,
        backgroundType: data.backgroundType || "carousel",
        backgroundImages: data.backgroundImages as unknown as Prisma.InputJsonValue,
        backgroundVideoUrl: data.backgroundVideoUrl || null,
        backgroundPosterUrl: data.backgroundPosterUrl || null,
        carouselInterval: data.carouselInterval ?? 8,
        dimness: data.dimness ?? 0.6,
        effects: data.effects as unknown as Prisma.InputJsonValue,
        gridConfig: data.gridConfig as unknown as Prisma.InputJsonValue,
        sortOrder,
      },
    });

    await logEvent("MODERATION_ACTION", {
      userId: adminId,
      metadata: { action: "create_theme", themeId: theme.id, name: theme.name },
    });

    revalidatePath("/admin/themes");
    return { success: true, themeId: theme.id };
  } catch (error) {
    console.error("[adminCreateTheme]", error);
    return { error: "Failed to create theme." };
  }
}

// ─── Update Theme ────────────────────────────────────────────────

export async function adminUpdateTheme(data: {
  id: string;
  name: string;
  badgeColor: string;
  unlockLevel: number;
  backgroundType: string;
  backgroundImages: string[] | null;
  backgroundVideoUrl: string | null;
  backgroundPosterUrl: string | null;
  carouselInterval: number;
  dimness: number;
  effects: { type: string; color: string; size: number; speed: number; density: number }[] | null;
  gridConfig: { topOffset: number; leftOffset: number; width: number; columns: number } | null;
}) {
  try {
    const adminId = await requireAdmin();

    if (!data.id) return { error: "Theme ID is required." };
    if (!data.name?.trim()) return { error: "Name is required." };

    const slug = slugify(data.name);
    if (!slug) return { error: "Name must contain alphanumeric characters." };

    // Check slug uniqueness (exclude self)
    const existing = await db.hangarThemeConfig.findUnique({ where: { slug } });
    if (existing && existing.id !== data.id) {
      return { error: "A theme with a similar name already exists." };
    }

    await db.hangarThemeConfig.update({
      where: { id: data.id },
      data: {
        name: data.name.trim(),
        slug,
        badgeColor: data.badgeColor || "#dc2626",
        unlockLevel: data.unlockLevel ?? 1,
        backgroundType: data.backgroundType || "carousel",
        backgroundImages: data.backgroundImages as unknown as Prisma.InputJsonValue,
        backgroundVideoUrl: data.backgroundVideoUrl || null,
        backgroundPosterUrl: data.backgroundPosterUrl || null,
        carouselInterval: data.carouselInterval ?? 8,
        dimness: data.dimness ?? 0.6,
        effects: data.effects as unknown as Prisma.InputJsonValue,
        gridConfig: data.gridConfig as unknown as Prisma.InputJsonValue,
      },
    });

    await logEvent("MODERATION_ACTION", {
      userId: adminId,
      metadata: { action: "update_theme", themeId: data.id, name: data.name.trim() },
    });

    revalidatePath("/admin/themes");
    return { success: true };
  } catch (error) {
    console.error("[adminUpdateTheme]", error);
    return { error: "Failed to update theme." };
  }
}

// ─── Delete Theme ────────────────────────────────────────────────

export async function adminDeleteTheme(id: string) {
  try {
    const adminId = await requireAdmin();

    const theme = await db.hangarThemeConfig.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!theme) return { error: "Theme not found." };

    await db.hangarThemeConfig.delete({ where: { id } });

    await logEvent("MODERATION_ACTION", {
      userId: adminId,
      metadata: { action: "delete_theme", themeId: id, name: theme.name },
    });

    revalidatePath("/admin/themes");
    return { success: true };
  } catch (error) {
    console.error("[adminDeleteTheme]", error);
    return { error: "Failed to delete theme." };
  }
}

// ─── Toggle Publish ──────────────────────────────────────────────

export async function adminTogglePublish(id: string) {
  try {
    const adminId = await requireAdmin();

    const theme = await db.hangarThemeConfig.findUnique({
      where: { id },
      select: { id: true, name: true, isPublished: true },
    });

    if (!theme) return { error: "Theme not found." };

    await db.hangarThemeConfig.update({
      where: { id },
      data: { isPublished: !theme.isPublished },
    });

    await logEvent("MODERATION_ACTION", {
      userId: adminId,
      metadata: {
        action: theme.isPublished ? "unpublish_theme" : "publish_theme",
        themeId: id,
        name: theme.name,
      },
    });

    revalidatePath("/admin/themes");
    return { success: true, isPublished: !theme.isPublished };
  } catch (error) {
    console.error("[adminTogglePublish]", error);
    return { error: "Failed to toggle publish." };
  }
}

// ─── Reorder Theme ───────────────────────────────────────────────

export async function adminReorderTheme(id: string, direction: "up" | "down") {
  try {
    await requireAdmin();

    const theme = await db.hangarThemeConfig.findUnique({
      where: { id },
      select: { id: true, sortOrder: true },
    });

    if (!theme) return { error: "Theme not found." };

    const allThemes = await db.hangarThemeConfig.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, sortOrder: true },
    });

    const idx = allThemes.findIndex((t) => t.id === id);
    if (idx === -1) return { error: "Theme not found." };

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= allThemes.length) return { error: "Already at boundary." };

    // Swap sort order values
    await db.$transaction([
      db.hangarThemeConfig.update({
        where: { id: allThemes[idx].id },
        data: { sortOrder: allThemes[swapIdx].sortOrder },
      }),
      db.hangarThemeConfig.update({
        where: { id: allThemes[swapIdx].id },
        data: { sortOrder: allThemes[idx].sortOrder },
      }),
    ]);

    revalidatePath("/admin/themes");
    return { success: true };
  } catch (error) {
    console.error("[adminReorderTheme]", error);
    return { error: "Failed to reorder." };
  }
}
