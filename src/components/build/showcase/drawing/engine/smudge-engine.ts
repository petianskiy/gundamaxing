// ─── Smudge Engine ──────────────────────────────────────────────
// Pixel-level blending engine for the smudge tool.
// Samples pixels under the brush, carries them forward, and blends
// them into the destination as the stroke moves.

// ─── Smudge State ───────────────────────────────────────────────

export interface SmudgeState {
  /** Carried pixel buffer */
  carriedPixels: ImageData | null;
  /** Strength of smudge effect 0-1 */
  strength: number;
  /** Whether we have an initial sample */
  hasSample: boolean;
}

export function createSmudgeState(strength: number = 0.5): SmudgeState {
  return {
    carriedPixels: null,
    strength: Math.max(0, Math.min(1, strength)),
    hasSample: false,
  };
}

// ─── Circular Mask Helper ───────────────────────────────────────

/**
 * Apply a circular mask to ImageData in-place.
 * Pixels outside the brush radius have their alpha set to 0.
 */
function applyCircularMask(imageData: ImageData): void {
  const { width, height, data } = imageData;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(centerX, centerY);
  const radiusSq = radius * radius;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x + 0.5 - centerX;
      const dy = y + 0.5 - centerY;
      const distSq = dx * dx + dy * dy;

      if (distSq > radiusSq) {
        const idx = (y * width + x) * 4;
        data[idx + 3] = 0;
      }
    }
  }
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Sample pixels under the brush area from sourceCtx at position (x, y)
 * with the given diameter. Returns ImageData with a circular mask applied.
 */
export function sampleUnderBrush(
  sourceCtx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): ImageData {
  const radius = size / 2;
  const sampleX = Math.round(x - radius);
  const sampleY = Math.round(y - radius);
  const sampleSize = Math.round(size);

  // Clamp to canvas bounds
  const canvas = sourceCtx.canvas;
  const clampedX = Math.max(0, sampleX);
  const clampedY = Math.max(0, sampleY);
  const clampedW = Math.min(sampleSize, canvas.width - clampedX);
  const clampedH = Math.min(sampleSize, canvas.height - clampedY);

  if (clampedW <= 0 || clampedH <= 0) {
    // Return empty ImageData if fully out of bounds
    return new ImageData(Math.max(1, sampleSize), Math.max(1, sampleSize));
  }

  // Create a full-size ImageData padded with transparent pixels
  const result = new ImageData(sampleSize, sampleSize);

  // Get the visible portion from the canvas
  const visible = sourceCtx.getImageData(clampedX, clampedY, clampedW, clampedH);

  // Copy visible portion into the full-size buffer at the correct offset
  const offsetX = clampedX - sampleX;
  const offsetY = clampedY - sampleY;

  for (let row = 0; row < clampedH; row++) {
    for (let col = 0; col < clampedW; col++) {
      const srcIdx = (row * clampedW + col) * 4;
      const dstIdx = ((row + offsetY) * sampleSize + (col + offsetX)) * 4;
      result.data[dstIdx] = visible.data[srcIdx];
      result.data[dstIdx + 1] = visible.data[srcIdx + 1];
      result.data[dstIdx + 2] = visible.data[srcIdx + 2];
      result.data[dstIdx + 3] = visible.data[srcIdx + 3];
    }
  }

  applyCircularMask(result);
  return result;
}

/**
 * Apply a smudge dab: blend carried pixels onto the target canvas
 * at position (x, y) with the given size and opacity.
 *
 * Uses an offscreen canvas to composite the carried pixels with the
 * destination, respecting the circular brush shape.
 */
