"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/data/events";
import { revalidatePath } from "next/cache";
import {
  createKitSchema,
  updateKitSchema,
  createSeriesSchema,
  updateSeriesSchema,
  updateSuggestionSchema,
} from "@/lib/validations/admin-collector";

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

function generateSlug(name: string, grade: string): string {
  return `${grade}-${name}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function uniqueKitSlug(base: string): Promise<string> {
  let slug = base || "kit";
  let existing = await db.gunplaKit.findUnique({ where: { slug }, select: { id: true } });
  if (!existing) return slug;

  let suffix = 2;
  while (existing) {
    slug = `${base}-${suffix}`;
    existing = await db.gunplaKit.findUnique({ where: { slug }, select: { id: true } });
    suffix++;
  }
  return slug;
}

// ─── Kit CRUD ───────────────────────────────────────────────────

export async function adminCreateKit(data: Record<string, unknown>) {
  try {
    const adminId = await requireAdmin();

    const parsed = createKitSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const { name, grade, seriesId, ...rest } = parsed.data;
    const slug = await uniqueKitSlug(generateSlug(name, grade));

    // If seriesId provided, auto-fill seriesName from the series
    let seriesName = rest.seriesName;
    if (seriesId) {
      const series = await db.gundamSeries.findUnique({ where: { id: seriesId }, select: { name: true } });
      if (series) seriesName = series.name;
    }

    const kit = await db.gunplaKit.create({
      data: {
        name,
        grade,
        slug,
        seriesName,
        seriesId: seriesId ?? null,
        scale: rest.scale ?? null,
        releaseYear: rest.releaseYear ?? null,
        manufacturer: rest.manufacturer,
        imageUrl: rest.imageUrl ?? null,
        description: rest.description ?? null,
        modelNumber: rest.modelNumber ?? null,
        japaneseTitle: rest.japaneseTitle ?? null,
        price: rest.price ?? null,
        imageFocalX: rest.imageFocalX,
        imageFocalY: rest.imageFocalY,
        timeline: rest.timeline ?? null,
        brand: rest.brand,
        category: rest.category,
        isActive: rest.isActive,
      },
    });

    await logEvent("SETTING_CHANGED", {
      userId: adminId,
      metadata: { action: "create_kit", kitId: kit.id, name: kit.name, grade: kit.grade },
    });

    revalidatePath("/admin/collector");
    revalidatePath("/collector");
    return { success: true, kitId: kit.id };
  } catch (error) {
    console.error("[adminCreateKit]", error);
    return { error: "Failed to create kit." };
  }
}

export async function adminUpdateKit(data: Record<string, unknown>) {
  try {
    const adminId = await requireAdmin();

    const parsed = updateKitSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const { id, seriesId, ...updates } = parsed.data;

    const existing = await db.gunplaKit.findUnique({ where: { id }, select: { id: true, slug: true } });
    if (!existing) return { error: "Kit not found." };

    // If seriesId changed, auto-fill seriesName
    if (seriesId) {
      const series = await db.gundamSeries.findUnique({ where: { id: seriesId }, select: { name: true } });
      if (series && updates.seriesName === undefined) {
        updates.seriesName = series.name;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { ...updates };
    if (seriesId !== undefined) updateData.seriesId = seriesId ?? null;

    await db.gunplaKit.update({ where: { id }, data: updateData });

    await logEvent("SETTING_CHANGED", {
      userId: adminId,
      metadata: { action: "update_kit", kitId: id },
    });

    revalidatePath("/admin/collector");
    revalidatePath("/collector");
    revalidatePath(`/collector/${existing.slug}`);
    return { success: true };
  } catch (error) {
    console.error("[adminUpdateKit]", error);
    return { error: "Failed to update kit." };
  }
}

export async function adminDeleteKit(kitId: string) {
  try {
    const adminId = await requireAdmin();

    const kit = await db.gunplaKit.findUnique({
      where: { id: kitId },
      include: { _count: { select: { userKits: true } } },
    });

    if (!kit) return { error: "Kit not found." };

    if (kit._count.userKits > 0) {
      return { error: `Cannot delete: ${kit._count.userKits} user(s) have this kit in their collection. Deactivate it instead.` };
    }

    await db.gunplaKit.delete({ where: { id: kitId } });

    await logEvent("SETTING_CHANGED", {
      userId: adminId,
      metadata: { action: "delete_kit", kitId, name: kit.name },
    });

    revalidatePath("/admin/collector");
    revalidatePath("/collector");
    return { success: true };
  } catch (error) {
    console.error("[adminDeleteKit]", error);
    return { error: "Failed to delete kit." };
  }
}

export async function adminToggleKitActive(kitId: string) {
  try {
    const adminId = await requireAdmin();

    const kit = await db.gunplaKit.findUnique({
      where: { id: kitId },
      select: { id: true, isActive: true, name: true, slug: true },
    });

    if (!kit) return { error: "Kit not found." };

    await db.gunplaKit.update({
      where: { id: kitId },
      data: { isActive: !kit.isActive },
    });

    await logEvent("SETTING_CHANGED", {
      userId: adminId,
      metadata: { action: kit.isActive ? "deactivate_kit" : "activate_kit", kitId, name: kit.name },
    });

    revalidatePath("/admin/collector");
    revalidatePath("/collector");
    revalidatePath(`/collector/${kit.slug}`);
    return { success: true, isActive: !kit.isActive };
  } catch (error) {
    console.error("[adminToggleKitActive]", error);
    return { error: "Failed to toggle kit status." };
  }
}

// ─── Series CRUD ────────────────────────────────────────────────

export async function adminCreateSeries(data: Record<string, unknown>) {
  try {
    const adminId = await requireAdmin();

    const parsed = createSeriesSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const series = await db.gundamSeries.create({
      data: {
        name: parsed.data.name,
        japaneseTitle: parsed.data.japaneseTitle ?? null,
        timeline: parsed.data.timeline ?? null,
        yearStart: parsed.data.yearStart ?? null,
        yearEnd: parsed.data.yearEnd ?? null,
        abbreviation: parsed.data.abbreviation ?? null,
        sortOrder: parsed.data.sortOrder,
      },
    });

    await logEvent("SETTING_CHANGED", {
      userId: adminId,
      metadata: { action: "create_series", seriesId: series.id, name: series.name },
    });

    revalidatePath("/admin/collector");
    return { success: true, seriesId: series.id };
  } catch (error) {
    console.error("[adminCreateSeries]", error);
    return { error: "Failed to create series." };
  }
}

export async function adminUpdateSeries(data: Record<string, unknown>) {
  try {
    const adminId = await requireAdmin();

    const parsed = updateSeriesSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const { id, ...updates } = parsed.data;

    const existing = await db.gundamSeries.findUnique({ where: { id } });
    if (!existing) return { error: "Series not found." };

    await db.gundamSeries.update({ where: { id }, data: updates });

    await logEvent("SETTING_CHANGED", {
      userId: adminId,
      metadata: { action: "update_series", seriesId: id },
    });

    revalidatePath("/admin/collector");
    return { success: true };
  } catch (error) {
    console.error("[adminUpdateSeries]", error);
    return { error: "Failed to update series." };
  }
}

export async function adminDeleteSeries(seriesId: string) {
  try {
    const adminId = await requireAdmin();

    const series = await db.gundamSeries.findUnique({
      where: { id: seriesId },
      include: { _count: { select: { kits: true } } },
    });

    if (!series) return { error: "Series not found." };

    if (series._count.kits > 0) {
      return { error: `Cannot delete: ${series._count.kits} kit(s) reference this series. Reassign them first.` };
    }

    await db.gundamSeries.delete({ where: { id: seriesId } });

    await logEvent("SETTING_CHANGED", {
      userId: adminId,
      metadata: { action: "delete_series", seriesId, name: series.name },
    });

    revalidatePath("/admin/collector");
    return { success: true };
  } catch (error) {
    console.error("[adminDeleteSeries]", error);
    return { error: "Failed to delete series." };
  }
}

// ─── Suggestion Management ──────────────────────────────────────

export async function adminUpdateSuggestion(data: Record<string, unknown>) {
  try {
    const adminId = await requireAdmin();

    const parsed = updateSuggestionSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const { id, status, adminNotes } = parsed.data;

    const suggestion = await db.kitSuggestion.findUnique({ where: { id } });
    if (!suggestion) return { error: "Suggestion not found." };

    await db.kitSuggestion.update({
      where: { id },
      data: { status, adminNotes: adminNotes ?? null },
    });

    await logEvent("SETTING_CHANGED", {
      userId: adminId,
      metadata: { action: "update_suggestion", suggestionId: id, status, kitName: suggestion.kitName },
    });

    revalidatePath("/admin/collector");
    return { success: true };
  } catch (error) {
    console.error("[adminUpdateSuggestion]", error);
    return { error: "Failed to update suggestion." };
  }
}
