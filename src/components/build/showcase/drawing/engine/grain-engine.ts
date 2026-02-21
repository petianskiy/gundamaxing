// ─── Grain Engine ────────────────────────────────────────────────
// Grain/texture overlay system for the brush engine.
// Loads tileable grain PNGs, caches them with LRU eviction, and
// composites grain textures over individual dabs using Canvas2D.

import type { BrushPreset } from "./brush-types";

// ─── LRU Cache ──────────────────────────────────────────────────

const MAX_CACHE = 16;

interface GrainCacheEntry {
  canvas: HTMLCanvasElement;
  lastUsed: number;
}

const grainCache = new Map<string, GrainCacheEntry>();
const pendingLoads = new Map<string, Promise<HTMLCanvasElement>>();
let _grainAccessCounter = 0;

/** Procedural noise key used for the fallback grain */
const PROCEDURAL_KEY = "__procedural_noise_128__";

function evictIfNeeded(): void {
  if (grainCache.size < MAX_CACHE) return;

  let oldest: string | null = null;
  let oldestTime = Infinity;
  for (const [key, entry] of grainCache) {
    if (entry.lastUsed < oldestTime) {
      oldestTime = entry.lastUsed;
      oldest = key;
    }
  }
  if (oldest) grainCache.delete(oldest);
}

// ─── Procedural fallback noise ──────────────────────────────────

function createProceduralNoise(): HTMLCanvasElement {
  const cached = grainCache.get(PROCEDURAL_KEY);
  if (cached) {
    cached.lastUsed = ++_grainAccessCounter;
    return cached.canvas;
  }

  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const v = Math.random() * 255;
    data[i] = v;       // R
    data[i + 1] = v;   // G
    data[i + 2] = v;   // B
    data[i + 3] = 255; // A — full opacity, grain intensity is handled at composite time
  }

  ctx.putImageData(imageData, 0, 0);

  evictIfNeeded();
  grainCache.set(PROCEDURAL_KEY, { canvas, lastUsed: ++_grainAccessCounter });
  return canvas;
}

// ─── Async loader ───────────────────────────────────────────────

/**
 * Load a tileable grain PNG from a URL and cache the result as an
 * HTMLCanvasElement for fast pixel access and tiling.
 */
export async function loadGrainTexture(
  url: string
): Promise<HTMLCanvasElement> {
  const cached = grainCache.get(url);
  if (cached) {
    cached.lastUsed = ++_grainAccessCounter;
    return cached.canvas;
  }

  // Deduplicate in-flight requests for the same URL
  const pending = pendingLoads.get(url);
  if (pending) return pending;

  const promise = new Promise<HTMLCanvasElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      evictIfNeeded();
      grainCache.set(url, { canvas, lastUsed: ++_grainAccessCounter });
      pendingLoads.delete(url);
      resolve(canvas);
    };
    img.onerror = () => {
      pendingLoads.delete(url);
      reject(new Error(`Failed to load grain texture: ${url}`));
    };
    img.src = url;
  });

  pendingLoads.set(url, promise);
  return promise;
}

// ─── Sync cache lookup ──────────────────────────────────────────

/**
 * Synchronous cache lookup for a grain texture.
 * Returns null if the texture has not been loaded yet.
 */
export function getGrainSync(url: string): HTMLCanvasElement | null {
  const cached = grainCache.get(url);
  if (cached) {
    cached.lastUsed = ++_grainAccessCounter;
    return cached.canvas;
  }
  return null;
}

// ─── Shared temp canvas ─────────────────────────────────────────
// Reused across applyGrain calls to avoid per-dab allocation.

let _grainTempCanvas: HTMLCanvasElement | null = null;
let _grainTempCtx: CanvasRenderingContext2D | null = null;

function getGrainTempCanvas(
  w: number,
  h: number
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (!_grainTempCanvas || !_grainTempCtx) {
    _grainTempCanvas = document.createElement("canvas");
    // Pre-allocate at 512×512 to avoid frequent GPU memory reallocs
    const initW = Math.max(w, 512);
    const initH = Math.max(h, 512);
    _grainTempCanvas.width = initW;
    _grainTempCanvas.height = initH;
    _grainTempCtx = _grainTempCanvas.getContext("2d");
    if (!_grainTempCtx) return null;
  }

  if (_grainTempCanvas.width < w || _grainTempCanvas.height < h) {
    // Doubling strategy to reduce future resizes
    _grainTempCanvas.width = Math.max(w, _grainTempCanvas.width * 2);
    _grainTempCanvas.height = Math.max(h, _grainTempCanvas.height * 2);
  }

  return { canvas: _grainTempCanvas, ctx: _grainTempCtx };
}

// ─── Core grain application ─────────────────────────────────────

/**
 * Apply a grain texture overlay onto a dab canvas.
 *
 * @param dabCanvas   - The canvas containing the rendered dab to grain
 * @param dabSize     - The diameter of the dab in pixels
 * @param preset      - The brush preset (grain settings are read from here)
 * @param canvasX     - X position of the dab on the main canvas (for static grain)
 * @param canvasY     - Y position of the dab on the main canvas (for static grain)
 * @param strokeOffset - Cumulative distance along the stroke (for rolling grain)
 */
