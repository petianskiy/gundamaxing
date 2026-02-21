// ─── Stamp Renderer ──────────────────────────────────────────────
// Renders a single brush dab (stamp) onto a canvas context.
// Shape mask × grain texture composited at calculated params.

import type { BrushPreset, DabParams } from "./brush-types";
import { clamp } from "./brush-types";

// ─── Stamp cache ─────────────────────────────────────────────────
// Pre-render shape masks at discrete sizes to avoid per-dab computation.

const stampCache = new Map<string, ImageBitmap | HTMLCanvasElement>();
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
    // Hardness controls where the gradient starts (higher = more solid center)
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
    // Soft square: feathered edges
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

// ─── Grain texture application ───────────────────────────────────

const grainImageCache = new Map<string, HTMLCanvasElement>();

function getGrainImage(grainDataUrl: string): HTMLCanvasElement | null {
  if (grainImageCache.has(grainDataUrl)) {
    return grainImageCache.get(grainDataUrl)!;
  }

  // Create image and draw to canvas (synchronous if already loaded)
  const img = new Image();
  img.src = grainDataUrl;
  if (!img.complete) {
    // Asynchronously load — first few dabs may skip grain
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      grainImageCache.set(grainDataUrl, canvas);
    };
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  grainImageCache.set(grainDataUrl, canvas);
  return canvas;
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

  // Get or create the shape mask
  const stamp = getOrCreateStamp(preset.shape, preset.hardness, Math.max(stampW, stampH));

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

  // Create a temporary canvas for the colored stamp
  const tempCanvas = document.createElement("canvas");
  const tempSize = Math.max(2, Math.ceil(Math.max(stampW, stampH)));
  tempCanvas.width = tempSize;
  tempCanvas.height = tempSize;
  const tempCtx = tempCanvas.getContext("2d")!;

  // Draw the shape mask
  tempCtx.drawImage(
    stamp,
    0, 0, stamp.width, stamp.height,
    0, 0, tempSize, tempSize
  );

  // Colorize: use source-in to apply color through the shape mask
  tempCtx.globalCompositeOperation = "source-in";
  tempCtx.fillStyle = color;
  tempCtx.fillRect(0, 0, tempSize, tempSize);

  // Apply grain texture if present
  if (preset.grain && preset.grainIntensity > 0) {
    const grainCanvas = getGrainImage(preset.grain);
    if (grainCanvas) {
      tempCtx.globalCompositeOperation = preset.grainBlendMode;
      tempCtx.globalAlpha = preset.grainIntensity;

      // Tile grain across stamp
      const scale = preset.grainScale;
      const gw = grainCanvas.width * scale;
      const gh = grainCanvas.height * scale;

      let grainOffsetX = 0;
      let grainOffsetY = 0;
      if (preset.grainMovement === "rolling") {
        grainOffsetX = x % gw;
        grainOffsetY = y % gh;
      } else if (preset.grainMovement === "random") {
        grainOffsetX = Math.random() * gw;
        grainOffsetY = Math.random() * gh;
      }

      for (let gx = -gw + grainOffsetX; gx < tempSize; gx += gw) {
        for (let gy = -gh + grainOffsetY; gy < tempSize; gy += gh) {
          tempCtx.drawImage(grainCanvas, gx, gy, gw, gh);
        }
      }
      tempCtx.globalAlpha = 1;
    }
  }

  // Draw the final colored stamp onto the target canvas
  ctx.drawImage(
    tempCanvas,
    -tempSize / 2,
    -tempSize / 2,
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
  grainImageCache.clear();
}
