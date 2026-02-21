// ─── Stamp Renderer ──────────────────────────────────────────────
// Renders a single brush dab (stamp) onto a canvas context.
// Uses a shared reusable temp canvas to avoid per-dab allocation.

import type { BrushPreset, DabParams } from "./brush-types";
import { clamp } from "./brush-types";

// ─── Stamp cache ─────────────────────────────────────────────────
// Pre-render shape masks at discrete sizes to avoid per-dab computation.

const stampCache = new Map<string, HTMLCanvasElement>();
const MAX_CACHE_SIZE = 64;

function getCacheKey(shape: string, hardness: number, size: number): string {
  // Round size to nearest 2px for cache efficiency
  const roundedSize = Math.round(size / 2) * 2;
  const roundedHardness = Math.round(hardness * 10) / 10;
  return `${shape}_${roundedHardness}_${roundedSize}`;
}

function evictOldEntries(): void {
  if (stampCache.size > MAX_CACHE_SIZE) {
    const firstKey = stampCache.keys().next().value;
    if (firstKey) stampCache.delete(firstKey);
  }
}

// ─── Shape mask generation ───────────────────────────────────────

function createCircleStamp(
  size: number,
  hardness: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const diameter = Math.max(2, Math.round(size));
  canvas.width = diameter;
  canvas.height = diameter;
  const ctx = canvas.getContext("2d")!;

  const cx = diameter / 2;
  const cy = diameter / 2;
  const radius = diameter / 2;

  if (hardness >= 0.95) {
    // Hard brush: solid circle
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Soft brush: radial gradient falloff
    const innerRadius = radius * hardness;
    const gradient = ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, radius);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

function createSquareStamp(
  size: number,
  hardness: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const side = Math.max(2, Math.round(size));
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext("2d")!;

  if (hardness >= 0.95) {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, side, side);
  } else {
    const feather = side * (1 - hardness) * 0.5;
    const gradient = ctx.createRadialGradient(
      side / 2, side / 2, side / 2 - feather,
      side / 2, side / 2, side / 2
    );
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, side, side);
  }

  return canvas;
}

function getOrCreateStamp(
  shape: BrushPreset["shape"],
  hardness: number,
  size: number
): HTMLCanvasElement {
  const key = getCacheKey(shape, hardness, size);
  let stamp = stampCache.get(key);
  if (stamp && stamp instanceof HTMLCanvasElement) return stamp;

  evictOldEntries();

  const newStamp =
    shape === "square"
      ? createSquareStamp(size, hardness)
      : createCircleStamp(size, hardness);

  stampCache.set(key, newStamp);
  return newStamp;
}

// ─── Shared temp canvas for colorizing stamps ───────────────────
// Reused across all dabs to avoid per-dab document.createElement

let _sharedTempCanvas: HTMLCanvasElement | null = null;
let _sharedTempCtx: CanvasRenderingContext2D | null = null;

function getSharedTempCanvas(size: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  const s = Math.max(2, Math.ceil(size));

  if (!_sharedTempCanvas || !_sharedTempCtx) {
    _sharedTempCanvas = document.createElement("canvas");
    _sharedTempCtx = _sharedTempCanvas.getContext("2d");
    if (!_sharedTempCtx) return null;
  }

  // Resize only if needed (grow but never shrink to avoid frequent reallocs)
  if (_sharedTempCanvas.width < s || _sharedTempCanvas.height < s) {
    // Round up to nearest power of 2 for cache-friendliness
    const newSize = Math.min(2048, Math.max(s, 64));
    _sharedTempCanvas.width = newSize;
    _sharedTempCanvas.height = newSize;
  }

  return { canvas: _sharedTempCanvas, ctx: _sharedTempCtx };
}

// ─── Main stamp rendering function ───────────────────────────────

/**
 * Render a single dab onto the target canvas context.
 * The context should belong to the active layer's canvas.
 */
export function renderDab(
  ctx: CanvasRenderingContext2D,
  dab: DabParams,
  color: string,
  preset: BrushPreset
): void {
  const { x, y, size, opacity, flow, rotation } = dab;

  if (size < 0.5 || opacity <= 0 || flow <= 0) return;

  // Apply ellipse roundness
  const stampW = size;
  const stampH = size * clamp(preset.roundness, 0.1, 1);

  ctx.save();

  // Move to dab center
  ctx.translate(x, y);

  // Apply rotation (brush angle + dab-specific rotation + jitter)
  const totalRotation = (preset.angle + rotation) * (Math.PI / 180);
  if (Math.abs(totalRotation) > 0.001) {
    ctx.rotate(totalRotation);
  }

  // Set composite operation
  if (preset.isEraser) {
    ctx.globalCompositeOperation = "destination-out";
  } else {
    ctx.globalCompositeOperation = preset.blendMode;
  }

  // Set opacity (opacity × flow)
  ctx.globalAlpha = clamp(opacity * flow, 0, 1);

  // For hard brushes with no grain, use a fast path — draw directly
  if (preset.hardness >= 0.9 && !preset.grain && preset.shape === "circle") {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, stampW / 2, stampH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  // For soft brushes, use stamp-based rendering with shared temp canvas
  const stampSize = Math.max(stampW, stampH);
  const stamp = getOrCreateStamp(preset.shape, preset.hardness, stampSize);
  const tempSize = Math.max(2, Math.ceil(stampSize));

  const shared = getSharedTempCanvas(tempSize);
  if (!shared) {
    // Fallback: draw a simple circle if temp canvas fails
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, stampW / 2, stampH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  const { ctx: tempCtx } = shared;

  // Clear the region we'll use
  tempCtx.clearRect(0, 0, tempSize, tempSize);

  // Draw the shape mask
  tempCtx.globalCompositeOperation = "source-over";
  tempCtx.globalAlpha = 1;
  tempCtx.drawImage(
    stamp,
    0, 0, stamp.width, stamp.height,
    0, 0, tempSize, tempSize
  );

  // Colorize: use source-in to apply color through the shape mask
  tempCtx.globalCompositeOperation = "source-in";
  tempCtx.fillStyle = color;
  tempCtx.fillRect(0, 0, tempSize, tempSize);

  // Draw the final colored stamp onto the target canvas
  ctx.drawImage(
    shared.canvas,
    0, 0, tempSize, tempSize,
    -stampW / 2,
    -stampH / 2,
    stampW,
    stampH
  );

  ctx.restore();
}

/**
 * Clear stamp caches (call when switching brushes or on cleanup)
 */
export function clearStampCache(): void {
  stampCache.clear();
}
