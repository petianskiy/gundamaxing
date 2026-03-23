/**
 * Client-side image normalization using Canvas API.
 * Crops to detected card, corrects rotation, enhances contrast.
 */

import type { Point } from "./card-detector";

/**
 * Crop and straighten the card from the source canvas using detected corners.
 * Uses simple affine crop (not full perspective transform — Canvas API limitation).
 * Returns a new canvas with the card image at a standardized size.
 */
export function cropAndNormalize(
  source: HTMLCanvasElement,
  corners: [Point, Point, Point, Point],
  outputWidth = 600,
  outputHeight = 840,
): HTMLCanvasElement {
  const [tl, tr, br, bl] = corners;

  // Determine card dimensions from corners
  const cardW = Math.max(
    Math.hypot(tr.x - tl.x, tr.y - tl.y),
    Math.hypot(br.x - bl.x, br.y - bl.y),
  );
  const cardH = Math.max(
    Math.hypot(bl.x - tl.x, bl.y - tl.y),
    Math.hypot(br.x - tr.x, br.y - tr.y),
  );

  // Determine if the card is landscape (wider than tall) — if so, swap output dimensions
  const isLandscape = cardW > cardH * 1.2;
  const outW = isLandscape ? outputHeight : outputWidth;
  const outH = isLandscape ? outputWidth : outputHeight;

  const out = document.createElement("canvas");
  out.width = outW;
  out.height = outH;
  const ctx = out.getContext("2d")!;

  // Simple crop approach: use drawImage with source rect from bounding box
  const srcX = Math.min(tl.x, bl.x);
  const srcY = Math.min(tl.y, tr.y);
  const srcW = Math.max(tr.x, br.x) - srcX;
  const srcH = Math.max(bl.y, br.y) - srcY;

  ctx.drawImage(source, srcX, srcY, srcW, srcH, 0, 0, outW, outH);

  return out;
}

/**
 * Enhance contrast using histogram stretching.
 */
export function enhanceContrast(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Build luminance histogram
  const histogram = new Uint32Array(256);
  for (let i = 0; i < data.length; i += 4) {
    const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    histogram[lum]++;
  }

  // Find 2nd and 98th percentile
  const totalPixels = (data.length / 4);
  let cumulative = 0;
  let low = 0;
  let high = 255;
  for (let i = 0; i < 256; i++) {
    cumulative += histogram[i];
    if (cumulative >= totalPixels * 0.02 && low === 0) low = i;
    if (cumulative >= totalPixels * 0.98) { high = i; break; }
  }

  // Stretch
  if (high > low) {
    const scale = 255 / (high - low);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, (data[i] - low) * scale));
      data[i + 1] = Math.max(0, Math.min(255, (data[i + 1] - low) * scale));
      data[i + 2] = Math.max(0, Math.min(255, (data[i + 2] - low) * scale));
    }
    ctx.putImageData(imageData, 0, 0);
  }

  return canvas;
}

/**
 * Full processing pipeline: crop → enhance.
 */
export function processCardImage(
  source: HTMLCanvasElement,
  corners: [Point, Point, Point, Point],
): HTMLCanvasElement {
  const cropped = cropAndNormalize(source, corners);
  return enhanceContrast(cropped);
}

/**
 * Convert a canvas to base64 JPEG string.
 */
export function canvasToBase64(canvas: HTMLCanvasElement, quality = 0.92): string {
  return canvas.toDataURL("image/jpeg", quality).replace(/^data:image\/jpeg;base64,/, "");
}

/**
 * Convert a canvas to a Blob.
 */
export function canvasToBlob(canvas: HTMLCanvasElement, quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to create blob"))),
      "image/jpeg",
      quality,
    );
  });
}
