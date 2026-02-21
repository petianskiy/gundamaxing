// ─── Stamp Loader ────────────────────────────────────────────────
// Async PNG stamp/grain loader with LRU cache for brush stamp images.
// Stamps are grayscale alpha masks stored as PNGs, loaded as
// HTMLCanvasElement for fast compositing in the stamp renderer.
//
// Supports local paths (/brushes/stamps/soft-round.png) and remote
// URLs (UploadThing CDN). Uses browser APIs only — no dependencies.

const MAX_CACHE = 32;

interface CacheEntry {
  canvas: HTMLCanvasElement;
  /** Monotonically increasing access counter for LRU eviction */
  lastAccessed: number;
}

let accessCounter = 0;

const stampCache = new Map<string, CacheEntry>();
const pendingLoads = new Map<string, Promise<HTMLCanvasElement>>();

// ─── LRU eviction ─────────────────────────────────────────────────

function evictIfNeeded(): void {
  if (stampCache.size < MAX_CACHE) return;

  let oldestKey: string | null = null;
  let oldestAccess = Infinity;

  for (const [key, entry] of stampCache) {
    if (entry.lastAccessed < oldestAccess) {
      oldestAccess = entry.lastAccessed;
      oldestKey = key;
    }
  }

  if (oldestKey) {
    stampCache.delete(oldestKey);
  }
}

// ─── Image loading helper ─────────────────────────────────────────

function loadImageAsCanvas(url: string): Promise<HTMLCanvasElement> {
  return new Promise<HTMLCanvasElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error(`Failed to get 2d context for stamp: ${url}`));
        return;
      }

      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };

    img.onerror = () => {
      reject(new Error(`Failed to load stamp image: ${url}`));
    };

    img.src = url;
  });
}

// ─── Public API ───────────────────────────────────────────────────

/**
 * Load a PNG stamp image from a URL, draw it to an offscreen canvas,
 * and cache the result. Returns the cached canvas on subsequent calls.
 *
 * Concurrent requests for the same URL are deduplicated so only one
 * network fetch occurs regardless of how many callers request it.
 */
export async function loadStamp(url: string): Promise<HTMLCanvasElement> {
  // Return from cache if available
  const cached = stampCache.get(url);
  if (cached) {
    cached.lastAccessed = ++accessCounter;
    return cached.canvas;
  }

  // Deduplicate concurrent in-flight requests for the same URL
  const pending = pendingLoads.get(url);
  if (pending) return pending;

  const promise = loadImageAsCanvas(url)
    .then((canvas) => {
      evictIfNeeded();
      stampCache.set(url, { canvas, lastAccessed: ++accessCounter });
      pendingLoads.delete(url);
      return canvas;
    })
    .catch((error) => {
      pendingLoads.delete(url);
      throw error;
    });

  pendingLoads.set(url, promise);
  return promise;
}

/**
 * Synchronous cache lookup for use in real-time rendering hot paths.
 * Returns the cached canvas if the stamp has been previously loaded,
 * or null if it hasn't been loaded yet.
 *
 * Call `loadStamp` or `preloadStamps` first to ensure the stamp is
 * available before relying on this in a render loop.
 */
export function getStampSync(url: string): HTMLCanvasElement | null {
  const cached = stampCache.get(url);
  if (cached) {
    cached.lastAccessed = ++accessCounter;
    return cached.canvas;
  }
  return null;
}

/**
 * Batch-preload multiple stamp images in parallel. Typically called
 * when a brush preset is selected so that all its stamps are warm
 * in the cache before the user starts drawing.
 *
 * Uses `Promise.allSettled` so that one failed load does not reject
 * the entire batch — other stamps will still be cached.
 */
export async function preloadStamps(urls: string[]): Promise<void> {
  await Promise.allSettled(urls.map((url) => loadStamp(url)));
}

/**
 * Clear all cached stamps and cancel tracking of pending loads.
 * Useful when switching contexts (e.g., opening a different drawing)
 * or for testing.
 */
export function clearStampCache(): void {
  stampCache.clear();
  pendingLoads.clear();
  accessCounter = 0;
}
