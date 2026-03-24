/**
 * Server-side image preprocessing using the `canvas` npm package.
 * Crops card zones, applies enhancement, generates OCR-optimized variants.
 */

import { createCanvas, loadImage, type Canvas, type CanvasRenderingContext2D } from "canvas";
import type { CardZone } from "./card-templates";

/**
 * Load a base64 image into a canvas.
 */
export async function loadBase64Image(base64: string): Promise<{ canvas: Canvas; width: number; height: number }> {
  const buffer = Buffer.from(base64, "base64");
  const img = await loadImage(buffer);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return { canvas, width: img.width, height: img.height };
}

/**
 * Crop a zone from the card image and optionally scale up.
 */
export function cropZone(
  source: Canvas,
  zone: CardZone,
  imgW: number,
  imgH: number,
): Canvas {
  const sx = Math.round(zone.x * imgW);
  const sy = Math.round(zone.y * imgH);
  const sw = Math.round(zone.w * imgW);
  const sh = Math.round(zone.h * imgH);
  const scale = zone.scale ?? 1;

  const outW = Math.round(sw * scale);
  const outH = Math.round(sh * scale);

  const out = createCanvas(outW, outH);
  const ctx = out.getContext("2d");

  // Use higher quality interpolation
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, outW, outH);

  return out;
}

/**
 * Crop a zone and rotate 90° clockwise (for vertical text like card type).
 */
export function cropAndRotate90(
  source: Canvas,
  zone: CardZone,
  imgW: number,
  imgH: number,
): Canvas {
  const cropped = cropZone(source, { ...zone, scale: 1 }, imgW, imgH);
  const scale = zone.scale ?? 2;

  // After 90° CW rotation: new width = old height, new height = old width
  const outW = Math.round(cropped.height * scale);
  const outH = Math.round(cropped.width * scale);
  const out = createCanvas(outW, outH);
  const ctx = out.getContext("2d");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Rotate 90° CW
  ctx.translate(outW, 0);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(cropped, 0, 0, cropped.width, cropped.height, 0, 0, outH, outW);

  return out;
}

/**
 * Apply contrast enhancement to a canvas.
 */
export function enhanceContrast(source: Canvas): Canvas {
  const out = createCanvas(source.width, source.height);
  const ctx = out.getContext("2d");
  ctx.drawImage(source, 0, 0);

  const imageData = ctx.getImageData(0, 0, out.width, out.height);
  const data = imageData.data;

  // Histogram stretch
  let min = 255, max = 0;
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (lum < min) min = lum;
    if (lum > max) max = lum;
  }

  if (max > min) {
    const range = max - min;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, ((data[i] - min) / range) * 255));
      data[i + 1] = Math.max(0, Math.min(255, ((data[i + 1] - min) / range) * 255));
      data[i + 2] = Math.max(0, Math.min(255, ((data[i + 2] - min) / range) * 255));
    }
    ctx.putImageData(imageData, 0, 0);
  }

  return out;
}

/**
 * Convert canvas to base64 JPEG string.
 */
export function canvasToBase64(canvas: Canvas, quality = 0.92): string {
  return canvas.toBuffer("image/jpeg", { quality }).toString("base64");
}

/**
 * Crop the card from the full frame using inferred bounds.
 * Returns a normalized card image (600×840 for 3:4 card aspect).
 */
export async function cropCardFromFrame(
  base64: string,
  bounds: { x: number; y: number; width: number; height: number },
): Promise<{ canvas: Canvas; base64: string; width: number; height: number }> {
  const { canvas: source, width: imgW, height: imgH } = await loadBase64Image(base64);

  // Normalize to 600×840 (3:4 card aspect)
  const targetW = 600;
  const targetH = 840;
  const out = createCanvas(targetW, targetH);
  const ctx = out.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    source,
    bounds.x, bounds.y, bounds.width, bounds.height,
    0, 0, targetW, targetH,
  );

  return {
    canvas: out,
    base64: canvasToBase64(out),
    width: targetW,
    height: targetH,
  };
}
