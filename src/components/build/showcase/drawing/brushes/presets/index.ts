// ─── Brush Presets Index ─────────────────────────────────────────
// Aggregates all category presets into a single searchable collection.

import type { BrushPreset, BrushCategory } from "../../engine/brush-types";
import { PENCIL_PRESETS } from "./pencils";
import { INK_PRESETS } from "./inks";
import { PAINT_PRESETS } from "./paints";
import { AIRBRUSH_PRESETS } from "./airbrush";
import { MARKER_PRESETS } from "./markers";
import { TEXTURE_PRESETS } from "./textures";
import { FX_PRESETS } from "./fx";
import { MECHA_PRESETS } from "./mecha";
import { ERASER_PRESETS } from "./erasers";

export {
  PENCIL_PRESETS,
  INK_PRESETS,
  PAINT_PRESETS,
  AIRBRUSH_PRESETS,
  MARKER_PRESETS,
  TEXTURE_PRESETS,
  FX_PRESETS,
  MECHA_PRESETS,
  ERASER_PRESETS,
};

/** All presets from all categories */
export const ALL_PRESETS: BrushPreset[] = [
  ...PENCIL_PRESETS,
  ...INK_PRESETS,
  ...PAINT_PRESETS,
  ...AIRBRUSH_PRESETS,
  ...MARKER_PRESETS,
  ...TEXTURE_PRESETS,
  ...FX_PRESETS,
  ...MECHA_PRESETS,
  ...ERASER_PRESETS,
];

/** Category metadata for UI display */
export const CATEGORY_META: { id: BrushCategory; label: string; count: number }[] = [
  { id: "pencils", label: "Pencils", count: PENCIL_PRESETS.length },
  { id: "inks", label: "Inks", count: INK_PRESETS.length },
  { id: "paints", label: "Paints", count: PAINT_PRESETS.length },
  { id: "airbrush", label: "Airbrush", count: AIRBRUSH_PRESETS.length },
  { id: "markers", label: "Markers", count: MARKER_PRESETS.length },
  { id: "textures", label: "Textures", count: TEXTURE_PRESETS.length },
  { id: "fx", label: "FX", count: FX_PRESETS.length },
  { id: "mecha", label: "Mecha", count: MECHA_PRESETS.length },
  { id: "erasers", label: "Erasers", count: ERASER_PRESETS.length },
];

/** Lookup preset by ID (O(1) via Map) */
const presetMap = new Map<string, BrushPreset>(
  ALL_PRESETS.map((p) => [p.id, p])
);

export function getPresetById(id: string): BrushPreset | undefined {
  return presetMap.get(id);
}

/** Get presets for a category */
export function getPresetsByCategory(category: BrushCategory): BrushPreset[] {
  return ALL_PRESETS.filter((p) => p.category === category);
}

/** Simple search by name (case-insensitive substring match) */
export function searchPresets(query: string): BrushPreset[] {
  const lower = query.toLowerCase();
  return ALL_PRESETS.filter((p) =>
    p.name.toLowerCase().includes(lower) ||
    p.category.includes(lower)
  );
}
