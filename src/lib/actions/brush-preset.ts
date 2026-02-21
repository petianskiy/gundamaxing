"use server";

import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  brushPresetSchema,
  updateBrushPresetSchema,
  reorderBrushPresetsSchema,
} from "@/lib/validations/brush-preset";

const MAX_PRESETS_PER_USER = 200;

export async function createBrushPreset(data: {
  name: string;
  category: string;
  folder?: string;
  tags?: string[];
  isFavorite?: boolean;
  stampUrl?: string;
  grainUrl?: string;
  presetData: Record<string, unknown>;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const parsed = brushPresetSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const userId = session.user.id;

    // Check preset limit
    const count = await db.userBrushPreset.count({ where: { userId } });
    if (count >= MAX_PRESETS_PER_USER) {
      return { error: `You can have at most ${MAX_PRESETS_PER_USER} brush presets.` };
    }

    // Calculate next sortOrder
    const maxOrder = await db.userBrushPreset.aggregate({
      where: { userId },
      _max: { sortOrder: true },
    });
    const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;

    const preset = await db.userBrushPreset.create({
      data: {
        userId,
        name: parsed.data.name,
        category: parsed.data.category,
        folder: parsed.data.folder || null,
        tags: parsed.data.tags ?? [],
        isFavorite: parsed.data.isFavorite ?? false,
        stampUrl: parsed.data.stampUrl || null,
        grainUrl: parsed.data.grainUrl || null,
        presetData: parsed.data.presetData as Prisma.InputJsonValue,
        sortOrder: nextOrder,
      },
    });

    return { success: true, data: preset };
  } catch (error) {
    console.error("createBrushPreset error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function updateBrushPreset(data: {
  id: string;
  name?: string;
  category?: string;
  folder?: string;
  tags?: string[];
  isFavorite?: boolean;
  stampUrl?: string;
  grainUrl?: string;
  presetData?: Record<string, unknown>;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const parsed = updateBrushPresetSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const userId = session.user.id;

    // Verify ownership
    const preset = await db.userBrushPreset.findUnique({
      where: { id: parsed.data.id },
    });

    if (!preset || preset.userId !== userId) {
      return { error: "Preset not found or you do not own it." };
    }

    const { id, ...updateFields } = parsed.data;

    const updateData: Prisma.UserBrushPresetUpdateInput = {};
    if (updateFields.name !== undefined) updateData.name = updateFields.name;
    if (updateFields.category !== undefined) updateData.category = updateFields.category;
    if (updateFields.folder !== undefined) updateData.folder = updateFields.folder || null;
    if (updateFields.tags !== undefined) updateData.tags = updateFields.tags;
    if (updateFields.isFavorite !== undefined) updateData.isFavorite = updateFields.isFavorite;
    if (updateFields.stampUrl !== undefined) updateData.stampUrl = updateFields.stampUrl || null;
    if (updateFields.grainUrl !== undefined) updateData.grainUrl = updateFields.grainUrl || null;
    if (updateFields.presetData !== undefined) updateData.presetData = updateFields.presetData as Prisma.InputJsonValue;

    const updatedPreset = await db.userBrushPreset.update({
      where: { id },
      data: updateData,
    });

    return { success: true, data: updatedPreset };
  } catch (error) {
    console.error("updateBrushPreset error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function deleteBrushPreset(presetId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const userId = session.user.id;

    // Verify ownership
    const preset = await db.userBrushPreset.findUnique({
      where: { id: presetId },
    });

    if (!preset || preset.userId !== userId) {
      return { error: "Preset not found or you do not own it." };
    }

    await db.userBrushPreset.delete({
      where: { id: presetId },
    });

    return { success: true };
  } catch (error) {
    console.error("deleteBrushPreset error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function toggleFavoriteBrushPreset(presetId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const userId = session.user.id;

    // Verify ownership
    const preset = await db.userBrushPreset.findUnique({
      where: { id: presetId },
    });

    if (!preset || preset.userId !== userId) {
      return { error: "Preset not found or you do not own it." };
    }

    const updatedPreset = await db.userBrushPreset.update({
      where: { id: presetId },
      data: { isFavorite: !preset.isFavorite },
    });

    return { success: true, data: updatedPreset };
  } catch (error) {
    console.error("toggleFavoriteBrushPreset error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function reorderBrushPresets(data: {
  presets: { id: string; sortOrder: number }[];
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const parsed = reorderBrushPresetsSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const userId = session.user.id;
    const presetIds = parsed.data.presets.map((p) => p.id);

    // Verify all presets belong to the user
    const presets = await db.userBrushPreset.findMany({
      where: { id: { in: presetIds }, userId },
      select: { id: true },
    });

    if (presets.length !== presetIds.length) {
      return { error: "One or more presets not found or you do not own them." };
    }

    // Batch update sortOrder in a transaction
    await db.$transaction(
      parsed.data.presets.map((p) =>
        db.userBrushPreset.update({
          where: { id: p.id },
          data: { sortOrder: p.sortOrder },
        })
      )
    );

    return { success: true };
  } catch (error) {
    console.error("reorderBrushPresets error:", error);
    return { error: "An unexpected error occurred." };
  }
}
