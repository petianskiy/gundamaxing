// ─── Render Modes ─────────────────────────────────────────────────
// Compositing strategies for different brush render modes.
// Normal: per-dab source-over (default).
// Buildup: dabs accumulate on an offscreen buffer, flushed at stroke end.
// Wet: samples underlying color and blends with brush color.

import type { RenderMode } from "./brush-types";

// ─── Stroke Buffer (buildup mode) ────────────────────────────────

export class StrokeBuffer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  /** Create an offscreen canvas matching the target dimensions. */
  init(width: number, height: number): void {
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext("2d");
  }

  /** Clear the buffer contents without destroying the canvas. */
  clear(): void {
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /** Get the buffer context for rendering dabs into. */
  getCtx(): CanvasRenderingContext2D | null {
    return this.ctx;
  }

  /** Get the buffer canvas for flushing to the target. */
  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  /** Release resources. */
  dispose(): void {
    this.ctx = null;
    this.canvas = null;
  }
}

// ─── Normal mode: per-dab compositing ────────────────────────────

/**
 * Renders a single dab onto the target context using source-over compositing.
 * The dabCanvas is drawn centered at (x, y) with the given opacity and blendMode.
 */
export function renderDabNormal(
  targetCtx: CanvasRenderingContext2D,
  dabCanvas: HTMLCanvasElement,
  x: number,
  y: number,
  opacity: number,
  blendMode: GlobalCompositeOperation
): void {
  const prevAlpha = targetCtx.globalAlpha;
  const prevComposite = targetCtx.globalCompositeOperation;

  targetCtx.globalAlpha = opacity;
  targetCtx.globalCompositeOperation = blendMode;

  targetCtx.drawImage(
    dabCanvas,
    x - dabCanvas.width / 2,
    y - dabCanvas.height / 2
  );

  targetCtx.globalAlpha = prevAlpha;
  targetCtx.globalCompositeOperation = prevComposite;
}

// ─── Buildup mode: accumulate dabs on stroke buffer ──────────────

/**
 * Renders a dab into the stroke buffer with multiply compositing.
 * Dabs accumulate on the buffer during the stroke and are flushed at the end.
 */
export function renderDabBuildup(
  bufferCtx: CanvasRenderingContext2D,
  dabCanvas: HTMLCanvasElement,
  x: number,
  y: number,
  opacity: number
): void {
  const prevAlpha = bufferCtx.globalAlpha;
  const prevComposite = bufferCtx.globalCompositeOperation;

  bufferCtx.globalAlpha = opacity;
  bufferCtx.globalCompositeOperation = "multiply";

  bufferCtx.drawImage(
    dabCanvas,
    x - dabCanvas.width / 2,
    y - dabCanvas.height / 2
  );

  bufferCtx.globalAlpha = prevAlpha;
  bufferCtx.globalCompositeOperation = prevComposite;
}

/**
 * Composites the entire stroke buffer onto the target context at stroke end.
 * The buffer contains all accumulated dabs from the stroke.
 */
export function flushStrokeBuffer(
  targetCtx: CanvasRenderingContext2D,
  buffer: StrokeBuffer,
  blendMode: GlobalCompositeOperation,
  opacity: number
): void {
  const bufferCanvas = buffer.getCanvas();
  if (!bufferCanvas) return;

  const prevAlpha = targetCtx.globalAlpha;
  const prevComposite = targetCtx.globalCompositeOperation;

  targetCtx.globalAlpha = opacity;
  targetCtx.globalCompositeOperation = blendMode;

  targetCtx.drawImage(bufferCanvas, 0, 0);

  targetCtx.globalAlpha = prevAlpha;
  targetCtx.globalCompositeOperation = prevComposite;
}

// ─── Wet mode: color sampling and blending ───────────────────────

/**
 * Samples the average color under a circular region on the source context.
 * Used by wet mode to pick up underlying paint for blending.
 */
export function sampleColor(
  sourceCtx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): { r: number; g: number; b: number; a: number } {
  const radius = Math.max(1, Math.floor(size / 2));
  const diameter = radius * 2;

  // Clamp sample region to canvas bounds
  const sx = Math.max(0, Math.floor(x - radius));
  const sy = Math.max(0, Math.floor(y - radius));
  const canvasWidth = sourceCtx.canvas.width;
  const canvasHeight = sourceCtx.canvas.height;
  const sw = Math.min(diameter, canvasWidth - sx);
  const sh = Math.min(diameter, canvasHeight - sy);

  if (sw <= 0 || sh <= 0) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  const imageData = sourceCtx.getImageData(sx, sy, sw, sh);
  const data = imageData.data;

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let totalA = 0;
  let count = 0;

  const centerX = x - sx;
  const centerY = y - sy;

  for (let py = 0; py < sh; py++) {
    for (let px = 0; px < sw; px++) {
      // Only include pixels within the circular region
      const dx = px - centerX;
      const dy = py - centerY;
      if (dx * dx + dy * dy <= radius * radius) {
        const idx = (py * sw + px) * 4;
        totalR += data[idx];
        totalG += data[idx + 1];
        totalB += data[idx + 2];
        totalA += data[idx + 3];
        count++;
      }
    }
  }

  if (count === 0) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  return {
    r: Math.round(totalR / count),
    g: Math.round(totalG / count),
    b: Math.round(totalB / count),
    a: Math.round(totalA / count),
  };
}

/**
 * Blends brush color with sampled underlying color.
 * mixRatio 0 = all brush color, 1 = all sampled color.
 * Returns a hex color string (e.g. "#ff8040").
 */
export function blendColors(
  brushColor: string,
  sampledColor: { r: number; g: number; b: number; a: number },
  mixRatio: number
): string {
  const brush = parseHexColor(brushColor);
  const t = Math.max(0, Math.min(1, mixRatio));

  const r = Math.round(brush.r + (sampledColor.r - brush.r) * t);
  const g = Math.round(brush.g + (sampledColor.g - brush.g) * t);
  const b = Math.round(brush.b + (sampledColor.b - brush.b) * t);

  return (
    "#" +
    r.toString(16).padStart(2, "0") +
    g.toString(16).padStart(2, "0") +
    b.toString(16).padStart(2, "0")
  );
}

// ─── Internal helpers ────────────────────────────────────────────

/**
 * Parses a hex color string (3, 4, 6, or 8 digit) into RGB components.
 */
function parseHexColor(hex: string): { r: number; g: number; b: number } {
  let h = hex.replace("#", "");

  // Expand shorthand (#rgb or #rgba → #rrggbb or #rrggbbaa)
  if (h.length === 3 || h.length === 4) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }

  return {
    r: parseInt(h.slice(0, 2), 16) || 0,
    g: parseInt(h.slice(2, 4), 16) || 0,
    b: parseInt(h.slice(4, 6), 16) || 0,
  };
}
