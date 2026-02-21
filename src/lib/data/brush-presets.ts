import { cache } from "react";
import { db } from "@/lib/db";

// ─── Types ──────────────────────────────────────────────────────

export interface BrushPreset {
  id: string;
  userId: string;
  name: string;
  category: string;
  folder: string | null;
  tags: string[];
  isFavorite: boolean;
  presetData: Record<string, unknown>;
  stampUrl: string | null;
  grainUrl: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Helpers ────────────────────────────────────────────────────

function toUIBrushPreset(preset: {
  id: string;
  userId: string;
  name: string;
  category: string;
  folder: string | null;
  tags: string[];
  isFavorite: boolean;
  presetData: unknown;
  stampUrl: string | null;
  grainUrl: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): BrushPreset {
  return {
    id: preset.id,
    userId: preset.userId,
    name: preset.name,
    category: preset.category,
    folder: preset.folder,
    tags: preset.tags,
    isFavorite: preset.isFavorite,
    presetData: preset.presetData as Record<string, unknown>,
    stampUrl: preset.stampUrl,
    grainUrl: preset.grainUrl,
    sortOrder: preset.sortOrder,
    createdAt: preset.createdAt.toISOString(),
    updatedAt: preset.updatedAt.toISOString(),
  };
}

// ─── Queries ────────────────────────────────────────────────────

export const getUserBrushPresets = cache(
  async (userId: string): Promise<BrushPreset[]> => {
    const presets = await db.userBrushPreset.findMany({
      where: { userId },
      orderBy: { sortOrder: "asc" },
    });
    return presets.map(toUIBrushPreset);
  }
);

export const getUserBrushPresetById = cache(
  async (presetId: string, userId: string): Promise<BrushPreset | null> => {
    const preset = await db.userBrushPreset.findUnique({
      where: { id: presetId },
    });

    if (!preset || preset.userId !== userId) {
      return null;
    }

    return toUIBrushPreset(preset);
  }
);

export const getUserBrushPresetCount = cache(
  async (userId: string): Promise<number> => {
    return db.userBrushPreset.count({ where: { userId } });
  }
);
