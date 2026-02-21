// ─── Stamp Renderer v2 ─────────────────────────────────────────
// Renders brush dabs using either PNG stamp images or procedural shapes.
// Integrates with stamp-loader for image-based stamps and grain-engine for textures.

import type { BrushPreset, DabParams } from "./brush-types";
import { clamp } from "./brush-types";
import { getStampSync, loadStamp, preloadStamps } from "./stamp-loader";
import { getGrainSync, applyGrain, loadGrainTexture } from "./grain-engine";

// ─── Procedural stamp cache ────────────────────────────────────
// Fallback for presets without stampUrl (procedural circle/square)

const proceduralCache = new Map<string, HTMLCanvasElement>();
const MAX_PROCEDURAL_CACHE = 64;

function getProceduralKey(shape: string, hardness: number, size: number): string {
  const roundedSize = Math.round(size / 2) * 2;
  const roundedHardness = Math.round(hardness * 10) / 10;
  return `${shape}_${roundedHardness}_${roundedSize}`;
}

function evictProcedural(): void {
  if (proceduralCache.size > MAX_PROCEDURAL_CACHE) {
    const firstKey = proceduralCache.keys().next().value;
    if (firstKey) proceduralCache.delete(firstKey);
  }
}

function createCircleStamp(size: number, hardness: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const diameter = Math.max(2, Math.round(size));
  canvas.width = diameter;
  canvas.height = diameter;
  const ctx = canvas.getContext("2d")!;
  const cx = diameter / 2;
  const radius = diameter / 2;

  if (hardness >= 0.95) {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(cx, cx, radius, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const innerRadius = radius * hardness;
    const gradient = ctx.createRadialGradient(cx, cx, innerRadius, cx, cx, radius);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cx, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

function createSquareStamp(size: number, hardness: number): HTMLCanvasElement {
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

function getProceduralStamp(
  shape: BrushPreset["shape"],
  hardness: number,
  size: number
): HTMLCanvasElement {
  const key = getProceduralKey(shape, hardness, size);
  let stamp = proceduralCache.get(key);
  if (stamp) return stamp;

  evictProcedural();
  const newStamp = shape === "square"
    ? createSquareStamp(size, hardness)
    : createCircleStamp(size, hardness);
  proceduralCache.set(key, newStamp);
  return newStamp;
}

// ─── Shared temp canvas for colorizing ─────────────────────────

let _tempCanvas: HTMLCanvasElement | null = null;
let _tempCtx: CanvasRenderingContext2D | null = null;

function getTempCanvas(size: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  const s = Math.max(2, Math.ceil(size));

  if (!_tempCanvas || !_tempCtx) {
    _tempCanvas = document.createElement("canvas");
    _tempCtx = _tempCanvas.getContext("2d");
    if (!_tempCtx) return null;
  }

  if (_tempCanvas.width < s || _tempCanvas.height < s) {
    const newSize = Math.min(2048, Math.max(s, 64));
    _tempCanvas.width = newSize;
    _tempCanvas.height = newSize;
  }

  return { canvas: _tempCanvas, ctx: _tempCtx };
}

// ─── Stamp resolver ────────────────────────────────────────────
// Returns the appropriate stamp canvas for a preset + size.
// Uses PNG stamp if available, otherwise falls back to procedural.

function resolveStamp(preset: BrushPreset, size: number): HTMLCanvasElement {
  // Try PNG stamp from stamp-loader cache
  if (preset.stampUrl) {
    const pngStamp = getStampSync(preset.stampUrl);
    if (pngStamp) return pngStamp;
  }

  // Fallback to procedural generation
  return getProceduralStamp(preset.shape, preset.hardness, size);
}

// ─── Main rendering function ───────────────────────────────────

/**
 * Render a single dab onto the target canvas context.
 * Supports PNG stamp images, grain textures, and all brush dynamics.
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
  const stampSize = Math.max(stampW, stampH);

  ctx.save();

  // Move to dab center
  ctx.translate(x, y);

  // Apply rotation (brush angle + per-dab rotation)
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

  // Set opacity (opacity * flow)
  ctx.globalAlpha = clamp(opacity * flow, 0, 1);

  // Fast path: hard procedural circle with no grain, no PNG stamp
  if (
    !preset.stampUrl &&
    preset.hardness >= 0.9 &&
    preset.grainIntensity <= 0 &&
    preset.shape === "circle"
  ) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, stampW / 2, stampH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  // Get the stamp (PNG or procedural)
  const stamp = resolveStamp(preset, stampSize);
  const tempSize = Math.max(2, Math.ceil(stampSize));

  const shared = getTempCanvas(tempSize);
  if (!shared) {
    // Fallback: simple ellipse
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, stampW / 2, stampH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  const { canvas: tempCanvas, ctx: tempCtx } = shared;

  // Clear the temp region
  tempCtx.clearRect(0, 0, tempSize, tempSize);

  // Draw the stamp mask (either PNG image or procedural shape)
  tempCtx.globalCompositeOperation = "source-over";
  tempCtx.globalAlpha = 1;
  tempCtx.drawImage(
    stamp,
    0, 0, stamp.width, stamp.height,
    0, 0, tempSize, tempSize
  );

  // Apply grain texture if intensity > 0
  if (preset.grainIntensity > 0) {
    applyGrain(
      tempCanvas,
      tempSize,
      preset,
      x, // canvas X for static grain alignment
      y, // canvas Y for static grain alignment
      dab.strokePosition // stroke offset for rolling grain
    );
  }

  // Colorize: use source-in to apply color through the shape mask
  tempCtx.globalCompositeOperation = "source-in";
  tempCtx.fillStyle = color;
  tempCtx.fillRect(0, 0, tempSize, tempSize);

  // Draw the final colored+grained stamp onto target canvas
  ctx.drawImage(
    tempCanvas,
    0, 0, tempSize, tempSize,
    -stampW / 2,
    -stampH / 2,
    stampW,
    stampH
  );

  ctx.restore();
}

// ─── Preloading ────────────────────────────────────────────────

/**
 * Preload stamp and grain images for a preset.
 * Call when a brush is selected to avoid latency on first stroke.
 */
export async function preloadPresetAssets(preset: BrushPreset): Promise<void> {
  const urls: string[] = [];

  if (preset.stampUrl) {
    urls.push(preset.stampUrl);
    // Also trigger stamp-loader preload
    await loadStamp(preset.stampUrl).catch(() => {});
  }

  if (preset.grainUrl) {
    await loadGrainTexture(preset.grainUrl).catch(() => {});
  }
}

/**
 * Preload stamps for multiple presets (e.g. all presets in active category).
 */
export async function preloadCategoryAssets(presets: BrushPreset[]): Promise<void> {
  const stampUrls = presets
    .map((p) => p.stampUrl)
    .filter((url): url is string => !!url);

  const grainUrls = presets
    .map((p) => p.grainUrl)
    .filter((url): url is string => !!url);

  await Promise.all([
    preloadStamps([...new Set(stampUrls)]),
    ...([...new Set(grainUrls)].map((url) => loadGrainTexture(url).catch(() => {}))),
  ]);
}

// ─── Cleanup ───────────────────────────────────────────────────

/**
 * Clear all caches (procedural stamps + temp canvas)
 */
export function clearStampCache(): void {
  proceduralCache.clear();
}