export function applyGrain(
  dabCanvas: HTMLCanvasElement,
  dabSize: number,
  preset: BrushPreset,
  canvasX: number,
  canvasY: number,
  strokeOffset: number
): void {
  if (preset.grainIntensity <= 0) return;

  const w = dabCanvas.width;
  const h = dabCanvas.height;
  if (w === 0 || h === 0) return;

  // Resolve the grain texture: loaded image, sync cache, or procedural fallback
  let grainSource: HTMLCanvasElement | null = null;

  if (preset.grainUrl) {
    grainSource = getGrainSync(preset.grainUrl);
    if (!grainSource) {
      // Texture not loaded yet — kick off async load for future dabs
      loadGrainTexture(preset.grainUrl).catch(() => {
        // Silently ignore — we fall back to procedural below
      });
    }
  }

  // Fallback to procedural noise when there is no loaded grain texture
  if (!grainSource) {
    grainSource = createProceduralNoise();
  }

  const grainW = grainSource.width;
  const grainH = grainSource.height;

  // ─── Compute tile offset based on movement mode ───────────────
  let offsetX = 0;
  let offsetY = 0;

  const scale = Math.max(0.1, Math.min(10, preset.grainScale));

  switch (preset.grainMovement) {
    case "static": {
      // Grain is fixed to canvas coordinates — the dab's position
      // determines which part of the infinite tiled grain is visible.
      offsetX = canvasX / scale;
      offsetY = canvasY / scale;
      break;
    }
    case "rolling": {
      // Grain scrolls along with the stroke distance
      offsetX = strokeOffset / scale;
      offsetY = strokeOffset / scale;
      break;
    }
    case "random": {
      // Fully random offset per dab
      offsetX = Math.random() * grainW * 100;
      offsetY = Math.random() * grainH * 100;
      break;
    }
  }

  const scaledGrainW = grainW * scale;
  const scaledGrainH = grainH * scale;

  // Map our blend mode names to Canvas2D composite operations
  const blendOp = mapGrainBlendMode(preset.grainBlendMode);

  // ─── Fast path: dab fits in a single grain tile ───────────────
  // Skip temp canvas entirely and composite grain directly onto dab
  if (w <= scaledGrainW && h <= scaledGrainH) {
    const dabCtx = dabCanvas.getContext("2d");
    if (!dabCtx) return;

    // Normalize offset into one tile period
    const normOffsetX =
      ((offsetX % scaledGrainW) + scaledGrainW) % scaledGrainW;
    const normOffsetY =
      ((offsetY % scaledGrainH) + scaledGrainH) % scaledGrainH;

    dabCtx.save();
    dabCtx.globalCompositeOperation = blendOp;
    dabCtx.globalAlpha = preset.grainIntensity;

    // Draw up to 4 tiles to cover the dab area with offset
    const startX = -normOffsetX;
    const startY = -normOffsetY;
    for (let ty = startY; ty < h; ty += scaledGrainH) {
      for (let tx = startX; tx < w; tx += scaledGrainW) {
        dabCtx.drawImage(grainSource, tx, ty, scaledGrainW, scaledGrainH);
      }
    }

    dabCtx.restore();
    return;
  }

  // ─── Draw tiled grain into temp canvas ────────────────────────
  const shared = getGrainTempCanvas(w, h);
  if (!shared) return;

  const { ctx: tempCtx } = shared;
  tempCtx.clearRect(0, 0, w, h);
  tempCtx.save();
  tempCtx.globalCompositeOperation = "source-over";
  tempCtx.globalAlpha = 1;

  // Normalize offset into one tile period (always positive)
  const normOffsetX =
    ((offsetX % scaledGrainW) + scaledGrainW) % scaledGrainW;
  const normOffsetY =
    ((offsetY % scaledGrainH) + scaledGrainH) % scaledGrainH;

  // Start position for the first tile (may be negative)
  const startX = -normOffsetX;
  const startY = -normOffsetY;

  for (let ty = startY; ty < h; ty += scaledGrainH) {
    for (let tx = startX; tx < w; tx += scaledGrainW) {
      tempCtx.drawImage(grainSource, tx, ty, scaledGrainW, scaledGrainH);
    }
  }

  tempCtx.restore();

  // ─── Composite grain onto the dab canvas ──────────────────────
  const dabCtx = dabCanvas.getContext("2d");
  if (!dabCtx) return;

  dabCtx.save();
  dabCtx.globalCompositeOperation = blendOp;
  dabCtx.globalAlpha = preset.grainIntensity;

  dabCtx.drawImage(shared.canvas, 0, 0, w, h, 0, 0, w, h);

  dabCtx.restore();
}

/**
 * Map the preset's grainBlendMode string to a valid
 * CanvasRenderingContext2D.globalCompositeOperation value.
 */
function mapGrainBlendMode(
  mode: BrushPreset["grainBlendMode"]
): GlobalCompositeOperation {
  switch (mode) {
    case "multiply":
      return "multiply";
    case "screen":
      return "screen";
    case "overlay":
      return "overlay";
    default:
      return "multiply";
  }
}

// ─── Cache management ───────────────────────────────────────────

/** Clear all cached grain textures (including procedural noise) */
export function clearGrainCache(): void {
  grainCache.clear();
  pendingLoads.clear();
  _grainTempCanvas = null;
  _grainTempCtx = null;
}

/** Preload multiple grain texture URLs in parallel */
export async function preloadGrains(urls: string[]): Promise<void> {
  await Promise.allSettled(urls.map((url) => loadGrainTexture(url)));
}
