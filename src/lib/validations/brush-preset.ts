import { z } from "zod";

export const brushPresetSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  folder: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  isFavorite: z.boolean().optional(),
  stampUrl: z.string().url().max(500).optional(),
  grainUrl: z.string().url().max(500).optional(),
  presetData: z.record(z.string(), z.unknown()),
});

export const updateBrushPresetSchema = brushPresetSchema.partial().extend({
  id: z.string().min(1),
});

export const reorderBrushPresetsSchema = z.object({
  presets: z.array(z.object({
    id: z.string().min(1),
    sortOrder: z.number().int().min(0),
  })),
});
