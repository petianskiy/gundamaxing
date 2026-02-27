// ─── Drawing Engine Types ───────────────────────────────────────
// Shared types used across the pencil engine, tools, and overlay.

/** A raw input point from pointer events */
export interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
  tiltX?: number;
  tiltY?: number;
  timestamp: number;
}

/** Bounding rect for dirty-region tracking */
export interface DirtyRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Serializable stroke for export/replay */
export interface SerializedStroke {
  points: StrokePoint[];
  color: string;
  size: number;
  opacity: number;
  pressureGamma: number;
  texture: number;
  isEraser: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Merge two dirty rects into the smallest enclosing rect */
export function mergeDirtyRects(a: DirtyRect | null, b: DirtyRect): DirtyRect {
  if (!a) return b;
  const minX = Math.min(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxX = Math.max(a.x + a.width, b.x + b.width);
  const maxY = Math.max(a.y + a.height, b.y + b.height);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