export function smudgeDab(
  targetCtx: CanvasRenderingContext2D,
  state: SmudgeState,
  x: number,
  y: number,
  size: number,
  opacity: number
): void {
  if (!state.carriedPixels || !state.hasSample) return;

  const radius = size / 2;
  const destX = Math.round(x - radius);
  const destY = Math.round(y - radius);
  const dabSize = Math.round(size);

  if (dabSize <= 0) return;

  // Use an offscreen canvas for compositing the dab
  const offscreen = document.createElement("canvas");
  offscreen.width = dabSize;
  offscreen.height = dabSize;
  const offCtx = offscreen.getContext("2d");
  if (!offCtx) return;

  // Scale carried pixels to the current dab size if dimensions differ
  if (
    state.carriedPixels.width === dabSize &&
    state.carriedPixels.height === dabSize
  ) {
    offCtx.putImageData(state.carriedPixels, 0, 0);
  } else {
    // Put carried pixels onto a temp canvas, then draw scaled
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = state.carriedPixels.width;
    tempCanvas.height = state.carriedPixels.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;
    tempCtx.putImageData(state.carriedPixels, 0, 0);
    offCtx.drawImage(tempCanvas, 0, 0, dabSize, dabSize);
  }

  // Apply circular mask to the offscreen dab
  const dabData = offCtx.getImageData(0, 0, dabSize, dabSize);
  applyCircularMask(dabData);

  // Apply opacity to the dab pixels
  const clampedOpacity = Math.max(0, Math.min(1, opacity));
  const data = dabData.data;
  for (let i = 3; i < data.length; i += 4) {
    data[i] = Math.round(data[i] * clampedOpacity);
  }

  offCtx.putImageData(dabData, 0, 0);

  // Draw the dab onto the target with standard alpha compositing
  targetCtx.drawImage(offscreen, destX, destY);
}

/**
 * Update carried pixels by blending the current sample with the
 * existing carried data. The blendRatio controls how much of the
 * new sample replaces the old carried pixels (0 = keep old, 1 = all new).
 */
export function updateCarriedPixels(
  state: SmudgeState,
  newSample: ImageData,
  blendRatio: number
): void {
  const ratio = Math.max(0, Math.min(1, blendRatio));

  if (!state.carriedPixels || !state.hasSample) {
    // No carried data yet — adopt the new sample directly
    state.carriedPixels = newSample;
    state.hasSample = true;
    return;
  }

  const carried = state.carriedPixels;
  const sample = newSample;

  // If sizes differ, we need to resample one to match the other.
  // Prefer the new sample's size as the canonical size.
  if (carried.width !== sample.width || carried.height !== sample.height) {
    const resized = resizeImageData(carried, sample.width, sample.height);
    blendImageData(resized, sample, ratio);
    state.carriedPixels = resized;
  } else {
    blendImageData(carried, sample, ratio);
    // carried is modified in place, keep the reference
  }
}

// ─── Internal Helpers ───────────────────────────────────────────

/**
 * Blend src into dst in-place: dst = dst * (1 - ratio) + src * ratio
 * Both ImageData objects must have the same dimensions.
 */
function blendImageData(
  dst: ImageData,
  src: ImageData,
  ratio: number
): void {
  const d = dst.data;
  const s = src.data;
  const inv = 1 - ratio;

  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.round(d[i] * inv + s[i] * ratio);
    d[i + 1] = Math.round(d[i + 1] * inv + s[i + 1] * ratio);
    d[i + 2] = Math.round(d[i + 2] * inv + s[i + 2] * ratio);
    d[i + 3] = Math.round(d[i + 3] * inv + s[i + 3] * ratio);
  }
}

/**
 * Resize ImageData to new dimensions using an offscreen canvas.
 */
function resizeImageData(
  source: ImageData,
  newWidth: number,
  newHeight: number
): ImageData {
  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = source.width;
  srcCanvas.height = source.height;
  const srcCtx = srcCanvas.getContext("2d")!;
  srcCtx.putImageData(source, 0, 0);

  const dstCanvas = document.createElement("canvas");
  dstCanvas.width = newWidth;
  dstCanvas.height = newHeight;
  const dstCtx = dstCanvas.getContext("2d")!;
  dstCtx.drawImage(srcCanvas, 0, 0, newWidth, newHeight);

  return dstCtx.getImageData(0, 0, newWidth, newHeight);
}
