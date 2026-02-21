// ─── Brush Presets ───────────────────────────────────────────────
// Re-exports the full preset library from brushes/presets/.
// This file is the public API for the drawing overlay and UI.

import type { BrushPreset, BrushCategory } from "./engine/brush-types";
import {
  ALL_PRESETS,
  CATEGORY_META,
  getPresetById,
  getPresetsByCategory,
  searchPresets,
} from "./brushes/presets";

// Re-export for convenience
export type { BrushPreset, BrushCategory };
export {
  ALL_PRESETS,
  CATEGORY_META,
  getPresetsByCategory,
  searchPresets,
};

/** All brush presets */
export const BRUSH_PRESETS: BrushPreset[] = ALL_PRESETS;

/** Get a preset by ID */
export function getBrushPreset(id: string): BrushPreset | undefined {
  return getPresetById(id);
}

/** Get all presets for a category */
export function getBrushCategory(category: BrushCategory): BrushPreset[] {
  return getPresetsByCategory(category);
}

/** Get unique categories that have presets */
export function getCategories(): BrushCategory[] {
  return CATEGORY_META.map((c) => c.id);
}
